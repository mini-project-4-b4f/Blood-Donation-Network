import { Global, Module } from '@nestjs/common';
import { AppLogger } from './app-logger.service';
import { ClockService } from './clock.service';

@Global()
@Module({
  providers: [ClockService, AppLogger],
  exports: [ClockService, AppLogger],
})
export class CommonModule {}
