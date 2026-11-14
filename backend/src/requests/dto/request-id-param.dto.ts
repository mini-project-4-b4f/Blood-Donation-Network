import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class RequestIdParamDto {
  @ApiProperty({
    example: 'clx1234567890abcdef',
    description: 'Unique ID of the blood request.',
  })
  @IsString({ message: 'Request ID is required.' })
  @IsNotEmpty({ message: 'Request ID is required.' })
  id: string;
}
