import type { JwtPayload } from '@/common';
import { GetLanguageId } from '@/common/decorators/getLanguageId.decorator';
import { GetUser } from '@/common/decorators/getUser.decorator';
import { CatalogHomeQueryDto } from '@/modules/book/catalog/dto/request';
import { CatalogHomeResponseDto } from '@/modules/book/catalog/dto/response';
import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserEventService } from '../service/user-event.service';

@ApiTags('User Events')
@Controller('user-events')
export class UserEventController {
    constructor(private readonly userEventService: UserEventService) { }


    @Get('hyper-recommend/books')
    @ApiOperation({ summary: 'Get hyper-recommended books for the authenticated user' })
    @ApiOkResponse({ type: CatalogHomeResponseDto })
    @ApiBearerAuth('access-token')
    async listBooksByCategory(
        @GetUser() user: JwtPayload,
        @Query() query: CatalogHomeQueryDto,
        @GetLanguageId() langId: number,
    ) {
        return this.userEventService.getHyperRecommendHome(
            Number(user.sub),
            query,
            langId,
        );
    }

}
