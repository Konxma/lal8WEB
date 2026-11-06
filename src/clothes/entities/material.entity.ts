import { Entity, PrimaryGeneratedColumn, Column, ManyToMany } from 'typeorm';
import { ClothingEntity } from './clothing.entity';
@Entity('materials')
export class MaterialEntity {
 @PrimaryGeneratedColumn('uuid') id!: string;
 @Column({type:'varchar',length:80,unique:true}) name!: string;
 @ManyToMany(() => ClothingEntity, c => c.materials) clothes!: ClothingEntity[];
}
