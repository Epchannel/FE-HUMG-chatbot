import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faMessage,
  faPlus,
  faSun,
  faMoon,
} from "@fortawesome/free-solid-svg-icons";

const SidebarMenu = ({
  sidebarOpen,
  setSidebarOpen,
  handleNewSession,
  selectedSession,
  loadConversation,
  isDarkMode,
  setIsDarkMode,
  conversationHistory,
}) => {
  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
  };

  return (
    <div
      className={`h-full ${
        isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
      } border-r flex-col transition-all duration-300 ${
        sidebarOpen ? "w-[260px]" : "w-16"
      } flex`}
    >
      <div className={`p-4`}>
        <div className="flex items-center justify-between">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className={`p-2 hover:${
              isDarkMode ? "bg-gray-700" : "bg-gray-100"
            } rounded-lg transition-colors ${
              isDarkMode ? "text-gray-300" : "text-gray-600"
            }`}
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
          {sidebarOpen && (
            <button
              onClick={toggleDarkMode}
              className={`w-8 h-8 flex items-center justify-center ml-2 hover:${
                isDarkMode ? "bg-gray-700" : "bg-gray-100"
              } rounded-lg transition-colors ${
                isDarkMode ? "text-gray-300" : "text-gray-600"
              }`}
              title={
                isDarkMode ? "Chuyển sang Light mode" : "Chuyển sang Dark mode"
              }
            >
              <FontAwesomeIcon
                icon={isDarkMode ? faSun : faMoon}
                className="text-sm"
              />
            </button>
          )}
        </div>
      </div>
      <div className="p-4 flex justify-center">
        {sidebarOpen ? (
          <button
            onClick={handleNewSession}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-all duration-200 shadow-md focus:outline-none font-medium text-base"
            title="Tạo đoạn chat mới"
          >
            <FontAwesomeIcon icon={faPlus} className="text-lg" />
            <span>Tạo đoạn chat mới</span>
          </button>
        ) : (
          <button
            onClick={handleNewSession}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-blue-600 text-white hover:bg-blue-700 transition-all duration-200 shadow-md focus:outline-none"
            title="Tạo đoạn chat mới"
          >
            <FontAwesomeIcon icon={faPlus} className="text-lg" />
          </button>
        )}
      </div>
  
  
      {sidebarOpen && (
        <div className="px-4">
          <h3
            className={`text-sm font-medium mb-3 ${
              isDarkMode ? "text-gray-400" : "text-gray-500"
            }`}
          >
            Gần đây
          </h3>
          <div className="space-y-2">
            {conversationHistory.length === 0 ? (
              <div
                className={`text-center py-4 ${
                  isDarkMode ? "text-gray-500" : "text-gray-400"
                }`}
              >
                <div className="w-8 h-8 mx-auto mb-2 opacity-50">
                  <FontAwesomeIcon icon={faMessage} className="w-full h-full" />
                </div>
                <p className="text-xs">Chưa có cuộc trò chuyện nào</p>
              </div>
            ) : (
              conversationHistory.map((conv, index) => (
                <button
                  key={index}
                  onClick={() => loadConversation(conv.session_id)}
                  className={`w-full text-left p-3 rounded-lg transition-all duration-200 ${
                    selectedSession === conv.session_id
                      ? isDarkMode
                        ? "bg-blue-600 text-white shadow-lg"
                        : "bg-blue-50 text-blue-700"
                      : isDarkMode
                      ? "text-gray-300 hover:bg-gray-700 hover:shadow-md"
                      : "text-gray-700 hover:bg-gray-50 hover:shadow-sm"
                  }`}
                  title={conv.title || `Cuộc trò chuyện ${index + 1}`}
                  style={{ border: "none" }}
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">
                      {conv.title || `Cuộc trò chuyện ${index + 1}`}
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SidebarMenu;
