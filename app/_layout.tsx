import { Stack, useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import { getForceUpdate, appVersion, versionToNumber } from '../services/forceupdate';

export default function RootLayout() {
  const router = useRouter();

  useEffect(() => {
    const checkVersion = async () => {
      const latest = await getForceUpdate();
      if (latest && appVersion && versionToNumber(latest.version) > versionToNumber(appVersion)) {
        router.replace('/forceupdate');
      }
    };

    checkVersion();
  }, [router]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="forceupdatel" />
    </Stack>
  );
}
