import { useState } from "react";
import { toast } from 'sonner';

export default function EditRequirementModal({ item, onClose, onSave }) {
    const [cantidad, setCantidad] = useState(item.cantidad);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await onSave({
                idTaller: item.Id_Taller,
                idRotacion: item.Id_Rotacion,
                idMaterial: item.Id_Material,
                nuevaCantidad: Number(cantidad)
            });
            toast.success("Requerimiento actualizado correctamente");
            onClose();
        } catch (error) {
            toast.error(error.message || "Error al actualizar requerimiento");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-gray-900">Editar Requerimiento</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Material</label>
                        <p className="text-sm font-bold text-gray-800">{item.materialNombre}</p>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Solicitante</label>
                        <p className="text-sm text-gray-700">{item.departamentoFormateado} - <span className="font-medium">{item.profesorNombre || 'Sin profesor'}</span></p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Cantidad Requerida *</label>
                        <input
                            type="number"
                            min="0"
                            required
                            value={cantidad}
                            onChange={(e) => setCantidad(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <div className="flex space-x-3 pt-2">
                        <button type="button" onClick={onClose} className="flex-1 border rounded-md py-2 bg-white hover:bg-gray-50 text-sm">Cancelar</button>
                        <button type="submit" disabled={loading} className="flex-1 rounded-md py-2 text-white bg-blue-600 hover:bg-blue-700 text-sm font-medium disabled:opacity-50">
                            {loading ? "Guardando..." : "Guardar Cambios"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}