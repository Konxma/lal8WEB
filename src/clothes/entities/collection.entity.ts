import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { ClothingEntity } from './clothing.entity';
@Entity('collections')
export class CollectionEntity {
 @PrimaryGeneratedColumn('uuid') id!: string;
 @Column({type:'varchar',length:100,unique:true}) name!: string;
 @Column({type:'varchar',length:40}) season!: string;
 @OneToMany(() => ClothingEntity, c => c.collection) clothes!: ClothingEntity[];
}
