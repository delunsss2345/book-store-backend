import { ORDER_EXPIRED_SECONDS } from '@/common/constants/expired-constant';
import { OrderService } from '@/modules/order/order.service';
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';


@Injectable()
export class OrderCleanupJob {
    private readonly logger = new Logger(OrderCleanupJob.name);

    constructor(private readonly orderService: OrderService) { }

    @Cron(CronExpression.EVERY_5_MINUTES)
    async cleanupOrderSessionsMinutes(): Promise<void> {
        try {
            const result = await this.orderService.cleanOrder(ORDER_EXPIRED_SECONDS);
            this.logger.log(
                `Order cleanup completed: ${JSON.stringify(result)} `,
            );
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            this.logger.error(`Guest cleanup failed: ${message}`);
        }
    }
}
