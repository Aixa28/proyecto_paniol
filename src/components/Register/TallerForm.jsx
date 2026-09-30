import { useState } from "react";
import { useStore } from "../../context/StoreProvider";
import { toast } from 'sonner';

export default function TallerForm() {
    const { addTaller } = useStore();
    const [denominacion, setDenominacion] = useState("");
    const [turno, setTurno] = useState("Maniana");
    const [anio, setAnio] = useState("");

    const onSubmit = async (e) => {
        e.preventDefault();
        try {
            await addTaller({
                Denominacion: denominacion,
                Turno: turno,
                anio: anio || null
            });
            setDenominacion("");
            setTurno("Maniana");
            setAnio("");
            toast.success("Taller registrado exitosamente");
        } catch (err) {
            toast.error(err.message || "Error al registrar el taller");
        }
    };

    return (
        <div className="bg-white shadow-custom rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Registro de Taller</h3>
                <p className="mt-1 text-sm text-gray-500">Agregar un nuevo taller al sistema</p>
            </div>
            <div className="px-6 py-4">
                <form onSubmit={onSubmit} className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Nombre del Taller *</label>
                        <input value={denominacion} onChange={e => setDenominacion(e.target.value)} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm px-3 py-2 border" required />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Turno *</label>
                        <select
                            name="turno"
                            value={formData.turno}
                            onChange={handleChange}
                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm px-3 py-2 border"
                            required
                        >
                            <option value="">Seleccionar turno...</option>
                            {/* 'value' envía la clave aceptada por la BD, el texto entre las etiquetas muestra 'Mañana' al usuario */}
                            <option value="Maniana">Mañana</option>
                            <option value="Tarde">Tarde</option>
                            <option value="Noche">Noche</option>
                        </select>
                        <select value={turno} onChange={e => setTurno(e.target.value)} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm px-3 py-2 border">
                            <option value="Maniana">Mañana</option>
                            <option value="Tarde">Tarde</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Año del Curso</label>
                        <input
                            type="number"
                            min="1"
                            max="6"
                            value={anio}
                            onChange={e => setAnio(e.target.value)}
                            placeholder="Ej: 4"
                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm px-3 py-2 border"
                        />
                    </div>
                    
                    <div className="sm:col-span-3 flex items-end">
                        <button type="submit" className="w-full inline-flex justify-center py-2 px-4 rounded-md text-white bg-blue-600 hover:bg-blue-700">
                            Registrar Taller
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}