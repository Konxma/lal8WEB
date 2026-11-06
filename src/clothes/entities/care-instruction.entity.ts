import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn, Check } from 'typeorm';
import { ClothingEntity } from './clothing.entity';
@Entity('care_instructions')
@Check('CHK_care_temperature', '"washTemperature" BETWEEN 0 AND 95')
export class CareInstructionEntity {
 @PrimaryGeneratedColumn('uuid') id!: string;
 @Column({type:'int'}) washTemperature!: number;
 @Column({type:'boolean',default:false}) ironAllowed!: boolean;
 @Column({type:'varchar',length:500}) instructions!: string;
 @OneToOne(() => ClothingEntity, c => c.care, {nullable:false,onDelete:'CASCADE'})
 @JoinColumn({name:'clothing_id'}) clothing!: ClothingEntity;
}
