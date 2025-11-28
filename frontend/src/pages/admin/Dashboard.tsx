import { useEffect, useState } from 'react';
import { adminService } from '../../services/admin.service';
import { Button } from '../../components/ui/Button';
import { LogOut, Key, CheckCircle, Clock, AlertTriangle } from 'lucide-react';
import { useAuthStore, type AuthState } from '../../store/authStore';
import { useNavigate } from 'react-router-dom';

interface LabStatus {
    lab: {
        id: number;
        name: string;
        capacity: number;
        description: string;
    };
    status: 'FREE' | 'RESERVED' | 'OCCUPIED' | 'OVERDUE';
    currentReservation?: {
        id: number;
        subject: string;
        description?: string;
        type: 'CLASS' | 'EVENT';
        startTime: string;
        endTime: string;
        user: { fullName: string };
        professorName?: string;
    };
    overdueReservation?: {
        id: number;
        subject: string;
        startTime: string;
        endTime: string;
        user: { fullName: string };
        professorName?: string;
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

                                {item.overdueReservation ? (
                                    <div className="mb-4 p-3 bg-red-50 rounded-lg border border-red-200">
                                        <div className="flex items-center text-red-800 mb-2">
                                            <AlertTriangle className="h-5 w-5 mr-2" />
                                            <span className="font-bold">¡LLAVE NO DEVUELTA!</span>
                                        </div>
                                        <p className="text-sm text-red-700 mb-1">
                                            La clase de <strong>{item.overdueReservation.subject}</strong> terminó a las {new Date(item.overdueReservation.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.
                                        </p>
                                        <p className="text-xs text-red-600 italic">
                                            Profesor: {item.overdueReservation.professorName}
                                        </p>
                                    </div>
                                ) : item.currentReservation ? (
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
                                        {item.currentReservation.professorName && (
                                            <p className="text-xs text-blue-600 mt-2 font-medium">
                                                Profesor: {item.currentReservation.professorName}
                                            </p>
                                        )}
                                    </div>
                                ) : (
                                    <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                                        <p className="text-gray-500 text-center italic">Disponible ahora</p>
                                    </div>
                                )}

                                <div className="mt-4 flex flex-col space-y-2">
                                    <div className="flex space-x-2">
                                        {/* Case 1: Overdue Key - Only allow receiving it */}
                                        {item.overdueReservation && (
                                            <Button variant="danger" onClick={() => handleCheckOut(item.overdueReservation!.id)} className="flex-1 bg-red-600 hover:bg-red-700 text-white">
                                                <CheckCircle className="h-4 w-4 mr-2" />
                                                Recibir Llave Atrasada
                                            </Button>
                                        )}

                                        {/* Case 2: Normal Reservation Check-in */}
                                        {/* Only show if NO overdue key exists */}
                                        {!item.overdueReservation && item.status === 'RESERVED' && item.currentReservation && item.currentReservation.description !== 'Reservado permanentemente' && (
                                            <Button onClick={() => handleCheckIn(item.currentReservation!.id)} className="flex-1">
                                                <Key className="h-4 w-4 mr-2" />
                                                Entregar
                                            </Button>
                                        )}

                                        {/* Case 3: Normal Reservation Check-out */}
                                        {!item.overdueReservation && item.status === 'OCCUPIED' && item.currentReservation && item.currentReservation.description !== 'Reservado permanentemente' && (
                                            <Button variant="secondary" onClick={() => handleCheckOut(item.currentReservation!.id)} className="flex-1">
                                                <CheckCircle className="h-4 w-4 mr-2" />
                                                Recibir
                                            </Button>
                                        )}

                                        {/* Case 4: Next Reservation Waiting (but blocked by overdue) */}
                                        {item.overdueReservation && item.currentReservation && (
                                            <div className="w-full text-center text-xs text-orange-600 font-bold mt-2 p-2 bg-orange-50 rounded border border-orange-200">
                                                ⚠ No se puede entregar llave para la siguiente clase ({item.currentReservation.subject}) hasta recibir la anterior.
                                            </div>
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
                    <div className="bg-white rounded-xl shadow-2xl max-w-[95vw] w-full max-h-[95vh] overflow-hidden flex flex-col">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                            <div>
                                <h3 className="text-xl font-bold text-gray-900">Horario de {selectedLab.lab.name}</h3>
                                <p className="text-sm text-gray-500">
                                    {new Date(simulatedDate).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                                </p>
                            </div>
                            <button onClick={handleCloseModal} className="text-gray-400 hover:text-gray-600">
                                <span className="text-2xl">&times;</span>
                            </button>
                        </div>
                        <div className="p-6 overflow-y-auto flex-1">
                            {(() => {
                                // Helper to generate timeline with free slots
                                const getDailySlots = () => {
                                    const slots = [];
                                    const startOfDay = new Date(simulatedDate);
                                    startOfDay.setHours(7, 0, 0, 0);
                                    const endOfDay = new Date(simulatedDate);
                                    endOfDay.setHours(22, 0, 0, 0);

                                    let currentTime = new Date(startOfDay);
                                    const sortedSchedule = [...schedule].sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

                                    for (const res of sortedSchedule) {
                                        const resStart = new Date(res.startTime);
                                        const resEnd = new Date(res.endTime);

                                        // Add free slot before reservation if gap exists
                                        if (currentTime < resStart) {
                                            if (resStart > endOfDay) {
                                                // Gap goes until end of day (or capped at reservation start if it's later? No, cap at endOfDay)
                                                // Actually if reservation starts after endOfDay, we shouldn't be here if we filtered correctly, 
                                                // but let's assume we handle gaps within 7-21
                                                slots.push({
                                                    status: 'FREE',
                                                    startTime: new Date(currentTime),
                                                    endTime: resStart > endOfDay ? endOfDay : resStart
                                                });
                                            } else {
                                                slots.push({
                                                    status: 'FREE',
                                                    startTime: new Date(currentTime),
                                                    endTime: resStart
                                                });
                                            }
                                        }

                                        // Add reservation slot
                                        slots.push({
                                            status: 'OCCUPIED',
                                            data: res,
                                            startTime: resStart,
                                            endTime: resEnd
                                        });

                                        currentTime = resEnd;
                                    }

                                    // Add final free slot if time remains
                                    if (currentTime < endOfDay) {
                                        slots.push({
                                            status: 'FREE',
                                            startTime: new Date(currentTime),
                                            endTime: endOfDay
                                        });
                                    }

                                    return slots;
                                };

                                const timeline = getDailySlots();
                                const morningSlots = timeline.filter(slot => slot.startTime.getHours() < 13);
                                const afternoonSlots = timeline.filter(slot => slot.startTime.getHours() >= 13);

                                const renderSlot = (slot: any, index: number) => (
                                    <div key={index} className={`p-4 rounded-lg border-l-4 shadow-sm transition-all hover:shadow-md ${slot.status === 'FREE'
                                        ? 'bg-green-50 border-green-500'
                                        : slot.data.status === 'OCCUPIED'
                                            ? 'bg-red-50 border-red-500'
                                            : slot.data.status === 'COMPLETED'
                                                ? 'bg-gray-50 border-gray-500'
                                                : slot.data.type === 'CLASS'
                                                    ? 'bg-indigo-50 border-indigo-500'
                                                    : 'bg-blue-50 border-blue-500'
                                        }`}>
                                        {slot.status === 'FREE' ? (
                                            <div className="flex flex-col justify-between h-full">
                                                <div className="flex justify-between items-center mb-2">
                                                    <span className="text-green-800 font-bold text-lg">DISPONIBLE</span>
                                                    <CheckCircle className="h-5 w-5 text-green-600" />
                                                </div>
                                                <div className="flex items-center text-green-700 font-medium">
                                                    <Clock className="h-4 w-4 mr-2" />
                                                    {slot.startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} -
                                                    {slot.endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </div>
                                                <p className="text-xs text-green-600 mt-2">Espacio libre para reserva</p>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col h-full">
                                                <div className="flex justify-between items-start mb-2">
                                                    <h4 className="font-bold text-gray-900 line-clamp-1" title={slot.data.subject}>{slot.data.subject}</h4>
                                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${slot.data.status === 'OCCUPIED' ? 'bg-red-100 text-red-800' :
                                                        slot.data.status === 'COMPLETED' ? 'bg-gray-200 text-gray-800' : 'bg-blue-100 text-blue-800'
                                                        }`}>
                                                        {slot.data.status === 'OCCUPIED' ? 'En Curso' :
                                                            slot.data.status === 'COMPLETED' ? 'Finalizada' : 'Reservada'}
                                                    </span>
                                                </div>

                                                <div className="flex items-center space-x-2 mb-2">
                                                    <span className={`text-xs font-bold px-2 py-0.5 rounded border ${slot.data.type === 'CLASS' ? 'bg-indigo-100 text-indigo-800 border-indigo-200' : 'bg-blue-100 text-blue-800 border-blue-200'
                                                        }`}>
                                                        {slot.data.type === 'CLASS' ? 'CLASE' : 'EVENTO'}
                                                    </span>
                                                </div>

                                                <p className="text-sm text-gray-600 mb-2 line-clamp-2 flex-grow">{slot.data.description}</p>

                                                <div className="mt-auto pt-3 border-t border-gray-100/50">
                                                    <div className="flex items-center text-gray-500 font-medium text-sm mb-1">
                                                        <Clock className="h-4 w-4 mr-2" />
                                                        {new Date(slot.data.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} -
                                                        {new Date(slot.data.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </div>
                                                    {slot.data.user && (
                                                        <p className="text-xs text-gray-400 truncate">
                                                            Por: {slot.data.user.fullName}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );

                                return (
                                    <div className="space-y-8">
                                        {/* Morning Section */}
                                        <div>
                                            <h4 className="text-lg font-bold text-gray-800 mb-4 flex items-center border-b pb-2">
                                                <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm mr-3">Mañana (07:00 - 13:00)</span>
                                            </h4>
                                            <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                                                {morningSlots.length > 0 ? (
                                                    morningSlots.map((slot, index) => renderSlot(slot, index))
                                                ) : (
                                                    <div className="col-span-full text-center py-8 text-gray-400 italic bg-gray-50 rounded-lg border border-dashed border-gray-300">
                                                        No hay actividad registrada en la mañana.
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Afternoon Section */}
                                        <div>
                                            <h4 className="text-lg font-bold text-gray-800 mb-4 flex items-center border-b pb-2">
                                                <span className="bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full text-sm mr-3">Tarde / Noche (13:00 - 22:00)</span>
                                            </h4>
                                            <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                                                {afternoonSlots.length > 0 ? (
                                                    afternoonSlots.map((slot, index) => renderSlot(slot, index))
                                                ) : (
                                                    <div className="col-span-full text-center py-8 text-gray-400 italic bg-gray-50 rounded-lg border border-dashed border-gray-300">
                                                        No hay actividad registrada en la tarde.
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })()}
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
