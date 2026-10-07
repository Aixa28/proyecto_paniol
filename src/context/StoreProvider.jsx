import { createContext, useContext, useMemo, useState, useEffect, useCallback } from "react";

const StoreCtx = createContext();

export function StoreProvider({ children }) {
    const [materials, setMaterials]   = useState([]);
    const [teachers, setTeachers]     = useState([]);
    const [movements, setMovements]   = useState([]);
    const [talleres, setTalleres]     = useState([]);
    const [rotations, setRotations]   = useState([]);
    const [loading, setLoading]       = useState(true);
    const [error, setError]           = useState(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const fetchMaterials = async () => {
                const response = await fetch('/api/inventario/resumen');
                if (!response.ok) throw new Error('Network response was not ok for materials');
                return response.json();
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


            /* Mapeo actualizado para capturar Id_Docente y nombre de responsable correctamente */
            const formattedMovements = reportesData.map(r => {
                // Incluimos la lectura de r.Id_Docente y r.id_docente
                const docId = r.Id_Docente || r.id_docente || r.idDocente || r.responsable;

                const teacher = teachersData.find(t => 
                    t.Id_Docente === Number(docId) || 
                    `${t.Nombre} ${t.Apellido}`.trim().toLowerCase() === String(docId).trim().toLowerCase() ||
                    `${t.Apellido} ${t.Nombre}`.trim().toLowerCase() === String(docId).trim().toLowerCase()
                );

                const teacherName = teacher 
                    ? `${teacher.Nombre} ${teacher.Apellido}` 
                    : (r.responsable || "-");

                return {
                    id: r.id,
                    materialId: r.materialId,
                    materialName: r.material,
                    type: r.tipo,
                    quantity: r.cantidad,
                    department: r.departamento,
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

    // Acciones
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
        const response = await fetch(`/api/docentes/${id}`, {
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
        console.log('registerMovement llamado:', { materialId, movementType, quantity, responsible, department });
        
        const originalMaterials = materials;
        const originalMovements = movements;

        quantity = Number(quantity);
        const materialIndex = materials.findIndex(m => m.Id_Material === materialId);
        if (materialIndex === -1) throw new Error("Material no encontrado");
        
        const materialToUpdate = materials[materialIndex];

        if (movementType === "Egreso" && materialToUpdate.StockActual < quantity) {
            throw new Error("No hay suficiente stock para este egreso.");
        }

        const newStock = movementType === "Ingreso"
            ? materialToUpdate.StockActual + quantity
            : materialToUpdate.StockActual - quantity;

        const updatedMaterials = materials.map(m =>
            m.Id_Material === materialId ? { ...m, StockActual: newStock } : m
        );
        setMaterials(updatedMaterials);

        const newMovement = {
            id: `optimistic-${Date.now()}`,
            materialId,
            materialName: materialToUpdate.Nombre_Descripcion ?? "",
            type: movementType,
            quantity,
            responsible,
            observations,
            department: department || "",
            date: new Date()
        };
        setMovements(prev => [newMovement, ...prev]);

        try {
            let idTaller = null;
            let idDocente = null;

            /* se cambio como se manda la información de taller en movimientos, ahora el nombre del taller o la combinación "denominacion - docente"*/
            if (department) {
                const taller = talleres.find(t => 
                    t.Denominacion === department || 
                    `${t.Denominacion} - ${t.Docente}` === department ||
                    department.includes(t.Denominacion)
                );
                if (taller) idTaller = taller.Id_Taller;
            }

            /* cambiamos que sea más flexible al ingresar/mostrar la información para evita que iddocente sea null */
            if (responsible) {
                const teacher = teachers.find(t => {
                    const fullName = `${t.Nombre} ${t.Apellido}`.trim().toLowerCase();
                    const altFullName = `${t.Apellido} ${t.Nombre}`.trim().toLowerCase();
                    const target = String(responsible).trim().toLowerCase();
                    return fullName === target || altFullName === target || String(t.Id_Docente) === target;
                });
                if (teacher) idDocente = teacher.Id_Docente;
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

    /* cambiamos los alias alternativos, el id de taller ahora se lee por id y Nombre y en requerimiento se eliminaron los signos (+-)*/
    const updateMaterialRequirement = async (params) => {
        // acepta nombres de formulario como con nombres de backend
        const materialId = params.materialId;
        const rawRequirement = params.newRequirement ?? params.quantity ?? params.requerimiento;
        const targetDepartment = params.department ?? params.idTaller;
        const responsible = params.responsible;
        const observations = params.observations;

        const originalMaterials = materials;

        try {
            // resolviendo id del taller sin caer en que no es un número
            let resolvedIdTaller = null;
            // cambiamos que la cuando se busca el taller compare la denominación y el Turno
            if (targetDepartment) {
                const taller = talleres.find(t => 
                    t.Id_Taller === Number(targetDepartment) ||
                    `${t.Denominacion} - ${t.Turno}`.toLowerCase() === String(targetDepartment).toLowerCase() ||
                    `${t.Denominacion} (${t.Turno})`.toLowerCase() === String(targetDepartment).toLowerCase() ||
                    t.Denominacion.toLowerCase() === String(targetDepartment).toLowerCase()
                );
                if (taller) resolvedIdTaller = taller.Id_Taller;
            }

            // resolviendo id del docente para que sea más flexible
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

            // se limpian los signos
            const parsedRequirement = Number(String(rawRequirement || 0).replace('+', ''));

            const body = {
                materialId: Number(materialId),
                idTaller: resolvedIdTaller,
                newRequirement: parsedRequirement,
                observations: observations || "",
                idDocente: idDocente
            };

            console.log('Enviando a /api/movimientos/requerimiento:', body);

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

export const useStore = () => useContext(StoreCtx);