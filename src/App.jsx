import { useEffect, useState } from "react";
import NavBar from "./components/NavBar";
import HomePage from "./pages/HomePage";
import ChatBot from "./components/ChatBot";
import FAQPage from "./pages/FAQPage";
import IssuePage from "./pages/IssuePage";
import { HashRouter, Routes, Route } from "react-router-dom";
import ScaleLoader from "react-spinners/ScaleLoader";

function App() {
  useEffect(() => {}, []);
  const [currentPage, SetCurrentPage] = useState("Home");

  return (
    <HashRouter>
      <div className="flex flex-col h-screen bg-gray-50">
        <NavBar />
        <main className="flex-1 overflow-hidden">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="chat" element={<ChatBot />} />
            <Route path="issue" element={<IssuePage />} />
            <Route path="faq" element={<FAQPage />} />
          </Routes>
        </main>
      </div>
    </HashRouter>
  );
}

export default App;
