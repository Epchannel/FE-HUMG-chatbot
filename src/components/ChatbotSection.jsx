import React from "react";
import "./ChatbotSection.css";
import chatbotHeroImage from "../assets/Chatbot-Hero-Image.png";

const ChatbotSection = () => {
  return (
    <section className="chatbot-hero">
      <div className="chatbot-hero-content">
        <h1>
          Chatbot hỗ trợ tư vấn tuyển sinh <br /> Trường Đại học Mỏ - Địa chất.
        </h1>
        <p>
          Chào mừng bạn đến với Chatbot tư vấn tuyển sinh HUMG – Nơi giải đáp
          mọi thắc mắc về các ngành học, quy trình tuyển sinh và cơ hội học tập
          tại Trường Đại học Mỏ - Địa chất. <br /> Hãy trò chuyện ngay để được
          hỗ trợ thông tin chính xác và nhanh chóng!
        </p>
        <a href="/chat" className="get-started-btn">
          Bắt đầu ngay &nbsp; &#8594;
        </a>
      </div>
      <div className="chatbot-hero-robot">
        <div className="elementor-widget-container">
          <h4 className="elementor-heading-title elementor-size-default">
            Hi I'm Chatbot!
          </h4>
        </div>
        <img
          src={chatbotHeroImage}
          alt="Chatbot"
          className="robot-image"
        />

      </div>
    </section>
  );
};

export default ChatbotSection;
