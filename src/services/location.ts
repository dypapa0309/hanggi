import * as Location from 'expo-location';
import {
  Coordinates,
  LocationContext,
  LocationPermissionState,
  LocationSource,
} from '../types';

const KAKAO_REST_API_KEY = process.env.EXPO_PUBLIC_KAKAO_REST_API_KEY ?? '';

export const DEFAULT_FALLBACK_LOCATION = {
  coords: {
    latitude: 37.4981,
    longitude: 127.0276,
  },
  label: '강남역 근처 기본 위치',
} as const;

export interface LocationCandidate {
  id: string;
  label: string;
  address: string;
  coords: Coordinates;
}

export interface ResolvedLocationResult {
  permissionStatus: LocationPermissionState;
  source: LocationSource;
  coords: Coordinates;
  label: string;
  updatedAt: string;
  failureReason: 'location_permission_denied' | 'location_lookup_failed' | null;
}

function formatCoordsLabel(coords: Coordinates) {
  return `${coords.latitude.toFixed(4)}, ${coords.longitude.toFixed(4)}`;
}

async function reverseGeocodeLabel(coords: Coordinates) {
  try {
    const [result] = await Location.reverseGeocodeAsync(coords);
    if (!result) return formatCoordsLabel(coords);

    const pieces = [result.region, result.city, result.district, result.street]
      .filter(Boolean)
      .slice(0, 3);

    return pieces.length > 0 ? pieces.join(' ') : formatCoordsLabel(coords);
  } catch (error) {
    console.error('Failed to reverse geocode location:', error);
    return formatCoordsLabel(coords);
  }
}

export async function resolveSearchLocation(
  manualLocation?: LocationContext | null
): Promise<ResolvedLocationResult> {
  if (manualLocation?.source === 'manual' && manualLocation.coords) {
    return {
      permissionStatus: manualLocation.permissionStatus,
      source: 'manual',
      coords: manualLocation.coords,
      label: manualLocation.label,
      updatedAt: new Date().toISOString(),
      failureReason: null,
    };
  }

  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      return {
        permissionStatus: 'denied',
        source: 'fallback',
        coords: DEFAULT_FALLBACK_LOCATION.coords,
        label: DEFAULT_FALLBACK_LOCATION.label,
        updatedAt: new Date().toISOString(),
        failureReason: 'location_permission_denied',
      };
    }

    const currentPosition = await Location.getCurrentPositionAsync({});
    const coords = {
      latitude: currentPosition.coords.latitude,
      longitude: currentPosition.coords.longitude,
    };

    return {
      permissionStatus: 'granted',
      source: 'current',
      coords,
      label: await reverseGeocodeLabel(coords),
      updatedAt: new Date().toISOString(),
      failureReason: null,
    };
  } catch (error) {
    console.error('Failed to resolve current location:', error);
    return {
      permissionStatus: 'undetermined',
      source: 'fallback',
      coords: DEFAULT_FALLBACK_LOCATION.coords,
      label: DEFAULT_FALLBACK_LOCATION.label,
      updatedAt: new Date().toISOString(),
      failureReason: 'location_lookup_failed',
    };
  }
}

export async function searchLocationCandidates(query: string): Promise<LocationCandidate[]> {
  const normalized = query.trim();
  if (!normalized || !KAKAO_REST_API_KEY) return [];

  try {
    const params = new URLSearchParams({
      query: normalized,
      size: '8',
    });

    const response = await fetch(`https://dapi.kakao.com/v2/local/search/keyword.json?${params.toString()}`, {
      headers: {
        Authorization: `KakaoAK ${KAKAO_REST_API_KEY}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Kakao location search failed: ${response.status}`);
    }

    const payload = await response.json() as {
      documents?: Array<{
        id: string;
        place_name: string;
        address_name: string;
        road_address_name: string;
        x: string;
        y: string;
      }>;
    };

    return (payload.documents ?? [])
      .map((item) => ({
        id: item.id,
        label: item.place_name,
        address: item.road_address_name || item.address_name,
        coords: {
          latitude: Number(item.y),
          longitude: Number(item.x),
        },
      }))
      .filter((item) => Number.isFinite(item.coords.latitude) && Number.isFinite(item.coords.longitude));
  } catch (error) {
    console.error('Failed to search location candidates:', error);
    return [];
  }
}
