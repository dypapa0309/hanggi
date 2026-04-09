import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAppStore } from './src/store';
import OnboardingScreen from './src/components/OnboardingScreen';
import HomeScreen from './src/components/HomeScreen';
import CalendarScreen from './src/components/CalendarScreen';
import SettingsScreen from './src/components/SettingsScreen';
import PaywallScreen from './src/components/PaywallScreen';
import { configurePurchasesSafely, getCustomerInfoSafely } from './src/services/purchases';
import {
  getNotificationPermissionStatus,
  syncMealReminders,
} from './src/services/notifications';
import { theme } from './src/theme';

const Stack = createStackNavigator();

export default function App() {
  const {
    loadFromStorage,
    initTrialIfNeeded,
    hasAccess,
    setPurchased,
    setNotificationPermissionStatus,
  } = useAppStore();
  const [isOnboarded, setIsOnboarded] = useState<boolean | null>(null);
  const [accessGranted, setAccessGranted] = useState<boolean | null>(null);

  useEffect(() => {
    const init = async () => {
      let onboarded = false;
      let access = false;

      try {
        await configurePurchasesSafely();

        // 스토리지 로드
        await loadFromStorage();

        const notificationPermission = await getNotificationPermissionStatus();
        setNotificationPermissionStatus(notificationPermission);

        if (notificationPermission === 'granted') {
          await syncMealReminders(useAppStore.getState().notificationPreferences);
        }

        // 트라이얼 시작일 기록 (최초 실행 시)
        initTrialIfNeeded();

        // RevenueCat에서 구매 상태 확인
        const customerInfo = await getCustomerInfoSafely();
        const purchased = customerInfo
          ? Object.keys(customerInfo.entitlements.active).length > 0
          : false;
        if (purchased) setPurchased(true);
      } catch (error) {
        console.error('App init failed:', error);
      } finally {
        try {
          const onboardedStr = await AsyncStorage.getItem('is-onboarded');
          onboarded = onboardedStr === 'true';
        } catch (storageError) {
          console.error('Failed to read onboarding state:', storageError);
        }

        try {
          access = useAppStore.getState().hasAccess();
        } catch (storeError) {
          console.error('Failed to resolve access state:', storeError);
          access = hasAccess();
        }

        setIsOnboarded(onboarded);
        setAccessGranted(access);
      }
    };
    init();
  }, [hasAccess, initTrialIfNeeded, loadFromStorage, setNotificationPermissionStatus, setPurchased]);

  if (isOnboarded === null || accessGranted === null) {
    return (
      <GestureHandlerRootView style={styles.container}>
        <View style={styles.loadingScreen}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingTitle}>한끼비서 준비 중</Text>
          <Text style={styles.loadingText}>초기 설정을 확인하고 있어요.</Text>
        </View>
      </GestureHandlerRootView>
    );
  }

  if (!isOnboarded) {
    return (
      <GestureHandlerRootView style={styles.container}>
        <OnboardingScreen
          onComplete={() => {
            setIsOnboarded(true);
            setAccessGranted(useAppStore.getState().hasAccess());
          }}
        />
      </GestureHandlerRootView>
    );
  }

  if (!accessGranted) {
    return (
      <GestureHandlerRootView style={styles.container}>
        <PaywallScreen onPurchased={() => setAccessGranted(true)} />
      </GestureHandlerRootView>
    );
  }

  return (
    <GestureHandlerRootView style={styles.container}>
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName="Home"
          detachInactiveScreens={false}
          screenOptions={{
            animation: 'none',
            cardShadowEnabled: false,
            gestureEnabled: false,
            headerShown: false,
          }}
        >
          <Stack.Screen name="Home" component={HomeScreen} options={{ title: '한끼비서' }} />
          <Stack.Screen name="Calendar" component={CalendarScreen} options={{ title: '달력' }} />
          <Stack.Screen name="Settings" component={SettingsScreen} options={{ title: '설정' }} />
        </Stack.Navigator>
        <StatusBar style="auto" />
      </NavigationContainer>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.white,
  },
  loadingScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingHorizontal: 24,
    backgroundColor: theme.colors.surface,
  },
  loadingTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.text,
  },
  loadingText: {
    fontSize: 14,
    color: theme.colors.muted,
    textAlign: 'center',
  },
});
