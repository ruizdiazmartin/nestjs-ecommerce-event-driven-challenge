import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsBooleanString,
  IsDefined,
  IsInt,
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { variationTypesKeys } from 'src/database/entities/product.entity';
import { ProductDetails, ProductDetailsTypeFn } from './productDetails';

export class CreateProductDto {
  @IsNumber()
  @IsNotEmpty()
  public categoryId: number;

  @IsDefined()
  @IsString()
  @IsNotEmpty()
  public title: string;

  @IsDefined()
  @IsString()
  @IsNotEmpty()
  public code: string;

  @IsDefined()
  @IsString()
  @IsIn(variationTypesKeys)
  public variationType: string;

  @IsDefined()
  @Type(ProductDetailsTypeFn)
  @ValidateNested()
  public details: ProductDetails;

  @IsDefined()
  @ArrayMinSize(1)
  @IsString({ each: true })
  public about: string[];

  @IsDefined()
  @IsString()
  @IsNotEmpty()
  public description: string;
}

export class ProductDetailsDto {
  @IsString()
  @IsNotEmpty()
  public title: string;

  @IsString()
  @IsNotEmpty()
  public code: string;

  @IsDefined()
  @IsString()
  @IsIn(variationTypesKeys)
  public variationType: string;

  @IsDefined()
  @Type(ProductDetailsTypeFn)
  @ValidateNested()
  public details: ProductDetails;

  @ArrayMinSize(1)
  @IsString({ each: true })
  public about: string[];

  @IsString()
  @IsNotEmpty()
  public description: string;
}

export class FindProductsQueryDto {
  @IsOptional()
  @IsBooleanString()
  public active?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  public merchantId?: number;
}
