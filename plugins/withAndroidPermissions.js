const { withAndroidManifest } = require('@expo/config-plugins');

module.exports = function withAndroidPermissions(config) {
  return withAndroidManifest(config, async (config) => {
    const androidManifest = config.modResults.manifest;

    if (!androidManifest['uses-permission']) {
      androidManifest['uses-permission'] = [];
    }

    const permissions = [
      'android.permission.INTERNET',
      'android.permission.ACCESS_NETWORK_STATE',
      'android.permission.ACCESS_WIFI_STATE',
      'android.permission.CHANGE_WIFI_STATE',
      'android.permission.ACCESS_FINE_LOCATION',
      'android.permission.ACCESS_COARSE_LOCATION',
      'android.permission.BLUETOOTH',
      'android.permission.BLUETOOTH_ADMIN',
      'android.permission.BLUETOOTH_SCAN',
      'android.permission.BLUETOOTH_CONNECT',
      'android.permission.BLUETOOTH_ADVERTISE',
      'android.permission.NEARBY_WIFI_DEVICES',
      'android.permission.READ_EXTERNAL_STORAGE',
      'android.permission.WRITE_EXTERNAL_STORAGE',
      'android.permission.MANAGE_EXTERNAL_STORAGE',
      'android.permission.READ_MEDIA_IMAGES',
      'android.permission.READ_MEDIA_VIDEO',
      'android.permission.READ_MEDIA_AUDIO'
    ];

    permissions.forEach((perm) => {
      if (!androidManifest['uses-permission'].some((item) => item['$']['android:name'] === perm)) {
        androidManifest['uses-permission'].push({
          $: {
            'android:name': perm,
            ...(perm === 'BLUETOOTH_SCAN' ? { 'android:usesPermissionFlags': 'neverForLocation' } : {})
          }
        });
      }
    });

    return config;
  });
};
