import numpy as np
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from typing import List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from core.db import get_db
from core.deps import get_current_user
from models.user import User
from models.face_embedding import FaceEmbedding
from services.user.service import register_face
from utils.image import decode_bytes_image
from ml.face_encoder_async import encode_face_async


router = APIRouter()

def cosine_similarity(a: np.ndarray, b: np.ndarray) -> float:
    return float(np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b)))

@router.post("/face/register")
async def register_face_api(
    files: List[UploadFile] = File(...),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):

    if user.has_face:
        raise HTTPException(status_code=400,detail='이미 얼굴이 등록된 사용자입니다.')
    print(f"[FACE_REGISTER] files count = {len(files)}")
    if len(files) < 3:
       
        raise HTTPException(
            status_code=400, detail='얼굴 이미지는 최소 3장이 필요합니다.'
        )
    
    embeddings: list[list[float]] = []

    for file in files:
        
        contents = await file.read()
        image = decode_bytes_image(contents)

        if image is None:
            raise HTTPException(status_code=400, detail='이미지 디코딩 실패')
        h, w, _ = image.shape
        print(f"[FACE_REGISTER] image shape {w}x{h}")
        emb = await encode_face_async(image)
        if emb is None:
            raise HTTPException(status_code=400, detail='얼굴 인식 실패')
        embeddings.append(emb)
    
    await register_face(
        db=db,
        user=user,
        embeddings=embeddings,
    )
    return {"success": True}

@router.post('/face/test')
async def test_face(
    file:UploadFile = File(...),
    db:AsyncSession = Depends(get_db),
    user:User = Depends(get_current_user)
):
    contents = await file.read()
    img = decode_bytes_image(contents)
    query_emb = await encode_face_async(img)
    query_emb = np.array(query_emb)

    result = await db.execute(select(FaceEmbedding.embedding).where(FaceEmbedding.user_id == user.id))

    stored_embeddings = [np.array(row[0]) for row in result.fetchall()]

    scores = [
        cosine_similarity(query_emb, emb)
        for emb in stored_embeddings
    ]
    max_score = max(scores)

    return {
        "scores": scores,
        "max_score": max_score,
        "matched": max_score >= 0.35,
    }
                        
