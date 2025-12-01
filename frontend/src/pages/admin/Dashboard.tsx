import { useEffect, useState } from 'react';
import { adminService } from '../../services/admin.service';
import { Button } from '../../components/ui/Button';
import { LogOut, Key, CheckCircle, Clock, AlertTriangle, Calendar } from 'lucide-react';
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
        school?: { colorHex: string; name: string };
    };
    overdueReservation?: {
        id: number;
        subject: string;
        startTime: string;
        endTime: string;
        user: { fullName: string };
        professorName?: string;
        school?: { colorHex: string; name: string };
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
    const [isGeneralScheduleOpen, setIsGeneralScheduleOpen] = useState(false);
    const [generalSchedule, setGeneralSchedule] = useState<any[]>([]);

    const handleViewGeneralSchedule = async () => {
        setIsGeneralScheduleOpen(true);
        try {
            const dateToUse = new Date(simulatedDate);
            const data = await adminService.getGeneralSchedule(dateToUse);
            setGeneralSchedule(data);
        } catch (error) {
            console.error('Error loading general schedule:', error);
        }
    };

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
            {/* Professional Header */}
            <header className="bg-slate-900 text-white shadow-lg sticky top-0 z-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-20">
                        {/* Logo & Title */}
                        <div className="flex items-center space-x-4">
                            <div className="bg-white p-1.5 rounded-lg">
                                <img src="/images/logo_pucesi_ok.png" alt="PUCESI" className="h-10 w-auto" />
                            </div>
                            <div className="hidden md:block">
                                <h1 className="text-xl font-bold leading-tight">Sistema de Reservas</h1>
                                <p className="text-xs text-slate-400 font-medium tracking-wide">PANEL ADMINISTRATIVO</p>
                            </div>
                        </div>

                        {/* Center Navigation / Actions */}
                        <div className="flex items-center space-x-6">
                            <button
                                onClick={handleViewGeneralSchedule}
                                className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-md transition-all shadow-md hover:shadow-lg font-medium text-sm group"
                            >
                                <Calendar className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform" />
                                Ver Horario General
                            </button>
                        </div>

                        {/* Right Side: Date Control & User */}
                        <div className="flex items-center space-x-6">
                            {/* Date Simulator */}
                            <div className="hidden lg:flex flex-col items-end mr-2">
                                <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">Fecha de Sistema</label>
                                <div className="relative">
                                    <input
                                        type="datetime-local"
                                        value={simulatedDate}
                                        onChange={handleDateChange}
                                        className="bg-slate-800 border border-slate-700 text-white text-xs rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 w-40"
                                    />
                                </div>
                            </div>

                            {/* Divider */}
                            <div className="h-8 w-px bg-slate-700 hidden md:block"></div>

                            {/* User & Logout */}
                            <div className="flex items-center space-x-3">
                                <div className="text-right hidden md:block">
                                    <p className="text-sm font-medium text-white">Administrador</p>
                                    <p className="text-xs text-slate-400 capitalize">{formatDate(currentDate).split(',')[0]}</p>
                                </div>
                                <button
                                    onClick={handleLogout}
                                    className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full transition-colors"
                                    title="Cerrar Sesión"
                                >
                                    <LogOut className="h-5 w-5" />
                                </button>
                            </div>
                        </div>
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
                                    <div
                                        className="mb-4 p-3 rounded-lg border-l-4 shadow-sm"
                                        style={{
                                            backgroundColor: item.currentReservation.school ? `${item.currentReservation.school.colorHex}15` : '#eff6ff',
                                            borderLeftColor: item.currentReservation.school ? item.currentReservation.school.colorHex : '#3b82f6'
                                        }}
                                    >
                                        <p className="text-sm font-semibold mb-1" style={{ color: item.currentReservation.school ? item.currentReservation.school.colorHex : '#1e3a8a' }}>
                                            {item.currentReservation.description === 'Reservado permanentemente' ? 'Uso Permanente:' : 'Clase Actual:'}
                                        </p>
                                        <p className="text-lg font-bold text-gray-800 line-clamp-1" title={item.currentReservation.subject}>
                                            {item.currentReservation.subject}
                                        </p>
                                        <div className="flex items-center text-gray-600 text-sm mt-1">
                                            <Clock className="h-4 w-4 mr-1" />
                                            {item.currentReservation.description === 'Reservado permanentemente' ? (
                                                <span>Todo el día</span>
                                            ) : (
                                                <span>
                                                    {new Date(item.currentReservation.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} -
                                                    {new Date(item.currentReservation.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            )}
                                        </div>
                                        {item.currentReservation.professorName && (
                                            <p className="text-xs text-gray-500 mt-2 font-medium">
                                                Profesor: {item.currentReservation.professorName}
                                            </p>
                                        )}

                                        {/* School Badge */}
                                        <div className="mt-2">
                                            {item.currentReservation.school ? (
                                                <span className="inline-block px-2 py-0.5 rounded text-[10px] text-white font-bold shadow-sm" style={{ backgroundColor: item.currentReservation.school.colorHex }}>
                                                    {item.currentReservation.school.name}
                                                </span>
                                            ) : (
                                                /* Fallback for permanent usage if school is missing */
                                                item.currentReservation.description === 'Reservado permanentemente' && (
                                                    <span className="inline-block px-2 py-0.5 rounded text-[10px] text-white font-bold shadow-sm bg-gray-500">
                                                        USO GENERAL
                                                    </span>
                                                )
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
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2">
                    <div className="bg-white rounded-xl shadow-2xl max-w-[98vw] w-full max-h-[98vh] overflow-hidden flex flex-col">
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

                                const renderSlot = (slot: any, index: number) => {
                                    const schoolColor = slot.data?.school?.colorHex;
                                    const borderColor = schoolColor || (slot.data?.status === 'OCCUPIED' ? '#ef4444' : '#6366f1');
                                    const bgColor = schoolColor ? `${schoolColor}15` : (slot.data?.status === 'OCCUPIED' ? '#fef2f2' : '#eef2ff');

                                    return (
                                        <div key={index} className="h-full">
                                            {slot.status === 'FREE' ? (
                                                <div
                                                    className="flex flex-col justify-between h-full bg-green-50 border-l-4 border-green-500 p-4 rounded-lg shadow-sm hover:shadow-md transition-all cursor-pointer hover:bg-green-100 group"
                                                    onClick={() => alert(`Reservar: ${slot.startTime.toLocaleTimeString()} - ${slot.endTime.toLocaleTimeString()}`)}
                                                >
                                                    <div className="flex justify-between items-center mb-2">
                                                        <span className="text-green-800 font-bold text-lg group-hover:text-green-900">DISPONIBLE</span>
                                                        <CheckCircle className="h-5 w-5 text-green-600 group-hover:text-green-700" />
                                                    </div>
                                                    <div className="flex items-center text-green-700 font-medium group-hover:text-green-800">
                                                        <Clock className="h-4 w-4 mr-2" />
                                                        {slot.startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} -
                                                        {slot.endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </div>
                                                    <p className="text-xs text-green-600 mt-2 font-semibold group-hover:text-green-700">Click para reservar</p>
                                                </div>
                                            ) : (
                                                <div
                                                    className="flex flex-col h-full p-4 rounded-lg border-l-4 shadow-sm hover:shadow-md transition-all"
                                                    style={{
                                                        backgroundColor: bgColor,
                                                        borderLeftColor: borderColor
                                                    }}
                                                >
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
                                                        {slot.data.school ? (
                                                            <span className="text-xs font-bold px-2 py-0.5 rounded text-white" style={{ backgroundColor: slot.data.school.colorHex }}>
                                                                {slot.data.school.name}
                                                            </span>
                                                        ) : (
                                                            <span className={`text-xs font-bold px-2 py-0.5 rounded border ${slot.data.type === 'CLASS' ? 'bg-indigo-100 text-indigo-800 border-indigo-200' : 'bg-blue-100 text-blue-800 border-blue-200'
                                                                }`}>
                                                                {slot.data.type === 'CLASS' ? 'CLASE' : 'EVENTO'}
                                                            </span>
                                                        )}
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
                                };

                                return (
                                    <div className="space-y-8">
                                        {/* Availability Summary */}
                                        <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-200 mb-6">
                                            <h4 className="text-indigo-800 font-bold mb-2 flex items-center">
                                                <CheckCircle className="h-5 w-5 mr-2 text-indigo-600" />
                                                Horarios Disponibles para Reserva
                                            </h4>
                                            <div className="flex flex-wrap gap-2">
                                                {(() => {
                                                    const freeRanges: { start: Date, end: Date }[] = [];
                                                    let currentRange: { start: Date, end: Date } | null = null;

                                                    timeline.forEach(slot => {
                                                        if (slot.status === 'FREE') {
                                                            if (!currentRange) {
                                                                currentRange = { start: slot.startTime, end: slot.endTime };
                                                            } else if (currentRange.end.getTime() === slot.startTime.getTime()) {
                                                                currentRange.end = slot.endTime;
                                                            } else {
                                                                freeRanges.push(currentRange);
                                                                currentRange = { start: slot.startTime, end: slot.endTime };
                                                            }
                                                        } else {
                                                            if (currentRange) {
                                                                freeRanges.push(currentRange);
                                                                currentRange = null;
                                                            }
                                                        }
                                                    });
                                                    if (currentRange) freeRanges.push(currentRange);

                                                    if (freeRanges.length === 0) return <span className="text-gray-500 italic text-sm">No hay horarios disponibles hoy.</span>;

                                                    return freeRanges.map((range, idx) => (
                                                        <span key={idx} className="bg-white text-indigo-700 border border-indigo-300 px-3 py-1 rounded-full text-sm font-bold shadow-sm">
                                                            {range.start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {range.end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </span>
                                                    ));
                                                })()}
                                            </div>
                                        </div>

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
                </div >
            )}
            {/* General Schedule Modal */}
            {isGeneralScheduleOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-[98vw] h-[95vh] flex flex-col">
                        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50 rounded-t-xl">
                            <div className="flex items-center space-x-4">
                                <div>
                                    <h3 className="text-xl font-bold text-gray-900 flex items-center">
                                        <Calendar className="h-6 w-6 mr-2 text-blue-600" />
                                        Horario General
                                    </h3>
                                    <p className="text-sm text-gray-500">Vista global de laboratorios</p>
                                </div>
                                <div className="h-8 w-px bg-gray-300 mx-2"></div>
                                <div className="flex flex-col">
                                    <label className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-0.5">Fecha a consultar</label>
                                    <input
                                        type="datetime-local"
                                        value={simulatedDate}
                                        onChange={handleDateChange}
                                        className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>
                            <button onClick={() => setIsGeneralScheduleOpen(false)} className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-200 rounded-full transition-colors">
                                <span className="text-2xl">&times;</span>
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto flex-1 bg-gray-50/50">
                            <div className="space-y-6">
                                {generalSchedule.map((item, index) => {
                                    const isPermanentLab = ['SALA 1', 'SALA 2', 'SALA 10'].includes(item.lab.name);

                                    return (
                                        <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                                            <div className="bg-gray-100 px-4 py-2 border-b border-gray-200 flex justify-between items-center">
                                                <div className="flex items-center">
                                                    <h4 className="font-bold text-gray-800 mr-3">{item.lab.name}</h4>
                                                    {isPermanentLab && (
                                                        <span className="bg-gray-800 text-white text-[10px] px-2 py-0.5 rounded-full font-bold uppercase">Uso Permanente</span>
                                                    )}
                                                </div>
                                                <span className="text-xs text-gray-500">Capacidad: {item.lab.capacity}</span>
                                            </div>
                                            <div className="p-4">
                                                {item.reservations.length > 0 ? (
                                                    <div className="flex space-x-4 overflow-x-auto pb-2">
                                                        {item.reservations.map((res: any, idx: number) => (
                                                            <div key={idx} className={`flex-shrink-0 w-64 p-3 rounded border-l-4 ${res.description === 'Reservado permanentemente' ? 'bg-gray-100 border-gray-500 w-full max-w-md' : 'bg-gray-50'}`}
                                                                style={res.description !== 'Reservado permanentemente' ? {
                                                                    borderLeftColor: res.school?.colorHex || '#cbd5e1',
                                                                    backgroundColor: res.school ? `${res.school.colorHex}10` : '#f8fafc'
                                                                } : {}}
                                                            >
                                                                <div className="flex justify-between items-start mb-1">
                                                                    <span className="text-xs font-bold text-gray-500">
                                                                        {res.description === 'Reservado permanentemente' ? 'TODO EL DÍA' : (
                                                                            `${new Date(res.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${new Date(res.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                                                                        )}
                                                                    </span>
                                                                    {res.school ? (
                                                                        <span className="text-[10px] px-1.5 py-0.5 rounded text-white font-bold" style={{ backgroundColor: res.school.colorHex }}>
                                                                            {res.school.name}
                                                                        </span>
                                                                    ) : (
                                                                        /* Fallback for permanent usage if school is missing */
                                                                        res.description === 'Reservado permanentemente' && (
                                                                            <span className="text-[10px] px-1.5 py-0.5 rounded text-white font-bold bg-gray-500">
                                                                                USO GENERAL
                                                                            </span>
                                                                        )
                                                                    )}
                                                                </div>
                                                                <p className="font-bold text-sm text-gray-800 line-clamp-1" title={res.subject}>{res.subject}</p>
                                                                <p className="text-xs text-gray-500 mt-1 truncate">{res.user?.fullName}</p>
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <p className="text-sm text-gray-400 italic">
                                                        {isPermanentLab ? 'Laboratorio de uso permanente (sin reservas específicas registradas hoy).' : 'No hay reservas para este día.'}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>

                        <div className="p-4 border-t border-gray-100 bg-gray-50 text-right rounded-b-xl">
                            <Button variant="outline" onClick={() => setIsGeneralScheduleOpen(false)}>Cerrar</Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
