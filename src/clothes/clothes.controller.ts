import { Body, Controller, Delete, Get, HttpCode, Param, ParseUUIDPipe, Patch, Post, Put, Query } from '@nestjs/common';
import { ClothesService } from './clothes.service';
import { CreateClothingDto } from './dto/create-clothing.dto';
import { UpdateClothingDto } from './dto/update-clothing.dto';
import { ListClothesQueryDto } from './dto/list-clothes-query.dto';
@Controller('clothes')
export class ClothesController {
 constructor(private readonly service: ClothesService) {}
 @Get() findAll(@Query() query: ListClothesQueryDto) { return this.service.findAll(query); }
 @Get(':id/aggregate') aggregate(@Param('id',ParseUUIDPipe) id: string) { return this.service.aggregate(id); }
 @Get(':id') findOne(@Param('id',ParseUUIDPipe) id: string) { return this.service.findOne(id); }
 @Post() create(@Body() dto: CreateClothingDto) { return this.service.create(dto); }
 @Post('transactional') transactional(@Body() dto: CreateClothingDto) { return this.service.create(dto); }
 @Put(':id') replace(@Param('id',ParseUUIDPipe) id:string,@Body() dto:CreateClothingDto) { return this.service.replace(id,dto); }
 @Patch(':id') update(@Param('id',ParseUUIDPipe) id:string,@Body() dto:UpdateClothingDto) { return this.service.update(id,dto); }
 @Delete(':id') @HttpCode(204) remove(@Param('id',ParseUUIDPipe) id:string) { return this.service.remove(id); }
}
