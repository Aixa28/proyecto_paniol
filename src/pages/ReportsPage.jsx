    // src/pages/ReportsPage.jsx
    import { useMemo, useState } from "react";
    import { useStore } from "../context/StoreProvider";
    import ReportsTable from "../components/Reports/ReportsTable";
    import ExcelJS from "exceljs";
    import { jsPDF } from "jspdf";
    import autoTable from "jspdf-autotable";
    import { saveAs } from "file-saver";
    
    function normalize(d) {
    if (!d) return null;
    // Asegura que el filtro "hasta" incluya todo el día
    const at = new Date(d);
    at.setHours(23, 59, 59, 999);
    return at;
    }

    export default function ReportsPage() {
    const { movements, materials } = useStore();

    // Filtros
    const [material, setMaterial] = useState("Todos");
    const [type, setType] = useState("Todos");
    const [dept, setDept] = useState("Todos");
    const [responsible, setResponsible] = useState("Todos");
    const [from, setFrom] = useState("");
    const [to, setTo] = useState("");

    const depOptions = useMemo(() => {
        const set = new Set(movements.map(m => m.department).filter(Boolean));
        return ["Todos", ...Array.from(set)];
    }, [movements]);

    const responsibleOptions = useMemo(() => {
        const set = new Set(movements.map(m => m.responsible).filter(Boolean));
        return ["Todos", ...Array.from(set).sort()];
    }, [movements]);

    const rows = useMemo(() => {
        const fromDate = from ? new Date(from) : null;
        const toDate = to ? normalize(to) : null;

        let arr = [...movements];

        // Filtro Material
        if (material !== "Todos") {
        arr = arr.filter(m => m.materialName === material);
        }

        // Tipo
        if (type !== "Todos") {
        arr = arr.filter(m => m.type === type);
        }

        // Departamento
        if (dept !== "Todos") {
        arr = arr.filter(m => (m.department || "") === dept);
        }

        // Responsable
        if (responsible !== "Todos") {
        arr = arr.filter(m => m.responsible === responsible);
        }

        // Rango de fechas
        if (fromDate) {
        arr = arr.filter(m => new Date(m.date) >= fromDate);
        }
        if (toDate) {
        arr = arr.filter(m => new Date(m.date) <= toDate);
        }

        // Agregar el estado actual del material a cada movimiento
        const arrWithStatus = arr.map(movement => {
            // Buscamos coincidencia por ID (convirtiendo a Number) o por Nombre de material
            const materialInfo = materials.find(m => 
                Number(m.Id_Material) === Number(movement.materialId) ||
                (m.Nombre_Descripcion && movement.materialName && 
                m.Nombre_Descripcion.trim().toLowerCase() === movement.materialName.trim().toLowerCase())
            );

            // Obtenemos el estado o un valor por defecto
            const estadoCalculado = materialInfo 
                ? (materialInfo.Estado || materialInfo.estado || 'DISPONIBLE')
                : 'Indefinido';

            return {
                ...movement,
                Estado: estadoCalculado
            };
        });
        
        // Orden descendente
        arrWithStatus.sort((a, b) => new Date(b.date) - new Date(a.date));
        return arrWithStatus;
    }, [movements, materials, material, type, dept, responsible, from, to]);

    const reset = () => {
        setMaterial("Todos");
        setType("Todos");
        setDept("Todos");
        setResponsible("Todos");
        setFrom("");
        setTo("");
    };

    // --- EXPORTAR A EXCEL (con ExcelJS) ---
    const exportToExcel = async () => {
        // 1. Crear libro y hoja de trabajo
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet("Movimientos");

        // 2. Agregar título principal
        const headers = ['Material', 'Estado', 'Tipo', 'Cantidad', 'Departamento', 'Responsable', 'Observaciones', 'Fecha'];
        
        worksheet.addRow(["Informe de Movimientos de Stock"]);
        worksheet.mergeCells(1, 1, 1, headers.length); // Fusionar título de A1 a H1

        // Estilo para el título
        const titleCell = worksheet.getCell("A1");
        titleCell.font = { name: "Arial", size: 14, bold: true, color: { argb: "FFFFFF" } };
        titleCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "4F86C6" } };
        titleCell.alignment = { horizontal: "center", vertical: "middle" };
        worksheet.getRow(1).height = 30;

        // 3. Agregar encabezados
        const headerRow = worksheet.addRow(headers);
        headerRow.height = 24;
        headerRow.eachCell((cell) => {
            cell.font = { name: "Arial", size: 11, bold: true, color: { argb: "FFFFFF" } };
            cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "4F86C6" } };
            cell.alignment = { horizontal: "center", vertical: "middle" };
            cell.border = {
                top: { style: "thin" },
                left: { style: "thin" },
                bottom: { style: "thin" },
                right: { style: "thin" }
            };
        });

        // 4. Agregar filas de datos
        rows.forEach(row => {
            const dataRow = worksheet.addRow([
                row.materialName,
                row.Estado,
                row.type,
                row.quantity,
                row.department || "-",
                row.responsible,
                row.observations || "-",
                new Date(row.date).toLocaleString("es-AR", {
                    day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit"
                })
            ]);

            dataRow.eachCell((cell) => {
                cell.font = { name: "Arial", size: 10 };
                cell.border = {
                    top: { style: "thin", color: { argb: "D3D3D3" } },
                    left: { style: "thin", color: { argb: "D3D3D3" } },
                    bottom: { style: "thin", color: { argb: "D3D3D3" } },
                    right: { style: "thin", color: { argb: "D3D3D3" } }
                };
            });
        });

        // 5. Configurar ancho de columnas
        worksheet.columns = [
            { width: 30 }, // Material
            { width: 15 }, // Estado
            { width: 15 }, // Tipo
            { width: 12 }, // Cantidad
            { width: 22 }, // Departamento
            { width: 22 }, // Responsable
            { width: 35 }, // Observaciones
            { width: 22 }  // Fecha
        ];

        // 6. Generar el archivo y descargarlo
        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
        saveAs(blob, `Reporte_Movimientos_${new Date().toLocaleDateString('es-AR').replace(/\//g, '-')}.xlsx`);
    };

    // --- EXPORTAR A PDF ---
    const exportToPdf = () => {
        const doc = new jsPDF();

        // 1. Definimos los encabezados y preparamos los datos.
        const head = [['Material', 'Estado', 'Tipo', 'Cantidad', 'Departamento', 'Responsable', 'Observaciones', 'Fecha']];
        const body = rows.map(row => [
            row.materialName,
            row.Estado,
            row.type,
            row.quantity,
            row.department || "-",
            row.responsible,
            row.observations || "-",
            new Date(row.date).toLocaleString("es-AR", {
                day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit"
            }),
        ]);

        // 2. Título del documento
        doc.setFontSize(18);
        doc.text("Informe de Movimientos de Stock", 14, 22);

        // 3. Generamos la tabla con autoTable
        autoTable(doc, {
            startY: 30,
            head: head,
            body: body,
            theme: 'grid', // 'striped', 'grid', 'plain'
            headStyles: {
                fillColor: [79, 134, 198], // Color azul similar al de Excel
                textColor: [255, 255, 255],
                fontStyle: 'bold',
            },
        });

        // 4. Guardamos el archivo
        doc.save(`Reporte_Movimientos_${new Date().toLocaleDateString('es-AR').replace(/\//g, '-')}.pdf`);
    };

    return (
        <div className="fade-in">
        <div className="bg-white shadow-custom rounded-lg">

            {/* HEADER */}
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <div>
                <h3 className="text-lg font-medium text-gray-900">Informes y Movimientos</h3>
                <p className="mt-1 text-sm text-gray-500">
                Consulta de ingresos y egresos de stock con filtros por texto, tipo, departamento y fecha.
                </p>
            </div>

            <div className="flex items-center gap-3">
                <span className="text-sm text-gray-600">
                <span className="font-medium">{rows.length}</span> resultado(s)
                </span>

                {/* 👉 BOTÓN EXPORTAR */}
                <button
                onClick={exportToExcel}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm rounded-md shadow-md transition"
                >
                Exportar Excel
                </button>
                <button
                onClick={exportToPdf}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm rounded-md shadow-md transition"
                >
                Exportar PDF
                </button>
            </div>
            </div>

            {/* FILTROS */}
            <div className="px-6 py-4 bg-gray-50 border-y border-gray-200">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                <div className="lg:col-span-2 xl:col-span-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Material</label>
                <select
                    value={material}
                    onChange={e => setMaterial(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                >
                    <option>Todos</option>
                    {materials.map(m => (
                    <option key={m.Id_Material}>{m.Nombre_Descripcion}</option>
                    ))}
                </select>
                </div>

                <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                <select
                    value={type}
                    onChange={e => setType(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                >
                    <option>Todos</option>
                    <option>Ingreso</option>
                    <option>Egreso</option>
                    <option>Cambio de Requerimiento</option>
                </select>
                </div>

                <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Departamento</label>
                <select
                    value={dept}
                    onChange={e => setDept(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                >
                    {depOptions.map(d => (
                    <option key={d}>{d}</option>
                    ))}
                </select>
                </div>

                <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Responsable</label>
                <select
                    value={responsible}
                    onChange={e => setResponsible(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                >
                    {responsibleOptions.map(r => (
                    <option key={r}>{r}</option>
                    ))}
                </select>
                </div>

                <div className="flex items-end">
                <button
                    onClick={reset}
                    className="w-full inline-flex justify-center py-2 px-4 rounded-md border border-transparent bg-blue-100 text-blue-700 hover:bg-blue-200 text-sm font-medium transition"
                >
                    Limpiar filtros
                </button>
                </div>
            </div>

            {/* Rango de fechas */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
                <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Desde</label>
                <input
                    type="date"
                    value={from}
                    onChange={e => setFrom(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                />
                </div>

                <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Hasta</label>
                <input
                    type="date"
                    value={to}
                    onChange={e => setTo(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                />
                </div>
            </div>
            </div>

            {/* TABLA */}
            <ReportsTable rows={rows} />
        </div>
        </div>
    );
    }
