import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.discovery.investments',
  appName: 'Discovery Investments',
  webDir: 'dist',
  server: {
    url: 'https://text-to-look-magic.lovable.app?forceHideBadge=true',
    cleartext: true,
  },
};

export default config;
