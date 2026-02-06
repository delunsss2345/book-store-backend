import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { AuthRepository } from './auth.repository';
import { AuthService } from './auth.service';

describe('AuthService', () => {
    let service: AuthService;
    const authRepositoryMock = {
        createUser: jest.fn(),
        existsEmail: jest.fn(),
        findAuthByEmailPassword: jest.fn(),
        findUserByEmail: jest.fn(),
        updateLastLogin: jest.fn(),
        markEmailVerified: jest.fn(),
        updatePassword: jest.fn(),
        updateProfile: jest.fn(),
    };
    const jwtServiceMock = {
        sign: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                AuthService,
                { provide: AuthRepository, useValue: authRepositoryMock },
                { provide: JwtService, useValue: jwtServiceMock },
            ],
        }).compile();

        service = module.get<AuthService>(AuthService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });
});
