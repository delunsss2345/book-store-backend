import { Injectable } from '@nestjs/common';
import { GuestSessionCleanupResult, GuestSessionRepository } from './guest-session.repository';

@Injectable()
export class GuestSessionService {
    constructor(private readonly guestSessionRepository: GuestSessionRepository) { }

    convertGuestSessionToUser(guestSessionId: string, userId: bigint) {
        return this.guestSessionRepository.convertGuestSessionToUser(guestSessionId, userId);
    }

    createGuestSession(ipFirst: string | null, userAgentHash: string | null) {
        return this.guestSessionRepository.createGuestSession(ipFirst, userAgentHash);
    }

    getAllGuestSessions() {
        return this.guestSessionRepository.getAllGuestSessions();
    }

    getGuestSessionById(guestSessionId: string) {
        return this.guestSessionRepository.getGuestSessionById(guestSessionId);
    }

    updateLastSeenGuestSessionById(guestSessionId: string) {
        return this.guestSessionRepository.updateGuestSessionSeenDate(guestSessionId);
    }

    cleanupInactiveGuestSessions(inactiveDays: number): Promise<GuestSessionCleanupResult> {
        const inactiveMs = inactiveDays * 24 * 60 * 60 * 1000;
        const cutoff = new Date(Date.now() - inactiveMs);
        return this.guestSessionRepository.cleanupInactiveGuestData(cutoff);
    }
}
