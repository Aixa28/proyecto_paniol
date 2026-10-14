import { useState } from "react";
import { useStore } from "../../context/StoreProvider";
import { toast } from 'sonner';

export default function EditTeacherModal({ teacher, onClose }) {
    const { updateTeacher, talleres } = useStore();
    const [name, setName] = useState(teacher.Nombre);
    const [lastName, setLastName] = useState(teacher.Apellido);
    const [email, setEmail] = useState(teacher.Email || "");
    const [idTaller, setIdTaller] = useState(teacher.Id_Taller || "");

    const onSubmit = async (e) => {
        e.preventDefault();
        try {
            await updateTeacher(teacher.Id_Docente, { 
                Nombre: name, 
                Apellido: lastName, 
                Email: email, 
                Id_Taller: idTaller !== "" ? Number(idTaller) : null 
            });
            toast.success("Profesor actualizado exitosamente");
            onClose();
        } catch (err) {
            toast.error(err.message || "Error al actualizar profesor");
        }
    };

    const displayTurno = (rawTurno) => {
        if (!rawTurno) return '';
        if (rawTurno.toLowerCase() === 'maniana' || rawTurno.toLowerCase() === 'manana') {
            return 'Mañana';
        }
        return rawTurno;
    };

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-gray-900">Editar Profesor</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>
                <form onSubmit={onSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
                        <input value={name} onChange={e => setName(e.target.value)} className="w-full px-3 py-2 border rounded-md text-sm" required />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Apellido *</label>
                        <input value={lastName} onChange={e => setLastName(e.target.value)} className="w-full px-3 py-2 border rounded-md text-sm" required />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                        <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full px-3 py-2 border rounded-md text-sm" required />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Taller</label>
                        <select value={idTaller} onChange={e => setIdTaller(e.target.value)} className="w-full px-3 py-2 border rounded-md text-sm bg-white">
                            <option value="">Sin Taller</option>
                            {talleres.map(t => {
                                const anioText = t.Anio || t.anio ? `${t.Anio || t.anio}° - ` : '';
                                const turnoText = t.Turno ? ` (${displayTurno(t.Turno)})` : '';
                                return (
                                    <option key={t.Id_Taller} value={t.Id_Taller}>
                                        {anioText}{t.Denominacion}{turnoText}
                                    </option>
                                );
                            })}
                        </select>
                    </div>
                    <div className="flex space-x-3 pt-2">
                        <button type="button" onClick={onClose} className="flex-1 border rounded-md py-2 bg-white hover:bg-gray-50 text-sm">Cancelar</button>
                        <button type="submit" className="flex-1 rounded-md py-2 text-white bg-blue-600 hover:bg-blue-700 text-sm">Actualizar</button>
                    </div>
                </form>
            </div>
        </div>
    );
}