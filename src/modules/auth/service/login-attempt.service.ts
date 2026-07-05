import { Injectable } from '@nestjs/common';
import { CreateLoginAttemptRequestDto } from '../dto/request/create-login-attempt.request.dto';
import { LoginAttemptRepository } from '../repository/login-attempt.repository';

@Injectable()
export class LoginAttemptService {
  constructor(
    private readonly loginAttemptRepository: LoginAttemptRepository,
  ) {}

  createLoginAttempt(params: CreateLoginAttemptRequestDto) {
    return this.loginAttemptRepository.createLoginAttempt(params);
  }
}
