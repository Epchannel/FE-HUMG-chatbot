# Fix CORS cho FastAPI Backend

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# Thiết lập CORS
origins = [
    "https://chatbothumg.com",  # Domain chính của bạn
    "http://localhost:3000",   # Cho development
    "http://localhost:5173",   # Cho Vite dev server
    "http://127.0.0.1:3000",
    "*"  # Cho phép tất cả (không an toàn cho production)
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# Hoặc nếu muốn allow tất cả (development only):
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/ask/")
async def ask_question(request: dict):
    # Your chatbot logic here
    pass 