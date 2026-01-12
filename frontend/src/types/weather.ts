export interface Weather {
  temp: number;
  wind_deg: number;
  wind_dir: string;
  wind_speed: number;
  base_hour: string;
}

export interface WeatherResponse {
  data: Weather | null;
  ts: number | null;
}
