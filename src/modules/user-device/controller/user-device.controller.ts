import { GetUser } from '@/common/decorators/getUser.decorator';
import type { JwtPayload } from '@/common/dto/jwt.dto';
import { Controller, Get } from '@nestjs/common';
import { UserDeviceService } from '../service/user-device.service';

@Controller('device')
export class UserDeviceController {
    constructor(private readonly userDeviceService: UserDeviceService) { }

    @Get("/")
    getDevices(@GetUser() user: JwtPayload) {
        const userId = Number(user.sub);
        return this.userDeviceService.listDevices(userId);
    }
}

// có FE thì test ở FE đi 