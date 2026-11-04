import os
import tempfile
from pathlib import Path

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware

from converter import ALLOWED_EXTENSIONS, convert_file

app = FastAPI(title="MarkItDown Studio API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

MAX_SOURCE_BYTES = 100 * 1024 * 1024
MAX_MARKDOWN_BYTES = 4 * 1024 * 1024


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/convert")
async def convert(file: UploadFile = File(...)):
    filename = Path(file.filename or "upload.bin").name
    suffix = Path(filename).suffix.lower()

    if suffix not in ALLOWED_EXTENSIONS:
        raise HTTPException(400, f"Unsupported file type: {suffix or 'unknown'}")

    source_data = await file.read(MAX_SOURCE_BYTES + 1)
    if len(source_data) > MAX_SOURCE_BYTES:
        raise HTTPException(413, "File exceeds the 100 MB conversion limit.")

    temp_path = None
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as temp_file:
            temp_file.write(source_data)
            temp_path = temp_file.name

        markdown = convert_file(temp_path)
        if len(markdown.encode("utf-8")) > MAX_MARKDOWN_BYTES:
            raise HTTPException(
                413,
                "Converted Markdown exceeds 4 MB. Try a smaller document."
            )
        return {"markdown": markdown, "filename": filename}

    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(500, f"Conversion failed: {str(exc)[:400]}")
    finally:
        if temp_path and os.path.exists(temp_path):
            os.unlink(temp_path)
