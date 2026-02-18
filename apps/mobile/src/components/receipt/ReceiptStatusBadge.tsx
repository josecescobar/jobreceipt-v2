import React from 'react';
import { Badge } from '../ui';
import { useTheme, getReceiptStatusColor } from '../../theme';

interface ReceiptStatusBadgeProps {
  status: string;
}

const STATUS_LABELS: Record<string, string> = {
  PROCESSING: 'Processing',
  REVIEW: 'Review',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
};

export function ReceiptStatusBadge({ status }: ReceiptStatusBadgeProps) {
  const { colors } = useTheme();

  return (
    <Badge
      label={STATUS_LABELS[status] || status}
      color="#FFFFFF"
      backgroundColor={getReceiptStatusColor(status, colors)}
    />
  );
}
