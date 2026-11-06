import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class CreateRequestDto {
  @ApiProperty({
    example: 'HOMS-ICU-402',
    description: 'Unique patient reference for the blood request.',
  })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString({ message: 'Patient reference is required.' })
  @IsNotEmpty({ message: 'Patient reference is required.' })
  patientReference: string;

  @ApiProperty({
    example: 'A-',
    enum: ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'],
  })
  @IsIn(['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'], {
    message:
      'Invalid blood type. Must be one of O-, O+, A-, A+, B-, B+, AB-, AB+.',
  })
  bloodType: string;

  @ApiProperty({
    example: 3,
    minimum: 1,
    maximum: 10,
  })
  @IsInt({
    message: 'Units required must be a whole number between 1 and 10.',
  })
  @Min(1, {
    message: 'Units required must be a whole number between 1 and 10.',
  })
  @Max(10, {
    message: 'Units required must be a whole number between 1 and 10.',
  })
  unitsRequired: number;

  @ApiProperty({
    example: 'area-homs',
    description: 'ID of the supported area.',
  })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString({ message: 'Area is required.' })
  @IsNotEmpty({ message: 'Area is required.' })
  areaId: string;

  @ApiProperty({
    example: 'CRITICAL',
    enum: ['CRITICAL', 'HIGH', 'NORMAL'],
  })
  @IsIn(['CRITICAL', 'HIGH', 'NORMAL'], {
    message: 'Urgency must be CRITICAL, HIGH, or NORMAL.',
  })
  urgency: string;

  @ApiProperty({
    example: 'Central Blood Bank Homs',
  })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString({
    message: 'Hospital or blood-bank name is required.',
  })
  @IsNotEmpty({
    message: 'Hospital or blood-bank name is required.',
  })
  hospital: string;

  @ApiPropertyOptional({
    example: 'Emergency surgery in Ward 3.',
    description: 'Optional coordinator note.',
  })
  @IsOptional()
  @IsString({ message: 'Note must be a string.' })
  note?: string;
}
