import { Module } from '@nestjs/common';

import { AreasModule } from '../areas/areas.module';
import { MatchingModule } from '../matching/matching.module';

import { RequestsController } from './requests.controller';
import { RequestsService } from './requests.service';

@Module({
  imports: [AreasModule, MatchingModule],
  controllers: [RequestsController],
  providers: [RequestsService],
  exports: [RequestsService],
})
export class RequestsModule {}
