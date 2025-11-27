import { useEffect, useState } from 'react';
import { adminService } from '../../services/admin.service';
import { Button } from '../../components/ui/Button';
import { LogOut, Key, CheckCircle, Clock } from 'lucide-react';
import { useAuthStore, type AuthState } from '../../store/authStore';
import { useNavigate } from 'react-router-dom';

interface LabStatus {
    lab: {
        id: number;
        name: string;
        capacity: number;
        description: string;
    };
    status: 'FREE' | 'RESERVED' | 'OCCUPIED';
    currentReservation?: {
        id: number;
        subject: string;
        startTime: string;
        endTime: string;
        user: { fullName: string };
    };
    nextReservation?: {
        id: number;
        subject: string;
        startTime: string;
    };
}

export const AdminDashboard = () => {
    const [labs, setLabs] = useState<LabStatus[]>([]);
    const logout = useAuthStore((state: AuthState) => state.logout);
    const navigate = useNavigate();

    const loadDashboard = async () => {
        try {
            const data = await adminService.getDashboard();
            setLabs(data);
        } catch (error) {
            console.error('Error loading dashboard:', error);
        }
    };

    useEffect(() => {
        loadDashboard();
        const interval = setInterval(loadDashboard, 30000); // Refresh every 30s
        return () => clearInterval(interval);
    }, []);

    const handleCheckIn = async (reservationId: number) => {
        try {
            await adminService.checkIn(reservationId);
            loadDashboard();
        } catch (error) {
            alert('Error al entregar llave');
        }
    };

    const handleCheckOut = async (reservationId: number) => {
        try {
            await adminService.checkOut(reservationId);
            loadDashboard();
        } catch (error) {
            alert('Error al recibir llave');
        }
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white shadow">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
                    <div className="flex items-center">
                        <img src="/images/logo_pucesi_ok.png" alt="Logo" className="h-10 w-auto mr-4" />
                        <h1 className="text-2xl font-bold text-gray-900">Panel de Administración</h1>
                    </div>
                    <div className="flex items-center space-x-4">
                        <button onClick={handleLogout} className="text-gray-500 hover:text-red-600">
                            <LogOut className="h-6 w-6" />
                        </button>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {labs.map((item) => (
                        <div key={item.lab.id} className={`bg-white rounded-xl shadow-lg overflow-hidden border-t-4 ${item.status === 'OCCUPIED' ? 'border-red-500' :
                            item.status === 'RESERVED' ? 'border-yellow-500' : 'border-green-500'
                            }`}>
                            <div className="p-6">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h3 className="text-xl font-bold text-gray-900">{item.lab.name}</h3>
                                        <p className="text-sm text-gray-500">Capacidad: {item.lab.capacity}</p>
                                    </div>
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${item.status === 'OCCUPIED' ? 'bg-red-100 text-red-800' :
                                        item.status === 'RESERVED' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
                                        }`}>
                                        {item.status === 'OCCUPIED' ? 'OCUPADA' :
                                            item.status === 'RESERVED' ? 'RESERVADA' : 'LIBRE'}
                                    </span>
                                </div>

                                {item.currentReservation ? (
                                    <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                                        <p className="text-sm font-semibold text-blue-900 mb-1">Clase Actual:</p>
                                        <p className="text-lg font-bold text-blue-800">{item.currentReservation.subject}</p>
                                        <div className="flex items-center text-blue-700 text-sm mt-1">
                                            <Clock className="h-4 w-4 mr-1" />
                                            {new Date(item.currentReservation.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} -
                                            {new Date(item.currentReservation.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                                        <p className="text-gray-500 text-center italic">Disponible ahora</p>
                                    </div>
                                )}

                                <div className="mt-4 flex space-x-2">
                                    {item.status === 'RESERVED' && item.currentReservation && (
                                        <Button onClick={() => handleCheckIn(item.currentReservation!.id)}>
                                            <Key className="h-4 w-4 mr-2" />
                                            Entregar Llave
                                        </Button>
                                    )}
                                    {item.status === 'OCCUPIED' && item.currentReservation && (
                                        <Button variant="secondary" onClick={() => handleCheckOut(item.currentReservation!.id)}>
                                            <CheckCircle className="h-4 w-4 mr-2" />
                                            Recibir Llave
                                        </Button>
                                    )}
                                </div>

                                {item.nextReservation && (
                                    <div className="mt-4 pt-4 border-t border-gray-100">
                                        <p className="text-xs text-gray-500">Siguiente: {item.nextReservation.subject}</p>
                                        <p className="text-xs text-gray-400">
                                            {new Date(item.nextReservation.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </main>
        </div>
    );
};
