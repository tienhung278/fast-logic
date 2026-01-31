import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { TransactionWebhookDto } from './dto/transaction-webhook.dto';
import { TransactionResponseDto } from './dto/transaction-response.dto';
import { TransactionsService } from './transactions.service';

@ApiTags('transactions')
@Controller('webhooks')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Post('transactions')
  @HttpCode(200)
  @ApiOperation({ summary: 'Process fuel transaction webhook' })
  @ApiResponse({ status: 200, type: TransactionResponseDto })
  async processTransaction(
    @Body() payload: TransactionWebhookDto,
  ): Promise<TransactionResponseDto> {
    return this.transactionsService.processTransaction(payload);
  }
}
