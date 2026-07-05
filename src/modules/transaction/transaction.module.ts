import { Global, Module } from '@nestjs/common';
import { TransactionService } from './service/transaction.service';

@Global()
@Module({
  providers: [TransactionService],
  exports: [TransactionService],
})
export class TransactionModule {}
