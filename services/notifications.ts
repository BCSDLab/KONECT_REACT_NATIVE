import { Alert, Linking, Platform } from 'react-native';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { exitApp } from '@logicwind/react-native-exit-app';

let wentToSettings = false;

const notificationPermissionAlert = () =>
  Alert.alert('알림 권한이 필요해요', '설정으로 이동해서 알림 권한을 허용해주세요.', [
    {
      text: '앱 종료',
      onPress: () => exitApp(),
      style: 'cancel',
    },
    {
      text: '확인',
      onPress: () => {
        wentToSettings = true;
        Linking.openSettings();
      },
    },
  ]);

function handleRegistrationError(errorMessage: string) {
  console.error(errorMessage);
  throw new Error(errorMessage);
}

export async function registerForPushNotificationsAsync() {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }

  if (Device.isDevice) {
    const permission = await Notifications.getPermissionsAsync();
    let finalStatus = permission.status;
    let finalPermission = permission;
    if (finalStatus !== 'granted') {
      const requestedPermission = await Notifications.requestPermissionsAsync();
      finalStatus = requestedPermission.status;
      finalPermission = requestedPermission;
    }
    const isIosAllowed =
      Platform.OS === 'ios' &&
      (finalPermission.ios?.status === Notifications.IosAuthorizationStatus.AUTHORIZED ||
        finalPermission.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL ||
        finalPermission.ios?.status === Notifications.IosAuthorizationStatus.EPHEMERAL);
    if (finalStatus !== 'granted' && !isIosAllowed) {
      notificationPermissionAlert();
      return;
    }
    const projectId =
      Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;
    if (!projectId) {
      handleRegistrationError('Project ID not found');
    }
    try {
      const pushTokenString = (
        await Notifications.getExpoPushTokenAsync({
          projectId,
        })
      ).data;
      console.log(pushTokenString);
      return pushTokenString;
    } catch (e: unknown) {
      handleRegistrationError(`${e}`);
    }
  } else {
    handleRegistrationError('Must use physical device for push notifications');
  }
}

export function shouldRecheckPermission() {
  if (wentToSettings) {
    wentToSettings = false;
    return true;
  }
  return false;
}
