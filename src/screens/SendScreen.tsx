import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { ChunkerService, CHUNK_SIZE } from '../services/ChunkerService';
import { WebRTCService } from '../services/WebRTCService';
import { FileMeta, TransferProgressState } from '../types';

export const SendScreen = () => {
  const [fileMeta, setFileMeta] = useState<FileMeta | null>(null);
  const [fileUri, setFileUri] = useState<string | null>(null);
  const [progress, setProgress] = useState<TransferProgressState | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const pickDocument = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      copyToCacheDirectory: true,
    });

    if (!result.canceled && result.assets && result.assets[0]) {
      const asset = result.assets[0];
      setLoading(true);
      setFileUri(asset.uri);

      const meta = await ChunkerService.getFileMetadata(
        asset.uri,
        asset.name,
        asset.mimeType || 'application/octet-stream'
      );

      setFileMeta(meta);
      setLoading(false);
    }
  };

  const startTransfer = async () => {
    if (!fileMeta || !fileUri) return;

    const webrtc = new WebRTCService();
    webrtc.createDataChannel();

    setProgress({
      fileId: fileMeta.id,
      fileName: fileMeta.name,
      transferredBytes: 0,
      totalBytes: fileMeta.size,
      percentage: 0,
      status: 'transferring',
    });

    // إرسال البيانات الوصفية للمستلم
    webrtc.sendPacket({ type: 'META', payload: fileMeta });

    for (let i = 0; i < fileMeta.totalChunks; i++) {
      const chunkData = await ChunkerService.readChunk(fileUri, i);
      
      webrtc.sendPacket({
        type: 'CHUNK',
        payload: {
          fileId: fileMeta.id,
          chunkIndex: i,
          totalChunks: fileMeta.totalChunks,
          data: chunkData,
        },
      });

      const currentBytes = Math.min((i + 1) * CHUNK_SIZE, fileMeta.size);
      setProgress({
        fileId: fileMeta.id,
        fileName: fileMeta.name,
        transferredBytes: currentBytes,
        totalBytes: fileMeta.size,
        percentage: Math.round((currentBytes / fileMeta.size) * 100),
        status: i + 1 === fileMeta.totalChunks ? 'completed' : 'transferring',
      });
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>إرسال ملف عبر الشبكة المحلية</Text>

      <TouchableOpacity style={styles.pickBtn} onPress={pickDocument}>
        <Text style={styles.btnText}>اختر الملف</Text>
      </TouchableOpacity>

      {loading && <ActivityIndicator size="large" color="#007AFF" style={{ marginTop: 20 }} />}

      {fileMeta && !loading && (
        <View style={styles.metaContainer}>
          <Text style={styles.metaText}>اسم الملف: {fileMeta.name}</Text>
          <Text style={styles.metaText}>الحجم: {(fileMeta.size / (1024 * 1024)).toFixed(2)} MB</Text>
          <Text style={styles.metaText}>SHA256: {fileMeta.sha256.substring(0, 16)}...</Text>

          <TouchableOpacity style={styles.startBtn} onPress={startTransfer}>
            <Text style={styles.btnText}>بدء النقل</Text>
          </TouchableOpacity>
        </View>
      )}

      {progress && (
        <View style={styles.progressBox}>
          <Text style={styles.progressText}>
            التقدم: {progress.percentage}% ({progress.status})
          </Text>
          <View style={[styles.progressBar, { width: `${progress.percentage}%` }]} />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212', padding: 20, justifyContent: 'center' },
  header: { fontSize: 20, color: '#FFF', fontWeight: 'bold', textAlign: 'center', marginBottom: 20 },
  pickBtn: { backgroundColor: '#1E1E1E', padding: 16, borderRadius: 8, alignItems: 'center' },
  startBtn: { backgroundColor: '#34C759', padding: 16, borderRadius: 8, alignItems: 'center', marginTop: 15 },
  btnText: { color: '#FFF', fontWeight: 'bold' },
  metaContainer: { marginTop: 20, padding: 15, backgroundColor: '#1E1E1E', borderRadius: 8 },
  metaText: { color: '#CCC', marginBottom: 5 },
  progressBox: { marginTop: 30 },
  progressText: { color: '#FFF', marginBottom: 8 },
  progressBar: { height: 10, backgroundColor: '#007AFF', borderRadius: 5 },
});
