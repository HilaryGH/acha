// API Base URL - uses environment variable for production, or Vite proxy for development
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

// Helper function to get auth token from localStorage
const getAuthToken = (): string | null => {
  return localStorage.getItem('token');
};

// Helper function to make API requests
const request = async <T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> => {
  const token = getAuthToken();
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({
      message: `HTTP error! status: ${response.status}`,
    }));
    throw new Error(error.message || 'Request failed');
  }

  return response.json();
};

// Upload helper function
const uploadFile = async (file: File): Promise<string> => {
  const token = getAuthToken();
  const formData = new FormData();
  formData.append('file', file);

  const headers: HeadersInit = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}/upload/single`, {
    method: 'POST',
    headers,
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({
      message: `Upload failed! status: ${response.status}`,
    }));
    throw new Error(error.message || 'Upload failed');
  }

  const data = await response.json();
  if (data.status === 'success' && data.file) {
    return data.file.path;
  }
  throw new Error(data.message || 'Upload failed');
};

// API object with all endpoints
export const api = {
  // User endpoints
  users: {
    login: async (credentials: { email: string; password: string }) => {
      return request('/users/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
      });
    },
    register: async (userData: {
      name: string;
      email: string;
      password: string;
      phone?: string;
      role?: string;
      department?: string;
      code?: string;
    }) => {
      return request('/users/register', {
        method: 'POST',
        body: JSON.stringify(userData),
      });
    },
    getMe: async () => {
      return request('/users/me');
    },
    getAll: async () => {
      return request('/users');
    },
    getById: async (id: string) => {
      return request(`/users/${id}`);
    },
    update: async (id: string, userData: any) => {
      return request(`/users/${id}`, {
        method: 'PUT',
        body: JSON.stringify(userData),
      });
    },
    changePassword: async (id: string, passwordData: {
      currentPassword: string;
      newPassword: string;
    }) => {
      return request(`/users/${id}/password`, {
        method: 'PUT',
        body: JSON.stringify(passwordData),
      });
    },
    searchByLocation: async (params: {
      location?: string;
      city?: string;
      role?: string;
      status?: string;
    }) => {
      const queryParams = new URLSearchParams();
      if (params.location) queryParams.append('location', params.location);
      if (params.city) queryParams.append('city', params.city);
      if (params.role) queryParams.append('role', params.role);
      if (params.status) queryParams.append('status', params.status);
      
      return request(`/users/search/location?${queryParams.toString()}`);
    },
  },

  // Upload endpoints
  upload: {
    single: async (file: File): Promise<string> => {
      return uploadFile(file);
    },
    multiple: async (files: File[]): Promise<string[]> => {
      const token = getAuthToken();
      const formData = new FormData();
      files.forEach((file) => {
        formData.append('files', file);
      });

      const headers: HeadersInit = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${API_BASE_URL}/upload/multiple`, {
        method: 'POST',
        headers,
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({
          message: `Upload failed! status: ${response.status}`,
        }));
        throw new Error(error.message || 'Upload failed');
      }

      const data = await response.json();
      if (data.status === 'success' && data.files) {
        return data.files.map((file: any) => file.path);
      }
      throw new Error(data.message || 'Upload failed');
    },
  },

  // Buyer endpoints
  buyers: {
    getAll: async () => {
      return request('/buyers');
    },
    getById: async (id: string) => {
      return request(`/buyers/${id}`);
    },
    create: async (buyerData: any) => {
      return request('/buyers', {
        method: 'POST',
        body: JSON.stringify(buyerData),
      });
    },
    update: async (id: string, buyerData: any) => {
      return request(`/buyers/${id}`, {
        method: 'PUT',
        body: JSON.stringify(buyerData),
      });
    },
    delete: async (id: string) => {
      return request(`/buyers/${id}`, {
        method: 'DELETE',
      });
    },
  },

  // Sender endpoints
  senders: {
    getAll: async () => {
      return request('/senders');
    },
    getById: async (id: string) => {
      return request(`/senders/${id}`);
    },
    create: async (senderData: any) => {
      return request('/senders', {
        method: 'POST',
        body: JSON.stringify(senderData),
      });
    },
    update: async (id: string, senderData: any) => {
      return request(`/senders/${id}`, {
        method: 'PUT',
        body: JSON.stringify(senderData),
      });
    },
    delete: async (id: string) => {
      return request(`/senders/${id}`, {
        method: 'DELETE',
      });
    },
  },

  // Receiver endpoints
  receivers: {
    getAll: async () => {
      return request('/receivers');
    },
    getById: async (id: string) => {
      return request(`/receivers/${id}`);
    },
    create: async (receiverData: any) => {
      return request('/receivers', {
        method: 'POST',
        body: JSON.stringify(receiverData),
      });
    },
    update: async (id: string, receiverData: any) => {
      return request(`/receivers/${id}`, {
        method: 'PUT',
        body: JSON.stringify(receiverData),
      });
    },
    delete: async (id: string) => {
      return request(`/receivers/${id}`, {
        method: 'DELETE',
      });
    },
  },

  // Traveller endpoints
  travellers: {
    getAll: async () => {
      return request('/travellers');
    },
    getById: async (id: string) => {
      return request(`/travellers/${id}`);
    },
    search: async (params?: { destinationCity?: string; currentLocation?: string; status?: string; travellerType?: string }) => {
      const queryParams = params ? '?' + new URLSearchParams(params as any).toString() : '';
      return request(`/travellers${queryParams}`);
    },
    create: async (travellerData: any) => {
      return request('/travellers', {
        method: 'POST',
        body: JSON.stringify(travellerData),
      });
    },
    update: async (id: string, travellerData: any) => {
      return request(`/travellers/${id}`, {
        method: 'PUT',
        body: JSON.stringify(travellerData),
      });
    },
    delete: async (id: string) => {
      return request(`/travellers/${id}`, {
        method: 'DELETE',
      });
    },
  },

  // Partner endpoints
  partners: {
    getAll: async () => {
      return request('/partners');
    },
    getById: async (id: string) => {
      return request(`/partners/${id}`);
    },
    create: async (partnerData: any) => {
      return request('/partners', {
        method: 'POST',
        body: JSON.stringify(partnerData),
      });
    },
    update: async (id: string, partnerData: any) => {
      return request(`/partners/${id}`, {
        method: 'PUT',
        body: JSON.stringify(partnerData),
      });
    },
    delete: async (id: string) => {
      return request(`/partners/${id}`, {
        method: 'DELETE',
      });
    },
  },

  // Premium endpoints
  premium: {
    getAll: async () => {
      return request('/premium');
    },
    getById: async (id: string) => {
      return request(`/premium/${id}`);
    },
    create: async (premiumData: any) => {
      return request('/premium', {
        method: 'POST',
        body: JSON.stringify(premiumData),
      });
    },
    update: async (id: string, premiumData: any) => {
      return request(`/premium/${id}`, {
        method: 'PUT',
        body: JSON.stringify(premiumData),
      });
    },
  },

  // Women Initiatives endpoints
  womenInitiatives: {
    getAll: async () => {
      return request('/women-initiatives');
    },
    getById: async (id: string) => {
      return request(`/women-initiatives/${id}`);
    },
    create: async (data: any) => {
      return request('/women-initiatives', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    update: async (id: string, data: any) => {
      return request(`/women-initiatives/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    },
    delete: async (id: string) => {
      return request(`/women-initiatives/${id}`, {
        method: 'DELETE',
      });
    },
  },

  // AchaPay endpoints (if exists, otherwise using premium or creating placeholder)
  achaPay: {
    create: async (data: any) => {
      // Note: This endpoint might need to be created on the backend
      // For now, using premium endpoint as placeholder
      return request('/premium', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
  },

  // Audit endpoints
  audit: {
    getAll: async () => {
      return request('/audit');
    },
    getById: async (id: string) => {
      return request(`/audit/${id}`);
    },
  },

  // Subscription endpoints
  subscriptions: {
    subscribe: async (email: string) => {
      return request('/subscriptions/subscribe', {
        method: 'POST',
        body: JSON.stringify({ email }),
      });
    },
    unsubscribe: async (email: string) => {
      return request('/subscriptions/unsubscribe', {
        method: 'POST',
        body: JSON.stringify({ email }),
      });
    },
    getAll: async () => {
      return request('/subscriptions');
    },
  },

  // Order endpoints
  orders: {
    getAll: async (params?: { status?: string; deliveryMethod?: string; buyerId?: string }) => {
      const queryParams = params ? '?' + new URLSearchParams(params as any).toString() : '';
      return request(`/orders${queryParams}`);
    },
    getById: async (id: string) => {
      return request(`/orders/${id}`);
    },
    create: async (orderData: { buyerId: string; deliveryMethod: 'traveler' | 'partner'; orderInfo: any }) => {
      return request('/orders', {
        method: 'POST',
        body: JSON.stringify(orderData),
      });
    },
    getByBuyer: async (buyerId: string) => {
      return request(`/orders/buyer/${buyerId}`);
    },
    matchWithTraveler: async (orderId: string, travelerId: string) => {
      return request('/orders/match/traveler', {
        method: 'POST',
        body: JSON.stringify({ orderId, travelerId }),
      });
    },
    assignToPartner: async (orderId: string, partnerId: string) => {
      return request('/orders/assign/partner', {
        method: 'POST',
        body: JSON.stringify({ orderId, partnerId }),
      });
    },
    updateStatus: async (orderId: string, status: string, message?: string, location?: string) => {
      return request(`/orders/${orderId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status, message, location }),
      });
    },
    confirmDelivery: async (orderId: string) => {
      return request(`/orders/${orderId}/confirm`, {
        method: 'POST',
      });
    },
    getAvailableTravelers: async (orderId: string) => {
      return request(`/orders/${orderId}/travelers`);
    },
    getAvailablePartners: async (orderId: string) => {
      return request(`/orders/${orderId}/partners`);
    },
    createDeliveryRequest: async (requestData: {
      buyerId: string;
      pickupLocation: { latitude: number; longitude: number; address?: string; city?: string };
      deliveryLocation: { latitude: number; longitude: number; address?: string; city?: string };
      itemDescription?: string;
      itemValue?: number;
      preferredDeliveryTime?: string;
      specialInstructions?: string;
    }) => {
      return request('/orders/request', {
        method: 'POST',
        body: JSON.stringify(requestData),
      });
    },
  },

  // Partner endpoints for location-based search
  partners: {
    searchNearby: async (params: { latitude: number; longitude: number; radius?: number; city?: string }) => {
      const queryParams = new URLSearchParams({
        latitude: params.latitude.toString(),
        longitude: params.longitude.toString(),
        ...(params.radius && { radius: params.radius.toString() }),
        ...(params.city && { city: params.city }),
      });
      return request(`/partners/search/nearby?${queryParams}`);
    },
    updateAvailability: async (partnerId: string, data: { isOnline?: boolean; isAvailable?: boolean; latitude?: number; longitude?: number }) => {
      return request(`/partners/${partnerId}/availability`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    },
    updateLocation: async (partnerId: string, data: { latitude: number; longitude: number; address?: string }) => {
      return request(`/partners/${partnerId}/location`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    },
  },

  // Transaction endpoints
  transactions: {
    getAll: async (params?: { status?: string; paymentMethod?: string; buyerId?: string; orderId?: string; startDate?: string; endDate?: string }) => {
      const queryParams = params ? '?' + new URLSearchParams(params as any).toString() : '';
      return request(`/transactions${queryParams}`);
    },
    getById: async (id: string) => {
      return request(`/transactions/${id}`);
    },
    create: async (transactionData: {
      orderId: string;
      buyerId: string;
      transactionType?: string;
      paymentMethod: string;
      amount: number;
      currency?: string;
      fees?: any;
      paymentDetails?: any;
    }) => {
      return request('/transactions', {
        method: 'POST',
        body: JSON.stringify(transactionData),
      });
    },
    updateStatus: async (transactionId: string, status: string, paymentProof?: string, notes?: string) => {
      return request(`/transactions/${transactionId}`, {
        method: 'PUT',
        body: JSON.stringify({ status, paymentProof, notes }),
      });
    },
    getByOrder: async (orderId: string) => {
      return request(`/transactions/order/${orderId}`);
    },
    getByBuyer: async (buyerId: string) => {
      return request(`/transactions/buyer/${buyerId}`);
    },
    generateInvoice: async (transactionId: string) => {
      return request(`/transactions/${transactionId}/invoice`);
    },
    getStats: async (startDate?: string, endDate?: string) => {
      const queryParams = startDate || endDate ? '?' + new URLSearchParams({ startDate: startDate || '', endDate: endDate || '' } as any).toString() : '';
      return request(`/transactions/stats${queryParams}`);
    },
  },
};
