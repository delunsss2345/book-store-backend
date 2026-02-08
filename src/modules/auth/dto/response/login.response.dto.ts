import { ApiProperty } from "@nestjs/swagger";
import { UserStatus } from "@prisma/client";

export class LoginUserDto {
    @ApiProperty({ type: String })
    id: string;

    @ApiProperty()
    email: string;

    @ApiProperty({ required: false, nullable: true })
    phoneNumber?: string;

    @ApiProperty({ required: false, nullable: true })
    firstName?: string;

    @ApiProperty({ required: false, nullable: true })
    lastName?: string;

    @ApiProperty({ required: false, nullable: true })
    gender?: string;

    @ApiProperty({ required: false, nullable: true })
    avatarUrl?: string;

    @ApiProperty()
    isEmailVerified: boolean;

    @ApiProperty({ enum: UserStatus })
    status: UserStatus;
}

export class LoginResponseDto {
    @ApiProperty({ type: () => LoginUserDto })
    user: LoginUserDto;

    @ApiProperty()
    accessToken: string;

    @ApiProperty()
    refreshToken: string;
}
