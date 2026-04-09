import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { PurchasesPackage } from 'react-native-purchases';
import { useAppStore } from '../store';
import {
  configurePurchasesSafely,
  getOfferingsSafely,
  getPurchasesUnavailableReason,
  isPurchasesAvailable,
  purchasePackageSafely,
  restorePurchasesSafely,
} from '../services/purchases';
import { theme } from '../theme';

interface Props {
  onPurchased: () => void;
}

export default function PaywallScreen({ onPurchased }: Props) {
  const { setPurchased, trialDaysLeft, isTrialActive } = useAppStore();
  const [pkg, setPkg] = useState<PurchasesPackage | null>(null);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [storeUnavailable, setStoreUnavailable] = useState(false);

  const daysLeft = trialDaysLeft();
  const trialActive = isTrialActive();

  useEffect(() => {
    const fetchOffering = async () => {
      try {
        const ready = await configurePurchasesSafely();
        if (!ready) {
          setStoreUnavailable(true);
          return;
        }

        const offerings = await getOfferingsSafely();
        const current = offerings?.current;
        if (current && current.availablePackages.length > 0) {
          setPkg(current.availablePackages[0]);
        } else {
          setStoreUnavailable(true);
        }
      } catch (e) {
        console.error('Failed to fetch offerings:', e);
        setStoreUnavailable(true);
      } finally {
        setLoading(false);
      }
    };
    fetchOffering();
  }, []);

  const handlePurchase = async () => {
    if (!pkg) return;
    setPurchasing(true);
    try {
      const result = await purchasePackageSafely(pkg);
      if (!result) {
        Alert.alert('구매 준비 중', '결제 설정을 다시 확인한 뒤 새 빌드로 테스트해주세요.');
        return;
      }

      const { customerInfo } = result;
      const hasEntitlement = Object.keys(customerInfo.entitlements.active).length > 0;
      if (hasEntitlement) {
        setPurchased(true);
        onPurchased();
      }
    } catch (e: any) {
      if (!e.userCancelled) {
        Alert.alert('구매 실패', '다시 시도해주세요.');
      }
    } finally {
      setPurchasing(false);
    }
  };

  const handleRestore = async () => {
    setPurchasing(true);
    try {
      const customerInfo = await restorePurchasesSafely();
      if (!customerInfo) {
        Alert.alert('복원 준비 중', '결제 설정을 다시 확인한 뒤 새 빌드로 테스트해주세요.');
        return;
      }

      const hasEntitlement = Object.keys(customerInfo.entitlements.active).length > 0;
      if (hasEntitlement) {
        setPurchased(true);
        onPurchased();
      } else {
        Alert.alert('복원 실패', '이전 구매 내역을 찾을 수 없어요.');
      }
    } catch {
      Alert.alert('복원 실패', '다시 시도해주세요.');
    } finally {
      setPurchasing(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContent} style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.emoji}>🍱</Text>
        <Text style={styles.title}>한끼비서</Text>
        <Text style={styles.subtitle}>오늘 뭐 먹을지, 이제 고민 끝</Text>

        {trialActive && daysLeft > 0 && (
          <View style={styles.trialBadge}>
            <Text style={styles.trialBadgeText}>무료 체험 {daysLeft}일 남음</Text>
          </View>
        )}
        {!trialActive && (
          <View style={[styles.trialBadge, styles.trialExpired]}>
            <Text style={styles.trialBadgeText}>무료 체험 기간이 종료됐어요</Text>
          </View>
        )}

        <View style={styles.features}>
          {['매일 맞춤 식사 추천', '날씨·컨디션 반영', '먹은 기록 자동 관리', '싫어하는 메뉴 제외'].map((f) => (
            <Text key={f} style={styles.feature}>✓  {f}</Text>
          ))}
        </View>

        {storeUnavailable && (
          <View style={styles.warningBox}>
            <Text style={styles.warningTitle}>앱은 정상 실행되지만 결제 설정 확인이 필요해요</Text>
            <Text style={styles.warningText}>
              RevenueCat 또는 인앱결제 구성이 준비되지 않았습니다.
            </Text>
            {!isPurchasesAvailable() && (
              <Text style={styles.warningText}>
                사유: {getPurchasesUnavailableReason() || 'native_module_unavailable'}
              </Text>
            )}
          </View>
        )}

        {loading ? (
          <ActivityIndicator size="large" color={theme.colors.primary} style={{ marginTop: 30 }} />
        ) : (
          <TouchableOpacity
            style={[styles.purchaseButton, (purchasing || !pkg) && styles.disabled]}
            onPress={handlePurchase}
            disabled={purchasing || !pkg}
          >
            {purchasing ? (
              <ActivityIndicator color={theme.colors.white} />
            ) : (
              <>
                <Text style={styles.purchaseButtonText}>
                  {pkg ? `${pkg.product.priceString} 구매하기` : '구매하기'}
                </Text>
                <Text style={styles.purchaseButtonSub}>한 번 결제, 영구 사용</Text>
              </>
            )}
          </TouchableOpacity>
        )}

        <TouchableOpacity onPress={handleRestore} disabled={purchasing} style={styles.restoreButton}>
          <Text style={styles.restoreText}>이전 구매 복원</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.surface,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  content: {
    width: '100%',
    maxWidth: 520,
    alignSelf: 'center',
    alignItems: 'center',
  },
  emoji: {
    fontSize: 64,
    marginBottom: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 15,
    color: theme.colors.muted,
    marginBottom: 20,
  },
  trialBadge: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 28,
  },
  trialExpired: {
    backgroundColor: theme.colors.muted,
  },
  trialBadgeText: {
    color: theme.colors.white,
    fontSize: 13,
    fontWeight: '600',
  },
  features: {
    width: '100%',
    backgroundColor: theme.colors.white,
    borderRadius: 12,
    padding: 20,
    marginBottom: 28,
    shadowColor: theme.shadow.card.shadowColor,
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  feature: {
    fontSize: 15,
    color: theme.colors.text,
    marginBottom: 12,
  },
  warningBox: {
    width: '100%',
    backgroundColor: theme.colors.primarySoft,
    borderColor: theme.colors.line,
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    marginBottom: 18,
  },
  warningTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.deep,
  },
  warningText: {
    fontSize: 13,
    color: theme.colors.deep,
    lineHeight: 18,
    marginTop: 4,
  },
  purchaseButton: {
    backgroundColor: theme.colors.primary,
    width: '100%',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    marginBottom: 14,
  },
  disabled: {
    opacity: 0.6,
  },
  purchaseButtonText: {
    color: theme.colors.white,
    fontSize: 17,
    fontWeight: 'bold',
  },
  purchaseButtonSub: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    marginTop: 2,
  },
  restoreButton: {
    padding: 10,
  },
  restoreText: {
    color: theme.colors.muted,
    fontSize: 14,
  },
});
