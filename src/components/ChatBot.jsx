// import avatar from "../assets/avatar.jpg";
import robot_img from "../assets/robot_image.webp";
import { useState, useRef, useEffect, useCallback } from "react";
import ScaleLoader from "react-spinners/ScaleLoader";
import { TypeAnimation } from "react-type-animation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMessage, faCopy, faThumbsUp, faThumbsDown } from "@fortawesome/free-regular-svg-icons";
import { faVolumeHigh, faRotateRight, faTrash, faUser } from "@fortawesome/free-solid-svg-icons";
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
  // Fallback to sessionStorage
  try {
    return sessionStorage.getItem(key);
  } catch (error) {
    // Fallback to memory storage
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
  
  // Fallback to sessionStorage
  try {
    sessionStorage.setItem(key, value);
    return true;
  } catch (error) {
    // Fallback to memory storage
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
    // Remove from memory storage
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

// New API endpoints
const API_BASE_URL = "http://34.87.17.241:9999";
const CHATBOT_ENDPOINT = `${API_BASE_URL}/chatbot_proactive`;
const GET_CONV_TITLE_ENDPOINT = `${API_BASE_URL}/get_conv_title`;
const GET_CHAT_CONV_ENDPOINT = `${API_BASE_URL}/get_chat_conv`;

// Utility function to generate session ID
const generateSessionId = () => {
  return 'session-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
};

// Removed GoogleGenerativeAI SDK - using direct API calls
function ChatBot(props) {
  const messagesEndRef = useRef(null);
  const [timeOfRequest, SetTimeOfRequest] = useState(0);
  let [promptInput, SetPromptInput] = useState("");
  let [sourceData, SetSourceData] = useState("nttu");
  
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
    const threshold = 50; // Giảm threshold xuống 50px để nhạy hơn
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
    
    // Chỉ update state nếu có thay đổi để tránh re-render không cần thiết
    setIsUserScrolledUp(prev => prev !== userScrolledUp ? userScrolledUp : prev);
    setShowScrollButton(prev => prev !== userScrolledUp ? userScrolledUp : prev);
  }, []);

  // Auto scroll chỉ khi cần thiết
  useEffect(() => {
    // Chỉ auto scroll khi:
    // 1. User không scroll lên trên
    // 2. Có tin nhắn mới hoặc đang loading
    if (!isUserScrolledUp) {
      // Delay nhỏ để đảm bảo DOM đã update
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
          scrollToEnd(false); // Scroll không smooth để mượt hơn
        }
      }, 200); // Giảm frequency xuống 200ms
    }
    
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [isGen, isUserScrolledUp]);

  // Handle input change
  const onChangeHandler = (event) => {
    SetPromptInput(event.target.value);
  };

  // Handle Enter key press
  const handleKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      SendMessageChat();
    }
  };

  // Hàm xóa lịch sử chat hiện tại
  const clearChatHistory = () => {
    if (window.confirm('Bạn có chắc chắn muốn xóa cuộc trò chuyện hiện tại và bắt đầu cuộc trò chuyện mới?')) {
      // Start a new session
      const newSessionId = generateSessionId();
      setSessionId(newSessionId);
      
      // Update URL with new session ID
      updateUrlWithSessionId(newSessionId);
      
      // Clear current chat data
      SetDataChat([["start", ["Xin chào! Đây là HUMG Chatbot, trợ lý đắc lực dành cho bạn! Bạn muốn tìm kiếm thông tin về những gì? 😄", null]]]);
      SetChatHistory([]);
      setFeedbackState({});
      
      console.log('✅ Đã bắt đầu cuộc trò chuyện mới với session:', newSessionId);
    }
  };

  // Kiểm tra storage status khi component mount
  useEffect(() => {
    console.log('🔍 Kiểm tra storage availability...');
    console.log('Domain hiện tại:', window.location.hostname);
    console.log('Protocol:', window.location.protocol);
    
    if (isLocalStorageAvailable()) {
      console.log('✅ localStorage khả dụng');
      setStorageStatus('available');
    } else {
      console.log('⚠️ localStorage không khả dụng, thử sessionStorage...');
      try {
        sessionStorage.setItem('test', 'test');
        sessionStorage.removeItem('test');
        console.log('✅ sessionStorage khả dụng');
        setStorageStatus('limited');
      } catch (error) {
        console.log('❌ Không có storage nào khả dụng:', error);
        setStorageStatus('unavailable');
      }
    }
  }, []);

  // Function to handle user info submission
  const handleUserInfoSubmit = () => {
    if (!tempUserInfo.mssv.trim() || !tempUserInfo.userName.trim()) {
      alert('Vui lòng điền đầy đủ thông tin!');
      return;
    }
    
    setUserInfo(tempUserInfo);
    setShowUserInfoPopup(false);
    console.log('✅ Thông tin người dùng đã được lưu:', tempUserInfo);
    
    // Check if there's a sessionId in URL to load after login
    const urlSessionId = getSessionIdFromUrl();
    if (urlSessionId) {
      console.log('🔗 Phát hiện sessionId trong URL sau khi đăng nhập:', urlSessionId);
      // Use setTimeout to ensure userInfo state is updated first
      setTimeout(() => {
        loadConversation(urlSessionId);
      }, 100);
    }
  };

  // Function to reset user info and start new session
  const handleNewSession = () => {
    setUserInfo(null);
    const newSessionId = generateSessionId();
    setSessionId(newSessionId);
    setShowUserInfoPopup(true);
    
    // Clear URL parameters when logging out
    updateUrlWithSessionId(null);
    
    SetDataChat([["start", ["Xin chào! Đây là HUMG Chatbot, trợ lý đắc lực dành cho bạn! Bạn muốn tìm kiếm thông tin về những gì? 😄", null]]]);
    SetChatHistory([]);
    setFeedbackState({});
    setConversationHistory([]); // Clear conversation history
    setTempUserInfo({
      mssv: '',
      userName: '',
      nameBot: 'DieuLinh'
    });
  };

  // Function to fetch conversation history from API
  const fetchConversationHistory = async () => {
    if (!userInfo?.mssv) return;
    
    setIsLoadingConversations(true);
    try {
      console.log('🔄 Đang tải lịch sử cuộc trò chuyện...');
      
      const formData = new FormData();
      formData.append('mssv', userInfo.mssv);

      const response = await fetch(GET_CONV_TITLE_ENDPOINT, {
        method: 'POST',
        body: formData
      });

      const result = await response.json();
      
      if (result.status_code === 200 && result.data?.data) {
        setConversationHistory(result.data.data);
        console.log('✅ Đã tải lịch sử cuộc trò chuyện:', result.data.data.length, 'cuộc trò chuyện');
      } else {
        console.warn('⚠️ Không thể tải lịch sử cuộc trò chuyện:', result.message);
        setConversationHistory([]);
      }
    } catch (error) {
      console.error('❌ Lỗi khi tải lịch sử cuộc trò chuyện:', error);
      setConversationHistory([]);
    } finally {
      setIsLoadingConversations(false);
    }
  };

  // Utility functions for URL management
  const updateUrlWithSessionId = (sessionIdParam) => {
    const url = new URL(window.location);
    if (sessionIdParam) {
      url.searchParams.set('sessionId', sessionIdParam);
    } else {
      url.searchParams.delete('sessionId');
    }
    window.history.pushState({}, '', url);
  };

  const getSessionIdFromUrl = () => {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('sessionId');
  };

  // Function to fetch chat conversation messages from API
  const fetchChatConversation = async (sessionIdToLoad) => {
    if (!userInfo?.mssv || !sessionIdToLoad) return false;
    
    setIsLoadingChatHistory(true);
    try {
      console.log('🔄 Đang tải tin nhắn cuộc trò chuyện:', sessionIdToLoad);
      
      const formData = new FormData();
      formData.append('mssv', userInfo.mssv);
      formData.append('sessionId', sessionIdToLoad);

      const response = await fetch(GET_CHAT_CONV_ENDPOINT, {
        method: 'POST',
        body: formData
      });

      const result = await response.json();
      
      if (response.ok && result.data && Array.isArray(result.data)) {
        // Convert API response to dataChat format
        const convertedMessages = [["start", ["Xin chào! Đây là HUMG Chatbot, trợ lý đắc lực dành cho bạn! 😄", null]]];
        
        result.data.forEach((message) => {
          if (message.human) {
            convertedMessages.push(["end", [message.human]]);
          }
          if (message.ai) {
            convertedMessages.push(["start", [message.ai, null]]);
          }
        });
        
        SetDataChat(convertedMessages);
        
        // Create chat history from human messages
        const humanMessages = result.data
          .map(msg => msg.human)
          .filter(msg => msg)
          .reverse(); // Reverse to show newest first
        SetChatHistory(humanMessages);
        
        console.log('✅ Đã tải tin nhắn cuộc trò chuyện:', result.data.length, 'cặp tin nhắn');
        return true;
      } else {
        console.warn('⚠️ Không thể tải tin nhắn cuộc trò chuyện:', result.message || 'Unknown error');
        return false;
      }
    } catch (error) {
      console.error('❌ Lỗi khi tải tin nhắn cuộc trò chuyện:', error);
      return false;
    } finally {
      setIsLoadingChatHistory(false);
    }
  };

  // Function to load a specific conversation
  const loadConversation = async (sessionIdToLoad) => {
    if (sessionIdToLoad === sessionId && !getSessionIdFromUrl()) {
      // Already viewing this conversation and URL is current
      return;
    }
    
    console.log('📖 Đang tải cuộc trò chuyện:', sessionIdToLoad);
    
    // Update URL with session ID
    updateUrlWithSessionId(sessionIdToLoad);
    
    // Update session ID immediately
    setSessionId(sessionIdToLoad);
    
    // Clear feedback state for new conversation
    setFeedbackState({});
    
    // Try to fetch conversation messages
    const success = await fetchChatConversation(sessionIdToLoad);
    
    if (!success) {
      // If failed to load, show default message
      SetDataChat([["start", ["Đã chuyển sang cuộc trò chuyện khác. Bạn có thể tiếp tục chat tại đây!", null]]]);
      SetChatHistory([]);
    }
  };

  // Load conversation history when user info changes
  useEffect(() => {
    if (userInfo?.mssv) {
      fetchConversationHistory();
    } else {
      setConversationHistory([]);
    }
  }, [userInfo]);

  // Also load conversation history on component mount (F5 refresh)
  useEffect(() => {
    // This will run when component mounts
    if (userInfo?.mssv) {
      console.log('🔄 Tải lịch sử cuộc trò chuyện khi khởi động component...');
      fetchConversationHistory();
      
      // Check if there's a sessionId in URL and load that conversation
      const urlSessionId = getSessionIdFromUrl();
      if (urlSessionId && urlSessionId !== sessionId) {
        console.log('🔗 Phát hiện sessionId trong URL, đang tải cuộc trò chuyện:', urlSessionId);
        loadConversation(urlSessionId);
      }
    }
  }, []); // Empty dependency array means this runs only once on mount

  // Load conversation from URL when userInfo becomes available
  useEffect(() => {
    if (userInfo?.mssv) {
      const urlSessionId = getSessionIdFromUrl();
      if (urlSessionId && urlSessionId !== sessionId) {
        console.log('👤 User đã đăng nhập, đang tải cuộc trò chuyện từ URL:', urlSessionId);
        loadConversation(urlSessionId);
      }
    }
  }, [userInfo]); // Run when userInfo changes

  // Updated SendMessageChat function for new API
  async function SendMessageChat() {
    if (promptInput !== "" && isLoading === false && userInfo) {
        SetTimeOfRequest(0);
        SetIsGen(true);
        const currentMessage = promptInput;
        const isFirstMessageInSession = dataChat.length === 1; // Only welcome message exists
        SetPromptInput("");
        SetIsLoad(true);
        
        // Ensure URL is updated with current sessionId
        updateUrlWithSessionId(sessionId);
        
        // Reset scroll state khi gửi tin nhắn mới
        setIsUserScrolledUp(false);
        setShowScrollButton(false);
        
        SetDataChat((prev) => [...prev, ["end", [currentMessage]]]);
        SetChatHistory((prev) => [currentMessage, ...prev]);
        
        // Force scroll to bottom khi user gửi tin nhắn
        setTimeout(() => {
          scrollToEnd();
        }, 50);

        try {
          const formData = new FormData();
          formData.append('idRequest', sessionId);
          formData.append('nameBot', userInfo.nameBot);
          formData.append('mssv', userInfo.mssv);
          formData.append('userName', userInfo.userName);
          formData.append('inputText', currentMessage);

          const response = await fetch(CHATBOT_ENDPOINT, {
            method: 'POST',
            body: formData
          });

          const result = await response.json();
          
          if (result.status === 200) {
            SetDataChat((prev) => [
              ...prev,
              ["start", [result.content, null]], // Using content instead of answer
            ]);
            
            // Handle suggested terms if available
            if (result.terms && result.terms.length > 0) {
              // You can add logic here to handle suggested terms/buttons
              console.log('Suggested terms:', result.terms);
            }

            // Refresh conversation history if this was the first message in a new session
            if (isFirstMessageInSession) {
              console.log('🔄 Làm mới lịch sử cuộc trò chuyện sau tin nhắn đầu tiên...');
              setTimeout(() => {
                fetchConversationHistory();
              }, 1000); // Small delay to ensure the conversation is saved on server
            }
          } else {
            throw new Error(result.message || 'API Error');
          }
          
          SetIsLoad(false);
        } catch (error) {
          console.error('Chat API Error:', error);
          SetDataChat((prev) => [
            ...prev,
            ["start", ["Ôi không! 😵‍💫 Chatbot đang bị lạc đường và không thể kết nối tới máy chủ rồi... Có lẽ server đang bận uống cà phê ☕ hoặc đang nghỉ giải lao 😅. Bạn vui lòng liên hệ hotline 📞 để tụi mình hỗ trợ nhanh nhất nhé! Cảm ơn bạn đã kiên nhẫn với tụi mình! 💖", null]],
          ]);
          SetIsLoad(false);
        }
    } else if (!userInfo) {
      setShowUserInfoPopup(true);
    }
  }

  // Initialize reference state
  const [reference, setReference] = useState({
    content: '',
    url: '',
    title: ''
  });

  // Handle reference click
  const handleReferenceClick = (source, sourceType) => {
    setReference({
      content: source.page_content || source.content || 'Không có nội dung',
      url: source.metadata?.source || source.url || '#',
      title: sourceType === "wiki" ? source.metadata?.title : "Tài liệu tham khảo"
    });
  };

  // Handle copy message
  const handleCopyMessage = (messageIndex, messageText) => {
    navigator.clipboard.writeText(messageText).then(() => {
      console.log('✅ Đã sao chép tin nhắn');
      // Show toast notification
      const toast = document.createElement('div');
      toast.className = 'toast toast-top toast-center';
      toast.innerHTML = `
        <div class="alert alert-success">
          <span>📋 Đã sao chép tin nhắn!</span>
        </div>
      `;
      document.body.appendChild(toast);
      setTimeout(() => {
        if (document.body.contains(toast)) {
          document.body.removeChild(toast);
        }
      }, 3000);
    }).catch(err => {
      console.error('❌ Lỗi sao chép:', err);
    });
  };

  // Handle thumbs up feedback
  const handleThumbsUp = (messageIndex, messageText) => {
    // Kiểm tra xem đã feedback chưa
    if (feedbackState[messageIndex]?.hasSubmitted) {
      return; // Đã feedback rồi, không cho phép thay đổi
    }

    setFeedbackState(prev => ({
      ...prev,
      [messageIndex]: { 
        thumbsUp: true, 
        thumbsDown: false, 
        hasSubmitted: true,
        messageText: messageText
      }
    }));
    
    // Gửi feedback lên Google Sheets (if still needed)
    sendFeedbackToGoogleSheets(messageText, "positive", messageIndex);
  };

  // Handle thumbs down feedback
  const handleThumbsDown = (messageIndex, messageText) => {
    // Kiểm tra xem đã feedback chưa
    if (feedbackState[messageIndex]?.hasSubmitted) {
      return; // Đã feedback rồi, không cho phép thay đổi
    }

    setFeedbackState(prev => ({
      ...prev,
      [messageIndex]: { 
        thumbsUp: false, 
        thumbsDown: true, 
        hasSubmitted: true,
        messageText: messageText
      }
    }));
    
    // Gửi feedback lên Google Sheets
    sendFeedbackToGoogleSheets(messageText, "negative", messageIndex);
  };

  // Hàm gửi feedback lên Google Sheets
  const sendFeedbackToGoogleSheets = async (messageText, feedbackType, messageIndex) => {
    const feedbackData = {
      timestamp: new Date().toISOString(),
      messageText: messageText,
      feedbackType: feedbackType, // "positive" hoặc "negative"
      messageIndex: messageIndex,
      userAgent: navigator.userAgent,
      url: window.location.href,
      userInfo: userInfo?.userName || 'Anonymous'
    };

    const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyzftIhc4A6GLa9Lg7GLTguxluzvNTzfffHEuS1IPSeA5W6cbbXlJ-25H-1y_8gShTE/exec";
    
    console.log("🚀 Đang gửi feedback...", { feedbackType, messageIndex });

    try {
      const response = await fetch(GOOGLE_SCRIPT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(feedbackData)
      });
      
      if (response.ok) {
        console.log("✅ Feedback đã được gửi!");
      }
    } catch (error) {
      console.log("⚠️ Lỗi gửi feedback:", error);
      // Store in localStorage as backup
      try {
        const existingFeedback = JSON.parse(localStorage.getItem('chatbot_feedback') || '[]');
        existingFeedback.push(feedbackData);
        localStorage.setItem('chatbot_feedback', JSON.stringify(existingFeedback));
        console.log("💾 Feedback saved to localStorage for manual export");
      } catch (e) {
        console.error("Không thể save vào localStorage:", e);
      }
    }
  };

  // Handle text-to-speech
  const handleReadAloud = async (messageText) => {
    try {
      // Hiển thị loading state
      const loadingToast = document.createElement('div');
      loadingToast.className = 'toast toast-top toast-center';
      loadingToast.innerHTML = `
        <div class="alert alert-info flex flex-row items-center gap-2">
          <span>🔊 Mình đang đọc nha ạ</span>
        </div>
      `;
      document.body.appendChild(loadingToast);

      console.log("🔊 Calling TTS API via ngrok...");

      // Call TTS API
      const ttsResponse = await fetch('https://aware-mutt-upward.ngrok-free.app/tts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': '69420'
        },
        body: JSON.stringify({
          text: messageText,
          voice_name: "Kore",
          return_type: "stream"
        })
      });

      console.log("📡 TTS API Response status:", ttsResponse.status);

      if (!ttsResponse.ok) {
        throw new Error(`TTS API error: ${ttsResponse.status}`);
      }

      // Remove loading toast
      if (document.body.contains(loadingToast)) {
        document.body.removeChild(loadingToast);
      }

      // Get audio blob from response
      const audioBlob = await ttsResponse.blob();
      console.log("🎵 Audio blob size:", audioBlob.size);

      if (audioBlob.size === 0) {
        throw new Error("Received empty audio data");
      }

      // Create audio URL and play
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      
      audio.onended = () => {
        URL.revokeObjectURL(audioUrl);
        console.log("✅ Audio playback completed");
      };
      
      audio.onerror = (error) => {
        console.error("❌ Audio playback error:", error);
        URL.revokeObjectURL(audioUrl);
      };
      
      await audio.play();
      console.log("🎵 Audio playing...");

    } catch (error) {
      console.error("❌ TTS Error:", error);
      
      // Remove loading toast if still there
      const loadingToast = document.querySelector('.toast');
      if (loadingToast) {
        document.body.removeChild(loadingToast);
      }

      // Fallback to browser TTS
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(messageText);
        utterance.lang = 'vi-VN';
        utterance.rate = 0.8;
        speechSynthesis.speak(utterance);
      } else {
        // Show error toast
        const errorToast = document.createElement('div');
        errorToast.className = 'toast toast-top toast-center';
        errorToast.innerHTML = `
          <div class="alert alert-error">
            <span>❌ Không thể phát âm thanh</span>
          </div>
        `;
        document.body.appendChild(errorToast);
        setTimeout(() => {
          if (document.body.contains(errorToast)) {
            document.body.removeChild(errorToast);
          }
        }, 6000);
      }
    }
  };

  // Handle retry message
  const handleRetry = (messageIndex) => {
    // Lấy lại câu hỏi từ lịch sử và gửi lại
    if (chatHistory.length > 0) {
      const lastQuestion = chatHistory[0]; // Câu hỏi gần nhất
      SetPromptInput(lastQuestion);
    }
    console.log("Thử lại tin nhắn", messageIndex);
  };

  // Function to parse markdown-style text and convert to HTML string
  const parseMarkdownToHTML = (text) => {
    if (typeof text !== 'string') return text;
    
    let html = text;
    
    // Parse ### text: format (bold + italic)
    html = html.replace(/###\s*([^:\n]+):/g, '<strong style="font-weight: bold; font-style: italic; color: #7c3aed;">$1:</strong>');
    
    // Parse **text** format (bold)
    html = html.replace(/\*\*([^*]+)\*\*/g, '<strong style="font-weight: bold; color: #1d4ed8;">$1</strong>');
    
    return html;
  };

  // Function to parse markdown-style text and convert to JSX (for completed messages)
  const parseMarkdownToJSX = (text) => {
    if (typeof text !== 'string') return text;
    
    // First handle ### format
    let parts = text.split(/(###\s*[^:\n]+:)/g);
    let result = [];
    
    parts.forEach((part, index) => {
      if (/###\s*[^:\n]+:/.test(part)) {
        // Extract text between ### and :
        const match = part.match(/###\s*([^:\n]+):/);
        if (match) {
          result.push(
            <strong key={`header-${index}`} className="font-bold italic text-purple-700">
              {match[1]}:
            </strong>
          );
        }
      } else {
        // Handle **text** in remaining parts
        const boldParts = part.split(/(\*\*[^*]+\*\*)/g);
        boldParts.forEach((boldPart, boldIndex) => {
          if (boldPart.startsWith('**') && boldPart.endsWith('**') && boldPart.length > 4) {
            const boldText = boldPart.slice(2, -2);
            result.push(
              <strong key={`bold-${index}-${boldIndex}`} className="font-bold text-blue-700">
                {boldText}
              </strong>
            );
          } else if (boldPart) {
            result.push(boldPart);
          }
        });
      }
    });
    
    return result;
  };

  // Custom typing component that supports HTML formatting
  const CustomTypingAnimation = ({ text, onComplete, speed = 50 }) => {
    const [displayedText, setDisplayedText] = useState('');
    const [currentIndex, setCurrentIndex] = useState(0);
    
    // Reset when text changes (new message)
    useEffect(() => {
      setDisplayedText('');
      setCurrentIndex(0);
    }, [text]);
    
    useEffect(() => {
      if (currentIndex < text.length) {
        const timer = setTimeout(() => {
          setDisplayedText(text.slice(0, currentIndex + 1));
          setCurrentIndex(currentIndex + 1);
        }, speed);
        
        return () => clearTimeout(timer);
      } else if (currentIndex > 0 && onComplete) {
        // Only call onComplete if we actually typed something
        onComplete();
      }
    }, [currentIndex, text, speed, onComplete]);
    
    // Convert current displayed text to HTML
    const htmlContent = parseMarkdownToHTML(displayedText);
    
    return (
      <div 
        style={{ whiteSpace: "pre-line" }}
        dangerouslySetInnerHTML={{ __html: htmlContent }}
      />
    );
  };

  return (
    <div className="bg-gradient-to-r from-blue-50 to-purple-100 h-[85vh] overflow-hidden">
      
      {/* User Info Popup */}
      {showUserInfoPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4">
            <h2 className="text-xl font-bold mb-4 text-center">
              🎓 Thông tin người dùng
            </h2>
            <p className="text-sm text-gray-600 mb-4 text-center">
              Vui lòng điền thông tin để bắt đầu trò chuyện với HUMG Chatbot
            </p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Số điện thoại hoặc Mã sinh viên *
                </label>
                <input
                  type="text"
                  placeholder="VD: 0123456789 hoặc SV001"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={tempUserInfo.mssv}
                  onChange={(e) => setTempUserInfo({...tempUserInfo, mssv: e.target.value})}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">
                  Họ và tên *
                </label>
                <input
                  type="text"
                  placeholder="VD: Nguyễn Văn A"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={tempUserInfo.userName}
                  onChange={(e) => setTempUserInfo({...tempUserInfo, userName: e.target.value})}
                />
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={handleUserInfoSubmit}
                className="flex-1 bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors"
              >
                Bắt đầu trò chuyện
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Layout with 3 columns: Left Sidebar, Chat Area, Right Sidebar */}
      <div className="h-full grid grid-cols-1 lg:grid-cols-12 gap-3 p-3 mt-4">
        
        <div className="hidden lg:block lg:col-span-2">
          <div className="bg-gray-50 text-base-content rounded-2xl p-4 h-[calc(100vh-10rem)] overflow-auto sticky top-20">
            <div className="flex justify-between items-center mb-2">
              <h2 className="font-bold text-sm">
                📝 Lịch sử trò chuyện
              </h2>
              <div className="flex gap-1">
                {userInfo && (
                  <button
                    onClick={fetchConversationHistory}
                    disabled={isLoadingConversations}
                    className="btn btn-ghost btn-xs text-blue-500 hover:bg-blue-100 tooltip"
                    data-tip="Làm mới lịch sử"
                  >
                    <FontAwesomeIcon 
                      icon={faRotateRight} 
                      className={`w-3 h-3 ${isLoadingConversations ? 'animate-spin' : ''}`} 
                    />
                  </button>
                )}
                {conversationHistory.length > 0 && (
                  <button
                    onClick={clearChatHistory}
                    className="btn btn-ghost btn-xs text-red-500 hover:bg-red-100 tooltip"
                    data-tip="Bắt đầu cuộc trò chuyện mới"
                  >
                    <FontAwesomeIcon icon={faTrash} className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>

            {!userInfo ? (
              <div className="text-center text-gray-500 text-xs py-4">
                <p>Vui lòng đăng nhập để xem lịch sử trò chuyện</p>
              </div>
            ) : isLoadingConversations ? (
              <div className="text-center text-gray-500 text-xs py-4">
                <ScaleLoader
                  color="#6b7280"
                  loading={true}
                  height={8}
                  width={2}
                  aria-label="Loading Conversations"
                />
                <p className="mt-2">Đang tải...</p>
              </div>
            ) : conversationHistory.length > 0 ? (
              <ul className="menu text-sm p-0">
                {conversationHistory.map((conversation, i) => (
                  <li
                    key={conversation.session_id}
                    className="max-h-12 py-1"
                    onClick={() => loadConversation(conversation.session_id)}
                  >
                    <a
                      className={`text-[14px] hover:bg-gray-200 font-medium rounded-md cursor-pointer transition-colors ${
                        conversation.session_id === sessionId 
                          ? 'bg-blue-100 text-blue-700' 
                          : ''
                      }`}
                      title={conversation.title}
                    >
                      <div className="flex items-center gap-2 w-full">
                        <FontAwesomeIcon icon={faMessage} className="w-3 h-3 flex-shrink-0" />
                        <span className="truncate">
                          {conversation.title.length > 25 
                            ? conversation.title.substring(0, 25) + "..." 
                            : conversation.title}
                        </span>
                      </div>
                    </a>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-center text-gray-500 text-xs py-4">
                <p>Chưa có cuộc trò chuyện nào</p>
                <p className="mt-1">Hãy bắt đầu chat để tạo lịch sử!</p>
              </div>
            )}

            {/* Fallback: Recent questions from current session */}
            {userInfo && chatHistory.length > 0 && (
              <>
                <div className="divider my-2"></div>
                <div className="mb-2">
                  <h3 className="font-bold text-xs text-gray-600">
                    💭 Câu hỏi gần đây
                  </h3>
                </div>
                <ul className="menu text-sm p-0">
                  {chatHistory.slice(0, 3).map((question, i) => (
                    <li
                      key={`recent-${i}`}
                      className="max-h-12 py-1"
                      onClick={() => {
                        if (promptInput === "" && !isLoading) {
                          SetPromptInput(question);
                        }
                      }}
                    >
                      <a
                        className={
                          "text-[12px] hover:bg-gray-200 font-medium rounded-md opacity-70 " +
                          (promptInput === "" && !isLoading
                            ? "cursor-pointer"
                            : "cursor-not-allowed opacity-50")
                        }
                        title={question}
                      >
                        {question.length > 20 ? question.substring(0, 20) + "..." : question}
                      </a>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        </div>

        {/* Main Chat Area */}
        <div className="col-span-1 lg:col-span-8">
          <div className="relative border-2 border-blue-300 bg-gradient-to-r from-red-50 to-sky-50 drop-shadow-2xl h-[calc(100vh-10rem)] rounded-3xl p-3 max-w-full overflow-hidden">
            
            {/* Header with user info and controls */}
            <div className="flex justify-between items-center mb-3 p-2 bg-white rounded-2xl shadow-md">
              <div className="flex items-center gap-3">
                <div className="avatar">
                  <div className="w-8 rounded-full border-2 border-blue-500">
                    <img src={robot_img} alt="Bot Avatar" />
                  </div>
                </div>
                <div>
                  <h1 className="font-bold text-lg">HUMG Chatbot</h1>
                  {userInfo && (
                    <div className="text-sm text-gray-600">
                      Xin chào, {userInfo.userName}!
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex gap-2">
                {userInfo && (
                  <button
                    onClick={handleNewSession}
                    className="btn btn-ghost btn-sm tooltip"
                    data-tip="Đăng xuất / Phiên mới"
                  >
                    <FontAwesomeIcon icon={faUser} />
                  </button>
                )}
              </div>
            </div>

            {/* Reference Modal */}
            <input type="checkbox" id="my_modal_6" className="modal-toggle" />
            <div className="modal" role="dialog">
              <div className="modal-box">
                <h3 className="font-bold text-lg">📖 Tài liệu tham khảo</h3>
                <p className="py-2 break-words">
                  <b>Nội dung: </b>
                  {reference.content}
                </p>
                <p className="py-2 break-words">
                  <b>Nguồn: </b>
                  <a href={reference.url} target="_blank">
                    {reference.url}
                  </a>
                </p>
                <div className="modal-action">
                  <label htmlFor="my_modal_6" className="btn btn-error">
                    ĐÓNG
                  </label>
                </div>
              </div>
            </div>

            <div
              id="chat-area"
              ref={chatAreaRef}
              onScroll={handleScroll}
              className="mt-5 text-sm scrollbar-thin scrollbar-thumb-gray-300 bg-white scrollbar-thumb-rounded-full scrollbar-track-rounded-full rounded-3xl border-2 p-3 w-full overflow-auto scroll-y-auto h-[calc(100%-8rem)]"
            >
              {dataChat.map((dataMessages, i) =>
                  dataMessages[0] === "start" ? (
                      <div className="chat chat-start drop-shadow-md" key={`start-${i}`}>
                          <div className="chat-image avatar">
                              <div className="w-10 rounded-full border-2 border-blue-500">
                                  <img className="scale-150" src={robot_img} />
                              </div>
                          </div>
                          <div className="w-full">
                              <div className="chat-bubble chat-bubble-info colo break-words">
                                  {isGen && i === dataChat.length - 1 ? (
                                      <CustomTypingAnimation
                                          text={dataMessages[1][0]}
                                          onComplete={() => SetIsGen(false)}
                                          speed={50}
                                      />
                                  ) : (
                                      <div style={{ whiteSpace: "pre-line" }}>
                                          {parseMarkdownToJSX(dataMessages[1][0])}
                                      </div>
                                  )}
                                  {dataMessages[1][1] && dataMessages[1][1].length > 0 && (
                                      <>
                                          <div className="divider m-0"></div>
                                          <p className="font-semibold text-xs">
                                              Tham khảo:{" "}
                                              {dataMessages[1][1].map((source, j) => (
                                                  <label
                                                      htmlFor="my_modal_6"
                                                      className="kbd kbd-xs mr-1 hover:bg-sky-300 cursor-pointer"
                                                      onClick={() =>
                                                          handleReferenceClick(source, dataMessages[1][2])
                                                      }
                                                      key={`source-${j}`}
                                                  >
                                                      {dataMessages[1][2] === "wiki"
                                                          ? source.metadata.title
                                                          : source.metadata.page === undefined
                                                          ? "Sổ tay sinh viên 2023"
                                                          : "Trang " + source.metadata.page + " (sổ tay SV)"}
                                                  </label>
                                              ))}
                                          </p>
                                      </>
                                  )}
                              </div>
                              
                              {/* Feedback buttons - chỉ hiển thị cho tin nhắn của chatbot (không phải tin nhắn chào đầu tiên) */}
                              {i > 0 && (
                                  <div className="flex gap-1 mt-2 ml-12">
                                      <button
                                          onClick={() => handleCopyMessage(i, dataMessages[1][0])}
                                          className="btn btn-ghost btn-xs hover:bg-gray-200 tooltip"
                                          data-tip="Sao chép"
                                      >
                                          <FontAwesomeIcon icon={faCopy} className="w-3 h-3" />
                                      </button>
                                      
                                      <button
                                          onClick={() => handleThumbsUp(i, dataMessages[1][0])}
                                          disabled={feedbackState[i]?.hasSubmitted}
                                          className={`btn btn-ghost btn-xs tooltip ${
                                              feedbackState[i]?.hasSubmitted 
                                                  ? feedbackState[i]?.thumbsUp 
                                                      ? 'text-green-600 bg-green-50 cursor-not-allowed' 
                                                      : 'text-gray-400 cursor-not-allowed'
                                                  : 'hover:bg-green-100'
                                          }`}
                                          data-tip={feedbackState[i]?.hasSubmitted ? "Đã đánh giá" : "Phản hồi tốt"}
                                      >
                                          <FontAwesomeIcon icon={faThumbsUp} className="w-3 h-3" />
                                      </button>
                                      
                                      <button
                                          onClick={() => handleThumbsDown(i, dataMessages[1][0])}
                                          disabled={feedbackState[i]?.hasSubmitted}
                                          className={`btn btn-ghost btn-xs tooltip ${
                                              feedbackState[i]?.hasSubmitted 
                                                  ? feedbackState[i]?.thumbsDown 
                                                      ? 'text-red-600 bg-red-50 cursor-not-allowed' 
                                                      : 'text-gray-400 cursor-not-allowed'
                                                  : 'hover:bg-red-100'
                                          }`}
                                          data-tip={feedbackState[i]?.hasSubmitted ? "Đã đánh giá" : "Phản hồi không tốt"}
                                      >
                                          <FontAwesomeIcon icon={faThumbsDown} className="w-3 h-3" />
                                      </button>
                                      
                                      <button
                                          onClick={() => handleReadAloud(dataMessages[1][0])}
                                          className="btn btn-ghost btn-xs hover:bg-blue-100 tooltip"
                                          data-tip="Đọc to"
                                      >
                                          <FontAwesomeIcon icon={faVolumeHigh} className="w-3 h-3" />
                                      </button>
                                      
                                      <button
                                          onClick={() => handleRetry(i)}
                                          className="btn btn-ghost btn-xs hover:bg-orange-100 tooltip"
                                          data-tip="Thử lại"
                                      >
                                          <FontAwesomeIcon icon={faRotateRight} className="w-3 h-3" />
                                      </button>
                                  </div>
                              )}
                          </div>
                      </div>
                  ) : (
                      <div className="chat chat-end" key={`end-${i}`}>
                          <div className="chat-bubble shadow-xl chat-bubble-primary  text-white">
                              {dataMessages[1][0]}
                          </div>
                      </div>
                  )
              )}

              {isLoading ? (
                <div className="chat chat-start">
                  <div className="chat-image avatar">
                    <div className="w-10 rounded-full border-2 border-blue-500">
                      <img src={robot_img} />
                    </div>
                  </div>
                  <div className="chat-bubble chat-bubble-info">
                    <ScaleLoader
                      color="#000000"
                      loading={true}
                      height={10}
                      width={10}
                      aria-label="Loading Spinner"
                      data-testid="loader"
                    />
                    <p className="text-xs font-medium">{timeOfRequest + "/60s"}</p>
                  </div>
                </div>
              ) : (
                ""
              )}

              {isLoadingChatHistory ? (
                <div className="chat chat-start">
                  <div className="chat-image avatar">
                    <div className="w-10 rounded-full border-2 border-blue-500">
                      <img src={robot_img} />
                    </div>
                  </div>
                  <div className="chat-bubble chat-bubble-info">
                    <ScaleLoader
                      color="#000000"
                      loading={true}
                      height={10}
                      width={10}
                      aria-label="Loading Chat History"
                      data-testid="loader"
                    />
                    <p className="text-xs font-medium">Đang tải lịch sử chat...</p>
                  </div>
                </div>
              ) : (
                ""
              )}
              <div ref={messagesEndRef} />
              
              {/* Nút scroll to bottom */}
              {showScrollButton && (
                <div className="absolute bottom-20 right-4">
                  <button
                    onClick={ScrollToEndChat}
                    className="btn btn-circle btn-primary btn-sm shadow-lg hover:shadow-xl transition-all duration-200"
                    title="Cuộn xuống cuối"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 14l-7 7m0 0l-7-7m7 7V3"
                      />
                    </svg>
                  </button>
                </div>
              )}
              
              <div className="absolute bottom-[0rem] w-[calc(100%-1.5rem)] grid">
                {/* Nút xóa lịch sử cho mobile */}
                {chatHistory.length > 0 && (
                  <div className="lg:hidden mb-2 flex justify-end">
                    <button
                      onClick={clearChatHistory}
                      className="btn btn-ghost btn-xs text-red-500 hover:bg-red-100 tooltip"
                      data-tip="Bắt đầu cuộc trò chuyện mới"
                    >
                      <FontAwesomeIcon icon={faTrash} className="w-3 h-3" />
                      <span className="ml-1 text-xs">Cuộc trò chuyện mới</span>
                    </button>
                  </div>
                )}
                
                <input
                  type="text"
                  placeholder={userInfo ? "Nhập câu hỏi tại đây..." : "Vui lòng đăng nhập để chat..."}
                  className="mr-1 shadow-xl border-2 focus:outline-none px-2 rounded-2xl input-primary col-start-1 col-end-11"
                  onChange={onChangeHandler}
                  onKeyDown={handleKeyDown}
                  disabled={isGen || !userInfo || isLoadingChatHistory}
                  value={promptInput}
                />

                <button
                  disabled={isGen || !userInfo || isLoadingChatHistory}
                  onClick={() => SendMessageChat()}
                  className="drop-shadow-md rounded-2xl col-start-11 col-end-12 btn btn-active btn-primary btn-square bg-gradient-to-tl from-transparent via-blue-600 to-indigo-500"
                >
                  <svg
                    stroke="currentColor"
                    fill="none"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                    color="white"
                    height="15px"
                    width="15px"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <line x1="22" y1="2" x2="11" y2="13"></line>
                    <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                  </svg>
                </button>
                <div className="text-xs col-start-1 col-end-12 text-justify p-1 space-y-1">
                  <p>
                    <b>Lưu ý: </b>Mô hình có thể đưa ra câu trả lời không chính xác ở
                    một số trường hợp, vì vậy hãy luôn kiểm chứng thông tin bạn nhé!
                  </p>
                  <p className={`text-xs ${
                    storageStatus === 'available' ? 'text-green-600' : 
                    storageStatus === 'limited' ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    <b>Lưu trữ: </b>
                    {storageStatus === 'available' && '✅ Lịch sử chat được lưu tự động'}
                    {storageStatus === 'limited' && '⚠️ Lịch sử chỉ lưu trong phiên hiện tại'}
                    {storageStatus === 'unavailable' && '❌ Không thể lưu lịch sử chat'}
                    {storageStatus === 'checking' && '🔄 Đang kiểm tra...'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Sidebar - Common Questions (Desktop only) */}
        <div className="hidden lg:block lg:col-span-2">
          <div className="bg-gray-50 text-base-content rounded-2xl p-4 h-[calc(100vh-10rem)] overflow-auto sticky top-20">
            <div className="mb-2">
              <h2 className="font-bold text-sm bg-clip-text will-change-auto ">
                💡 Câu hỏi gợi ý
              </h2>
            </div>
            <ul className="menu text-sm p-0">
              {commonQuestions.map((question, i) => (
                <li
                  key={i}
                  className="max-h-16 py-1"
                  onClick={() => {
                    if (userInfo && promptInput === "" && !isLoading) {
                      SetPromptInput(question);
                    } else if (!userInfo) {
                      setShowUserInfoPopup(true);
                    }
                  }}
                >
                  <a
                    className={
                      "text-xs hover:bg-gray-200 font-medium rounded-md  cursor-pointer transition-colors p-2" +
                      (isLoading || !userInfo
                        ? " opacity-50 cursor-not-allowed"
                        : "")
                    }
                    title={question}
                  >
                    {question.length > 40 ? question.substring(0, 40) + "..." : question}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
        
      </div>
    </div>
  );
}
export default ChatBot;
