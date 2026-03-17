import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.royalqueen.app',
  appName: 'RoyalQueen',
  webDir: 'out',
  server: {
  androidScheme: 'https',
  cleartext: true,
  allowNavigation: ['cinestream-production-7749.up.railway.app']
},
  android: {
    backgroundColor: '#0a0a0f',
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#0a0a0f',
      showSpinner: false,
    },
  },
};

export default config;
