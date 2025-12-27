import asyncio
from ml.face_encoder import face_encoder

async def encode_face_async(image):
    loop = asyncio.get_running_loop()
    return await loop.run_in_executor(
        None,                 
        face_encoder.encode,  
        image,                
    )
