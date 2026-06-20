import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'cn.com.schoolsystem.app',
  appName: '校衡台',
  webDir: 'dist',
  server: {
    url: 'https://schoolsystem.com.cn',
    cleartext: false,
    allowNavigation: ['schoolsystem.com.cn'],
  },
  android: {
    backgroundColor: '#f7f8fb',
  },
  ios: {
    backgroundColor: '#f7f8fb',
    contentInset: 'automatic',
    preferredContentMode: 'mobile',
  },
};

export default config;
