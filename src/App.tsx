import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import CategoryView from "./pages/CategoryView/CategoryView";
import Login from "./pages/Auth/Login";
import Signup from "./pages/Auth/Signup";
import Player from "./pages/Player";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/category/:categorySlug" element={<CategoryView />} />
        <Route path="/player/:id" element={<Player />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
      </Routes>
    </BrowserRouter>
  );
}

