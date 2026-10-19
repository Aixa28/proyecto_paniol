import { useState, useEffect, useCallback } from "react";
import EditRequirementModal from "../components/modals/EditRequirementModal";
import { toast } from 'sonner';

export default function RequerimientosPage() {
    const [requirements, setRequirements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [q, setQ] = useState("");
    const [sortOrder, setSortOrder] = useState("ASC"); // "ASC" o "DESC"
    const [editItem, setEditItem] = useState(null);

    const fetchRequirements = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/requerimientos/detalle');
            if (!res.ok) throw new Error("Error al obtener requerimientos");
            const data = await res.json();
            
            // Formatear departamento y turno ("Año° - Taller (Turno)")
            const formatted = data.map(item => {
                const anioStr = item.tallerAnio ? `${item.tallerAnio}° - ` : "";
                let turnoRaw = item.tallerTurno || "";
                if (turnoRaw.toLowerCase() === 'maniana' || turnoRaw.toLowerCase() === 'manana') turnoRaw = 'Mañana';
                const turnoStr = turnoRaw ? ` (${turnoRaw})` : "";
                
                return {
                    ...item,
                    departamentoFormateado: `${anioStr}${item.tallerNombre}${turnoStr}`
                };
            });

            setRequirements(formatted);
        } catch (err) {
            toast.error(err.message || "Error al cargar datos");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchRequirements();
    }, [fetchRequirements]);

    // Modificar cantidad
    const handleSaveEdit = async (payload) => {
        const res = await fetch('/api/requerimientos/detalle', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        if (!res.ok) throw new Error("No se pudo actualizar");
        await fetchRequirements();
    };

    // Eliminar requerimiento
    const handleDelete = async (item) => {
        if (!window.confirm(`¿Estás seguro de eliminar el requerimiento de ${item.materialNombre} para ${item.departamentoFormateado}?`)) return;

        try {
            const res = await fetch(`/api/requerimientos/detalle/${item.Id_Taller}/${item.Id_Rotacion}/${item.Id_Material}`, {
                method: 'DELETE'
            });
            if (!res.ok) throw new Error("Error al eliminar");
            toast.success("Requerimiento eliminado");
            await fetchRequirements();
        } catch (err) {
            toast.error(err.message || "No se pudo eliminar");
        }
    };

    // Filtrar por nombre de material o profesor y ordenar
    const filteredRows = requirements
        .filter(r => 
            r.materialNombre.toLowerCase().includes(q.toLowerCase()) ||
            (r.profesorNombre && r.profesorNombre.toLowerCase().includes(q.toLowerCase())) ||
            r.departamentoFormateado.toLowerCase().includes(q.toLowerCase())
        )
        .sort((a, b) => {
            if (sortOrder === "ASC") {
                return a.materialNombre.localeCompare(b.materialNombre);
            } else {
                return b.materialNombre.localeCompare(a.materialNombre);
            }
        });

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-xl font-bold text-gray-800">Detalle de Requerimientos Especificos</h1>
                    <p className="text-sm text-gray-500">Listado especifico de materiales solicitados por cada taller y profesor</p>
                </div>

                {/* Filtros: Ordenar y Buscador */}
                <div className="flex flex-col sm:flex-row items-center gap-3">
                    <select
                        value={sortOrder}
                        onChange={(e) => setSortOrder(e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-md text-sm bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                        <option value="ASC">Orden Alfabético (A - Z)</option>
                        <option value="DESC">Orden Alfabético (Z - A)</option>
                    </select>

                    <div className="relative w-full sm:w-64">
                        <input
                            type="text"
                            value={q}
                            onChange={(e) => setQ(e.target.value)}
                            placeholder="Buscar material o profesor..."
                            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                        />
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabla */}
            <div className="bg-white shadow-sm rounded-lg border border-gray-100 overflow-hidden">
                {loading ? (
                    <div className="p-8 text-center text-gray-500 text-sm">Cargando requerimientos...</div>
                ) : filteredRows.length === 0 ? (
                    <div className="p-8 text-center text-gray-500 text-sm">No hay requerimientos específicos registrados o no coinciden con la búsqueda.</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <bg className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Material</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Departamento / Taller</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Profesor Solicitante</th>
                                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Cantidad Solicitada</th>
                                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                                </tr>
                            </bg>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {filteredRows.map((item, index) => (
                                    <tr key={`${item.Id_Taller}-${item.Id_Material}-${index}`} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                                            {item.materialNombre}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                            {item.departamentoFormateado}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                            {item.profesorNombre || <span className="text-gray-400 italic">Sin profesor asignado</span>}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                                                {item.cantidad} unidades
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                                            <button onClick={() => setEditItem(item)} className="text-blue-600 hover:text-blue-900 mr-4 font-medium">
                                                Editar
                                            </button>
                                            <button onClick={() => handleDelete(item)} className="text-red-600 hover:text-red-900 font-medium">
                                                Eliminar
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Modal de edición */}
            {editItem && (
                <EditRequirementModal
                    item={editItem}
                    onClose={() => setEditItem(null)}
                    onSave={handleSaveEdit}
                />
            )}
        </div>
    );
}