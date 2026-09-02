import os
from pathlib import Path
from typing import Tuple, Dict, Any, Union
import solcx
from web3 import Web3
from hexbytes import HexBytes

try:
    from dotenv import load_dotenv
    # Load .env from backend/ or root
    load_dotenv(Path(__file__).resolve().parent / ".env")
    load_dotenv(Path(__file__).resolve().parent.parent / ".env")
except ImportError:
    pass

GANACHE_URL = os.getenv("GANACHE_URL", "http://127.0.0.1:7545")
DEFAULT_SOLC_VERSION = "0.8.20"


def ensure_solc_installed(version: str = DEFAULT_SOLC_VERSION) -> str:
    """
    Checks if the specified solc version is installed; if not, installs it.
    Sets the active solc version.
    """
    installed_versions = [str(v) for v in solcx.get_installed_solc_versions()]
    if version not in installed_versions:
        solcx.install_solc(version)
    solcx.set_solc_version(version)
    return version


def get_web3(rpc_url: str = GANACHE_URL) -> Web3:
    """
    Establishes and verifies connection to the Ganache EVM node.
    """
    w3 = Web3(Web3.HTTPProvider(rpc_url))
    if not w3.is_connected():
        raise ConnectionError(
            f"Failed to connect to Ganache EVM at {rpc_url}. "
            "Please ensure Ganache is running and accessible."
        )
    return w3


def _format_data_hash(data_hash: Union[str, bytes, HexBytes]) -> bytes:
    """
    Normalizes a data hash into 32 bytes for Solidity bytes32 parameter.
    """
    if isinstance(data_hash, str):
        cleaned = data_hash.strip()
        if cleaned.startswith("0x") or cleaned.startswith("0X"):
            cleaned = cleaned[2:]
        # Pad or slice to 64 hex characters (32 bytes)
        cleaned = cleaned.zfill(64)[:64]
        return bytes.fromhex(cleaned)
    elif isinstance(data_hash, (bytes, HexBytes)):
        if len(data_hash) == 32:
            return bytes(data_hash)
        elif len(data_hash) < 32:
            return bytes(data_hash).rjust(32, b"\x00")
        else:
            return bytes(data_hash[:32])
    raise ValueError(f"Unsupported data_hash format: {type(data_hash)}")


def compile_and_deploy(
    contract_path: Union[str, Path] = None,
    rpc_url: str = GANACHE_URL,
) -> Tuple[str, list]:
    """
    Compiles contracts/FaceRegistry.sol and deploys it using Ganache primary account.
    Returns (contract_address, contract_abi).
    """
    ensure_solc_installed(DEFAULT_SOLC_VERSION)
    w3 = get_web3(rpc_url)

    if not w3.eth.accounts:
        raise ValueError(
            "No unlocked accounts found on Ganache node. "
            "Please ensure Ganache initialized default accounts."
        )

    deployer_account = w3.eth.accounts[0]

    # Resolve contract path
    if contract_path is None:
        base_dir = Path(__file__).resolve().parent
        contract_path = base_dir / "contracts" / "FaceRegistry.sol"
    else:
        contract_path = Path(contract_path)

    if not contract_path.exists():
        raise FileNotFoundError(f"Contract file not found at: {contract_path}")

    # Compile the Solidity contract with paris EVM (compatible with Ganache Merge hardfork)
    compiled_sol = solcx.compile_files(
        [str(contract_path)],
        output_values=["abi", "bin"],
        solc_version=DEFAULT_SOLC_VERSION,
        evm_version="paris",
    )

    # Find the FaceRegistry contract entry
    contract_key = None
    for key in compiled_sol.keys():
        if key.endswith(":FaceRegistry") or "FaceRegistry" in key:
            contract_key = key
            break

    if not contract_key:
        raise RuntimeError("FaceRegistry contract not found in compilation output.")

    contract_interface = compiled_sol[contract_key]
    abi = contract_interface["abi"]
    bytecode = contract_interface["bin"]

    # Deploy contract
    FaceRegistry = w3.eth.contract(abi=abi, bytecode=bytecode)
    tx_hash = FaceRegistry.constructor().transact({"from": deployer_account})
    receipt = w3.eth.wait_for_transaction_receipt(tx_hash)

    contract_address = receipt.contractAddress if hasattr(receipt, "contractAddress") else receipt.get("contractAddress")
    if not contract_address:
        raise RuntimeError("Contract deployment failed; no contract address returned in receipt.")

    return contract_address, abi


def register_record(
    contract_addr: str,
    abi: list,
    data_hash_bytes: Union[str, bytes, HexBytes],
    source_url: str,
    platform: str,
    author: str,
    rpc_url: str = GANACHE_URL,
) -> Dict[str, Any]:
    """
    Sends a transaction to registerRecord on FaceRegistry contract.
    Returns transaction hash, block number, and gas used.
    """
    w3 = get_web3(rpc_url)

    if not w3.eth.accounts:
        raise ValueError("No unlocked accounts available on Ganache.")

    account = w3.eth.accounts[0]
    contract = w3.eth.contract(address=w3.to_checksum_address(contract_addr), abi=abi)

    data_hash_formatted = _format_data_hash(data_hash_bytes)

    tx_hash = contract.functions.registerRecord(
        data_hash_formatted,
        source_url,
        platform,
        author,
    ).transact({"from": account})

    receipt = w3.eth.wait_for_transaction_receipt(tx_hash)

    block_number = receipt.blockNumber if hasattr(receipt, "blockNumber") else receipt.get("blockNumber")
    gas_used = receipt.gasUsed if hasattr(receipt, "gasUsed") else receipt.get("gasUsed")
    tx_hash_hex = tx_hash.hex() if hasattr(tx_hash, "hex") else str(tx_hash)

    return {
        "tx_hash": tx_hash_hex,
        "block_number": block_number,
        "gas_used": gas_used,
    }


def verify_record(
    contract_addr: str,
    abi: list,
    data_hash_bytes: Union[str, bytes, HexBytes],
    rpc_url: str = GANACHE_URL,
) -> Dict[str, Any]:
    """
    Calls getRecord view function on FaceRegistry contract.
    Returns verification status, block number, and metadata stored on chain.
    """
    w3 = get_web3(rpc_url)
    contract = w3.eth.contract(address=w3.to_checksum_address(contract_addr), abi=abi)

    data_hash_formatted = _format_data_hash(data_hash_bytes)

    func = getattr(contract.functions, "getRecord", contract.functions.verifyRecord)
    raw_res = func(data_hash_formatted).call()

    # Handle 7-tuple (with blockNumber) or 6-tuple fallback
    if len(raw_res) == 7:
        exists, timestamp, block_number, source_url, platform, author, registered_by = raw_res
    else:
        exists, timestamp, source_url, platform, author, registered_by = raw_res
        block_number = 0

    return {
        "is_verified": exists and timestamp > 0,
        "timestamp": timestamp,
        "block_number": block_number,
        "source_url": source_url,
        "platform": platform,
        "author": author,
        "registered_by": registered_by,
    }
