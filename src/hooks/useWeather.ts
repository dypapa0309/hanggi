import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import axios from 'axios';
import { WeatherData } from '../types';

const WEATHER_API_KEY = 'fb87bf58af310087fbe7d1a87956b36b'; // Replace with actual key
const CACHE_KEY = 'weather_cache';
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

export function useWeather() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadCachedWeather();
    fetchWeather();
  }, []);

  const loadCachedWeather = async () => {
    try {
      const cached = await AsyncStorage.getItem(CACHE_KEY);
      if (!cached) return;

      const dataRaw = JSON.parse(cached);
      if (!dataRaw || typeof dataRaw !== 'object') return;

      const parsedTime = dataRaw.lastUpdated ? new Date(dataRaw.lastUpdated) : null;
      if (!parsedTime || Number.isNaN(parsedTime.getTime())) {
        await AsyncStorage.removeItem(CACHE_KEY);
        return;
      }

      const data: WeatherData = {
        temp: Number(dataRaw.temp) || 20,
        condition: ['rain', 'cold', 'hot', 'normal'].includes(dataRaw.condition) ? dataRaw.condition : 'normal',
        lastUpdated: parsedTime
      };

      if (Date.now() - data.lastUpdated.getTime() < CACHE_DURATION) {
        setWeather(data);
      }
    } catch (err) {
      console.error('Failed to load cached weather:', err);
      await AsyncStorage.removeItem(CACHE_KEY);
    }
  };

  const fetchWeather = async () => {
    setLoading(true);
    setError(null);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setError('위치 권한이 거부되었습니다');
        setWeather({ temp: 20, condition: 'normal', lastUpdated: new Date() });
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;

      const response = await axios.get(
        `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${WEATHER_API_KEY}&units=metric`
      );

      const temp = response.data.main.temp;
      const condition = response.data.weather[0].main.toLowerCase();

      let weatherCondition: 'rain' | 'cold' | 'hot' | 'normal';
      if (condition.includes('rain')) weatherCondition = 'rain';
      else if (temp < 10) weatherCondition = 'cold';
      else if (temp > 25) weatherCondition = 'hot';
      else weatherCondition = 'normal';

      const weatherData: WeatherData = {
        temp,
        condition: weatherCondition,
        lastUpdated: new Date()
      };

      setWeather(weatherData);
      await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(weatherData));
    } catch (err) {
      console.error('날씨 정보를 가져올 수 없습니다:', err);
      setError('날씨 정보를 가져올 수 없습니다');
      // Fallback to normal
      setWeather({ temp: 20, condition: 'normal', lastUpdated: new Date() });
    } finally {
      setLoading(false);
    }
  };

  return { weather, loading, error, refetch: fetchWeather };
}