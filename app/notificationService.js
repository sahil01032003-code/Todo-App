import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';


// ✅ Setup actionable notification buttons
export async function setupNotificationCategories() {
  await Notifications.setNotificationCategoryAsync('task_reminder', [
    {
      identifier: 'mark_done',
      buttonTitle: '✅ Mark Done',
      options: {
        isDestructive: false,
        isAuthenticationRequired: false,
      },
    },
    {
      identifier: 'dismiss',
      buttonTitle: '❌ Dismiss',
      options: {
        isDestructive: true,
        isAuthenticationRequired: false,
      },
    },
  ]);

  await Notifications.setNotificationCategoryAsync('task_completed', [
    {
      identifier: 'view_tasks',
      buttonTitle: '📋 View Tasks',
      options: {
        isDestructive: false,
        isAuthenticationRequired: false,
      },
    },
  ]);

  console.log('✅ Notification categories set up');
}


export async function registerForPushNotification() {

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      sound: 'default',
      lightColor: '#534AB7',
      enableVibrate: true,
      showBadge: true,
    });
  }

  if (!Device.isDevice) {
    console.log('Not a real device — push token skipped');
    return null;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    alert('Permission denied for notifications');
    return null;
  }

  const token = await Notifications.getExpoPushTokenAsync({
    projectId: '73e1e772-867e-48c9-a095-e395a4f95425',
  });

  console.log('Push token:', token.data);
  return token.data;
}

export async function sendLocalNotification(title, body, data = {}) {
  const { status } = await Notifications.getPermissionsAsync();
  if (status !== 'granted') {
    console.log('No notification permission');
    return;
  }

  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data,
      sound: 'default',
    },
    trigger: null,
  });
}

export async function cancelNotification(id) {
  if (!id) return;
  try {
    await Notifications.cancelScheduledNotificationAsync(id);
    console.log('✅ Notification cancelled:', id);
  } catch (error) {
    console.log('❌ Error cancelling notification:', error);
  }
}

export async function scheduleNotification(title, body, seconds, repeats = false, data = {}) {
  const { status } = await Notifications.getPermissionsAsync();
  if (status !== 'granted') {
    console.log('No notification permission');
    return;
  }

  const validSeconds = typeof seconds === 'number' && seconds > 0 ? seconds : 10;
  console.log('Scheduling:', title, 'in', validSeconds, 'seconds');

  try {
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        sound: 'default',
        data,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, // ✅ required in newer versions
        seconds: validSeconds,
        repeats,
      },
    });
    console.log('✅ Scheduled id:', id);

    // ✅ Verify it was scheduled
    const all = await Notifications.getAllScheduledNotificationsAsync();
    console.log('✅ Total scheduled after:', all.length);
    return id;
  } catch (error) {
    console.log('❌ Error:', error);
  }
}