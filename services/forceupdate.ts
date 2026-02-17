import { Platform } from 'react-native';
import * as Application from 'expo-application';
import { apiUrl } from '../constants/constants';

interface ForceUpdateVersionResponse {
  platform: string;
  version: string;
  releaseNotes: string | null;
}

const platform = Platform.OS.toUpperCase();

export const appVersion = Application.nativeApplicationVersion;

export const versionToNumber = (version: string): number => {
  const [major, minor, patch] = version.split('.').map(Number);
  return major * 10000 + minor * 100 + patch;
};

export const getForceUpdate = async (): Promise<ForceUpdateVersionResponse | null> => {
  try {
    const response = await fetch(`${apiUrl}/versions/latest?platform=${platform}`, {
      method: 'GET',
    });

    if (!response.ok) return null;

    const data: ForceUpdateVersionResponse = await response.json();

    return data;
  } catch {
    return null;
  }
};
