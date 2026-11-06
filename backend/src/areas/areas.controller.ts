import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Public } from '../auth/decorators/public.decorator';
import { AreaItem } from '../auth/auth.types';
import { AreasService } from './areas.service';

@ApiTags('Areas')
@Controller('areas')
export class AreasController {
  constructor(private readonly areasService: AreasService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'List all supported areas (public)' })
  @ApiResponse({ status: 200, description: 'Areas ordered alphabetically by name.' })
  getAreas(): Promise<AreaItem[]> {
    return this.areasService.findAll();
  }
}
