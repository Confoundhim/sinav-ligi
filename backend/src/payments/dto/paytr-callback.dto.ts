import { IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class PaytrCallbackDto {
  @IsString()
  @IsNotEmpty()
  merchant_oid!: string;

  @IsString()
  @IsIn(['success', 'failed'])
  status!: string;

  @IsString()
  @IsNotEmpty()
  total_amount!: string;

  @IsString()
  @IsNotEmpty()
  hash!: string;

  @IsOptional()
  @IsString()
  payment_type?: string;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsString()
  test_mode?: string;

  @IsOptional()
  @IsString()
  payment_amount?: string;

  @IsOptional()
  @IsString()
  failed_reason_code?: string;

  @IsOptional()
  @IsString()
  failed_reason_msg?: string;
}
