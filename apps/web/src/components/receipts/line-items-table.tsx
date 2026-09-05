'use client';

import type { ReceiptLineItem } from '@/lib/api/types';
import { formatMoney } from '@/lib/money';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

export function LineItemsTable({ items }: { items: ReceiptLineItem[] }) {
  if (items.length === 0) {
    return (
      <p className="py-4 text-center text-sm text-muted-foreground">
        No line items extracted.
      </p>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Description</TableHead>
          <TableHead className="text-right">Qty</TableHead>
          <TableHead className="text-right">Unit Price</TableHead>
          <TableHead className="text-right">Total</TableHead>
          <TableHead>Category</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((item) => (
          <TableRow key={item.id}>
            <TableCell>
              <div className="flex items-center gap-2">
                {item.isConstructionMaterial && (
                  <span className="inline-block h-2 w-2 rounded-full bg-green-500" title="Construction material" />
                )}
                <span className="text-sm">{item.description}</span>
              </div>
              {item.sku && (
                <span className="text-xs text-muted-foreground">
                  SKU: {item.sku}
                </span>
              )}
            </TableCell>
            <TableCell className="text-right">{item.quantity}</TableCell>
            <TableCell className="text-right">
              {formatMoney(item.unitPriceCents)}
            </TableCell>
            <TableCell className="text-right font-medium">
              {formatMoney(item.totalPriceCents)}
            </TableCell>
            <TableCell>
              {item.materialCategory && (
                <Badge variant="secondary" className="text-xs">
                  {item.materialCategory}
                </Badge>
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
