import { Module } from '@nestjs/common';
import { MatchingService } from './matching.service';

// PrismaModule and CommonModule (ClockService) are global.
@Module({
  providers: [MatchingService],
  exports: [MatchingService],
})
export class MatchingModule {}
