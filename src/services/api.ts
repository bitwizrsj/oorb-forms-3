import axios from 'axios';

// const API_BASE_URL = 'https://oorb-forms.onrender.com/api';
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5001/api';
// const API_BASE_URL = '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    console.log('API Request:', {
      method: config.method?.toUpperCase(),
      url: config.url,
      fullUrl: `${config.baseURL}${config.url}`,
      hasToken: !!token,
      tokenPreview: token ? `${token.substring(0, 20)}...` : 'none'
    });
    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => {
    console.log('API Response Success:', {
      status: response.status,
      url: response.config.url,
      dataType: typeof response.data,
      dataKeys: response.data && typeof response.data === 'object' ? Object.keys(response.data) : 'not object'
    });
    return response;
  },
  (error) => {
    console.error('API Error Details:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      url: error.config?.url,
      method: error.config?.method,
      message: error.response?.data?.error || error.message,
      fullError: error.response?.data
    });

    if (error.response?.status === 401) {
      console.log('Unauthorized access detected');
      // Only redirect if not already on auth pages
      if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/register')) {
        console.log('Clearing auth data and redirecting to login');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (credentials: { email: string; password: string; rememberMe?: boolean }) => {
    console.log('Auth API: Attempting login for:', credentials.email);
    return api.post('/auth/login', credentials);
  },

  register: (userData: { name: string; email: string; password: string }) => {
    console.log('Auth API: Attempting registration for:', userData.email);
    return api.post('/auth/register', userData);
  },

  logout: () => {
    console.log('Auth API: Logging out');
    return api.post('/auth/logout');
  },

  getCurrentUser: () => {
    console.log('Auth API: Getting current user');
    return api.get('/auth/me');
  },

  updateProfile: (profileData: any) => {
    console.log('Auth API: Updating profile');
    return api.put('/auth/profile', profileData);
  },
  
  changePassword: (passwordData: any) => {
    console.log('Auth API: Changing password');
    return api.put('/auth/change-password', passwordData);
  },

  forgotPassword: (email: string) => {
    console.log('Auth API: Forgot password for:', email);
    return api.post('/auth/forgot-password', { email });
  },

  resetPassword: (token: string, password: string) => {
    console.log('Auth API: Resetting password');
    return api.post('/auth/reset-password', { token, password });
  },
};

// Form API
export const formAPI = {
  getForms: () => {
    console.log('Form API: Getting all forms');
    return api.get('/forms');
  },

  getForm: (id: string) => {
    console.log('Form API: Getting form by ID:', id);
    return api.get(`/forms/${id}`);
  },

  getFormByShareUrl: (shareUrl: string) => {
    console.log('Form API: Getting form by share URL:', shareUrl);
    return api.get(`/forms/share/${shareUrl}`);
  },

  incrementView: (shareUrl: string) => {
    console.log('Form API: Incrementing view for share URL:', shareUrl);
    return api.post(`/forms/share/${shareUrl}/view`);
  },

  createForm: (formData: any) => {
    console.log('Form API: Creating form with data:', formData);
    return api.post('/forms', formData);
  },

  updateForm: (id: string, formData: any) => {
    console.log('Form API: Updating form:', id);
    return api.put(`/forms/${id}`, formData);
  },

  deleteForm: (id: string) => {
    console.log('Form API: Deleting form:', id);
    return api.delete(`/forms/${id}`);
  },

  publishForm: (id: string) => {
    console.log('Form API: Publishing form:', id);
    return api.post(`/forms/${id}/publish`);
  },

  uploadImage: (formData: FormData) => {
    console.log('Form API: Uploading image to Cloudinary');
    return api.post('/upload/image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },

  getAnalytics: (id: string) => {
    console.log('Form API: Getting analytics for form:', id);
    return api.get(`/forms/${id}/analytics`);
  },

  getRecentForms: (limit = 5) => {
    console.log('Form API: Getting recent forms, limit:', limit);
    return api.get(`/forms?limit=${limit}&sort=updatedAt`);
  },
};

// Folder API
export const folderAPI = {
  getFolders: () => {
    console.log('Folder API: Getting all folders');
    return api.get('/folders');
  },

  getFolder: (id: string) => {
    console.log('Folder API: Getting folder by ID:', id);
    return api.get(`/folders/${id}`);
  },

  createFolder: (folderData: any) => {
    console.log('Folder API: Creating folder with data:', folderData);
    return api.post('/folders', folderData);
  },

  updateFolder: (id: string, folderData: any) => {
    console.log('Folder API: Updating folder:', id);
    return api.put(`/folders/${id}`, folderData);
  },

  deleteFolder: (id: string) => {
    console.log('Folder API: Deleting folder:', id);
    return api.delete(`/folders/${id}`);
  },

  moveForms: (folderId: string, formIds: string[]) => {
    console.log('Folder API: Moving forms to folder:', folderId, formIds);
    return api.post(`/folders/${folderId}/move-forms`, { formIds });
  },
};

// Response API
export const responseAPI = {
  uploadFile: (formData: FormData) => {
    console.log('Response API: Uploading file');
    return api.post('/responses/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },

  submitResponse: (responseData: any) => {
    console.log('Response API: Submitting response');
    return api.post('/responses', responseData);
  },

  getResponses: (formId: string, page = 1, limit = 10) => {
    console.log('Response API: Getting responses for form:', formId, 'page:', page, 'limit:', limit);
    const url = `/responses/form/${formId}?page=${page}&limit=${limit}`;
    console.log('Response API: Full URL:', `${API_BASE_URL}${url}`);
    return api.get(url);
  },

  getResponse: (id: string) => {
    console.log('Response API: Getting response by ID:', id);
    return api.get(`/responses/${id}`);
  },

  deleteResponse: (id: string) => {
    console.log('Response API: Deleting response:', id);
    return api.delete(`/responses/${id}`);
  },

  getMyResponses: () => {
    console.log('Response API: Getting my responses');
    return api.get('/responses/my-responses');
  },
};

// Export API
export const exportAPI = {
  getExportSummary: (formId: string) => {
    console.log('Export API: Getting export summary for form:', formId);
    return api.get(`/exports/summary/${formId}`);
  },

  downloadExcel: (formId: string) => {
    console.log('Export API: Downloading Excel for form:', formId);
    const token = localStorage.getItem('token');
    const url = `${API_BASE_URL}/exports/excel/${formId}`;
    const link = document.createElement('a');
    link.href = token ? `${url}?token=${token}` : url;
    link.download = 'export.xlsx';
    link.click();
  },

  downloadCSV: (formId: string) => {
    console.log('Export API: Downloading CSV for form:', formId);
    const token = localStorage.getItem('token');
    const url = `${API_BASE_URL}/exports/csv/${formId}`;
    const link = document.createElement('a');
    link.href = token ? `${url}?token=${token}` : url;
    link.download = 'export.csv';
    link.click();
  },
};

// Integrations API
export const integrationsAPI = {
  getGoogleAuthUrl: () => {
    console.log('Integrations API: Getting Google Auth URL');
    return api.get('/integrations/google/auth');
  },

  getGoogleStatus: () => {
    console.log('Integrations API: Getting Google Drive status');
    return api.get('/integrations/google/status');
  },

  disconnectGoogle: () => {
    console.log('Integrations API: Disconnecting Google Drive');
    return api.post('/integrations/google/disconnect');
  },

  linkGoogleSheets: (data: { formId: string; spreadsheetId: string; sheetName?: string; enabled?: boolean }) => {
    console.log('Integrations API: Linking Google Sheets');
    return api.post('/integrations/google-sheets/link', data);
  },

  createGoogleSheet: (data: { formId: string; title?: string }) => {
    console.log('Integrations API: Creating Google Sheet');
    return api.post('/integrations/google-sheets/create', data);
  },
};

export default api;