import api from '../../core/api';

export interface Company {
  id: string;
  name: string;
  type: string;
}

export interface AssignmentResponse {
  id: string;
  shipment_id: string;
  broker_id: string;
  partner_id: string;
  status: string;
  assigned_at: string;
  responded_at?: string;
  notes?: string;
  broker?: Company;
  partner?: Company;
}

export const PartnerAssignmentAPI = {
  getAvailablePartners: async () => {
    // Usually Broker gets their connected partners from PartnershipAPI
    const res = await api.get<Company[]>('/transportation-partners');
    return res.data;
  },
  
  assignPartner: async (shipmentId: string, partnerId: string, notes?: string) => {
    const res = await api.post<AssignmentResponse>(`/shipments/${shipmentId}/assign-partner`, {
      partner_id: partnerId,
      notes
    });
    return res.data;
  },
  
  getMyAssignments: async () => {
    const res = await api.get<AssignmentResponse[]>('/partner-assignments/me');
    return res.data;
  },
  
  acceptAssignment: async (assignmentId: string) => {
    const res = await api.post<AssignmentResponse>(`/partner-assignments/${assignmentId}/accept`);
    return res.data;
  },
  
  rejectAssignment: async (assignmentId: string) => {
    const res = await api.post<AssignmentResponse>(`/partner-assignments/${assignmentId}/reject`);
    return res.data;
  },
  
  cancelAssignment: async (assignmentId: string) => {
    const res = await api.post<AssignmentResponse>(`/partner-assignments/${assignmentId}/cancel`);
    return res.data;
  }
};
