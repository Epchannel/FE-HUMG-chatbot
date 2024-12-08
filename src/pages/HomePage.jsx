import React from 'react';
import { Helmet } from 'react-helmet';  // Import Helmet để thay đổi thẻ head
import ChatbotSection from "../components/ChatbotSection";

function HomePage() {
  return (
    <div>
      {/* Thêm các thẻ SEO với react-helmet */}
      <Helmet>
        <title>Trang chủ | Chatbot HUMG</title>
        <meta property="og:locale" content="vi_VN" />
        <meta property="og:type" content="website" />
        <meta property="og:title" content="Chatbot HUMG - Chuyên gia Tư vấn tuyển sinh tại Trường Đại học Mỏ - Địa chất" />
        <meta property="og:description" content="Chatbot HUMG - Chuyên gia Tư vấn tuyển sinh tại Trường Đại học Mỏ - Địa chất" />
        <meta property="og:url" content="https://chatbothumg.com" />
        <meta property="og:site_name" content="Chatbot HUMG" />
        <meta property="og:updated_time" content="2024-06-16T08:26:46+07:00" />
        <meta property="og:image" content="https://raw.githubusercontent.com/Epchannel/FE-HUMG-chatbot/refs/heads/gh-pages/thumbnail.webp" />
        <meta property="og:image:secure_url" content="https://raw.githubusercontent.com/Epchannel/FE-HUMG-chatbot/refs/heads/gh-pages/thumbnail.webp" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="600" />
        <meta property="og:image:alt" content="Chatbot HUMG" />
        <meta property="og:image:type" content="image/png" />
        <meta property="article:published_time" content="2022-04-15T07:55:53+07:00" />
        <meta property="article:modified_time" content="2024-06-16T08:26:46+07:00" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Chatbot HUMG - Chuyên gia Tư vấn tuyển sinh tại Trường Đại học Mỏ - Địa chất" />
        <meta name="twitter:description" content="Chatbot HUMG - Chuyên gia Tư vấn tuyển sinh tại Trường Đại học Mỏ - Địa chất" />
        <meta name="twitter:image" content="https://raw.githubusercontent.com/Epchannel/FE-HUMG-chatbot/refs/heads/gh-pages/thumbnail.webp" />
        <meta name="twitter:label1" content="Written by" />
        <meta name="twitter:data1" content="admin" />
        <meta name="twitter:label2" content="Time to read" />
        <meta name="twitter:data2" content="6 minutes" />
      </Helmet>

      {/* Nội dung trang */}
      <ChatbotSection />
    </div>
  );
}

export default HomePage;
