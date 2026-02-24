let _token: string | null = null;
const _callbacks: ((token: string) => void)[] = [];

export const storePushToken = (token: string) => {
  _token = token;
  _callbacks.forEach((cb) => cb(token));
  _callbacks.length = 0;
};

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
