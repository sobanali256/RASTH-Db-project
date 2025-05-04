import axios from 'axios';

// Connect to the actual server API endpoints instead of the JSON server
const API_URL = 'http://localhost:3001/api';
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // milliseconds

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const tryRequest = async <T>(requestFn: () => Promise<T>, retries = MAX_RETRIES): Promise<T> => {
  try {
    return await requestFn();
  } catch (error: any) {
    if (retries > 0 && (!error.response || error.code === 'ECONNREFUSED')) {
      await wait(RETRY_DELAY);
      return tryRequest(requestFn, retries - 1);
    }
    throw error;
  }
};

interface RegisterData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone: string;
  userType: 'patient' | 'doctor';
  [key: string]: any; // For additional fields
}

interface LoginData {
  email: string;
  password: string;
}

interface AuthResponse {
  token: string;
  userType: string;
  userId: number;
  message?: string;
}

const api = {
  // Doctor-patient endpoints
  getDoctorPatients: async (): Promise<any[]> => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Authentication required');
      
      const response = await axios.get(`${API_URL}/doctor/patients`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      return response.data;
    } catch (error: any) {
      console.error('Error fetching doctor\'s patients:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch patients');
    }
  },
  
  // Report doctor endpoints
  submitReport: async (reportData: any, token: string): Promise<any> => {
    try {
      const response = await axios.post(`${API_URL}/reports`, reportData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error: any) {
      console.error('Error submitting report:', error);
      throw new Error(error.response?.data?.message || 'Failed to submit report');
    }
  },
  
  getReports: async (token: string): Promise<any[]> => {
    try {
      const response = await axios.get(`${API_URL}/admin/reports`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error: any) {
      console.error('Error fetching reports:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch reports');
    }
  },
  
  updateReportStatus: async (reportId: number, status: string, remarks: string, token: string): Promise<any> => {
    try {
      const response = await axios.put(`${API_URL}/admin/reports/${reportId}`, { status, remarks }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error: any) {
      console.error('Error updating report status:', error);
      throw new Error(error.response?.data?.message || 'Failed to update report status');
    }
  },
  
  getPatientReports: async (token: string): Promise<any[]> => {
    try {
      const response = await axios.get(`${API_URL}/patient/reports`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error: any) {
      console.error('Error fetching patient reports:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch patient reports');
    }
  },
  
  // Community posts endpoints
  getCommunityPosts: async (): Promise<any[]> => {
    try {
      const response = await axios.get(`${API_URL}/community/posts`);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching community posts:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch community posts');
    }
  },
  
  createCommunityPost: async (postData: any, token: string): Promise<any> => {
    try {
      const response = await axios.post(`${API_URL}/community/posts`, postData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error: any) {
      console.error('Error creating community post:', error);
      throw new Error(error.response?.data?.message || 'Failed to create community post');
    }
  },
  
  updateCommunityPost: async (postId: number, postData: any, token: string): Promise<any> => {
    try {
      const response = await axios.put(`${API_URL}/community/posts/${postId}`, postData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error: any) {
      console.error('Error updating community post:', error);
      throw new Error(error.response?.data?.message || 'Failed to update community post');
    }
  },
  
  deleteCommunityPost: async (postId: number, token: string): Promise<any> => {
    try {
      const response = await axios.delete(`${API_URL}/community/posts/${postId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error: any) {
      console.error('Error deleting community post:', error);
      throw new Error(error.response?.data?.message || 'Failed to delete community post');
    }
  },
  
  // Admin community posts endpoints
  getAdminCommunityPosts: async (): Promise<any[]> => {
    try {
      const token = localStorage.getItem('token');
      const userType = localStorage.getItem('userType');
      
      if (!token) throw new Error('Authentication required');
      if (userType !== 'admin') throw new Error('Admin access required');
      
      const response = await axios.get(`${API_URL}/admin/community/posts`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error: any) {
      console.error('Error fetching community posts for admin:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch community posts');
    }
  },
  
  adminDeleteCommunityPost: async (postId: number): Promise<any> => {
    try {
      const token = localStorage.getItem('token');
      const userType = localStorage.getItem('userType');
      
      if (!token) throw new Error('Authentication required');
      if (userType !== 'admin') throw new Error('Admin access required');
      
      const response = await axios.delete(`${API_URL}/admin/community/posts/${postId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error: any) {
      console.error('Error deleting community post as admin:', error);
      throw new Error(error.response?.data?.message || 'Failed to delete community post');
    }
  },
  
  getPotentialPatients: async (): Promise<any[]> => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Authentication required');
      
      const response = await axios.get(`${API_URL}/doctor/potential-patients`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      return response.data;
    } catch (error: any) {
      console.error('Error fetching potential patients:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch potential patients');
    }
  },
  
  checkPatientDoctorRelationship: async (patientId: string): Promise<{hasCompletedAppointment: boolean}> => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Authentication required');
      
      const response = await axios.get(`${API_URL}/doctor/check-patient/${patientId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      return response.data;
    } catch (error: any) {
      console.error('Error checking patient-doctor relationship:', error);
      throw new Error(error.response?.data?.message || 'Failed to verify patient status');
    }
  },
  
  addMedicalRecord: async (recordData: {
    patientId: string;
    diagnosis: string;
    prescription?: string;
    notes?: string;
    appointmentId?: string;
    appointmentDate?: string;
  }): Promise<any> => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Authentication required');
      
      const response = await axios.post(`${API_URL}/medicalrecords`, recordData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      return response.data;
    } catch (error: any) {
      console.error('Error adding medical record:', error);
      throw new Error(error.response?.data?.message || 'Failed to add medical record');
    }
  },
  
  // Dashboard statistics endpoints
  get: async (endpoint: string, token: string): Promise<any> => {
    try {

      const response = await axios.get(`${API_URL}${endpoint}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      return response.data;
    } catch (error: any) {
      console.error(`Error fetching from ${endpoint}:`, error);
      throw new Error(error.response?.data?.message || `Failed to fetch data from ${endpoint}`);
    }
  },
  
  // Admin specific endpoints
  getAdminStats: async (): Promise<{ totalPatients: number; activeDoctorCount: number; pendingDoctorCount: number; appointmentsToday: number; }> => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Authentication required');
      const response = await axios.get(`${API_URL}/admin/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // The backend now returns the stats directly
      return response.data;
    } catch (error: any) {
      console.error('Error fetching admin stats:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch admin statistics');
    }
  },
  
  getPendingDoctorApplications: async (): Promise<any> => {
    try {
      const token = localStorage.getItem('token');
      const userType = localStorage.getItem('userType');
      if (!token) throw new Error('Authentication required');
      if (userType !== 'admin') throw new Error('Admin access required');
      const response = await axios.get(`${API_URL}/admin/pending-doctors`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error: any) {
      console.error('Error fetching pending doctor applications:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch pending doctor applications');
    }
  },

  
  updateDoctorStatus: async (doctorId: number, status: 'active' | 'inactive'): Promise<any> => {
    try {
      const token = localStorage.getItem('token');
      const userType = localStorage.getItem('userType');
      
      if (!token) throw new Error('Authentication required');
      if (userType !== 'admin') throw new Error('Admin access required');
      
      const response = await axios.put(`${API_URL}/admin/doctors/${doctorId}/status`, 
        { status },
        { headers: { Authorization: `Bearer ${token}` }}
      );
      
      return response.data;
    } catch (error: any) {
      console.error('Error updating doctor status:', error);
      throw new Error(error.response?.data?.message || 'Failed to update doctor status');
    }
  },
  
  register: async (data: RegisterData): Promise<AuthResponse> => {
    try {
      const response = await tryRequest(() => axios.post(`${API_URL}/register`, data));
      const { token, userType, userId } = response.data;
      
      if (!token || !userType || !userId) {
        throw new Error('Invalid response from server: Missing authentication data');
      }

      localStorage.setItem('token', token);
      localStorage.setItem('userType', userType);
      localStorage.setItem('userId', userId.toString());
      localStorage.setItem('isAuthenticated', 'true');
      
      return response.data;
    } catch (error: any) {
      console.error('Registration error:', error);
      if (!error.response || error.code === 'ECONNREFUSED') {
        throw new Error('Registration failed: Server is not responding. Please check your internet connection or try again later.');
      } else if (error.response?.status === 400 && error.response?.data?.message) {
        throw new Error(`Registration failed: ${error.response.data.message}`);
      } else if (error.response?.status === 500) {
        const serverMessage = error.response?.data?.message || error.response?.data?.error || 'Server error';
        console.error('Server error details:', error.response?.data);
        throw new Error(`Registration failed: ${serverMessage}. Please try again later.`);
      } else if (error.response?.data?.message) {
        throw new Error(`Registration failed: ${error.response.data.message}`);
      }
      throw new Error('Registration failed: Unable to connect to server');
    }
  },

  login: async (data: LoginData): Promise<AuthResponse> => {
    try {
      const response = await tryRequest(() => axios.post(`${API_URL}/login`, data));
      const { token, userType, userId, userData } = response.data;
      
      if (!token || !userType || !userId) {
        throw new Error('Invalid response from server: Missing authentication data');
      }

      localStorage.setItem('token', token);
      localStorage.setItem('userType', userType);
      localStorage.setItem('userId', userId.toString());
      localStorage.setItem('isAuthenticated', 'true');
      
      // Return the complete response data including userData if available
      return response.data;
    } catch (error: any) {
      console.error('Login error:', error);
      console.log('Full error response:', error?.response?.data);
      if (!error.response || error.code === 'ECONNREFUSED' || error.code === 'ECONNRESET') {
        throw new Error('Login failed: Server is not responding. Please check your internet connection or try again later.');
      } else if (error.response?.status === 500) {
        const serverMessage = error.response?.data?.message || 'No additional error details available';
        throw new Error(`Login failed: Server error (${serverMessage}). Please try again later or contact support.`);
      } else if (error.response?.data?.message) {
        throw new Error(`Login failed: ${error.response.data.message}`);
      } else {
        throw new Error('Login failed: An unexpected error occurred. Please try again.');
      }
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userType');
    localStorage.removeItem('userId');
  },

  getAuthHeaders: () => {
    const token = localStorage.getItem('token');
    return {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    };
  },
  
  // Generic POST request with token
  post: async (endpoint: string, data: any, token?: string): Promise<any> => {
    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : api.getAuthHeaders().headers;
      const userId = localStorage.getItem('userId');
      const userType = localStorage.getItem('userType');
      const dataWithIds = {
        ...data,
        userId,
        ...(userType === 'patient' && { patientId: userId }),
        ...(userType === 'doctor' && { doctorId: userId })
      };
      const response = await axios.post(`${API_URL}${endpoint}`, dataWithIds, { headers });
      return response.data;
    } catch (error: any) {
      console.error(`Error posting to ${endpoint}:`, error);
      const serverMessage = error.response?.data?.message || error.message;
      const validationError = error.response?.data?.errors?.join(', ') || '';
      throw new Error(`Operation failed: ${serverMessage} ${validationError}`.trim());
    }
  },
  
  // Update appointment status
  updateAppointmentStatus: async (appointmentId: string, status: string): Promise<any> => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Authentication required');
      
      const response = await axios.put(
        `${API_URL}/appointments/${appointmentId}/status`,
        { status },
        { headers: { Authorization: `Bearer ${token}` }}
      );
      
      return response.data;
    } catch (error: any) {
      console.error('Error updating appointment status:', error);
      throw new Error(error.response?.data?.message || 'Failed to update appointment status');
    }
  },

  // Update user profile
  updateProfile: async (profileData: any): Promise<any> => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Authentication required');
      
      const userType = localStorage.getItem('userType');
      const userId = localStorage.getItem('userId');
      
      const response = await axios.put(
        `${API_URL}/profile`,
        { ...profileData, userType, userId },
        { headers: { Authorization: `Bearer ${token}` }}
      );
      
      return response.data;
    } catch (error: any) {
      console.error('Error updating profile:', error);
      throw new Error(error.response?.data?.message || 'Failed to update profile');
    }
  },
};

export default api;