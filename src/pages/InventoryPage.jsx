import { useMemo, useState } from "react";
import { useStore } from "../context/StoreProvider";
import InventoryTable from "../components/inventory/InventoryTable";
import Stats from "../components/Inventory/Stats";
import StockMovementModal from "../components/modals/StockMovementModal";

export default function InventoryPage({ setActiveTab }) {
    const { materials, stats, loading, error } = useStore();
    const [search, setSearch] = useState("");
    const [sort, setSort] = useState("alphabetical");
    const [showStockModal, setShowStockModal] = useState(false);

    // Mapeamos los datos del store al nuevo formato estandarizado
    const standardizedMaterials = useMemo(() => materials.map(m => ({
        id: m.Id_Material,
        name: m.Nombre_Descripcion,
        quantity: m.StockActual,
        ...m
    })), [materials]);

    const filtered = useMemo(() => {
        const s = search.trim().toLowerCase();
        let arr = standardizedMaterials.filter(m => m.name && m.name.toLowerCase().includes(s));
        if (sort === "alphabetical") arr.sort((a,b)=> a.name.localeCompare(b.name));
        if (sort === "stock-desc")  arr.sort((a,b)=> b.quantity - a.quantity);
        if (sort === "stock-asc")   arr.sort((a,b)=> a.quantity - b.quantity);
        return arr;
    }, [standardizedMaterials, search, sort]);

    if (loading) return <div>Loading...</div>;
    if (error) return <div>Error: {error.message}</div>;

    return (
        <div className="fade-in">
        <div className="bg-white shadow-custom rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <div>
                <h3 className="text-lg font-medium text-gray-900">Inventario Actual</h3>
                <p className="mt-1 text-sm text-gray-500">Lista completa de materiales en stock</p>
            </div>
            <div className="flex space-x-3">
                <button onClick={() => setShowStockModal(true)} className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none">
                    Registrar Movimiento
                </button>
                <select value={sort} onChange={e=>setSort(e.target.value)} className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500">
                <option value="alphabetical">Orden Alfabético</option>
                <option value="stock-desc">Mayor a Menor Stock</option>
                <option value="stock-asc">Menor a Mayor Stock</option>
                </select>
                <div className="relative">
                <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar material..." className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                    </svg>
                </div>
                </div>
            </div>
            </div>

            <InventoryTable rows={filtered} setActiveTab={setActiveTab} />
        </div>

        <div className="mt-6 bg-white shadow-custom rounded-lg p-6">
            <h4 className="text-sm font-medium text-gray-900 mb-3">Resumen de Stock</h4>
            <Stats stats={stats} />
        </div>
        {showStockModal && <StockMovementModal onClose={() => setShowStockModal(false)} />}
        </div>
    );
}