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
import {
  ApiBearerAuth,
  ApiBody,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { AdminBookService } from '../service/admin-book.service';
import { AdminBookListQueryDto, UpdateAdminBookRequestDto } from '../dto/request';
import { AdminBookDetailQueryDto } from '../dto/request/admin-book-detail.query.dto';
import { CreateAdminBookRequestDto } from '../dto/request/create-admin-book.request.dto';
import { AdminBookDetailResponseDto } from '../dto/response/admin-book-detail.response.dto';
import { AdminBookPriceViewResponseDto } from '../dto/response/admin-book-price-view.response.dto';
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
  @ApiOperation({ summary: 'Get book statistics for admin dashboard' })
  @ApiOkResponse({ type: AdminBookStatsResponseDto })
  getStats() {
    return this.adminBookService.getStats();
  }

  @Get('list')
  @RequirePermissions(PermissionCode.ADMIN_READ)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get paginated list of books with full detail for admin' })
  @ApiOkResponse({ type: AdminBookListDetailResponseDto })
  listBooks(@Query() query: AdminBookListQueryDto, @GetLanguageId() langId: number) {
    return this.adminBookService.listBooks(query, langId);
  }

  @Public()
  @Get(":bookId")
  @ApiOperation({ summary: 'Get book detail by ID' })
  @ApiParam({ name: 'bookId', type: Number, description: 'ID of the book' })
  @ApiQuery({ name: 'type', required: false, enum: ['view_price'], description: 'view_price returns only active variants with purchaseOrderItem ids' })
  @ApiOkResponse({ type: AdminBookDetailResponseDto, description: 'Full detail (default)' })
  @ApiOkResponse({ type: AdminBookPriceViewResponseDto, description: 'Price view when type=view_price' })
  getDetail(
    @Param('bookId', ParseIntPipe) bookId: number,
    @Query() query: AdminBookDetailQueryDto,
  ) {
    return this.adminBookService.getDetail(bookId, query.type);
  }

  @Post()
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Create a new book' })
  @ApiBody({ type: CreateAdminBookRequestDto })
  @ApiCreatedResponse({ type: AdminBookItemResponseDto })
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
  @ApiOperation({ summary: 'Update a book by ID' })
  @ApiParam({ name: 'bookId', type: Number, description: 'ID of the book to update' })
  @ApiBody({ type: UpdateAdminBookRequestDto })
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
  @ApiOperation({ summary: 'Delete a book by ID' })
  @ApiParam({ name: 'bookId', type: Number, description: 'ID of the book to delete' })
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
  @ApiOperation({ summary: 'Get paginated list of books for admin' })
  @ApiOkResponse({ type: AdminBookListResponseDto })
  getBooks(@Query() query: AdminBookListQueryDto, @GetLanguageId() langId: number) {
    return this.adminBookService.getBooks(query, langId);
  }
}
