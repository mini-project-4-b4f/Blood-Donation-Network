import { Module } from '@nestjs/common';
import { AreasModule } from '../areas/areas.module';
import { MatchingModule } from '../matching/matching.module';
import { DonorsController } from './donors.controller';
import { DonorsService } from './donors.service';

@Module({
  imports: [AreasModule, MatchingModule],
  controllers: [DonorsController],
  providers: [DonorsService],
})
export class DonorsModule {}
