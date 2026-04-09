import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { NotificationPermissionState, NotificationPreferences } from '../types';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

const MEAL_REMINDER_CHANNEL = 'meal-reminders';

function parseTimeString(value: string) {
  const match = value.trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return null;

  const hour = Number(match[1]);
  const minute = Number(match[2]);

  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return null;

  return { hour, minute };
}

async function ensureAndroidChannel() {
  if (Platform.OS !== 'android') return;

  await Notifications.setNotificationChannelAsync(MEAL_REMINDER_CHANNEL, {
    name: '식사 알림',
    importance: Notifications.AndroidImportance.DEFAULT,
    description: '점심과 저녁 메뉴를 미리 떠올릴 수 있게 도와줘요.',
  });
}

function toPermissionState(status: Notifications.PermissionStatus): NotificationPermissionState {
  if (status === 'granted') return 'granted';
  if (status === 'denied') return 'denied';
  return 'unknown';
}

export async function getNotificationPermissionStatus() {
  const permissions = await Notifications.getPermissionsAsync();
  return toPermissionState(permissions.status);
}

export async function requestNotificationPermission() {
  const permissions = await Notifications.requestPermissionsAsync();
  return toPermissionState(permissions.status);
}

async function scheduleDailyReminder(title: string, body: string, time: string) {
  const parsed = parseTimeString(time);
  if (!parsed) return;

  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: parsed.hour,
      minute: parsed.minute,
      channelId: Platform.OS === 'android' ? MEAL_REMINDER_CHANNEL : undefined,
    },
  });
}

export async function syncMealReminders(preferences: NotificationPreferences) {
  const permissionStatus = await getNotificationPermissionStatus();

  if (permissionStatus !== 'granted') {
    return permissionStatus;
  }

  await ensureAndroidChannel();
  await Notifications.cancelAllScheduledNotificationsAsync();

  if (preferences.lunchEnabled) {
    await scheduleDailyReminder(
      '점심 시간 다가와요',
      '한끼비서가 오늘 메뉴를 골라드릴게요.',
      preferences.lunchTime
    );
  }

  if (preferences.dinnerEnabled) {
    await scheduleDailyReminder(
      '저녁 준비할 시간이에요',
      '오늘 저녁 메뉴부터 정해볼까요?',
      preferences.dinnerTime
    );
  }

  return permissionStatus;
}

export function isValidNotificationTime(value: string) {
  return parseTimeString(value) !== null;
}
