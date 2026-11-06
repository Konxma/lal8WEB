import { Body, Controller, Delete, Get, HttpCode, NotFoundException, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { CollectionEntity } from './entities/collection.entity';
import { MaterialEntity } from './entities/material.entity';
export class CreateCollectionDto {
 @IsString() @IsNotEmpty() @MaxLength(100) name!:string;
 @IsString() @IsNotEmpty() @MaxLength(40) season!:string;
}
@Controller('collections')
export class CollectionsController {
 constructor(@InjectRepository(CollectionEntity) private readonly repo:Repository<CollectionEntity>) {}
 @Get() all() { return this.repo.find({order:{name:'ASC'}}); }
 @Post() create(@Body() dto:CreateCollectionDto) { return this.repo.save(this.repo.create(dto)); }
 @Delete(':id') @HttpCode(204) async remove(@Param('id',ParseUUIDPipe) id:string) {
  if(!(await this.repo.delete(id)).affected) throw new NotFoundException('Колекцію не знайдено');
 }
}
@Controller('materials')
export class MaterialsController {
 constructor(@InjectRepository(MaterialEntity) private readonly repo:Repository<MaterialEntity>) {}
 @Get() all() { return this.repo.find({order:{name:'ASC'}}); }
 @Delete(':id') @HttpCode(204) async remove(@Param('id',ParseUUIDPipe) id:string) {
  if(!(await this.repo.delete(id)).affected) throw new NotFoundException('Матеріал не знайдено');
 }
}
