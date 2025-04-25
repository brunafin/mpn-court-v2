import { Route, Routes } from "react-router-dom";
import Login from "./pages/Login";
import Reservation from "./pages/Reservation";
import ReservationDetails from "./pages/Reservation/Details";

function App() {
  return (
    <Routes>
      {/* <Route index element={<Reservation />} />
      <Route path="/login" element={<Login />} />
      <Route path="/reservas/:id" element={<ReservationDetails />} /> */}
      <Route index element={<Login />} />
      <Route path="/reservas" element={<Reservation />} />
      <Route path="/reservas/:id" element={<ReservationDetails />} />
    </Routes>
  );
}

export default App;
