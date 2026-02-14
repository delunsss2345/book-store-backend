import { Controller } from '@nestjs/common';
import { UserEventService } from './user-event.service';

@Controller('user-events')
export class UserEventController {
    constructor(private readonly userEventService: UserEventService) { }
}
