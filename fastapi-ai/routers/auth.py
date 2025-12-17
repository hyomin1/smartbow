from fastapi import APIRouter, HTTPException, status


from services.auth.service import authenticate_user, authenticate_kakao_user
from services.auth.schema import LoginRequest, KakaoLoginRequest, LoginResponse


router = APIRouter()


@router.post(
    '/login',    
    response_model=LoginResponse,
    status_code=status.HTTP_200_OK
)
async def login(req: LoginRequest):
    token = await authenticate_user(req.userId, req.password)
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials",
        )

    return {"access_token": token}

@router.post(
    '/kakao/login',
    response_model=LoginResponse,
    status_code=status.HTTP_200_OK)
async def kakao_login(req: KakaoLoginRequest):
    token = await authenticate_kakao_user(req.kakao_access_token)

    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials",
        )
    return {"access_token": token}