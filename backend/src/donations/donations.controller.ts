import { Body, Controller, Param, Post, Req } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Role } from '@prisma/client';

import { Roles } from '../auth/decorators/roles.decorator';
import { AuthenticatedRequest } from '../auth/auth.types';
import { RequestIdParamDto } from '../requests/dto/request-id-param.dto';

import { DonationsService } from './donations.service';
import { RecordDonationDto } from './dto/record-donation.dto';

@ApiTags('Donations')
@Controller('requests/:id/donations')
export class DonationsController {
  constructor(private readonly donationsService: DonationsService) {}

  @Post()
  @Roles(Role.COORDINATOR)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Record a donation for a blood request',
  })
  @ApiResponse({
    status: 201,
    description: 'Donation recorded successfully.',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid donation data or donor eligibility.',
  })
  @ApiResponse({
    status: 404,
    description: 'Blood request or donor not found.',
  })
  @ApiResponse({
    status: 409,
    description: 'Request is no longer available for donations.',
  })
  recordDonation(
    @Param() params: RequestIdParamDto,
    @Req() request: AuthenticatedRequest,
    @Body() dto: RecordDonationDto,
  ) {
    return this.donationsService.recordDonation(
      params.id,
      request.user!.id,
      dto,
    );
  }
}
