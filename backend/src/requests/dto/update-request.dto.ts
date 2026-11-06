import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { MIN_UNITS, MAX_UNITS } from '../../common/constants';

export class UpdateRequestDto {
  @ApiPropertyOptional({
    example: 4,
    minimum: MIN_UNITS,
    maximum: MAX_UNITS,
    description: 'Updated number of required blood units.',
  })
  @IsOptional()
  @IsInt({
    message: 'Units required must be a whole number between 1 and 10.',
  })
  @Min(MIN_UNITS, {
    message: 'Units required must be a whole number between 1 and 10.',
  })
  @Max(MAX_UNITS, {
    message: 'Units required must be a whole number between 1 and 10.',
  })
  unitsRequired?: number;

  @ApiPropertyOptional({
    example: 'HIGH',
    enum: ['CRITICAL', 'HIGH', 'NORMAL'],
  })
  @IsOptional()
  @IsIn(['CRITICAL', 'HIGH', 'NORMAL'], {
    message: 'Urgency must be CRITICAL, HIGH, or NORMAL.',
  })
  urgency?: string;

  @ApiPropertyOptional({
    example: 'Patient condition requires urgent surgery.',
    description: 'Optional coordinator note.',
  })
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString({ message: 'Note must be a string.' })
  note?: string;
}
