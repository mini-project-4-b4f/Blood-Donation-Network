import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class PledgeIdParamDto {
  @ApiProperty({ description: 'Pledge identifier.' })
  @IsString({ message: 'Pledge ID is required.' })
  @IsNotEmpty({ message: 'Pledge ID is required.' })
  id!: string;
}
