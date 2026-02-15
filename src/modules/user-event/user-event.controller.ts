import type { JwtPayload } from '@/common';
import { GetUser } from '@/common/decorators/getUser.decorator';
import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiProperty } from '@nestjs/swagger';
import { UserEventService } from './user-event.service';

@Controller('user-events')
export class UserEventController {
    constructor(private readonly userEventService: UserEventService) { }


    @Get('hyper-recommend/books')
    @ApiProperty()
    @ApiBearerAuth('access-token')
    async listBooksByCategory(
        @GetUser() user: JwtPayload
    ) {
        return this.userEventService.getRecommend(BigInt(user.sub));
    }

}
