import { useState, useMemo } from "react";
import { useStore } from "../../context/StoreProvider";
import { toast } from 'sonner';

export default function StockMovementModal({ material, onClose }) {
  const { materials, teachers, registerMovement, talleres, updateMaterialRequirement } = useStore();
  const [materialId, setMaterialId] = useState(material?.Id_Material ?? "");
  const [movementType, setMovementType] = useState("Ingreso");
  const [quantity, setQuantity] = useState(1);
  const [newRequirement, setNewRequirement] = useState(1);
  const [selectedTallerId, setSelectedTallerId] = useState("");
  const [observations, setObservations] = useState("");

  const onSubmit = async (e) => {
    e.preventDefault();

    try {
      if (movementType === 'Cambio de Requerimiento') {
            if (!selectedTallerId) {
                toast.error("Por favor, selecciona un taller.");
                return;
            }

            await registerMovement({
                materialId: Number(materialId),
                movementType: 'Cambio de Requerimiento',
                quantity: Number(newRequirement || quantity),
                department: Number(selectedTallerId),
                observations
            });
            toast.success("Requerimiento registrado correctamente");
        } else {
        if ((movementType === "Egreso") && !selectedTallerId) {
          toast.error("Por favor, selecciona un taller.");
          return;
        }

        const selectedTaller = talleres.find(t => Number(t.Id_Taller) === Number(selectedTallerId));
        const assignedTeacher = teachers.find(t => Number(t.Id_Taller) === Number(selectedTallerId));

        const movementData = {
          materialId: Number(materialId),
          movementType,
          quantity: Number(quantity),
          observations,
        };

        if (movementType === "Egreso") {
          movementData.department = selectedTaller ? selectedTaller.Id_Taller : selectedTallerId;
          movementData.responsible = assignedTeacher ? `${assignedTeacher.Nombre} ${assignedTeacher.Apellido}` : "";
        }

        await registerMovement(movementData);
        toast.success("Movimiento registrado correctamente");
      }
      onClose();
    } catch (error) {
      toast.error(error.message || "Error al registrar el movimiento.");
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">
            Registrar Movimiento
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Material *
            </label>
            <select
              value={materialId}
              onChange={(e) => setMaterialId(e.target.value)}
              className="w-full px-3 py-2 border rounded-md text-sm bg-white"
              required
            >
              <option value="">Seleccionar…</option>
              {materials.map((m) => (
                <option key={m.Id_Material} value={m.Id_Material}>
                  {m.Nombre_Descripcion}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tipo *
            </label>
            <div className="flex items-center space-x-4">
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="movementType"
                  value="Ingreso"
                  checked={movementType === "Ingreso"}
                  onChange={() => setMovementType("Ingreso")}
                  className="form-radio h-4 w-4 text-blue-600"
                />
                <span className="ml-2 text-sm text-gray-700">Ingreso</span>
              </label>
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="movementType"
                  value="Egreso"
                  checked={movementType === "Egreso"}
                  onChange={() => setMovementType("Egreso")}
                  className="form-radio h-4 w-4 text-blue-600"
                />
                <span className="ml-2 text-sm text-gray-700">Egreso</span>
              </label>
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="movementType"
                  value="Cambio de Requerimiento"
                  checked={movementType === "Cambio de Requerimiento"}
                  onChange={() => setMovementType("Cambio de Requerimiento")}
                  className="form-radio h-4 w-4 text-blue-600"
                />
                <span className="ml-2 text-sm text-gray-700">Requerimiento</span>
              </label>
            </div>
          </div>
          
          {(movementType === "Ingreso" || movementType === "Egreso") && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cantidad *
              </label>
              <input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="w-full px-3 py-2 border rounded-md text-sm"
                required
              />
            </div>
          )}

          {movementType === "Cambio de Requerimiento" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cantidad *
              </label>
              <input
                type="number"
                min="0"
                value={newRequirement}
                onChange={(e) => setNewRequirement(e.target.value)}
                className="w-full px-3 py-2 border rounded-md text-sm"
                required
              />
            </div>
          )}

          {(movementType === "Egreso" || movementType === "Cambio de Requerimiento") && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Taller *
              </label>
              <select
                value={selectedTallerId}
                onChange={(e) => setSelectedTallerId(e.target.value)}
                className="w-full px-3 py-2 border rounded-md text-sm bg-white"
                required
              >
                <option value="">Seleccionar...</option>
                {talleres.map(t => {
                  const anioVal = t.Anio || t.anio || "";
                  const anioText = anioVal ? `${anioVal}° - ` : "";
                  const denominacion = t.Denominacion || "";
                  
                  let turnoRaw = t.Turno || "";
                  if (turnoRaw.toLowerCase() === 'maniana' || turnoRaw.toLowerCase() === 'manana') {
                    turnoRaw = 'Mañana';
                  }
                  const turnoText = turnoRaw ? ` (${turnoRaw})` : "";

                  const teacher = teachers.find(teacherItem => Number(teacherItem.Id_Taller) === Number(t.Id_Taller));
                  const teacherText = teacher ? ` - ${teacher.Nombre} ${teacher.Apellido}` : " - Sin asignar";

                  const optionLabel = `${anioText}${denominacion}${turnoText}${teacherText}`;

                  return (
                    <option key={t.Id_Taller} value={t.Id_Taller}>
                      {optionLabel}
                    </option>
                  );
                })}
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Observaciones
            </label>
            <textarea
              rows={3}
              value={observations}
              onChange={(e) => setObservations(e.target.value)}
              className="w-full px-3 py-2 border rounded-md text-sm"
            />
          </div>
          <div className="flex space-x-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border rounded-md py-2 bg-white hover:bg-gray-50 text-sm"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 rounded-md py-2 text-white bg-blue-600 hover:bg-blue-700 text-sm font-medium"
            >
              Registrar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}