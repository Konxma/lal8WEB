const {test} = require('node:test');
const assert = require('node:assert/strict');
const {spawn, spawnSync} = require('node:child_process');
const {once} = require('node:events');
const fs = require('node:fs');
const {Client} = require('pg');
const {randomUUID} = require('node:crypto');

test('Практична 8: PostgreSQL, міграції, зв’язки, транзакції', {timeout:120000}, async () => {
 const database=process.env.TEST_DB_NAME;
 assert.ok(database && /(_test|_verification)$/.test(database),'TEST_DB_NAME must end with _test or _verification. All its lab8 tables will be reset.');
 const env={...process.env,DB_NAME:database,PORT:process.env.TEST_PORT||'3109',LAB_ALLOW_FAILURE_DEMO:'true',DB_LOGGING:'true'};
 const db=new Client({host:env.DB_HOST||'127.0.0.1',port:Number(env.DB_PORT||5432),user:env.DB_USER||'nest_user',password:env.DB_PASSWORD||'nest_password',database});
 let server,log='',migrationLog='';const checks=[],transcript=[],observations=[];
 const base=`http://127.0.0.1:${env.PORT}`;
 async function check(name,fn) {await fn(); checks.push({name,result:'PASS'});}
 function cli(command) {
  const r=spawnSync(process.execPath,['node_modules/typeorm/cli.js','-d','dist/database/data-source.js',command],{env,encoding:'utf8',windowsHide:true});
  migrationLog+=`\n$ typeorm ${command}\n${r.stdout||''}${r.stderr||''}`;
  assert.equal(r.status,0,migrationLog);
 }
 async function start(allowFailure=true) {
  server=spawn(process.execPath,['dist/main.js'],{env:{...env,LAB_ALLOW_FAILURE_DEMO:String(allowFailure)},windowsHide:true});
  server.stdout.on('data',x=>log+=x);server.stderr.on('data',x=>log+=x);
  for(let i=0;i<150;i++) {if(server.exitCode!==null) throw Error(log);try {if((await fetch(base)).ok)return;}catch{}await new Promise(r=>setTimeout(r,100));}
  throw Error(log);
 }
 async function stop(){if(server && server.exitCode===null){const ended=once(server,'exit');server.kill();await ended;}}
 async function req(method,path,body,status=200) {
  const response=await fetch(base+path,{method,headers:{'Content-Type':'application/json'},body:body===undefined?undefined:JSON.stringify(body)});
  const raw=await response.text();let result;try{result=JSON.parse(raw);}catch{result=raw;}
  transcript.push({method,path,request:body,status:response.status,response:result,headers:{responseTime:response.headers.get('x-response-time')}});
  assert.equal(response.status,status,JSON.stringify(result));return result;
 }
 async function counts(){return (await db.query(`SELECT (SELECT count(*)::int FROM clothes) clothes,(SELECT count(*)::int FROM materials) materials,(SELECT count(*)::int FROM care_instructions) care,(SELECT count(*)::int FROM clothing_materials) links`)).rows[0];}
 const marker=`QA-${Date.now()}`;
 try {
  await db.connect();
  // Reset only a database the caller explicitly designated for destructive testing.
  const exists=(await db.query("SELECT to_regclass('public.migrations') value")).rows[0].value;
  if(exists) {const n=Number((await db.query('SELECT count(*) FROM migrations')).rows[0].count);for(let i=0;i<n;i++)cli('migration:revert');}
  await check('Усі 3 міграції застосовуються до порожньої схеми',async()=>{cli('migration:run');assert.equal(Number((await db.query('SELECT count(*) FROM migrations')).rows[0].count),3);});
  await check('Відкат 1:1, потім M:N та повторне виконання',async()=>{
   cli('migration:revert');assert.equal((await db.query("SELECT to_regclass('care_instructions') value")).rows[0].value,null);
   cli('migration:revert');assert.equal((await db.query("SELECT to_regclass('materials') value")).rows[0].value,null);
   assert.ok((await db.query("SELECT to_regclass('clothes') value")).rows[0].value);
   cli('migration:run');assert.equal(Number((await db.query('SELECT count(*) FROM migrations')).rows[0].count),3);
  });
  await check('Схема не відрізняється від метаданих TypeORM; synchronize=false',async()=>{
   const source=require('../dist/database/data-source').default;source.setOptions({database});assert.equal(source.options.synchronize,false);
   await source.initialize();try{assert.equal((await source.driver.createSchemaBuilder().log()).upQueries.length,0);}finally{await source.destroy();}
  });
  await start();
  const collection=await req('POST','/collections',{name:marker+' Осінь',season:'Осінь 2026'},201);
  const dto={title:'  Футболка '+marker+'  ',price:799.99,size:'M',material:'Бавовна / льон',color:'Білий',collectionId:collection.id,materials:[{name:marker+' Бавовна'},{name:marker+' Льон'}],care:{washTemperature:30,ironAllowed:true,instructions:'Делікатне прання'}};
  let item;
  await check('Створення 1:M, каскадне збереження M:N та деталей 1:1',async()=>{
   item=await req('POST','/clothes/transactional',dto,201);
   assert.equal(item.title,dto.title.trim());assert.equal(item.collection.id,collection.id);assert.equal(item.materials.length,2);assert.equal(item.care.washTemperature,30);assert.equal(item.price,'799.99');
  });
  await check('findOne з relations та повний агрегат через QueryBuilder',async()=>{
   for(const suffix of ['', '/aggregate']){const full=await req('GET',`/clothes/${item.id}${suffix}`);assert.equal(full.collection.id,collection.id);assert.equal(full.materials.length,2);assert.ok(full.care.id);}
  });
  await check('Фільтри за колекцією, назвою / ID матеріалу, пошук та limit',async()=>{
   for(const params of [{collectionId:collection.id},{collection:collection.name},{material:dto.materials[0].name},{materialId:item.materials[0].id},{collectionId:collection.id,material:dto.materials[0].name,search:'футболка',limit:'1'}]){
    const rows=await req('GET','/clothes?'+new URLSearchParams(params));assert.equal(rows.length,1);assert.equal(rows[0].materials.length,2);
   }
   assert.equal((await req('GET','/clothes?material='+encodeURIComponent("' OR 1=1 --"))).length,0);
  });
  await check('Валідація вкладених DTO, UUID, зайвих полів і від’ємної ціни',async()=>{
   for(const patch of [{price:-1},{hacker:true},{care:{...dto.care,washTemperature:99}},{collectionId:'invalid'},{materials:[{name:'   '}]},{care:null},{simulateFailure:null}])await req('POST','/clothes',{...dto,...patch},400);
   await req('GET','/clothes/not-uuid',undefined,400);await req('GET','/clothes?limit=0',undefined,400);
   await req('POST','/clothes',{...dto,collectionId:randomUUID()},404);
  });
  await check('Справжній rollback після INSERT товару й нових матеріалів',async()=>{
   const before=await counts();await req('POST','/clothes/transactional',{...dto,title:marker+' FAIL',materials:[{name:marker+' Rollback'}],simulateFailure:true},400);const after=await counts();assert.deepEqual(after,before);observations.push({operation:'rollback',before,after});
   assert.equal((await db.query('SELECT count(*)::int n FROM clothes WHERE title=$1',[marker+' FAIL'])).rows[0].n,0);
  });
  await check('Rollback повного оновлення повертає старі поля та M:N',async()=>{
   const before=await counts();await req('PUT',`/clothes/${item.id}`,{...dto,title:marker+' Changed',materials:[{name:marker+' UpdateRollback'}],simulateFailure:true},400);
   const unchanged=await req('GET',`/clothes/${item.id}`);assert.equal(unchanged.title,item.title);assert.deepEqual(unchanged.materials.map(m=>m.id).sort(),item.materials.map(m=>m.id).sort());const after=await counts();assert.deepEqual(after,before);observations.push({operation:'rollback',before,after});
  });
  await check('Повне оновлення агрегата, стабільний ID деталей і PATCH',async()=>{
   const changed=await req('PUT',`/clothes/${item.id}`,{...dto,materials:[dto.materials[0]],care:{...dto.care,washTemperature:40}});
   assert.equal(changed.materials.length,1);assert.equal(changed.care.id,item.care.id);assert.equal(changed.care.washTemperature,40);
   const patched=await req('PATCH',`/clothes/${item.id}`,{price:850});assert.equal(patched.price,'850.00');
  });
  let second;
  await check('Повторне використання спільного матеріалу та обмеження БД',async()=>{
   second=await req('POST','/clothes',{...dto,title:marker+' Second',materials:[dto.materials[0]]},201);assert.equal(second.materials[0].id,item.materials.find(m=>m.name===dto.materials[0].name).id);
   await req('DELETE',`/materials/${second.materials[0].id}`,undefined,409);
   await req('POST','/collections',{name:collection.name,season:'2026'},409);
   await assert.rejects(db.query('INSERT INTO care_instructions ("washTemperature","ironAllowed",instructions,clothing_id) VALUES (30,true,\'duplicate\',$1)',[item.id]),e=>e.code==='23505');
  });
  await check('Замовлення використовують актуальний товар PostgreSQL',async()=>{
   const order=await req('POST','/orders',{productId:item.id,quantity:2,customerEmail:'student@example.com'},201);assert.equal(order.subtotal,1700);
  });
  await check('Дані збережено після перезапуску; імітація збою вимкнена за замовчуванням',async()=>{
   await stop();await start(false);const saved=await req('GET',`/clothes/${item.id}/aggregate`);assert.equal(saved.price,'850.00');
   await req('POST','/clothes/transactional',{...dto,simulateFailure:true},403);
  });
  await check('Видалення товару каскадно видаляє догляд і рядки M:N; матеріал спільний',async()=>{
   await req('DELETE',`/clothes/${item.id}`,undefined,204);await req('GET',`/clothes/${item.id}`,undefined,404);
   assert.equal((await db.query('SELECT count(*)::int n FROM care_instructions WHERE clothing_id=$1',[item.id])).rows[0].n,0);
   assert.equal((await db.query('SELECT count(*)::int n FROM clothing_materials WHERE clothing_id=$1',[item.id])).rows[0].n,0);
   assert.equal((await req('GET',`/clothes/${second.id}`)).materials.length,1);
  });
  await check('Видалення колекції каскадно видаляє одяг, догляд і зв’язки M:N',async()=>{
   await req('DELETE',`/collections/${collection.id}`,undefined,204);await req('GET',`/clothes/${second.id}`,undefined,404);
   const c=await counts();assert.equal(c.clothes,0);assert.equal(c.care,0);assert.equal(c.links,0);assert.ok(c.materials>0);
  });
 } finally {
  await stop();await db.end();fs.mkdirSync('evidence',{recursive:true});
  fs.writeFileSync('evidence/results.json',JSON.stringify({date:new Date().toISOString(),database,checks,observations,requests:transcript.length,transcript},null,2));
  fs.writeFileSync('evidence/server.log',log);fs.writeFileSync('evidence/migrations.log',migrationLog);
 }
 assert.equal(checks.length,15);console.log(`${checks.length} сценаріїв; ${transcript.length} HTTP-запитів`);
});

