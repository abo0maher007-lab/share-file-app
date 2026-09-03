import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { PermissionService } from '../services/PermissionService';

export const HomeScreen = ({ navigation }: any) => {
  useEffect(() => {
    PermissionService.requestAllPermissions().then((granted) => {
      if (!granted) {
        Alert.alert(
          'تنبيه الصلاحيات',
          'يرجى منح صلاحيات الموقع والشبكة والبلوتوث لتنسيق نقل الملفات بنجاح.'
        );
      }
    });
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>تطبيق النقل السريع P2P</Text>
      <Text style={styles.subtitle}>نقل آمن، مشفر، ومباشر بدون إنترنت</Text>

      <TouchableOpacity
        style={[styles.button, styles.sendBtn]}
        onPress={() => navigation.navigate('Send')}
      >
        <Text style={styles.btnText}>إرسال ملفات</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, styles.receiveBtn]}
        onPress={() => navigation.navigate('Receive')}
      >
        <Text style={styles.btnText}>استلام ملفات</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#AAAAAA',
    marginBottom: 40,
  },
  button: {
    width: '100%',
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 10,
  },
  sendBtn: {
    backgroundColor: '#007AFF',
  },
  receiveBtn: {
    backgroundColor: '#34C759',
  },
  btnText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
});
