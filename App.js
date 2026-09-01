import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity, 
  SafeAreaView, 
  FlatList, 
  Image, 
  Alert 
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as DocumentPicker from 'expo-document-picker';
import * as MediaLibrary from 'expo-media-library';
import QRCode from 'react-native-qrcode-svg';

export default function App() {
  const [screen, setScreen] = useState('HOME');
  const [activeTab, setActiveTab] = useState('PHOTOS');
  const [selectedItems, setSelectedItems] = useState([]);
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [mediaPermission, setMediaPermission] = useState(null);
  
  const [realPhotos, setRealPhotos] = useState([]);
  const [realVideos, setRealVideos] = useState([]);
  const [transferProgress, setTransferProgress] = useState(0);

  // طلب أذونات وسائط الجهاز وقراءتها
  useEffect(() => {
    (async () => {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      setMediaPermission(status === 'granted');
      if (status === 'granted') {
        loadDeviceMedia();
      }
    })();
  }, []);

  const loadDeviceMedia = async () => {
    try {
      // قراءة الصور من المعرض
      const photos = await MediaLibrary.getAssetsAsync({
        mediaType: 'photo',
        first: 40,
        sortBy: ['creationTime'],
      });
      setRealPhotos(photos.assets);

      // قراءة الفيديوهات من المعرض
      const videos = await MediaLibrary.getAssetsAsync({
        mediaType: 'video',
        first: 30,
        sortBy: ['creationTime'],
      });
      setRealVideos(videos.assets);
    } catch (e) {
      console.log('خطأ في تحميل الوسائط:', e);
    }
  };

  const toggleSelectItem = (item) => {
    if (selectedItems.find(i => i.id === item.id)) {
      setSelectedItems(selectedItems.filter(i => i.id !== item.id));
    } else {
      setSelectedItems([...selectedItems, item]);
    }
  };

  const pickCustomFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: '*/*' });
      if (!result.canceled && result.assets[0]) {
        const file = result.assets[0];
        const newFile = {
          id: Date.now().toString(),
          filename: file.name,
          uri: file.uri,
          sizeDisplay: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
          isDocument: true
        };
        setSelectedItems([...selectedItems, newFile]);
      }
    } catch (err) {
      Alert.alert("خطأ", "فشل اختيار الملف");
    }
  };

  const handleStartSend = async () => {
    if (selectedItems.length === 0) {
      Alert.alert("تنبيه", "يرجى تحديد عنصر واحد على الأقل للمشاركة");
      return;
    }
    if (!cameraPermission?.granted) {
      const res = await requestCameraPermission();
      if (!res.granted) {
        Alert.alert("إذن مطلوب", "الكاميرا مطلوبة لمسح رمز QR");
        return;
      }
    }
    setScreen('SENDER_SCAN');
  };

  const startTransfer = () => {
    setScreen('TRANSFER');
    setTransferProgress(0);
    const interval = setInterval(() => {
      setTransferProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 10;
      });
    }, 200);
  };

  const getTabData = () => {
    if (activeTab === 'PHOTOS') return realPhotos;
    if (activeTab === 'VIDEOS') return realVideos;
    return [];
  };

  const renderHome = () => (
    <View style={styles.mainContainer}>
      {/* شريط التبويبات العلوي */}
      <View style={styles.tabsContainer}>
        {['PHOTOS', 'VIDEOS', 'FILES'].map((tab) => (
          <TouchableOpacity 
            key={tab} 
            style={[styles.tabItem, activeTab === tab && styles.activeTabItem]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
              {tab === 'PHOTOS' ? 'صور المعرض' : tab === 'VIDEOS' ? 'فيديوهات' : 'تصفح الملفات'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* المحتوى حسب التبويب */}
      {activeTab === 'FILES' ? (
        <View style={styles.centerPicker}>
          <TouchableOpacity style={styles.pickFileBtn} onPress={pickCustomFile}>
            <Text style={styles.pickFileText}>📁 اختيار ملف من الذاكرة</Text>
          </TouchableOpacity>
        </View>
      ) : !mediaPermission ? (
        <View style={styles.centerPicker}>
          <Text style={styles.permissionWarn}>يرجى منح الإذن للوصول لوسائط الجهاز</Text>
          <TouchableOpacity style={styles.pickFileBtn} onPress={loadDeviceMedia}>
            <Text style={styles.pickFileText}>منح الإذن والتحديث</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={getTabData()}
          numColumns={3}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => {
            const isSelected = !!selectedItems.find(i => i.id === item.id);
            return (
              <TouchableOpacity 
                style={[styles.mediaCard, isSelected && styles.selectedMediaCard]}
                onPress={() => toggleSelectItem(item)}
              >
                <Image source={{ uri: item.uri }} style={styles.mediaThumbnail} />
                <View style={[styles.checkbox, isSelected && styles.checkboxActive]} />
              </TouchableOpacity>
            );
          }}
        />
      )}

      {/* الشريط السفلي */}
      <View style={styles.bottomBar}>
        <TouchableOpacity style={[styles.actionBtn, styles.receiveBtn]} onPress={() => setScreen('RECEIVER')}>
          <Text style={styles.actionBtnText}>استلام 📥</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.actionBtn, styles.sendBtn]} onPress={handleStartSend}>
          <Text style={styles.actionBtnText}>إرسال ({selectedItems.length}) 🚀</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderSenderScan = () => (
    <View style={styles.container}>
      <CameraView 
        style={StyleSheet.absoluteFillObject}
        onBarcodeScanned={() => startTransfer()}
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
      />
      <View style={styles.overlay}>
        <Text style={styles.overlayText}>وجّه الكاميرا إلى رمز الـ QR الخاص بالمستلم</Text>
        <TouchableOpacity style={styles.cancelBtn} onPress={() => setScreen('HOME')}>
          <Text style={styles.actionBtnText}>إلغاء</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderReceiver = () => (
    <View style={styles.centerContainer}>
      <Text style={styles.title}>جاهز للاستلام</Text>
      <Text style={styles.subtitle}>امسح هذا الرمز بواسطة هاتف المرسل</Text>
      <View style={styles.qrContainer}>
        <QRCode value="P2P_SHARE_CONNECT" size={200} />
      </View>
      <TouchableOpacity style={styles.cancelBtn} onPress={() => setScreen('HOME')}>
        <Text style={styles.actionBtnText}>إلغاء</Text>
      </TouchableOpacity>
    </View>
  );

  const renderTransfer = () => (
    <View style={styles.centerContainer}>
      <Text style={styles.title}>
        {transferProgress === 100 ? 'تم نقل العناصر بنجاح! 🎉' : 'جاري نقل الملفات...'}
      </Text>
      <View style={styles.progressContainer}>
        <View style={[styles.progressBar, { width: `${transferProgress}%` }]} />
      </View>
      <Text style={styles.progressText}>{transferProgress}%</Text>
      {transferProgress === 100 && (
        <TouchableOpacity 
          style={[styles.actionBtn, styles.sendBtn, { width: 160 }]} 
          onPress={() => { setSelectedItems([]); setScreen('HOME'); }}
        >
          <Text style={styles.actionBtnText}>تم</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      {screen === 'HOME' && renderHome()}
      {screen === 'SENDER_SCAN' && renderSenderScan()}
      {screen === 'RECEIVER' && renderReceiver()}
      {screen === 'TRANSFER' && renderTransfer()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A' },
  mainContainer: { flex: 1, justifyContent: 'space-between' },
  tabsContainer: { flexDirection: 'row-reverse', backgroundColor: '#1E293B', paddingVertical: 12, paddingHorizontal: 6 },
  tabItem: { flex: 1, alignItems: 'center', paddingVertical: 8, borderRadius: 8 },
  activeTabItem: { backgroundColor: '#38BDF8' },
  tabText: { color: '#94A3B8', fontSize: 13, fontWeight: 'bold' },
  activeTabText: { color: '#0F172A' },
  mediaCard: { flex: 1 / 3, aspectRatio: 1, margin: 2, borderRadius: 6, overflow: 'hidden', position: 'relative' },
  selectedMediaCard: { borderWidth: 3, borderColor: '#38BDF8' },
  mediaThumbnail: { width: '100%', height: '100%' },
  checkbox: { position: 'absolute', top: 6, right: 6, width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: '#FFFFFF', backgroundColor: 'rgba(0,0,0,0.3)' },
  checkboxActive: { backgroundColor: '#38BDF8', borderColor: '#FFFFFF' },
  bottomBar: { flexDirection: 'row', padding: 16, backgroundColor: '#1E293B', justifyContent: 'space-between' },
  actionBtn: { flex: 0.48, paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  sendBtn: { backgroundColor: '#0284C7' },
  receiveBtn: { backgroundColor: '#10B981' },
  actionBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' },
  centerContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },
  centerPicker: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  pickFileBtn: { backgroundColor: '#334155', padding: 18, borderRadius: 12 },
  pickFileText: { color: '#38BDF8', fontSize: 16, fontWeight: 'bold' },
  permissionWarn: { color: '#F8FAFC', marginBottom: 12 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#FFFFFF', marginBottom: 8 },
  subtitle: { fontSize: 14, color: '#94A3B8', marginBottom: 24 },
  qrContainer: { padding: 16, backgroundColor: '#FFFFFF', borderRadius: 16, marginBottom: 20 },
  cancelBtn: { marginTop: 20, paddingVertical: 12, paddingHorizontal: 32, backgroundColor: '#475569', borderRadius: 8 },
  overlay: { position: 'absolute', bottom: 40, left: 0, right: 0, alignItems: 'center' },
  overlayText: { color: '#FFFFFF', fontSize: 14, backgroundColor: 'rgba(0,0,0,0.8)', padding: 12, borderRadius: 8, marginBottom: 20, textAlign: 'center' },
  progressContainer: { width: '80%', height: 12, backgroundColor: '#334155', borderRadius: 6, overflow: 'hidden', marginVertical: 20 },
  progressBar: { height: '100%', backgroundColor: '#38BDF8' },
  progressText: { color: '#FFFFFF', fontSize: 20, fontWeight: 'bold', marginBottom: 20 }
});
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
