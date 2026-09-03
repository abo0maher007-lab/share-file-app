export interface FileMeta {
  id: string;
  name: string;
  size: number;
  mimeType: string;
  sha256: string;
  totalChunks: number;
}

export interface ChunkPacket {
  fileId: string;
  chunkIndex: number;
  totalChunks: number;
  data: string; // Base64
  checksum: string; // SHA-256 for chunk
}

export interface TransferProgressState {
  fileId: string;
  fileName: string;
  transferredBytes: number;
  totalBytes: number;
  percentage: number;
  status: 'idle' | 'transferring' | 'paused' | 'completed' | 'error';
  errorMessage?: string;
}

export interface DeviceInfo {
  id: string;
  name: string;
  ipAddress?: string;
  rssi?: number;
  type: 'webrtc' | 'ble';
}
