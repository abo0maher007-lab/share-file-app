import * as FileSystem from 'expo-file-system';
import * as Crypto from 'expo-crypto';
import CryptoJS from 'crypto-js';
import { FileMeta, ChunkPacket } from '../types';

export const CHUNK_SIZE = 64 * 1024; // 64 KB Per Chunk

export class ChunkerService {
  static async generateFileHash(fileUri: string): Promise<string> {
    const fileContent = await FileSystem.readAsStringAsync(fileUri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    return await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      fileContent
    );
  }

  static async getFileMetadata(fileUri: string, fileName: string, mimeType: string): Promise<FileMeta> {
    const fileInfo = await FileSystem.getInfoAsync(fileUri);
    if (!fileInfo.exists) throw new Error('File does not exist');

    const sha256 = await this.generateFileHash(fileUri);
    const totalChunks = Math.ceil(fileInfo.size / CHUNK_SIZE);

    return {
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      name: fileName,
      size: fileInfo.size,
      mimeType,
      sha256,
      totalChunks,
    };
  }

  static async readChunk(
    fileUri: string,
    chunkIndex: number,
    secretKey?: string
  ): Promise<string> {
    const start = chunkIndex * CHUNK_SIZE;
    const base64Data = await FileSystem.readAsStringAsync(fileUri, {
      encoding: FileSystem.EncodingType.Base64,
      position: start,
      length: CHUNK_SIZE,
    });

    if (secretKey) {
      return CryptoJS.AES.encrypt(base64Data, secretKey).toString();
    }
    return base64Data;
  }

  static decryptChunk(encryptedData: string, secretKey: string): string {
    const bytes = CryptoJS.AES.decrypt(encryptedData, secretKey);
    return bytes.toString(CryptoJS.enc.Utf8);
  }

  static async verifyChunkChecksum(data: string, expectedChecksum: string): Promise<boolean> {
    const hash = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      data
    );
    return hash === expectedChecksum;
  }
}
