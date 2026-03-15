import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.watchmirror.app',
  appName: 'WATCHMIRROR',
  webDir: 'out',
  android: {
    allowMixedContent: true
  }
};

export default config;
