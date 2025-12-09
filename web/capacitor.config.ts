import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.ishedeadyet.app',
  appName: 'Is He Dead Yet',
  webDir: 'build',
  server: {
    // Allow connections to your Netlify backend
    allowNavigation: ['*.netlify.app', '*.netlify.com']
  },
  ios: {
    contentInset: 'automatic'
  },
  android: {
    allowMixedContent: true
  }
};

export default config;
