import { Controller } from '@nestjs/common';
import { R2ServiceService } from './r2-service.service';

@Controller('r2-service')
export class R2ServiceController {
  constructor(private readonly r2ServiceService: R2ServiceService) {}
}
