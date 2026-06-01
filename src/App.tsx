import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import CategoryView from "./pages/CategoryView/CategoryView";
import Login from "./pages/Auth/Login";
import Signup from "./pages/Auth/Signup";
import Player from "./pages/Player";
import SeriesPlayer from "./pages/SeriesPlayer";
import Profile from "./pages/Profile/Profile";
import ScrollToTop from "./components/ScrollToTop";

export default function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/category/:categorySlug" element={<CategoryView />} />
        <Route path="/player/:id" element={<Player />} />
        <Route path="/movie/:id" element={<Player />} />
        <Route path="/series/:id" element={<SeriesPlayer />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/profile" element={<Profile />} />
      </Routes>
    </BrowserRouter>
  );
}

