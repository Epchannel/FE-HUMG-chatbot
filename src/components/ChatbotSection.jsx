import React, { useEffect } from "react";
import chatbotHeroImage from "../assets/Chatbot-Hero-Image.webp";

const ChatbotSection = () => {
  useEffect(() => {
    const phrases = [" Chatbot AI", " Trợ lý", " HUMGer", " Youtuber", " Script Writer"];
    let currentPhraseIndex = 0;
    let currentCharIndex = 0;
    let isDeleting = false;

    const typingElement = document.getElementById("typed-text");

    function typeEffect() {
      const currentPhrase = phrases[currentPhraseIndex];
      if (!isDeleting && currentCharIndex <= currentPhrase.length) {
        typingElement.textContent = " " + currentPhrase.substring(0, currentCharIndex);
        currentCharIndex++;
        setTimeout(typeEffect, 150);
      } else if (isDeleting && currentCharIndex >= 0) {
        typingElement.textContent = " " + currentPhrase.substring(0, currentCharIndex);
        currentCharIndex--;
        setTimeout(typeEffect, 100);
      } else {
        isDeleting = !isDeleting;
        if (!isDeleting) {
          currentPhraseIndex = (currentPhraseIndex + 1) % phrases.length;
        }
        setTimeout(typeEffect, 1000);
      }
    }
    typeEffect();
  }, []);

  return (
    <section
      className="flex flex-col md:flex-row justify-between items-center md:items-start p-5 md:px-10 md:py-5 min-h-[600px] pb-28"
      style={{
        backgroundImage: "url('https://www.xtremeonline.in/wp-content/uploads/2024/08/wve-bg.png')",
        backgroundSize: 'contain',
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'center bottom',
      }}
    >
      {/* Thêm padding trái cho phần bao bọc để tạo cảm giác căn giữa */}
      <div className="w-full md:w-2/3 lg:w-3/5 order-2 md:order-1 mt-0 lg:pt-12 lg:pl-16">
        {/* Căn lề trái cho h1 và h3 */}
        <h1 className="text-2xl md:text-4xl font-bold mb-4 text-left">
          Xin chào, đây là <span className="text-[#2E87C5]">HUMGo</span>
        </h1>
        <h3 className="text-xl md:text-2xl font-bold mb-4 text-left">
          Em là <span id="typed-text" className="text-[#2E87C5]"></span>
        </h3>

      <div className="text-center">
        <p className="text-justify mb-8">
          Chán ngấy chờ đợi và hỏi mỏi miệng? Có ngay Chatbot AI "chill phết" của HUMG, túc trực 24/7 để giải đáp mọi thắc mắc về Trường Mỏ - Địa chất. Tư vấn tuyển sinh chưa bao giờ dễ thương và tiện lợi đến thế!
        </p>
        <a href="/#/chat" className="w-fit mx-auto mt-8 bg-transparent text-[#394e6a] font-bold border-2 border-[#2E87C5] rounded-full text-center py-3 px-6 hover:bg-[#2E87C5] hover:text-white hover:shadow-lg hover:shadow-[#2E87C5]/50 transition-all">
          Trải nghiệm ngay
        </a>

      </div>



      </div>

      <div className="w-full md:w-1/3 lg:w-2/5 flex justify-center items-center relative order-1 md:order-2 mt-0">
        <div className="absolute top-2 left-2 bg-[#e7f0fe] text-[#394e6a] p-[6px] md:p-[10px] px-[12px] md:px-[20px] rounded-custom text-xs md:text-sm font-bold animate-shake">
          Hi, I'm HUMGo!
        </div>
        <img src={chatbotHeroImage} alt="Chatbot" className="w-3/4 md:w-full max-w-[400px] h-auto animate-bobbing" />
      </div>
    </section>
  );
};

export default ChatbotSection;
