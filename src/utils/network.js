import * as Network from 'expo-network';

export const getLocalIpAddress = async () => {
  try {
    const ip = await Network.getIpAddressAsync();
    return ip;
  } catch (error) {
    console.error("Error getting IP address:", error);
    return null;
  }
};
