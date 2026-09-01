# FaceNet // Task 3 Pipeline

A full-stack biometric verification and blockchain attestation system.

## Architecture

- **`backend/`**: Python / FastAPI pipeline & EVM blockchain layer:
  - **Face Detection**: OpenCV Haar Cascade cropping with 15% ROI margin expansion.
  - **Reverse Visual Search**: SerpApi Google Lens reverse image lookup.
  - **SHA-256 Fingerprinting**: Deterministic 32-byte digest generation for `bytes32`.
  - **Smart Contract (`FaceRegistry.sol`)**: Solidity `^0.8.0` contract for immutable on-chain record registration and verification.
  - **Blockchain Service (`blockchain_service.py`)**: `web3.py` & `py-solc-x` service managing solc 0.8.20 compilation, Ganache deployment, registration, and querying.
- **`task3-web/`**: Next.js (App Router, Tailwind CSS, TypeScript) developer dashboard for pipeline execution and real-time EVM receipt verification.

## Getting Started

### 1. Backend Setup
```bash
cd backend
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt
```

### 2. Frontend Setup
```bash
cd task3-web
npm install
npm run dev
```
