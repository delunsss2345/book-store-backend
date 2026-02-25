import { PermissionCode } from '@/common/constants/permission-pattern.constant';
import { GetLanguage } from '@/common/decorators/getLanguage.decorator';
import { GetUser } from '@/common/decorators/getUser.decorator';
import type { JwtPayload } from '@/common/dto/jwt.dto';
import { RequirePermissions } from '@/common/security/decorators/requirePermission.decorator';
import { CreateAdminBookAllRequestDto } from '@/modules/admin/dto/request/create-admin-book-all.request.dto';
import { parseBigIntRequired } from '@/utils/parseBigInt.util';
import { Body, Controller, Delete, Get, Ip, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { AdminService } from '../admin.service';
import {
    AdminBookListQueryDto,
    CreateAdminBookRequestDto,
    UpdateAdminBookRequestDto,
} from '../dto/request';
import { AdminBookItemResponseDto, AdminBookListResponseDto } from '../dto/response';

@ApiTags('admin')
@Controller('admin/books')
export class AdminBookController {
    constructor(private readonly adminService: AdminService) { }

    @Post()
    @RequirePermissions(PermissionCode.ADMIN_CREATE_BOOK)
    @ApiBearerAuth('access-token')
    @ApiOkResponse({ type: AdminBookItemResponseDto })
    createBook(
        @Body() body: CreateAdminBookRequestDto,
        @GetUser() user: JwtPayload,
        @Ip() ip: string,
    ) {
        const actorUserId = parseBigIntRequired(user?.sub, 'user.sub');
        return this.adminService.createBook(body, actorUserId, ip);
    }

    @Post("/all")
    // @RequirePermissions(PermissionCode.ADMIN_CREATE_BOOK_ALL)
    @ApiBearerAuth('access-token')
    @ApiOkResponse({ type: CreateAdminBookAllRequestDto })
    createBookAll(
        @Body() body: CreateAdminBookAllRequestDto,
        @GetUser() user: JwtPayload,
        @Ip() ip: string,
    ) {
        const actorUserId = parseBigIntRequired(user?.sub, 'user.sub');
        return this.adminService.createBookAll(body, actorUserId, ip);
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
        return this.adminService.updateBook(parsedBookId, body, actorUserId, ip);
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
        return this.adminService.deleteBook(parsedBookId, actorUserId, ip);
    }

    @Get()
    @RequirePermissions(PermissionCode.ADMIN_READ)
    @ApiBearerAuth('access-token')
    @ApiOkResponse({ type: AdminBookListResponseDto })
    getBooks(@Query() query: AdminBookListQueryDto, @GetLanguage() lang: string) {
        const effectiveLang = query.lang ?? lang;
        return this.adminService.getBooks({ ...query, lang: effectiveLang });
    }





}
