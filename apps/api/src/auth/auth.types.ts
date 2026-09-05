export interface ClerkEmailAddress {
  id: string;
  email_address: string;
}

export interface ClerkUserPayload {
  id: string;
  first_name?: string | null;
  last_name?: string | null;
  phone_numbers?: Array<{ phone_number: string }>;
  email_addresses?: ClerkEmailAddress[];
  primary_email_address_id?: string | null;
}

export interface ClerkWebhookEvent {
  type: string;
  data: ClerkUserPayload;
}
