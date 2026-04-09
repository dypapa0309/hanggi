import { hasSupabaseConfig, supabase } from './supabase';
import {
  Coordinates,
  LocationSource,
  Restaurant,
  RestaurantMenu,
  RestaurantRecommendation,
  RestaurantSearchDiagnostics,
  RestaurantSearchFailureReason,
  RestaurantSearchResult,
  SelectedMenu,
} from '../types';
import rawRestaurants from '../data/restaurants.json';
import { getMealSearchTerms, getStandardMealName, sanitizeMealLabel } from '../config/mealMeta';

// DB에서 가져온 store row 타입
interface StoreRow {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  merchant_status: string;
  is_subscribed: boolean;
  merchant_accounts?: Array<{
    phone: string | null;
  }> | null;
  store_menus: {
    id: string;
    meal_id: string;
    meal_name: string;
    price: number;
    available: boolean;
  }[];
}

interface KakaoKeywordDocument {
  id: string;
  place_name: string;
  category_name: string;
  category_group_code: string;
  phone: string;
  address_name: string;
  road_address_name: string;
  place_url: string;
  distance?: string;
  x: string;
  y: string;
}

const seedRestaurants = rawRestaurants as Restaurant[];
const KAKAO_REST_API_KEY = process.env.EXPO_PUBLIC_KAKAO_REST_API_KEY ?? '';

function logRestaurantStage(
  stage: 'db' | 'kakao' | 'seed',
  selectedMenu: SelectedMenu,
  count: number,
  extra?: Record<string, string | number | boolean | null>
) {
  console.log('[restaurant-search]', {
    stage,
    mealId: selectedMenu.mealId,
    count,
    ...extra,
  });
}

function toRad(value: number) {
  return (value * Math.PI) / 180;
}

function calcDistanceKm(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function scoreRestaurant(
  restaurant: Restaurant,
  matchedMenu: RestaurantMenu,
  distanceKm: number,
  source: 'db' | 'external'
): RestaurantRecommendation {
  let score = 0;
  if (restaurant.isSubscribed) score += 100;
  score += Math.max(0, 30 - distanceKm * 10);
  score += restaurant.rating * 5;

  return {
    restaurant,
    matchedMenu,
    score,
    distanceKm,
    source,
    why: source === 'external'
      ? '현재 위치를 기준으로 비슷한 후보를 먼저 찾아봤어요.'
      : restaurant.isSubscribed
        ? '가까운 제휴 매장이라서 먼저 보여드려요.'
        : '선택한 메뉴와 정확히 맞는 가까운 매장이에요.',
  };
}

function formatRestaurantMenu(mealId: string, mealName?: string | null, price?: number | null): RestaurantMenu {
  return {
    mealId,
    mealName: sanitizeMealLabel(mealId, mealName),
    price: price ?? null,
    available: true,
  };
}

function getNearbyRestaurantsFromSeed(
  selectedMenu: SelectedMenu,
  coords: Coordinates,
  radiusKm: number
): RestaurantRecommendation[] {
  const results = seedRestaurants
    .filter((restaurant) => restaurant.merchantStatus === 'active')
    .map((restaurant) => {
      const matchedMenu = restaurant.menus.find(
        (menu) => menu.mealId === selectedMenu.mealId && menu.available
      );
      if (!matchedMenu) return null;

      const distanceKm = calcDistanceKm(
        coords.latitude,
        coords.longitude,
        restaurant.lat,
        restaurant.lng
      );

      if (distanceKm > radiusKm) return null;

      return scoreRestaurant(
        {
          ...restaurant,
          menus: restaurant.menus.map((menu) => formatRestaurantMenu(menu.mealId, menu.mealName, menu.price)),
        },
        formatRestaurantMenu(matchedMenu.mealId, matchedMenu.mealName, matchedMenu.price),
        distanceKm,
        'external'
      );
    })
    .filter((item): item is RestaurantRecommendation => item !== null)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  logRestaurantStage('seed', selectedMenu, results.length, { radiusKm });
  return results;
}

async function searchKakaoPlaces(
  selectedMenu: SelectedMenu,
  coords: Coordinates,
  radiusKm: number
): Promise<RestaurantRecommendation[]> {
  if (!KAKAO_REST_API_KEY) {
    logRestaurantStage('kakao', selectedMenu, 0, { radiusKm, reason: 'missing_api_key' });
    return [];
  }

  try {
    const searchTerms = getMealSearchTerms(selectedMenu.mealId);
    const radius = Math.min(20000, Math.max(0, Math.round(radiusKm * 1000)));
    const documentsByTerm = await Promise.all(
      searchTerms.map(async (term) => {
        const params = new URLSearchParams({
          query: term,
          x: String(coords.longitude),
          y: String(coords.latitude),
          radius: String(radius),
          sort: 'distance',
          size: '8',
          category_group_code: 'FD6',
        });

        const response = await fetch(`https://dapi.kakao.com/v2/local/search/keyword.json?${params.toString()}`, {
          headers: {
            Authorization: `KakaoAK ${KAKAO_REST_API_KEY}`,
          },
        });

        if (!response.ok) {
          throw new Error(`Kakao local search failed: ${response.status}`);
        }

        const payload = await response.json() as { documents?: KakaoKeywordDocument[] };
        return payload.documents ?? [];
      })
    );

    const deduped = new Map<string, RestaurantRecommendation>();

    for (const documents of documentsByTerm) {
      for (const place of documents) {
        const lat = Number(place.y);
        const lng = Number(place.x);
        const distanceKm = calcDistanceKm(coords.latitude, coords.longitude, lat, lng);

        if (!Number.isFinite(lat) || !Number.isFinite(lng) || distanceKm > radiusKm) {
          continue;
        }

        const restaurant: Restaurant = {
          id: `external:kakao:${place.id}`,
          name: place.place_name,
          merchantStatus: 'active',
          onboardingStatus: 'store_live',
          lat,
          lng,
          address: place.road_address_name || place.address_name,
          menus: [formatRestaurantMenu(selectedMenu.mealId, getStandardMealName(selectedMenu.mealId), null)],
          isSubscribed: false,
          rating: 0,
          reviewCount: 0,
          phone: place.phone || null,
          placeUrl: place.place_url || null,
        };

        const recommendation = scoreRestaurant(
          restaurant,
          formatRestaurantMenu(selectedMenu.mealId, getStandardMealName(selectedMenu.mealId), null),
          distanceKm,
          'external'
        );

        const current = deduped.get(restaurant.id);
        if (!current || current.distanceKm > recommendation.distanceKm) {
          deduped.set(restaurant.id, recommendation);
        }
      }
    }

    const recommendations = Array.from(deduped.values())
      .sort((a, b) => a.distanceKm - b.distanceKm)
      .slice(0, 5);
    logRestaurantStage('kakao', selectedMenu, recommendations.length, { radiusKm, terms: searchTerms.join(', ') });
    return recommendations;
  } catch (error) {
    console.error('Kakao external restaurant search failed:', error);
    logRestaurantStage('kakao', selectedMenu, 0, { radiusKm, reason: 'request_failed' });
    return [];
  }
}

export async function fetchNearbyRestaurants(
  selectedMenu: SelectedMenu,
  coords: Coordinates,
  radiusKm = 2,
  locationSource: LocationSource = 'fallback'
): Promise<RestaurantSearchResult> {
  const diagnostics: RestaurantSearchDiagnostics = {
    locationSource,
    usedCoords: coords,
    dbCount: 0,
    kakaoCount: 0,
    seedCount: 0,
    failureReason: null,
  };

  if (!hasSupabaseConfig || !supabase) {
    logRestaurantStage('db', selectedMenu, 0, { radiusKm, reason: 'missing_supabase_config' });
    const externalResults = await searchKakaoPlaces(selectedMenu, coords, radiusKm);
    diagnostics.dbCount = 0;
    diagnostics.kakaoCount = externalResults.length;

    if (externalResults.length > 0) {
      return { items: externalResults, diagnostics };
    }

    const seedResults = getNearbyRestaurantsFromSeed(selectedMenu, coords, radiusKm);
    diagnostics.seedCount = seedResults.length;
    diagnostics.failureReason = KAKAO_REST_API_KEY ? 'missing_supabase_config' : 'missing_kakao_key';
    if (seedResults.length > 0) {
      return { items: seedResults, diagnostics };
    }

    diagnostics.failureReason = seedResults.length === 0
      ? (KAKAO_REST_API_KEY ? 'seed_empty' : 'missing_kakao_key')
      : diagnostics.failureReason;
    return { items: [], diagnostics };
  }

  // active 매장 중 해당 meal_id 메뉴 보유한 곳
  const { data, error } = await supabase
    .from('stores')
    .select(`
      id, name, address, latitude, longitude,
      merchant_status, is_subscribed,
      merchant_accounts (
        phone
      ),
      store_menus!inner (
        id, meal_id, meal_name, price, available
      )
    `)
    .eq('merchant_status', 'active')
    .eq('store_menus.meal_id', selectedMenu.mealId)
    .eq('store_menus.available', true);

  if (error) {
    console.error('Supabase fetchNearbyRestaurants error:', error.message);
    logRestaurantStage('db', selectedMenu, 0, { radiusKm, reason: error.message });
    const externalResults = await searchKakaoPlaces(selectedMenu, coords, radiusKm);
    diagnostics.kakaoCount = externalResults.length;
    diagnostics.failureReason = 'db_error';
    if (externalResults.length > 0) {
      return { items: externalResults, diagnostics };
    }
    const seedResults = getNearbyRestaurantsFromSeed(selectedMenu, coords, radiusKm);
    diagnostics.seedCount = seedResults.length;
    if (seedResults.length > 0) {
      return { items: seedResults, diagnostics };
    }
    diagnostics.failureReason = 'seed_empty';
    return { items: [], diagnostics };
  }

  const rows = (data ?? []) as StoreRow[];

  const candidates: RestaurantRecommendation[] = [];

  for (const row of rows) {
    const menus = row.store_menus ?? [];
    const matched = menus.find(
      (m) => m.meal_id === selectedMenu.mealId && m.available
    );
    if (!matched) continue;

    const distanceKm = calcDistanceKm(
      coords.latitude,
      coords.longitude,
      row.latitude,
      row.longitude
    );

    if (distanceKm > radiusKm) continue;

    const restaurant: Restaurant = {
      id: row.id,
      name: row.name,
      merchantStatus: row.merchant_status as Restaurant['merchantStatus'],
      onboardingStatus: 'store_live',
      lat: row.latitude,
      lng: row.longitude,
      address: row.address,
      menus: menus.map((m): RestaurantMenu => ({
        mealId: m.meal_id,
        mealName: sanitizeMealLabel(m.meal_id, m.meal_name),
        price: m.price ?? null,
        available: m.available,
      })),
      isSubscribed: row.is_subscribed,
      rating: 0,
      reviewCount: 0,
      phone: row.merchant_accounts?.[0]?.phone ?? null,
    };

    candidates.push(
      scoreRestaurant(
        restaurant,
        {
          mealId: matched.meal_id,
          mealName: sanitizeMealLabel(matched.meal_id, matched.meal_name),
          price: matched.price ?? null,
          available: matched.available,
        },
        distanceKm,
        'db'
      )
    );
  }

  const ranked = candidates
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  logRestaurantStage('db', selectedMenu, ranked.length, { radiusKm });
  diagnostics.dbCount = ranked.length;

  if (ranked.length > 0) {
    return { items: ranked, diagnostics };
  }

  const externalResults = await searchKakaoPlaces(selectedMenu, coords, radiusKm);
  diagnostics.kakaoCount = externalResults.length;
  if (externalResults.length > 0) {
    diagnostics.failureReason = 'db_empty';
    return { items: externalResults, diagnostics };
  }

  const seedResults = getNearbyRestaurantsFromSeed(selectedMenu, coords, radiusKm);
  diagnostics.seedCount = seedResults.length;
  if (seedResults.length > 0) {
    diagnostics.failureReason = KAKAO_REST_API_KEY ? 'kakao_empty' : 'missing_kakao_key';
    return { items: seedResults, diagnostics };
  }

  diagnostics.failureReason = KAKAO_REST_API_KEY ? 'seed_empty' : 'missing_kakao_key';
  return { items: [], diagnostics };
}
