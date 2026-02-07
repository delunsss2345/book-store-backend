import { Module } from '@nestjs/common';
import { UserDeviceController } from './user-device.controller';
import { UserDeviceRepository } from './user-device.repository';
import { UserDeviceService } from './user-device.service';

@Module({
    controllers: [UserDeviceController],
    providers: [UserDeviceService, UserDeviceRepository],
    exports: [UserDeviceService, UserDeviceRepository],
})
export class UserDeviceModule { }
