import { Module } from '@nestjs/common';
import { PublisherController } from './publisher.controller';
import { PublisherRepository } from './publisher.repository';
import { PublisherService } from './publisher.service';

@Module({
    controllers: [PublisherController],
    providers: [PublisherService, PublisherRepository],
    exports: [PublisherService],
})
export class PublisherModule { }
