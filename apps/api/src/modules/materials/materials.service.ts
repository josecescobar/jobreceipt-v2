import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateMaterialItemDto } from './dto/create-material-item.dto';
import { UpdateMaterialItemDto } from './dto/update-material-item.dto';
import { QueryMaterialItemDto } from './dto/query-material-item.dto';
import { LogMaterialUsageDto } from './dto/log-material-usage.dto';
import { MaterialCategory } from '@prisma/client';

@Injectable()
export class MaterialsService {
  constructor(private prisma: PrismaService) {}

  async create(orgId: string, userId: string, data: CreateMaterialItemDto) {
    return this.prisma.materialItem.create({
      data: {
        organization: { connect: { id: orgId } },
        job: { connect: { id: data.jobId } },
        createdBy: { connect: { id: userId } },
        name: data.name,
        sku: data.sku,
        unit: data.unit ?? 'ea',
        unitCost: data.unitCost,
        ...(data.category
          ? { category: data.category as MaterialCategory }
          : {}),
        ...(data.costCodeId
          ? { costCode: { connect: { id: data.costCodeId } } }
          : {}),
        purchasedQty: data.purchasedQty ?? 0,
        notes: data.notes,
      },
      include: {
        job: { select: { id: true, name: true } },
        costCode: { select: { id: true, code: true, name: true } },
        createdBy: { select: { id: true, name: true } },
        _count: { select: { usageLogs: true } },
      },
    });
  }

  async findAll(orgId: string, query: QueryMaterialItemDto) {
    const where: any = {
      organizationId: orgId,
    };

    if (query.jobId) where.jobId = query.jobId;
    if (query.category) where.category = query.category as MaterialCategory;
    if (query.search) {
      where.name = { contains: query.search, mode: 'insensitive' };
    }

    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const [data, total] = await Promise.all([
      this.prisma.materialItem.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          job: { select: { id: true, name: true } },
          costCode: { select: { id: true, code: true, name: true } },
          _count: { select: { usageLogs: true } },
        },
      }),
      this.prisma.materialItem.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  async findOne(orgId: string, id: string) {
    const item = await this.prisma.materialItem.findFirst({
      where: { id, organizationId: orgId },
      include: {
        job: { select: { id: true, name: true } },
        costCode: { select: { id: true, code: true, name: true } },
        createdBy: { select: { id: true, name: true } },
        usageLogs: {
          orderBy: { loggedAt: 'desc' },
          take: 20,
          include: {
            loggedBy: { select: { id: true, name: true } },
          },
        },
      },
    });

    if (!item) throw new NotFoundException('Material item not found');
    return item;
  }

  async update(orgId: string, id: string, data: UpdateMaterialItemDto) {
    const existing = await this.prisma.materialItem.findFirst({
      where: { id, organizationId: orgId },
    });

    if (!existing) throw new NotFoundException('Material item not found');

    const updateData: any = {};

    if (data.name !== undefined) updateData.name = data.name;
    if (data.sku !== undefined) updateData.sku = data.sku;
    if (data.unit !== undefined) updateData.unit = data.unit;
    if (data.unitCost !== undefined) updateData.unitCost = data.unitCost;
    if (data.category !== undefined) {
      updateData.category = data.category as MaterialCategory;
    }
    if (data.purchasedQty !== undefined)
      updateData.purchasedQty = data.purchasedQty;
    if (data.notes !== undefined) updateData.notes = data.notes;
    if (data.jobId !== undefined) {
      updateData.job = { connect: { id: data.jobId } };
    }
    if (data.costCodeId !== undefined) {
      updateData.costCode = data.costCodeId
        ? { connect: { id: data.costCodeId } }
        : { disconnect: true };
    }

    return this.prisma.materialItem.update({
      where: { id },
      data: updateData,
      include: {
        job: { select: { id: true, name: true } },
        costCode: { select: { id: true, code: true, name: true } },
        createdBy: { select: { id: true, name: true } },
        _count: { select: { usageLogs: true } },
      },
    });
  }

  async remove(orgId: string, id: string) {
    const item = await this.prisma.materialItem.findFirst({
      where: { id, organizationId: orgId },
    });

    if (!item) throw new NotFoundException('Material item not found');

    return this.prisma.materialItem.delete({ where: { id } });
  }

  async logUsage(orgId: string, userId: string, data: LogMaterialUsageDto) {
    const material = await this.prisma.materialItem.findFirst({
      where: { id: data.materialItemId, organizationId: orgId },
    });

    if (!material) throw new NotFoundException('Material item not found');

    const jobId = data.jobId || material.jobId;

    const [log] = await this.prisma.$transaction([
      this.prisma.materialUsageLog.create({
        data: {
          materialItem: { connect: { id: data.materialItemId } },
          job: { connect: { id: jobId } },
          loggedBy: { connect: { id: userId } },
          qty: data.qty,
          notes: data.notes,
        },
        include: {
          loggedBy: { select: { id: true, name: true } },
        },
      }),
      this.prisma.materialItem.update({
        where: { id: data.materialItemId },
        data: {
          usedQty: { increment: data.qty },
        },
      }),
    ]);

    return log;
  }

  async getJobSummary(orgId: string, jobId: string) {
    const items = await this.prisma.materialItem.findMany({
      where: { organizationId: orgId, jobId },
      select: {
        unitCost: true,
        purchasedQty: true,
        usedQty: true,
        category: true,
      },
    });

    const totalItems = items.length;
    const totalValue = items.reduce(
      (sum, item) => sum + item.purchasedQty * item.unitCost,
      0,
    );
    const totalUsedValue = items.reduce(
      (sum, item) => sum + item.usedQty * item.unitCost,
      0,
    );

    const categoryMap = new Map<
      string,
      { count: number; value: number }
    >();
    for (const item of items) {
      const cat = item.category || 'OTHER';
      const existing = categoryMap.get(cat) || { count: 0, value: 0 };
      existing.count += 1;
      existing.value += item.purchasedQty * item.unitCost;
      categoryMap.set(cat, existing);
    }

    const categories = Array.from(categoryMap.entries()).map(
      ([category, data]) => ({
        category,
        count: data.count,
        value: data.value,
      }),
    );

    return { totalItems, totalValue, totalUsedValue, categories };
  }

  async getInventorySummary(orgId: string) {
    const items = await this.prisma.materialItem.findMany({
      where: { organizationId: orgId },
      select: {
        unitCost: true,
        purchasedQty: true,
        usedQty: true,
        category: true,
      },
    });

    const totalItems = items.length;
    const totalValue = items.reduce(
      (sum, item) => sum + item.purchasedQty * item.unitCost,
      0,
    );
    const totalUsedValue = items.reduce(
      (sum, item) => sum + item.usedQty * item.unitCost,
      0,
    );

    // Low stock: usedQty >= purchasedQty * 0.8
    const lowStockItems = items.filter(
      (item) =>
        item.purchasedQty > 0 && item.usedQty >= item.purchasedQty * 0.8,
    ).length;

    const categoryMap = new Map<
      string,
      { count: number; value: number }
    >();
    for (const item of items) {
      const cat = item.category || 'OTHER';
      const existing = categoryMap.get(cat) || { count: 0, value: 0 };
      existing.count += 1;
      existing.value += item.purchasedQty * item.unitCost;
      categoryMap.set(cat, existing);
    }

    const categories = Array.from(categoryMap.entries()).map(
      ([category, data]) => ({
        category,
        count: data.count,
        value: data.value,
      }),
    );

    return {
      totalItems,
      totalValue,
      totalUsedValue,
      lowStockItems,
      categories,
    };
  }
}
