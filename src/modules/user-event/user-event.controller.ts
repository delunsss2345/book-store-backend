import type { JwtPayload } from '@/common';
import { GetLanguage } from '@/common/decorators/getLanguage.decorator';
import { GetUser } from '@/common/decorators/getUser.decorator';
import { CatalogHomeQueryDto } from '@/modules/catalog/dto/request';
import { CatalogHomeResponseDto } from '@/modules/catalog/dto/response';
import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse } from '@nestjs/swagger';
import { UserEventService } from './user-event.service';

@Controller('user-events')
export class UserEventController {
    constructor(private readonly userEventService: UserEventService) { }


    @Get('hyper-recommend/books')
    @ApiOkResponse({ type: CatalogHomeResponseDto })
    @ApiBearerAuth('access-token')
    async listBooksByCategory(
        @GetUser() user: JwtPayload,
        @Query() query: CatalogHomeQueryDto,
        @GetLanguage() lang: string,
    ) {
        const effectiveLang = query.lang ?? lang;
        return this.userEventService.getHyperRecommendHome(
            BigInt(user.sub),
            { ...query, lang: effectiveLang },
        );
    }

}
