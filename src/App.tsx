import { Route, Routes } from "react-router-dom";
import Login from "./pages/Login";
import Reservation from "./pages/Reservation";
import ReservationDetails from "./pages/Reservation/Details";
import ChangePassword from "./pages/ChangePassword";

function App() {
  return (
    <Routes>
      <Route index element={<Login />} />
      <Route path="/reservas" element={<Reservation />} />
      <Route path="/reservas/:id" element={<ReservationDetails />} />
      <Route path="/alterar-senha" element={<ChangePassword />} />
    </Routes>
  );
}

export default App;
