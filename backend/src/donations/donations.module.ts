import { Module } from '@nestjs/common';

import { MatchingModule } from '../matching/matching.module';

import { DonationsController } from './donations.controller';
import { DonationsService } from './donations.service';

@Module({
  imports: [MatchingModule],
  controllers: [DonationsController],
  providers: [DonationsService],
  exports: [DonationsService],
})
export class DonationsModule {}
