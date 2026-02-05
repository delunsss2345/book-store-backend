import { Controller } from '@nestjs/common';
import { JwtAuthService } from './jwt.service';

@Controller('jwt')
export class JwtAuthController {
  constructor(private readonly jwtService: JwtAuthService) {}
}
