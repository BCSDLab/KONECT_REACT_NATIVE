import AsyncStorage from '@react-native-async-storage/async-storage';

const PUSH_TOKEN_KEY = 'PUSH_TOKEN';

let _token: string | null = null;
const _callbacks: ((token: string) => void)[] = [];

export async function initPushTokenStore(): Promise<void> {
  const saved = await AsyncStorage.getItem(PUSH_TOKEN_KEY);
  if (saved) {
    _token = saved;
  }
}

export const storePushToken = async (token: string) => {
  _token = token;
  await AsyncStorage.setItem(PUSH_TOKEN_KEY, token);
  _callbacks.forEach((cb) => cb(token));
  _callbacks.length = 0;
};

export const getStoredToken = (): string | null => _token;

export const onPushToken = (cb: (token: string) => void): (() => void) => {
  if (_token) {
    cb(_token);
    return () => {};
  }
  _callbacks.push(cb);
  return () => {
    const i = _callbacks.indexOf(cb);
    if (i !== -1) _callbacks.splice(i, 1);
  };
};
