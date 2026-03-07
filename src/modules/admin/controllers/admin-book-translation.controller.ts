import { PermissionCode } from '@/common/constants/permission-pattern.constant';
import { GetUser } from '@/common/decorators/getUser.decorator';
import type { JwtPayload } from '@/common/dto/jwt.dto';
import { RequirePermissions } from '@/common/security/decorators/requirePermission.decorator';
import { parseBigIntRequired } from '@/utils/parseBigInt.util';
import { Body, Controller, Ip, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { AdminBookService } from '../book/admin-book.service';
import { CreateAdminBookTranslationRequestDto } from '../dto/request';
import { AdminBookTranslationResponseDto } from '../dto/response';

@ApiTags('admin')
@Controller('admin/books')
export class AdminBookTranslationController {
  constructor(private readonly adminBookService: AdminBookService) {}

  @Post(':bookId/translations')
  @RequirePermissions(PermissionCode.ADMIN_CREATE_BOOK)
  @ApiBearerAuth('access-token')
  @ApiOkResponse({ type: AdminBookTranslationResponseDto })
  createBookTranslation(
    @Param('bookId') bookId: string,
    @Body() body: CreateAdminBookTranslationRequestDto,
    @GetUser() user: JwtPayload,
    @Ip() ip: string,
  ) {
    const parsedBookId = parseBigIntRequired(bookId, 'bookId');
    const actorUserId = parseBigIntRequired(user?.sub, 'user.sub');
    return this.adminBookService.createBookTranslation(
      parsedBookId,
      body,
      actorUserId,
      ip,
    );
  }
}
