import axios from 'axios';

export const api = axios.create({
  baseURL: '/api/v1'
});

export type Package = {
  id: string;
  name: string;
  priceUgx: number;
  durationMinutes?: number | null;
  dataMb?: number | null;
};

export type OrderResponse = {
  id: string;
  status: 'PENDING' | 'PAID' | 'FAILED' | 'EXPIRED';
  voucherCode: string | null;
  amountUgx: number;
  provider: 'MTN' | 'AIRTEL';
  msisdn: string;
  package: Package;
};

export type CreateOrderPayload = {
  packageId: string;
  msisdn: string;
  provider: 'MTN' | 'AIRTEL';
};

export const fetchPackages = async () => {
  const response = await api.get<{ data: Package[] }>('/packages');
  return response.data.data;
};

export const createOrder = async (payload: CreateOrderPayload) => {
  const response = await api.post('/orders', payload);
  return response.data as {
    orderId: string;
    status: string;
    providerTxRef: string;
    pollUrl: string;
    uiMessage: string;
  };
};

export const fetchOrder = async (orderId: string) => {
  const response = await api.get<OrderResponse>(`/orders/${orderId}`);
  return response.data;
};

export const adminLogin = async (email: string, password: string) => {
  const response = await api.post<{ token: string }>('/admin/login', { email, password });
  return response.data;
};

export const fetchAdminOrders = async (
  token: string,
  params: { status?: string; provider?: string; from?: string; to?: string }
) => {
  const response = await api.get<{ data: OrderResponse[] }>('/admin/orders', {
    params,
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return response.data.data;
};

export const createPackage = async (token: string, data: Omit<Package, 'id'>) => {
  const response = await api.post<Package>('/admin/packages', data, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

export const updatePackage = async (token: string, id: string, data: Partial<Package>) => {
  const response = await api.put<Package>(`/admin/packages/${id}`, data, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

export const deletePackage = async (token: string, id: string) => {
  await api.delete(`/admin/packages/${id}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
};
