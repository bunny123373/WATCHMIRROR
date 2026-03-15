import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.watchmirror.app',
  appName: 'WATCHMIRROR',
  webDir: '.next',
  server: {
    androidScheme: 'https',
    url: 'https://watchmirror.vercel.app'
  },
  android: {
    allowMixedContent: true
  }
};

export default config;
