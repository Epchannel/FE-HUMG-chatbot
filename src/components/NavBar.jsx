import { useLocation, useNavigate, Link } from 'react-router-dom';

function NavBar() {
  const navigate = useNavigate();
  const location = useLocation();
  
  return (
    <nav className="bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <button 
              onClick={() => navigate("/")} 
              className="flex items-center space-x-2 hover:opacity-80 transition-opacity"
            >
              <img
                src="/logo-300x120.png"
                alt="HUMG Logo"
                className="h-10 w-auto"
              />
            </button>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            <button 
              onClick={() => navigate("/")} 
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                location.pathname === "/" 
                  ? "bg-blue-50 text-blue-700 border border-blue-200" 
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              }`}
            >
              Trang chủ
            </button>
            <button 
              onClick={() => navigate("/chat")} 
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                location.pathname === "/chat" 
                  ? "bg-blue-50 text-blue-700 border border-blue-200" 
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              }`}
            >
              Trò chuyện
            </button>
            <button 
              onClick={() => navigate("/faq")} 
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                location.pathname === "/faq" 
                  ? "bg-blue-50 text-blue-700 border border-blue-200" 
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              }`}
            >
              FAQs
            </button>
            <button 
              onClick={() => navigate("/issue")} 
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                location.pathname === "/issue" 
                  ? "bg-blue-50 text-blue-700 border border-blue-200" 
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              }`}
            >
              Báo lỗi/ Góp ý
            </button>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-50">
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}

export default NavBar;
