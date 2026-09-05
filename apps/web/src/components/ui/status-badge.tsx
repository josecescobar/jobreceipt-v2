import { Badge } from './badge';

const STATUS_STYLES: Record<string, string> = {
  PROCESSING: 'border-transparent bg-amber-100 text-amber-800',
  REVIEW: 'border-transparent bg-blue-100 text-blue-800',
  APPROVED: 'border-transparent bg-green-100 text-green-800',
  REJECTED: 'border-transparent bg-red-100 text-red-800',
  ACTIVE: 'border-transparent bg-green-100 text-green-800',
  COMPLETED: 'border-transparent bg-blue-100 text-blue-800',
  ARCHIVED: 'border-transparent bg-gray-100 text-gray-800',
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <Badge className={STATUS_STYLES[status] ?? ''}>
      {status}
    </Badge>
  );
}
