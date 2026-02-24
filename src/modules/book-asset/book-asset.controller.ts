import { PermissionCode } from '@/common/constants/permission-pattern.constant';
import { RequirePermissions } from '@/common/security/decorators/requirePermission.decorator';
import { Body, Controller, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { BookAssetService } from './book-asset.service';
import { UploadBookAssetRequestDto } from './dto/request/upload-book-asset.request.dto';
import { UploadBookAssetResponseDto } from './dto/response/upload-book-asset.response.dto';

@ApiTags('admin')
@Controller('admin/book-assets')
export class BookAssetController {
    constructor(private readonly bookAssetService: BookAssetService) { }

    @Post('upload')
    @RequirePermissions(PermissionCode.ADMIN_UPDATE_BOOK)
    @ApiBearerAuth('access-token')
    @ApiOkResponse({ type: UploadBookAssetResponseDto })
    uploadBookAsset(@Body() body: UploadBookAssetRequestDto) {
        return this.bookAssetService.uploadBookAsset(body);
    }
}
