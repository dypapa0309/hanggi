import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAppStore } from '../store';
import { useWeather } from '../hooks/useWeather';
import { useRecommendation } from '../hooks/useRecommendation';
import AppShell from './AppShell';
import { theme } from '../theme';
import { fetchNearbyRestaurants } from '../services/restaurantService';
import { InsightSummary } from '../types';
import MealIllustration from './MealIllustration';
import { getMealIllustrationKey, getRandomTimeBubble, getStandardMealName } from '../config/mealMeta';
import { withParticle } from '../utils/korean';
import { resolveSearchLocation } from '../services/location';

function detectTime() {
  const h = new Date().getHours();
  if (h >= 6 && h < 11) return 'breakfast' as const;
  if (h >= 11 && h < 16) return 'lunch' as const;
  if (h >= 16 && h < 22) return 'dinner' as const;
  return 'late' as const;
}

function buildMealInsight(mealIds: string[]): InsightSummary | null {
  if (mealIds.length < 2) return null;

  const counts = mealIds.reduce<Record<string, number>>((acc, mealId) => {
    acc[mealId] = (acc[mealId] ?? 0) + 1;
    return acc;
  }, {});

  const [topMealId, topCount] = Object.entries(counts).sort((a, b) => b[1] - a[1])[0] ?? [];
  if (!topMealId || !topCount || topCount < 2) return null;

  return {
    title: '메뉴 추천 이유',
    body: `최근엔 ${withParticle(getStandardMealName(topMealId), 'topic')} 자주 보여서, 이번엔 결이 조금 다른 메뉴를 먼저 챙겨봤어요.`,
  };
}

export default function HomeScreen() {
  const navigation = useNavigation<any>();
  const {
    currentState,
    user,
    mealLogs,
    recommendationSession,
    selectedMenu,
    locationContext,
    setCurrentState,
    startRecommendationSession,
    registerRecommendation,
    markSwapUsed,
    chooseMeal,
    completeRecommendationForCurrentTime,
    addMealLog,
    setPostChoiceFlow,
    setLocationContext,
    toggleSavedRestaurant,
    setRestaurantRecommendations,
    setRestaurantSearchDiagnostics,
    clearRestaurantRecommendations,
  } = useAppStore();

  const { weather } = useWeather();
  const [swapJustDone, setSwapJustDone] = useState(false);
  const [choiceOpen, setChoiceOpen] = useState(false);
  const [shoppingOpen, setShoppingOpen] = useState(false);
  const [restaurantOpen, setRestaurantOpen] = useState(false);
  const [loadingRestaurants, setLoadingRestaurants] = useState(false);

  useEffect(() => {
    const newState = {
      time: detectTime(),
      diningType: user.defaultDiningType,
      goal: user.goalMode,
      weather: weather?.condition || 'normal',
    };
    setCurrentState(newState);
    if (
      currentState.condition &&
      (!recommendationSession.condition || recommendationSession.completedForTime !== newState.time)
    ) {
      startRecommendationSession(currentState.condition);
    }
  }, [weather?.condition]);

  const { recommendation } = useRecommendation(currentState);
  const timeBubble = useMemo(() => getRandomTimeBubble(currentState.time), [currentState.time]);
  const insight = useMemo(
    () => buildMealInsight(mealLogs.slice(-5).map((log) => log.mealId)),
    [mealLogs]
  );
  const hasExternalRestaurants = recommendationSession.restaurantRecommendations.some(
    (item) => item.source === 'external'
  );
  const currentMealId = recommendation?.meal.id ?? selectedMenu?.mealId ?? null;
  const isCurrentTimeCompleted = recommendationSession.completedForTime === currentState.time;

  const openLocationSettings = () => {
    setChoiceOpen(false);
    navigation.navigate('Settings');
  };

  const buildEatOutFailureMessage = (
    locationLabel: string,
    locationSource: typeof locationContext.source,
    diagnostics: typeof recommendationSession.restaurantSearchDiagnostics
  ) => {

    if (!diagnostics) {
      return '지금 위치를 기준으로 근처 매장을 찾지 못했어요. 설정에서 위치를 확인해보세요.';
    }

    if (locationSource === 'fallback') {
      return `현재 위치를 받지 못해 ${locationLabel} 기준으로 찾았어요. 설정에서 위치를 직접 바꿔보세요.`;
    }

    if (diagnostics.dbCount === 0 && diagnostics.kakaoCount === 0 && diagnostics.seedCount === 0) {
      return `${locationLabel} 기준 2km 안에서는 아직 계약 매장도, 외부 후보도 찾지 못했어요. 다른 위치로 찾아보세요.`;
    }

    if (diagnostics.dbCount === 0 && diagnostics.kakaoCount === 0) {
      return `${locationLabel} 근처에서는 외부 검색까지 시도했지만 맞는 후보가 없었어요. 설정에서 위치를 다시 검색해보세요.`;
    }

    return `${locationLabel} 기준으로 지금 맞는 가게를 찾지 못했어요. 위치를 다시 확인해보세요.`;
  };

  const handleChooseMenu = () => {
    if (!recommendation) return;
    chooseMeal(recommendation.meal);
    addMealLog({ mealId: recommendation.meal.id, eatenAt: new Date(), time: currentState.time });
    setPostChoiceFlow(null);
    setChoiceOpen(true);
  };

  const handleCloseChoice = () => {
    setChoiceOpen(false);
  };

  const handleSwap = () => {
    if (!recommendation || recommendationSession.swapUsed) return;
    registerRecommendation(recommendation.meal.id);
    markSwapUsed();
    setSwapJustDone(true);
    setTimeout(() => setSwapJustDone(false), 2200);
  };

  const handleCookAtHome = () => {
    completeRecommendationForCurrentTime();
    setPostChoiceFlow('cook');
    setChoiceOpen(false);
    setShoppingOpen(true);
  };

  const handleEatOut = async () => {
    if (!selectedMenu) {
      Alert.alert('메뉴를 먼저 정해주세요', '메뉴를 고른 뒤 근처 매장을 찾아드릴게요.');
      return;
    }

    setLoadingRestaurants(true);
    completeRecommendationForCurrentTime();
    setPostChoiceFlow('eat_out');

    try {
      const resolvedLocation = await resolveSearchLocation(locationContext);
      setLocationContext({
        permissionStatus: resolvedLocation.permissionStatus,
        source: resolvedLocation.source,
        coords: resolvedLocation.coords,
        label: resolvedLocation.label,
        updatedAt: resolvedLocation.updatedAt,
      });

      const result = await fetchNearbyRestaurants(
        selectedMenu,
        resolvedLocation.coords,
        2,
        resolvedLocation.source
      );

      setRestaurantRecommendations(result.items);
      setRestaurantSearchDiagnostics({
        ...result.diagnostics,
        failureReason: resolvedLocation.failureReason ?? result.diagnostics.failureReason,
      });

      if (result.items.length === 0) {
        Alert.alert(
          '근처 매장을 찾지 못했어요',
          buildEatOutFailureMessage(
            resolvedLocation.label,
            resolvedLocation.source,
            {
              ...result.diagnostics,
              failureReason: resolvedLocation.failureReason ?? result.diagnostics.failureReason,
            }
          ),
          [
            { text: '닫기', style: 'cancel' },
            { text: '위치 확인하기', onPress: openLocationSettings },
          ]
        );
        return;
      }

      setChoiceOpen(false);
      setRestaurantOpen(true);
    } catch (error) {
      console.error('Failed to fetch nearby restaurants:', error);
      clearRestaurantRecommendations();
      setRestaurantSearchDiagnostics(null);
      Alert.alert('가게를 불러오지 못했어요', '잠시 후 다시 시도해주세요.');
    } finally {
      setLoadingRestaurants(false);
    }
  };

  const handleOpenDirections = async (lat: number, lng: number, name: string) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&destination_place=${encodeURIComponent(name)}`;

    try {
      await Linking.openURL(url);
    } catch (error) {
      console.error('Failed to open directions:', error);
      Alert.alert('길찾기를 열지 못했어요', '잠시 후 다시 시도해주세요.');
    }
  };

  const handleCallRestaurant = async (phone?: string | null) => {
    if (!phone) {
      Alert.alert('전화번호가 없어요', '이 매장은 전화번호 정보가 아직 없어요.');
      return;
    }

    try {
      await Linking.openURL(`tel:${phone}`);
    } catch (error) {
      console.error('Failed to open dialer:', error);
      Alert.alert('전화를 열지 못했어요', '잠시 후 다시 시도해주세요.');
    }
  };

  return (
    <AppShell activeRoute="Home" title="오늘은 뭘 먹을까요?">
      <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.timeBubbleWrap}>
          <View style={styles.timeBubble}>
            <Text style={styles.timeBubbleText}>{timeBubble}</Text>
          </View>
          <View style={styles.timeBubbleTail} />
        </View>

        <View style={styles.heroCard}>
          <MealIllustration kind={getMealIllustrationKey(currentMealId)} size={88} />
          <View style={styles.heroCopy}>
            <Text style={styles.heroEyebrow}>지금 추천</Text>
            {recommendation ? (
              <>
                <Text style={styles.mealName}>{recommendation.meal.name}</Text>
                <Text style={styles.mealReason}>{recommendation.reason}</Text>
              </>
            ) : isCurrentTimeCompleted && selectedMenu ? (
              <>
                <Text style={styles.mealName}>{selectedMenu.name}</Text>
                <Text style={styles.mealReason}>이 시간대 메뉴 선택은 마쳤어요. 다음 시간대에 다시 추천해드릴게요.</Text>
              </>
            ) : (
              <Text style={styles.mealEmpty}>
                설정에서 지금 컨디션을 고르면 한끼비서가 바로 메뉴를 골라드릴게요.
              </Text>
            )}
          </View>
        </View>

        {insight && (
          <View style={styles.insightCard}>
            <Text style={styles.insightTitle}>{insight.title}</Text>
            <Text style={styles.insightBody}>{insight.body}</Text>
          </View>
        )}

        {swapJustDone && (
          <View style={styles.feedbackPill}>
            <Text style={styles.feedbackPillText}>새 후보를 준비했어요. 이번 선택이 마지막 후보예요.</Text>
          </View>
        )}

        <View style={styles.actionStack}>
          <TouchableOpacity
            style={[styles.primaryButton, !recommendation && styles.disabled]}
            onPress={handleChooseMenu}
            disabled={!recommendation}
          >
            <Text style={styles.primaryButtonText}>
              {isCurrentTimeCompleted ? '이 시간대 선택 완료' : '이 메뉴로 할래요'}
            </Text>
          </TouchableOpacity>

          {recommendationSession.condition && !recommendationSession.swapUsed && (
            <TouchableOpacity
              style={[styles.secondaryButton, !recommendation && styles.disabled]}
              onPress={handleSwap}
              disabled={!recommendation}
            >
              <Text style={styles.secondaryButtonText}>다른 추천 보기</Text>
            </TouchableOpacity>
          )}

          {recommendationSession.condition && recommendationSession.swapUsed && (
            <Text style={styles.helperText}>후보는 한 번만 바꿀 수 있게 조심스럽게 잡아뒀어요.</Text>
          )}
        </View>
      </ScrollView>

      <Modal visible={choiceOpen} animationType="slide" transparent>
        <View style={styles.sheetOverlay}>
          <View style={styles.sheet}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>이제 어떻게 준비할까요?</Text>
            <Text style={styles.sheetDescription}>
              {selectedMenu ? `${withParticle(selectedMenu.name, 'object')} 골랐어요. 집에서 준비할지, 근처에서 바로 먹을지 선택해보세요.` : '집에서 준비할지, 근처에서 바로 먹을지 선택해보세요.'}
            </Text>

            <View style={styles.choiceGrid}>
              <TouchableOpacity style={styles.choiceCard} onPress={handleCookAtHome}>
                <MealIllustration kind={getMealIllustrationKey(selectedMenu?.mealId)} size={66} />
                <Text style={styles.choiceTitle}>집에서 준비할래요</Text>
                <Text style={styles.choiceBody}>장보실 때 참고할 수 있게 필요한 재료를 정리해드릴게요.</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.choiceCard} onPress={handleEatOut} disabled={loadingRestaurants}>
                <MealIllustration kind={getMealIllustrationKey(selectedMenu?.mealId)} size={66} />
                <Text style={styles.choiceTitle}>밖에서 먹을래요</Text>
                <Text style={styles.choiceBody}>지금 위치 기준으로 2km 안의 가까운 가게를 먼저 찾아드릴게요.</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.sheetClose} onPress={handleCloseChoice}>
              <Text style={styles.sheetCloseText}>닫기</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={shoppingOpen} animationType="slide" transparent>
        <View style={styles.sheetOverlay}>
          <View style={styles.sheet}>
            <View style={styles.sheetHandle} />
            <View style={styles.sheetHero}>
              <MealIllustration kind={getMealIllustrationKey(selectedMenu?.mealId)} size={74} />
              <View style={styles.sheetHeroCopy}>
                <Text style={styles.sheetTitle}>{recommendationSession.shoppingList?.title ?? selectedMenu?.name}</Text>
                <Text style={styles.sheetDescription}>
                  {recommendationSession.shoppingList?.description}
                </Text>
              </View>
            </View>

            <ScrollView style={styles.sheetScroll} showsVerticalScrollIndicator={false}>
              <View style={styles.sectionBlock}>
                <Text style={styles.sectionHeader}>필요한 재료</Text>
                {recommendationSession.shoppingList?.ingredients.map((item) => (
                  <View key={item.name} style={styles.ingredientRow}>
                    <View style={styles.checkBubble}>
                      <Text style={styles.checkMark}>✓</Text>
                    </View>
                    <View style={styles.ingredientCopy}>
                      <Text style={styles.ingredientName}>
                        {item.name}
                      </Text>
                      {!!item.note && <Text style={styles.ingredientNote}>{item.note}</Text>}
                      {!!item.gogodangAlternative && (
                        <Text style={styles.ingredientAlt}>대체 재료: {item.gogodangAlternative}</Text>
                      )}
                    </View>
                  </View>
                ))}
              </View>

              {recommendationSession.shoppingList?.gogodangNotes.length ? (
                <View style={styles.sectionBlock}>
                  <Text style={styles.sectionHeader}>대체 가능 재료</Text>
                  {recommendationSession.shoppingList.gogodangNotes.map((note) => (
                    <Text key={note} style={styles.guidanceText}>• {note}</Text>
                  ))}
                </View>
              ) : null}

              <View style={styles.tipCard}>
                <Text style={styles.tipTitle}>한 줄 팁</Text>
                <Text style={styles.tipBody}>{recommendationSession.shoppingList?.tip}</Text>
              </View>
            </ScrollView>

            <TouchableOpacity style={styles.sheetClose} onPress={() => setShoppingOpen(false)}>
              <Text style={styles.sheetCloseText}>다 봤어요</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={restaurantOpen} animationType="slide" transparent>
        <View style={styles.sheetOverlay}>
          <View style={styles.sheet}>
            <View style={styles.sheetHandle} />
            <View style={styles.sheetHero}>
              <MealIllustration kind={getMealIllustrationKey(selectedMenu?.mealId)} size={74} />
              <View style={styles.sheetHeroCopy}>
                <Text style={styles.sheetTitle}>근처에서 바로 가기</Text>
                <Text style={styles.sheetDescription}>
                  {selectedMenu ? `${withParticle(selectedMenu.name, 'with')} 맞는 가게를 지금 위치 기준으로 모아봤어요.` : '지금 위치 기준으로 가까운 가게를 모아봤어요.'}
                </Text>
              </View>
            </View>

            {hasExternalRestaurants && (
              <View style={styles.noticeCard}>
                <Text style={styles.noticeText}>
                  업체의 정확한 정보는 직접 확인해주세요. 메뉴·가격·영업 여부는 변동될 수 있어요.
                </Text>
              </View>
            )}

            <ScrollView style={styles.sheetScroll} showsVerticalScrollIndicator={false}>
              {recommendationSession.restaurantRecommendations.map((item) => (
                <View key={item.restaurant.id} style={styles.restaurantCard}>
                  <View style={styles.restaurantTopRow}>
                    <View style={styles.restaurantTextWrap}>
                      <Text style={styles.restaurantName}>{item.restaurant.name}</Text>
                      <Text style={styles.restaurantMeta}>
                        {getStandardMealName(item.matchedMenu.mealId, selectedMenu?.name)}
                        {item.matchedMenu.price ? ` · ${item.matchedMenu.price.toLocaleString()}원` : ' · 가격 정보 없음'}
                      </Text>
                      {item.matchedMenu.mealName !== getStandardMealName(item.matchedMenu.mealId) && (
                        <Text style={styles.restaurantSubMeta}>매장 표기: {item.matchedMenu.mealName}</Text>
                      )}
                      <Text style={styles.restaurantWhy}>{item.why}</Text>
                    </View>
                    <View style={styles.distanceBubble}>
                      <Text style={styles.distanceText}>{item.distanceKm.toFixed(1)}km</Text>
                    </View>
                  </View>
                  <Text style={styles.restaurantAddress}>{item.restaurant.address}</Text>
                  <View style={styles.restaurantActionRow}>
                    <TouchableOpacity
                      style={styles.restaurantActionButton}
                      onPress={() =>
                        handleOpenDirections(item.restaurant.lat, item.restaurant.lng, item.restaurant.name)
                      }
                    >
                      <Text style={styles.restaurantActionText}>길찾기</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.restaurantActionButton}
                      onPress={() => handleCallRestaurant(item.restaurant.phone)}
                    >
                      <Text style={styles.restaurantActionText}>전화하기</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.restaurantActionButton,
                        user.savedRestaurantIds.includes(item.restaurant.id) && styles.restaurantActionButtonSaved,
                      ]}
                      onPress={() => toggleSavedRestaurant(item.restaurant.id)}
                    >
                      <Text
                        style={[
                          styles.restaurantActionText,
                          user.savedRestaurantIds.includes(item.restaurant.id) && styles.restaurantActionTextSaved,
                        ]}
                      >
                        {user.savedRestaurantIds.includes(item.restaurant.id) ? '저장됨' : '저장하기'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </ScrollView>

            <TouchableOpacity style={styles.sheetClose} onPress={() => setRestaurantOpen(false)}>
              <Text style={styles.sheetCloseText}>닫기</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </AppShell>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  content: {
    paddingBottom: 20,
    gap: 14,
  },
  timeBubbleWrap: {
    alignSelf: 'flex-start',
    marginLeft: 8,
    marginBottom: 2,
  },
  timeBubble: {
    backgroundColor: theme.colors.white,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: theme.colors.line,
    ...theme.shadow.card,
  },
  timeBubbleTail: {
    width: 14,
    height: 14,
    backgroundColor: theme.colors.white,
    borderLeftWidth: 1,
    borderBottomWidth: 1,
    borderColor: theme.colors.line,
    transform: [{ rotate: '-32deg' }],
    marginLeft: 18,
    marginTop: -7,
  },
  timeBubbleText: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.deep,
  },
  heroCard: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.radius.lg,
    padding: 20,
    borderWidth: 1,
    borderColor: theme.colors.line,
    flexDirection: 'row',
    gap: 16,
    ...theme.shadow.card,
  },
  heroCopy: {
    flex: 1,
  },
  heroEyebrow: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.primary,
    marginBottom: 8,
  },
  mealName: {
    fontSize: 28,
    fontWeight: '800',
    color: theme.colors.text,
  },
  mealReason: {
    marginTop: 10,
    fontSize: 15,
    lineHeight: 22,
    color: theme.colors.text,
  },
  mealEmpty: {
    fontSize: 15,
    lineHeight: 22,
    color: theme.colors.muted,
  },
  insightCard: {
    backgroundColor: theme.colors.surfaceMuted,
    borderRadius: theme.radius.md,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.colors.line,
  },
  insightTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: theme.colors.text,
    marginBottom: 6,
  },
  insightBody: {
    fontSize: 13,
    lineHeight: 19,
    color: theme.colors.text,
  },
  feedbackPill: {
    backgroundColor: theme.colors.primarySoft,
    borderRadius: theme.radius.pill,
    paddingHorizontal: 14,
    paddingVertical: 10,
    alignSelf: 'flex-start',
  },
  feedbackPillText: {
    fontSize: 12,
    color: theme.colors.text,
    fontWeight: '700',
  },
  actionStack: {
    gap: 10,
  },
  primaryButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.pill,
    paddingVertical: 16,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: theme.colors.deep,
    fontSize: 16,
    fontWeight: '800',
  },
  secondaryButton: {
    backgroundColor: theme.colors.white,
    borderWidth: 1,
    borderColor: theme.colors.line,
    borderRadius: theme.radius.pill,
    paddingVertical: 16,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: theme.colors.text,
    fontSize: 15,
    fontWeight: '700',
  },
  disabled: {
    opacity: 0.45,
  },
  helperText: {
    fontSize: 13,
    lineHeight: 19,
    color: theme.colors.muted,
    paddingHorizontal: 4,
  },
  sheetOverlay: {
    flex: 1,
    backgroundColor: 'rgba(65, 48, 34, 0.2)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 24,
    maxHeight: '88%',
  },
  sheetHandle: {
    alignSelf: 'center',
    width: 46,
    height: 5,
    borderRadius: 999,
    backgroundColor: theme.colors.line,
    marginBottom: 18,
  },
  sheetTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: theme.colors.text,
  },
  sheetDescription: {
    marginTop: 10,
    fontSize: 14,
    lineHeight: 21,
    color: theme.colors.muted,
  },
  sheetHero: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 14,
  },
  sheetHeroCopy: {
    flex: 1,
  },
  choiceGrid: {
    marginTop: 22,
    gap: 12,
  },
  choiceCard: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.radius.md,
    padding: 18,
    borderWidth: 1,
    borderColor: theme.colors.line,
    gap: 12,
  },
  choiceTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: theme.colors.text,
  },
  choiceBody: {
    fontSize: 13,
    lineHeight: 20,
    color: theme.colors.muted,
  },
  sheetClose: {
    marginTop: 18,
    alignItems: 'center',
    paddingVertical: 12,
  },
  sheetCloseText: {
    color: theme.colors.muted,
    fontSize: 14,
    fontWeight: '700',
  },
  sheetScroll: {
    marginTop: 18,
  },
  sectionBlock: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.radius.md,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.colors.line,
    marginBottom: 12,
  },
  sectionHeader: {
    fontSize: 15,
    fontWeight: '800',
    color: theme.colors.text,
    marginBottom: 12,
  },
  ingredientRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    gap: 12,
  },
  checkBubble: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: theme.colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkMark: {
    color: theme.colors.deep,
    fontWeight: '800',
  },
  ingredientCopy: {
    flex: 1,
  },
  ingredientName: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.text,
  },
  ingredientNote: {
    marginTop: 4,
    fontSize: 13,
    lineHeight: 18,
    color: theme.colors.muted,
  },
  ingredientAlt: {
    marginTop: 4,
    fontSize: 12,
    lineHeight: 18,
    color: theme.colors.primary,
    fontWeight: '700',
  },
  guidanceText: {
    fontSize: 13,
    lineHeight: 20,
    color: theme.colors.text,
    marginBottom: 6,
  },
  tipCard: {
    backgroundColor: theme.colors.primarySoft,
    borderRadius: theme.radius.md,
    padding: 16,
  },
  tipTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: theme.colors.text,
    marginBottom: 8,
  },
  tipBody: {
    fontSize: 13,
    lineHeight: 20,
    color: theme.colors.text,
  },
  noticeCard: {
    marginTop: 16,
    backgroundColor: theme.colors.primarySoft,
    borderRadius: theme.radius.md,
    padding: 14,
    borderWidth: 1,
    borderColor: theme.colors.line,
  },
  noticeText: {
    fontSize: 13,
    lineHeight: 19,
    color: theme.colors.text,
  },
  restaurantCard: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.radius.md,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.colors.line,
    marginBottom: 12,
  },
  restaurantTopRow: {
    flexDirection: 'row',
    gap: 10,
  },
  restaurantTextWrap: {
    flex: 1,
  },
  restaurantName: {
    fontSize: 16,
    fontWeight: '800',
    color: theme.colors.text,
  },
  restaurantMeta: {
    marginTop: 4,
    fontSize: 13,
    color: theme.colors.muted,
  },
  restaurantSubMeta: {
    marginTop: 4,
    fontSize: 12,
    color: theme.colors.muted,
  },
  restaurantWhy: {
    marginTop: 8,
    fontSize: 12,
    lineHeight: 18,
    color: theme.colors.primary,
    fontWeight: '700',
  },
  distanceBubble: {
    backgroundColor: theme.colors.surfaceMuted,
    borderRadius: theme.radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 6,
    alignSelf: 'flex-start',
  },
  distanceText: {
    fontSize: 12,
    fontWeight: '800',
    color: theme.colors.text,
  },
  restaurantAddress: {
    marginTop: 10,
    fontSize: 12,
    lineHeight: 18,
    color: theme.colors.muted,
  },
  restaurantActionRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 14,
  },
  restaurantActionButton: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.pill,
    paddingVertical: 11,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.line,
  },
  restaurantActionButtonSaved: {
    backgroundColor: theme.colors.primarySoft,
    borderColor: theme.colors.primary,
  },
  restaurantActionText: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.text,
  },
  restaurantActionTextSaved: {
    color: theme.colors.primary,
  },
});
