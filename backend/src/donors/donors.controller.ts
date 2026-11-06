import {
  Body,
  Controller,
  Get,
  Patch,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AuthenticatedUser } from '../auth/auth.types';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { UpdateDonorProfileDto } from './dto/update-donor-profile.dto';
import { DonorsService } from './donors.service';

@ApiTags('Donors')
@Controller('donors')
export class DonorsController {
  constructor(private readonly donorsService: DonorsService) {}

  @Get('me')
  @Roles('DONOR')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get the signed-in donor profile and history' })
  @ApiResponse({ status: 200, description: 'The donor dashboard profile.' })
  @ApiResponse({ status: 403, description: 'The account is not a donor.' })
  @ApiResponse({ status: 404, description: 'Donor not found.' })
  getMyProfile(@CurrentUser() user: AuthenticatedUser) {
    return this.donorsService.getMyProfile(user.id);
  }

  @Patch('me')
  @Roles('DONOR')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update the signed-in donor profile' })
  @ApiResponse({ status: 200, description: 'The updated donor profile.' })
  @ApiResponse({ status: 400, description: 'Invalid profile data or area.' })
  @ApiResponse({ status: 403, description: 'The account is not a donor.' })
  @ApiResponse({ status: 409, description: 'The phone number is already used.' })
  updateMyProfile(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateDonorProfileDto,
  ) {
    return this.donorsService.updateMyProfile(user.id, dto);
  }

  @Patch('me/deactivate')
  @Roles('DONOR')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Deactivate the signed-in donor account' })
  @ApiResponse({
    status: 200,
    description: 'The account has been deactivated.',
  })
  @ApiResponse({ status: 403, description: 'The account is not a donor.' })
  @ApiResponse({ status: 404, description: 'Donor not found.' })
  deactivateMyAccount(@CurrentUser() user: AuthenticatedUser) {
    return this.donorsService.deactivateMyAccount(user.id);
  }

  @Get('me/eligible-requests')
  @Roles('DONOR')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List requests the donor can help with' })
  @ApiResponse({ status: 200, description: 'Eligible open requests.' })
  @ApiResponse({ status: 403, description: 'The account is not a donor.' })
  @ApiResponse({ status: 404, description: 'Donor not found.' })
  getMyEligibleRequests(@CurrentUser() user: AuthenticatedUser) {
    return this.donorsService.getMyEligibleRequests(user.id);
  }

  @Get()
  @Roles('COORDINATOR')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List donor profiles for coordinators' })
  @ApiResponse({ status: 200, description: 'Donors ordered by name.' })
  @ApiResponse({
    status: 403,
    description: 'The account is not a coordinator.',
  })
  getAllDonors() {
    return this.donorsService.findAllDonors();
  }
}
