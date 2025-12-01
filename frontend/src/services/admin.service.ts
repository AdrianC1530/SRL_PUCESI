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
};
