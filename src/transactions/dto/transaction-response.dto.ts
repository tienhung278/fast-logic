import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TransactionRejectionCode } from '../models/transaction-rejection-code';

export class CardUsageDto {
  @ApiProperty()
  dailyUsedCents: number;

  @ApiProperty()
  monthlyUsedCents: number;

  @ApiProperty()
  dailyLimitCents: number;

  @ApiProperty()
  monthlyLimitCents: number;
}

export class TransactionResponseDto {
  @ApiProperty({ example: 'approved', enum: ['approved', 'rejected'] })
  status: 'approved' | 'rejected';

  @ApiProperty({
    example: 'APPROVED',
    enum: ['APPROVED', ...Object.values(TransactionRejectionCode)],
  })
  code: 'APPROVED' | TransactionRejectionCode;

  @ApiProperty({ example: 'Transaction approved' })
  message: string;

  @ApiProperty({ example: 'txn_12345' })
  transactionId: string;

  @ApiPropertyOptional({ example: 455000 })
  balanceCents?: number;

  @ApiPropertyOptional({ type: CardUsageDto })
  cardUsage?: CardUsageDto;
}
