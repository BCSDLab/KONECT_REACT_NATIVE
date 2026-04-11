import { Platform } from 'react-native';
import * as Brightness from 'expo-brightness';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';

const TIMER_KEEP_AWAKE_TAG = 'study-timer';
const IOS_DIMMED_SCREEN_BRIGHTNESS = 0.35;
const ANDROID_DIMMED_SCREEN_BRIGHTNESS = 0.28;
const MIN_BRIGHTNESS = 0.05;
const IOS_MAX_BRIGHTNESS = 0.6;
const ANDROID_MAX_BRIGHTNESS = 0.5;

interface TimerDisplayModeOptions {
  brightnessLevel?: number;
  dimScreen?: boolean;
  keepAwake?: boolean;
}

let isKeepAwakeActive = false;
let isScreenDimmed = false;
let savedIosBrightness: number | null = null;
let appliedBrightnessLevel: number | null = null;

function getTargetBrightness(brightnessLevel?: number): number {
  const defaultBrightness = Platform.OS === 'ios' ? IOS_DIMMED_SCREEN_BRIGHTNESS : ANDROID_DIMMED_SCREEN_BRIGHTNESS;

  if (brightnessLevel == null || Number.isNaN(brightnessLevel)) {
    return defaultBrightness;
  }

  if (Platform.OS === 'ios') {
    return Math.min(IOS_MAX_BRIGHTNESS, Math.max(MIN_BRIGHTNESS, brightnessLevel));
  }

  return Math.min(ANDROID_MAX_BRIGHTNESS, Math.max(MIN_BRIGHTNESS, brightnessLevel));
}

async function setScreenBrightness(brightness: number): Promise<void> {
  const isBrightnessAvailable = await Brightness.isAvailableAsync();
  if (!isBrightnessAvailable) return;

  await Brightness.setBrightnessAsync(brightness);
}

async function dimScreenIfNeeded(dimScreen: boolean, brightnessLevel?: number): Promise<void> {
  if (!dimScreen) return;

  const targetBrightness = getTargetBrightness(brightnessLevel);
  if (isScreenDimmed && appliedBrightnessLevel === targetBrightness) return;

  try {
    if (Platform.OS === 'android') {
      await setScreenBrightness(targetBrightness);
      isScreenDimmed = true;
      appliedBrightnessLevel = targetBrightness;
      return;
    }

    if (Platform.OS === 'ios') {
      savedIosBrightness ??= await Brightness.getBrightnessAsync();
      await setScreenBrightness(targetBrightness);
      isScreenDimmed = true;
      appliedBrightnessLevel = targetBrightness;
    }
  } catch (error) {
    console.error('타이머 화면 밝기 조절 실패:', error);
  }
}

async function restoreScreenBrightness(): Promise<void> {
  if (!isScreenDimmed) return;

  try {
    if (Platform.OS === 'android') {
      await Brightness.restoreSystemBrightnessAsync();
      return;
    }

    if (Platform.OS === 'ios' && savedIosBrightness !== null) {
      await setScreenBrightness(savedIosBrightness);
    }
  } catch (error) {
    console.error('타이머 화면 밝기 복원 실패:', error);
  } finally {
    isScreenDimmed = false;
    savedIosBrightness = null;
    appliedBrightnessLevel = null;
  }
}

export async function enableTimerDisplayMode({
  brightnessLevel,
  keepAwake = true,
  dimScreen = true,
}: TimerDisplayModeOptions = {}): Promise<void> {
  if (keepAwake && !isKeepAwakeActive) {
    try {
      await activateKeepAwakeAsync(TIMER_KEEP_AWAKE_TAG);
      isKeepAwakeActive = true;
    } catch (error) {
      console.error('타이머 keep-awake 활성화 실패:', error);
    }
  }

  await dimScreenIfNeeded(dimScreen, brightnessLevel);
}

export async function disableTimerDisplayMode(): Promise<void> {
  await restoreScreenBrightness();

  if (!isKeepAwakeActive) return;

  try {
    await deactivateKeepAwake(TIMER_KEEP_AWAKE_TAG);
  } catch (error) {
    console.error('타이머 keep-awake 비활성화 실패:', error);
  } finally {
    isKeepAwakeActive = false;
  }
}
