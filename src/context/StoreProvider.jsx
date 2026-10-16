import { createContext, useContext, useMemo, useState, useEffect, useCallback } from "react";

const StoreCtx = createContext();

export function StoreProvider({ children }) {
    const [materials, setMaterials]   = useState([]);
    const [teachers, setTeachers]    = useState([]);
    const [movements, setMovements]  = useState([]);
    const [talleres, setTalleres]    = useState([]);
    const [rotations, setRotations]  = useState([]);
    const [loading, setLoading]      = useState(true);
    const [error, setError]          = useState(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
           const fetchMaterials = async () => {
                const response = await fetch('/api/inventario/resumen');
                if (!response.ok) throw new Error('Network response was not ok for materials');
                const data = await response.json();

                const map = new Map();
                data.forEach(item => {
                    const nombreLimpio = item.Nombre_Descripcion ? item.Nombre_Descripcion.trim().toLowerCase() : '';
                    const key = nombreLimpio || item.Id_Material;

                    if (map.has(key)) {
                        const existing = map.get(key);
                        existing.StockActual = Number(existing.StockActual || 0) + Number(item.StockActual || 0);
                        if (item.Requerimiento !== undefined) {
                            existing.Requerimiento = Number(existing.Requerimiento || 0) + Number(item.Requerimiento || 0);
                        }
                        existing.Balance_Numerico = Number(existing.StockActual || 0) - Number(existing.Requerimiento || 0);
                    } else {
                        map.set(key, { ...item });
                    }
                });
                return Array.from(map.values());
            };

            const [materialsData, teachersData, talleresData, reportesData, rotationsData] = await Promise.all([
                fetchMaterials(),
                fetch('/api/docentes').then(res => {
                    if (!res.ok) throw new Error('Network response was not ok for teachers');
                    return res.json();
                }),
                fetch('/api/talleres').then(res => {
                    if (!res.ok) throw new Error('Network response was not ok for talleres');
                    return res.json();
                }),
                fetch('/api/reportes').then(res => {
                    if (!res.ok) throw new Error('Network response was not ok for reportes');
                    return res.json();
                }),
                fetch('/api/rotaciones').then(res => {
                    if (!res.ok) throw new Error('Network response was not ok for rotaciones');
                    return res.json();
                })
            ]);
            
            setMaterials(materialsData);
            setTeachers(teachersData);
            setTalleres(talleresData);
            setRotations(rotationsData);

            const formattedMovements = reportesData.map(r => {
                // 1. Resolver el texto del Taller/Departamento
                let depLabel = "-";
                let tallerObj = null;

                if (r.Id_Taller) {
                    tallerObj = talleresData.find(t => Number(t.Id_Taller) === Number(r.Id_Taller));
                }
                if (!tallerObj && r.taller_nombre) {
                    tallerObj = talleresData.find(t => t.Denominacion.toLowerCase() === r.taller_nombre.toLowerCase());
                }

                if (tallerObj) {
                    const anioVal = tallerObj.Anio || tallerObj.anio;
                    const anioStr = anioVal ? `${anioVal}° - ` : "";
                    const turnoStr = tallerObj.Turno ? ` (${tallerObj.Turno})` : "";
                    depLabel = `${anioStr}${tallerObj.Denominacion}${turnoStr}`;
                } else if (r.taller_nombre) {
                    const anioStr = r.taller_anio ? `${r.taller_anio}° - ` : "";
                    const turnoStr = r.taller_turno ? ` (${r.taller_turno})` : "";
                    depLabel = `${anioStr}${r.taller_nombre}${turnoStr}`;
                }

                // 2. Resolver el nombre del Responsable (Docente)
                let teacherName = "-";
                const docId = r.Id_Docente || r.id_docente || r.idDocente;
                
                if (docId) {
                    const teacher = teachersData.find(t => Number(t.Id_Docente) === Number(docId));
                    if (teacher) {
                        teacherName = `${teacher.Nombre} ${teacher.Apellido}`.trim();
                    }
                }
                
                if (teacherName === "-" && r.responsable && r.responsable.trim() !== "") {
                    teacherName = r.responsable.trim();
                }

                // Fallback: Si el movimiento no tiene docente directo pero el taller tiene un profesor asignado
                if (teacherName === "-" && tallerObj) {
                    const teacherByTaller = teachersData.find(t => Number(t.Id_Taller) === Number(tallerObj.Id_Taller));
                    if (teacherByTaller) {
                        teacherName = `${teacherByTaller.Nombre} ${teacherByTaller.Apellido}`.trim();
                    }
                }

                return {
                    id: r.id,
                    materialId: r.materialId,
                    materialName: r.material,
                    type: r.tipo,
                    quantity: r.cantidad,
                    department: depLabel.replace(/maniana|manana/gi, 'Mañana'),
                    responsible: teacherName, 
                    observations: r.observacion,
                    date: new Date(r.fecha)
                };
            });

            setMovements(formattedMovements);
        } catch (error) {
            setError(error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const stats = useMemo(() => {
        const total = materials.length;
        const adequate = materials.filter(m => m.Estado === 'DISPONIBLE').length;
        const low = materials.filter(m => m.Estado === 'LIMITADO').length;
        const critical = materials.filter(m => m.Estado === 'FALTANTE').length;
        return { total, adequate, low, critical };
    }, [materials]);

    const addMaterial = async (name, quantity) => {
        const newMaterial = { Nombre_Descripcion: name, StockActual: Number(quantity) };
        const response = await fetch('/api/materiales', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newMaterial),
        });
        if (!response.ok) throw new Error('Failed to add material');
        await fetchData();
    };

    const updateMaterial = async (id, patch) => {
        const response = await fetch(`/api/materiales/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                Nombre_Descripcion: patch.name,
                StockActual: patch.quantity
            }),
        });

        if (!response.ok) throw new Error('Failed to update material');
        await fetchData();
    };

    const removeMaterial = async (id) => {
        const response = await fetch(`/api/materiales/${id}`, { method: 'DELETE' });
        if (!response.ok) throw new Error('Failed to delete material');
        await fetchData();
    };

    const addTeacher = async (teacher) => {
        const response = await fetch('/api/docentes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(teacher),
        });
        if (!response.ok) throw new Error('Failed to add teacher');

        const createdTeacher = await response.json();
        setTeachers(prev => [...prev, createdTeacher].sort((a, b) => a.Nombre.localeCompare(b.Nombre)));
    };

    const addTaller = async (taller) => {
        try {
            const response = await fetch('/api/talleres', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(taller)
            });
            if (!response.ok) throw new Error('Error al registrar el taller');
            const nuevoTaller = await response.json();
            setTalleres(prev => [...prev, nuevoTaller].sort((a, b) => a.Denominacion.localeCompare(b.Denominacion)));
        } catch (err) {
            console.error("Error al agregar taller:", err);
            throw err;
        }
        await fetchData();
    };

    const updateTeacher = async (id, patch) => {
        const cleanId = String(id).includes(':') ? String(id).split(':')[0] : id;

        const response = await fetch(`/api/docentes/${cleanId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(patch),
        });
        if (!response.ok) throw new Error('Failed to update teacher');
        await fetchData();
    };

    const removeTeacher = async (id) => {
        const response = await fetch(`/api/docentes/${id}`, { method: 'DELETE' });
        if (!response.ok) throw new Error('Failed to delete teacher');
        await fetchData();
    };

    const updateTaller = async (id, patch) => {
        const response = await fetch(`/api/talleres/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(patch),
        });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: 'No se pudo actualizar el taller' }));
            throw new Error(errorData.message);
        }
        const updatedTaller = { Id_Taller: id, ...patch };
        setTalleres(prev => prev.map(t => t.Id_Taller === id ? updatedTaller : t));
    };
    
    const removeTaller = async (id) => {
        try {
            const response = await fetch(`/api/talleres/${id}`, { method: 'DELETE' });
            if (!response.ok) {
                let errorMessage = 'No se pudo eliminar el taller.';
                try {
                    const errorData = await response.json();
                    errorMessage = errorData.message || errorMessage;
                } catch (e) {}
                throw new Error(errorMessage);
            }
            setTalleres(prev => prev.filter(t => t.Id_Taller !== id));
        } catch (err) {
            console.error("Error al eliminar taller:", err);
            throw err;
        }
    };

    const addRotation = async (rotation) => {
        try {
            const response = await fetch('/api/rotaciones', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(rotation)
            });
            if (!response.ok) throw new Error('Error al registrar la rotación');
            await fetchData();
        } catch (err) {
            console.error("Error al agregar rotación:", err);
            throw err;
        }
    };

    const updateRotation = async (id, patch) => {
        const response = await fetch(`/api/rotaciones/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(patch),
        });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: 'No se pudo actualizar la rotación' }));
            throw new Error(errorData.message);
        }
        await fetchData();
    };

    const removeRotation = async (id) => {
        try {
            const response = await fetch(`/api/rotaciones/${id}`, { method: 'DELETE' });
            if (!response.ok) {
                let errorMessage = 'No se pudo eliminar la rotación.';
                try {
                    const errorData = await response.json();
                    errorMessage = errorData.message || errorMessage;
                } catch (e) {}
                throw new Error(errorMessage);
            }
            await fetchData();
        } catch (err) {
            console.error("Error al eliminar rotación:", err);
            throw err;
        }
    };
    
   const registerMovement = async ({ materialId, movementType, quantity, responsible, observations, department }) => {
        const originalMaterials = materials;
        const originalMovements = movements;

        quantity = Number(quantity);
        const materialIndex = materials.findIndex(m => Number(m.Id_Material) === Number(materialId));
        if (materialIndex === -1) throw new Error("Material no encontrado");
        
        const materialToUpdate = materials[materialIndex];

        if (movementType === "Egreso" && materialToUpdate.StockActual < quantity) {
            throw new Error("No hay suficiente stock para este egreso.");
        }

        const newStock = movementType === "Ingreso"
            ? Number(materialToUpdate.StockActual) + quantity
            : Number(materialToUpdate.StockActual) - quantity;

        setMaterials(materials.map(m => Number(m.Id_Material) === Number(materialId) ? { ...m, StockActual: newStock } : m));

        try {
            let idTaller = null;
            let idDocente = null;

            // 1. Deducir Taller
            if (department && department !== "Seleccionar...") {
                const depStr = String(department).trim();
                
                // Si viene un ID directo
                let foundTaller = talleres.find(t => Number(t.Id_Taller) === Number(depStr));
                
                // Si viene el texto formateado
                if (!foundTaller) {
                    foundTaller = talleres.find(t => {
                        const denom = (t.Denominacion || "").toLowerCase();
                        const depLower = depStr.toLowerCase();
                        return depLower.includes(denom) || denom.includes(depLower);
                    });
                }

                if (foundTaller) {
                    idTaller = foundTaller.Id_Taller;
                    
                    // Buscar si el taller ya tiene un docente asignado automáticamente
                    const teacherByTaller = teachers.find(t => Number(t.Id_Taller) === Number(idTaller));
                    if (teacherByTaller) {
                        idDocente = teacherByTaller.Id_Docente;
                    }
                }
            }

            // 2. Deducir Docente (si viene especificado explícitamente)
            if (responsible && responsible !== "Todos" && responsible !== "Sin asignar") {
                const respLower = String(responsible).trim().toLowerCase();
                const teacherFound = teachers.find(t => {
                    const fullName = `${t.Nombre} ${t.Apellido}`.trim().toLowerCase();
                    const altFullName = `${t.Apellido} ${t.Nombre}`.trim().toLowerCase();
                    return String(t.Id_Docente) === respLower || fullName === respLower || altFullName === respLower || respLower.includes((t.Nombre || "").toLowerCase());
                });
                if (teacherFound) {
                    idDocente = teacherFound.Id_Docente;
                }
            }

            const body = {
                materialId: Number(materialId),
                movementType,
                quantity: Number(quantity),
                idTaller,
                idDocente,
                observations
            };

            const response = await fetch('/api/movimientos', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });
        
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.mensaje || 'Error al registrar el movimiento');
            }
        
            await fetchData();

        } catch (error) {
            console.error("Falló el registro del movimiento, revirtiendo:", error);
            setMaterials(originalMaterials);
            setMovements(originalMovements);
            throw error;
        }
    };

    const updateMaterialRequirement = async (params) => {
        const materialId = params.materialId;
        const rawRequirement = params.newRequirement ?? params.quantity ?? params.requerimiento;
        const targetDepartment = params.department ?? params.idTaller;
        const responsible = params.responsible;
        const observations = params.observations;

        const originalMaterials = materials;

        try {
            let resolvedIdTaller = null;
            if (targetDepartment) {
                const taller = talleres.find(t => 
                    t.Id_Taller === Number(targetDepartment) ||
                    `${t.Denominacion} ${t.Turno}`.toLowerCase() === String(targetDepartment).toLowerCase() ||
                    `${t.Denominacion} (${t.Turno})`.toLowerCase() === String(targetDepartment).toLowerCase() ||
                    t.Denominacion.toLowerCase() === String(targetDepartment).toLowerCase()
                );
                if (taller) resolvedIdTaller = taller.Id_Taller;
            }

            let idDocente = null;
            if (responsible) {
                const teacher = teachers.find(t => {
                    const fullName = `${t.Nombre} ${t.Apellido}`.trim().toLowerCase();
                    const altFullName = `${t.Apellido} ${t.Nombre}`.trim().toLowerCase();
                    const target = String(responsible).trim().toLowerCase();
                    return fullName === target || altFullName === target || String(t.Id_Docente) === target;
                });
                if (teacher) idDocente = teacher.Id_Docente;
            }

            const parsedRequirement = Number(String(rawRequirement || 0).replace('+', ''));

            const body = {
                materialId: Number(materialId),
                idTaller: resolvedIdTaller,
                newRequirement: parsedRequirement,
                observations: observations || "",
                idDocente: idDocente
            };

            const response = await fetch('/api/movimientos/requerimiento', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.mensaje || 'Error interno del servidor al cambiar el requerimiento.');
            }

            await fetchData();

        } catch (error) {
            console.error("Falló la actualización del requerimiento, revirtiendo:", error);
            setMaterials(originalMaterials);
            throw error;
        }
    };

    const getTallerName = (id) => {
        const taller = talleres.find(t => t.Id_Taller === id);
        return taller ? taller.Denominacion : "";
    };

    const value = {
        materials, teachers, movements, stats, loading, error, talleres, rotations,
        addMaterial, updateMaterial, removeMaterial,
        addTeacher, updateTeacher, removeTeacher, 
        addTaller, updateTaller, removeTaller,
        addRotation, updateRotation, removeRotation,
        registerMovement, getTallerName, updateMaterialRequirement,
    };

    return <StoreCtx.Provider value={value}>{children}</StoreCtx.Provider>;
}

export function useStore() {
    return useContext(StoreCtx);
}