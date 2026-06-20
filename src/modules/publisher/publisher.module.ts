import { Module } from '@nestjs/common';
import { PublisherController } from './controller/publisher.controller';
import { PublisherRepository } from './repository/publisher.repository';
import { PublisherService } from './service/publisher.service';

@Module({
    controllers: [PublisherController],
    providers: [PublisherService, PublisherRepository],
    exports: [PublisherService],
})
export class PublisherModule { }
