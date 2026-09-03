import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';

import { HomeScreen } from './src/screens/HomeScreen';
import { SendScreen } from './src/screens/SendScreen';
import { ReceiveScreen } from './src/screens/ReceiveScreen'; // 1. استيراد شاشة الاستلام

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <StatusBar style="light" />
      <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: '#121212' },
          headerTintColor: '#FFF',
          contentStyle: { backgroundColor: '#121212' },
        }}
      >
        <Stack.Screen name="Home" component={HomeScreen} options={{ title: 'الرئيسية' }} />
        <Stack.Screen name="Send" component={SendScreen} options={{ title: 'إرسال ملف' }} />
        <Stack.Screen name="Receive" component={ReceiveScreen} options={{ title: 'استلام ملف' }} /> {/* 2. تسجيل شاشة الاستلام */}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
