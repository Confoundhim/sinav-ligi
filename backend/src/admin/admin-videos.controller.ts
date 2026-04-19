import {
  Controller,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiOkResponse,
  ApiParam,
  ApiProperty,
} from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { Roles } from '../auth/decorators/roles.decorator';
import { AdminVideosService } from './admin-videos.service';

class CreateVideoDto {
  @ApiProperty() questionTypeId: string = '';
  @ApiProperty() title: string = '';
  @ApiProperty() videoUrl: string = '';
  @ApiProperty({ required: false }) thumbnailUrl?: string;
  @ApiProperty() duration: number = 0;
  @ApiProperty() sortOrder: number = 0;
}

class UpdateVideoDto {
  title?: string;
  videoUrl?: string;
  thumbnailUrl?: string;
  duration?: number;
  sortOrder?: number;
  isActive?: boolean;
}

@ApiTags('Admin - Videolar')
@ApiBearerAuth()
@Controller('admin/videos')
@Roles(UserRole.ADMIN)
export class AdminVideosController {
  constructor(private readonly adminVideosService: AdminVideosService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Video ekle' })
  @ApiOkResponse({ description: 'Video oluşturuldu' })
  create(@Body() dto: CreateVideoDto) {
    return this.adminVideosService.create(dto);
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Video güncelle' })
  @ApiParam({ name: 'id', description: 'Video ID' })
  @ApiOkResponse({ description: 'Video güncellendi' })
  update(@Param('id') id: string, @Body() dto: UpdateVideoDto) {
    return this.adminVideosService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Video sil' })
  @ApiParam({ name: 'id', description: 'Video ID' })
  @ApiOkResponse({ description: 'Video silindi' })
  remove(@Param('id') id: string) {
    return this.adminVideosService.remove(id);
  }
}
