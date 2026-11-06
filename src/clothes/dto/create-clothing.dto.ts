import { Type } from 'class-transformer';
import { ArrayMaxSize, ArrayUnique, IsArray, IsBoolean, IsEnum, IsInt, IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString, IsUUID, Max, MaxLength, Min, ValidateIf, ValidateNested } from 'class-validator';
import { ClothingSize } from '../clothing.entity';
export class MaterialDto {
 @IsString() @IsNotEmpty() @MaxLength(80) name!: string;
}
export class CareDto {
 @IsInt() @Min(0) @Max(95) washTemperature!: number;
 @IsBoolean() ironAllowed!: boolean;
 @IsString() @IsNotEmpty() @MaxLength(500) instructions!: string;
}
export class CreateClothingDto {
 @IsString() @IsNotEmpty() @MaxLength(150) title!: string;
 @IsNumber({maxDecimalPlaces:2}) @IsPositive() @Max(99999999.99) price!: number;
 @IsEnum(ClothingSize) size!: ClothingSize;
 @IsString() @IsNotEmpty() @MaxLength(100) material!: string;
 @IsString() @IsNotEmpty() @MaxLength(50) color!: string;
 @IsUUID() collectionId!: string;
 @IsArray() @ArrayMaxSize(20) @ArrayUnique((m: MaterialDto) => m.name)
 @ValidateNested({each:true}) @Type(() => MaterialDto) materials!: MaterialDto[];
 @ValidateNested() @Type(() => CareDto) @IsNotEmpty() care!: CareDto;
 @ValidateIf((_, value) => value !== undefined) @IsBoolean() simulateFailure?: boolean;
}
