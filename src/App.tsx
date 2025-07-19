import { Route, Routes } from "react-router-dom";
import Login from "./pages/Login";
import Reservation from "./pages/Reservation";
import ReservationDetails from "./pages/Reservation/Details";
import ChangePassword from "./pages/ChangePassword";
import Info from "./pages/Info";

function App() {
  return (
    <>
      {import.meta.env.VITE_ENVIRONMENT !== "production" && (
        <p className="bg-danger-500 text-center">versão para testes</p>
      )}
      <Routes>
        <Route index element={<Login />} />
        <Route path="/reservas" element={<Reservation />} />
        <Route path="/reservas/:id" element={<ReservationDetails />} />
        <Route path="/alterar-senha" element={<ChangePassword />} />
        <Route path="/minhas-infos" element={<Info />} />
      </Routes>
    </>
  );
}

export default App;
