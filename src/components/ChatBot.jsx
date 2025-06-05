// import avatar from "../assets/avatar.jpg";
import robot_img from "../assets/robot_image.webp";
import { useState, useRef, useEffect, useCallback } from "react";
import ScaleLoader from "react-spinners/ScaleLoader";
import { TypeAnimation } from "react-type-animation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMessage, faCopy, faThumbsUp, faThumbsDown } from "@fortawesome/free-regular-svg-icons";
import { faVolumeHigh, faRotateRight, faTrash } from "@fortawesome/free-solid-svg-icons";
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
        feedbackState: parsed.feedbackState || {}
      };
    }
  } catch (error) {
    console.log('Error loading chat data from storage:', error);
  }
  return {
    dataChat: [["start", ["Xin chào! Đây là HUMG Chatbot, trợ lý đắc lực dành cho bạn! Bạn muốn tìm kiếm thông tin về những gì? Đừng quên chọn nguồn tham khảo phù hợp để mình có thể giúp bạn tìm kiếm thông tin chính xác nhất nha. 😄", null]]],
    chatHistory: [],
    feedbackState: {}
  };
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

  
  const commonQuestions=[
    "Điểm chuẩn của ngành Quản trị Kinh doanh năm 2024 là bao nhiêu ạ?",
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
  const [feedbackState, setFeedbackState] = useState(initialData.feedbackState); // Lưu trạng thái feedback cho từng tin nhắn
  const [storageStatus, setStorageStatus] = useState('checking'); // 'available', 'limited', 'unavailable'
  
  const [dataChat, SetDataChat] = useState(initialData.dataChat);

  // Hàm lưu dữ liệu vào storage
  const saveChatData = useCallback(() => {
    try {
      const dataToSave = {
        dataChat,
        chatHistory,
        feedbackState,
        timestamp: Date.now()
      };
      console.log('💾 Đang lưu dữ liệu chat...', {
        dataChatLength: dataChat.length,
        chatHistoryLength: chatHistory.length,
        feedbackStateKeys: Object.keys(feedbackState).length
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
  }, [dataChat, chatHistory, feedbackState]);

  // Hàm xóa lịch sử chat
  const clearChatHistory = () => {
    if (window.confirm('Bạn có chắc chắn muốn xóa toàn bộ lịch sử trò chuyện? Hành động này không thể hoàn tác.')) {
      const defaultData = [["start", ["Xin chào! Đây là HUMG Chatbot, trợ lý đắc lực dành cho bạn! Bạn muốn tìm kiếm thông tin về những gì? Đừng quên chọn nguồn tham khảo phù hợp để mình có thể giúp bạn tìm kiếm thông tin chính xác nhất nha. 😄", null]]];
      SetDataChat(defaultData);
      SetChatHistory([]);
      setFeedbackState({});
      removeStorageItem('humg-chatbot-data');
      console.log('Đã xóa lịch sử chat');
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

  // Debug voices on component mount
  useEffect(() => {
    // Small delay to ensure voices are loaded
    setTimeout(() => {
      checkAvailableVoices();
    }, 1000);
  }, []);

  // Hàm scroll xuống cuối khi user click nút
  function ScrollToEndChat() {
    setIsUserScrolledUp(false);
    setShowScrollButton(false);
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }
  const onChangeHandler = (event) => {
    SetPromptInput(event.target.value);
  };

  async function SendMessageChat() {
    if (promptInput !== "" && isLoading === false) {
        SetTimeOfRequest(0);
        SetIsGen(true);
        SetPromptInput("");
        SetIsLoad(true);
        
        // Reset scroll state khi gửi tin nhắn mới
        setIsUserScrolledUp(false);
        setShowScrollButton(false);
        
        SetDataChat((prev) => [...prev, ["end", [promptInput]]]);
        SetChatHistory((prev) => [promptInput, ...prev]);
        
        // Force scroll to bottom khi user gửi tin nhắn
        setTimeout(() => {
          scrollToEnd();
        }, 50);

        fetch("https://lark-discrete-slug.ngrok-free.app/ask/", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "ngrok-skip-browser-warning": "69420",
            },
            body: JSON.stringify({ question: promptInput }),
        })
            .then((response) => response.json())
            .then((result) => {
                SetDataChat((prev) => [
                    ...prev,
                    ["start", [result.answer, result.source_documents]], // Thêm source_documents vào response
                ]);
                SetIsLoad(false);
            })
            .catch((error) => {
                SetDataChat((prev) => [
                    ...prev,
                    ["start", ["Ôi không! 😵‍💫 Chatbot đang bị lạc đường và không thể kết nối tới máy chủ rồi... Có lẽ server đang bận uống cà phê ☕ hoặc đang nghỉ giải lao 😅. Bạn vui lòng liên hệ hotline 📞 để tụi mình hỗ trợ nhanh nhất nhé! Cảm ơn bạn đã kiên nhẫn với tụi mình! 💖", null]], // Xử lý lỗi kết nối
                ]);
                SetIsLoad(false);
            });
    }
}

  

  const handleKeyDown = (event) => {
    if (event.key === "Enter") {
      SendMessageChat();
    }
  };
  let [reference, SetReference] = useState({
    title: "",
    source: "",
    url: "",
    text: ``,
  });
  const handleReferenceClick = (sources, sourceType) => {
    SetReference({
      title:
        sourceType == "wiki"
          ? sources.metadata.title
          : sources.metadata.page==undefined? "Sổ tay sinh viên 2023" : "Trang " + sources.metadata.page + " (sổ tay SV)",
      source: sourceType == "wiki" ? "Wikipedia" : "Trường Đại học Mỏ - Địa chất",
      url:
        sourceType == "wiki"
          ? sources.metadata.source
          : "https://humg.edu.vn/sinh-vien-can-biet/",
      text:
        sourceType == "wiki" ? sources.metadata.summary : sources.page_content,
    });
  };

  // Feedback handlers
  const handleCopyMessage = (messageIndex, messageText) => {
    navigator.clipboard.writeText(messageText).then(() => {
      // Có thể thêm toast notification ở đây
      console.log("Đã sao chép tin nhắn");
    }).catch(err => {
      console.error("Lỗi khi sao chép:", err);
    });
  };

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
    
    // Gửi feedback lên Google Sheets
    sendFeedbackToGoogleSheets(messageText, "positive", messageIndex);
  };

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
      url: window.location.href
    };

    const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyzftIhc4A6GLa9Lg7GLTguxluzvNTzfffHEuS1IPSeA5W6cbbXlJ-25H-1y_8gShTE/exec";
    
    console.log("🚀 Đang gửi feedback...", { feedbackType, messageIndex });

    // Method 1: JSONP (được Google Apps Script hỗ trợ, bypass CORS hoàn toàn)
    try {
      const callbackName = `feedback_${Date.now()}`;
      const queryParams = new URLSearchParams({
        callback: callbackName,
        ...feedbackData
      });
      
      const script = document.createElement('script');
      script.src = `${GOOGLE_SCRIPT_URL}?${queryParams}`;
      
      // Tạo callback function
      window[callbackName] = (response) => {
        console.log("✅ Feedback đã được gửi (JSONP)!", response);
        document.head.removeChild(script);
        delete window[callbackName];
      };
      
      // Xử lý lỗi
      script.onerror = () => {
        console.log("⚠️ JSONP failed, trying other methods...");
        document.head.removeChild(script);
        delete window[callbackName];
        tryMethod2();
      };
      
      document.head.appendChild(script);
      return; // Exit if JSONP succeeds
      
    } catch (jsonpError) {
      console.log("⚠️ JSONP failed:", jsonpError);
    }

    // Method 2: sendBeacon (Ideal cho tracking, không bị ad blocker block)
    const tryMethod2 = () => {
      try {
        if (navigator.sendBeacon) {
          const formData = new FormData();
          Object.keys(feedbackData).forEach(key => {
            formData.append(key, feedbackData[key]);
          });
          
          const success = navigator.sendBeacon(GOOGLE_SCRIPT_URL, formData);
          if (success) {
            console.log("✅ Feedback đã được gửi (SendBeacon)!");
            return;
          }
        }
      } catch (beaconError) {
        console.log("⚠️ SendBeacon failed:", beaconError);
      }
      tryMethod3();
    };

    // Method 3: Image beacon (Luôn hoạt động, không bị block)
    const tryMethod3 = () => {
      try {
        const img = new Image();
        const queryParams = new URLSearchParams({
          ...feedbackData,
          format: 'image' // Thêm flag để Apps Script biết return image
        });
        img.src = `${GOOGLE_SCRIPT_URL}?${queryParams}`;
        
        img.onload = () => {
          console.log("✅ Feedback đã được gửi (Image beacon)!");
        };
        
        img.onerror = () => {
          console.log("⚠️ Image beacon failed, trying next method...");
          tryMethod4();
        };
        
        // Set timeout để fallback nếu load quá lâu
        setTimeout(() => {
          console.log("⚠️ Image beacon timeout, trying next method...");
          tryMethod4();
        }, 10000);
        
        return; // Exit after setting up image beacon
        
      } catch (imageError) {
        console.log("⚠️ Image beacon failed:", imageError);
      }
      tryMethod4();
    };

    // Method 4: Fetch với CORS headers
    const tryMethod4 = async () => {
      try {
        const response = await fetch(GOOGLE_SCRIPT_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(feedbackData)
        });
        
        if (response.ok) {
          const result = await response.json();
          console.log("✅ Feedback đã được gửi (Fetch CORS)!", result);
          return;
        }
      } catch (fetchError) {
        console.log("⚠️ Fetch CORS failed:", fetchError);
      }
      tryMethod5();
    };

    // Method 5: XMLHttpRequest fallback
    const tryMethod5 = () => {
      try {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', GOOGLE_SCRIPT_URL, true);
        xhr.setRequestHeader('Content-Type', 'application/json');
        
        xhr.onreadystatechange = function() {
          if (xhr.readyState === 4) {
            if (xhr.status === 200) {
              console.log("✅ Feedback đã được gửi (XMLHttpRequest)!", xhr.responseText);
            } else {
              console.log("⚠️ XMLHttpRequest failed, trying next method...");
              tryMethod6();
            }
          }
        };
        
        xhr.onerror = () => {
          console.log("⚠️ XMLHttpRequest failed");
          tryMethod6();
        };
        
        xhr.send(JSON.stringify(feedbackData));
        
      } catch (xhrError) {
        console.log("⚠️ XMLHttpRequest failed:", xhrError);
        tryMethod6();
      }
    };

    // Method 6: Fetch no-cors (backup)
    const tryMethod6 = async () => {
      try {
        await fetch(GOOGLE_SCRIPT_URL, {
          method: 'POST',
          mode: 'no-cors',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(feedbackData)
        });
        console.log("✅ Feedback đã được gửi (no-cors mode)!");
      } catch (fetchError) {
        console.error("❌ Tất cả methods đều failed:", fetchError);
        // Vẫn log data để có thể manual export sau
        console.log("📊 Feedback data (manual backup):", feedbackData);
        
        // Store in localStorage as final backup
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

    // Start with method 2 if JSONP fails
    tryMethod2();
  };



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

      // Call ngrok TTS API
      const ttsResponse = await fetch('https://aware-mutt-upward.ngrok-free.app/tts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': '69420' // Skip ngrok browser warning
        },
        body: JSON.stringify({
          text: messageText,
          voice_name: "Kore",
          return_type: "stream"
        })
      });

      console.log("📡 TTS API Response status:", ttsResponse.status);

      if (!ttsResponse.ok) {
        const errorText = await ttsResponse.text();
        console.error("❌ TTS API Error response:", errorText);
        throw new Error(`TTS API error: ${ttsResponse.status} - ${errorText}`);
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
      
      audio.onerror = (e) => {
        console.error('❌ Audio playback error:', e);
        URL.revokeObjectURL(audioUrl);
        throw new Error('Audio playback failed');
      };
      
      await audio.play();

      // Show success toast
      const successToast = document.createElement('div');
      successToast.className = 'toast toast-top toast-center';
      successToast.innerHTML = `
        <div class="alert alert-success flex flex-row items-center gap-2">
          <span>✅ Mình đã đánh vần xong rồi nha ạ!</span>
        </div>
      `;
      document.body.appendChild(successToast);
      setTimeout(() => {
        if (document.body.contains(successToast)) {
          document.body.removeChild(successToast);
        }
      }, 3000);

      console.log("🎉 TTS completed successfully!");
      return; // Success, exit function

    } catch (error) {
      console.error('💥 TTS API Error:', error);
      
      // Remove any existing loading toast
      const existingToasts = document.querySelectorAll('.toast');
      existingToasts.forEach(toast => {
        if (document.body.contains(toast)) {
          document.body.removeChild(toast);
        }
      });

      // Fallback to browser TTS with proper Vietnamese voice selection
      if ('speechSynthesis' in window) {
        console.log("🔄 Fallback to browser TTS...");
        window.speechSynthesis.cancel();
        
        // Wait for voices to load
        const loadVoicesAndSpeak = () => {
          const voices = window.speechSynthesis.getVoices();
          console.log("🎤 Available voices:", voices.map(v => `${v.name} (${v.lang})`));
          
          // Find Vietnamese voices - multiple fallback options
          let selectedVoice = null;
          const vietnameseVoicePatterns = [
            /vi[-_]VN/i,           // vi-VN, vi_VN
            /vietnamese/i,         // Vietnamese
            /vietnam/i,            // Vietnam
            /linh/i,              // Microsoft Linh (Windows)
            /hue/i,               // Microsoft Hue (Windows)  
            /thinh/i,             // Microsoft Thinh (male voice)
            /vi/i                 // Generic vi
          ];
          
          // Try to find best Vietnamese voice
          for (const pattern of vietnameseVoicePatterns) {
            selectedVoice = voices.find(voice => 
              pattern.test(voice.lang) || pattern.test(voice.name)
            );
            if (selectedVoice) {
              console.log(`✅ Found Vietnamese voice: ${selectedVoice.name} (${selectedVoice.lang})`);
              break;
            }
          }
          
          const utterance = new SpeechSynthesisUtterance(messageText);
          
          if (selectedVoice) {
            utterance.voice = selectedVoice;
            utterance.lang = selectedVoice.lang;
            console.log(`🔊 Using Vietnamese voice: ${selectedVoice.name}`);
          } else {
            // No Vietnamese voice found - use English voice with Vietnamese text
            console.log("⚠️ No Vietnamese voice found in system");
            console.log("💡 Using English voice - may not pronounce Vietnamese correctly");
            
            // Try to use a female voice for better Vietnamese pronunciation
            const femaleVoices = voices.filter(voice => 
              /female|zira|aria|eva|hazel/i.test(voice.name) || voice.name.includes('Zira')
            );
            
            if (femaleVoices.length > 0) {
              utterance.voice = femaleVoices[0];
              console.log(`🔊 Using female English voice: ${femaleVoices[0].name}`);
            } else {
              // Use any available voice
              utterance.voice = voices[0];
              console.log(`🔊 Using default voice: ${voices[0].name}`);
            }
            
            // Still set Vietnamese language code
            utterance.lang = 'vi-VN';
          }
          
          utterance.rate = 0.85;
          utterance.pitch = 1.0;
          utterance.volume = 1.0;
          
          // Add event listeners
          utterance.onstart = () => {
            console.log("🔊 TTS started");
          };
          
          utterance.onend = () => {
            console.log("✅ TTS completed");
          };
          
          utterance.onerror = (event) => {
            console.error("❌ TTS error:", event);
          };
          
          window.speechSynthesis.speak(utterance);
        };
        
        // Check if voices are already loaded
        const voices = window.speechSynthesis.getVoices();
        if (voices.length > 0) {
          loadVoicesAndSpeak();
        } else {
          // Wait for voices to load
          window.speechSynthesis.onvoiceschanged = () => {
            loadVoicesAndSpeak();
            window.speechSynthesis.onvoiceschanged = null; // Remove listener
          };
        }
        
        // Show appropriate toast based on voice availability
        const availableVoices = window.speechSynthesis.getVoices();
        const hasVietnameseVoice = availableVoices.some(voice => 
          /vi/i.test(voice.lang) || /vietnam/i.test(voice.name) || /linh|hue|thinh/i.test(voice.name)
        );
        
        const fallbackToast = document.createElement('div');
        fallbackToast.className = 'toast toast-top toast-center';
        
        if (hasVietnameseVoice) {
          fallbackToast.innerHTML = `
            <div class="alert alert-success flex flex-row items-center gap-2">
              <span>🔊 Phát âm bằng giọng tiếng Việt</span>
            </div>
          `;
        } else {
          fallbackToast.innerHTML = `
            <div class="alert alert-warning flex flex-row items-center gap-2">
              <span>⚠️ Phát âm bằng giọng tiếng Anh (chưa cài tiếng Việt)</span>
            </div>
          `;
        }
        
        document.body.appendChild(fallbackToast);
        setTimeout(() => {
          if (document.body.contains(fallbackToast)) {
            document.body.removeChild(fallbackToast);
          }
        }, hasVietnameseVoice ? 2000 : 4000); // Longer timeout for warning
      } else {
        // Show error toast as final fallback
        const errorToast = document.createElement('div');
        errorToast.className = 'toast toast-top toast-center';
        errorToast.innerHTML = `
          <div class="alert alert-error flex flex-row items-center gap-2">
            <span>❌ Không thể phát âm thanh. Vui lòng kiểm tra kết nối mạng.</span>
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

  const handleRetry = (messageIndex) => {
    // Lấy lại câu hỏi từ lịch sử và gửi lại
    if (chatHistory.length > 0) {
      const lastQuestion = chatHistory[0]; // Câu hỏi gần nhất
      SetPromptInput(lastQuestion);
    }
    console.log("Thử lại tin nhắn", messageIndex);
  };

  // Debug function to check available voices
  const checkAvailableVoices = () => {
    if ('speechSynthesis' in window) {
      const voices = window.speechSynthesis.getVoices();
      console.log("=== AVAILABLE VOICES ===");
      voices.forEach((voice, index) => {
        console.log(`${index + 1}. ${voice.name} (${voice.lang}) - ${voice.localService ? 'Local' : 'Remote'}`);
      });
      
      const vietnameseVoices = voices.filter(voice => 
        /vi/i.test(voice.lang) || /vietnam/i.test(voice.name) || /linh|hue|thinh/i.test(voice.name)
      );
      
      console.log("=== VIETNAMESE VOICES ===");
      if (vietnameseVoices.length > 0) {
        vietnameseVoices.forEach((voice, index) => {
          console.log(`${index + 1}. ✅ ${voice.name} (${voice.lang})`);
        });
      } else {
        console.log("❌ No Vietnamese voices found");
        console.log("💡 Try installing Vietnamese language pack in your OS");
      }
    }
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
    <div className="bg-gradient-to-r from-blue-50 to-purple-100 h-[85vh] ">
      <div className="hidden lg:block  drawer-side absolute w-64 h-[20vh] left-3 mt-2 drop-shadow-md">
        <div className="menu p-4 w-full min-h-full bg-gray-50 text-base-content rounded-2xl mt-3  overflow-auto scroll-y-auto max-h-[80vh]">
          {/* Sidebar content here */}
          <ul className="menu text-sm">
            <div className="flex justify-between items-center mb-2">
              <h2 className="font-bold bg-[linear-gradient(90deg,hsl(var(--s))_0%,hsl(var(--sf))_9%,hsl(var(--pf))_42%,hsl(var(--p))_47%,hsl(var(--a))_100%)] bg-clip-text will-change-auto [-webkit-text-fill-color:transparent] [transform:translate3d(0,0,0)] motion-reduce:!tracking-normal max-[1280px]:!tracking-normal [@supports(color:oklch(0_0_0))]:bg-[linear-gradient(90deg,hsl(var(--s))_4%,color-mix(in_oklch,hsl(var(--sf)),hsl(var(--pf)))_22%,hsl(var(--p))_45%,color-mix(in_oklch,hsl(var(--p)),hsl(var(--a)))_67%,hsl(var(--a))_100.2%)] ">
                Lịch sử trò chuyện
              </h2>
              {chatHistory.length > 0 && (
                <button
                  onClick={clearChatHistory}
                  className="btn btn-ghost btn-xs text-red-500 hover:bg-red-100 tooltip"
                  data-tip="Xóa toàn bộ lịch sử"
                >
                  <FontAwesomeIcon icon={faTrash} className="w-3 h-3" />
                </button>
              )}
            </div>
            {chatHistory.length == 0 ? (
              <p className="text-sm text-gray-500">
                Hiện chưa có cuộc hội thoại nào
              </p>
            ) : (
              ""
            )}
            {chatHistory.map((mess, i) => (
              <li key={i}>
                <p>
                  <FontAwesomeIcon icon={faMessage} />
                  {mess.length < 20 ? mess : mess.slice(0, 20) + "..."}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="hidden lg:block  drawer-side absolute w-64 h-[20vh] mt-2 right-3 drop-shadow-md">
        <div className="menu p-4 w-full min-h-full bg-gray-50 text-base-content rounded-2xl mt-3">
          {/* Sidebar content here */}
          <h2 className="font-bold text-sm mb-2 bg-[linear-gradient(90deg,hsl(var(--s))_0%,hsl(var(--sf))_9%,hsl(var(--pf))_42%,hsl(var(--p))_47%,hsl(var(--a))_100%)] bg-clip-text will-change-auto [-webkit-text-fill-color:transparent] [transform:translate3d(0,0,0)] motion-reduce:!tracking-normal max-[1280px]:!tracking-normal [@supports(color:oklch(0_0_0))]:bg-[linear-gradient(90deg,hsl(var(--s))_4%,color-mix(in_oklch,hsl(var(--sf)),hsl(var(--pf)))_22%,hsl(var(--p))_45%,color-mix(in_oklch,hsl(var(--p)),hsl(var(--a)))_67%,hsl(var(--a))_100.2%)] ">
            Nguồn tham khảo
          </h2>
          <ul className="menu">
            <li>
              <label className="label cursor-pointer">
                <span className="label-text font-medium">
                  Bách khoa toàn thư Wikipedia
                </span>
                <input
                  type="radio"
                  name="radio-10"
                  value={"wiki"}
                  checked={sourceData === "wiki"}
                  onChange={(e) => {
                    SetSourceData(e.target.value);
                  }}
                  className="radio checked:bg-blue-500"
                />
              </label>
            </li>
            <li>
              <label className="label cursor-pointer">
                <span className="label-text font-medium">
                  Trường Đại học Mỏ - Địa chất
                </span>
                <input
                  value={"nttu"}
                  type="radio"
                  checked={sourceData === "nttu"}
                  onChange={(e) => {
                    SetSourceData(e.target.value);
                  }}
                  name="radio-10"
                  className="radio checked:bg-blue-500"
                />
              </label>
            </li>
          </ul>
        </div>
        <div
          className="menu p-4 w-full min-h-full bg-gray-50 text-base-content 
        rounded-2xl mt-3  overflow-auto scroll-y-auto max-h-[43vh]
        scrollbar-thin scrollbar-thumb-gray-300 
          scrollbar-thumb-rounded-full scrollbar-track-rounded-full
        "
        >
          {/* Sidebar content here */}
          <ul className="menu text-sm">
            <h2 className="font-bold mb-2 bg-[linear-gradient(90deg,hsl(var(--s))_0%,hsl(var(--sf))_9%,hsl(var(--pf))_42%,hsl(var(--p))_47%,hsl(var(--a))_100%)] bg-clip-text will-change-auto [-webkit-text-fill-color:transparent] [transform:translate3d(0,0,0)] motion-reduce:!tracking-normal max-[1280px]:!tracking-normal [@supports(color:oklch(0_0_0))]:bg-[linear-gradient(90deg,hsl(var(--s))_4%,color-mix(in_oklch,hsl(var(--sf)),hsl(var(--pf)))_22%,hsl(var(--p))_45%,color-mix(in_oklch,hsl(var(--p)),hsl(var(--a)))_67%,hsl(var(--a))_100.2%)] ">
              Những câu hỏi phổ biến
            </h2>

            {commonQuestions.map((mess, i) => (
              <li key={i} onClick={() => SetPromptInput(mess)}>
                <p className="max-w-64">
                  <FontAwesomeIcon icon={faMessage} />
                  {mess}
                  {/* {mess.length < 20 ? mess : mess.slice(0, 20) + "..."} */}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className={"flex justify-center h-[80vh]"}>
        {/* Put this part before </body> tag */}
        <input type="checkbox" id="my_modal_6" className="modal-toggle" />
        <div className="modal">
          <div className="modal-box">
            <h3 className="font-bold text-lg">{reference.title}</h3>{" "}
            <p className="font-normal text-sm">Nguồn: {reference.source}</p>
            <p className="py-4 text-sm">
              {reference.text.slice(0, 700) + "..."}
            </p>
            <p className="link link-primary truncate">
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
          className="
          mt-5 text-sm 
          scrollbar-thin scrollbar-thumb-gray-300 bg-white  
          scrollbar-thumb-rounded-full scrollbar-track-rounded-full
          rounded-3xl border-2 md:w-[50%] md:p-3 p-1  w-full overflow-auto scroll-y-auto h-[80%] "
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
                      <div className="chat-bubble shadow-xl chat-bubble-primary bg-gradient-to-r from-purple-500 to-blue-500 text-white">
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
          
          <div className="absolute bottom-[0.2rem] md:w-[50%] grid ">
            {/* Nút xóa lịch sử cho mobile */}
            {chatHistory.length > 0 && (
              <div className="lg:hidden mb-2 flex justify-end">
                <button
                  onClick={clearChatHistory}
                  className="btn btn-ghost btn-xs text-red-500 hover:bg-red-100 tooltip"
                  data-tip="Xóa lịch sử chat"
                >
                  <FontAwesomeIcon icon={faTrash} className="w-3 h-3" />
                  <span className="ml-1 text-xs">Xóa lịch sử</span>
                </button>
              </div>
            )}
            
            <input
              type="text"
              placeholder="Nhập câu hỏi tại đây..."
              className="mr-1 shadow-xl border-2 focus:outline-none px-2 rounded-2xl input-primary col-start-1 md:col-end-12 col-end-11 "
              onChange={onChangeHandler}
              onKeyDown={handleKeyDown}
              disabled={isGen}
              value={promptInput}
            />

            <button
              disabled={isGen}
              onClick={() => SendMessageChat()}
              className={
                " drop-shadow-md md:col-start-12 rounded-2xl col-start-11 col-end-12 md:col-end-13 btn btn-active btn-primary btn-square bg-gradient-to-tl from-transparent via-blue-600 to-indigo-500"
              }
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
  );
}
export default ChatBot;
