import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { GuestSessionService } from './guest-session.service';

const GUEST_INACTIVE_DAYS = 3;

@Injectable()
export class GuestSessionCleanupJob {
    private readonly logger = new Logger(GuestSessionCleanupJob.name);

    constructor(private readonly guestSessionService: GuestSessionService) { }

    @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
    async cleanupGuestSessionsDaily(): Promise<void> {
        try {
            const result = await this.guestSessionService.cleanupInactiveGuestSessions(GUEST_INACTIVE_DAYS);
            this.logger.log(
                `Guest cleanup completed: deletedSessions=${result.deletedSessions}, deletedCarts=${result.deletedCarts}, deletedCartItems=${result.deletedCartItems}`,
            );
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            this.logger.error(`Guest cleanup failed: ${message}`);
        }
    }
}
