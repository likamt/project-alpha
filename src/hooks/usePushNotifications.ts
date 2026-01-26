import { useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { PushNotifications, Token, PushNotificationSchema, ActionPerformed } from '@capacitor/push-notifications';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const usePushNotifications = () => {
  const [token, setToken] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Only run on native platforms
    if (!Capacitor.isNativePlatform()) {
      return;
    }

    setIsSupported(true);
    initializePushNotifications();
  }, []);

  const initializePushNotifications = async () => {
    try {
      // Request permission
      const permStatus = await PushNotifications.requestPermissions();
      
      if (permStatus.receive === 'granted') {
        // Register with Apple / Google to receive push via APNS/FCM
        await PushNotifications.register();
      } else {
        console.log('Push notification permission denied');
      }

      // On success, save the token to database
      PushNotifications.addListener('registration', async (tokenData: Token) => {
        console.log('Push registration success, token: ' + tokenData.value);
        setToken(tokenData.value);
        
        // Save token to user's profile
        await saveTokenToDatabase(tokenData.value);
      });

      // Handle registration errors
      PushNotifications.addListener('registrationError', (error: any) => {
        console.error('Error on registration: ' + JSON.stringify(error));
      });

      // Handle push notification received while app is in foreground
      PushNotifications.addListener('pushNotificationReceived', (notification: PushNotificationSchema) => {
        console.log('Push received: ' + JSON.stringify(notification));
        toast({
          title: notification.title || 'إشعار جديد',
          description: notification.body || '',
        });
      });

      // Handle push notification action (user tapped on notification)
      PushNotifications.addListener('pushNotificationActionPerformed', (notification: ActionPerformed) => {
        console.log('Push action performed: ' + JSON.stringify(notification));
        // Handle navigation based on notification data
        handleNotificationAction(notification);
      });

    } catch (error) {
      console.error('Error initializing push notifications:', error);
    }
  };

  const saveTokenToDatabase = async (pushToken: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Store token in a push_tokens table or in user profile
      // For now, we'll log it - you can create a push_tokens table later
      console.log('Push token for user', user.id, ':', pushToken);
      
    } catch (error) {
      console.error('Error saving push token:', error);
    }
  };

  const handleNotificationAction = (notification: ActionPerformed) => {
    const data = notification.notification.data;
    
    // Navigate based on notification type
    if (data?.type === 'new_order') {
      window.location.href = '/my-orders';
    } else if (data?.type === 'new_message') {
      window.location.href = '/messages';
    } else if (data?.type === 'booking_update') {
      window.location.href = '/my-bookings';
    }
  };

  const requestPermission = async () => {
    if (!Capacitor.isNativePlatform()) {
      toast({
        title: 'غير متاح',
        description: 'إشعارات Push متاحة فقط على تطبيق الهاتف',
        variant: 'destructive',
      });
      return false;
    }

    const permStatus = await PushNotifications.requestPermissions();
    return permStatus.receive === 'granted';
  };

  return {
    token,
    isSupported,
    requestPermission,
  };
};
