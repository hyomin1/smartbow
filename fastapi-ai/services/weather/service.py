import logging
import time
from datetime import datetime, timedelta
from typing import Any, Dict
from urllib.parse import quote
from zoneinfo import ZoneInfo

import requests
from config import WEATHER_API_KEY

logger = logging.getLogger("smartbow.weather")

WEATHER_CACHE: Dict[str, Any] = {
    "data": None,
    "ts": None,
}


nx, ny = 58, 74


def fetch_weather():
    SERVICE_KEY = quote(WEATHER_API_KEY)
    nx, ny = 58, 74
    now = datetime.now(ZoneInfo("Asia/Seoul"))

    if now.minute < 10:
        base_time_dt = now - timedelta(hours=1)
    else:
        base_time_dt = now

    base_date = base_time_dt.strftime("%Y%m%d")
    base_hour = base_time_dt.strftime("%H")
    base_time = base_hour + "00"

    url = (
        "https://apis.data.go.kr/1360000/"
        "VilageFcstInfoService_2.0/getUltraSrtNcst"
        f"?serviceKey={SERVICE_KEY}"
    )
    params = {
        "pageNo": "1",
        "numOfRows": "1000",
        "dataType": "JSON",
        "base_date": base_date,
        "base_time": base_time,
        "nx": nx,
        "ny": ny,
    }
    try:
        res = requests.get(url, params=params, timeout=5)
        res.raise_for_status()
        data = res.json()

        header = data["response"]["header"]
        if header["resultCode"] != "00":
            logger.error(f"기상청 API 오류: {header['resultMsg']}")
            return None

        items = data["response"]["body"]["items"]["item"]

        temp = 0.0
        wind_deg = 0.0
        wind_speed = 0.0

        for item in items:
            category = item["category"]
            val = float(item["obsrValue"])
            if category == "T1H":
                temp = val
            elif category == "VEC":
                wind_deg = val
            elif category == "WSD":
                wind_speed = val

        directions = ["북", "북동", "동", "남동", "남", "남서", "서", "북서"]
        idx = round(wind_deg / 45) % 8
        wind_dir = directions[idx]

        return {
            "temp": temp,
            "wind_deg": wind_deg,
            "wind_dir": wind_dir,
            "wind_speed": wind_speed,
            "base_hour": base_hour,
        }

    except Exception as e:
        logger.error(f"날씨 데이터 수신 중 예외 발생: {e}")
        return None


def weather_loop():
    logger.info("날씨 백그라운드 워커 시작")

    while True:
        try:
            result = fetch_weather()
            if result:
                WEATHER_CACHE["data"] = result
                WEATHER_CACHE["ts"] = time.time()
                logger.info(
                    f"갱신 성공: {result['temp']}°C, {result['wind_dir']}풍 풍속: {result['wind_speed']}"
                )

        except Exception as e:
            logger.error(f"날씨 갱신 실패: {e}")

        time.sleep(600)
