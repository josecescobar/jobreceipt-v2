import { BadRequestException } from '@nestjs/common';
import { ReceiptsService } from './receipts.service';
import { BulkAction } from './dto/bulk-action.dto';

function createService() {
  const updateMany = jest.fn().mockResolvedValue({ count: 0 });
  const deleteMany = jest.fn().mockResolvedValue({ count: 0 });

  const prisma = {
    receipt: { updateMany, deleteMany },
  };

  const requestContext = {
    getOrganizationId: jest.fn().mockReturnValue('org_1'),
  };

  const service = new ReceiptsService(
    prisma as never,
    requestContext as never,
    {} as never,
    {} as never,
  );

  return { service, prisma, requestContext };
}

describe('ReceiptsService', () => {
  describe('bulkAction', () => {
    it('approves receipts by updating status', async () => {
      const { service, prisma } = createService();
      prisma.receipt.updateMany.mockResolvedValue({ count: 2 });

      const result = await service.bulkAction({
        receiptIds: ['r1', 'r2'],
        action: BulkAction.APPROVE,
      });

      expect(prisma.receipt.updateMany).toHaveBeenCalledWith({
        where: { id: { in: ['r1', 'r2'] }, organizationId: 'org_1' },
        data: { status: 'APPROVED' },
      });
      expect(result).toEqual({ affected: 2 });
    });

    it('rejects receipts by updating status', async () => {
      const { service, prisma } = createService();
      prisma.receipt.updateMany.mockResolvedValue({ count: 3 });

      const result = await service.bulkAction({
        receiptIds: ['r1', 'r2', 'r3'],
        action: BulkAction.REJECT,
      });

      expect(prisma.receipt.updateMany).toHaveBeenCalledWith({
        where: { id: { in: ['r1', 'r2', 'r3'] }, organizationId: 'org_1' },
        data: { status: 'REJECTED' },
      });
      expect(result).toEqual({ affected: 3 });
    });

    it('deletes receipts', async () => {
      const { service, prisma } = createService();
      prisma.receipt.deleteMany.mockResolvedValue({ count: 1 });

      const result = await service.bulkAction({
        receiptIds: ['r1'],
        action: BulkAction.DELETE,
      });

      expect(prisma.receipt.deleteMany).toHaveBeenCalledWith({
        where: { id: { in: ['r1'] }, organizationId: 'org_1' },
      });
      expect(result).toEqual({ affected: 1 });
    });

    it('scopes all actions to the current organization', async () => {
      const { service, prisma, requestContext } = createService();
      requestContext.getOrganizationId.mockReturnValue('org_other');
      prisma.receipt.updateMany.mockResolvedValue({ count: 0 });

      await service.bulkAction({
        receiptIds: ['r1'],
        action: BulkAction.APPROVE,
      });

      expect(prisma.receipt.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ organizationId: 'org_other' }),
        }),
      );
    });

    it('throws when no organization is set', async () => {
      const { service, requestContext } = createService();
      requestContext.getOrganizationId.mockReturnValue(null);

      await expect(
        service.bulkAction({
          receiptIds: ['r1'],
          action: BulkAction.APPROVE,
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
