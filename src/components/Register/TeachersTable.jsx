// src/components/Register/TeachersTable.jsx
import { useState } from "react";
import { useStore } from "../../context/StoreProvider";
import EditTeacherModal from "../Modals/EditTeacherModal";
import DeleteTeacherModal from "../Modals/DeleteTeacherModal";

export default function TeachersTable() {
const { teachers, talleres, removeTeacher } = useStore();
const [q, setQ] = useState("");
const [edit, setEdit] = useState(null);
const [del, setDel] = useState(null);

// Función para obtener el nombre del taller y el turno de un profesor
const getTeacherTallerName = (teacher) => {
    if (!teacher.Id_Taller) return 'Sin taller asignado';
    const associatedTaller = talleres.find(taller => Number(taller.Id_Taller) === Number(teacher.Id_Taller));
    if (!associatedTaller) return 'Sin taller asignado';
    
    const anioText = associatedTaller.anio ? `${associatedTaller.anio}° - ` : '';
    const turnoText = associatedTaller.Turno ? ` (${associatedTaller.Turno})` : '';
    
    return `${anioText}${associatedTaller.Denominacion}${turnoText}`;
};

const rows = teachers
    .filter(t =>
    `${t.Nombre} ${t.Apellido}`.toLowerCase().includes(q.toLowerCase()) ||
    t.Email.toLowerCase().includes(q.toLowerCase())
    )
    .sort((a,b)=> a.Nombre.localeCompare(b.Nombre));

return (
    <div className="bg-white shadow-custom rounded-lg">
    <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
        <div>
        <h3 className="text-lg font-medium text-gray-900">Profesores Registrados</h3>
        <p className="mt-1 text-sm text-gray-500">Listado y gestión de responsables</p>
        </div>
        <div className="relative">
        <input
            value={q}
            onChange={e=>setQ(e.target.value)}
            placeholder="Buscar por nombre, email o taller…"
            className="block w-72 pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
        />
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
            </svg>
        </div>
        </div>
    </div>

    {rows.length === 0 ? (
        <div className="px-6 py-8 text-center text-gray-500 text-sm">
        No hay profesores que coincidan con la búsqueda.
        </div>
    ) : (
        <div className="overflow-hidden">
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
                <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre completo</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Año - Taller</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
                {rows.map(t => (
                <tr key={t.Id_Docente} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{t.Nombre} {t.Apellido}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{getTeacherTallerName(t)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{t.Email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                    <button onClick={()=>setEdit(t)} className="text-blue-600 hover:text-blue-900 mr-3">Editar</button>
                    <button onClick={()=>setDel(t)} className="text-red-600 hover:text-red-900">Eliminar</button>
                    </td>
                </tr>
                ))}
            </tbody>
            </table>
        </div>
        </div>
    )}

    {edit && <EditTeacherModal teacher={edit} onClose={()=>setEdit(null)} />}
    {del && (
        <DeleteTeacherModal
        teacher={del}
        onCancel={()=>setDel(null)}
        onConfirm={() => { removeTeacher(del.Id_Docente); setDel(null); }}
        />
    )}
    </div>
);
}