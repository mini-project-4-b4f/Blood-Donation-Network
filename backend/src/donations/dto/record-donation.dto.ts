import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString } from 'class-validator';
import { IsCalendarDate } from '../../common/validators';

export class RecordDonationDto {
  @ApiProperty({
    example: 'donor-profile-id',
    description: 'ID of the donor profile.',
  })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString({ message: 'Donor ID must be a string.' })
  @IsNotEmpty({ message: 'Donor ID is required.' })
  donorId: string;

  @ApiProperty({
    example: '2026-11-06',
    description: 'Donation date in YYYY-MM-DD format.',
  })
  @IsString({ message: 'Invalid date. Use the format YYYY-MM-DD.' })
  @IsNotEmpty({ message: 'Invalid date. Use the format YYYY-MM-DD.' })
  @IsCalendarDate({
    message: 'Invalid date. Use the format YYYY-MM-DD.',
  })
  donationDate: string;
}
