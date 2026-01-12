from fastapi import APIRouter
from services.weather.service import WEATHER_CACHE

router = APIRouter()


@router.get("/")
def get_weather():
    return {"data": WEATHER_CACHE["data"], "ts": WEATHER_CACHE["ts"]}
