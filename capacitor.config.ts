import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.discovery.investments',
  appName: 'Discovery Investments',
  webDir: 'dist',
  server: {
    url: 'https://49ba0e07-1016-4b45-a06f-70056be9b8cc.lovableproject.com?forceHideBadge=true',
    cleartext: true,
  },
};

export default config;
