import hashlib
from datetime import datetime, timedelta, timezone

from passlib.context import CryptContext
from jose import jwt


pwd_context = CryptContext(
    schemes=["argon2"],
    deprecated="auto",
)

def verify_password(password:str, hashed:str) -> bool:
    digest = hashlib.sha256(password.encode("utf-8")).hexdigest()
    return pwd_context.verify(digest, hashed)


SECRET_KEY="CHANGE_ME_TO_EMV"
ALGORITHM="HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60

def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(
    minutes=ACCESS_TOKEN_EXPIRE_MINUTES
)
    to_encode.update({"exp": expire})

    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
