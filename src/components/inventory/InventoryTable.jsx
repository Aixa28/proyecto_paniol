import { useState } from "react";
import { useStore } from "../../context/StoreProvider";
import EditMaterialModal from "../Modals/EditMaterialModal";
import DeleteMaterialModal from "../modals/DeleteMaterialModal";

function badge(material) {
    switch (material.Estado) {
        case 'DISPONIBLE':
            return { text: "Disponible", cls: "text-green-800 bg-green-100" };
        case 'LIMITADO':
            return { text: "Limitado", cls: "text-yellow-800 bg-yellow-100" };
        case 'FALTANTE':
            return { text: "Faltante", cls: "text-red-800 bg-red-100" };
        default:
            return { text: "Indefinido", cls: "text-gray-800 bg-gray-100" };
    }
}

export default function InventoryTable({ rows }) {
    const { removeMaterial } = useStore();
    const [edit, setEdit] = useState(null);    // material or null
    const [del, setDel]   = useState(null);    // material or null

    return (
        <>
        <div className="overflow-hidden">
            <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Material</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Stock Actual</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Requerimiento</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                    {/* NUEVA COLUMNA UBICADA ENTRE ESTADO Y ACCIONES */}
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Próxima Rotación</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                {rows.map(m => {
                    const b = badge(m);
                    const faltante = m.Requerimiento - m.StockActual;
                    const title = faltante > 0 ? `Faltan ${faltante} unidades` : '';
                    return (
                    <tr key={m.Id_Material} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{m.Nombre_Descripcion}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="text-sm font-medium text-gray-900">{m.StockActual}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="text-sm font-medium text-gray-900">{m.Requerimiento}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span title={title} className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${b.cls}`}>{b.text}</span>
                        </td>
                        
                        {/* NUEVA CELDA: Solo muestra la fecha si el estado es FALTANTE, de lo contrario muestra un guión */}
                        <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500">
                            {m.Estado === 'FALTANTE' ? (m.Proxima_Rotacion || '-') : '-'}
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                        <button onClick={()=>setEdit(m)} className="text-blue-600 hover:text-blue-900 mr-3">Editar</button>
                        <button onClick={()=>setDel(m)}  className="text-red-600 hover:text-red-900">Eliminar</button>
                        </td>
                    </tr>
                    )
                })}
                </tbody>
            </table>
            </div>
        </div>

        {edit && <EditMaterialModal material={edit} onClose={()=>setEdit(null)} />}
        {del  && <DeleteMaterialModal material={del} onCancel={()=>setDel(null)} onConfirm={async () => { await removeMaterial(del.Id_Material); setDel(null); }} />}
        </>
    );
}