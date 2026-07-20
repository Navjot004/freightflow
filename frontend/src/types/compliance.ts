export const ComplianceType = {
  INSURANCE_LIABILITY: 'INSURANCE_LIABILITY',
  INSURANCE_CARGO: 'INSURANCE_CARGO',
  FMCSA_AUTHORITY: 'FMCSA_AUTHORITY',
  DOT_REGISTRATION: 'DOT_REGISTRATION',
  DRIVER_LICENSE: 'DRIVER_LICENSE',
} as const;

export type ComplianceType = (typeof ComplianceType)[keyof typeof ComplianceType];

export const ComplianceStatus = {
  VALID: 'VALID',
  EXPIRED: 'EXPIRED',
  PENDING_VERIFICATION: 'PENDING_VERIFICATION',
  REJECTED: 'REJECTED',
} as const;

export type ComplianceStatus = (typeof ComplianceStatus)[keyof typeof ComplianceStatus];

export interface ComplianceRecord {
  id: string;
  company_id: string;
  type: ComplianceType;
  identifier?: string;
  status: ComplianceStatus;
  issue_date?: string;
  expiry_date?: string;
  document_url?: string;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
}
