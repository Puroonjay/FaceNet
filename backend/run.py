import os
import sys
import argparse
import time
from pathlib import Path
from typing import Optional
from contextlib import asynccontextmanager

# Suppress verbose OpenCV DNN graph engine warnings
os.environ["OPENCV_LOG_LEVEL"] = "ERROR"

try:
    from dotenv import load_dotenv
    load_dotenv(Path(__file__).resolve().parent / ".env")
    load_dotenv(Path(__file__).resolve().parent.parent / ".env")
except ImportError:
    pass

import cv2
import numpy as np

try:
    if hasattr(cv2, "utils") and hasattr(cv2.utils, "logging"):
        cv2.utils.logging.setLogLevel(cv2.utils.logging.LOG_LEVEL_ERROR)
except Exception:
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
    print("[init] facenet pipeline api server")
    print(f"  rpc endpoint:   {GANACHE_URL}")

    try:
        CONTRACT_ADDR, CONTRACT_ABI = get_or_deploy_contract(rpc_url=GANACHE_URL)
        print(f"  contract:       {CONTRACT_ADDR} (FaceRegistry ready)")
    except Exception as e:
        print(f"  contract:       warning: could not connect to ganache ({e})")

    yield
    print("[shutdown] server stopped.")


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
    Executes the pipeline in standalone CLI mode with clean developer terminal output.
    """
    path = Path(image_path)
    if not path.exists():
        print(f"error: image file not found: {image_path}", file=sys.stderr)
        sys.exit(1)

    file_size_kb = path.stat().st_size / 1024

    with open(path, "rb") as f:
        image_bytes = f.read()

    # Initialization & Contract
    print(f"\n[init] payload: {path.name} ({file_size_kb:.2f} KB)")
    print(f"  rpc:            {rpc_url}")
    try:
        contract_addr, abi = get_or_deploy_contract(rpc_url=rpc_url)
        print(f"  contract:       {contract_addr}")
    except Exception as e:
        print(f"  contract:       error: failed to connect ({e})", file=sys.stderr)
        sys.exit(1)

    # Step 1: Computer Vision & Face ROI
    print("\n[vision] face roi localization")
    cropped_bytes, detection_info = detect_and_crop_face(image_bytes)

    if isinstance(detection_info, (list, tuple)):
        raw_box = list(detection_info)
        try:
            nparr = np.frombuffer(image_bytes, np.uint8)
            img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            h_img, w_img = (int(img.shape[0]), int(img.shape[1])) if img is not None else (0, 0)
        except Exception:
            h_img, w_img = 0, 0

        has_face = bool(raw_box != [0, 0, 0, 0] and raw_box != [0, 0, w_img, h_img])
        if has_face:
            print("  status:         face localized")
            print(f"  bounding box:   [x:{raw_box[0]}, y:{raw_box[1]}, w:{raw_box[2]}, h:{raw_box[3]}]")
            print(f"  crop context:   {len(cropped_bytes) / 1024:.2f} KB (35% margin)")
        else:
            print("  status:         no frontal face detected")
            print(f"  buffer:         full frame ({len(cropped_bytes) / 1024:.2f} KB)")
    elif isinstance(detection_info, dict):
        if detection_info.get("face_detected"):
            bbox = detection_info.get("bounding_box", [])
            print("  status:         face localized")
            print(f"  bounding box:   [x:{bbox[0]}, y:{bbox[1]}, w:{bbox[2]}, h:{bbox[3]}]")
            print(f"  crop context:   {len(cropped_bytes) / 1024:.2f} KB (35% margin)")
        else:
            print("  status:         no frontal face detected")
            print(f"  buffer:         full frame ({len(cropped_bytes) / 1024:.2f} KB)")

    # Step 2: Reverse Visual Graph Lookup
    print("\n[osint] reverse visual graph resolver")
    match_info = search_reverse_match(image_bytes)
    source = match_info.get("source", "Web")
    match_type = match_info.get("match_type", "Visual")
    title = match_info.get("title", "No title metadata")
    link = match_info.get("link", "")
    author = match_info.get("author", "")

    print(f"  source:         {source} ({match_type})")
    print(f"  title:          {title}")
    if author:
        print(f"  author:         {author}")
    print(f"  target url:     {link if link else 'none'}")

    # Step 3: SHA-256 Digest & Blockchain Attestation
    print("\n[evm] blockchain ledger attestation")
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
        v_status = blockchain.get("verification_status", "VERIFIED")
        tx_hash = blockchain.get("tx_hash", "0x")
        block_num = blockchain.get("block_number", 0)
        gas_used = blockchain.get("gas_used", 0)
        hash_hex = blockchain.get("hash_hex", "")
        on_chain_ts = blockchain.get("on_chain_timestamp", 0)
        registered_by = blockchain.get("registered_by", "")
        tamper_details = blockchain.get("tamper_details")

        print(f"  state root:     {hash_hex}")

        if v_status == "VERIFIED":
            print(f"  tx hash:        {tx_hash}")
            print(f"  block:          #{block_num}")
            print(f"  gas used:       {gas_used:,} units")
            print(f"  latency:        {elapsed:.3f}s")
            print(f"\n✓ status: VERIFIED (block #{block_num}, {gas_used:,} gas, {elapsed:.3f}s)\n")

        elif v_status == "ALREADY_VERIFIED":
            if registered_by:
                print(f"  registered by:  {registered_by}")
            if on_chain_ts:
                ts_str = time.strftime('%Y-%m-%d %H:%M:%S UTC', time.gmtime(on_chain_ts))
                print(f"  registered at:  {ts_str}")
            print(f"  latency:        {elapsed:.3f}s")
            print(f"\n✓ status: ALREADY VERIFIED (Original Post Untampered)\n")

        elif v_status == "TAMPER_DETECTED":
            if registered_by:
                print(f"  registered by:  {registered_by}")
            if on_chain_ts:
                ts_str = time.strftime('%Y-%m-%d %H:%M:%S UTC', time.gmtime(on_chain_ts))
                print(f"  registered at:  {ts_str}")
            print(f"  latency:        {elapsed:.3f}s")
            print("\n⚠ TAMPER ALERT: Visual match verified, but post metadata has been manipulated!")
            if tamper_details:
                print(f"  • On-Chain Author:   {tamper_details.get('stored_author', 'N/A')}")
                print(f"  • Live Scraped:      {tamper_details.get('live_author', 'N/A')}")
                print(f"  • On-Chain Source:   {tamper_details.get('stored_platform', 'N/A')}")
                print(f"  • Live Scraped:      {tamper_details.get('live_platform', 'N/A')}")
            print()
    except Exception as e:
        print(f"\nerror: attestation failed: {e}\n", file=sys.stderr)
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

    args = parser.parse_args()

    if args.cli:
        if not args.image:
            print("error: missing required argument: --image / -i <path_to_image>", file=sys.stderr)
            sys.exit(1)
        run_cli_mode(image_path=args.image, rpc_url=args.rpc)
    else:
        uvicorn.run(app, host=args.host, port=args.port)


if __name__ == "__main__":
    main()
