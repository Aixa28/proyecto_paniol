export default function NavTabs({ tab, onChange }) {
  const base = "whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm";
  const active = "border-blue-500 text-blue-600";
  const inactive = "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300";

  return (
    <div>
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          <button onClick={() => onChange("inventory")} className={`${base} ${tab === 'inventory' ? active : inactive}`}>
            Inventario
          </button>
          <button onClick={() => onChange("register")} className={`${base} ${tab === 'register' ? active : inactive}`}>
            Registrar
          </button>
          <button onClick={() => onChange("reports")} className={`${base} ${tab === 'reports' ? active : inactive}`}>
            Reportes
          </button>
          <button onClick={() => onChange("requerimientos")} className={`${base} ${tab === 'requerimientos' ? active : inactive}`}>
            Requerimientos
          </button>
        </nav>
      </div>
    </div>
  );
}