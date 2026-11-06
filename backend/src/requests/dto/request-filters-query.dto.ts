import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, IsNotEmpty } from 'class-validator';

export class RequestFiltersQueryDto {
  @ApiPropertyOptional({
    example: 'OPEN',
    enum: ['OPEN', 'FULFILLED', 'CANCELLED'],
  })
  @IsOptional()
  @IsIn(['OPEN', 'FULFILLED', 'CANCELLED'], {
    message: 'Invalid request status.',
  })
  status?: string;

  @ApiPropertyOptional({
    example: 'A-',
    enum: ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'],
  })
  @IsOptional()
  @IsIn(['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'], {
    message:
      'Invalid blood type. Must be one of O-, O+, A-, A+, B-, B+, AB-, AB+.',
  })
  bloodType?: string;

  @ApiPropertyOptional({
    example: 'area-homs',
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  areaId?: string;

  @ApiPropertyOptional({
    example: 'CRITICAL',
    enum: ['CRITICAL', 'HIGH', 'NORMAL'],
  })
  @IsOptional()
  @IsIn(['CRITICAL', 'HIGH', 'NORMAL'], {
    message: 'Urgency must be CRITICAL, HIGH, or NORMAL.',
  })
  urgency?: string;
}
