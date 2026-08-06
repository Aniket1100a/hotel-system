import { api } from './axios';

export const getSystemSettings = async () => {
  const res = await api.get('/core/settings/');
  return res.data;
};
