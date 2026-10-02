import { useState } from "react";
import { useStore } from "../../context/StoreProvider";

export default function TallerForm() {
    const { addTaller } = useStore();

    const [denominacion, setDenominacion] = useState("");
    const [turno, setTurno] = useState("Mañana");
    const [anio, setAnio] = useState("");

    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState(null);

    const onSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);

        try {
            await addTaller({
                Denominacion: denominacion,
                Turno: turno,
                anio: anio
            });
            setMessage({ type: "success", text: "Taller registrado correctamente" });
            setDenominacion("");
            setAnio("");
            setTurno("Mañana");
        } catch (err) {
            setMessage({ type: "error", text: err.message || "Error al registrar el taller" });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 mb-6">
            <div className="mb-6">
                <h2 className="text-lg font-bold text-gray-800">Registro de Taller</h2>
                <p className="text-sm text-gray-500">Agregar un nuevo taller al sistema</p>
            </div>

            {message && (
                <div className={`p-3 mb-4 rounded text-sm ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {message.text}
                </div>
            )}

            <form onSubmit={onSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">
                            Nombre del Taller *
                        </label>
                        <input
                            type="text"
                            required
                            value={denominacion}
                            onChange={(e) => setDenominacion(e.target.value)}
                            placeholder="Ej: Carpintería"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">
                            Turno *
                        </label>
                        <select
                            value={turno}
                            onChange={(e) => setTurno(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                        >
                            <option value="Mañana">Mañana</option>
                            <option value="Tarde">Tarde</option>
                            <option value="Noche">Noche</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">
                            Año del Curso
                        </label>
                        <input
                            type="number"
                            value={anio}
                            onChange={(e) => setAnio(e.target.value)}
                            placeholder="Ej: 4"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-4 rounded-md text-sm transition-colors disabled:opacity-50 mt-4"
                >
                    {loading ? "Guardando..." : "Registrador Taller"}
                </button>
            </form>
        </div>
    );
}