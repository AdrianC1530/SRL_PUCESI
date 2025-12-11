import { useEffect, useState } from 'react';
import { adminService } from '../../services/admin.service';
import { Button } from '../../components/ui/Button';
import { Edit2, Save, X, Trash2, Plus, Monitor } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Software {
    id: number;
    name: string;
    version?: string;
    license?: string;
}

export const SoftwareManagement = () => {
    const [softwareList, setSoftwareList] = useState<Software[]>([]);
    const [editingSoftware, setEditingSoftware] = useState<Software | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [newSoftware, setNewSoftware] = useState<Partial<Software>>({});
    const navigate = useNavigate();

    useEffect(() => {
        loadSoftware();
    }, []);

    const loadSoftware = async () => {
        try {
            const data = await adminService.getSoftware();
            setSoftwareList(data);
        } catch (error) {
            console.error('Error loading software:', error);
        }
    };

    const handleEdit = (software: Software) => {
        setEditingSoftware({ ...software });
    };

    const handleSave = async () => {
        if (!editingSoftware) return;
        try {
            await adminService.updateSoftware(editingSoftware.id, {
                name: editingSoftware.name,
                version: editingSoftware.version,
                license: editingSoftware.license
            });
            setEditingSoftware(null);
            loadSoftware();
        } catch (error) {
            console.error('Error updating software:', error);
            alert('Error al actualizar software');
        }
    };

    const handleCreate = async () => {
        if (!newSoftware.name) {
            alert('El nombre es obligatorio');
            return;
        }
        try {
            await adminService.createSoftware({
                name: newSoftware.name,
                version: newSoftware.version,
                license: newSoftware.license
            });
            setIsCreating(false);
            setNewSoftware({});
            loadSoftware();
        } catch (error) {
            console.error('Error creating software:', error);
            alert('Error al crear software');
        }
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm('¿Estás seguro de eliminar este software?')) return;
        try {
            await adminService.deleteSoftware(id);
            loadSoftware();
        } catch (error) {
            console.error('Error deleting software:', error);
            alert('Error al eliminar software');
        }
    };

    const handleCancel = () => {
        setEditingSoftware(null);
        setIsCreating(false);
        setNewSoftware({});
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100 p-8">
            <div className="max-w-7xl mx-auto">
                <div className="flex flex-col md:flex-row justify-between items-center mb-10 gap-4">
                    <div>
                        <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-600 tracking-tight">
                            Inventario de Software
                        </h1>
                        <p className="text-slate-500 mt-2 text-lg font-light">
                            Gestiona el catálogo de software disponible para los laboratorios.
                        </p>
                    </div>
                    <div className="flex space-x-4">
                        <Button
                            onClick={() => navigate('/admin/labs')}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-md hover:shadow-lg transition-all duration-300 flex items-center px-6 py-2.5 rounded-xl font-medium"
                        >
                            <Monitor className="h-5 w-5 mr-2.5" />
                            Gestionar Salas
                        </Button>
                        <Button
                            onClick={() => navigate('/admin/dashboard')}
                            className="bg-slate-800 hover:bg-slate-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 flex items-center px-6 py-2.5 rounded-xl font-medium"
                        >
                            Volver al Dashboard
                        </Button>
                    </div>
                </div>

                <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 overflow-hidden mb-8 p-6 flex justify-between items-center">
                    <h2 className="text-xl font-semibold text-slate-800">Catálogo Actual</h2>
                    <Button
                        onClick={() => setIsCreating(true)}
                        className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 flex items-center px-6 py-2.5 rounded-xl font-medium transform hover:-translate-y-0.5"
                    >
                        <Plus className="h-5 w-5 mr-2" />
                        Agregar Software
                    </Button>
                </div>

                <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50/50 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500 font-bold">
                                    <th className="p-5">Nombre</th>
                                    <th className="p-5">Versión</th>
                                    <th className="p-5">Licencia</th>
                                    <th className="p-5 text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {isCreating && (
                                    <tr className="bg-blue-50/50 animate-fadeIn">
                                        <td className="p-5">
                                            <input
                                                type="text"
                                                placeholder="Nombre del software"
                                                value={newSoftware.name || ''}
                                                onChange={(e) => setNewSoftware({ ...newSoftware, name: e.target.value })}
                                                className="w-full border border-blue-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none shadow-sm bg-white"
                                                autoFocus
                                            />
                                        </td>
                                        <td className="p-5">
                                            <input
                                                type="text"
                                                placeholder="Versión (opcional)"
                                                value={newSoftware.version || ''}
                                                onChange={(e) => setNewSoftware({ ...newSoftware, version: e.target.value })}
                                                className="w-full border border-blue-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none shadow-sm bg-white"
                                            />
                                        </td>
                                        <td className="p-5">
                                            <input
                                                type="text"
                                                placeholder="Tipo de licencia"
                                                value={newSoftware.license || ''}
                                                onChange={(e) => setNewSoftware({ ...newSoftware, license: e.target.value })}
                                                className="w-full border border-blue-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none shadow-sm bg-white"
                                            />
                                        </td>
                                        <td className="p-5 text-right">
                                            <div className="flex justify-end space-x-2">
                                                <button onClick={handleCreate} className="p-2 text-white bg-emerald-500 hover:bg-emerald-600 rounded-lg shadow-md transition-all">
                                                    <Save className="h-4 w-4" />
                                                </button>
                                                <button onClick={handleCancel} className="p-2 text-white bg-rose-500 hover:bg-rose-600 rounded-lg shadow-md transition-all">
                                                    <X className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                )}

                                {softwareList.map((software) => (
                                    <tr key={software.id} className="hover:bg-blue-50/30 transition-colors duration-200">
                                        <td className="p-5 font-semibold text-slate-800">
                                            {editingSoftware?.id === software.id ? (
                                                <input
                                                    type="text"
                                                    value={editingSoftware.name}
                                                    onChange={(e) => setEditingSoftware({ ...editingSoftware, name: e.target.value })}
                                                    className="w-full border border-blue-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none shadow-sm bg-white"
                                                />
                                            ) : (
                                                software.name
                                            )}
                                        </td>
                                        <td className="p-5 text-slate-600">
                                            {editingSoftware?.id === software.id ? (
                                                <input
                                                    type="text"
                                                    value={editingSoftware.version || ''}
                                                    onChange={(e) => setEditingSoftware({ ...editingSoftware, version: e.target.value })}
                                                    className="w-full border border-blue-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none shadow-sm bg-white"
                                                />
                                            ) : (
                                                <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded text-xs font-medium">
                                                    {software.version || 'N/A'}
                                                </span>
                                            )}
                                        </td>
                                        <td className="p-5 text-slate-600">
                                            {editingSoftware?.id === software.id ? (
                                                <input
                                                    type="text"
                                                    value={editingSoftware.license || ''}
                                                    onChange={(e) => setEditingSoftware({ ...editingSoftware, license: e.target.value })}
                                                    className="w-full border border-blue-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none shadow-sm bg-white"
                                                />
                                            ) : (
                                                software.license || '-'
                                            )}
                                        </td>
                                        <td className="p-5 text-right">
                                            {editingSoftware?.id === software.id ? (
                                                <div className="flex justify-end space-x-2">
                                                    <button onClick={handleSave} className="p-2 text-white bg-emerald-500 hover:bg-emerald-600 rounded-lg shadow-md transition-all">
                                                        <Save className="h-4 w-4" />
                                                    </button>
                                                    <button onClick={handleCancel} className="p-2 text-white bg-rose-500 hover:bg-rose-600 rounded-lg shadow-md transition-all">
                                                        <X className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="flex justify-end space-x-2">
                                                    <button onClick={() => handleEdit(software)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all">
                                                        <Edit2 className="h-5 w-5" />
                                                    </button>
                                                    <button onClick={() => handleDelete(software.id)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all">
                                                        <Trash2 className="h-5 w-5" />
                                                    </button>
                                                </div>
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
