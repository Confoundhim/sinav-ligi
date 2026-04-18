import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { HealthService } from './health.service';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  @ApiOperation({ summary: 'Application health status' })
  @ApiOkResponse({
    description: 'Returns application, database and redis status.',
  })
  getHealth() {
    return this.healthService.getHealth();
  }
}
