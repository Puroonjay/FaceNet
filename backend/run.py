import os
import sys
import argparse
import time
from pathlib import Path
from typing import Optional
from contextlib import asynccontextmanager

try:
    from dotenv import load_dotenv
    load_dotenv(Path(__file__).resolve().parent / ".env")
    load_dotenv(Path(__file__).resolve().parent.parent / ".env")
except ImportError:
    pass

from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

from blockchain_service import GANACHE_URL
from pipeline_core import (
    run_pipeline,
    get_or_deploy_contract,
    detect_and_crop_face,
    search_reverse_match,
    compute_fingerprint,
)

# Global contract state
CONTRACT_ADDR: Optional[str] = None
CONTRACT_ABI: Optional[list] = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Lifecycle event handler to auto-connect / deploy Ganache contract on server start.
    """
    global CONTRACT_ADDR, CONTRACT_ABI
    print("=" * 60)
    print("FaceNet // Task 3 Pipeline API Server")
    print(f"Ganache RPC URL: {GANACHE_URL}")
    print("=" * 60)

    try:
        print("[Startup] Initializing Ganache EVM connection and smart contract...")
        CONTRACT_ADDR, CONTRACT_ABI = get_or_deploy_contract(rpc_url=GANACHE_URL)
        print(f"[Startup] ✓ FaceRegistry contract ready at: {CONTRACT_ADDR}")
    except Exception as e:
        print(f"[Startup] ⚠ Warning: Could not initialize Ganache contract at startup: {e}")
        print("[Startup] Will attempt on-demand deployment when verification requests arrive.")

    yield
    print("[Shutdown] Server shutting down.")


# Initialize FastAPI App
app = FastAPI(
    title="FaceNet // Task 3 Pipeline API",
    description="API for Face Detection, Reverse Visual Search, and Ganache EVM Attestation",
    version="1.0.0",
    lifespan=lifespan,
)

# Configure CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def root():
    return {
        "service": "FaceNet Task 3 Pipeline",
        "status": "active",
        "contract_address": CONTRACT_ADDR,
        "endpoints": {
            "health": "/api/health",
            "verify": "POST /api/verify",
        },
    }


@app.get("/health")
@app.get("/api/health")
def health_check():
    """
    Health check endpoint for backend connectivity indicator.
    """
    return {"status": "active"}


@app.post("/api/verify")
async def verify_image(file: UploadFile = File(...)):
    """
    Receives an image file via multipart/form-data, processes it through
    the multi-stage verification pipeline, and returns on-chain proof.
    """
    global CONTRACT_ADDR, CONTRACT_ABI

    if not file or not file.filename:
        raise HTTPException(status_code=400, detail="No file provided in request.")

    # Read binary content
    try:
        image_bytes = await file.read()
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to read uploaded file: {str(e)}")

    if not image_bytes or len(image_bytes) == 0:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")

    # Ensure contract is deployed / available
    try:
        if not CONTRACT_ADDR or not CONTRACT_ABI:
            CONTRACT_ADDR, CONTRACT_ABI = get_or_deploy_contract(rpc_url=GANACHE_URL)
    except Exception as e:
        raise HTTPException(
            status_code=503,
            detail=f"Ganache EVM node unavailable at {GANACHE_URL}. Please ensure Ganache is running. Error: {str(e)}",
        )

    # Run verification pipeline
    try:
        result = run_pipeline(
            image_bytes=image_bytes,
            contract_addr=CONTRACT_ADDR,
            abi=CONTRACT_ABI,
            rpc_url=GANACHE_URL,
        )
        return result
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Pipeline execution failed: {str(e)}",
        )


if hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
        sys.stderr.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass


def run_cli_mode(image_path: str, rpc_url: str = GANACHE_URL):
    """
    Executes the pipeline in standalone CLI mode and prints formatted progress.
    """
    path = Path(image_path)
    if not path.exists():
        print(f"\n[-] ERROR: Image file not found: {image_path}")
        sys.exit(1)

    print("\n" + "=" * 65)
    print("  FaceNet // Standalone CLI Pipeline Execution")
    print("=" * 65)
    print(f"Target Image File : {path.resolve()}")
    print(f"File Size         : {path.stat().st_size / 1024:.2f} KB")
    print(f"Ganache RPC URL   : {rpc_url}")
    print("-" * 65)

    with open(path, "rb") as f:
        image_bytes = f.read()

    # Step 0: Deploy/Connect Contract
    print("\n[0/3] Connecting to Ganache EVM & Smart Contract...")
    try:
        contract_addr, abi = get_or_deploy_contract(rpc_url=rpc_url)
        print(f"      [+] FaceRegistry Contract: {contract_addr}")
    except Exception as e:
        print(f"      [-] Failed to connect to Ganache: {e}")
        sys.exit(1)

    # Step 1: Face Crop
    print("\n[1/3] Detecting Face & Normalizing...")
    cropped_bytes, detection_info = detect_and_crop_face(image_bytes)
    if detection_info.get("face_detected"):
        bbox = detection_info.get("bounding_box", [])
        print(f"      [+] Face localized at ROI [x:{bbox[0]}, y:{bbox[1]}, w:{bbox[2]}, h:{bbox[3]}]")
        print(f"      [+] Cropped with 15% margin ({len(cropped_bytes) / 1024:.2f} KB)")
    else:
        print(f"      [*] No frontal face isolated; using full frame buffer ({len(cropped_bytes) / 1024:.2f} KB)")

    # Step 2: Reverse Visual Search
    print("\n[2/3] Querying Reverse Visual Search Index...")
    match_info = search_reverse_match(cropped_bytes)
    print(f"      [+] Discovered Source : {match_info.get('source', 'Web')}")
    print(f"      [+] Profile / Title   : {match_info.get('title', 'N/A')}")
    print(f"      [+] Target Link       : {match_info.get('link', 'N/A')}")
    print(f"      [+] Author / Handle   : {match_info.get('author', 'N/A')}")

    # Step 3: SHA-256 Digest & Blockchain Attestation
    print("\n[3/3] Mining Ganache EVM Attestation Block...")
    t0 = time.time()
    try:
        pipeline_result = run_pipeline(
            image_bytes=image_bytes,
            contract_addr=contract_addr,
            abi=abi,
            rpc_url=rpc_url,
        )
        elapsed = time.time() - t0
        blockchain = pipeline_result.get("blockchain", {})

        print(f"      [+] Transaction Mined in {elapsed:.3f}s")
        print("\n" + "=" * 65)
        print("  VERIFICATION RESULT: ON-CHAIN ATTESTED [OK]")
        print("=" * 65)
        print(f"  Status        : {'VERIFIED' if blockchain.get('is_verified') else 'UNVERIFIED'}")
        print(f"  Block Number  : #{blockchain.get('block_number')}")
        print(f"  Tx Hash       : {blockchain.get('tx_hash')}")
        print(f"  SHA-256 Digest: {blockchain.get('hash_hex')}")
        print(f"  Gas Used      : {blockchain.get('gas_used'):,} units")
        print(f"  Timestamp     : {blockchain.get('on_chain_timestamp')}")
        print("=" * 65 + "\n")
    except Exception as e:
        print(f"      [-] Pipeline attestation failed: {e}")
        sys.exit(1)


def main():
    parser = argparse.ArgumentParser(
        description="FaceNet // Task 3 Pipeline Server & CLI Runner"
    )
    parser.add_argument(
        "--cli",
        action="store_true",
        help="Run in standalone CLI execution mode instead of starting the Web API server",
    )
    parser.add_argument(
        "--image",
        "-i",
        type=str,
        help="Path to image file (required when --cli is used)",
    )
    parser.add_argument(
        "--rpc",
        type=str,
        default=GANACHE_URL,
        help=f"Ganache EVM RPC endpoint URL (default: {GANACHE_URL})",
    )
    parser.add_argument(
        "--host",
        type=str,
        default="127.0.0.1",
        help="Server host to bind (default: 127.0.0.1)",
    )
    parser.add_argument(
        "--port",
        type=int,
        default=8000,
        help="Server port to bind (default: 8000)",
    )
    parser.add_argument(
        "--reload",
        action="store_true",
        help="Enable auto-reload for Uvicorn server",
    )

    args = parser.parse_args()

    if args.cli:
        if not args.image:
            print("[ERROR] Argument --image / -i <path> is required when running in --cli mode.")
            sys.exit(1)
        run_cli_mode(image_path=args.image, rpc_url=args.rpc)
    else:
        print(f"Starting FastAPI Web Server on http://{args.host}:{args.port}...")
        uvicorn.run(
            "run:app",
            host=args.host,
            port=args.port,
            reload=args.reload,
        )


if __name__ == "__main__":
    main()
