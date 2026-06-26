import { Public } from '@/common/security/decorators/public.decorator';
import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { LanguageResponseDto } from '../dto/response/language.response.dto';
import { LanguageService } from '../service/language.service';

@ApiTags('language')
@Controller('languages')
export class LanguageController {
  constructor(private readonly languageService: LanguageService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Get all available languages' })
  @ApiOkResponse({ type: LanguageResponseDto, isArray: true })
  getLanguage(): Promise<LanguageResponseDto[]> {
    return this.languageService.getLanguage();
  }
}
