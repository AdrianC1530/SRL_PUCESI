import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { Lock, Mail, GraduationCap } from 'lucide-react';

export const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const login = useAuthStore((state) => state.login);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        try {
            const response = await fetch('http://localhost:3000/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password }),
            });

            if (!response.ok) {
                throw new Error('Credenciales inválidas');
            }

            const data = await response.json();
            login(data.access_token, data.user);

            if (data.user.role === 'ADMIN') {
                navigate('/admin/dashboard');
            } else {
                navigate('/reservas');
            }
        } catch (err) {
            setError('Error al iniciar sesión. Verifique sus credenciales.');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 relative overflow-hidden">
            {/* Background Image with Overlay */}
            <div
                className="absolute inset-0 z-0"
                style={{
                    backgroundImage: 'url("https://images.unsplash.com/photo-1562774053-701939374585?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80")',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                }}
            >
                <div className="absolute inset-0 bg-primary/80 mix-blend-multiply"></div>
            </div>

            <div className="z-10 w-full max-w-md p-8 bg-white rounded-2xl shadow-2xl transform transition-all hover:scale-105 duration-300">
                <div className="flex flex-col items-center mb-8">
                    {/* PUCESI Logo Placeholder */}
                    <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center mb-4 shadow-lg">
                        <GraduationCap className="text-white w-10 h-10" />
                    </div>
                    <h1 className="text-3xl font-bold text-gray-800">SRL PUCESI</h1>
                    <p className="text-gray-500 mt-2">Sistema de Reserva de Laboratorios</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Correo Institucional</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Mail className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary transition-colors"
                                placeholder="usuario@puces.edu.ec"
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Lock className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary transition-colors"
                                placeholder="••••••••"
                                required
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="text-red-500 text-sm text-center bg-red-50 p-2 rounded-lg">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-primary hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all transform hover:-translate-y-1"
                    >
                        Ingresar
                    </button>
                </form>

                <div className="mt-6 text-center">
                    <p className="text-xs text-gray-400">© 2025 Pontificia Universidad Católica del Ecuador Sede Ibarra</p>
                </div>
            </div>
        </div>
    );
};
