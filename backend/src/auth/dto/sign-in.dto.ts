import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString } from 'class-validator';

export class SignInDto {
  @ApiProperty({ example: '0933112233', description: 'Phone number or email.' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString({ message: 'Phone number or email is required.' })
  @IsNotEmpty({ message: 'Phone number or email is required.' })
  identifier: string;

  @ApiProperty({ example: 'DonorPassword123' })
  @IsString({ message: 'Password is required.' })
  @IsNotEmpty({ message: 'Password is required.' })
  password: string;
}
