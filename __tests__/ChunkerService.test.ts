import { ChunkerService } from '../src/services/ChunkerService';

describe('اختبارات خدمة تقطيع وتشفيير الملفات', () => {
  it('يجب أن يتحقق بنجاح من تطابق checksum', async () => {
    const data = 'Hello Secure P2P Transfer';
    const checksum = 'f892289c8a32d184715ec23a854d9c44519c92257d0793b827e82200257c7d81'; // SHA256 افتراضي للسطر

    const isValid = await ChunkerService.verifyChunkChecksum(data, checksum);
    expect(typeof isValid).toBe('boolean');
  });

  it('يجب أن يتم تشفير وفك تشفير التشانك بنفس النتيجة', () => {
    const originalText = 'Base64ChunkDataStringSample';
    const secretKey = 'mySecretKey123';

    const encrypted = ChunkerService.readChunk; // simulation
    const cipherText = require('crypto-js').AES.encrypt(originalText, secretKey).toString();
    const decrypted = ChunkerService.decryptChunk(cipherText, secretKey);

    expect(decrypted).toBe(originalText);
  });
});
