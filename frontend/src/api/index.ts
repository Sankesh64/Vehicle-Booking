import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1',
  withCredentials: true,
});

export const bookingApi = {
  estimateFare: async (pickup: string, dropoff: string, vehicleType: string) => {
    const response = await api.post('/bookings/estimate', { pickup, dropoff, vehicleType });
    return response.data;
  },
  
  createBooking: async (bookingData: any) => {
    const response = await api.post('/bookings', bookingData);
    return response.data;
  },
  
  getMyBookings: async () => {
    const response = await api.get('/bookings/my');
    return response.data;
  }
};

export const authApi = {
  login: async (credentials: any) => {
    const response = await api.post('/auth/login', credentials);
    return response.data;
  },
  register: async (userData: any) => {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },
  logout: async () => {
    const response = await api.post('/auth/logout');
    return response.data;
  },
  getCurrentUser: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  }
};

export const driverApi = {
  getNearby: async (lat: number, lng: number) => {
    const response = await api.post('/bookings/nearby-drivers', { lat, lng });
    return response.data;
  },
  updateKyc: async (kycData: any) => {
    const response = await api.post('/drivers/kyc', kycData);
    return response.data;
  },
  getStats: async () => {
    const response = await api.get('/drivers/stats');
    return response.data;
  }
};

export const paymentApi = {
  createOrder: async (bookingId: string) => {
    const response = await api.post('/payments/order', { bookingId });
    return response.data;
  },
  verifyPayment: async (paymentData: any) => {
    const response = await api.post('/payments/verify', paymentData);
    return response.data;
  }
};

export default api;
