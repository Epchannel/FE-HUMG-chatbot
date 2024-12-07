import { useEffect, useState } from "react";
import NavBar from "./components/NavBar";
import HomePage from "./pages/HomePage";
import ChatBot from "./components/ChatBot";
import FAQPage from "./pages/FAQPage";
import IssuePage from "./pages/IssuePage";
import { HashRouter, Routes, Route } from "react-router-dom"; // Thay đổi từ BrowserRouter thành HashRouter
import ScaleLoader from "react-spinners/ScaleLoader";

function App() {
  useEffect(() => {}, []);
  const [currentPage, SetCurrentPage] = useState("Home");

  return (
    <HashRouter> {/* Thay đổi từ BrowserRouter thành HashRouter */}
      <div className="overflow-hidden">
        <NavBar />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="chat" element={<ChatBot />} />
          <Route path="issue" element={<IssuePage />} />
          <Route path="faq" element={<FAQPage />} />
        </Routes>
      </div>
    </HashRouter>
  );
}

export default App;
