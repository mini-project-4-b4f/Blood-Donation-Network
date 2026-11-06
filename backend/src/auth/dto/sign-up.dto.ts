import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';
import { API_BLOOD_TYPES } from '../../common/constants';
import { normalizeEmail, normalizePhone } from '../../common/normalize.util';
import { IsValidBloodType, IsValidPhone } from '../../common/validators';

const trimString = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

/** Properties are declared in checking order (stopAtFirstError): see docs/API.md section 6.1. */
export class SignUpDto {
  @ApiProperty({ example: 'Sara Al-Khatib' })
  @Transform(trimString)
  @IsString({ message: 'Full name is required.' })
  @IsNotEmpty({ message: 'Full name is required.' })
  fullName: string;

  @ApiProperty({ example: '0933112233', description: 'Optional +, then 8-15 digits (spaces/dashes are removed).' })
  @Transform(({ value }) => (typeof value === 'string' ? normalizePhone(value) : value))
  @IsValidPhone()
  phone: string;

  @ApiPropertyOptional({ example: 'sara@example.com' })
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? normalizeEmail(value) : value))
  @IsEmail({}, { message: 'Please provide a valid email address.' })
  email?: string;

  @ApiProperty({ example: 'DonorPassword123', minLength: 8 })
  @IsString({ message: 'Password must be at least 8 characters long.' })
  @MinLength(8, { message: 'Password must be at least 8 characters long.' })
  password: string;

  @ApiProperty({ enum: API_BLOOD_TYPES, example: 'A-' })
  @IsValidBloodType()
  bloodType: string;

  @ApiProperty({ example: 'area-homs' })
  @IsString({ message: 'Area is required.' })
  @IsNotEmpty({ message: 'Area is required.' })
  @Transform(({ value }) => typeof value === 'string' ? value.toLowerCase() : value)
  areaId: string;
}
