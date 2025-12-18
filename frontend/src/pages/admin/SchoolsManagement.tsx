import { useEffect, useState } from 'react';
import { adminService } from '../../services/admin.service';
import { Button } from '../../components/ui/Button';
import { Edit2, Save, X, Trash2, Plus, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface School {
    id: string;
    name: string;
    color: string;
}

export const SchoolsManagement = () => {
    const [schoolsList, setSchoolsList] = useState<School[]>([]);
    const [editingSchool, setEditingSchool] = useState<School | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [newSchool, setNewSchool] = useState<Partial<School>>({});
    const navigate = useNavigate();

    useEffect(() => {
        loadSchools();
    }, []);

    const loadSchools = async () => {
        try {
            const data = await adminService.getSchools();
            // Map colorHex to color if needed, but backend returns what Prisma has.
            // Prisma has colorHex. AdminController returns it.
            // But my interface expects color.
            // I should check what the backend actually returns.
            // The controller returns `this.prisma.school.findMany()`.
            // So it returns objects with `colorHex`.
            // I should update interface to use `colorHex` or map it.
            // I'll use `colorHex` in interface to match backend.
            setSchoolsList(data);
        } catch (error) {
            console.error('Error loading schools:', error);
        }
    };

    const handleEdit = (school: School) => {
        setEditingSchool({ ...school });
    };

    const handleSave = async () => {
        if (!editingSchool) return;
        try {
            await adminService.updateSchool(editingSchool.id, {
                name: editingSchool.name,
                color: editingSchool.color // Service expects color, controller maps it to colorHex
            });
            setEditingSchool(null);
            loadSchools();
        } catch (error) {
            console.error('Error updating school:', error);
            alert('Error al actualizar escuela');
        }
    };

    const handleCreate = async () => {
        if (!newSchool.id || !newSchool.name || !newSchool.color) {
            alert('Todos los campos son obligatorios');
            return;
        }
        try {
            await adminService.createSchool({
                id: newSchool.id,
                name: newSchool.name,
                color: newSchool.color
            });
            setIsCreating(false);
            setNewSchool({});
            loadSchools();
        } catch (error) {
            console.error('Error creating school:', error);
            alert('Error al crear escuela');
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('¿Estás seguro de eliminar esta escuela? Esto podría afectar a los docentes asociados.')) return;
        try {
            await adminService.deleteSchool(id);
            loadSchools();
        } catch (error) {
            console.error('Error deleting school:', error);
            alert('Error al eliminar escuela');
        }
    };

    const handleCancel = () => {
        setEditingSchool(null);
        setIsCreating(false);
        setNewSchool({});
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100 p-8">
            <div className="max-w-7xl mx-auto">
                <div className="flex flex-col md:flex-row justify-between items-center mb-10 gap-4">
                    <div>
                        <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-600 tracking-tight">
                            Gestión de Escuelas
                        </h1>
                        <p className="text-slate-500 mt-2 text-lg font-light">
                            Administra las escuelas y sus colores identificativos.
                        </p>
                    </div>
                    <div className="flex space-x-4">
                        <Button
                            onClick={() => navigate('/admin/teachers')}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-md hover:shadow-lg transition-all duration-300 flex items-center px-6 py-2.5 rounded-xl font-medium"
                        >
                            <Users className="h-5 w-5 mr-2.5" />
                            Gestionar Docentes
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
                    <h2 className="text-xl font-semibold text-slate-800">Escuelas Registradas</h2>
                    <Button
                        onClick={() => setIsCreating(true)}
                        className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 flex items-center px-6 py-2.5 rounded-xl font-medium transform hover:-translate-y-0.5"
                    >
                        <Plus className="h-5 w-5 mr-2" />
                        Agregar Escuela
                    </Button>
                </div>

                <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50/50 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500 font-bold">
                                    <th className="p-5">ID</th>
                                    <th className="p-5">Nombre</th>
                                    <th className="p-5">Color</th>
                                    <th className="p-5 text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {isCreating && (
                                    <tr className="bg-blue-50/50 animate-fadeIn">
                                        <td className="p-5">
                                            <input
                                                type="text"
                                                placeholder="ID (ej. ING)"
                                                value={newSchool.id || ''}
                                                onChange={(e) => setNewSchool({ ...newSchool, id: e.target.value.toUpperCase() })}
                                                className="w-full border border-blue-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none shadow-sm bg-white"
                                                autoFocus
                                            />
                                        </td>
                                        <td className="p-5">
                                            <input
                                                type="text"
                                                placeholder="Nombre de la escuela"
                                                value={newSchool.name || ''}
                                                onChange={(e) => setNewSchool({ ...newSchool, name: e.target.value })}
                                                className="w-full border border-blue-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none shadow-sm bg-white"
                                            />
                                        </td>
                                        <td className="p-5">
                                            <div className="flex items-center space-x-2">
                                                <input
                                                    type="color"
                                                    value={newSchool.color || '#000000'}
                                                    onChange={(e) => setNewSchool({ ...newSchool, color: e.target.value })}
                                                    className="h-8 w-8 rounded cursor-pointer border-none"
                                                />
                                                <input
                                                    type="text"
                                                    placeholder="#000000"
                                                    value={newSchool.color || ''}
                                                    onChange={(e) => setNewSchool({ ...newSchool, color: e.target.value })}
                                                    className="w-24 border border-blue-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none shadow-sm bg-white"
                                                />
                                            </div>
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

                                {schoolsList.map((school) => (
                                    <tr key={school.id} className="hover:bg-blue-50/30 transition-colors duration-200">
                                        <td className="p-5 font-semibold text-slate-800">
                                            {school.id}
                                        </td>
                                        <td className="p-5 text-slate-600">
                                            {editingSchool?.id === school.id ? (
                                                <input
                                                    type="text"
                                                    value={editingSchool.name}
                                                    onChange={(e) => setEditingSchool({ ...editingSchool, name: e.target.value })}
                                                    className="w-full border border-blue-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none shadow-sm bg-white"
                                                />
                                            ) : (
                                                school.name
                                            )}
                                        </td>
                                        <td className="p-5">
                                            {editingSchool?.id === school.id ? (
                                                <div className="flex items-center space-x-2">
                                                    <input
                                                        type="color"
                                                        value={editingSchool.color || '#000000'} // Assuming backend returns colorHex mapped to color or I handle it
                                                        onChange={(e) => setEditingSchool({ ...editingSchool, color: e.target.value })}
                                                        className="h-8 w-8 rounded cursor-pointer border-none"
                                                    />
                                                    <input
                                                        type="text"
                                                        value={editingSchool.color || ''}
                                                        onChange={(e) => setEditingSchool({ ...editingSchool, color: e.target.value })}
                                                        className="w-24 border border-blue-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none shadow-sm bg-white"
                                                    />
                                                </div>
                                            ) : (
                                                <div className="flex items-center space-x-2">
                                                    <div
                                                        className="h-6 w-6 rounded-full shadow-sm border border-slate-200"
                                                        style={{ backgroundColor: (school as any).colorHex || school.color }}
                                                    />
                                                    <span className="text-slate-600 text-sm">{(school as any).colorHex || school.color}</span>
                                                </div>
                                            )}
                                        </td>
                                        <td className="p-5 text-right">
                                            {editingSchool?.id === school.id ? (
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
                                                    <button onClick={() => handleEdit({ ...school, color: (school as any).colorHex || school.color })} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all">
                                                        <Edit2 className="h-5 w-5" />
                                                    </button>
                                                    <button onClick={() => handleDelete(school.id)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all">
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
