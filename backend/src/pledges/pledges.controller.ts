import {
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AuthenticatedUser } from '../auth/auth.types';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { PledgeIdParamDto } from './dto/pledge-id-param.dto';
import { PledgesService } from './pledges.service';

@ApiTags('Pledges')
@Controller()
export class PledgesController {
  constructor(private readonly pledgesService: PledgesService) {}

  @Post('requests/:id/pledges')
  @Roles('DONOR')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Pledge to an eligible open request' })
  @ApiParam({ name: 'id', description: 'Blood request identifier.' })
  @ApiResponse({ status: 201, description: 'The active donor pledge.' })
  @ApiResponse({ status: 400, description: 'The donor is not eligible.' })
  @ApiResponse({ status: 403, description: 'The account is not a donor.' })
  @ApiResponse({ status: 404, description: 'Request or donor not found.' })
  @ApiResponse({ status: 409, description: 'A pledge rule was violated.' })
  @HttpCode(HttpStatus.CREATED)
  createPledge(
    @Param() params: PledgeIdParamDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.pledgesService.createPledge(params.id, user.id);
  }

  @Patch('pledges/:id/withdraw')
  @Roles('DONOR')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Withdraw the signed-in donor’s active pledge' })
  @ApiParam({ name: 'id', description: 'Pledge identifier.' })
  @ApiResponse({
    status: 200,
    description: 'The pledge status is WITHDRAWN.',
  })
  @ApiResponse({ status: 403, description: 'The pledge belongs to another donor.' })
  @ApiResponse({ status: 404, description: 'Pledge not found.' })
  @ApiResponse({ status: 409, description: 'The pledge is not active.' })
  @HttpCode(HttpStatus.OK)
  withdrawPledge(
    @Param() params: PledgeIdParamDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.pledgesService.withdrawPledge(params.id, user.id);
  }
}
