# FaceNet

Built for HHGoa as Task 3.

FaceNet is a biometric verification and visual provenance tool. It detects faces in uploaded images, performs reverse visual lookups to find original sources, and registers cryptographic SHA-256 proofs on a local Ethereum (Ganache) blockchain.

---

## Requirements

- Python 3.10+
- Node.js 18+ and npm
- Ganache (running on port 7545)
- SerpApi API Key (optional, for live Google Lens searches)

---

## Setup

### 1. Clone the repository
```bash
git clone https://github.com/Puroonjay/FaceNet.git
cd FaceNet
```

### 2. Configure Environment Variables
Create a `.env` file in the `backend/` folder (or project root):

```env
GANACHE_URL=http://127.0.0.1:7545
SERPAPI_KEY=your_serpapi_key_here
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
```

### 3. Start Ganache
Make sure Ganache is running on port 7545:
```bash
ganache --port 7545
```

---

## How to Run

### Option A: Web Dashboard (Recommended)

#### 1. Start the Backend API
In the first terminal:
```bash
cd backend
python -m venv venv

# Activate virtual environment
# Windows:
.\venv\Scripts\activate
# Linux/macOS:
# source venv/bin/activate

pip install -r requirements.txt
python run.py
```
The backend server will automatically connect to Ganache, deploy the smart contract, and start on `http://127.0.0.1:8000`.

#### 2. Start the Frontend
In a second terminal:
```bash
cd task3-web
npm install
npm run dev
```
Open `http://localhost:3000` in your browser.

#### 3. Using the Web Dashboard
1. Upload an image (`.png`, `.jpg`, `.jpeg`, `.webp`).
2. Optional: Click the **Crop Tool** button to adjust the search area using the draggable crop box or presets.
3. Click **Run Verification Pipeline** to run the search and register the verification record on-chain.

---

### Option B: Command Line (CLI)

You can run the full pipeline directly on any image without starting the web interface:

```bash
cd backend
.\venv\Scripts\activate

python run.py --cli --image path/to/image.jpg
```

Optional: specify a custom Ganache RPC endpoint:
```bash
python run.py --cli --image path/to/image.jpg --rpc http://127.0.0.1:7545
```

#### Testing Tamper Detection

To test and demonstrate on-chain metadata tamper detection against an existing anchored block, pass `--spoof-author`:

```bash
python run.py --cli --image "path/to/image.jpg" --spoof-author "xyz"
```

This simulates an altered author claim against the on-chain genesis record in Ganache, triggering the `TAMPER_DETECTED` state and rendering a side-by-side diff.

---

## Project Structure

- `backend/` - FastAPI server, OpenCV face detection, reverse search, and Web3 blockchain attestation.
- `task3-web/` - Next.js web application with interactive ROI crop tool and live receipt verification.

---

Maintained by Team WeHustlers.
