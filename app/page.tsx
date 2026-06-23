'use client';

import React, { useState, useEffect } from 'react';

interface WeatherData {
  current: {
    temperature_2m: number;
    relative_humidity_2m: number;
    apparent_temperature: number;
    weather_code: number;
    wind_speed_10m: number;
  };
  daily: {
    time: string[];
    weather_code: number[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
  };
}

const weatherCodeToDescription = (code: number): string => {
  const codes: { [key: number]: string } = {
    0: 'Clear sky',
    1: 'Mainly clear',
    2: 'Partly cloudy',
    3: 'Overcast',
    45: 'Fog',
    48: 'Depositing rime fog',
    51: 'Light drizzle',
    53: 'Moderate drizzle',
    55: 'Dense drizzle',
    61: 'Slight rain',
    63: 'Moderate rain',
    65: 'Heavy rain',
    71: 'Slight snow fall',
    73: 'Moderate snow fall',
    75: 'Heavy snow fall',
    80: 'Slight rain showers',
    81: 'Moderate rain showers',
    82: 'Violent rain showers',
    95: 'Thunderstorm',
  };
  return codes[code] || 'Unknown';
};

const getWeatherIcon = (code: number): string => {
  if (code === 0) return '☀️';
  if ([1, 2, 3].includes(code)) return '⛅';
  if ([45, 48].includes(code)) return '🌫️';
  if ([51, 53, 55, 61, 63, 65, 80, 81, 82].includes(code)) return '🌧️';
  if ([71, 73, 75].includes(code)) return '❄️';
  if (code === 95) return '⛈️';
  return '🌥️';
};

const getBackgroundClass = (code: number): string => {
  if (code === 0) return 'clear';
  if ([1, 2, 3].includes(code)) return 'cloudy';
  if ([45, 48].includes(code)) return 'cloudy';
  if ([51, 53, 55, 61, 63, 65, 80, 81, 82, 95].includes(code)) return 'rain';
  if ([71, 73, 75].includes(code)) return 'snow';
  return '';
};

export default function WeatherApp() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [location, setLocation] = useState<{ city: string; lat: number; lon: number } | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Get user's location and weather
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          
          try {
            const geoRes = await fetch(
              `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
            );
            const geoData = await geoRes.json();
            const city = geoData.city || geoData.locality || 'Unknown Location';

            setLocation({ city, lat: latitude, lon: longitude });

            const weatherRes = await fetch(
              `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto`
            );
            
            if (!weatherRes.ok) throw new Error('Weather data fetch failed');
            
            const weatherData: WeatherData = await weatherRes.json();
            setWeather(weatherData);
          } catch (err) {
            setError('Failed to fetch weather data. Please try again.');
          } finally {
            setLoading(false);
          }
        },
        (err) => {
          setError('Location access denied. Please allow location access for real-time weather.');
          setLoading(false);
        }
      );
    } else {
      setError('Geolocation not supported by your browser.');
      setLoading(false);
    }
  }, []);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit',
      hour12: true 
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-950 via-indigo-950 to-purple-950 flex items-center justify-center text-white px-6">
        <div className="text-center">
          <div className="animate-spin h-16 w-16 border-4 border-white border-t-transparent rounded-full mx-auto mb-6"></div>
          <p className="text-xl sm:text-2xl">Loading real-time weather...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-950 via-indigo-950 to-purple-950 flex items-center justify-center text-white p-6">
        <div className="text-center max-w-md">
          <div className="text-7xl mb-6">🌤️</div>
          <h1 className="text-4xl font-bold mb-4">WeatherCast</h1>
          <p className="text-lg sm:text-xl mb-8 text-white/90">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-10 py-3.5 bg-white text-black rounded-2xl font-semibold hover:bg-gray-100 active:bg-gray-200 transition-all shadow-lg"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!weather || !location) return null;

  const current = weather.current;
  const daily = weather.daily;

  return (
    <div className={`min-h-screen weather-bg text-white overflow-hidden relative ${getBackgroundClass(current.weather_code)}`}>
      {/* Premium Header */}
      <header className="sticky top-0 z-50 p-5 sm:p-6 flex justify-between items-center border-b border-white/10 bg-black/80 backdrop-blur-2xl shadow-xl">
        <div className="flex items-center gap-3">
          <div className="text-4xl">🌤️</div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">WeatherCast</h1>
            <p className="text-xs sm:text-sm text-white/70">Real-time forecasts</p>
          </div>
        </div>
        <div className="text-right max-w-[140px] sm:max-w-none">
          <div className="text-xs sm:text-sm text-white/70">Current Location</div>
          <div className="font-medium text-sm sm:text-base truncate">{location.city}</div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {/* Current Time & Date */}
        <div className="mb-10 sm:mb-12 text-center">
          <div className="text-5xl sm:text-6xl md:text-7xl font-mono tracking-[3px] sm:tracking-[4px] mb-3 tabular-nums drop-shadow-md">
            {formatTime(currentTime)}
          </div>
          <div className="text-xl sm:text-2xl text-white/80 font-light">
            {formatDate(currentTime)}
          </div>
        </div>

        {/* Current Weather - Hero Card - Enhanced GUI */}
        <div className="glass-card rounded-3xl p-8 sm:p-10 md:p-12 mb-10 sm:mb-12 relative overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 sm:gap-10 items-center">
            <div className="text-center md:text-left">
              <div className="text-7xl sm:text-8xl mb-4 transition-all">{getWeatherIcon(current.weather_code)}</div>
              <div className="current-temp font-light tracking-[-4px] mb-3 drop-shadow-sm">
                {Math.round(current.temperature_2m)}°C
              </div>
              <div className="text-2xl sm:text-3xl text-white/80 capitalize">{weatherCodeToDescription(current.weather_code)}</div>
              <div className="text-base sm:text-lg mt-4 text-white/70">
                Feels like <span className="font-medium">{Math.round(current.apparent_temperature)}°C</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 sm:gap-6 text-lg">
              <div className="bg-white/10 hover:bg-white/15 rounded-3xl p-5 sm:p-6 transition-all border border-white/10">
                <div className="text-white/60 text-xs sm:text-sm mb-2 tracking-widest">HUMIDITY</div>
                <div className="text-4xl sm:text-5xl font-medium tabular-nums">{current.relative_humidity_2m}<span className="text-2xl">%</span></div>
              </div>
              <div className="bg-white/10 hover:bg-white/15 rounded-3xl p-5 sm:p-6 transition-all border border-white/10">
                <div className="text-white/60 text-xs sm:text-sm mb-2 tracking-widest">WIND</div>
                <div className="text-4xl sm:text-5xl font-medium tabular-nums">{Math.round(current.wind_speed_10m)}<span className="text-xl"> km/h</span></div>
              </div>
            </div>
          </div>
        </div>

        {/* 7-Day Forecast */}
        <div>
          <h2 className="text-2xl font-semibold mb-6 flex items-center gap-3">
            7-Day Forecast
            <span className="text-sm font-normal text-white/60">Open-Meteo</span>
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-4 sm:gap-5">
            {daily.time.slice(0, 7).map((dateStr, index) => {
              const date = new Date(dateStr);
              const isToday = index === 0;
              return (
                <div 
                  key={index} 
                  className="glass-card rounded-3xl p-6 sm:p-7 border border-white/10 hover:border-white/30 hover:-translate-y-1 transition-all duration-300 group active:scale-[0.985] flex flex-col"
                >
                  <div className="text-center">
                    <div className="text-sm text-white/60 mb-1">
                      {isToday ? 'Today' : date.toLocaleDateString('en-US', { weekday: 'short' })}
                    </div>
                    <div className="text-xl mb-4 font-medium">
                      {date.getDate()}
                    </div>
                    
                    <div className="text-5xl sm:text-6xl mb-6 transition-transform group-hover:scale-110 duration-300">
                      {getWeatherIcon(daily.weather_code[index])}
                    </div>
                    
                    <div className="flex justify-between text-lg">
                      <span className="font-medium">{Math.round(daily.temperature_2m_max[index])}°</span>
                      <span className="text-white/60">{Math.round(daily.temperature_2m_min[index])}°</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="text-center py-8 text-white/40 text-sm border-t border-white/10 mt-12">
        Data from Open-Meteo • Location via browser • Built with Next.js
      </footer>
    </div>
  );
}
