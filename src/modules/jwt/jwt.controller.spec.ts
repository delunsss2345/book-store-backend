import { JwtAuthController } from '@/modules/jwt/jwt.controller';
import { JwtAuthService } from '@/modules/jwt/jwt.service';
import { Test, TestingModule } from '@nestjs/testing';


describe('JwtController', () => {
  let controller: JwtAuthController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [JwtAuthController],
      providers: [JwtAuthService],
    }).compile();

    controller = module.get<JwtAuthController>(JwtAuthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
