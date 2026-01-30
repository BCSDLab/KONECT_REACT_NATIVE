import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

export const generateUserAgent = (): string => {
  const appName = 'KONECT_APP';
  const appVersion = Constants.expoConfig?.version || '1.0.0';

  if (Platform.OS === 'android') {
    const androidVersion = Platform.Version;
    const deviceModel = Device.modelName || 'Android Device';
    const deviceBrand = Device.brand || 'Unknown';

    return `Mozilla/5.0 (Linux; Android ${androidVersion}; ${deviceBrand} ${deviceModel}) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36 ${appName}/${appVersion}`;
  } else if (Platform.OS === 'ios') {
    const osVersion = Device.osVersion || '17.0';
    const deviceModel = Device.modelName || 'iPhone';

    const formattedVersion = osVersion.replace(/\./g, '_');

    return `Mozilla/5.0 (${deviceModel}; CPU OS ${formattedVersion} like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 ${appName}/${appVersion}`;
  }

  return `${appName}/${appVersion}`;
};

export const getDeviceInfo = () => {
  return {
    brand: Device.brand,
    modelName: Device.modelName,
    osName: Device.osName,
    osVersion: Device.osVersion,
    platformApiLevel: Platform.Version,
    deviceType: Device.deviceType,
  };
};
