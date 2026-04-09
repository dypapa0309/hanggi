import React, { ReactNode, useMemo } from 'react';
import { SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { AppRouteName, appRoutes, theme } from '../theme';
import { useWeather } from '../hooks/useWeather';
import { useAppStore } from '../store';
import { WeatherCondition } from '../types';
import rawMenusData from '../data/menus.json';

interface AppShellProps {
  activeRoute: AppRouteName;
  title: string;
  subtitle?: string;
  children: ReactNode;
}

const menus = rawMenusData as { id: string; name: string }[];

const WEATHER_META: Record<WeatherCondition, { label: string; emoji: string }> = {
  rain: { label: '비가 와요', emoji: '🌧️' },
  cold: { label: '쌀쌀해요', emoji: '🧣' },
  hot: { label: '더워요', emoji: '☀️' },
  normal: { label: '무난한 날씨예요', emoji: '⛅' },
};

export default function AppShell({ activeRoute, title, subtitle, children }: AppShellProps) {
  const navigation = useNavigation<any>();
  const { weather } = useWeather();
  const { mealLogs } = useAppStore();

  const yesterdayMeals = useMemo(() => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const y = yesterday.getFullYear();
    const m = String(yesterday.getMonth() + 1).padStart(2, '0');
    const d = String(yesterday.getDate()).padStart(2, '0');
    const target = `${y}-${m}-${d}`;

    const names = mealLogs
      .filter((log) => {
        const eaten = new Date(log.eatenAt);
        const ey = eaten.getFullYear();
        const em = String(eaten.getMonth() + 1).padStart(2, '0');
        const ed = String(eaten.getDate()).padStart(2, '0');
        return `${ey}-${em}-${ed}` === target;
      })
      .map((log) => menus.find((menu) => menu.id === log.mealId)?.name ?? log.mealId);

    return Array.from(new Set(names)).slice(0, 2);
  }, [mealLogs]);

  const weatherMeta = WEATHER_META[weather?.condition ?? 'normal'];
  const weatherText = weather
    ? `${weatherMeta.label} · ${Math.round(weather.temp)}°`
    : '날씨를 확인하는 중이에요';
  const showContextCards = activeRoute === 'Home';

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.backgroundOrbTop} />
      <View style={styles.backgroundOrbBottom} />

      <View style={styles.container}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>{title}</Text>
            {!!subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
          </View>
          {showContextCards && (
            <View style={styles.contextRow}>
              <View style={styles.contextCard}>
                <Text style={styles.contextLabel}>오늘 날씨</Text>
                <View style={styles.weatherRow}>
                  <Text style={styles.weatherEmoji}>{weatherMeta.emoji}</Text>
                  <Text style={styles.contextBody}>{weatherText}</Text>
                </View>
              </View>

              <View style={styles.contextCard}>
                <Text style={styles.contextLabel}>어제 먹은 음식</Text>
                {yesterdayMeals.length > 0 ? (
                  <View style={styles.mealHintRow}>
                    {yesterdayMeals.map((meal) => (
                      <View key={meal} style={styles.mealHintPill}>
                        <Text style={styles.mealHintText}>{meal}</Text>
                      </View>
                    ))}
                  </View>
                ) : (
                  <Text style={styles.contextBody}>아직 기록이 없어요</Text>
                )}
              </View>
            </View>
          )}
        </View>

        <View style={styles.content}>{children}</View>

        <View style={styles.bottomBar}>
          {appRoutes.map((route) => {
            const active = route.key === activeRoute;
            return (
              <TouchableOpacity
                key={route.key}
                style={[styles.navItem, active && styles.navItemActive]}
                onPress={() => navigation.navigate(route.key)}
                activeOpacity={0.85}
              >
                <Text style={[styles.navItemText, active && styles.navItemTextActive]}>
                  {route.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.surface,
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
  },
  backgroundOrbTop: {
    position: 'absolute',
    top: -80,
    right: -20,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: theme.colors.primarySoft,
  },
  backgroundOrbBottom: {
    position: 'absolute',
    bottom: -80,
    left: -30,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: theme.colors.surfaceMuted,
  },
  header: {
    marginBottom: 18,
    gap: 14,
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
    color: theme.colors.text,
  },
  subtitle: {
    marginTop: 6,
    fontSize: 14,
    lineHeight: 20,
    color: theme.colors.muted,
  },
  contextRow: {
    flexDirection: 'row',
    gap: 10,
  },
  contextCard: {
    flex: 1,
    backgroundColor: theme.colors.white,
    borderWidth: 1,
    borderColor: theme.colors.line,
    borderRadius: theme.radius.md,
    padding: 14,
    gap: 8,
    ...theme.shadow.card,
  },
  contextLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: theme.colors.primary,
  },
  weatherRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  weatherEmoji: {
    fontSize: 20,
  },
  contextBody: {
    flexShrink: 1,
    fontSize: 13,
    lineHeight: 18,
    color: theme.colors.text,
    fontWeight: '700',
  },
  mealHintRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  mealHintPill: {
    backgroundColor: theme.colors.primarySoft,
    borderRadius: theme.radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  mealHintText: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.deep,
  },
  content: {
    flex: 1,
  },
  bottomBar: {
    flexDirection: 'row',
    backgroundColor: theme.colors.white,
    borderRadius: theme.radius.lg,
    padding: 8,
    gap: 6,
    borderWidth: 1,
    borderColor: theme.colors.line,
    ...theme.shadow.card,
  },
  navItem: {
    flex: 1,
    borderRadius: theme.radius.pill,
    paddingVertical: 12,
    alignItems: 'center',
  },
  navItemActive: {
    backgroundColor: theme.colors.primary,
  },
  navItemText: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.muted,
  },
  navItemTextActive: {
    color: theme.colors.white,
  },
});
