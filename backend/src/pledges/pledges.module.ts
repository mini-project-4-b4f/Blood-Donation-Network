import { Module } from '@nestjs/common';
import { MatchingModule } from '../matching/matching.module';
import { PledgesController } from './pledges.controller';
import { PledgesService } from './pledges.service';

@Module({
  imports: [MatchingModule],
  controllers: [PledgesController],
  providers: [PledgesService],
})
export class PledgesModule {}
