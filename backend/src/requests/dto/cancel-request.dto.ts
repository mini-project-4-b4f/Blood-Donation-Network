import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString } from 'class-validator';

export class CancelRequestDto {
  @ApiProperty({
    example: 'The patient no longer needs the requested blood.',
    description: 'Reason for cancelling the blood request.',
  })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString({
    message: 'Cancellation reason is required.',
  })
  @IsNotEmpty({
    message: 'Cancellation reason is required.',
  })
  cancelReason: string;
}
