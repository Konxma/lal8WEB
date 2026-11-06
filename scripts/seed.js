const base=process.env.API_URL || `http://127.0.0.1:${process.env.PORT || 3000}`;
async function request(path,body) {
 const r=await fetch(base+path,{method:body?'POST':'GET',headers:{'Content-Type':'application/json'},body:body?JSON.stringify(body):undefined});
 const json=await r.json();if(!r.ok)throw Error(JSON.stringify(json));return json;
}
(async()=>{
 let collection=(await request('/collections')).find(c=>c.name==='Осінь 2026');
 if(!collection)collection=await request('/collections',{name:'Осінь 2026',season:'Осінь'});
 let item=(await request('/clothes?'+new URLSearchParams({collectionId:collection.id,search:'Футболка Classic'})))[0];
 if(!item)item=await request('/clothes/transactional',{title:'Футболка Classic',price:799.99,size:'M',material:'Бавовна та льон',color:'Білий',collectionId:collection.id,materials:[{name:'Бавовна'},{name:'Льон'}],care:{washTemperature:30,ironAllowed:true,instructions:'Делікатне прання, сушити природним способом'}});
 console.log(JSON.stringify({collectionId:collection.id,clothingId:item.id,materialId:item.materials[0].id,item},null,2));
})().catch(e=>{console.error(e.message);process.exitCode=1;});
