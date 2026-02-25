const APP_ENV = process.env.EXPO_PUBLIC_APP_ENV || 'production';
const API_ENV = process.env.EXPO_PUBLIC_API_ENV || APP_ENV;

export const apiUrl =
  API_ENV === 'development' ? 'https://api.stage.agit.gg' : 'https://api.agit.gg';
export const webUrl = API_ENV === 'development' ? 'https://stage.agit.gg' : 'https://agit.gg';
