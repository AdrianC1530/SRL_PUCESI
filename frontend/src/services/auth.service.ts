import { useAuthStore } from '../store/authStore';

const API_URL = 'http://localhost:3000';

export const authService = {
    login: async (email: string, password: string) => {
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password }),
        });

        if (!response.ok) {
            throw new Error('Credenciales inválidas');
        }

        return response.json();
    },

    logout: () => {
        useAuthStore.getState().logout();
    }
};
