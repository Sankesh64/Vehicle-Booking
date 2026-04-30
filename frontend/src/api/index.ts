import axios from 'axios';

const api = axios.create({
  // Fallback to the live Render URL if VITE_API_URL is not set
  baseURL: import.meta.env.VITE_API_URL || 'https://vehicle-booking-2t5f.onrender.com/api/v1',
  withCredentials: true,
});

export const bookingApi = {
  estimateFare: async (pickup: any, dropoff: any, vehicleCategory: string) => {
    const response = await api.post('/bookings/estimate', { 
      pickupLocation: pickup, 
      dropLocation: dropoff, 
      vehicleCategory: vehicleCategory 
    });
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
  initiateKyc: async () => {
    const response = await api.post('/drivers/kyc/initiate');
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
