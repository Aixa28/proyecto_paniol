// src/components/Register/TalleresTable.jsx
import { useState } from "react";
import { useStore } from "../../context/StoreProvider";
import EditTallerModal from "../modals/EditTallerModal";
import DeleteTallerModal from "../modals/DeleteTallerModal";
import { toast } from 'sonner';

export default function TalleresTable() {
    const { talleres, teachers, removeTaller } = useStore();
    const [q, setQ] = useState("");
    const [edit, setEdit] = useState(null); // Guarda el taller a editar
    const [del, setDel] = useState(null);   // Guarda el taller a eliminar

    const getTeacherName = (idTaller) => {
        const teacher = teachers.find(t => t.Id_Taller === idTaller);
        return teacher ? `${teacher.Nombre} ${teacher.Apellido}` : 'Sin asignar';
    };
    //Cambiando para que me devuelva mañana en vez de maniana
    const displayTurno = (rawTurno) => {
    if (!rawTurno) return '';
    if (rawTurno.toLowerCase() === 'maniana' || rawTurno.toLowerCase() === 'manana') {
        return 'Mañana';
    }
    return rawTurno;
};

    const rows = talleres
        .filter(t =>
            t.Denominacion.toLowerCase().includes(q.toLowerCase()) ||
            getTeacherName(t.Id_Taller).toLowerCase().includes(q.toLowerCase())
        )
        .sort((a, b) => a.Denominacion.localeCompare(b.Denominacion));

    const handleConfirmDelete = async () => {
        if (!del) return;
        try {
            await removeTaller(del.Id_Taller);
            setDel(null);
            toast.success("Taller eliminado exitosamente");
        } catch (error) {
            toast.error(error.message || "Ocurrió un error inesperado.");
        }
    };

    return (
        <div className="bg-white shadow-custom rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-medium text-gray-900">Talleres Registrados</h3>
                    <p className="mt-1 text-sm text-gray-500">Listado y gestión de talleres</p>
                </div>
                <div className="relative">
                    <input
                        value={q}
                        onChange={e => setQ(e.target.value)}
                        placeholder="Buscar por nombre, turno o profesor…"
                        className="block w-72 pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>
                </div>
            </div>

            {rows.length === 0 ? (
                <div className="px-6 py-8 text-center text-gray-500 text-sm">
                    No hay talleres que coincidan con la búsqueda o no hay talleres registrados.
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre del Taller</th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Año</th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Turno</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Profesor a Cargo</th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {rows.map(t => {
                                const teacherName = getTeacherName(t.Id_Taller);
                                return (
                                <tr key={t.Id_Taller} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{t.Denominacion}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900">{displayTurno(t.anio)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900">{displayTurno(t.Turno)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{teacherName}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                                        <button onClick={() => setEdit(t)} className="text-blue-600 hover:text-blue-900 mr-3">Editar</button>
                                        <button onClick={() => setDel(t)} className="text-red-600 hover:text-red-900">Eliminar</button>
                                    </td>
                                </tr>
                            )})}
                        </tbody>
                    </table>
                </div>
            )}

            {edit && <EditTallerModal taller={edit} onClose={()=>setEdit(null)} />}
            {del && <DeleteTallerModal taller={del} onCancel={()=>setDel(null)} onConfirm={handleConfirmDelete} />}
        </div>
    );
}