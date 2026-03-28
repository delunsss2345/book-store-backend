import { PermissionCode } from '@/common/constants/permission-pattern.constant';
import { GetLanguageId } from '@/common/decorators/getLanguageId.decorator';
import { GetUser } from '@/common/decorators/getUser.decorator';
import type { JwtPayload } from '@/common/dto/jwt.dto';
import { RequirePermissions } from '@/common/security/decorators/requirePermission.decorator';
import { CreateAdminBookAllRequestDto } from '@/modules/admin/dto/request/create-admin-book-all.request.dto';
import { parseBigIntRequired } from '@/utils/parseBigInt.util';
import {
  Body,
  Controller,
  Delete,
  Get,
  Ip,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { AdminBookService } from '../book/admin-book.service';
import {
  AdminBookListQueryDto,
  UpdateAdminBookRequestDto
} from '../dto/request';
import {
  AdminBookItemResponseDto,
  AdminBookListResponseDto,
  AdminBookStatsResponseDto,
} from '../dto/response';

@ApiTags('admin')
@Controller('admin/books')
export class AdminBookController {
  constructor(private readonly adminBookService: AdminBookService) { }

  @Get('stats')
  @RequirePermissions(PermissionCode.ADMIN_READ)
  @ApiBearerAuth('access-token')
  @ApiOkResponse({ type: AdminBookStatsResponseDto })
  getStats() {
    return this.adminBookService.getStats();
  }


  @Post('/all')
  // @RequirePermissions(PermissionCode.ADMIN_CREATE_BOOK_ALL)
  @ApiBearerAuth('access-token')
  @ApiOkResponse({ type: AdminBookItemResponseDto })
  createBookAll(
    @Body() body: CreateAdminBookAllRequestDto,
    @GetUser() user: JwtPayload,
    @Ip() ip: string,
  ) {
    const actorUserId = parseBigIntRequired(user?.sub, 'user.sub');
    return this.adminBookService.createBookAll(body, actorUserId, ip);
  }

  @Patch(':bookId')
  @RequirePermissions(PermissionCode.ADMIN_UPDATE_BOOK)
  @ApiBearerAuth('access-token')
  @ApiOkResponse({ type: AdminBookItemResponseDto })
  updateBook(
    @Param('bookId') bookId: string,
    @Body() body: UpdateAdminBookRequestDto,
    @GetUser() user: JwtPayload,
    @Ip() ip: string,
  ) {
    const parsedBookId = parseBigIntRequired(bookId, 'bookId');
    const actorUserId = parseBigIntRequired(user?.sub, 'user.sub');
    return this.adminBookService.updateBook(
      parsedBookId,
      body,
      actorUserId,
      ip,
    );
  }

  @Delete(':bookId')
  @RequirePermissions(PermissionCode.ADMIN_DELETE_BOOK)
  @ApiBearerAuth('access-token')
  @ApiOkResponse({ type: AdminBookItemResponseDto })
  deleteBook(
    @Param('bookId') bookId: string,
    @GetUser() user: JwtPayload,
    @Ip() ip: string,
  ) {
    const parsedBookId = parseBigIntRequired(bookId, 'bookId');
    const actorUserId = parseBigIntRequired(user?.sub, 'user.sub');
    return this.adminBookService.deleteBook(parsedBookId, actorUserId, ip);
  }

  @Get()
  @RequirePermissions(PermissionCode.ADMIN_READ)
  @ApiBearerAuth('access-token')
  @ApiOkResponse({ type: AdminBookListResponseDto })
  getBooks(@Query() query: AdminBookListQueryDto, @GetLanguageId() langId: number) {
    return this.adminBookService.getBooks(query, langId);
  }

}
