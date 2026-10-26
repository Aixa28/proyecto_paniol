import { useState, useEffect } from "react";
import Header from "../components/Header";
import NavTabs from "../components/NavTabs";
import InventoryPage from "../pages/InventoryPage";
import ReportsPage from "../pages/ReportsPage";
import RequerimientosPage from "../pages/RequerimientosPage";

import "../styles/App.css";
import RegisterPage from "../pages/RegisterPage";
import { Toaster } from 'sonner';

export default function App() {
  const [tab, setTab] = useState("inventory");

  // fecha actual
  const [dateStr, setDateStr] = useState("");
  useEffect(() => {
    const now = new Date();
    setDateStr(now.toLocaleDateString("es-ES", { weekday:"long", year:"numeric", month:"long", day:"numeric" }));
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 font-sans px-4 sm:px-6 lg:px-8">
      <Header user="Administrador" dateStr={dateStr} />
      <NavTabs tab={tab} onChange={setTab} />
      <main className="py-6">
        {tab === "inventory" && <InventoryPage setActiveTab={setTab} />}
        {tab === "register"  && <RegisterPage />}
        {tab === "reports"   && <ReportsPage />}
        {tab === "requerimientos" && <RequerimientosPage/>}  
      </main>
      <Toaster richColors position="bottom-right" />
    </div>
  );
}