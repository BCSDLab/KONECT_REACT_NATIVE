const APP_ENV = process.env.EXPO_PUBLIC_APP_ENV || 'production';

export const apiUrl =
  APP_ENV === 'development' ? 'https://api.stage.agit.gg' : 'https://api.agit.gg';
export const webUrl = APP_ENV === 'development' ? 'https://stage.agit.gg' : 'https://agit.gg';
