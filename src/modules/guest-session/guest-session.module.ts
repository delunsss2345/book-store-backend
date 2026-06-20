import { Module } from '@nestjs/common';
import { GuestSessionCleanupJob } from './job/guest-session.cleanup.job';
import { GuestSessionController } from './controller/guest-session.controller';
import { GuestSessionRepository } from './repository/guest-session.repository';
import { GuestSessionService } from './service/guest-session.service';

@Module({
    controllers: [GuestSessionController],
    providers: [GuestSessionService, GuestSessionRepository, GuestSessionCleanupJob],
    exports: [GuestSessionService],
})
export class GuestSessionModule { }
