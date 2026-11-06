import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, IsUUID, Max, Min, MaxLength } from 'class-validator';
export class ListClothesQueryDto {
 @IsOptional() @IsString() @MaxLength(150) search?: string;
 @IsOptional() @IsUUID() collectionId?: string;
 @IsOptional() @IsString() @MaxLength(100) collection?: string;
 @IsOptional() @IsString() @MaxLength(80) material?: string;
 @IsOptional() @IsUUID() materialId?: string;
 @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100) limit?: number;
}
