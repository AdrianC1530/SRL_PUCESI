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
        description?: string;
        type: 'CLASS' | 'EVENT';
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


    const [selectedLab, setSelectedLab] = useState<LabStatus | null>(null);
    const [schedule, setSchedule] = useState<any[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [simulatedDate, setSimulatedDate] = useState<string>(new Date().toISOString().slice(0, 16));

    const loadDashboard = async () => {
        try {
            const dateToUse = new Date(simulatedDate);
            const data = await adminService.getDashboard(dateToUse);
            setLabs(data);
        } catch (error) {
            console.error('Error loading dashboard:', error);
        }
    };

    useEffect(() => {
        loadDashboard();
        const interval = setInterval(() => {
            loadDashboard();
            setCurrentDate(new Date());
        }, 30000);
        return () => clearInterval(interval);
    }, [simulatedDate]);

    const handleViewSchedule = async (lab: LabStatus) => {
        setSelectedLab(lab);
        setIsModalOpen(true);
        try {
            const dateToUse = new Date(simulatedDate);
            const data = await adminService.getLabSchedule(lab.lab.id, dateToUse);
            setSchedule(data);
        } catch (error) {
            console.error('Error loading schedule:', error);
        }
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSchedule([]);
        setSelectedLab(null);
    };

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

    const formatDate = (date: Date) => {
        return new Intl.DateTimeFormat('es-ES', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }).format(date);
    };

    const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSimulatedDate(e.target.value);
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white shadow sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
                    <div className="flex items-center">
                        <img src="/images/logo_pucesi_ok.png" alt="Logo" className="h-10 w-auto mr-4" />
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Panel de Administración</h1>
                            <p className="text-sm text-gray-500 capitalize">{formatDate(currentDate)}</p>
                        </div>
                    </div>
                    <div className="flex items-center space-x-4">
                        <div className="flex flex-col items-end">
                            <label className="text-xs text-gray-500 font-semibold mb-1">Simular Fecha/Hora:</label>
                            <input
                                type="datetime-local"
                                value={simulatedDate}
                                onChange={handleDateChange}
                                className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
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
                                            {item.currentReservation.description === 'Reservado permanentemente' ? (
                                                <span>Uso Permanente (Todo el día)</span>
                                            ) : (
                                                <span>
                                                    {new Date(item.currentReservation.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} -
                                                    {new Date(item.currentReservation.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                                        <p className="text-gray-500 text-center italic">Disponible ahora</p>
                                    </div>
                                )}

                                <div className="mt-4 flex flex-col space-y-2">
                                    <div className="flex space-x-2">
                                        {item.status === 'RESERVED' && item.currentReservation && item.currentReservation.description !== 'Reservado permanentemente' && (
                                            <Button onClick={() => handleCheckIn(item.currentReservation!.id)} className="flex-1">
                                                <Key className="h-4 w-4 mr-2" />
                                                Entregar
                                            </Button>
                                        )}
                                        {item.status === 'OCCUPIED' && item.currentReservation && item.currentReservation.description !== 'Reservado permanentemente' && (
                                            <Button variant="secondary" onClick={() => handleCheckOut(item.currentReservation!.id)} className="flex-1">
                                                <CheckCircle className="h-4 w-4 mr-2" />
                                                Recibir
                                            </Button>
                                        )}
                                    </div>

                                    {/* Hide View Schedule button for permanent labs */}
                                    {item.lab.name !== 'SALA 1' && item.lab.name !== 'SALA 2' && item.lab.name !== 'SALA 10' && (
                                        <Button variant="outline" onClick={() => handleViewSchedule(item)} className="w-full">
                                            Ver Horario
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

            {/* Schedule Modal */}
            {isModalOpen && selectedLab && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[80vh] overflow-hidden flex flex-col">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                            <div>
                                <h3 className="text-xl font-bold text-gray-900">Horario de {selectedLab.lab.name}</h3>
                                <p className="text-sm text-gray-500">Reservas para hoy</p>
                            </div>
                            <button onClick={handleCloseModal} className="text-gray-400 hover:text-gray-600">
                                <span className="text-2xl">&times;</span>
                            </button>
                        </div>
                        <div className="p-6 overflow-y-auto flex-1">
                            {schedule.length > 0 ? (
                                <div className="space-y-4">
                                    {schedule.map((res) => (
                                        <div key={res.id} className={`p-4 rounded-lg border-l-4 ${res.status === 'OCCUPIED' ? 'bg-red-50 border-red-500' :
                                            res.status === 'COMPLETED' ? 'bg-gray-50 border-gray-500' : 'bg-blue-50 border-blue-500'
                                            }`}>
                                            <div className="flex justify-between items-start">
                                                <h4 className="font-bold text-gray-900">{res.subject}</h4>
                                                <span className={`text-xs font-bold px-2 py-1 rounded ${res.status === 'OCCUPIED' ? 'bg-red-100 text-red-800' :
                                                    res.status === 'COMPLETED' ? 'bg-gray-200 text-gray-800' : 'bg-blue-100 text-blue-800'
                                                    }`}>
                                                    {res.status === 'OCCUPIED' ? 'EN CURSO' :
                                                        res.status === 'COMPLETED' ? 'FINALIZADA' : 'PENDIENTE'}
                                                </span>
                                            </div>
                                            <p className="text-sm text-gray-600 mt-1">{res.description}</p>
                                            <div className="flex items-center mt-2 text-sm text-gray-500">
                                                <Clock className="h-4 w-4 mr-1" />
                                                {new Date(res.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} -
                                                {new Date(res.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8 text-gray-500">
                                    No hay más reservas para hoy.
                                </div>
                            )}
                        </div>
                        <div className="p-4 border-t border-gray-100 bg-gray-50 text-right">
                            <Button variant="outline" onClick={handleCloseModal}>Cerrar</Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
