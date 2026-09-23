    // src/pages/ReportsPage.jsx
    import { useMemo, useState } from "react";
    import { useStore } from "../context/StoreProvider";
    import ReportsTable from "../components/Reports/ReportsTable";
    import excelJS from "excelJS";
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

        // Add material status to each movement
        const arrWithStatus = arr.map(movement => {
            const materialInfo = materials.find(m => m.Id_Material === movement.materialId);
            return {
                ...movement,
                Estado: materialInfo ? materialInfo.Estado : 'Indefinido'
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

    // --- EXPORTAR A EXCEL ---
    const exportToExcel = () => {
        // 1. Definimos los encabezados y preparamos los datos.
        const headers = ['Material', 'Estado', 'Tipo', 'Cantidad', 'Departamento', 'Responsable', 'Observaciones', 'Fecha'];
        const sheetData = rows.map(row => [
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

        // 2. Creamos una hoja de cálculo desde un array de arrays.
        const ws = XLSX.utils.aoa_to_sheet([["Informe de Movimientos de Stock"], headers, ...sheetData]);

        // 3. Fusionamos la celda del título para que ocupe todo el ancho.
        ws['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: headers.length - 1 } }];

        // 4. Definimos el ancho de las columnas.
        ws['!cols'] = [
            { wch: 30 }, // Material
            { wch: 15 }, // Estado
            { wch: 10 }, // Tipo
            { wch: 10 }, // Cantidad
            { wch: 20 }, // Departamento
            { wch: 20 }, // Responsable
            { wch: 35 }, // Observaciones
            { wch: 20 }  // Fecha
        ];

        // 5. Definimos los estilos.
        const titleStyle = { font: { bold: true, color: { rgb: "FFFFFF" } }, fill: { fgColor: { rgb: "4F86C6" } }, alignment: { horizontal: "center", vertical: "center" } };
        const headerStyle = { font: { bold: true, color: { rgb: "FFFFFF" } }, fill: { fgColor: { rgb: "4F86C6" } } };
        const cellStyle = { border: { top: { style: "thin" }, bottom: { style: "thin" }, left: { style: "thin" }, right: { style: "thin" } } };

        // 6. Aplicamos los estilos a las celdas.
        const range = XLSX.utils.decode_range(ws['!ref']);
        for (let R = range.s.r; R <= range.e.r; ++R) {
            for (let C = range.s.c; C <= range.e.c; ++C) {
                const cell_address = { c: C, r: R };
                const cell_ref = XLSX.utils.encode_cell(cell_address);
                if (!ws[cell_ref]) continue; // Si la celda no existe, la saltamos.

                // Estilo para el título principal (fila 0)
                if (R === 0) {
                    ws[cell_ref].s = titleStyle;
                }
                // Estilo para los encabezados de la tabla (fila 1)
                else if (R === 1) {
                    ws[cell_ref].s = headerStyle;
                }
                // Estilo con bordes para todas las celdas de datos
                else {
                    ws[cell_ref].s = cellStyle;
                }
            }
        }
        // Aplicar el estilo al título fusionado también
        ws['A1'].s = titleStyle;


        // 7. Creamos un nuevo libro de trabajo y le añadimos nuestra hoja.
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Movimientos");

        // 8. Generamos el buffer del archivo Excel.
        const excelBuffer = XLSX.write(wb, {
            bookType: "xlsx",
            type: "array",
        });

        // 9. Creamos el Blob y lo guardamos con file-saver.
        const data = new Blob([excelBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
        saveAs(data, `Reporte_Movimientos_${new Date().toLocaleDateString('es-AR').replace(/\//g, '-')}.xlsx`);
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
