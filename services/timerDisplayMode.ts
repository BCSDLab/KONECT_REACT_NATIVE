import { Platform } from 'react-native';
import * as Brightness from 'expo-brightness';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';

const TIMER_KEEP_AWAKE_TAG = 'study-timer';
const DIM_SCREEN_DELAY_MS = 10000;
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
let displayModeOperation: Promise<void> = Promise.resolve();
let dimScreenTimeout: ReturnType<typeof setTimeout> | null = null;

function enqueueDisplayModeOperation(task: () => Promise<void>): Promise<void> {
  displayModeOperation = displayModeOperation.then(task, task);
  return displayModeOperation;
}

function clearPendingDimScreen(): void {
  if (dimScreenTimeout === null) return;

  clearTimeout(dimScreenTimeout);
  dimScreenTimeout = null;
}

function getTargetBrightness(brightnessLevel?: number): number {
  const defaultBrightness =
    Platform.OS === 'ios' ? IOS_DIMMED_SCREEN_BRIGHTNESS : ANDROID_DIMMED_SCREEN_BRIGHTNESS;

  if (brightnessLevel == null || Number.isNaN(brightnessLevel)) {
    return defaultBrightness;
  }

  if (Platform.OS === 'ios') {
    return Math.min(IOS_MAX_BRIGHTNESS, Math.max(MIN_BRIGHTNESS, brightnessLevel));
  }

  return Math.min(ANDROID_MAX_BRIGHTNESS, Math.max(MIN_BRIGHTNESS, brightnessLevel));
}

async function setScreenBrightness(brightness: number): Promise<boolean> {
  const isBrightnessAvailable = await Brightness.isAvailableAsync();
  if (!isBrightnessAvailable) return false;

  await Brightness.setBrightnessAsync(brightness);
  return true;
}

async function activateKeepAwakeIfNeeded(): Promise<void> {
  if (isKeepAwakeActive) return;

  try {
    await activateKeepAwakeAsync(TIMER_KEEP_AWAKE_TAG);
    isKeepAwakeActive = true;
  } catch (error) {
    console.error('타이머 keep-awake 활성화 실패:', error);
  }
}

async function deactivateKeepAwakeIfNeeded(): Promise<void> {
  if (!isKeepAwakeActive) return;

  try {
    await deactivateKeepAwake(TIMER_KEEP_AWAKE_TAG);
    isKeepAwakeActive = false;
  } catch (error) {
    console.error('타이머 keep-awake 비활성화 실패:', error);
  }
}

async function dimScreenIfNeeded(dimScreen: boolean, brightnessLevel?: number): Promise<void> {
  if (!dimScreen) return;

  const targetBrightness = getTargetBrightness(brightnessLevel);
  if (isScreenDimmed && appliedBrightnessLevel === targetBrightness) return;

  try {
    if (Platform.OS === 'android') {
      const isBrightnessApplied = await setScreenBrightness(targetBrightness);
      if (!isBrightnessApplied) return;

      isScreenDimmed = true;
      appliedBrightnessLevel = targetBrightness;
      return;
    }

    if (Platform.OS === 'ios') {
      const isBrightnessAvailable = await Brightness.isAvailableAsync();
      if (!isBrightnessAvailable) return;

      const currentBrightness = savedIosBrightness ?? (await Brightness.getBrightnessAsync());
      await Brightness.setBrightnessAsync(targetBrightness);
      savedIosBrightness = currentBrightness;
      isScreenDimmed = true;
      appliedBrightnessLevel = targetBrightness;
    }
  } catch (error) {
    console.error('타이머 화면 밝기 조절 실패:', error);
  }
}

async function restoreScreenBrightness(): Promise<void> {
  clearPendingDimScreen();

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

function scheduleScreenDim(brightnessLevel?: number): void {
  clearPendingDimScreen();

  dimScreenTimeout = setTimeout(() => {
    dimScreenTimeout = null;
    void enqueueDisplayModeOperation(async () => {
      await dimScreenIfNeeded(true, brightnessLevel);
    });
  }, DIM_SCREEN_DELAY_MS);
}

export async function enableTimerDisplayMode({
  brightnessLevel,
  keepAwake = true,
  dimScreen = true,
}: TimerDisplayModeOptions = {}): Promise<void> {
  return enqueueDisplayModeOperation(async () => {
    if (keepAwake) {
      await activateKeepAwakeIfNeeded();
    } else {
      await deactivateKeepAwakeIfNeeded();
    }

    if (!dimScreen) {
      await restoreScreenBrightness();
      return;
    }

    if (isScreenDimmed) {
      await dimScreenIfNeeded(true, brightnessLevel);
      return;
    }

    scheduleScreenDim(brightnessLevel);
  });
}

export async function disableTimerDisplayMode(): Promise<void> {
  return enqueueDisplayModeOperation(async () => {
    await restoreScreenBrightness();
    await deactivateKeepAwakeIfNeeded();
  });
}
