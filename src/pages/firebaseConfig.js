// src/firebaseConfig.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore"; // Import Firestore nếu bạn sử dụng Firestore làm cơ sở dữ liệu

// Cấu hình Firebase cho ứng dụng của bạn
const firebaseConfig = {
  apiKey: "AIzaSyD6dgIIoSWvBhf7aLlpZLD7tjN2jF7hcWU",
  authDomain: "humg-chatbot-13eb4.firebaseapp.com",
  projectId: "humg-chatbot-13eb4",
  storageBucket: "humg-chatbot-13eb4.appspot.com",
  messagingSenderId: "128190844821",
  appId: "1:128190844821:web:4a155e4cbec76652a2309c",
  measurementId: "G-76X82E25NZ"
};

// Khởi tạo Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app); // Nếu sử dụng Firestore, xuất cơ sở dữ liệu để sử dụng trong các thành phần

export { db };
