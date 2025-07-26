import { useEffect } from "react";
import { Route, Routes } from "react-router-dom";
import Login from "./pages/Login";
import Reservation from "./pages/Reservation";
import ReservationDetails from "./pages/Reservation/Details";
import ChangePassword from "./pages/ChangePassword";
import Info from "./pages/Info";
import ConfigDay from "./pages/ConfigDay";

function App() {
  useEffect(() => {
    if (import.meta.env.VITE_ENVIRONMENT === "production") {
      (function (c: any, l: any, a: any, r: any, i: any, t?: any, y?: any) {
        c[a] = c[a] || function () {
          (c[a].q = c[a].q || []).push(arguments);
        };
        t = l.createElement(r);
        t.async = 1;
        t.src = "https://www.clarity.ms/tag/" + i;
        y = l.getElementsByTagName(r)[0];
        y.parentNode.insertBefore(t, y);
      })(window, document, "clarity", "script", "skzyiavfyw");
    }
  }, []);

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
        <Route path="/configuracoes-horarios" element={<ConfigDay />} />
      </Routes>
    </>
  );
}

export default App;
