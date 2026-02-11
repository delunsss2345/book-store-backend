import { Module } from '@nestjs/common';
import { LoginAttemptController } from './login-attempt.controller';
import { LoginAttemptRepository } from './login-attempt.repository';
import { LoginAttemptService } from './login-attempt.service';

@Module({
    controllers: [LoginAttemptController],
    providers: [LoginAttemptService, LoginAttemptRepository],
    exports: [LoginAttemptService, LoginAttemptRepository],
})
export class LoginAttemptModule { }
