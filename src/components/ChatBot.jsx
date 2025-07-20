// import avatar from "../assets/avatar.jpg";
import robot_img from "../assets/robot_image.webp";
import { useState, useRef, useEffect, useCallback } from "react";
import ScaleLoader from "react-spinners/ScaleLoader";
import { TypeAnimation } from "react-type-animation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMessage, faCopy, faThumbsUp, faThumbsDown } from "@fortawesome/free-regular-svg-icons";
import { faVolumeHigh, faRotateRight, faTrash, faUser, faPlus, faSearch, faCog, faMicrophone, faImage, faMagnifyingGlass, faSun, faMoon } from "@fortawesome/free-solid-svg-icons";

// Kiểm tra localStorage có khả dụng không
const isLocalStorageAvailable = () => {
  try {
    const testKey = 'humg-chatbot-test';
    localStorage.setItem(testKey, 'test');
    localStorage.removeItem(testKey);
    return true;
  } catch (error) {
    console.warn('localStorage không khả dụng:', error);
    return false;
  }
};

// Fallback storage sử dụng sessionStorage hoặc memory
let fallbackStorage = {};

const getStorageItem = (key) => {
  if (isLocalStorageAvailable()) {
    return localStorage.getItem(key);
  }
  try {
    return sessionStorage.getItem(key);
  } catch (error) {
    return fallbackStorage[key] || null;
  }
};

const setStorageItem = (key, value) => {
  if (isLocalStorageAvailable()) {
    try {
      localStorage.setItem(key, value);
      return true;
    } catch (error) {
      console.warn('Không thể lưu vào localStorage:', error);
    }
  }
  
  try {
    sessionStorage.setItem(key, value);
    return true;
  } catch (error) {
    fallbackStorage[key] = value;
    return true;
  }
};

const removeStorageItem = (key) => {
  if (isLocalStorageAvailable()) {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.warn('Không thể xóa từ localStorage:', error);
    }
  }
  
  try {
    sessionStorage.removeItem(key);
  } catch (error) {
    delete fallbackStorage[key];
  }
};

// Hàm để lấy dữ liệu từ storage
const getStoredChatData = () => {
  try {
    const stored = getStorageItem('humg-chatbot-data');
    if (stored) {
      const parsed = JSON.parse(stored);
      console.log('Đã khôi phục dữ liệu chat từ storage');
      return {
        dataChat: parsed.dataChat || [["start", ["Xin chào! Đây là HUMG Chatbot, trợ lý đắc lực dành cho bạn! Bạn muốn tìm kiếm thông tin về những gì? Đừng quên chọn nguồn tham khảo phù hợp để mình có thể giúp bạn tìm kiếm thông tin chính xác nhất nha. 😄", null]]],
        chatHistory: parsed.chatHistory || [],
        feedbackState: parsed.feedbackState || {},
        userInfo: parsed.userInfo || null,
        sessionId: parsed.sessionId || generateSessionId()
      };
    }
  } catch (error) {
    console.log('Error loading chat data from storage:', error);
  }
  return {
    dataChat: [["start", ["Xin chào! Đây là HUMG Chatbot, trợ lý đắc lực dành cho bạn! Bạn muốn tìm kiếm thông tin về những gì? Đừng quên chọn nguồn tham khảo phù hợp để mình có thể giúp bạn tìm kiếm thông tin chính xác nhất nha. 😄", null]]],
    chatHistory: [],
    feedbackState: {},
    userInfo: null,
    sessionId: generateSessionId()
  };
};

// API endpoints
const API_BASE_URL = "http://34.87.17.241:9999";
const CHATBOT_ENDPOINT = `${API_BASE_URL}/chatbot_proactive`;
const GET_CONV_TITLE_ENDPOINT = `${API_BASE_URL}/get_conv_title`;
const GET_CHAT_CONV_ENDPOINT = `${API_BASE_URL}/get_chat_conv`;

// Utility function to generate session ID
const generateSessionId = () => {
  return 'session-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
};

function ChatBot() {
  const messagesEndRef = useRef(null);
  const [timeOfRequest, SetTimeOfRequest] = useState(0);
  let [promptInput, SetPromptInput] = useState("");
  let [sourceData, SetSourceData] = useState("nttu");
  
  // Dark mode state
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  // Khởi tạo state với dữ liệu từ localStorage
  const initialData = getStoredChatData();
  let [chatHistory, SetChatHistory] = useState(initialData.chatHistory);

  // New states for user info and conversation management
  const [userInfo, setUserInfo] = useState(initialData.userInfo);
  const [sessionId, setSessionId] = useState(initialData.sessionId);
  const [showUserInfoPopup, setShowUserInfoPopup] = useState(!initialData.userInfo);
  const [tempUserInfo, setTempUserInfo] = useState({
    mssv: '',
    userName: '',
    nameBot: 'DieuLinh'
  });
  
  // New state for conversation history from API
  const [conversationHistory, setConversationHistory] = useState([]);
  const [isLoadingConversations, setIsLoadingConversations] = useState(false);
  const [isLoadingChatHistory, setIsLoadingChatHistory] = useState(false);
  
  // Sidebar states
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [selectedSession, setSelectedSession] = useState(null);
  
  const commonQuestions=[
    "Điểm chuẩn của ngành Quản trị Kinh doanh năm 2024 theo điểm thi THPT",
    "Giới thiệu về cơ sở vật chất của trường?",
    "Khoa Công nghệ Thông tin có các ngành chính nào?",
    "Trường có ký túc xá không?",
    "Học phần tiên quyết là như thế nào?",
  ]
  let [isLoading, SetIsLoad] = useState(false);
  let [isGen, SetIsGen] = useState(false);
  const [isUserScrolledUp, setIsUserScrolledUp] = useState(false);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const chatAreaRef = useRef(null);
  const [feedbackState, setFeedbackState] = useState(initialData.feedbackState);
  const [storageStatus, setStorageStatus] = useState('checking');
  
  const [dataChat, SetDataChat] = useState(initialData.dataChat);

  // Updated save function to include user info and session
  const saveChatData = useCallback(() => {
    try {
      const dataToSave = {
        dataChat,
        chatHistory,
        feedbackState,
        userInfo,
        sessionId,
        timestamp: Date.now()
      };
      console.log('💾 Đang lưu dữ liệu chat...', {
        dataChatLength: dataChat.length,
        chatHistoryLength: chatHistory.length,
        feedbackStateKeys: Object.keys(feedbackState).length,
        userInfo: userInfo?.userName || 'No user'
      });
      const success = setStorageItem('humg-chatbot-data', JSON.stringify(dataToSave));
      if (success) {
        console.log('✅ Đã lưu dữ liệu chat thành công');
      } else {
        console.log('⚠️ Lưu dữ liệu thất bại');
      }
    } catch (error) {
      console.log('❌ Error saving chat data to storage:', error);
    }
  }, [dataChat, chatHistory, feedbackState, userInfo, sessionId]);

  // Auto-save dữ liệu khi có thay đổi
  useEffect(() => {
    saveChatData();
  }, [saveChatData]);

  // Hàm kiểm tra xem user có đang ở gần cuối chat không
  const isNearBottom = () => {
    if (!chatAreaRef.current) return true;
    const { scrollTop, scrollHeight, clientHeight } = chatAreaRef.current;
    const threshold = 50;
    return Math.abs(scrollHeight - scrollTop - clientHeight) <= threshold;
  };

  // Hàm cuộn xuống cuối khung chat
  function scrollToEnd(smooth = true) {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: smooth ? "smooth" : "auto" });
    }
  }

  // Function for scroll to end button
  const ScrollToEndChat = () => {
    scrollToEnd();
    setIsUserScrolledUp(false);
    setShowScrollButton(false);
  };

  // Xử lý sự kiện scroll của user với debounce
  const handleScroll = useCallback(() => {
    if (!chatAreaRef.current) return;
    
    const isAtBottom = isNearBottom();
    const userScrolledUp = !isAtBottom;
    
    setIsUserScrolledUp(prev => prev !== userScrolledUp ? userScrolledUp : prev);
    setShowScrollButton(prev => prev !== userScrolledUp ? userScrolledUp : prev);
  }, []);

  // Auto scroll chỉ khi cần thiết
  useEffect(() => {
    if (!isUserScrolledUp) {
      const timeoutId = setTimeout(() => {
        scrollToEnd();
      }, 100);
      
      return () => clearTimeout(timeoutId);
    }
  }, [dataChat, isLoading, isUserScrolledUp]);

  // Xử lý scroll trong quá trình TypeAnimation
  useEffect(() => {
    let intervalId;
    
    if (isGen && !isUserScrolledUp) {
      intervalId = setInterval(() => {
        if (!isUserScrolledUp) {
          scrollToEnd(false);
        }
      }, 200);
    }
    
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [isGen, isUserScrolledUp]);

  const onChangeHandler = (event) => {
    SetPromptInput(event.target.value);
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      SendMessageChat();
    }
  };

  const clearChatHistory = () => {
    SetDataChat([["start", ["Xin chào! Đây là HUMG Chatbot, trợ lý đắc lực dành cho bạn! Bạn muốn tìm kiếm thông tin về những gì? Đừng quên chọn nguồn tham khảo phù hợp để mình có thể giúp bạn tìm kiếm thông tin chính xác nhất nha. 😄", null]]]);
    SetChatHistory([]);
    setFeedbackState({});
    const newSessionId = generateSessionId();
    setSessionId(newSessionId);
    setUserInfo(null);
    setShowUserInfoPopup(true);
    removeStorageItem('humg-chatbot-data');
    console.log('🧹 Đã xóa lịch sử chat');
  };

  const handleUserInfoSubmit = () => {
    if (tempUserInfo.mssv && tempUserInfo.userName) {
      setUserInfo(tempUserInfo);
      setShowUserInfoPopup(false);
      console.log('✅ Đã lưu thông tin người dùng:', tempUserInfo);
    } else {
      alert('Vui lòng nhập đầy đủ thông tin!');
    }
  };

  const handleNewSession = () => {
    const newSessionId = generateSessionId();
    setSessionId(newSessionId);
    SetDataChat([["start", ["Xin chào! Đây là HUMG Chatbot, trợ lý đắc lực dành cho bạn! Bạn muốn tìm kiếm thông tin về những gì? Đừng quên chọn nguồn tham khảo phù hợp để mình có thể giúp bạn tìm kiếm thông tin chính xác nha. 😄", null]]]);
    SetChatHistory([]);
    setFeedbackState({});
    console.log('🆕 Đã tạo phiên chat mới:', newSessionId);
  };

  const fetchConversationHistory = async () => {
    if (!userInfo?.mssv) {
      console.log('❌ Không có thông tin người dùng để tải lịch sử');
      return;
    }

    setIsLoadingConversations(true);
    try {
      const response = await fetch(GET_CONV_TITLE_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mssv: userInfo.mssv
        })
      });

      if (response.ok) {
        const data = await response.json();
        console.log('📚 Đã tải lịch sử hội thoại:', data);
        setConversationHistory(data.conversations || []);
      } else {
        console.log('❌ Lỗi khi tải lịch sử hội thoại:', response.status);
      }
    } catch (error) {
      console.log('❌ Lỗi network khi tải lịch sử hội thoại:', error);
    } finally {
      setIsLoadingConversations(false);
    }
  };

  const updateUrlWithSessionId = (sessionIdParam) => {
    const url = new URL(window.location);
    url.searchParams.set('session', sessionIdParam);
    window.history.replaceState({}, '', url);
  };

  const getSessionIdFromUrl = () => {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('session');
  };

  const fetchChatConversation = async (sessionIdToLoad) => {
    if (!userInfo?.mssv) {
      console.log('❌ Không có thông tin người dùng để tải hội thoại');
      return;
    }

    setIsLoadingChatHistory(true);
    try {
      const response = await fetch(GET_CHAT_CONV_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mssv: userInfo.mssv,
          session_id: sessionIdToLoad
        })
      });

      if (response.ok) {
        const data = await response.json();
        console.log('📖 Đã tải hội thoại:', data);
        
        if (data.messages && data.messages.length > 0) {
          const formattedMessages = data.messages.map(msg => [
            msg.role === 'user' ? 'user' : 'bot',
            msg.content,
            msg.timestamp
          ]);
          
          SetDataChat(formattedMessages);
          setSessionId(sessionIdToLoad);
          updateUrlWithSessionId(sessionIdToLoad);
          console.log('✅ Đã tải hội thoại thành công');
        } else {
          console.log('⚠️ Hội thoại trống hoặc không tồn tại');
        }
      } else {
        console.log('❌ Lỗi khi tải hội thoại:', response.status);
      }
    } catch (error) {
      console.log('❌ Lỗi network khi tải hội thoại:', error);
    } finally {
      setIsLoadingChatHistory(false);
    }
  };

  const loadConversation = async (sessionIdToLoad) => {
    if (sessionIdToLoad === sessionId) {
      console.log('🔄 Đang ở cùng phiên chat');
      return;
    }

    console.log('📂 Đang tải hội thoại:', sessionIdToLoad);
    await fetchChatConversation(sessionIdToLoad);
  };

  // Load conversation from URL on mount
  useEffect(() => {
    const sessionFromUrl = getSessionIdFromUrl();
    if (sessionFromUrl && userInfo?.mssv) {
      loadConversation(sessionFromUrl);
    }
  }, [userInfo]);

  async function SendMessageChat() {
    if (!promptInput.trim() || isLoading) return;

    const userMessage = promptInput.trim();
    SetPromptInput("");
    
    // Add user message to chat
    SetDataChat(prev => [...prev, ["user", userMessage]]);
    
    SetIsLoad(true);
    SetIsGen(true);
    
    try {
      const requestData = {
        message: userMessage,
        source: sourceData,
        session_id: sessionId,
        user_info: userInfo || tempUserInfo
      };

      console.log('📤 Đang gửi tin nhắn:', requestData);

      const response = await fetch(CHATBOT_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData)
      });

      if (response.ok) {
        const data = await response.json();
        console.log('📥 Phản hồi từ chatbot:', data);
        
        const botResponse = data.response || "Xin lỗi, tôi không thể xử lý yêu cầu của bạn.";
        
        SetDataChat(prev => [...prev, ["bot", botResponse]]);
        SetChatHistory(prev => [...prev, { user: userMessage, bot: botResponse }]);
        
        // Update session ID if provided
        if (data.session_id) {
          setSessionId(data.session_id);
          updateUrlWithSessionId(data.session_id);
        }
        
        SetTimeOfRequest(Date.now());
      } else {
        console.log('❌ Lỗi API:', response.status);
        const errorMessage = "Xin lỗi, có lỗi xảy ra khi xử lý yêu cầu của bạn. Vui lòng thử lại.";
        SetDataChat(prev => [...prev, ["bot", errorMessage]]);
      }
    } catch (error) {
      console.log('❌ Lỗi network:', error);
      const errorMessage = "Xin lỗi, có lỗi kết nối. Vui lòng kiểm tra kết nối internet và thử lại.";
      SetDataChat(prev => [...prev, ["bot", errorMessage]]);
    } finally {
      SetIsLoad(false);
      SetIsGen(false);
    }
  }

  const handleReferenceClick = (source, sourceType) => {
    console.log('🔗 Click vào nguồn tham khảo:', source, sourceType);
    // Có thể mở link trong tab mới hoặc hiển thị thông tin chi tiết
  };

  const handleCopyMessage = (messageIndex, messageText) => {
    navigator.clipboard.writeText(messageText).then(() => {
      console.log('📋 Đã sao chép tin nhắn');
      // Có thể hiển thị toast notification
    }).catch(err => {
      console.log('❌ Lỗi khi sao chép:', err);
    });
  };

  const handleThumbsUp = (messageIndex, messageText) => {
    const newFeedbackState = { ...feedbackState };
    if (newFeedbackState[messageIndex] === 'up') {
      delete newFeedbackState[messageIndex];
    } else {
      newFeedbackState[messageIndex] = 'up';
    }
    setFeedbackState(newFeedbackState);
    
    sendFeedbackToGoogleSheets(messageText, 'positive', messageIndex);
    console.log('👍 Đã đánh giá tích cực cho tin nhắn:', messageIndex);
  };

  const handleThumbsDown = (messageIndex, messageText) => {
    const newFeedbackState = { ...feedbackState };
    if (newFeedbackState[messageIndex] === 'down') {
      delete newFeedbackState[messageIndex];
    } else {
      newFeedbackState[messageIndex] = 'down';
    }
    setFeedbackState(newFeedbackState);
    
    sendFeedbackToGoogleSheets(messageText, 'negative', messageIndex);
    console.log('👎 Đã đánh giá tiêu cực cho tin nhắn:', messageIndex);
  };

  const sendFeedbackToGoogleSheets = async (messageText, feedbackType, messageIndex) => {
    try {
      const feedbackData = {
        message: messageText,
        feedback: feedbackType,
        message_index: messageIndex,
        timestamp: new Date().toISOString(),
        user_info: userInfo || tempUserInfo,
        session_id: sessionId
      };

      // Gửi feedback đến Google Sheets (nếu có endpoint)
      console.log('📊 Đang gửi feedback:', feedbackData);
      
      // Có thể implement gửi đến Google Sheets API ở đây
      
    } catch (error) {
      console.log('❌ Lỗi khi gửi feedback:', error);
    }
  };

  const handleReadAloud = async (messageText) => {
    try {
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(messageText);
        utterance.lang = 'vi-VN';
        utterance.rate = 0.9;
        utterance.pitch = 1;
        
        // Dừng phát âm hiện tại nếu có
        window.speechSynthesis.cancel();
        
        // Bắt đầu phát âm
        window.speechSynthesis.speak(utterance);
        
        console.log('🔊 Đang đọc to tin nhắn');
      } else {
        console.log('❌ Trình duyệt không hỗ trợ text-to-speech');
      }
    } catch (error) {
      console.log('❌ Lỗi khi đọc to:', error);
    }
  };

  const handleRetry = (messageIndex) => {
    // Tìm tin nhắn user trước đó để gửi lại
    const userMessage = dataChat[messageIndex - 1]?.[1];
    if (userMessage) {
      SetPromptInput(userMessage);
      setTimeout(() => SendMessageChat(), 100);
    }
  };

  const parseMarkdownToHTML = (text) => {
    if (!text) return '';
    // Nếu text là mảng hoặc object, chuyển thành string
    if (typeof text !== 'string') {
      try {
        text = Array.isArray(text) ? text.join(' ') : String(text);
      } catch {
        return '';
      }
    }
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code class="bg-gray-100 px-1 py-0.5 rounded text-sm">$1</code>')
      .replace(/\n/g, '<br>')
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" class="text-blue-600 hover:underline">$1</a>');
  };

  const parseMarkdownToJSX = (text) => {
    if (!text) return null;
    
    const parts = text.split(/(\*\*.*?\*\*|\*.*?\*|`.*?`|\[.*?\]\(.*?\))/g);
    
    return parts.map((part, index) => {
      if (part.match(/^\*\*.*\*\*$/)) {
        return <strong key={index}>{part.slice(2, -2)}</strong>;
      } else if (part.match(/^\*.*\*$/)) {
        return <em key={index}>{part.slice(1, -1)}</em>;
      } else if (part.match(/^`.*`$/)) {
        return <code key={index} className="bg-gray-100 px-1 py-0.5 rounded text-sm">{part.slice(1, -1)}</code>;
      } else if (part.match(/^\[.*?\]\(.*?\)$/)) {
        const match = part.match(/^\[(.*?)\]\((.*?)\)$/);
        return (
          <a key={index} href={match[2]} target="_blank" className="text-blue-600 hover:underline">
            {match[1]}
          </a>
        );
      } else {
        return part.split('\n').map((line, lineIndex) => (
          <span key={`${index}-${lineIndex}`}>
            {lineIndex > 0 && <br />}
            {line}
          </span>
        ));
      }
    });
  };

  const CustomTypingAnimation = ({ text, onComplete, speed = 50 }) => {
    const [displayedText, setDisplayedText] = useState('');
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
      if (currentIndex < text.length) {
        const timer = setTimeout(() => {
          setDisplayedText(prev => prev + text[currentIndex]);
          setCurrentIndex(prev => prev + 1);
        }, speed);

        return () => clearTimeout(timer);
      } else if (onComplete) {
        onComplete();
      }
    }, [currentIndex, text, speed, onComplete]);

    return (
      <div dangerouslySetInnerHTML={{ __html: parseMarkdownToHTML(displayedText) }} />
    );
  };

  // Toggle dark mode
  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
  };

  return (
    <div className={`flex h-full ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'w-[260px]' : 'w-16'} ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-r flex flex-col transition-all duration-300`}>
        {/* Sidebar Header */}
        <div className={`p-4`}>
          <div className="flex items-center justify-between">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className={`p-2 hover:${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'} rounded-lg transition-colors ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            {sidebarOpen && (
              <div className="flex items-center space-x-2">
                <button
                  onClick={toggleDarkMode}
                  className={`p-2 hover:${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'} rounded-lg transition-colors ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}
                  title={isDarkMode ? 'Chuyển sang Light mode' : 'Chuyển sang Dark mode'}
                >
                  <FontAwesomeIcon icon={isDarkMode ? faSun : faMoon} className="text-sm" />
                </button>
                <button className={`p-2 hover:${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'} rounded-lg transition-colors ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  <FontAwesomeIcon icon={faSearch} className="text-sm" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar Content */}
        {sidebarOpen && (
          <div className="flex-1 overflow-y-auto scrollbar-hide">
            {/* New Chat Button */}
            <div className="p-4">
              <button
                onClick={handleNewSession}
                className="w-full flex items-center space-x-3 p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <FontAwesomeIcon icon={faPlus} className="text-sm" />
                <span className="font-medium">Cuộc trò chuyện mới</span>
              </button>
            </div>

            {/* Recent Chats */}
            <div className="px-4">
              <h3 className={`text-sm font-medium mb-3 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Gần đây</h3>
              <div className="space-y-1">
                {conversationHistory.map((conv, index) => (
                  <button
                    key={index}
                    onClick={() => loadConversation(conv.session_id)}
                    className={`w-full text-left p-3 rounded-lg transition-colors ${
                      selectedSession === conv.session_id 
                        ? (isDarkMode ? 'bg-gray-700 text-white' : 'bg-blue-50 text-blue-700')
                        : (isDarkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100')
                    }`}
                  >
                    <div className="text-sm font-medium truncate">{conv.title || `Cuộc trò chuyện ${index + 1}`}</div>
                    <div className={`text-xs truncate ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>{conv.last_message || 'Không có tin nhắn'}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Sidebar Footer */}
        <div className={`p-4`}>
          {sidebarOpen && (
            <button className={`w-full p-3 flex items-center space-x-3 rounded-lg transition-colors ${
              isDarkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100'
            }`}>
              <FontAwesomeIcon icon={faCog} className="text-sm" />
              <span className="text-sm">Cài đặt</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className={`flex-1 flex flex-col ${isDarkMode ? 'bg-gray-900' : 'bg-white'}`}>
        {/* Chat Header - No border */}
        <div className={`px-6 py-4 ${isDarkMode ? 'border-gray-700' : 'border-gray-200'} border-b`}>
          <div className="flex items-center justify-between">
            <h1 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>HUMG Chatbot</h1>
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-medium">
                {userInfo?.userName?.charAt(0) || 'U'}
              </div>
            </div>
          </div>
        </div>

        {/* Messages Container - Centered */}
        <div className="flex-1 overflow-y-auto scrollbar-hide">
          <div className="max-w-4xl mx-auto">
            {dataChat.length <= 1 ? (
              // Welcome screen
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FontAwesomeIcon icon={faUser} className="text-white text-xl" />
                  </div>
                  <h2 className={`text-2xl font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    Xin chào {userInfo?.userName || 'bạn'}!
                  </h2>
                  <p className={`mb-6 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Tôi là trợ lý thông minh của HUMG. Hãy hỏi tôi bất cứ điều gì!</p>
                  
                  {/* Quick Questions with Action Buttons */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-2xl mx-auto">
                    {commonQuestions.map((question, index) => (
                      <div key={index} className={`p-4 rounded-lg border transition-colors ${
                        isDarkMode ? 'bg-gray-800 border-gray-600' : 'bg-gray-50 border-gray-200'
                      }`}>
                        <div className={`text-sm font-medium mb-3 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{question}</div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => {
                              SetPromptInput(question);
                              setTimeout(() => SendMessageChat(), 100);
                            }}
                            className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors"
                          >
                            Hỏi ngay
                          </button>
                          <button className="px-3 py-1 text-xs rounded transition-colors border hover:bg-gray-100">
                            Chi tiết
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              // Chat messages
              <div 
                ref={chatAreaRef}
                className="py-4 space-y-6"
                onScroll={handleScroll}
              >
                {dataChat.map((message, index) => (
                  <div key={index} className="flex">
                    {message[0] === "user" ? (
                      // User message - Bo 4 góc
                      <div className="flex-1 flex justify-end">
                        <div className="max-w-[80%] bg-blue-600 text-white rounded-2xl px-4 py-3">
                          <div className="text-sm">{message[1]}</div>
                        </div>
                      </div>
                    ) : (
                      // Bot message - Bo 4 góc
                      <div className="flex-1 flex justify-start">
                        <div className="flex space-x-3 max-w-[80%]">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1 ${
                            isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
                          }`}>
                            <img src={robot_img} alt="Bot" className="w-6 h-6 rounded-full" />
                          </div>
                          <div className={`rounded-2xl px-4 py-3 border ${
                            isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'
                          }`}>
                            <div className={`text-sm whitespace-pre-wrap ${
                              isDarkMode ? 'text-gray-100' : 'text-gray-900'
                            }`}>
                              {isGen && index === dataChat.length - 1 ? (
                                <CustomTypingAnimation
                                  text={message[1]}
                                  onComplete={() => {
                                    SetIsGen(false);
                                    scrollToEnd();
                                  }}
                                />
                              ) : (
                                <div dangerouslySetInnerHTML={{ __html: parseMarkdownToHTML(message[1]) }} />
                              )}
                            </div>
                            
                            {/* Message Actions */}
                            <div className={`flex items-center space-x-2 mt-3 pt-2 border-t ${
                              isDarkMode ? 'border-gray-700' : 'border-gray-200'
                            }`}>
                              <button
                                onClick={() => handleCopyMessage(index, message[1])}
                                className={`p-1 transition-colors ${
                                  isDarkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-400 hover:text-gray-600'
                                }`}
                                title="Sao chép"
                              >
                                <FontAwesomeIcon icon={faCopy} className="text-xs" />
                              </button>
                              <button
                                onClick={() => handleThumbsUp(index, message[1])}
                                className={`p-1 transition-colors ${
                                  feedbackState[index] === 'up' 
                                    ? 'text-green-600' 
                                    : (isDarkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-400 hover:text-gray-600')
                                }`}
                                title="Hữu ích"
                              >
                                <FontAwesomeIcon icon={faThumbsUp} className="text-xs" />
                              </button>
                              <button
                                onClick={() => handleThumbsDown(index, message[1])}
                                className={`p-1 transition-colors ${
                                  feedbackState[index] === 'down' 
                                    ? 'text-red-600' 
                                    : (isDarkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-400 hover:text-gray-600')
                                }`}
                                title="Không hữu ích"
                              >
                                <FontAwesomeIcon icon={faThumbsDown} className="text-xs" />
                              </button>
                              <button
                                onClick={() => handleReadAloud(message[1])}
                                className={`p-1 transition-colors ${
                                  isDarkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-400 hover:text-gray-600'
                                }`}
                                title="Đọc to"
                              >
                                <FontAwesomeIcon icon={faVolumeHigh} className="text-xs" />
                              </button>
                              <button
                                onClick={() => handleRetry(index)}
                                className={`p-1 transition-colors ${
                                  isDarkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-400 hover:text-gray-600'
                                }`}
                                title="Thử lại"
                              >
                                <FontAwesomeIcon icon={faRotateRight} className="text-xs" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                
                {isLoading && (
                  <div className="flex">
                    <div className="flex space-x-3 max-w-[80%]">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1 ${
                        isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
                      }`}>
                        <img src={robot_img} alt="Bot" className="w-6 h-6 rounded-full" />
                      </div>
                      <div className={`rounded-2xl px-4 py-3 border ${
                        isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'
                      }`}>
                        <ScaleLoader color="#3B82F6" height={20} width={3} />
                      </div>
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>
        </div>

        {/* Scroll to bottom button */}
        {showScrollButton && (
          <div className="absolute bottom-20 right-6">
            <button
              onClick={ScrollToEndChat}
              className={`p-3 rounded-full shadow-lg border transition-shadow ${
                isDarkMode ? 'bg-gray-800 border-gray-700 hover:bg-gray-700' : 'bg-white border-gray-200 hover:shadow-xl'
              }`}
            >
              <svg className={`w-5 h-5 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            </button>
          </div>
        )}

        {/* Input Section - Floating style */}
        <div className="p-6">
          <div className="max-w-4xl mx-auto">
            {/* Source Selection - Subtle */}
            <div className="mb-3 flex items-center space-x-2">
              <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Nguồn:</span>
              <select
                value={sourceData}
                onChange={(e) => SetSourceData(e.target.value)}
                className={`text-xs rounded px-2 py-1 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 ${
                  isDarkMode 
                    ? 'bg-gray-800 border-gray-600 text-gray-300' 
                    : 'bg-white border-gray-300 text-gray-700'
                }`}
              >
                <option value="nttu">HUMG</option>
                <option value="moet">Bộ GD&ĐT</option>
                <option value="tuyensinh">Tuyển sinh</option>
              </select>
            </div>

            {/* Input Form - Floating style */}
            <div className={`rounded-2xl p-4 shadow-lg border ${
              isDarkMode ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-200'
            }`}>
              {/* Main Input Area */}
              <div className="mb-3">
                <textarea
                  value={promptInput}
                  onChange={onChangeHandler}
                  onKeyDown={handleKeyDown}
                  placeholder="Hỏi HUMG Chatbot..."
                  className={`w-full resize-none border-none outline-none text-sm ${
                    isDarkMode ? 'bg-transparent text-white placeholder-gray-400' : 'bg-transparent text-gray-900 placeholder-gray-500'
                  }`}
                  rows="1"
                  style={{ minHeight: '24px', maxHeight: '120px' }}
                />
              </div>
              
              {/* Action Buttons Below */}
              <div className={`flex items-center justify-between pt-3 border-t ${
                isDarkMode ? 'border-gray-700' : 'border-gray-200'
              }`}>
                <div className="flex items-center space-x-4">
                  <button className={`flex items-center space-x-2 transition-colors ${
                    isDarkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-400 hover:text-gray-600'
                  }`}>
                    <FontAwesomeIcon icon={faPlus} className="text-sm" />
                    <span className="text-xs">Thêm</span>
                  </button>
                  <button className={`flex items-center space-x-2 transition-colors ${
                    isDarkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-400 hover:text-gray-600'
                  }`}>
                    <FontAwesomeIcon icon={faMagnifyingGlass} className="text-sm" />
                    <span className="text-xs">Tìm kiếm</span>
                  </button>
                  <button className={`flex items-center space-x-2 transition-colors ${
                    isDarkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-400 hover:text-gray-600'
                  }`}>
                    <FontAwesomeIcon icon={faImage} className="text-sm" />
                    <span className="text-xs">Hình ảnh</span>
                  </button>
                </div>
                
                <div className="flex items-center space-x-2">
                  <button className={`p-2 transition-colors ${
                    isDarkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-400 hover:text-gray-600'
                  }`}>
                    <FontAwesomeIcon icon={faMicrophone} className="text-sm" />
                  </button>
                  {/* Bỏ icon gửi như yêu cầu */}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* User Info Popup */}
      {showUserInfoPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`rounded-lg p-6 max-w-md w-full mx-4 border ${
            isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
          }`}>
            <h3 className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Thông tin người dùng</h3>
            <div className="space-y-3">
              <input
                type="text"
                placeholder="MSSV"
                value={tempUserInfo.mssv}
                onChange={(e) => setTempUserInfo({...tempUserInfo, mssv: e.target.value})}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  isDarkMode 
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                }`}
              />
              <input
                type="text"
                placeholder="Tên người dùng"
                value={tempUserInfo.userName}
                onChange={(e) => setTempUserInfo({...tempUserInfo, userName: e.target.value})}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  isDarkMode 
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                }`}
              />
              <button
                onClick={handleUserInfoSubmit}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ChatBot;
