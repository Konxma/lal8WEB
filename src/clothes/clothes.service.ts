import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { ClothingEntity } from './clothing.entity';
import { CollectionEntity } from './entities/collection.entity';
import { MaterialEntity } from './entities/material.entity';
import { CareInstructionEntity } from './entities/care-instruction.entity';
import { SlugService } from '../shared/slug.service';
import { CreateClothingDto } from './dto/create-clothing.dto';
import { UpdateClothingDto } from './dto/update-clothing.dto';
import { ListClothesQueryDto } from './dto/list-clothes-query.dto';
@Injectable()
export class ClothesService {
 constructor(@InjectRepository(ClothingEntity) private readonly repo: Repository<ClothingEntity>,
 private readonly source: DataSource, private readonly slug: SlugService) {}
 async findOne(id: string): Promise<ClothingEntity> {
  const item = await this.repo.findOne({where:{id},relations:['collection','materials','care']});
  if (!item) throw new NotFoundException(`Товар ${id} не знайдено`);
  return item;
 }
 async aggregate(id: string): Promise<ClothingEntity> {
  const item = await this.repo.createQueryBuilder('clothing')
   .innerJoinAndSelect('clothing.collection','collection')
   .leftJoinAndSelect('clothing.materials','material')
   .leftJoinAndSelect('clothing.care','care').where('clothing.id = :id',{id}).getOne();
  if (!item) throw new NotFoundException(`Товар ${id} не знайдено`);
  return item;
 }
 findAll(query: ListClothesQueryDto = {}): Promise<ClothingEntity[]> {
  const qb = this.repo.createQueryBuilder('clothing')
   .innerJoinAndSelect('clothing.collection','collection')
   .leftJoinAndSelect('clothing.materials','material').leftJoinAndSelect('clothing.care','care');
  // A separate filter join retains ALL materials in the returned aggregate.
  if(query.material || query.materialId) {
   qb.innerJoinAndSelect('clothing.materials','matchedMaterial');
   if(query.material) qb.andWhere('matchedMaterial.name = :materialName',{materialName:query.material});
   if(query.materialId) qb.andWhere('matchedMaterial.id = :materialId',{materialId:query.materialId});
  }
  if(query.collectionId) qb.andWhere('collection.id = :collectionId',{collectionId:query.collectionId});
  if(query.collection) qb.andWhere('collection.name = :collectionName',{collectionName:query.collection});
  if(query.search) qb.andWhere('clothing.title ILIKE :search',{search:`%${query.search}%`});
  return qb.orderBy('clothing.createdAt','ASC').addOrderBy('clothing.id','ASC').take(query.limit || 100).getMany();
 }
 create(dto: CreateClothingDto): Promise<ClothingEntity> { return this.saveAggregate(dto); }
 replace(id: string, dto: CreateClothingDto): Promise<ClothingEntity> { return this.saveAggregate(dto,id); }
 private async saveAggregate(dto: CreateClothingDto, id?: string): Promise<ClothingEntity> {
  if(dto.simulateFailure && process.env.LAB_ALLOW_FAILURE_DEMO !== 'true')
   throw new ForbiddenException('Для демонстрації збою увімкніть LAB_ALLOW_FAILURE_DEMO=true');
  return this.source.transaction(async manager => {
   const collection = await manager.findOneBy(CollectionEntity,{id:dto.collectionId});
   if(!collection) throw new NotFoundException('Колекцію не знайдено');
   let item: ClothingEntity;
   if(id) {
    const existing = await manager.findOne(ClothingEntity,{where:{id},relations:['care','materials']});
    if(!existing) throw new NotFoundException('Товар не знайдено');
    item = existing;
   } else item = manager.create(ClothingEntity,{});
   Object.assign(item,{title:dto.title,slug:this.slug.generateSlug(dto.title),price:dto.price.toFixed(2),
    size:dto.size,material:dto.material,color:dto.color,collection});
   item.materials = [];
   for(const data of dto.materials) {
    item.materials.push(await manager.findOneBy(MaterialEntity,{name:data.name}) || manager.create(MaterialEntity,data));
   }
   // Only insert/update cascades: shared material records must survive product deletion.
   await manager.save(ClothingEntity,item);
   if(dto.simulateFailure) throw new BadRequestException('Імітація збою після збереження товару й матеріалів. Транзакцію відкочено.');
   const care = item.care || manager.create(CareInstructionEntity,{});
   Object.assign(care,dto.care,{clothing:item});
   await manager.save(CareInstructionEntity,care);
   return manager.findOneOrFail(ClothingEntity,{where:{id:item.id},relations:['collection','materials','care']});
  });
 }
 async update(id: string,dto: UpdateClothingDto): Promise<ClothingEntity> {
  const item = await this.findOne(id);
  for(const key of ['title','material','color'] as const) if(dto[key] != null) item[key] = dto[key]!;
  if(dto.size != null) item.size = dto.size;
  if(dto.price != null) item.price = dto.price.toFixed(2);
  item.slug = this.slug.generateSlug(item.title);
  await this.repo.save(item); return this.findOne(id);
 }
 async remove(id: string): Promise<void> {
  if(!(await this.repo.delete(id)).affected) throw new NotFoundException('Товар не знайдено');
 }
}

