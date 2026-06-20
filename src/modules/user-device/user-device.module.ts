import { Module } from '@nestjs/common';
import { UserDeviceController } from './controller/user-device.controller';
import { UserDeviceRepository } from './repository/user-device.repository';
import { UserDeviceService } from './service/user-device.service';

@Module({
    controllers: [UserDeviceController],
    providers: [UserDeviceService, UserDeviceRepository],
    exports: [UserDeviceService, UserDeviceRepository],
})
export class UserDeviceModule { }
