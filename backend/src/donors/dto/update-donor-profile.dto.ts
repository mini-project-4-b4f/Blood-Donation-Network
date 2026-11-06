import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { IsValidPhone } from '../../common/validators';

export class UpdateDonorProfileDto {
  @ApiPropertyOptional({ description: 'ID of a supported area.' })
  @IsOptional()
  @IsString({ message: 'Area must be a string.' })
  @IsNotEmpty({ message: 'Area is required.' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  areaId?: string;

  @ApiPropertyOptional({
    description: 'Phone number; spaces and dashes are removed before storage.',
    example: '0933112233',
  })
  @IsOptional()
  @IsString({ message: 'A valid phone number is required.' })
  @IsValidPhone()
  phone?: string;

  @ApiPropertyOptional({ description: 'Whether the donor is available to donate.' })
  @IsOptional()
  @IsBoolean({ message: 'Availability must be a boolean value.' })
  isAvailable?: boolean;
}
