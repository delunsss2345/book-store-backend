import { Module } from '@nestjs/common';
import { GuestSessionCleanupJob } from './guest-session.cleanup.job';
import { GuestSessionController } from './guest-session.controller';
import { GuestSessionRepository } from './guest-session.repository';
import { GuestSessionService } from './guest-session.service';

@Module({
    controllers: [GuestSessionController],
    providers: [GuestSessionService, GuestSessionRepository, GuestSessionCleanupJob],
    exports: [GuestSessionService],
})
export class GuestSessionModule { }
