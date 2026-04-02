import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import Purchases, { PurchasesPackage } from 'react-native-purchases';
import { useAppStore } from '../store';

interface Props {
  onPurchased: () => void;
}

export default function PaywallScreen({ onPurchased }: Props) {
  const { setPurchased, trialDaysLeft, isTrialActive } = useAppStore();
  const [pkg, setPkg] = useState<PurchasesPackage | null>(null);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);

  const daysLeft = trialDaysLeft();
  const trialActive = isTrialActive();

  useEffect(() => {
    const fetchOffering = async () => {
      try {
        const offerings = await Purchases.getOfferings();
        const current = offerings.current;
        if (current && current.availablePackages.length > 0) {
          setPkg(current.availablePackages[0]);
        }
      } catch (e) {
        console.error('Failed to fetch offerings:', e);
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
      const { customerInfo } = await Purchases.purchasePackage(pkg);
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
      const customerInfo = await Purchases.restorePurchases();
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
    <View style={styles.container}>
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

        {loading ? (
          <ActivityIndicator size="large" color="#FF6B35" style={{ marginTop: 30 }} />
        ) : (
          <TouchableOpacity
            style={[styles.purchaseButton, purchasing && styles.disabled]}
            onPress={handlePurchase}
            disabled={purchasing}
          >
            {purchasing ? (
              <ActivityIndicator color="#fff" />
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFAF7',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  content: {
    width: '100%',
    alignItems: 'center',
  },
  emoji: {
    fontSize: 64,
    marginBottom: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 15,
    color: '#666',
    marginBottom: 20,
  },
  trialBadge: {
    backgroundColor: '#FF6B35',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 28,
  },
  trialExpired: {
    backgroundColor: '#999',
  },
  trialBadgeText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  features: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 28,
    gap: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  feature: {
    fontSize: 15,
    color: '#333',
  },
  purchaseButton: {
    backgroundColor: '#FF6B35',
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
    color: '#fff',
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
    color: '#999',
    fontSize: 14,
  },
});
