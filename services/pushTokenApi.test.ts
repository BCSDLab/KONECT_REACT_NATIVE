const mockStore = new Map<string, string>();
let mockAccessToken: string | null = null;

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(async (key: string) => mockStore.get(key) ?? null),
  setItemAsync: jest.fn(async (key: string, value: string) => {
    mockStore.set(key, value);
  }),
  deleteItemAsync: jest.fn(async (key: string) => {
    mockStore.delete(key);
  }),
}));

jest.mock('./nativeAuthStore', () => ({
  getAccessToken: jest.fn(async () => mockAccessToken),
}));

const PUSH_TOKEN = 'ExponentPushToken[device]';

function createAccessToken(payload: Record<string, unknown>): string {
  const encode = (value: object) =>
    btoa(JSON.stringify(value)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  return `${encode({ alg: 'HS256' })}.${encode(payload)}.signature`;
}

function response(status: number, body = ''): Response {
  return { ok: status >= 200 && status < 300, status, text: async () => body } as Response;
}

const fetchMock = jest.fn<Promise<Response>, [string, RequestInit]>();

function postCount(): number {
  return fetchMock.mock.calls.filter(([, init]) => init.method === 'POST').length;
}

type PushTokenApi = typeof import('./pushTokenApi');

// 모듈 안의 등록 기록 캐시를 테스트마다 비우고, 앱 재시작은 같은 저장소로 모듈을 다시 불러와 흉내 낸다.
function loadApi(): PushTokenApi {
  let api: PushTokenApi | undefined;
  jest.isolateModules(() => {
    api = jest.requireActual<PushTokenApi>('./pushTokenApi');
  });
  return api as PushTokenApi;
}

beforeEach(() => {
  mockStore.clear();
  mockAccessToken = null;
  fetchMock.mockReset();
  fetchMock.mockResolvedValue(response(200));
  globalThis.fetch = fetchMock as unknown as typeof fetch;
});

describe('registerPushToken', () => {
  it('같은 사용자가 같은 토큰을 다시 등록하면 요청을 보내지 않는다', async () => {
    const { registerPushToken } = loadApi();
    mockAccessToken = createAccessToken({ id: 1 });

    await registerPushToken(PUSH_TOKEN);
    await registerPushToken(PUSH_TOKEN);

    expect(postCount()).toBe(1);
  });

  it('로그아웃 없이 다른 사용자로 바뀌면 같은 토큰이라도 다시 등록한다', async () => {
    const { registerPushToken } = loadApi();

    mockAccessToken = createAccessToken({ id: 1 });
    await registerPushToken(PUSH_TOKEN);

    mockAccessToken = createAccessToken({ id: 2 });
    await registerPushToken(PUSH_TOKEN);

    expect(postCount()).toBe(2);
    expect(fetchMock.mock.calls[1][1].headers).toMatchObject({
      Authorization: `Bearer ${mockAccessToken}`,
    });
  });

  it('앱을 다시 켠 뒤에도 사용자 단위 등록 기록으로 중복 요청을 건너뛴다', async () => {
    mockAccessToken = createAccessToken({ id: 1 });
    await loadApi().registerPushToken(PUSH_TOKEN);

    await loadApi().registerPushToken(PUSH_TOKEN);

    expect(postCount()).toBe(1);
  });

  it('서버가 중복 등록으로 응답하면 등록된 것으로 기억한다', async () => {
    const { registerPushToken } = loadApi();
    mockAccessToken = createAccessToken({ id: 1 });
    fetchMock.mockResolvedValueOnce(response(409));

    await registerPushToken(PUSH_TOKEN);
    await registerPushToken(PUSH_TOKEN);

    expect(postCount()).toBe(1);
  });

  it('등록에 실패하면 기억하지 않고 다음에 다시 시도한다', async () => {
    const { registerPushToken } = loadApi();
    mockAccessToken = createAccessToken({ id: 1 });
    fetchMock.mockResolvedValueOnce(response(500));

    await expect(registerPushToken(PUSH_TOKEN)).rejects.toThrow('registerPushToken failed: 500');
    await registerPushToken(PUSH_TOKEN);

    expect(postCount()).toBe(2);
  });

  it('사용자를 알 수 없는 토큰이면 기억으로 건너뛰지 않는다', async () => {
    const { registerPushToken } = loadApi();
    mockAccessToken = 'not-a-jwt';

    await registerPushToken(PUSH_TOKEN);
    await registerPushToken(PUSH_TOKEN);

    expect(postCount()).toBe(2);
  });

  it('이전 형식(토큰만 저장)의 기록이 있으면 한 번 다시 등록한다', async () => {
    mockStore.set('REGISTERED_PUSH_TOKEN', PUSH_TOKEN);
    const { registerPushToken } = loadApi();
    mockAccessToken = createAccessToken({ id: 1 });

    await registerPushToken(PUSH_TOKEN);
    await registerPushToken(PUSH_TOKEN);

    expect(postCount()).toBe(1);
  });

  it('동시에 같은 등록을 요청하면 요청을 하나로 합친다', async () => {
    const { registerPushToken } = loadApi();
    mockAccessToken = createAccessToken({ id: 1 });

    await Promise.all([registerPushToken(PUSH_TOKEN), registerPushToken(PUSH_TOKEN)]);

    expect(postCount()).toBe(1);
  });
});

describe('unregisterPushToken', () => {
  it('해제에 성공하면 기록을 지워 같은 사용자도 다시 등록할 수 있다', async () => {
    const { registerPushToken, unregisterPushToken } = loadApi();
    mockAccessToken = createAccessToken({ id: 1 });

    await registerPushToken(PUSH_TOKEN);
    await unregisterPushToken(PUSH_TOKEN);
    await registerPushToken(PUSH_TOKEN);

    expect(postCount()).toBe(2);
  });

  it('해제에 실패하면 기록을 유지한다', async () => {
    const { registerPushToken, unregisterPushToken } = loadApi();
    mockAccessToken = createAccessToken({ id: 1 });

    await registerPushToken(PUSH_TOKEN);
    fetchMock.mockResolvedValueOnce(response(500));
    await expect(unregisterPushToken(PUSH_TOKEN)).rejects.toThrow(
      'unregisterPushToken failed: 500'
    );
    await registerPushToken(PUSH_TOKEN);

    expect(postCount()).toBe(1);
  });
});
