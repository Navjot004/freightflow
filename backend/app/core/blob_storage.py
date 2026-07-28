import os
import requests
from typing import Optional
from app.core.config import settings

def get_blob_token() -> Optional[str]:
    return (
        os.getenv("BLOB_READ_WRITE_TOKEN") or
        os.getenv("VERCEL_BLOB_READ_WRITE_TOKEN") or
        getattr(settings, "BLOB_READ_WRITE_TOKEN", None)
    )

def upload_blob(filename: str, content: bytes, content_type: str = "application/octet-stream") -> str:
    """
    Uploads file binary content to Vercel Blob if BLOB_READ_WRITE_TOKEN is set.
    Otherwise saves to local disk and returns the local API path.
    """
    token = get_blob_token()

    if token:
        try:
            # Clean filename for URL
            safe_filename = filename.replace(" ", "_")
            url = f"https://blob.vercel-storage.com/{safe_filename}"
            headers = {
                "authorization": f"Bearer {token}",
                "x-api-version": "7",
                "content-type": content_type
            }
            response = requests.put(url, data=content, headers=headers, timeout=30)
            if response.status_code in [200, 201]:
                res_data = response.json()
                blob_url = res_data.get("url")
                if blob_url:
                    print(f"[Vercel Blob] Uploaded {filename} -> {blob_url}")
                    return blob_url
            print(f"[Vercel Blob] Upload failed ({response.status_code}): {response.text}")
        except Exception as e:
            print(f"[Vercel Blob] Error uploading {filename}: {e}")

    # Fallback to local disk storage
    try:
        upload_dir = settings.UPLOAD_DIR
        os.makedirs(upload_dir, exist_ok=True)
        file_path = os.path.join(upload_dir, filename)
        with open(file_path, "wb") as f:
            f.write(content)
    except Exception as e:
        print(f"[Local Storage] Warning: Could not write to disk: {e}")

    return f"/api/v1/uploads/{filename}"
