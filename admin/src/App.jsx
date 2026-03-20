import { Navigate, Route, Routes } from "react-router-dom";
import DashboardPage from "./pages/DashboardPage";
import PanneauDetailPage from "./pages/PanneauDetailPage";
import ProjetDetailPage from "./pages/ProjetDetailPage";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<DashboardPage />} />
      <Route path="/panneaux/:id" element={<PanneauDetailPage />} />
      <Route path="/projets/:id" element={<ProjetDetailPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
