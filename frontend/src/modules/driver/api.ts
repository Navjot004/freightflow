import api from '../../core/api';

export const getMyAssignments = async () => {
  const response = await api.get('/driver-assignments/me');
  return response.data;
};

export const acceptAssignment = async (assignmentId: string) => {
  const response = await api.post(`/driver-assignments/${assignmentId}/accept`);
  return response.data;
};

export const rejectAssignment = async (assignmentId: string, reason?: string) => {
  const response = await api.post(`/driver-assignments/${assignmentId}/reject`, { reason });
  return response.data;
};
