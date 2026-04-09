import React, { useMemo, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useAppStore } from '../store';
import { getDiningTypeLabel, getGoalLabel } from '../utils/translateKor';
import AppShell from './AppShell';
import { theme } from '../theme';
import { GoalMode, NotificationPreferences, UserCondition } from '../types';
import {
  isValidNotificationTime,
  requestNotificationPermission,
  syncMealReminders,
} from '../services/notifications';
import {
  LocationCandidate,
  resolveSearchLocation,
  searchLocationCandidates,
} from '../services/location';

const CONDITIONS: { value: UserCondition; label: string; icon: string }[] = [
  { value: 'quick', label: '빨리', icon: '⚡' },
  { value: 'cozy', label: '편안하게', icon: '🛋️' },
  { value: 'fresh', label: '산뜻하게', icon: '🥗' },
  { value: 'protein', label: '단백질', icon: '💪' },
  { value: 'soup', label: '국물', icon: '🍲' },
];

const GOAL_OPTIONS: GoalMode[] = ['free', 'balance', 'diet', 'gogodang'];
const DINING_TYPES: Array<'solo' | 'pair' | 'group'> = ['solo', 'pair', 'group'];

type ReminderKey = 'lunchTime' | 'dinnerTime';
type ReminderToggleKey = 'lunchEnabled' | 'dinnerEnabled';

export default function SettingsScreen() {
  const {
    user,
    currentState,
    notificationPreferences,
    locationContext,
    setUser,
    setCurrentState,
    setNotificationPreferences,
    setNotificationPermissionStatus,
    setLocationContext,
  } = useAppStore();

  const [dislike, setDislike] = useState('');
  const [notificationDraft, setNotificationDraft] = useState(notificationPreferences);
  const [savingNotifications, setSavingNotifications] = useState(false);
  const [locationQuery, setLocationQuery] = useState('');
  const [locationResults, setLocationResults] = useState<LocationCandidate[]>([]);
  const [searchingLocation, setSearchingLocation] = useState(false);
  const [refreshingLocation, setRefreshingLocation] = useState(false);

  const permissionLabel = useMemo(() => {
    if (notificationPreferences.permissionStatus === 'granted') return '알림 허용됨';
    if (notificationPreferences.permissionStatus === 'denied') return '알림이 꺼져 있어요';
    return '알림 권한을 확인해볼게요';
  }, [notificationPreferences.permissionStatus]);

  const locationSourceLabel = useMemo(() => {
    if (locationContext.source === 'current') return '현재 위치 사용 중';
    if (locationContext.source === 'manual') return '직접 설정한 위치 사용 중';
    return '기본 위치 사용 중';
  }, [locationContext.source]);

  const locationPermissionLabel = useMemo(() => {
    if (locationContext.permissionStatus === 'granted') return '위치 권한 허용됨';
    if (locationContext.permissionStatus === 'denied') return '위치 권한이 꺼져 있어요';
    return '위치 권한을 아직 확인하지 않았어요';
  }, [locationContext.permissionStatus]);

  const normalizeDislike = (value: string) => value.trim();

  const handleGoalChange = (goal: GoalMode) => {
    setUser({ goalMode: goal });
    setCurrentState({ goal });
  };

  const handleConditionChange = (condition: UserCondition) => {
    setCurrentState({ condition });
  };

  const handleDiningChange = (type: 'solo' | 'pair' | 'group') => {
    setUser({ defaultDiningType: type });
    setCurrentState({ diningType: type });
  };

  const addDislike = () => {
    const trimmed = normalizeDislike(dislike);

    if (trimmed && !user.dislikes.includes(trimmed)) {
      setUser({ dislikes: [...user.dislikes, trimmed] });
      setDislike('');
    }
  };

  const updateDraft = (patch: Partial<NotificationPreferences>) => {
    setNotificationDraft((prev) => ({ ...prev, ...patch }));
  };

  const updateReminderTime = (key: ReminderKey, value: string) => {
    const next = value.replace(/[^\d:]/g, '').slice(0, 5);
    updateDraft({ [key]: next });
  };

  const updateReminderToggle = (key: ReminderToggleKey, value: boolean) => {
    updateDraft({ [key]: value });
  };

  const validateNotifications = () => {
    if (notificationDraft.lunchEnabled && !isValidNotificationTime(notificationDraft.lunchTime)) {
      Alert.alert('점심 알림 시간을 확인해주세요', '시간은 11:30처럼 입력해주시면 돼요.');
      return false;
    }

    if (notificationDraft.dinnerEnabled && !isValidNotificationTime(notificationDraft.dinnerTime)) {
      Alert.alert('저녁 알림 시간을 확인해주세요', '시간은 18:00처럼 입력해주시면 돼요.');
      return false;
    }

    return true;
  };

  const saveNotifications = async () => {
    if (!validateNotifications()) {
      return;
    }

    setSavingNotifications(true);

    try {
      const permissionStatus = await requestNotificationPermission();
      const nextPreferences: NotificationPreferences = {
        ...notificationDraft,
        permissionStatus,
      };

      setNotificationPermissionStatus(permissionStatus);
      setNotificationPreferences(nextPreferences);
      setNotificationDraft(nextPreferences);

      if (permissionStatus !== 'granted') {
        Alert.alert(
          '알림 권한이 필요해요',
          '설정에서 알림을 허용해주시면 점심과 저녁 전에 한끼비서가 미리 알려드릴게요.',
        );
        return;
      }

      await syncMealReminders(nextPreferences);
      Alert.alert('알림을 저장했어요', '점심과 저녁 전에 한끼비서가 챙겨드릴게요.');
    } catch (error) {
      console.error('Failed to save notifications:', error);
      Alert.alert('알림을 저장하지 못했어요', '잠시 후 다시 시도해주세요.');
    } finally {
      setSavingNotifications(false);
    }
  };

  const refreshCurrentLocation = async () => {
    setRefreshingLocation(true);
    try {
      const resolved = await resolveSearchLocation();
      setLocationContext({
        permissionStatus: resolved.permissionStatus,
        source: resolved.source,
        coords: resolved.coords,
        label: resolved.label,
        updatedAt: resolved.updatedAt,
      });
      setLocationResults([]);
      Alert.alert('위치를 업데이트했어요', `${resolved.label} 기준으로 다시 찾을게요.`);
    } catch (error) {
      console.error('Failed to refresh location:', error);
      Alert.alert('위치를 확인하지 못했어요', '잠시 후 다시 시도해주세요.');
    } finally {
      setRefreshingLocation(false);
    }
  };

  const handleSearchLocation = async () => {
    if (!locationQuery.trim()) {
      Alert.alert('위치를 입력해주세요', '주소나 장소 이름을 적으면 위치 후보를 찾아드릴게요.');
      return;
    }

    setSearchingLocation(true);
    try {
      const results = await searchLocationCandidates(locationQuery);
      setLocationResults(results);
      if (results.length === 0) {
        Alert.alert('위치를 찾지 못했어요', '다른 주소나 장소 이름으로 다시 검색해보세요.');
      }
    } catch (error) {
      console.error('Failed to search locations:', error);
      Alert.alert('위치를 찾지 못했어요', '잠시 후 다시 시도해주세요.');
    } finally {
      setSearchingLocation(false);
    }
  };

  const selectManualLocation = (candidate: LocationCandidate) => {
    setLocationContext({
      permissionStatus: locationContext.permissionStatus,
      source: 'manual',
      coords: candidate.coords,
      label: candidate.address ? `${candidate.label} · ${candidate.address}` : candidate.label,
      updatedAt: new Date().toISOString(),
    });
    setLocationResults([]);
    setLocationQuery(candidate.label);
    Alert.alert('위치를 설정했어요', `${candidate.label} 기준으로 근처 가게를 찾을게요.`);
  };

  return (
    <AppShell activeRoute="Settings" title="설정" subtitle="내 취향과 리듬에 맞게 한끼비서를 다듬어보세요">
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        style={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.panel}>
          <SectionHeader
            title="지금 컨디션"
            description="오늘 먹고 싶은 분위기를 알려주면 추천 톤이 더 자연스러워져요."
          />
          <View style={styles.chipRow}>
            {CONDITIONS.map((c) => (
              <TouchableOpacity
                key={c.value}
                style={[styles.conditionChip, currentState.condition === c.value && styles.conditionChipSelected]}
                onPress={() => handleConditionChange(c.value)}
              >
                <Text style={styles.conditionIcon}>{c.icon}</Text>
                <Text
                  style={[
                    styles.conditionLabel,
                    currentState.condition === c.value && styles.conditionLabelSelected,
                  ]}
                >
                  {c.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.panel}>
          <SectionHeader
            title="목표 모드"
            description="지금 어떤 식사 흐름을 더 자주 추천받고 싶은지 정해둘 수 있어요."
          />
          <View style={styles.optionStack}>
            {GOAL_OPTIONS.map((goal) => (
              <TouchableOpacity
                key={goal}
                style={[styles.optionCard, user.goalMode === goal && styles.optionCardSelected]}
                onPress={() => handleGoalChange(goal)}
              >
                <Text style={[styles.optionTitle, user.goalMode === goal && styles.optionTitleSelected]}>
                  {getGoalLabel(goal)}
                </Text>
                <Text style={[styles.optionDescription, user.goalMode === goal && styles.optionDescriptionSelected]}>
                  {goal === 'free' && '지금 끌리는 메뉴를 가볍게 추천해드려요.'}
                  {goal === 'balance' && '너무 무겁지 않게, 균형 잡힌 선택을 더 자주 보여줘요.'}
                  {goal === 'diet' && '조금 더 가볍고 부담 없는 식사를 우선으로 생각해요.'}
                  {goal === 'gogodang' && '당류·나트륨·가공 양념이 많은 메뉴는 보수적으로 제외해요.'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.panel}>
          <SectionHeader
            title="식사 상황"
            description="혼자 먹는지, 같이 먹는지에 따라 메뉴 분위기를 조금 다르게 볼 수 있어요."
          />
          <View style={styles.inlineCardRow}>
            {DINING_TYPES.map((type) => (
              <TouchableOpacity
                key={type}
                style={[styles.inlineCard, user.defaultDiningType === type && styles.inlineCardSelected]}
                onPress={() => handleDiningChange(type)}
              >
                <Text style={styles.inlineCardEmoji}>
                  {type === 'solo' ? '🧑' : type === 'pair' ? '🧑‍🤝‍🧑' : '👨‍👩‍👧'}
                </Text>
                <Text
                  style={[styles.inlineCardTitle, user.defaultDiningType === type && styles.inlineCardTitleSelected]}
                >
                  {getDiningTypeLabel(type)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.panel}>
          <SectionHeader
            title="외식 추천 기준 위치"
            description="지금 어떤 위치를 기준으로 근처 가게를 찾는지 확인하고, 직접 바꿀 수도 있어요."
          />

          <View style={styles.locationStatusCard}>
            <Text style={styles.locationStatusTitle}>{locationSourceLabel}</Text>
            <Text style={styles.locationStatusBody}>{locationContext.label}</Text>
            <Text style={styles.locationStatusMeta}>{locationPermissionLabel}</Text>
          </View>

          <View style={styles.locationActionRow}>
            <TouchableOpacity style={styles.inlineActionButton} onPress={refreshCurrentLocation} disabled={refreshingLocation}>
              <Text style={styles.inlineActionButtonText}>
                {refreshingLocation ? '현재 위치 확인 중...' : '현재 위치 다시 가져오기'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.locationSearchCard}>
            <Text style={styles.locationSearchTitle}>위치 직접 검색</Text>
            <Text style={styles.locationSearchDescription}>
              위치 권한이 없어도 주소나 장소 이름으로 기준 위치를 직접 바꿀 수 있어요.
            </Text>
            <View style={styles.dislikeInputRow}>
              <TextInput
                style={styles.input}
                value={locationQuery}
                onChangeText={setLocationQuery}
                placeholder="예: 성수역, 해운대구 우동"
                placeholderTextColor={theme.colors.muted}
              />
              <TouchableOpacity style={styles.addButton} onPress={handleSearchLocation} disabled={searchingLocation}>
                <Text style={styles.addButtonText}>{searchingLocation ? '검색 중' : '검색'}</Text>
              </TouchableOpacity>
            </View>

            {locationResults.length > 0 && (
              <View style={styles.locationResultList}>
                {locationResults.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    style={styles.locationResultItem}
                    onPress={() => selectManualLocation(item)}
                  >
                    <Text style={styles.locationResultLabel}>{item.label}</Text>
                    <Text style={styles.locationResultAddress}>{item.address}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        </View>

        <View style={styles.panel}>
          <SectionHeader
            title="점심 · 저녁 알림"
            description="점심은 11:30, 저녁은 18:00을 기본값으로 두고 미리 챙겨드릴게요."
          />

          <View style={styles.permissionBadge}>
            <Text style={styles.permissionBadgeLabel}>{permissionLabel}</Text>
            <Text style={styles.permissionBadgeHint}>시간은 직접 바꿀 수 있어요.</Text>
          </View>

          <ReminderRow
            title="점심 알림"
            description="설정한 시간에 점심 메뉴를 떠올릴 수 있게 미리 알려드릴게요."
            value={notificationDraft.lunchTime}
            enabled={notificationDraft.lunchEnabled}
            onToggle={(value) => updateReminderToggle('lunchEnabled', value)}
            onChangeText={(value) => updateReminderTime('lunchTime', value)}
          />

          <ReminderRow
            title="저녁 알림"
            description="설정한 시간에 저녁 준비를 시작할 수 있게 먼저 알려드릴게요."
            value={notificationDraft.dinnerTime}
            enabled={notificationDraft.dinnerEnabled}
            onToggle={(value) => updateReminderToggle('dinnerEnabled', value)}
            onChangeText={(value) => updateReminderTime('dinnerTime', value)}
          />

          <TouchableOpacity style={styles.primaryButton} onPress={saveNotifications} disabled={savingNotifications}>
            <Text style={styles.primaryButtonText}>
              {savingNotifications ? '알림 저장 중...' : '알림 시간 저장하기'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.panel}>
          <SectionHeader
            title="싫어하는 메뉴"
            description="먹고 싶지 않은 메뉴를 적어두면 추천에서 자연스럽게 피해볼게요."
          />
          <View style={styles.dislikeInputRow}>
            <TextInput
              style={styles.input}
              value={dislike}
              onChangeText={setDislike}
              placeholder="예: 마라탕, 회"
              placeholderTextColor={theme.colors.muted}
            />
            <TouchableOpacity style={styles.addButton} onPress={addDislike}>
              <Text style={styles.addButtonText}>추가</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.dislikeWrap}>
            {user.dislikes.length > 0 ? (
              user.dislikes.map((item, index) => (
                <View key={`${item}-${index}`} style={styles.dislikePill}>
                  <Text style={styles.dislikeText}>{item}</Text>
                </View>
              ))
            ) : (
              <Text style={styles.emptyHint}>아직 적어둔 메뉴가 없어요.</Text>
            )}
          </View>
        </View>
      </ScrollView>
    </AppShell>
  );
}

function SectionHeader({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Text style={styles.sectionDescription}>{description}</Text>
    </View>
  );
}

function ReminderRow({
  title,
  description,
  value,
  enabled,
  onToggle,
  onChangeText,
}: {
  title: string;
  description: string;
  value: string;
  enabled: boolean;
  onToggle: (value: boolean) => void;
  onChangeText: (value: string) => void;
}) {
  return (
    <View style={styles.reminderCard}>
      <View style={styles.reminderHeader}>
        <View style={styles.reminderCopy}>
          <Text style={styles.reminderTitle}>{title}</Text>
          <Text style={styles.reminderDescription}>{description}</Text>
        </View>
        <Switch
          value={enabled}
          onValueChange={onToggle}
          thumbColor={enabled ? theme.colors.white : theme.colors.surface}
          trackColor={{ false: theme.colors.line, true: theme.colors.primary }}
        />
      </View>
      <TextInput
        style={[styles.timeInput, !enabled && styles.timeInputDisabled]}
        value={value}
        onChangeText={onChangeText}
        placeholder="11:30"
        keyboardType="numbers-and-punctuation"
        placeholderTextColor={theme.colors.muted}
        editable={enabled}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  scrollContent: {
    paddingBottom: 28,
    gap: 16,
  },
  panel: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.radius.lg,
    padding: 20,
    borderWidth: 1,
    borderColor: theme.colors.line,
    ...theme.shadow.card,
  },
  sectionHeader: {
    marginBottom: 16,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: theme.colors.deep,
  },
  sectionDescription: {
    fontSize: 14,
    lineHeight: 21,
    color: theme.colors.muted,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  conditionChip: {
    minWidth: '30%',
    flexGrow: 1,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: theme.colors.line,
    alignItems: 'center',
    gap: 6,
  },
  conditionChipSelected: {
    backgroundColor: theme.colors.primarySoft,
    borderColor: theme.colors.primary,
  },
  conditionIcon: {
    fontSize: 20,
  },
  conditionLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.text,
  },
  conditionLabelSelected: {
    color: theme.colors.deep,
  },
  optionStack: {
    gap: 10,
  },
  optionCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.colors.line,
    gap: 6,
  },
  optionCardSelected: {
    backgroundColor: theme.colors.primarySoft,
    borderColor: theme.colors.primary,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: theme.colors.text,
  },
  optionTitleSelected: {
    color: theme.colors.deep,
  },
  optionDescription: {
    fontSize: 13,
    lineHeight: 20,
    color: theme.colors.muted,
  },
  optionDescriptionSelected: {
    color: theme.colors.deep,
  },
  inlineCardRow: {
    flexDirection: 'row',
    gap: 10,
  },
  inlineCard: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: theme.colors.line,
    alignItems: 'center',
    gap: 8,
  },
  inlineCardSelected: {
    backgroundColor: theme.colors.primarySoft,
    borderColor: theme.colors.primary,
  },
  inlineCardEmoji: {
    fontSize: 20,
  },
  inlineCardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.text,
  },
  inlineCardTitleSelected: {
    color: theme.colors.deep,
  },
  permissionBadge: {
    backgroundColor: theme.colors.surfaceMuted,
    borderRadius: theme.radius.md,
    padding: 14,
    marginBottom: 12,
    gap: 4,
    borderWidth: 1,
    borderColor: theme.colors.line,
  },
  permissionBadgeLabel: {
    fontSize: 14,
    fontWeight: '800',
    color: theme.colors.deep,
  },
  permissionBadgeHint: {
    fontSize: 13,
    color: theme.colors.muted,
  },
  locationStatusCard: {
    backgroundColor: theme.colors.surfaceMuted,
    borderRadius: theme.radius.md,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.colors.line,
    gap: 6,
  },
  locationStatusTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: theme.colors.deep,
  },
  locationStatusBody: {
    fontSize: 15,
    lineHeight: 21,
    color: theme.colors.text,
  },
  locationStatusMeta: {
    fontSize: 13,
    color: theme.colors.muted,
  },
  locationActionRow: {
    marginTop: 12,
  },
  inlineActionButton: {
    backgroundColor: theme.colors.primarySoft,
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    borderColor: theme.colors.primary,
    paddingVertical: 12,
    alignItems: 'center',
  },
  inlineActionButtonText: {
    fontSize: 14,
    fontWeight: '800',
    color: theme.colors.deep,
  },
  locationSearchCard: {
    marginTop: 12,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.colors.line,
    gap: 12,
  },
  locationSearchTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: theme.colors.deep,
  },
  locationSearchDescription: {
    fontSize: 13,
    lineHeight: 19,
    color: theme.colors.muted,
  },
  locationResultList: {
    gap: 8,
  },
  locationResultItem: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.radius.md,
    padding: 14,
    borderWidth: 1,
    borderColor: theme.colors.line,
  },
  locationResultLabel: {
    fontSize: 14,
    fontWeight: '800',
    color: theme.colors.text,
  },
  locationResultAddress: {
    marginTop: 4,
    fontSize: 12,
    lineHeight: 18,
    color: theme.colors.muted,
  },
  reminderCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.colors.line,
    gap: 12,
    marginBottom: 12,
  },
  reminderHeader: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  reminderCopy: {
    flex: 1,
    gap: 4,
  },
  reminderTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: theme.colors.deep,
  },
  reminderDescription: {
    fontSize: 13,
    lineHeight: 19,
    color: theme.colors.muted,
  },
  timeInput: {
    borderWidth: 1,
    borderColor: theme.colors.line,
    backgroundColor: theme.colors.white,
    borderRadius: theme.radius.md,
    paddingHorizontal: 14,
    paddingVertical: 13,
    color: theme.colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
  timeInputDisabled: {
    opacity: 0.45,
  },
  primaryButton: {
    backgroundColor: theme.colors.deep,
    borderRadius: theme.radius.pill,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 4,
  },
  primaryButtonText: {
    color: theme.colors.white,
    fontSize: 15,
    fontWeight: '800',
  },
  dislikeInputRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: theme.colors.line,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    paddingHorizontal: 14,
    paddingVertical: 13,
    color: theme.colors.text,
  },
  addButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.pill,
    paddingHorizontal: 18,
    paddingVertical: 13,
  },
  addButtonText: {
    color: theme.colors.white,
    fontWeight: '800',
  },
  dislikeWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 14,
  },
  dislikePill: {
    backgroundColor: theme.colors.primarySoft,
    borderRadius: theme.radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  dislikeText: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.text,
  },
  emptyHint: {
    fontSize: 13,
    color: theme.colors.muted,
  },
});
