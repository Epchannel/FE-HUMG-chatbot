# @title 🎤 HUMG ChatBot TTS API for Google Colab
# @markdown ### Triển khai TTS API trên Google Colab với ngrok

# @title 1. ⚙️ **Cài đặt Dependencies**
# @markdown 👈Nhấn nút này để cài đặt dependencies (~5 phút)

print("📦 Installing dependencies...")
!pip install flask flask-cors pyngrok -q
!pip install torch torchaudio --index-url https://download.pytorch.org/whl/cu118 -q
!pip install transformers==4.31.0 -q
!pip install vinorm==2.0.7 underthesea unidecode soundfile -q
!pip install deepspeed cutlet unidic==1.1.0 -q

# Setup timezone to Vietnam
!rm -f /etc/localtime
!ln -s /usr/share/zoneinfo/Asia/Ho_Chi_Minh /etc/localtime

# Download TTS library
!rm -rf TTS/
!git clone --branch add-vietnamese-xtts -q https://github.com/thinhlpg/TTS.git
!pip install --use-deprecated=legacy-resolver -q -e TTS

# Download unidic
!python -m unidic download

from IPython.display import clear_output
clear_output()
print("✅ Dependencies installed successfully!")

# @title 2. 🤖 **Tải Model TTS**
# @markdown 👈Nhấn nút này để tải model XTTS (~3 phút)

import os
from huggingface_hub import snapshot_download

print("📥 Downloading XTTS model...")
snapshot_download(
    repo_id="epchannel/EpXTTS",
    repo_type="model", 
    local_dir="model"
)

clear_output()
print("✅ Model downloaded successfully!")

# @title 3. 🚀 **Khởi động TTS API Server**
# @markdown 👈Nhấn nút này để khởi động server với ngrok

from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import os
import string
import unicodedata
from datetime import datetime
from pprint import pprint
import torch
import torchaudio
from tqdm import tqdm
from underthesea import sent_tokenize
from unidecode import unidecode
import tempfile
import soundfile as sf
from pathlib import Path
import threading
import time

try:
    from vinorm import TTSnorm
    from TTS.tts.configs.xtts_config import XttsConfig
    from TTS.tts.models.xtts import Xtts
except ImportError as e:
    print(f"Import error: {e}")

# Initialize Flask app
app = Flask(__name__)
CORS(app, resources={
    r"/*": {
        "origins": "*",
        "methods": ["GET", "POST", "OPTIONS"],
        "allow_headers": ["Content-Type", "ngrok-skip-browser-warning"]
    }
})

# Global variables
XTTS_MODEL = None
OUTPUT_DIR = "./output"

def clear_gpu_cache():
    if torch.cuda.is_available():
        torch.cuda.empty_cache()

def load_model(xtts_checkpoint, xtts_config, xtts_vocab):
    clear_gpu_cache()
    if not xtts_checkpoint or not xtts_config or not xtts_vocab:
        raise Exception("Missing model files")
    
    config = XttsConfig()
    config.load_json(xtts_config)
    model = Xtts.init_from_config(config)
    print("Loading XTTS model...")
    model.load_checkpoint(config,
                         checkpoint_path=xtts_checkpoint,
                         vocab_path=xtts_vocab,
                         use_deepspeed=False)
    if torch.cuda.is_available():
        model.cuda()
    print("Model loaded successfully!")
    return model

def get_file_name(text, max_char=50):
    filename = text[:max_char]
    filename = filename.lower()
    filename = filename.replace(" ", "_")
    filename = filename.translate(str.maketrans("", "", string.punctuation.replace("_", "")))
    filename = unidecode(filename)
    current_datetime = datetime.now().strftime("%m%d%H%M%S")
    filename = f"{current_datetime}_{filename}"
    return filename

def calculate_keep_len(text, lang):
    if lang in ["ja", "zh-cn"]:
        return -1
    word_count = len(text.split())
    num_punct = len([c for c in text if c in ".!?,"])

    if word_count < 5:
        return 15000 * word_count + 2000 * num_punct
    elif word_count < 10:
        return 13000 * word_count + 2000 * num_punct
    return -1

def normalize_vietnamese_text(text):
    text = (
        TTSnorm(text, unknown=False, lower=False, rule=True)
        .replace("..", ".")
        .replace("!.", "!")
        .replace("?.", "?")
        .replace(" .", ".")
        .replace(" ,", ",")
        .replace('"', "")
        .replace("'", "")
        .replace("AI", "Ây Ai")
        .replace("A.I", "Ây Ai")
        .replace("anh/chị", "anh chị")
        .replace("HUMG", "hát u mờ gờ")
    )
    return text

def run_tts(model, lang, tts_text, speaker_audio_file, normalize_text=True, verbose=False):
    """Run text-to-speech synthesis"""
    if model is None or not speaker_audio_file:
        raise Exception("Model not loaded or speaker audio file missing")

    os.makedirs(OUTPUT_DIR, exist_ok=True)

    gpt_cond_latent, speaker_embedding = model.get_conditioning_latents(
        audio_path=speaker_audio_file,
        gpt_cond_len=model.config.gpt_cond_len,
        max_ref_length=model.config.max_ref_len,
        sound_norm_refs=model.config.sound_norm_refs,
    )

    if normalize_text and lang == "vi":
        try:
            tts_text = normalize_vietnamese_text(tts_text)
        except Exception as e:
            print(f"Text normalization error: {e}")

    if lang in ["ja", "zh-cn"]:
        tts_texts = tts_text.split("。")
    else:
        tts_texts = sent_tokenize(tts_text)

    if verbose:
        print("Text for TTS:")
        pprint(tts_texts)

    wav_chunks = []
    for text in tqdm(tts_texts):
        if text.strip() == "":
            continue

        wav_chunk = model.inference(
            text=text,
            language=lang,
            gpt_cond_latent=gpt_cond_latent,
            speaker_embedding=speaker_embedding,
            temperature=0.3,
            length_penalty=1.0,
            repetition_penalty=10.0,
            top_k=30,
            top_p=0.85,
        )

        # Quick hack for short sentences
        keep_len = calculate_keep_len(text, lang)
        wav_chunk["wav"] = torch.tensor(wav_chunk["wav"][:keep_len])
        wav_chunks.append(wav_chunk["wav"])

    out_wav = torch.cat(wav_chunks, dim=0).unsqueeze(0)
    
    # Create temporary file
    with tempfile.NamedTemporaryFile(delete=False, suffix='.mp3', dir=OUTPUT_DIR) as tmp_file:
        sf.write(tmp_file.name, out_wav.squeeze(0).numpy(), 24000, format='MP3')
        return tmp_file.name

# Initialize model function
def initialize_model():
    global XTTS_MODEL
    try:
        model_path = "model"
        XTTS_MODEL = load_model(
            xtts_checkpoint=f"{model_path}/model.pth",
            xtts_config=f"{model_path}/config.json",
            xtts_vocab=f"{model_path}/vocab.json"
        )
        print("🤖 TTS Model initialized successfully!")
    except Exception as e:
        print(f"❌ Failed to initialize model: {e}")
        XTTS_MODEL = None

# API Routes
@app.route('/health', methods=['GET', 'OPTIONS'])
def health_check():
    """Health check endpoint"""
    if request.method == 'OPTIONS':
        return '', 200
    return jsonify({
        "status": "healthy",
        "model_loaded": XTTS_MODEL is not None,
        "server": "Google Colab + ngrok"
    })

@app.route('/tts', methods=['POST', 'OPTIONS'])
def text_to_speech():
    """Text-to-speech endpoint"""
    if request.method == 'OPTIONS':
        return '', 200
        
    try:
        if XTTS_MODEL is None:
            return jsonify({"error": "TTS model not loaded"}), 500

        data = request.get_json()
        
        if not data or 'text' not in data:
            return jsonify({"error": "Missing 'text' field in request"}), 400

        text = data['text']
        language = data.get('language', 'vi')
        reference_audio = data.get('reference_audio', 'model/samples/bongxinh.wav')
        normalize_text = data.get('normalize_text', True)
        
        # Validate inputs
        if not text.strip():
            return jsonify({"error": "Text cannot be empty"}), 400
            
        if not os.path.exists(reference_audio):
            # Try to find any available sample file
            samples_dir = "model/samples"
            if os.path.exists(samples_dir):
                sample_files = [f for f in os.listdir(samples_dir) if f.endswith('.wav')]
                if sample_files:
                    reference_audio = os.path.join(samples_dir, sample_files[0])
                    print(f"Using available sample: {reference_audio}")
                else:
                    return jsonify({"error": "No sample audio files found"}), 400
            else:
                return jsonify({"error": f"Reference audio file not found: {reference_audio}"}), 400

        # Generate audio
        audio_file_path = run_tts(
            model=XTTS_MODEL,
            lang=language,
            tts_text=text,
            speaker_audio_file=reference_audio,
            normalize_text=normalize_text,
            verbose=False
        )
        
        return send_file(
            audio_file_path,
            as_attachment=True,
            download_name=f"tts_{get_file_name(text)}.mp3",
            mimetype='audio/mpeg'
        )

    except Exception as e:
        print(f"TTS Error: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/voices', methods=['GET', 'OPTIONS'])
def get_available_voices():
    """Get list of available reference voices"""
    if request.method == 'OPTIONS':
        return '', 200
        
    voices_dir = "model/samples"
    voices = []
    
    if os.path.exists(voices_dir):
        for file in os.listdir(voices_dir):
            if file.endswith('.wav'):
                voices.append({
                    "filename": file,
                    "path": os.path.join(voices_dir, file),
                    "name": file.replace('.wav', '').replace('-', ' ').title()
                })
    
    return jsonify({"voices": voices})

@app.route('/languages', methods=['GET', 'OPTIONS'])
def get_supported_languages():
    """Get list of supported languages"""
    if request.method == 'OPTIONS':
        return '', 200
        
    languages = {
        "vi": "Tiếng Việt",
        "en": "English",
        "es": "Español",
        "fr": "Français", 
        "de": "Deutsch",
        "it": "Italiano",
        "pt": "Português",
        "pl": "Polski",
        "tr": "Türkçe",
        "ru": "Русский",
        "nl": "Nederlands",
        "cs": "Čeština",
        "ar": "العربية",
        "zh-cn": "中文",
        "ja": "日本語",
        "hu": "Magyar",
        "ko": "한국어",
        "hi": "हिन्दी"
    }
    return jsonify({"languages": languages})

# Ngrok setup function
def setup_ngrok():
    """Setup ngrok tunnel"""
    try:
        from pyngrok import ngrok
        
        # Set auth token
        ngrok.set_auth_token("2g68ST79tRDGjbSO1u690yKyKK3_4rxwqkDCe9McUDLrDDb3j")
        
        # Connect with fixed hostname
        public_url = ngrok.connect(addr=8000, hostname="aware-mutt-upward.ngrok-free.app")
        
        print(f"🌐 Ngrok tunnel established!")
        print(f"🔗 Public URL: {public_url}")
        print(f"📱 API Base URL: {public_url}")
        print(f"🏥 Health check: {public_url}/health")
        print(f"🎤 TTS endpoint: {public_url}/tts")
        
        return str(public_url)
        
    except Exception as e:
        print(f"❌ Ngrok setup failed: {e}")
        return None

# Server runner function
def run_server():
    """Run Flask server"""
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    
    print("🚀 Starting TTS API Server on Colab...")
    
    # Initialize model
    print("🤖 Loading TTS model...")
    initialize_model()
    
    if XTTS_MODEL is None:
        print("❌ Failed to load model. Please check model files.")
        return
    
    # Setup ngrok
    public_url = setup_ngrok()
    
    if public_url:
        print("\n" + "="*60)
        print("🎉 TTS API Server is ready!")
        print("="*60)
        print(f"🌍 Public URL: {public_url}")
        print(f"🔧 Update your ChatBot.jsx with this URL:")
        print(f"   const TTS_API_URL = '{public_url}';")
        print("="*60)
    
    # Run server
    try:
        app.run(host='0.0.0.0', port=8000, debug=False, use_reloader=False)
    except KeyboardInterrupt:
        print("\n🛑 Server stopped")

# Start server in background thread
server_thread = threading.Thread(target=run_server, daemon=True)
server_thread.start()

# Wait a moment for server to start
time.sleep(3)

print("🎤 TTS API Server started!")
print("📝 Server logs will appear above.")
print("⏳ Please wait for 'TTS API Server is ready!' message.")
print("💡 Copy the public URL to update your ChatBot frontend.") 