import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { AreasModule } from './areas/areas.module';
import { AuthModule } from './auth/auth.module';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { RolesGuard } from './auth/guards/roles.guard';
import { CommonModule } from './common/common.module';
import { DonationsModule } from './donations/donations.module';
import { DonorsModule } from './donors/donors.module';
import { MatchingModule } from './matching/matching.module';
import { PledgesModule } from './pledges/pledges.module';
import { PrismaModule } from './prisma/prisma.module';
import { RequestsModule } from './requests/requests.module';

@Module({
  imports: [
    PrismaModule,
    CommonModule,
    AreasModule,
    AuthModule,
    MatchingModule,
    RequestsModule,
    DonationsModule,
    DonorsModule,
    PledgesModule,
  ],
  providers: [
    // Order matters: JwtAuthGuard runs first, then RolesGuard.
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}
