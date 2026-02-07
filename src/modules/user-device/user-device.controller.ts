import { GetUser } from '@/common/decorators/getUser.decorator';
import { Controller, Get } from '@nestjs/common';
import { UserDeviceService } from './user-device.service';

@Controller('device')
export class UserDeviceController {
    constructor(private readonly userDeviceService: UserDeviceService) { }

    @Get()
    getDevices(@GetUser() user: { sub: string }) {
        const userId = BigInt(user.sub);
        return this.userDeviceService.listDevices(userId);
    }
}
