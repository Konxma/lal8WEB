import { OneToOne } from 'typeorm';
import { CareInstructionEntity } from './care-instruction.entity';
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn, Check } from 'typeorm';
import { MaterialEntity } from './material.entity';
import { ManyToMany, JoinTable } from 'typeorm';
import { CollectionEntity } from './collection.entity';
export enum ClothingSize { XS='XS', S='S', M='M', L='L', XL='XL' }
@Entity('clothes')
@Check('CHK_clothes_positive_price', '"price" > 0')
export class ClothingEntity {
 @PrimaryGeneratedColumn('uuid') id!: string;
 @Column({type:'varchar',length:150}) title!: string;
 @Column({type:'varchar',length:200}) slug!: string;
 @Column({type:'decimal',precision:10,scale:2}) price!: string;
 @Column({type:'enum',enum:ClothingSize}) size!: ClothingSize;
 @Column({type:'varchar',length:100}) material!: string;
 @Column({type:'varchar',length:50}) color!: string;
 @ManyToOne(() => CollectionEntity, c => c.clothes, {nullable:false,onDelete:'CASCADE'})
 @JoinColumn({name:'collection_id'}) collection!: CollectionEntity;
 @ManyToMany(() => MaterialEntity, m => m.clothes, {cascade:['insert','update']})
 @JoinTable({name:'clothing_materials',joinColumn:{name:'clothing_id'},inverseJoinColumn:{name:'material_id'}}) materials!: MaterialEntity[];
 @OneToOne(() => CareInstructionEntity, care => care.clothing, {cascade:['insert','update']}) care!: CareInstructionEntity;
 @CreateDateColumn({type:'timestamptz'}) createdAt!: Date;
 @UpdateDateColumn({type:'timestamptz'}) updatedAt!: Date;
}
