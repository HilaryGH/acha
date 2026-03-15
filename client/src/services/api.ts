// API Base URL - uses environment variable for production, or Vite proxy for development
// In production, use the production backend URL
// In development, use the Vite proxy (/api)
const getApiBaseUrl = () => {
  // If explicitly set in environment, use that (highest priority)
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }
  
  // Check if we're in production build
  // import.meta.env.PROD is true when built with vite build
  // Also check if we're not on localhost (production deployment)
  const isProduction = import.meta.env.PROD || 
                      (typeof window !== 'undefined' && 
                       !window.location.hostname.includes('localhost') && 
                       !window.location.hostname.includes('127.0.0.1'));
  
  if (isProduction) {
    return 'https://acha-eeme.onrender.com/api';
  }
  
  // Development: use Vite proxy
  return '/api';
};

const API_BASE_URL = getApiBaseUrl();

// Log API base URL in production for debugging (remove in final build if needed)
if (import.meta.env.PROD || (!window.location.hostname.includes('localhost') && !window.location.hostname.includes('127.0.0.1'))) {
  console.log('🌐 API Base URL:', API_BASE_URL);
  console.log('🌐 Frontend URL:', window.location.origin);
}

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

  const url = `${API_BASE_URL}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({
      message: `HTTP error! status: ${response.status}`,
    }));
    
    // Provide more helpful error message for 404 errors
    if (response.status === 404) {
      const errorMessage = error.message || `Route not found (404)`;
      throw new Error(`${errorMessage}. Requested URL: ${url}. Make sure VITE_API_BASE_URL is set correctly in production.`);
    }
    
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
    // Return Cloudinary URL (secure_url or path)
    return data.file.secure_url || data.file.path;
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
      city?: string;
      location?: string;
      primaryLocation?: string;
    }) => {
      return request('/users/register', {
        method: 'POST',
        body: JSON.stringify(userData),
      });
    },
    getMe: async () => {
      return request('/users/me');
    },
    getGoogleAuthUrl: () => {
      // Return the Google OAuth URL
      return `${API_BASE_URL}/users/auth/google`;
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
        // Return Cloudinary URLs (secure_url or path)
        return data.files.map((file: any) => file.secure_url || file.path);
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
    getAll: async (params?: { status?: string; type?: string; partner?: string; city?: string; primaryLocation?: string; search?: string; registrationType?: string }) => {
      const queryParams = params ? '?' + new URLSearchParams(params as any).toString() : '';
      return request(`/partners${queryParams}`);
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

  // Premium endpoints
  premium: {
    getAll: async (params?: { category?: string; status?: string; subscriptionType?: string; search?: string }) => {
      const queryParams = params ? '?' + new URLSearchParams(params as any).toString() : '';
      return request(`/premium${queryParams}`);
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
    getAll: async (params?: { status?: string }) => {
      const queryParams = params ? '?' + new URLSearchParams(params as any).toString() : '';
      return request(`/women-initiatives${queryParams}`);
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

  // AchaPay endpoints
  achaPay: {
    getAll: async (params?: { status?: string }) => {
      const queryParams = params ? '?' + new URLSearchParams(params as any).toString() : '';
      return request(`/achapay${queryParams}`);
    },
    getById: async (id: string) => {
      return request(`/achapay/${id}`);
    },
    create: async (data: any) => {
      return request('/achapay', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    update: async (id: string, data: any) => {
      return request(`/achapay/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    },
    delete: async (id: string) => {
      return request(`/achapay/${id}`, {
        method: 'DELETE',
      });
    },
  },

  // Settings endpoints
  settings: {
    getConversionRate: async () => {
      return request('/settings/usd_to_birr_rate');
    },
    getAll: async () => {
      return request('/settings');
    },
    getByKey: async (key: string) => {
      return request(`/settings/${key}`);
    },
    update: async (key: string, data: { value: any; description?: string }) => {
      return request(`/settings/${key}`, {
        method: 'PUT',
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
    getForTraveller: async (travellerId?: string) => {
      const path = travellerId ? `/orders/traveller/${travellerId}` : '/orders/traveller';
      return request(path);
    },
    getById: async (id: string) => {
      return request(`/orders/${id}`);
    },
    create: async (orderData: { buyerId: string; deliveryMethod: 'traveler' | 'partner' | 'delivery_partner' | 'acha_sisters_delivery_partner' | 'movers_packers' | 'gift_delivery_partner'; orderInfo: any }) => {
      return request('/orders', {
        method: 'POST',
        body: JSON.stringify(orderData),
      });
    },
    getByBuyer: async (buyerId: string) => {
      return request(`/orders/buyer/${buyerId}`);
    },
    getForPartner: async (partnerId?: string) => {
      const url = partnerId ? `/orders/partner/${partnerId}` : '/orders/partner';
      return request(url);
    },
    matchWithTraveler: async (orderId: string, travelerId: string) => {
      return request('/orders/match/traveler', {
        method: 'POST',
        body: JSON.stringify({ orderId, travelerId }),
      });
    },
    assignToPartner: async (orderId: string, partnerId: string, offerId?: string) => {
      return request('/orders/assign/partner', {
        method: 'POST',
        body: JSON.stringify({ orderId, partnerId, offerId }),
      });
    },
    updateStatus: async (orderId: string, status: string, message?: string, location?: string) => {
      return request(`/orders/${orderId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status, message, location }),
      });
    },
    update: async (orderId: string, updateData: any) => {
      return request(`/orders/${orderId}`, {
        method: 'PUT',
        body: JSON.stringify(updateData),
      });
    },
    cancel: async (orderId: string, reason?: string) => {
      return request(`/orders/${orderId}/cancel`, {
        method: 'POST',
        body: JSON.stringify({ reason }),
      });
    },
    confirmDelivery: async (orderId: string) => {
      return request(`/orders/${orderId}/confirm`, {
        method: 'POST',
      });
    },
    deleteExpiredOrders: async () => {
      return request('/orders/cleanup/expired', {
        method: 'DELETE',
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
    getAvailableRequests: async (params?: { partnerId?: string; latitude?: number; longitude?: number; radius?: number }) => {
      const queryParams = params ? '?' + new URLSearchParams({
        ...(params.partnerId && { partnerId: params.partnerId }),
        ...(params.latitude !== undefined && { latitude: params.latitude.toString() }),
        ...(params.longitude !== undefined && { longitude: params.longitude.toString() }),
        ...(params.radius !== undefined && { radius: params.radius.toString() }),
      }).toString() : '';
      return request(`/orders/requests/available${queryParams}`);
    },
    submitPartnerOffer: async (offerData: {
      orderId: string;
      partnerId: string;
      offerPrice?: number;
      estimatedDeliveryTime?: string;
      message?: string;
    }) => {
      return request('/orders/offer', {
        method: 'POST',
        body: JSON.stringify(offerData),
      });
    },
    getPartnerOffers: async (orderId: string) => {
      return request(`/orders/${orderId}/offers`);
    },
    selectPartner: async (data: { orderId: string; partnerId: string; offerId?: string }) => {
      return request('/orders/assign/partner', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    partnerAcceptRequest: async (data: { orderId: string; partnerId: string; offerPrice?: number; estimatedDeliveryTime?: string }) => {
      return request('/orders/accept', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    partnerAcceptOrder: async (data: { orderId: string; deliveryFee?: number; price?: number }) => {
      return request('/orders/accept-assigned', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    partnerRejectOrder: async (data: { orderId: string }) => {
      return request('/orders/reject-assigned', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    downloadGiftCard: async (orderId: string) => {
      const token = getAuthToken();
      
      try {
        // Fetch the PDF file
        const response = await fetch(`${API_BASE_URL}/orders/${orderId}/gift-card`, {
          method: 'GET',
          headers: token ? {
            'Authorization': `Bearer ${token}`
          } : {},
        });
        
        // Check if response is ok
        if (!response.ok) {
          let errorMessage = `Failed to download gift card! Status: ${response.status}`;
          try {
            const errorData = await response.json();
            errorMessage = errorData.message || errorMessage;
          } catch (e) {
            errorMessage = response.statusText || errorMessage;
          }
          throw new Error(errorMessage);
        }
        
        // Get the blob
        const blob = await response.blob();
        
        // Verify blob is not empty
        if (blob.size === 0) {
          throw new Error('Downloaded file is empty');
        }
        
        // Get filename from Content-Disposition header or use default
        const contentDisposition = response.headers.get('content-disposition');
        let filename = `gift-card-${orderId}.pdf`;
        if (contentDisposition) {
          const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
          if (filenameMatch && filenameMatch[1]) {
            filename = decodeURIComponent(filenameMatch[1].replace(/['"]/g, '').replace(/^UTF-8''/, ''));
          }
        }
        
        // Create blob URL
        const blobUrl = URL.createObjectURL(blob);
        
        // Create and trigger download
        const downloadLink = document.createElement('a');
        downloadLink.href = blobUrl;
        downloadLink.download = filename;
        downloadLink.style.cssText = 'position: absolute; left: -9999px; opacity: 0; pointer-events: none;';
        
        // Append to body
        document.body.appendChild(downloadLink);
        
        // Force focus and click
        downloadLink.focus();
        downloadLink.click();
        
        // Clean up after a delay
        setTimeout(() => {
          if (document.body.contains(downloadLink)) {
            document.body.removeChild(downloadLink);
          }
          // Revoke URL after download should have started
          setTimeout(() => {
            URL.revokeObjectURL(blobUrl);
          }, 1000);
        }, 100);
        
        return { status: 'success', message: 'Gift card downloaded successfully' };
      } catch (error: any) {
        console.error('Error downloading gift card:', error);
        throw error;
      }
    },
    generateInvoice: async (orderId: string) => {
      return request(`/orders/${orderId}/invoice`);
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
    update: async (transactionId: string, updateData: { amount?: number; fees?: any; paymentDetails?: any; notes?: string }) => {
      return request(`/transactions/${transactionId}`, {
        method: 'PUT',
        body: JSON.stringify(updateData),
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

  // Document verification endpoints
  documents: {
    getAll: async (params?: { status?: string; type?: string }) => {
      const queryParams = params ? '?' + new URLSearchParams(params as any).toString() : '';
      return request(`/documents${queryParams}`);
    },
    getByUser: async (userId: string) => {
      return request(`/documents/user/${userId}`);
    },
    verify: async (data: {
      entityType: string;
      entityId: string;
      action: 'approve' | 'reject' | 'verify';
      documentType?: string;
      reason?: string;
    }) => {
      return request('/documents/verify', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
  },

  // Survey endpoints
  surveys: {
    getAll: async (params?: { isActive?: boolean; category?: string }) => {
      const queryParams = params ? '?' + new URLSearchParams({
        ...(params.isActive !== undefined && { isActive: params.isActive.toString() }),
        ...(params.category && { category: params.category }),
      }).toString() : '';
      return request(`/surveys${queryParams}`);
    },
    getById: async (id: string) => {
      return request(`/surveys/${id}`);
    },
    create: async (surveyData: any) => {
      return request('/surveys', {
        method: 'POST',
        body: JSON.stringify(surveyData),
      });
    },
    update: async (id: string, surveyData: any) => {
      return request(`/surveys/${id}`, {
        method: 'PUT',
        body: JSON.stringify(surveyData),
      });
    },
    delete: async (id: string) => {
      return request(`/surveys/${id}`, {
        method: 'DELETE',
      });
    },
    submitResponse: async (surveyId: string, responseData: {
      responses: Array<{ questionId: string; value: any; text?: string }>;
      respondentEmail?: string;
      respondentName?: string;
    }) => {
      return request(`/surveys/${surveyId}/submit`, {
        method: 'POST',
        body: JSON.stringify(responseData),
      });
    },
    getResponses: async (surveyId: string) => {
      return request(`/surveys/${surveyId}/responses`);
    },
  },
};
