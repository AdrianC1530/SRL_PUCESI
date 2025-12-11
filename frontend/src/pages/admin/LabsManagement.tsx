import { useEffect, useState } from 'react';
import { adminService } from '../../services/admin.service';
import { Button } from '../../components/ui/Button';
import { Edit2, Save, X, Monitor, Users, FileText, Cpu } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Lab {
    id: number;
    name: string;
    capacity: number;
    description: string;
    isPermanent: boolean;
    software: string[];
}

interface Software {
    id: number;
    name: string;
}

export const LabsManagement = () => {
    const [labs, setLabs] = useState<Lab[]>([]);
    const [softwareList, setSoftwareList] = useState<Software[]>([]);
    const [editingLab, setEditingLab] = useState<Lab | null>(null);
    const navigate = useNavigate();

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [labsData, softwareData] = await Promise.all([
                adminService.getLabs(),
                adminService.getSoftware()
            ]);

            // Sort labs
            const sortedLabs = labsData.sort((a: Lab, b: Lab) => {
                const getNumber = (name: string) => {
                    if (name.includes('MAC')) return 999;
                    const match = name.match(/\d+/);
                    return match ? parseInt(match[0]) : 0;
                };
                return getNumber(a.name) - getNumber(b.name);
            });

            setLabs(sortedLabs);
            setSoftwareList(softwareData);
        } catch (error) {
            console.error('Error loading data:', error);
        }
    };

    const handleEdit = (lab: Lab) => {
        setEditingLab({ ...lab });
    };

    const handleSave = async () => {
        if (!editingLab) return;
        try {
            await adminService.updateLab(editingLab.id, {
                name: editingLab.name,
                capacity: editingLab.capacity,
                description: editingLab.description,
                isPermanent: editingLab.isPermanent,
                software: editingLab.software
            });
            setEditingLab(null);
            loadData();
        } catch (error) {
            console.error('Error updating lab:', error);
            alert('Error al actualizar la sala');
        }
    };

    const handleCancel = () => {
        setEditingLab(null);
    };

    const handleChange = (field: keyof Lab, value: any) => {
        if (!editingLab) return;
        setEditingLab({ ...editingLab, [field]: value });
    };

    const toggleSoftware = (softwareName: string) => {
        if (!editingLab) return;
        const currentSoftware = editingLab.software || [];
        const newSoftware = currentSoftware.includes(softwareName)
            ? currentSoftware.filter(s => s !== softwareName)
            : [...currentSoftware, softwareName];
        handleChange('software', newSoftware);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100 p-8">
            <div className="max-w-7xl mx-auto">
                <div className="flex flex-col md:flex-row justify-between items-center mb-10 gap-4">
                    <div>
                        <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 tracking-tight">
                            Administración de Salas
                        </h1>
                        <p className="text-slate-500 mt-2 text-lg font-light">
                            Gestiona capacidad, software y estado de los laboratorios.
                        </p>
                    </div>
                    <div className="flex space-x-4">
                        <Button
                            onClick={() => navigate('/admin/software')}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-md hover:shadow-lg transition-all duration-300 flex items-center px-6 py-2.5 rounded-xl font-medium"
                        >
                            <Cpu className="h-5 w-5 mr-2.5" />
                            Gestionar Software
                        </Button>
                        <Button
                            onClick={() => navigate('/admin/dashboard')}
                            className="bg-slate-800 hover:bg-slate-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 flex items-center px-6 py-2.5 rounded-xl font-medium"
                        >
                            Volver al Dashboard
                        </Button>
                    </div>
                </div>

                <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50/50 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500 font-bold">
                                    <th className="p-5 w-32">Nombre</th>
                                    <th className="p-5 w-24">Capacidad</th>
                                    <th className="p-5 w-64">Descripción</th>
                                    <th className="p-5">Software Instalado</th>
                                    <th className="p-5 w-32 text-center">Estado</th>
                                    <th className="p-5 w-24 text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {labs.map((lab) => (
                                    <tr key={lab.id} className="hover:bg-indigo-50/30 transition-colors duration-200 group">
                                        <td className="p-5 font-semibold text-slate-800 align-top">
                                            {editingLab?.id === lab.id ? (
                                                <input
                                                    type="text"
                                                    value={editingLab.name}
                                                    onChange={(e) => handleChange('name', e.target.value)}
                                                    className="w-full border border-indigo-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all shadow-sm bg-white"
                                                />
                                            ) : (
                                                <div className="flex items-center">
                                                    <div className="p-2 bg-indigo-100 rounded-lg mr-3 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors duration-300">
                                                        <Monitor className="h-5 w-5" />
                                                    </div>
                                                    {lab.name}
                                                </div>
                                            )}
                                        </td>
                                        <td className="p-5 align-top">
                                            {editingLab?.id === lab.id ? (
                                                <input
                                                    type="number"
                                                    value={editingLab.capacity}
                                                    onChange={(e) => handleChange('capacity', parseInt(e.target.value))}
                                                    className="w-full border border-indigo-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all shadow-sm bg-white"
                                                />
                                            ) : (
                                                <div className="flex items-center text-slate-600 font-medium">
                                                    <Users className="h-4 w-4 mr-2 text-slate-400" />
                                                    {lab.capacity}
                                                </div>
                                            )}
                                        </td>
                                        <td className="p-5 align-top">
                                            {editingLab?.id === lab.id ? (
                                                <textarea
                                                    value={editingLab.description || ''}
                                                    onChange={(e) => handleChange('description', e.target.value)}
                                                    rows={3}
                                                    className="w-full border border-indigo-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all shadow-sm bg-white resize-none"
                                                />
                                            ) : (
                                                <div className="flex items-start text-slate-600">
                                                    <FileText className="h-4 w-4 mr-2 mt-1 text-slate-400 flex-shrink-0" />
                                                    <span className="text-sm leading-relaxed">{lab.description}</span>
                                                </div>
                                            )}
                                        </td>
                                        <td className="p-5 align-top">
                                            {editingLab?.id === lab.id ? (
                                                <div className="max-h-48 overflow-y-auto border border-indigo-200 rounded-lg p-3 bg-slate-50 shadow-inner">
                                                    <div className="grid grid-cols-1 gap-2">
                                                        {softwareList.map(sw => (
                                                            <label key={sw.id} className="flex items-center space-x-3 p-2 hover:bg-white rounded-md cursor-pointer transition-colors">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={editingLab.software?.includes(sw.name)}
                                                                    onChange={() => toggleSoftware(sw.name)}
                                                                    className="rounded text-indigo-600 focus:ring-indigo-500 border-gray-300 h-4 w-4"
                                                                />
                                                                <span className="text-sm text-slate-700">{sw.name}</span>
                                                            </label>
                                                        ))}
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="flex flex-wrap gap-2">
                                                    {lab.software && lab.software.length > 0 ? (
                                                        lab.software.map((sw, idx) => (
                                                            <span key={idx} className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100 shadow-sm">
                                                                {sw}
                                                            </span>
                                                        ))
                                                    ) : (
                                                        <span className="text-xs text-slate-400 italic flex items-center">
                                                            <span className="w-1.5 h-1.5 rounded-full bg-slate-300 mr-2"></span>
                                                            Sin software asignado
                                                        </span>
                                                    )}
                                                </div>
                                            )}
                                        </td>
                                        <td className="p-5 text-center align-top">
                                            {editingLab?.id === lab.id ? (
                                                <div className="flex justify-center pt-2">
                                                    <label className="relative inline-flex items-center cursor-pointer">
                                                        <input
                                                            type="checkbox"
                                                            checked={editingLab.isPermanent}
                                                            onChange={(e) => handleChange('isPermanent', e.target.checked)}
                                                            className="sr-only peer"
                                                        />
                                                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                                                        <span className="ml-3 text-sm font-medium text-gray-900">{editingLab.isPermanent ? 'Permanente' : 'Reservable'}</span>
                                                    </label>
                                                </div>
                                            ) : (
                                                lab.isPermanent ? (
                                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-700 border border-purple-200 shadow-sm">
                                                        Permanente
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700 border border-emerald-200 shadow-sm">
                                                        Reservable
                                                    </span>
                                                )
                                            )}
                                        </td>
                                        <td className="p-5 text-right align-top">
                                            {editingLab?.id === lab.id ? (
                                                <div className="flex justify-end space-x-2">
                                                    <button
                                                        onClick={handleSave}
                                                        className="p-2 text-white bg-emerald-500 hover:bg-emerald-600 rounded-lg transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                                                        title="Guardar"
                                                    >
                                                        <Save className="h-4 w-4" />
                                                    </button>
                                                    <button
                                                        onClick={handleCancel}
                                                        className="p-2 text-white bg-rose-500 hover:bg-rose-600 rounded-lg transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                                                        title="Cancelar"
                                                    >
                                                        <X className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={() => handleEdit(lab)}
                                                    className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all duration-200"
                                                    title="Editar"
                                                >
                                                    <Edit2 className="h-5 w-5" />
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};
