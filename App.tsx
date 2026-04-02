import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Purchases from 'react-native-purchases';
import { useAppStore } from './src/store';
import OnboardingScreen from './src/components/OnboardingScreen';
import HomeScreen from './src/components/HomeScreen';
import LogScreen from './src/components/LogScreen';
import CalendarScreen from './src/components/CalendarScreen';
import SettingsScreen from './src/components/SettingsScreen';
import PaywallScreen from './src/components/PaywallScreen';

// RevenueCat API 키 — RevenueCat 대시보드에서 발급 후 입력
const REVENUECAT_IOS_KEY = 'appl_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX';
const REVENUECAT_ANDROID_KEY = 'goog_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX';

const Stack = createStackNavigator();

export default function App() {
  const { loadFromStorage, initTrialIfNeeded, hasAccess, setPurchased } = useAppStore();
  const [isOnboarded, setIsOnboarded] = useState<boolean | null>(null);
  const [accessGranted, setAccessGranted] = useState<boolean | null>(null);

  useEffect(() => {
    const init = async () => {
      // RevenueCat 초기화
      const apiKey = Platform.OS === 'ios' ? REVENUECAT_IOS_KEY : REVENUECAT_ANDROID_KEY;
      Purchases.configure({ apiKey });

      // 스토리지 로드
      await loadFromStorage();

      // 트라이얼 시작일 기록 (최초 실행 시)
      initTrialIfNeeded();

      // RevenueCat에서 구매 상태 확인
      try {
        const customerInfo = await Purchases.getCustomerInfo();
        const purchased = Object.keys(customerInfo.entitlements.active).length > 0;
        if (purchased) setPurchased(true);
      } catch {
        // 네트워크 오류 등 — 로컬 상태 그대로 사용
      }

      // 온보딩 체크
      const onboardedStr = await AsyncStorage.getItem('is-onboarded');
      setIsOnboarded(onboardedStr === 'true');

      // 접근 권한 체크 (store가 업데이트된 후)
      setAccessGranted(useAppStore.getState().hasAccess());
    };
    init();
  }, []);

  if (isOnboarded === null || accessGranted === null) {
    return <View style={styles.container} />;
  }

  if (!isOnboarded) {
    return (
      <OnboardingScreen
        onComplete={() => {
          setIsOnboarded(true);
          setAccessGranted(useAppStore.getState().hasAccess());
        }}
      />
    );
  }

  if (!accessGranted) {
    return (
      <PaywallScreen onPurchased={() => setAccessGranted(true)} />
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Home">
        <Stack.Screen name="Home" component={HomeScreen} options={{ title: '한끼비서' }} />
        <Stack.Screen name="Log" component={LogScreen} options={{ title: '먹었던 음식' }} />
        <Stack.Screen name="Calendar" component={CalendarScreen} options={{ title: '먹었던 달력' }} />
        <Stack.Screen name="Settings" component={SettingsScreen} options={{ title: '설정' }} />
      </Stack.Navigator>
      <StatusBar style="auto" />
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
});
