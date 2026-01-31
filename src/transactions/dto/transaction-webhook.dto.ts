import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsISO8601,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';

export class TransactionWebhookDto {
  @ApiProperty({ example: '4111111111111111' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{8,19}$/)
  cardNumber: string;

  @ApiProperty({ example: 45.25 })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  amount: number;

  @ApiProperty({ example: '2026-01-31T08:15:30.000Z' })
  @IsISO8601()
  occurredAt: string;

  @ApiProperty({ example: 'station_123' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  stationId: string;

  @ApiProperty({ example: 'Shell Downtown', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(128)
  stationName?: string;

  @ApiProperty({
    example: 'ext_98765',
    required: false,
    description: 'Optional external transaction identifier from the station',
  })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  externalTransactionId?: string;
}
