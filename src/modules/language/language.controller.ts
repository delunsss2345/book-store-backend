import { Public } from '@/common/security/decorators/public.decorator';
import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { LanguageResponseDto } from './dto/response/language.response.dto';
import { LanguageService } from './language.service';

@ApiTags('language')
@Controller('languages')
export class LanguageController {
  constructor(private readonly languageService: LanguageService) {}

  @Public()
  @Get()
  @ApiOkResponse({ type: LanguageResponseDto, isArray: true })
  getLanguage(): Promise<LanguageResponseDto[]> {
    return this.languageService.getLanguage();
  }
}
