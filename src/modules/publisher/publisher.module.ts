import { Module } from '@nestjs/common';
import { LanguageModule } from '../language/language.module';
import { PublisherController } from './publisher.controller';
import { PublisherRepository } from './publisher.repository';
import { PublisherService } from './publisher.service';

@Module({
    imports: [LanguageModule],
    controllers: [PublisherController],
    providers: [PublisherService, PublisherRepository],
    exports: [PublisherService],
})
export class PublisherModule { }
