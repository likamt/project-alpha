import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.ad5327c10d0749f58bd7d26f59524690',
  appName: 'HIRAF',
  webDir: 'dist',
  server: {
    url: 'https://ad5327c1-0d07-49f5-8bd7-d26f59524690.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  plugins: {
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"]
    },
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: "#3b82f6",
      showSpinner: false
    }
  }
};

export default config;
