export interface DetectionResult {
  face_detected?: boolean;
  bounding_box?: [number, number, number, number] | null;
  expanded_box?: [number, number, number, number] | null;
  image_dimensions?: [number, number];
  cropped_dimensions?: [number, number];
}

export interface MatchResult {
  title: string;
  link: string;
  source: string;
  author?: string;
  similarity?: string;
  match_type?: string;
}

export interface BlockchainResult {
  is_verified: boolean;
  tx_hash: string;
  block_number: number;
  gas_used: number;
  hash_hex: string;
  on_chain_timestamp: number;
  contract_address?: string;
}

export interface VerificationResponse {
  detection?: DetectionResult;
  match: MatchResult;
  blockchain: BlockchainResult;
}

export interface CropBox {
  x: number; // percentage 0-100
  y: number; // percentage 0-100
  w: number; // percentage 0-100
  h: number; // percentage 0-100
}

export interface SystemLogEntry {
  id: string;
  timestamp: string;
  level: "INFO" | "OK" | "WARN" | "ERR" | "EVM";
  subsystem: "SYS" | "VISION" | "OSINT" | "EVM" | "NET";
  message: string;
}

export type PipelinePhase = "IDLE" | "INGESTING" | "DETECTING" | "RESOLVING_OSINT" | "ATTESTING_EVM" | "COMPLETE" | "ERROR";
