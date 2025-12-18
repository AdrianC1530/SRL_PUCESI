import axios from 'axios';
import { useAuthStore } from '../store/authStore';

const API_URL = 'http://localhost:3000/admin';

const getHeaders = () => {
    const token = useAuthStore.getState().token;
    return {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    };
};

// Add interceptor to handle 401 errors globally
axios.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            useAuthStore.getState().logout();
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export const adminService = {
    getDashboard: async (date?: Date) => {
        const params = date ? { date: date.toISOString() } : {};
        const response = await axios.get(`${API_URL}/dashboard`, { ...getHeaders(), params });
        return response.data;
    },

    importSchedule: async () => {
        const response = await axios.post(`${API_URL}/import-schedule`, {}, getHeaders());
        return response.data;
    },

    checkIn: async (reservationId: number) => {
        const response = await axios.patch(`${API_URL}/check-in/${reservationId}`, {}, getHeaders());
        return response.data;
    },

    checkOut: async (reservationId: number) => {
        const response = await axios.patch(`${API_URL}/check-out/${reservationId}`, {}, getHeaders());
        return response.data;
    },

    getLabSchedule: async (labId: number, date?: Date) => {
        const params = date ? { date: date.toISOString() } : {};
        const response = await axios.get(`${API_URL}/schedule/${labId}`, { ...getHeaders(), params });
        return response.data;
    },

    getGeneralSchedule: async (date?: Date) => {
        const params = date ? { date: date.toISOString() } : {};
        const response = await axios.get(`${API_URL}/general-schedule`, { ...getHeaders(), params });
        return response.data;
    },

    getSchools: async () => {
        const response = await axios.get(`${API_URL}/schools`, getHeaders());
        return response.data;
    },

    getSubjectsBySchool: async (schoolId: string) => {
        const response = await axios.get(`${API_URL}/subjects/${schoolId}`, getHeaders());
        return response.data;
    },

    searchLabs: async (params: { date: string; startTime: string; duration: number; capacity: number; software?: string; onlyMac?: boolean }) => {
        const response = await axios.get(`${API_URL}/search-labs`, { ...getHeaders(), params });
        return response.data;
    },

    getLabs: async () => {
        const response = await axios.get(`${API_URL}/labs`, getHeaders());
        return response.data;
    },

    updateLab: async (id: number, data: { name?: string; capacity?: number; description?: string; isPermanent?: boolean; software?: string[] }) => {
        const response = await axios.patch(`${API_URL}/labs/${id}`, data, getHeaders());
        return response.data;
    },

    getSoftware: async () => {
        const response = await axios.get(`${API_URL}/software`, getHeaders());
        return response.data;
    },

    createSoftware: async (data: { name: string; version?: string; license?: string }) => {
        const response = await axios.post(`${API_URL}/software`, data, getHeaders());
        return response.data;
    },

    updateSoftware: async (id: number, data: { name?: string; version?: string; license?: string }) => {
        const response = await axios.patch(`${API_URL}/software/${id}`, data, getHeaders());
        return response.data;
    },

    deleteSoftware: async (id: number) => {
        const response = await axios.post(`${API_URL}/software/delete/${id}`, {}, getHeaders());
        return response.data;
    },

    // Schools
    createSchool: async (data: { id: string; name: string; color: string }) => {
        const response = await axios.post(`${API_URL}/schools`, data, getHeaders());
        return response.data;
    },

    updateSchool: async (id: string, data: { name?: string; color?: string }) => {
        const response = await axios.patch(`${API_URL}/schools/${id}`, data, getHeaders());
        return response.data;
    },

    deleteSchool: async (id: string) => {
        const response = await axios.post(`${API_URL}/schools/delete/${id}`, {}, getHeaders());
        return response.data;
    },

    // Teachers
    getTeachers: async () => {
        const response = await axios.get(`${API_URL}/teachers`, getHeaders());
        return response.data;
    },

    createTeacher: async (data: { name: string; schoolId: string }) => {
        const response = await axios.post(`${API_URL}/teachers`, data, getHeaders());
        return response.data;
    },

    updateTeacher: async (id: number, data: { name?: string; schoolId?: string }) => {
        const response = await axios.patch(`${API_URL}/teachers/${id}`, data, getHeaders());
        return response.data;
    },

    deleteTeacher: async (id: number) => {
        const response = await axios.post(`${API_URL}/teachers/delete/${id}`, {}, getHeaders());
        return response.data;
    },
};
