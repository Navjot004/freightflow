import api from '../../core/api';

export interface Company {
  id: string;
  name: string;
  type: string;
}

export interface CarrierProfile {
  fleet_size: number;
  equipment_types: string[];
  operating_regions: string[];
  logo_url?: string;
}

export interface PartnerDirectoryItem {
  company: Company;
  profile?: CarrierProfile;
  vehicle?: any; // Owner operator vehicle
  partnership_status?: string;
  partnership_id?: string;
  rating: number;
  completed_shipments: number;
  acceptance_rate: number;
  on_time_percentage: number;
}

export interface PartnershipResponse {
  id: string;
  broker_company_id: string;
  partner_company_id: string;
  partner_type: string;
  status: string;
  request_message?: string;
  created_at: string;
  accepted_at?: string;
  broker?: Company;
  partner?: Company;
}

export const PartnershipAPI = {
  getDirectory: async () => {
    const res = await api.get<PartnerDirectoryItem[]>('/transportation-partners');
    return res.data;
  },
  
  sendRequest: async (partner_company_id: string, request_message?: string) => {
    const res = await api.post<PartnershipResponse>('/transportation-partnerships/request', {
      partner_company_id,
      request_message
    });
    return res.data;
  },
  
  acceptRequest: async (id: string) => {
    const res = await api.post<PartnershipResponse>(`/transportation-partnerships/${id}/accept`);
    return res.data;
  },
  
  rejectRequest: async (id: string) => {
    const res = await api.post<PartnershipResponse>(`/transportation-partnerships/${id}/reject`);
    return res.data;
  },
  
  removePartnership: async (id: string) => {
    const res = await api.post<PartnershipResponse>(`/transportation-partnerships/${id}/remove`);
    return res.data;
  },
  
  getRequests: async () => {
    const res = await api.get<PartnershipResponse[]>('/transportation-partnerships');
    return res.data;
  },
  
  getNetwork: async () => {
    const res = await api.get<PartnerDirectoryItem[]>('/transportation-partnerships/network');
    return res.data;
  },
  
  getConnectedBrokers: async () => {
    const res = await api.get<PartnershipResponse[]>('/transportation-partnerships/connected-brokers');
    return res.data;
  }
};
