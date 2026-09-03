import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import * as FileSystem from 'expo-file-system';
import { WebRTCService } from '../services/WebRTCService';
import { ChunkerService } from '../services/ChunkerService';
import { FileMeta, TransferProgressState } from '../types';

export const ReceiveScreen = () => {
  const [fileMeta, setFileMeta] = useState<FileMeta | null>(null);
  const [progress, setProgress] = useState<TransferProgressState | null>(null);
  const [statusText, setStatusText] = useState<string>('في انتظار الاتصال من المرسل...');

  useEffect(() => {
    const webrtc = new WebRTCService();
    let receivedChunks: string[] = [];

    webrtc.setOnMessageListener(async (packet) => {
      if (packet.type === 'META') {
        const meta: FileMeta = packet.payload;
        setFileMeta(meta);
        receivedChunks = new Array(meta.totalChunks);
        setStatusText(`جاري استلام الملف: ${meta.name}`);
        setProgress({
          fileId: meta.id,
          fileName: meta.name,
          transferredBytes: 0,
          totalBytes: meta.size,
          percentage: 0,
          status: 'transferring',
        });
      } else if (packet.type === 'CHUNK') {
        const { chunkIndex, totalChunks, data } = packet.payload;
        receivedChunks[chunkIndex] = data;

        const count = receivedChunks.filter(Boolean).length;
        const currentPercentage = Math.round((count / totalChunks) * 100);

        setProgress((prev) =>
          prev
            ? {
                ...prev,
                transferredBytes: Math.min(count * 64 * 1024, prev.totalBytes),
                percentage: currentPercentage,
                status: count === totalChunks ? 'completed' : 'transferring',
              }
            : null
        );

        if (count === totalChunks && fileMeta) {
          saveFile(receivedChunks, fileMeta);
        }
      }
    });

    return () => {
      webrtc.close();
    };
  }, []);

  const saveFile = async (chunks: string[], meta: FileMeta) => {
    try {
      setStatusText('جاري تجميع الملف وحفظه...');
      const fileUri = `${FileSystem.documentDirectory}${meta.name}`;
      const fullBase64 = chunks.join('');

      await FileSystem.writeAsStringAsync(fileUri, fullBase64, {
        encoding: FileSystem.EncodingType.Base64,
      });

      const receivedHash = await ChunkerService.generateFileHash(fileUri);
      if (receivedHash === meta.sha256) {
        setStatusText(`تم استلام الملف بنجاح!\nالمسار: ${fileUri}`);
      } else {
        setStatusText('خطأ: فشل التحقق من سلامة الملف (SHA256 غير متطابق).');
      }
    } catch (error) {
      setStatusText('حدث خطأ أثناء حفظ الملف.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>استلام ملف</Text>
      <ActivityIndicator size="large" color="#34C759" style={styles.loader} />
      <Text style={styles.statusText}>{statusText}</Text>

      {progress && (
        <View style={styles.progressBox}>
          <Text style={styles.progressText}>التقدم: {progress.percentage}%</Text>
          <View style={[styles.progressBar, { width: `${progress.percentage}%` }]} />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212', padding: 20, justifyContent: 'center', alignItems: 'center' },
  header: { fontSize: 20, color: '#FFF', fontWeight: 'bold', marginBottom: 20 },
  loader: { marginBottom: 20 },
  statusText: { color: '#AAA', textAlign: 'center', fontSize: 16, marginBottom: 30 },
  progressBox: { width: '100%', marginTop: 20 },
  progressText: { color: '#FFF', marginBottom: 8, textAlign: 'center' },
  progressBar: { height: 10, backgroundColor: '#34C759', borderRadius: 5 },
});
