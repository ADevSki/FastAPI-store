from pathlib import Path
from fastapi import UploadFile, HTTPException, status
import uuid


async def save_product_image(directory, file: UploadFile) -> str:
    """
    Сохраняет изображение товара и возвращает относительный URL.
    """
    base_dir = Path(__file__).resolve().parent.parent.parent
    media_root = base_dir / "media" / directory
    media_root.mkdir(parents=True, exist_ok=True)
    allowed_image_types = {"image/jpeg", "image/png", "image/webp"}
    max_image_size = 2 * 1024 * 1024  # 2 097 152 байт ~ 2мб

    if file.content_type not in allowed_image_types:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Only JPG, PNG or WebP images are allowed")

    content = await file.read()
    if len(content) > max_image_size:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Image is too large")

    extension = Path(file.filename or "").suffix.lower() or ".jpg"
    file_name = f"{uuid.uuid4()}{extension}"
    file_path = media_root / file_name
    file_path.write_bytes(content)
    return f"/media/{directory}/{file_name}"

def remove_product_image(url: str | None) -> None:
    """
    Удаляет файл изображения, если он существует.
    """
    BASE_DIR = Path(__file__).resolve().parent.parent.parent
    if not url:
        return
    relative_path = url.lstrip("/")
    file_path = BASE_DIR / relative_path
    if file_path.exists():
        file_path.unlink()