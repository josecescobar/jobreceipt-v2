import { appSchema, tableSchema } from '@nozbe/watermelondb';

export const schema = appSchema({
  version: 1,
  tables: [
    tableSchema({
      name: 'receipts',
      columns: [
        { name: 'server_id', type: 'string', isIndexed: true },
        { name: 'organization_id', type: 'string', isIndexed: true },
        { name: 'status', type: 'string' },
        { name: 'merchant_name', type: 'string', isOptional: true },
        { name: 'total_amount', type: 'number', isOptional: true },
        { name: 'tax_amount', type: 'number', isOptional: true },
        { name: 'subtotal_amount', type: 'number', isOptional: true },
        { name: 'transaction_date', type: 'string', isOptional: true },
        { name: 'image_url', type: 'string', isOptional: true },
        { name: 'thumbnail_url', type: 'string', isOptional: true },
        { name: 'local_image_uri', type: 'string', isOptional: true },
        { name: 'ocr_data', type: 'string', isOptional: true },
        { name: 'suggested_job_id', type: 'string', isOptional: true },
        { name: 'confidence_score', type: 'number', isOptional: true },
        { name: 'is_synced', type: 'boolean' },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),
    tableSchema({
      name: 'jobs',
      columns: [
        { name: 'server_id', type: 'string', isIndexed: true },
        { name: 'organization_id', type: 'string', isIndexed: true },
        { name: 'name', type: 'string' },
        { name: 'customer_name', type: 'string', isOptional: true },
        { name: 'status', type: 'string' },
        { name: 'total_budget', type: 'number', isOptional: true },
        { name: 'materials_budget', type: 'number', isOptional: true },
        { name: 'labor_budget', type: 'number', isOptional: true },
        { name: 'equipment_budget', type: 'number', isOptional: true },
        { name: 'subcontractor_budget', type: 'number', isOptional: true },
        { name: 'overhead_budget', type: 'number', isOptional: true },
        { name: 'notes', type: 'string', isOptional: true },
        { name: 'is_synced', type: 'boolean' },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),
    tableSchema({
      name: 'expenses',
      columns: [
        { name: 'server_id', type: 'string', isIndexed: true },
        { name: 'organization_id', type: 'string', isIndexed: true },
        { name: 'job_id', type: 'string', isOptional: true, isIndexed: true },
        { name: 'receipt_id', type: 'string', isOptional: true },
        { name: 'amount', type: 'number' },
        { name: 'description', type: 'string', isOptional: true },
        { name: 'category', type: 'string', isOptional: true },
        { name: 'tax_category', type: 'string', isOptional: true },
        { name: 'mileage', type: 'number', isOptional: true },
        { name: 'date', type: 'string', isOptional: true },
        { name: 'is_synced', type: 'boolean' },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),
    tableSchema({
      name: 'pending_actions',
      columns: [
        { name: 'action_type', type: 'string' }, // create, update, delete
        { name: 'entity_type', type: 'string' }, // receipt, job, expense
        { name: 'entity_id', type: 'string', isIndexed: true },
        { name: 'payload', type: 'string' }, // JSON serialized
        { name: 'status', type: 'string' }, // pending, processing, done, failed
        { name: 'retry_count', type: 'number' },
        { name: 'error', type: 'string', isOptional: true },
        { name: 'created_at', type: 'number' },
      ],
    }),
  ],
});
