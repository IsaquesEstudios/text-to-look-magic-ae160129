/// <reference types="@capacitor/status-bar" />
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.discovery.investments',
  appName: 'Discovery Investments',
  webDir: 'dist',
  android: {
    backgroundColor: '#141414',
    allowMixedContent: true,
    webContentsDebuggingEnabled: false,
  },
  ios: {
    backgroundColor: '#141414',
    contentInset: 'never',
  },
  plugins: {
    StatusBar: {
      overlaysWebView: false,
      backgroundColor: '#141414',
      style: 'LIGHT',
    },
  },
};

export default config;
