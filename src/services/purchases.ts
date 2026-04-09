import { Platform } from 'react-native';
import Purchases, {
  CustomerInfo,
  PurchasesOfferings,
  PurchasesPackage,
} from 'react-native-purchases';

const REVENUECAT_IOS_KEY = 'appl_bEiPHdJFOgUWGLIqzzrUhEDszQR';
const REVENUECAT_ANDROID_KEY = 'test_JoeVrBTPEEhVHOYHnMNzCavUrhz';

let configured = false;
let unavailableReason: string | null = null;

function getApiKey() {
  return Platform.OS === 'ios' ? REVENUECAT_IOS_KEY : REVENUECAT_ANDROID_KEY;
}

export async function configurePurchasesSafely() {
  if (configured || unavailableReason) return configured;

  const apiKey = getApiKey();
  if (!apiKey) {
    unavailableReason = 'missing_api_key';
    return false;
  }

  try {
    Purchases.configure({ apiKey });
    configured = true;
    return true;
  } catch (error) {
    unavailableReason = error instanceof Error ? error.message : 'configure_failed';
    console.error('RevenueCat configure failed:', error);
    return false;
  }
}

export function isPurchasesAvailable() {
  return configured;
}

export function getPurchasesUnavailableReason() {
  return unavailableReason;
}

export async function getCustomerInfoSafely(): Promise<CustomerInfo | null> {
  const ready = await configurePurchasesSafely();
  if (!ready) return null;

  try {
    return await Purchases.getCustomerInfo();
  } catch (error) {
    console.error('RevenueCat getCustomerInfo failed:', error);
    return null;
  }
}

export async function getOfferingsSafely(): Promise<PurchasesOfferings | null> {
  const ready = await configurePurchasesSafely();
  if (!ready) return null;

  try {
    return await Purchases.getOfferings();
  } catch (error) {
    console.error('RevenueCat getOfferings failed:', error);
    return null;
  }
}

export async function purchasePackageSafely(pkg: PurchasesPackage) {
  const ready = await configurePurchasesSafely();
  if (!ready) return null;

  try {
    return await Purchases.purchasePackage(pkg);
  } catch (error) {
    throw error;
  }
}

export async function restorePurchasesSafely() {
  const ready = await configurePurchasesSafely();
  if (!ready) return null;

  try {
    return await Purchases.restorePurchases();
  } catch (error) {
    throw error;
  }
}
