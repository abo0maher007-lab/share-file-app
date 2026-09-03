import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import QRCode from 'react-native-qrcode-svg';
import { getLocalIpAddress } from '../utils/network';

export default function SendScreen({ onBack }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [ipAddress, setIpAddress] = useState(null);
  const [serverUrl, setServerUrl] = useState('');
  const [isPreparing, setIsPreparing] = useState(false);

  useEffect(() => {
    initNetwork();
  }, []);

  const initNetwork = async () => {
    const ip = await getLocalIpAddress();
    setIpAddress(ip);
  };

  const pickFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        setSelectedFile(file);
        
        // بناء رابط التنزيل المباشر عبر السيرفر المحلي
        const PORT = 8080;
        const downloadUrl = `http://${ipAddress}:${PORT}/download?name=${encodeURIComponent(file.name)}&uri=${encodeURIComponent(file.uri)}`;
        setServerUrl(downloadUrl);
      }
    } catch (err) {
      Alert.alert('خطأ', 'تعذر اختيار الملف');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>إرسال ملف عبر الشبكة المحلية</Text>

      {!selectedFile ? (
        <TouchableOpacity style={styles.button} onPress={pickFile}>
          <Text style={styles.buttonText}>حدد الملف المراد إرساله</Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.infoContainer}>
          <Text style={styles.fileName}>الملف المحدد: {selectedFile.name}</Text>
          <Text style={styles.fileSize}>
            الحجم: {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
          </Text>

          {serverUrl ? (
            <View style={styles.qrContainer}>
              <Text style={styles.qrLabel}>امسح الـ QR Code من الجهاز المستلم:</Text>
              <QRCode value={serverUrl} size={200} />
              <Text style={styles.ipText}>IP: {ipAddress}</Text>
            </View>
          ) : (
            <ActivityIndicator size="large" color="#1a73e8" />
          )}
        </View>
      )}

      <TouchableOpacity style={styles.backButton} onPress={onBack}>
        <Text style={styles.backButtonText}>الرجوع للرئيسية</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.compile({
  container: { flex: 1, padding: 20, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f5f5f5' },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 20, color: '#333' },
  button: { backgroundColor: '#1a73e8', padding: 15, borderRadius: 10, width: '80%', alignItems: 'center' },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  infoContainer: { alignItems: 'center', width: '100%' },
  fileName: { fontSize: 16, fontWeight: '600', marginBottom: 5 },
  fileSize: { fontSize: 14, color: '#666', marginBottom: 20 },
  qrContainer: { alignItems: 'center', marginTop: 10 },
  qrLabel: { fontSize: 14, marginBottom: 15, color: '#444' },
  ipText: { marginTop: 10, fontSize: 12, color: '#888' },
  backButton: { marginTop: 30, padding: 10 },
  backButtonText: { color: '#666', fontSize: 14 }
});
        
