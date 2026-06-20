import { Module } from '@nestjs/common';
import { LoginAttemptController } from './controller/login-attempt.controller';
import { LoginAttemptRepository } from './repository/login-attempt.repository';
import { LoginAttemptService } from './service/login-attempt.service';

@Module({
    controllers: [LoginAttemptController],
    providers: [LoginAttemptService, LoginAttemptRepository],
    exports: [LoginAttemptService, LoginAttemptRepository],
})
export class LoginAttemptModule { }
