import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.49ba0e0710164b45a06f70056be9b8cc',
  appName: 'Discovery Investments',
  webDir: 'dist',
  server: {
    url: 'https://text-to-look-magic.lovable.app/auth?forceHideBadge=true',
    cleartext: true,
  },
};

export default config;
