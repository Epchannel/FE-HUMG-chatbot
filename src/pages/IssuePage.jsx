import { useState } from "react";
import { db } from "./firebaseConfig";
import { collection, addDoc } from "firebase/firestore";

function IssuePage() {
  const [response, setResponse] = useState("");
  const [email, setEmail] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState(false);
  const [emailError, setEmailError] = useState(""); // Trạng thái để lưu lỗi email

  // Hàm kiểm tra định dạng email
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; // Biểu thức regex kiểm tra định dạng email
    return emailRegex.test(email);
  };

  async function sendToFirebase(event) {
    event.preventDefault(); // Ngăn chặn hành động mặc định của form

    // Kiểm tra email trước khi gửi
    if (!validateEmail(email)) {
      setEmailError("Email không hợp lệ. Vui lòng nhập đúng định dạng email.");
      return;
    }

    try {
      // Gửi dữ liệu lên Firestore
      await addDoc(collection(db, "issues"), {
        email,
        response,
        timestamp: new Date(),
      });
      setIsSubmitted(true);
      setError(false); // Đặt trạng thái không có lỗi
      setEmailError(""); // Đặt lại trạng thái lỗi email nếu có
      document.getElementById("my-modal").checked = true; // Hiện modal thành công
    } catch (err) {
      console.error("Lỗi khi gửi dữ liệu:", err);
      setIsSubmitted(false);
      setError(true); // Đặt trạng thái có lỗi
      document.getElementById("my-modal").checked = true; // Hiện modal lỗi
    }
  }

  return (
    <div className="flex justify-center h-[85vh] bg-gradient-to-br from-blue-100 to-purple-100">
      <input type="checkbox" id="my-modal" className="modal-toggle" />
      <div className="modal">
        <div className="modal-box">
          <h3 className="font-bold text-lg">
            {isSubmitted && !error ? "Gửi thành công 🥳" : "Gửi thất bại 😢"}
          </h3>
          <p className="py-4">
            {isSubmitted && !error
              ? "Cảm ơn bạn đã gửi góp ý / báo lỗi 🤗. Chúng tôi sẽ xem xét để hoàn thiện sản phẩm hơn nhé!"
              : "Xin lỗi, đã có lỗi xảy ra. Vui lòng thử lại sau."}
          </p>
          <div className="modal-action">
            <label
              htmlFor="my-modal"
              onClick={() => {
                setIsSubmitted(false); // Đặt lại trạng thái sau khi đóng
                setError(false);
              }}
              className="btn btn-success"
            >
              Đóng
            </label>
          </div>
        </div>
      </div>
      <div className="md:w-[50%]">
        <h1 className="text-3xl text-center font-bold p-5 bg-clip-text">
          Báo lỗi hoặc góp ý
        </h1>
        <textarea
          placeholder="Nhập phản hồi của bạn tại đây!"
          className="mt-5 mb-3 h-[30%] textarea textarea-bordered textarea-md w-full"
          value={response}
          onChange={(e) => setResponse(e.target.value)}
        ></textarea>
        <input
          type="email"
          placeholder="Email của bạn"
          className="input w-full max-w-xs"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            setEmailError(""); // Xóa lỗi khi người dùng nhập lại
          }}
        />
        {emailError && <p className="text-red-500">{emailError}</p>}
        <label
          htmlFor="my-modal"
          onClick={sendToFirebase}
          className="mt-5 w-full btn btn-primary btn-md bg-gradient-to-tl from-transparent via-blue-600 to-indigo-500"
        >
          Gửi ý kiến
        </label>
      </div>
    </div>
  );
}

export default IssuePage;
