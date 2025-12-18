import { useEffect, useState } from 'react';
import { adminService } from '../../services/admin.service';
import { Button } from '../../components/ui/Button';
import { Edit2, Save, X, Trash2, Plus, School as SchoolIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface School {
    id: string;
    name: string;
}

interface Teacher {
    id: number;
    name: string;
    schoolId: string;
    school?: School;
}

export const TeachersManagement = () => {
    const [teachersList, setTeachersList] = useState<Teacher[]>([]);
    const [schoolsList, setSchoolsList] = useState<School[]>([]);
    const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [newTeacher, setNewTeacher] = useState<Partial<Teacher>>({});
    const navigate = useNavigate();

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [teachers, schools] = await Promise.all([
                adminService.getTeachers(),
                adminService.getSchools()
            ]);
            setTeachersList(teachers);
            setSchoolsList(schools);
        } catch (error) {
            console.error('Error loading data:', error);
        }
    };

    const handleEdit = (teacher: Teacher) => {
        setEditingTeacher({ ...teacher });
    };

    const handleSave = async () => {
        if (!editingTeacher) return;
        try {
            await adminService.updateTeacher(editingTeacher.id, {
                name: editingTeacher.name,
                schoolId: editingTeacher.schoolId
            });
            setEditingTeacher(null);
            loadData(); // Reload to get updated school relation
        } catch (error) {
            console.error('Error updating teacher:', error);
            alert('Error al actualizar docente');
        }
    };

    const handleCreate = async () => {
        if (!newTeacher.name || !newTeacher.schoolId) {
            alert('Nombre y Escuela son obligatorios');
            return;
        }
        try {
            await adminService.createTeacher({
                name: newTeacher.name,
                schoolId: newTeacher.schoolId
            });
            setIsCreating(false);
            setNewTeacher({});
            loadData();
        } catch (error) {
            console.error('Error creating teacher:', error);
            alert('Error al crear docente');
        }
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm('¿Estás seguro de eliminar este docente?')) return;
        try {
            await adminService.deleteTeacher(id);
            loadData();
        } catch (error) {
            console.error('Error deleting teacher:', error);
            alert('Error al eliminar docente');
        }
    };

    const handleCancel = () => {
        setEditingTeacher(null);
        setIsCreating(false);
        setNewTeacher({});
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100 p-8">
            <div className="max-w-7xl mx-auto">
                <div className="flex flex-col md:flex-row justify-between items-center mb-10 gap-4">
                    <div>
                        <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-600 tracking-tight">
                            Gestión de Docentes
                        </h1>
                        <p className="text-slate-500 mt-2 text-lg font-light">
                            Administra el registro de docentes y su asignación a escuelas.
                        </p>
                    </div>
                    <div className="flex space-x-4">
                        <Button
                            onClick={() => navigate('/admin/schools')}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-md hover:shadow-lg transition-all duration-300 flex items-center px-6 py-2.5 rounded-xl font-medium"
                        >
                            <SchoolIcon className="h-5 w-5 mr-2.5" />
                            Gestionar Escuelas
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
                    <h2 className="text-xl font-semibold text-slate-800">Docentes Registrados</h2>
                    <Button
                        onClick={() => setIsCreating(true)}
                        className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 flex items-center px-6 py-2.5 rounded-xl font-medium transform hover:-translate-y-0.5"
                    >
                        <Plus className="h-5 w-5 mr-2" />
                        Agregar Docente
                    </Button>
                </div>

                <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50/50 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500 font-bold">
                                    <th className="p-5">Nombre</th>
                                    <th className="p-5">Escuela</th>
                                    <th className="p-5 text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {isCreating && (
                                    <tr className="bg-blue-50/50 animate-fadeIn">
                                        <td className="p-5">
                                            <input
                                                type="text"
                                                placeholder="Nombre del docente"
                                                value={newTeacher.name || ''}
                                                onChange={(e) => setNewTeacher({ ...newTeacher, name: e.target.value })}
                                                className="w-full border border-blue-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none shadow-sm bg-white"
                                                autoFocus
                                            />
                                        </td>
                                        <td className="p-5">
                                            <select
                                                value={newTeacher.schoolId || ''}
                                                onChange={(e) => setNewTeacher({ ...newTeacher, schoolId: e.target.value })}
                                                className="w-full border border-blue-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none shadow-sm bg-white"
                                            >
                                                <option value="">Seleccionar Escuela</option>
                                                {schoolsList.map(school => (
                                                    <option key={school.id} value={school.id}>{school.name}</option>
                                                ))}
                                            </select>
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

                                {teachersList.map((teacher) => (
                                    <tr key={teacher.id} className="hover:bg-blue-50/30 transition-colors duration-200">
                                        <td className="p-5 font-semibold text-slate-800">
                                            {editingTeacher?.id === teacher.id ? (
                                                <input
                                                    type="text"
                                                    value={editingTeacher.name}
                                                    onChange={(e) => setEditingTeacher({ ...editingTeacher, name: e.target.value })}
                                                    className="w-full border border-blue-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none shadow-sm bg-white"
                                                />
                                            ) : (
                                                teacher.name
                                            )}
                                        </td>
                                        <td className="p-5 text-slate-600">
                                            {editingTeacher?.id === teacher.id ? (
                                                <select
                                                    value={editingTeacher.schoolId}
                                                    onChange={(e) => setEditingTeacher({ ...editingTeacher, schoolId: e.target.value })}
                                                    className="w-full border border-blue-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none shadow-sm bg-white"
                                                >
                                                    {schoolsList.map(school => (
                                                        <option key={school.id} value={school.id}>{school.name}</option>
                                                    ))}
                                                </select>
                                            ) : (
                                                <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded text-xs font-medium">
                                                    {teacher.school?.name || teacher.schoolId}
                                                </span>
                                            )}
                                        </td>
                                        <td className="p-5 text-right">
                                            {editingTeacher?.id === teacher.id ? (
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
                                                    <button onClick={() => handleEdit(teacher)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all">
                                                        <Edit2 className="h-5 w-5" />
                                                    </button>
                                                    <button onClick={() => handleDelete(teacher.id)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all">
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
