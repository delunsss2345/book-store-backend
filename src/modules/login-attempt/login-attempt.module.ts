import { Module } from '@nestjs/common';
import { LoginAttemptRepository } from './login-attempt.repository';
import { LoginAttemptService } from './login-attempt.service';

@Module({
    providers: [LoginAttemptService, LoginAttemptRepository],
    exports: [LoginAttemptService, LoginAttemptRepository],
})
export class LoginAttemptModule { }
