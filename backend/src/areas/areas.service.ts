import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AreaItem } from '../auth/auth.types';

@Injectable()
export class AreasService {
  constructor(private readonly prisma: PrismaService) {}

  /** All supported areas ordered alphabetically by name. */
  async findAll(): Promise<AreaItem[]> {
    return this.prisma.area.findMany({
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    });
  }

  /** Returns the area or throws `400 Selected area is not supported.` */
  async findByIdOrThrow(areaId: string): Promise<AreaItem> {
    const area = await this.prisma.area.findUnique({
      where: { id: areaId },
      select: { id: true, name: true },
    });
    if (!area) throw new BadRequestException('Selected area is not supported.');
    return area;
  }
}
