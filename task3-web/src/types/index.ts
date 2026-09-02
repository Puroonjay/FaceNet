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

export interface StoredRecord {
  author?: string;
  platform?: string;
  source_url?: string;
  timestamp?: number;
  registered_by?: string;
}

export interface TamperDetails {
  stored_author?: string;
  live_author?: string;
  stored_platform?: string;
  live_platform?: string;
  stored_url?: string;
  live_url?: string;
  author_mismatch?: boolean;
  platform_mismatch?: boolean;
  url_mismatch?: boolean;
}

export interface BlockchainResult {
  is_verified: boolean;
  is_tampered?: boolean;
  is_re_scan?: boolean;
  verification_status?: "VERIFIED" | "ALREADY_VERIFIED" | "TAMPER_DETECTED" | string;
  tx_hash: string;
  block_number: number;
  gas_used: number;
  hash_hex: string;
  on_chain_timestamp: number;
  contract_address?: string;
  registered_by?: string;
  stored_record?: StoredRecord | null;
  tamper_details?: TamperDetails | null;
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
