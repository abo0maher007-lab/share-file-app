import { PermissionsAndroid, Platform } from 'react-native';

export class PermissionService {
  static async requestAllPermissions(): Promise<boolean> {
    if (Platform.OS !== 'android') return true;

    const apiLevel = Platform.Version as number;

    const basePermissions = [
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
    ];

    if (apiLevel >= 31) {
      basePermissions.push(
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_ADVERTISE
      );
    }

    if (apiLevel >= 33) {
      basePermissions.push(
        PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES,
        PermissionsAndroid.PERMISSIONS.READ_MEDIA_VIDEO,
        PermissionsAndroid.PERMISSIONS.READ_MEDIA_AUDIO,
        PermissionsAndroid.PERMISSIONS.NEARBY_WIFI_DEVICES
      );
    } else {
      basePermissions.push(
        PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
        PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE
      );
    }

    const granted = await PermissionsAndroid.requestMultiple(basePermissions);

    return Object.values(granted).every(
      (result) => result === PermissionsAndroid.RESULTS.GRANTED
    );
  }
}
