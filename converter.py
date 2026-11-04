from pathlib import Path
from markitdown import MarkItDown

ALLOWED_EXTENSIONS = {
    ".pdf", ".docx", ".pptx", ".xlsx",
    ".txt", ".csv", ".html", ".htm",
    ".png", ".jpg", ".jpeg", ".gif", ".bmp", ".webp", ".tif", ".tiff",
    ".mp3", ".wav", ".epub", ".xml", ".json",
}


def convert_file(path: str) -> str:
    source = Path(path)

    if source.suffix.lower() not in ALLOWED_EXTENSIONS:
        raise ValueError(f"Unsupported file type: {source.suffix or 'unknown'}")

    converter = MarkItDown()
    result = converter.convert(str(source))
    return result.markdown or ""
