import { useQuery } from "@tanstack/react-query";
import type { WeatherResponse } from "../types/weather";
import { fetchWeather } from "../api/weather";

export default function useWeather() {
  return useQuery<WeatherResponse>({
    queryKey: ["weather"],
    queryFn: fetchWeather,
    refetchInterval: 10 * 60 * 1000,
    staleTime: 10 * 60 * 1000,
    retry: 1,
  });
}
