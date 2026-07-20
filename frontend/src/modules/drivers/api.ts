import api from '../../core/api';

export const getDrivers = async () => {
  const response = await api.get('/drivers');
  return response.data;
};

export const createDriver = async (data: any) => {
  const response = await api.post('/drivers', data);
  return response.data;
};

export const deactivateDriver = async (driverId: string) => {
  const response = await api.delete(`/drivers/${driverId}`);
  return response.data;
};

export const resetDriverPassword = async (driverId: string) => {
  const response = await api.post(`/drivers/${driverId}/reset-password`);
  return response.data;
};

export const updateDriver = async (driverId: string, data: any) => {
  const response = await api.put(`/drivers/${driverId}`, data);
  return response.data;
};

export const updateDriverHOS = async (driverId: string, data: { status: string, location?: string, notes?: string }) => {
  const response = await api.post(`/drivers/${driverId}/hos`, data);
  return response.data;
};

export const getDriverHOSSummary = async (driverId: string) => {
  const response = await api.get(`/drivers/${driverId}/hos/summary`);
  return response.data;
};
