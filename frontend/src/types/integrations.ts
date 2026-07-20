export const WebhookStatus = {
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
  FAILED: 'FAILED',
} as const;

export type WebhookStatus = (typeof WebhookStatus)[keyof typeof WebhookStatus];

export interface ApiKey {
  id: string;
  company_id: string;
  name: string;
  prefix: string;
  is_active: boolean;
  created_at: string;
  expires_at?: string;
}

export interface Webhook {
  id: string;
  company_id: string;
  url: string;
  events: string[];
  status: WebhookStatus;
  created_at: string;
  updated_at?: string;
}

export interface EdiConfiguration {
  id: string;
  company_id: string;
  partner_id?: string;
  isa_sender_id: string;
  isa_receiver_id: string;
  qualifier: string;
  created_at: string;
  updated_at?: string;
}
