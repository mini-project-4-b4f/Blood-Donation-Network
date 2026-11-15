import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Role } from '@prisma/client';

import { Public } from '../auth/decorators/public.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { AuthenticatedRequest } from '../auth/auth.types';

import { RequestsService } from './requests.service';
import { CreateRequestDto } from './dto/create-request.dto';
import { UpdateRequestDto } from './dto/update-request.dto';
import { CancelRequestDto } from './dto/cancel-request.dto';
import { RequestFiltersQueryDto } from './dto/request-filters-query.dto';
import { RequestIdParamDto } from './dto/request-id-param.dto';

@ApiTags('Requests')
@Controller('requests')
export class RequestsController {
  constructor(private readonly requestsService: RequestsService) {}

  @Public()
  @Get('sos')
  @ApiOperation({ summary: 'Get public SOS blood requests' })
  @ApiResponse({
    status: 200,
    description: 'Public SOS requests retrieved successfully.',
  })
  getSosRequests() {
    return this.requestsService.getPublicSosRequests();
  }

  @Post()
  @Roles(Role.COORDINATOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a blood request' })
  @ApiResponse({ status: 201, description: 'Request created successfully.' })
  @ApiResponse({ status: 400, description: 'Invalid request data.' })
  createRequest(
    @Req() request: AuthenticatedRequest,
    @Body() dto: CreateRequestDto,
  ) {
    return this.requestsService.createRequest(request.user!.id, dto);
  }

  @Get()
  @Roles(Role.COORDINATOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get blood requests with optional filters' })
  @ApiResponse({ status: 200, description: 'Requests retrieved successfully.' })
  getRequests(@Query() filters: RequestFiltersQueryDto) {
    return this.requestsService.findAllRequests(filters);
  }

  @Get(':id/eligible-donors')
  @Roles(Role.COORDINATOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get eligible donors for a blood request' })
  @ApiResponse({ status: 200, description: 'Eligible donors retrieved.' })
  @ApiResponse({ status: 404, description: 'Blood request not found.' })
  getEligibleDonors(@Param() params: RequestIdParamDto) {
    return this.requestsService.getEligibleDonors(params.id);
  }

  @Get(':id')
  @Roles(Role.COORDINATOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get a blood request by ID' })
  @ApiResponse({ status: 200, description: 'Request retrieved successfully.' })
  @ApiResponse({ status: 404, description: 'Blood request not found.' })
  getRequestById(@Param() params: RequestIdParamDto) {
    return this.requestsService.findRequestById(params.id);
  }

  @Patch(':id')
  @Roles(Role.COORDINATOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update an open blood request' })
  @ApiResponse({ status: 200, description: 'Request updated successfully.' })
  @ApiResponse({ status: 404, description: 'Blood request not found.' })
  @ApiResponse({ status: 409, description: 'Request is not open.' })
  updateRequest(
    @Param() params: RequestIdParamDto,
    @Body() dto: UpdateRequestDto,
  ) {
    return this.requestsService.updateRequest(params.id, dto);
  }

  @Patch(':id/cancel')
  @Roles(Role.COORDINATOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cancel an open blood request' })
  @ApiResponse({ status: 200, description: 'Request cancelled successfully.' })
  @ApiResponse({ status: 404, description: 'Blood request not found.' })
  @ApiResponse({ status: 409, description: 'Request is not open.' })
  cancelRequest(
    @Param() params: RequestIdParamDto,
    @Body() dto: CancelRequestDto,
  ) {
    return this.requestsService.cancelRequest(params.id, dto);
  }
}
