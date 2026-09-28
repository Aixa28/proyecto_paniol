import { useState, useMemo } from "react";
import { useStore } from "../../context/StoreProvider";
import { toast } from 'sonner';

export default function StockMovementModal({ material, onClose }) {
  const { materials, teachers, registerMovement, talleres, updateMaterialRequirement } = useStore();
  const [materialId, setMaterialId] = useState(material?.Id_Material ?? "");
  const [movementType, setMovementType] = useState("Ingreso");
  const [quantity, setQuantity] = useState(1);
  const [newRequirement, setNewRequirement] = useState(1);
  const [department, setDepartment] = useState("");
  const [responsible, setResponsible] = useState("");
  const [observations, setObservations] = useState("");
  
  // Manejador para actualizar Taller y Docente en simultáneo
  const handleTallerChange = (e) => {
    const selectedDenominacion = e.target.value;
    setDepartment(selectedDenominacion);

    // Buscar el taller en la lista
    const selectedTaller = talleres.find(t => t.Denominacion === selectedDenominacion);
    if (selectedTaller) {
      // Buscar el docente vinculado al taller
      const docente = teachers.find(d => d.Id_Taller === selectedTaller.Id_Taller);
      if (docente) {
        setResponsible(`${docente.Nombre} ${docente.Apellido}`);
      } else {
        setResponsible("");
      }
    } else {
      setResponsible("");
    }
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    try {
      if (movementType === 'Cambio de Requerimiento') {
          const selectedTaller = talleres.find(t => t.Denominacion === department);
          if (!selectedTaller) {
              toast.error("Por favor, selecciona un departamento.");
              return;
          }
        
          await updateMaterialRequirement({
            materialId: Number(materialId),
            idTaller: selectedTaller.Id_Taller,
            department: selectedTaller.Denominacion,
            newRequirement: Number(newRequirement),
            observations,
            responsible, // <-- Envía el nombre del responsable
        });
          toast.success("Requerimiento actualizado correctamente");
      } else {
          const movementData = {
            materialId: Number(materialId),
            movementType,
            quantity: Number(newRequirement || quantity),
            observations,
          };

          if (movementType === "Egreso") {
            movementData.department = department;
            movementData.responsible = responsible; // <-- Envía el nombre del responsable
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
          <h3 className="text-lg font-medium text-gray-900">Registrar Movimiento</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Material *</label>
            <select
              value={materialId}
              onChange={(e) => setMaterialId(e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Tipo *</label>
            <div className="flex items-center space-x-4">
              <label className="flex items-center">
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
              <label className="flex items-center">
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
              <label className="flex items-center">
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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Cantidad / Ajuste *</label>
            <input
              type="number"
              value={newRequirement}
              onChange={(e) => setNewRequirement(e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
              required
            />
          </div>

          {(movementType === "Egreso" || movementType === "Cambio de Requerimiento") && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Taller *</label>
              <select
                value={department}
                onChange={handleTallerChange}
                className="w-full px-3 py-2 border rounded-md"
                required
              >
                <option value="">Seleccionar…</option>
                {talleres.map((t) => {
                  const docente = teachers.find(d => d.Id_Taller === t.Id_Taller);
                  const docenteNombre = docente ? ` - ${docente.Nombre} ${docente.Apellido}` : '';
                  const anio = t.anio ? `${t.anio}° ` : '';
                  return (
                    <option key={t.Id_Taller} value={t.Denominacion}>
                      {anio}{t.Denominacion}{docenteNombre}
                    </option>
                  );
                })}
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Observaciones</label>
            <textarea
              rows={3}
              value={observations}
              onChange={(e) => setObservations(e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>

          <div className="flex space-x-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border rounded-md py-2 bg-white hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 rounded-md py-2 text-white bg-blue-600 hover:bg-blue-700"
            >
              Registrar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}