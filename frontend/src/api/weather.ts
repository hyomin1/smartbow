import type { WeatherResponse } from "../types/weather";
import { api } from "./axios";

export async function fetchWeather(): Promise<WeatherResponse> {
  const { data } = await api.get("/weather");

  return data;
}
