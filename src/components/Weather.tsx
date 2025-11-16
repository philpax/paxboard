import { useEffect, useState } from "react";
import type { WeatherData, WeatherLocation, CachedWeatherData } from "../types";

const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes in milliseconds

const LOCATIONS: WeatherLocation[] = [
  { name: "Stockholm", latitude: 59.3293, longitude: 18.0686 },
  { name: "Melbourne", latitude: -37.8136, longitude: 144.9631 },
];

// WMO Weather interpretation codes
const getWeatherDescription = (code: number): string => {
  const descriptions: Record<number, string> = {
    0: "Clear sky",
    1: "Mainly clear",
    2: "Partly cloudy",
    3: "Overcast",
    45: "Foggy",
    48: "Depositing rime fog",
    51: "Light drizzle",
    53: "Moderate drizzle",
    55: "Dense drizzle",
    56: "Light freezing drizzle",
    57: "Dense freezing drizzle",
    61: "Slight rain",
    63: "Moderate rain",
    65: "Heavy rain",
    66: "Light freezing rain",
    67: "Heavy freezing rain",
    71: "Slight snow fall",
    73: "Moderate snow fall",
    75: "Heavy snow fall",
    77: "Snow grains",
    80: "Slight rain showers",
    81: "Moderate rain showers",
    82: "Violent rain showers",
    85: "Slight snow showers",
    86: "Heavy snow showers",
    95: "Thunderstorm",
    96: "Thunderstorm with slight hail",
    99: "Thunderstorm with heavy hail",
  };
  return descriptions[code] || "Unknown";
};

const getWeatherIcon = (code: number): string => {
  if (code === 0) return "☀️";
  if (code <= 3) return "⛅";
  if (code <= 48) return "🌫️";
  if (code <= 57) return "🌦️";
  if (code <= 67) return "🌧️";
  if (code <= 77) return "🌨️";
  if (code <= 82) return "🌧️";
  if (code <= 86) return "🌨️";
  return "⛈️";
};

const getWindDirection = (degrees: number): string => {
  const directions = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  const index = Math.round(degrees / 45) % 8;
  return directions[index];
};

const getCacheKey = (location: WeatherLocation): string => {
  return `weather_${location.name.toLowerCase()}`;
};

const getCachedData = (location: WeatherLocation): WeatherData | null => {
  const cached = localStorage.getItem(getCacheKey(location));
  if (!cached) return null;

  try {
    const parsed: CachedWeatherData = JSON.parse(cached);
    const age = Date.now() - parsed.timestamp;

    if (age < CACHE_DURATION) {
      return parsed.data;
    }
    // Cache expired, remove it
    localStorage.removeItem(getCacheKey(location));
  } catch (error) {
    console.error("Error parsing cached weather data:", error);
    localStorage.removeItem(getCacheKey(location));
  }

  return null;
};

const setCachedData = (location: WeatherLocation, data: WeatherData): void => {
  const cached: CachedWeatherData = {
    data,
    timestamp: Date.now(),
  };
  localStorage.setItem(getCacheKey(location), JSON.stringify(cached));
};

const fetchWeatherData = async (
  location: WeatherLocation,
): Promise<WeatherData> => {
  const params = new URLSearchParams({
    latitude: location.latitude.toString(),
    longitude: location.longitude.toString(),
    current: [
      "temperature_2m",
      "relative_humidity_2m",
      "apparent_temperature",
      "precipitation",
      "weather_code",
      "wind_speed_10m",
      "wind_direction_10m",
    ].join(","),
  });

  const response = await fetch(
    `https://api.open-meteo.com/v1/forecast?${params}`,
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch weather data for ${location.name}`);
  }

  const data: WeatherData = await response.json();
  setCachedData(location, data);
  return data;
};

interface WeatherCardProps {
  location: WeatherLocation;
}

function WeatherCard({ location }: WeatherCardProps) {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadWeather = async () => {
      setLoading(true);
      setError(null);

      // Check cache first
      const cachedData = getCachedData(location);
      if (cachedData) {
        setWeather(cachedData);
        setLoading(false);
        return;
      }

      // Fetch fresh data
      try {
        const data = await fetchWeatherData(location);
        setWeather(data);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load weather data",
        );
        console.error("Error fetching weather:", err);
      } finally {
        setLoading(false);
      }
    };

    loadWeather();
  }, [location]);

  if (loading) {
    return (
      <div className="bg-[var(--color-bg-secondary)] rounded-lg p-4 text-center">
        <div className="animate-pulse">
          <div className="text-xl font-bold mb-2">{location.name}</div>
          <div className="text-4xl mb-2">⏳</div>
          <div className="text-sm opacity-75">Loading weather...</div>
        </div>
      </div>
    );
  }

  if (error || !weather) {
    return (
      <div className="bg-[var(--color-stopped)] rounded-lg p-4 text-center">
        <div className="text-xl font-bold mb-2">{location.name}</div>
        <div className="text-4xl mb-2">❌</div>
        <div className="text-sm opacity-75">{error || "No data available"}</div>
      </div>
    );
  }

  const { current, current_units } = weather;
  const icon = getWeatherIcon(current.weather_code);
  const description = getWeatherDescription(current.weather_code);
  const windDir = getWindDirection(current.wind_direction_10m);

  return (
    <div className="bg-[var(--color-bg-secondary)] rounded-lg p-4 hover:brightness-110 transition-all duration-200">
      <div className="text-xl font-bold mb-3">{location.name}</div>

      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="text-5xl font-bold tabular-nums">
            {Math.round(current.temperature_2m)}
            {current_units.temperature_2m}
          </div>
          <div className="text-sm opacity-75 mt-1">
            Feels like {Math.round(current.apparent_temperature)}
            {current_units.temperature_2m}
          </div>
        </div>
        <div className="text-6xl">{icon}</div>
      </div>

      <div className="text-lg mb-3">{description}</div>

      <div className="grid grid-cols-2 gap-2 text-sm">
        <div className="bg-black bg-opacity-20 rounded p-2">
          <div className="opacity-75">Humidity</div>
          <div className="font-bold tabular-nums">
            {current.relative_humidity_2m}%
          </div>
        </div>
        <div className="bg-black bg-opacity-20 rounded p-2">
          <div className="opacity-75">Wind</div>
          <div className="font-bold tabular-nums">
            {windDir} {Math.round(current.wind_speed_10m)}{" "}
            {current_units.wind_speed_10m}
          </div>
        </div>
        {current.precipitation > 0 && (
          <div className="bg-black bg-opacity-20 rounded p-2 col-span-2">
            <div className="opacity-75">Precipitation</div>
            <div className="font-bold tabular-nums">
              {current.precipitation} {current_units.precipitation}
            </div>
          </div>
        )}
      </div>

      <div className="text-xs opacity-50 mt-3 text-center">
        Updated: {new Date(current.time).toLocaleTimeString()}
      </div>
    </div>
  );
}

export default function Weather() {
  return (
    <div className="mb-8">
      <h2 className="text-2xl font-bold mb-4 text-center">Weather</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {LOCATIONS.map((location) => (
          <WeatherCard key={location.name} location={location} />
        ))}
      </div>
    </div>
  );
}
