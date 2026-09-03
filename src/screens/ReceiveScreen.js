import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { BarCodeScanner } from 'expo-barcode-scanner';
import * as FileSystem from 'expo-file-system';

export default function ReceiveScreen({ onBack }) {
  const [hasPermission, setHasPermission] = useState(null);
  const [scanned, setScanned] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const getBarCodeScannerPermissions = async () => {
      const { status } = await BarCodeScanner.requestPermissionsAsync();
      setHasPermission(status === 'granted');
    };
    getBarCodeScannerPermissions();
  }, []);

  const handleBarCodeScanned = async ({ data }) => {
    setScanned(true);
    
    try {
      setDownloading(true);
      // استخراج اسم الملف وإعداده للحفظ المحلي
      const fileUri = FileSystem.documentDirectory + 'downloaded_file_' + Date.now();

      const downloadResumable = FileSystem.createDownloadResumable(
        data,
        fileUri,
        {},
        (downloadProgress) => {
          const p = downloadProgress.totalBytesWritten / downloadProgress.totalBytesExpectedToWrite;
          setProgress(Math.round(p * 100));
        }
      );

      const { uri } = await downloadResumable.downloadAsync();
      setDownloading(false);
      Alert.alert('نجاح النقل', `تم حفظ الملف بنجاح في:\n${uri}`);
    } catch (e) {
      setDownloading(false);
      Alert.alert('خطأ في النقل', 'تعذر تحميل الملف من المرسل.');
    }
  };

  if (hasPermission === null) {
    return <Text>جاري طلب الإذن لاستخدام الكاميرا...</Text>;
  }
  if (hasPermission === false) {
    return <Text>لا يوجد إذن للوصول إلى الكاميرا</Text>;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>استلام ملف (مسح QR Code)</Text>

      {!scanned ? (
        <View style={styles.scannerContainer}>
          <BarCodeScanner
            onBarCodeScanned={scanned ? undefined : handleBarCodeScanned}
            style={StyleSheet.absoluteFillObject}
          />
        </View>
      ) : (
        <View style={styles.statusContainer}>
          {downloading ? (
            <>
              <ActivityIndicator size="large" color="#1a73e8" />
              <Text style={styles.progressText}>جاري التحميل... {progress}%</Text>
            </>
          ) : (
            <TouchableOpacity style={styles.button} onPress={() => setScanned(false)}>
              <Text style={styles.buttonText}>مسح رمز آخر</Text>
            </TouchableOpacity>
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
  scannerContainer: { width: 300, height: 300, overflow: 'hidden', borderRadius: 15, backgroundColor: '#000' },
  statusContainer: { alignItems: 'center', marginVertical: 20 },
  progressText: { marginTop: 15, fontSize: 16, fontWeight: '600' },
  button: { backgroundColor: '#1a73e8', padding: 12, borderRadius: 8 },
  buttonText: { color: '#fff', fontSize: 15 },
  backButton: { marginTop: 30, padding: 10 },
  backButtonText: { color: '#666', fontSize: 14 }
});
