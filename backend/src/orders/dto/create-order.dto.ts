import { IsString, IsNumber, IsOptional, IsNotEmpty } from 'class-validator';

export class CreateOrderDto {
  @IsString()
  @IsNotEmpty()
  scentId: string;

  @IsString()
  @IsNotEmpty()
  deviceId: string;

  @IsOptional()
  @IsString()
  discountCode?: string;

  @IsNumber()
  @IsNotEmpty()
  quantity: number;
}