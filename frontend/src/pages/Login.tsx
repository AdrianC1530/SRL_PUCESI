import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { authService } from '../services/auth.service';
import { Lock, Mail, GraduationCap } from 'lucide-react';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';

export const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();
    const login = useAuthStore((state) => state.login);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const data = await authService.login(email, password);
            login(data.access_token, data.user);

            if (data.user.role === 'ADMIN') {
                navigate('/admin/dashboard');
            } else {
                navigate('/reservas');
            }
        } catch (err) {
            setError('Error al iniciar sesión. Verifique sus credenciales.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 relative overflow-hidden">
            {/* Background Image with Overlay */}
            <div
                className="absolute inset-0 z-0"
                style={{
                    backgroundImage: 'url("/images/login-bg.png")',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                }}
            >
                <div className="absolute inset-0 bg-primary/40 mix-blend-multiply backdrop-blur-sm"></div>
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
                    <Input
                        label="Correo Institucional"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="usuario@puces.edu.ec"
                        required
                        icon={<Mail className="h-5 w-5" />}
                    />

                    <Input
                        label="Contraseña"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                        icon={<Lock className="h-5 w-5" />}
                    />

                    {error && (
                        <div className="text-red-500 text-sm text-center bg-red-50 p-2 rounded-lg">
                            {error}
                        </div>
                    )}

                    <Button type="submit" isLoading={isLoading}>
                        Ingresar
                    </Button>
                </form>

                <div className="mt-6 text-center">
                    <p className="text-xs text-gray-400">© 2025 Pontificia Universidad Católica del Ecuador Sede Ibarra</p>
                </div>
            </div>
        </div>
    );
};
