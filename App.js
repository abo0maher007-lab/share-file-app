// App.js
import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity, 
  SafeAreaView, 
  ActivityIndicator, 
  Alert 
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as DocumentPicker from 'expo-document-picker';
import QRCode from 'react-native-qrcode-svg';

export default function App() {
  const [screen, setScreen] = useState('HOME'); // HOME, SENDER_SCAN, SENDER_PICK, RECEIVER, TRANSFER
  const [permission, requestPermission] = useCameraPermissions();
  const [selectedFile, setSelectedFile] = useState(null);
  const [connectionData, setConnectionData] = useState(null);
  const [transferProgress, setTransferProgress] = useState(0);

  // Mock Wi-Fi Direct / Local IP Config for Receiver Mode
  const receiverConfig = JSON.stringify({
    ssid: "P2P_Share_Hotspot",
    ip: "192.168.49.1",
    port: 8080
  });

  const handleStartSend = async () => {
    if (!permission?.granted) {
      const res = await requestPermission();
      if (!res.granted) {
        Alert.alert("Permission Required", "Camera access is needed to scan receiver QR code.");
        return;
      }
    }
    setScreen('SENDER_SCAN');
  };

  const handleBarCodeScanned = ({ data }) => {
    try {
      const parsed = JSON.parse(data);
      if (parsed.ip && parsed.port) {
        setConnectionData(parsed);
        setScreen('SENDER_PICK');
      }
    } catch (e) {
      Alert.alert("Invalid QR", "Scanned QR code is not valid for P2P Share.");
    }
  };

  const pickFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        setSelectedFile(result.assets[0]);
        startTransfer();
      }
    } catch (err) {
      Alert.alert("Error", "Failed to select file.");
    }
  };

  const startTransfer = () => {
    setScreen('TRANSFER');
    setTransferProgress(0);
    
    // Simulating chunked TCP socket stream transfer over local Wi-Fi
    const interval = setInterval(() => {
      setTransferProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 10;
      });
    }, 300);
  };

  const renderHome = () => (
    <View style={styles.centerContainer}>
      <Text style={styles.title}>P2P Share</Text>
      <Text style={styles.subtitle}>Offline High-Speed File Transfer</Text>

      <TouchableOpacity style={[styles.btn, styles.btnSend]} onPress={handleStartSend}>
        <Text style={styles.btnText}>SEND</Text>
      </TouchableOpacity>

      <TouchableOpacity style={[styles.btn, styles.btnReceive]} onPress={() => setScreen('RECEIVER')}>
        <Text style={styles.btnText}>RECEIVE</Text>
      </TouchableOpacity>
    </View>
  );

  const renderSenderScan = () => (
    <View style={styles.container}>
      <CameraView 
        style={StyleSheet.absoluteFillObject}
        onBarcodeScanned={handleBarCodeScanned}
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
      />
      <View style={styles.overlay}>
        <Text style={styles.overlayText}>Scan Receiver QR Code</Text>
        <TouchableOpacity style={styles.cancelBtn} onPress={() => setScreen('HOME')}>
          <Text style={styles.btnText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderSenderPick = () => (
    <View style={styles.centerContainer}>
      <Text style={styles.title}>Connected</Text>
      <Text style={styles.subtitle}>Target: {connectionData?.ip}</Text>
      
      <TouchableOpacity style={[styles.btn, styles.btnSend]} onPress={pickFile}>
        <Text style={styles.btnText}>Select File to Send</Text>
      </TouchableOpacity>
    </View>
  );

  const renderReceiver = () => (
    <View style={styles.centerContainer}>
      <Text style={styles.title}>Ready to Receive</Text>
      <Text style={styles.subtitle}>Scan this QR code with the sending device</Text>
      
      <View style={styles.qrContainer}>
        <QRCode value={receiverConfig} size={200} backgroundColor="#FFFFFF" color="#0B0F19" />
      </View>

      <ActivityIndicator size="large" color="#6366F1" style={{ marginTop: 24 }} />
      <Text style={styles.statusText}>Waiting for Sender connection...</Text>

      <TouchableOpacity style={styles.cancelBtn} onPress={() => setScreen('HOME')}>
        <Text style={styles.btnText}>Cancel</Text>
      </TouchableOpacity>
    </View>
  );

  const renderTransfer = () => (
    <View style={styles.centerContainer}>
      <Text style={styles.title}>
        {transferProgress === 100 ? 'Transfer Complete!' : 'Transferring File...'}
      </Text>

      {selectedFile && (
        <Text style={styles.subtitle}>{selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)</Text>
      )}

      <View style={styles.progressContainer}>
        <View style={[styles.progressBar, { width: `${transferProgress}%` }]} />
      </View>
      <Text style={styles.progressText}>{transferProgress}%</Text>

      {transferProgress === 100 && (
        <TouchableOpacity style={[styles.btn, styles.btnSend]} onPress={() => setScreen('HOME')}>
          <Text style={styles.btnText}>Done</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      {screen === 'HOME' && renderHome()}
      {screen === 'SENDER_SCAN' && renderSenderScan()}
      {screen === 'SENDER_PICK' && renderSenderPick()}
      {screen === 'RECEIVER' && renderReceiver()}
      {screen === 'TRANSFER' && renderTransfer()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B0F19',
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#9CA3AF',
    marginBottom: 32,
    textAlign: 'center',
  },
  btn: {
    width: '80%',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginVertical: 10,
  },
  btnSend: {
    backgroundColor: '#6366F1',
  },
  btnReceive: {
    backgroundColor: '#10B981',
  },
  btnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  overlay: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  overlayText: {
    color: '#FFFFFF',
    fontSize: 18,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 20,
  },
  qrContainer: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
  },
  statusText: {
    color: '#9CA3AF',
    marginTop: 12,
  },
  cancelBtn: {
    marginTop: 30,
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: '#374151',
    borderRadius: 8,
  },
  progressContainer: {
    width: '80%',
    height: 12,
    backgroundColor: '#1F2937',
    borderRadius: 6,
    overflow: 'hidden',
    marginVertical: 20,
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#6366F1',
  },
  progressText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
  }
});
