import api from '../../core/api';

export interface CompanyShort {
  id: string;
  name: string;
  type: string;
  dot_number?: string;
  mc_number?: string;
}

export interface LoadShort {
  id: string;
  title?: string;
  origin_address: string;
  destination_address: string;
  status: string;
  rate: number;
  equipment_type?: string;
}

export type InvoiceRelationshipType =
  | 'BROKER_TO_SHIPPER'
  | 'CARRIER_TO_SHIPPER'
  | 'OWNER_OPERATOR_TO_SHIPPER'
  | 'CARRIER_TO_BROKER'
  | 'OWNER_OPERATOR_TO_BROKER'
  | 'OWNER_OPERATOR_TO_CARRIER';

export type InvoiceStatus = 'DRAFT' | 'ISSUED' | 'PAID' | 'OVERDUE' | 'VOID';

export interface Invoice {
  id: string;
  invoice_number: string;
  issuer_company_id: string;
  recipient_company_id: string;
  relationship_type: InvoiceRelationshipType;
  load_id?: string;
  shipment_id?: string;
  linehaul_amount: number;
  fuel_surcharge: number;
  accessorials_amount: number;
  tax_amount: number;
  amount: number;
  status: InvoiceStatus;
  due_date?: string;
  paid_at?: string;
  notes?: string;
  pdf_url?: string;
  created_at: string;
  updated_at?: string;
  issuer_company?: CompanyShort;
  recipient_company?: CompanyShort;
  load?: LoadShort;
}

export interface CreateInvoicePayload {
  recipient_company_id: string;
  relationship_type: InvoiceRelationshipType;
  load_id?: string;
  shipment_id?: string;
  linehaul_amount: number;
  fuel_surcharge?: number;
  accessorials_amount?: number;
  tax_amount?: number;
  due_date?: string;
  notes?: string;
}

export const getInvoices = async (side?: 'ISSUED' | 'RECEIVED'): Promise<Invoice[]> => {
  const params = side ? { side } : {};
  const res = await api.get('/finance/invoices', { params });
  return res.data;
};

export const createInvoice = async (payload: CreateInvoicePayload): Promise<Invoice> => {
  const res = await api.post('/finance/invoices', payload);
  return res.data;
};

export const updateInvoiceStatus = async (
  invoiceId: string,
  status: InvoiceStatus,
  notes?: string
): Promise<Invoice> => {
  const res = await api.patch(`/finance/invoices/${invoiceId}/status`, { status, notes });
  return res.data;
};

export const getCompanyLoads = async (): Promise<any[]> => {
  const res = await api.get('/loads');
  return res.data;
};

export const getPartnershipNetwork = async (): Promise<any[]> => {
  const res = await api.get('/partnerships');
  return res.data;
};
