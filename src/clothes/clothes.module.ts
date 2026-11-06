import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SharedModule } from '../shared/shared.module';
import { ClothesController } from './clothes.controller';
import { CollectionsController, MaterialsController } from './catalog.controller';
import { ClothesService } from './clothes.service';
import { ClothingEntity } from './clothing.entity';
import { CollectionEntity } from './entities/collection.entity';
import { MaterialEntity } from './entities/material.entity';
import { CareInstructionEntity } from './entities/care-instruction.entity';
@Module({imports:[SharedModule,TypeOrmModule.forFeature([ClothingEntity,CollectionEntity,MaterialEntity,CareInstructionEntity])],
 controllers:[ClothesController,CollectionsController,MaterialsController],providers:[ClothesService],exports:[ClothesService]})
export class ClothesModule {}
