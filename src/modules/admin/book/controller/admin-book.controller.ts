import { PermissionCode } from '@/common/constants/permission-pattern.constant';
import { GetLanguageId } from '@/common/decorators/getLanguageId.decorator';
import { GetUser } from '@/common/decorators/getUser.decorator';
import type { JwtPayload } from '@/common/dto/jwt.dto';
import { Public } from '@/common/security/decorators/public.decorator';
import { RequirePermissions } from '@/common/security/decorators/requirePermission.decorator';
import {
  Body,
  Controller,
  Delete,
  Get,
  Ip,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { AdminBookService } from '../service/admin-book.service';
import { AdminBookListQueryDto, UpdateAdminBookRequestDto } from '../dto/request';
import { CreateAdminBookRequestDto } from '../dto/request/create-admin-book.request.dto';
import { AdminBookDetailResponseDto } from '../dto/response/admin-book-detail.response.dto';
import {
  AdminBookItemResponseDto,
  AdminBookListDetailResponseDto,
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

  @Get('list')
  @RequirePermissions(PermissionCode.ADMIN_READ)
  @ApiBearerAuth('access-token')
  @ApiOkResponse({ type: AdminBookListDetailResponseDto })
  listBooks(@Query() query: AdminBookListQueryDto, @GetLanguageId() langId: number) {
    return this.adminBookService.listBooks(query, langId);
  }

  @Public()
  @Get(":bookId")
  @ApiOkResponse({ type: AdminBookDetailResponseDto })
  getDetail(@Param('bookId', ParseIntPipe) bookId: number) {
    return this.adminBookService.getDetail(bookId);
  }

  @Post()
  @ApiBearerAuth('access-token')
  @ApiOkResponse({ type: AdminBookItemResponseDto })
  createBook(
    @Body() body: CreateAdminBookRequestDto,
    @GetLanguageId() langId: number,
    @GetUser() user: JwtPayload,
    @Ip() ip: string,
  ) {
    const actorUserId = Number(user?.sub);
    return this.adminBookService.createBook(body, langId, actorUserId, ip);
  }

  @Patch(':bookId')
  @RequirePermissions(PermissionCode.ADMIN_UPDATE_BOOK)
  @ApiBearerAuth('access-token')
  @ApiOkResponse({ type: AdminBookItemResponseDto })
  updateBook(
    @Param('bookId', ParseIntPipe) bookId: number,
    @Body() body: UpdateAdminBookRequestDto,
    @GetUser() user: JwtPayload,
    @Ip() ip: string,
  ) {
    const actorUserId = Number(user?.sub);
    return this.adminBookService.updateBook(bookId, body, actorUserId, ip);
  }

  @Delete(':bookId')
  @RequirePermissions(PermissionCode.ADMIN_DELETE_BOOK)
  @ApiBearerAuth('access-token')
  @ApiOkResponse({ type: AdminBookItemResponseDto })
  deleteBook(
    @Param('bookId', ParseIntPipe) bookId: number,
    @GetUser() user: JwtPayload,
    @Ip() ip: string,
  ) {
    const actorUserId = Number(user?.sub);
    return this.adminBookService.deleteBook(bookId, actorUserId, ip);
  }

  @Get()
  @RequirePermissions(PermissionCode.ADMIN_READ)
  @ApiBearerAuth('access-token')
  @ApiOkResponse({ type: AdminBookListResponseDto })
  getBooks(@Query() query: AdminBookListQueryDto, @GetLanguageId() langId: number) {
    return this.adminBookService.getBooks(query, langId);
  }
}
