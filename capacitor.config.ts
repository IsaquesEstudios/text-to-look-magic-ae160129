import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.49ba0e0710164b45a06f70056be9b8cc',
  appName: 'Discovery Investments',
  webDir: 'dist',
  android: {
    backgroundColor: '#141414',
    allowMixedContent: true,
    webContentsDebuggingEnabled: false,
  },
  ios: {
    contentInset: 'always',
  },
};

export default config;
