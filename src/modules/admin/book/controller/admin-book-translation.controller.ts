import { PermissionCode } from '@/common/constants/permission-pattern.constant';
import { GetUser } from '@/common/decorators/getUser.decorator';
import type { JwtPayload } from '@/common/dto/jwt.dto';
import { RequirePermissions } from '@/common/security/decorators/requirePermission.decorator';
import { Body, Controller, Ip, Param, Post } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { AdminBookService } from '../service/admin-book.service';
import { CreateAdminBookTranslationRequestDto } from '../dto/request';
import { AdminBookTranslationResponseDto } from '../dto/response';

@ApiTags('admin')
@Controller('admin/books')
export class AdminBookTranslationController {
  constructor(private readonly adminBookService: AdminBookService) {}

  @Post(':bookId/translations')
  @RequirePermissions(PermissionCode.BOOK_TRANSLATION_CREATE)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Create a translation for a book' })
  @ApiParam({ name: 'bookId', type: Number, description: 'ID of the book' })
  @ApiCreatedResponse({ type: AdminBookTranslationResponseDto })
  createBookTranslation(
    @Param('bookId') bookId: string,
    @Body() body: CreateAdminBookTranslationRequestDto,
    @GetUser() user: JwtPayload,
    @Ip() ip: string,
  ) {
    const parsedBookId = Number(bookId);
    const actorUserId = Number(user?.sub);
    return this.adminBookService.createBookTranslation(
      parsedBookId,
      body,
      actorUserId,
      ip,
    );
  }
}
