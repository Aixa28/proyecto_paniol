// src/components/Reports/ReportsTable.jsx
export default function ReportsTable({ rows = [] }) {
if (!rows.length) {
    return (
    <div className="px-6 py-8 text-center text-gray-500 text-sm">
        No se encontraron movimientos con los filtros aplicados.
    </div>
    );
}


const getTypeStyle = (type) => {
    switch (type) {
        case "Ingreso":
            return "text-green-800 bg-green-100";
        case "Egreso":
            return "text-red-800 bg-red-100";
        case "Cambio de Requerimiento":
            return "text-blue-800 bg-blue-100";
        default:
            return "text-gray-800 bg-gray-100";
    }
}

return (
    <div className="overflow-hidden">
    <div className="overflow-x-auto">
        <table id="ReportsTable" className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
            <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Material
            </th>
            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Tipo
            </th>
            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Valor
            </th>
            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Departamento
            </th>
            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Responsable
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Observaciones
            </th>
            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Fecha
            </th>
            </tr>
        </thead>

        <tbody className="bg-white divide-y divide-gray-200">
            {rows.map((m) => {
                return (
            <tr key={m.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm font-medium text-gray-900">{m.materialName}</div>
                </td>

                <td className="px-6 py-4 whitespace-nowrap text-center">
                <span
                    className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTypeStyle(m.type)}`}
                >
                    {m.type}
                </span>
                </td>

                <td className="px-6 py-4 whitespace-nowrap text-center">
                <div className="text-sm text-gray-900">{m.quantity}</div>
                </td>

                <td className="px-6 py-4 whitespace-nowrap text-center">
                <div className="text-sm text-gray-900">{m.department || "-"}</div>
                </td>

                <td className="px-6 py-4 whitespace-nowrap text-center">
                    <div className="text-sm text-gray-900">{m.responsible || "-"}</div>
                </td>

                <td className="px-6 py-4 text-sm text-gray-700 break-words max-w-xs">
                {m.observations || "-"}
                </td>

                <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500">
                {new Date(m.date).toLocaleString("es-AR", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                })}
                </td>
            </tr>
            )})}
        </tbody>
        </table>
    </div>
    </div>
    );
}