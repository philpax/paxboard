export interface Service {
  name: string;
  url: string;
}

export interface ResourceStatus {
  total_available: number;
  total_in_use: number;
}

export interface ServiceStatus {
  name: string;
  service_url: string;
  is_running: boolean;
  resource_requirements: Record<string, number>;
}

export interface ProxyStatus {
  resources: Record<string, ResourceStatus>;
  services: ServiceStatus[];
}

export interface WeatherData {
  latitude: number;
  longitude: number;
  current: {
    time: string;
    temperature_2m: number;
    relative_humidity_2m: number;
    apparent_temperature: number;
    precipitation: number;
    weather_code: number;
    wind_speed_10m: number;
    wind_direction_10m: number;
  };
  current_units: {
    temperature_2m: string;
    relative_humidity_2m: string;
    apparent_temperature: string;
    precipitation: string;
    weather_code: string;
    wind_speed_10m: string;
    wind_direction_10m: string;
  };
}

export interface WeatherLocation {
  name: string;
  latitude: number;
  longitude: number;
}

export interface CachedWeatherData {
  data: WeatherData;
  timestamp: number;
}
