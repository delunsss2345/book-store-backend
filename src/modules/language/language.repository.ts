import { PrismaService } from '@/database';
import { Injectable } from '@nestjs/common';

@Injectable()
export class LanguageRepository {
  constructor(private readonly prisma: PrismaService) { }

  findLanguageByCode(code: string) {
    return this.prisma.language.findFirst({
      where: { code, isActive: true },
      select: { id: true, code: true },
    });
  }

  findDefaultLanguage() {
    return this.prisma.language.findFirst({
      where: { isActive: true },
      orderBy: { id: 'asc' },
      select: { id: true, code: true },
    });
  }

  findActiveLanguages() {
    return this.prisma.language.findMany({
      where: { isActive: true },
      orderBy: { id: 'asc' },
      select: {
        id: true,
        code: true,
        name: true,
      },
    });
  }
}
