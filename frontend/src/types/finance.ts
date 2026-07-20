export enum InvoiceStatus {
  DRAFT = 'DRAFT',
  ISSUED = 'ISSUED',
  PAID = 'PAID',
  OVERDUE = 'OVERDUE',
  VOID = 'VOID',
}

export enum SettlementStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  PAID = 'PAID',
  DISPUTED = 'DISPUTED',
}

export interface FinancialAccount {
  id: string;
  company_id: string;
  account_type: string;
  balance: number;
  currency: string;
  created_at: string;
  updated_at?: string;
}

export interface Invoice {
  id: string;
  invoice_number: string;
  shipper_id: string;
  shipment_id?: string;
  amount: number;
  status: InvoiceStatus;
  due_date?: string;
  pdf_url?: string;
  created_at: string;
  updated_at?: string;
}

export interface SettlementLineItem {
  id: string;
  settlement_id: string;
  description: string;
  amount: number;
  type: string;
}

export interface Settlement {
  id: string;
  carrier_id: string;
  shipment_id?: string;
  total_amount: number;
  status: SettlementStatus;
  payment_method?: string;
  payment_reference?: string;
  created_at: string;
  updated_at?: string;
  line_items?: SettlementLineItem[];
}
