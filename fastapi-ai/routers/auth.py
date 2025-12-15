from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel



from services.auth.service import authenticate_user

router = APIRouter()

class LoginRequest(BaseModel):
    userId: str
    password: str

class LoginResponse(BaseModel):
    access_token: str
    token_type:str = 'bearer'

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