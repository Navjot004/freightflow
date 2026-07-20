import api from '../../core/api';

export const ShipmentAPI = {
  updateStatus: async (shipmentId: string, status: string) => {
    const formData = new FormData();
    formData.append('status', status);
    const res = await api.patch(`/shipments/${shipmentId}/status`, formData);
    return res.data;
  },

  assignDriver: async (shipmentId: string, driver_id: string, notes?: string) => {
    const res = await api.post(`/shipments/${shipmentId}/assign-fleet-driver`, { driver_id, notes });
    return res.data;
  },

  assignDispatcher: async (shipmentId: string, dispatcher_id: string | null) => {
    const res = await api.post(`/shipments/${shipmentId}/assign-dispatcher`, { dispatcher_id });
    return res.data;
  },

  updateLocation: async (shipmentId: string, location: string) => {
    const res = await api.patch(`/shipments/${shipmentId}/location`, { current_location: location });
    return res.data;
  },

  updateETA: async (shipmentId: string, eta: string, delayReason?: string) => {
    const formData = new FormData();
    formData.append('eta', eta);
    if (delayReason) {
      formData.append('delay_reason', delayReason);
    }
    const res = await api.patch(`/shipments/${shipmentId}/eta`, formData);
    return res.data;
  },

  uploadDocument: async (shipmentId: string, docType: 'BOL' | 'POD', file: File) => {
    const formData = new FormData();
    formData.append('doc_type', docType);
    formData.append('file', file);
    const res = await api.post(`/shipments/${shipmentId}/documents`, formData);
    return res.data;
  },

  uploadPODComplete: async (shipmentId: string, receiverName: string, deliveryNotes: string, signatureFile: File, photoFiles: File[], osdReported?: boolean, osdNotes?: string) => {
    const formData = new FormData();
    formData.append('receiver_name', receiverName);
    if (deliveryNotes) formData.append('delivery_notes', deliveryNotes);
    formData.append('signature_file', signatureFile);
    for (let i = 0; i < photoFiles.length; i++) {
      formData.append('photo_files', photoFiles[i]);
    }
    if (osdReported !== undefined) {
      formData.append('osd_reported', osdReported.toString());
    }
    if (osdNotes) {
      formData.append('osd_notes', osdNotes);
    }
    const res = await api.post(`/shipments/${shipmentId}/pod-complete`, formData);
    return res.data;
  },

  approvePOD: async (shipmentId: string) => {
    const res = await api.post(`/shipments/${shipmentId}/documents/pod/approve`);
    return res.data;
  },

  rejectPOD: async (shipmentId: string) => {
    const res = await api.post(`/shipments/${shipmentId}/documents/pod/reject`);
    return res.data;
  },
  
  getMyShipments: async () => {
    const res = await api.get('/shipments/me');
    return res.data;
  },

  reportIssue: async (shipmentId: string, issueType: string, description?: string) => {
    const res = await api.post(`/shipments/${shipmentId}/issues`, { issue_type: issueType, description });
    return res.data;
  },

  getIssues: async (shipmentId: string) => {
    const res = await api.get(`/shipments/${shipmentId}/issues`);
    return res.data;
  }
};
