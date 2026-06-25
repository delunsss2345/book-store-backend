import { PermissionCode } from '@/common/constants/permission-pattern.constant';
import { GetLanguageId } from '@/common/decorators/getLanguageId.decorator';
import { GetUser } from '@/common/decorators/getUser.decorator';
import type { JwtPayload } from '@/common/dto/jwt.dto';
import { Public } from '@/common/security/decorators/public.decorator';
import { RequirePermissions } from '@/common/security/decorators/requirePermission.decorator';
import { CreateAdminBookRequestDto } from '@/modules/admin/dto/request/create-admin-book.request.dto';
import { AdminBookDetailResponseDto } from '@/modules/admin/dto/response/admin-book-detail.response.dto';
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
  // @RequirePermissions(PermissionCode.ADMIN_READ_DETAIL)
  // @ApiBearerAuth('access-token')
  @ApiOkResponse({ type: AdminBookDetailResponseDto })
  getDetail(
    @Param('bookId') bookId: string
  ) {
    const parsedBookId = Number(bookId);
    return this.adminBookService.getDetail(parsedBookId);
  }


  @Post()
  // @RequirePermissions(PermissionCode.ADMIN_CREATE_BOOK)
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
    @Param('bookId') bookId: string,
    @Body() body: UpdateAdminBookRequestDto,
    @GetUser() user: JwtPayload,
    @Ip() ip: string,
  ) {
    const parsedBookId = Number(bookId);
    const actorUserId = Number(user?.sub);
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
    const parsedBookId = Number(bookId);
    const actorUserId = Number(user?.sub);
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
