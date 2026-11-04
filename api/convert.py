import json
import os
import tempfile
import urllib.request
from http.server import BaseHTTPRequestHandler
from pathlib import Path
from urllib.parse import urlparse

from converter import convert_file, ALLOWED_EXTENSIONS

MAX_SOURCE_BYTES = 100 * 1024 * 1024
MAX_MARKDOWN_BYTES = 4 * 1024 * 1024


class handler(BaseHTTPRequestHandler):
    def _send(self, status, payload):
        raw = json.dumps(payload).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(raw)))
        self.end_headers()
        self.wfile.write(raw)

    def do_POST(self):
        temp_path = None
        try:
            length = int(self.headers.get("Content-Length", "0"))
            if length <= 0 or length > 1024 * 1024:
                return self._send(413, {"error": "Invalid request size."})

            body = json.loads(self.rfile.read(length) or b"{}")
            blob_url = body.get("blobUrl")
            filename = Path(body.get("filename", "upload.bin")).name
            suffix = Path(filename).suffix.lower()

            if suffix not in ALLOWED_EXTENSIONS:
                return self._send(400, {"error": f"Unsupported file type: {suffix or 'unknown'}"})
            if not isinstance(blob_url, str):
                return self._send(400, {"error": "Missing uploaded file URL."})

            parsed = urlparse(blob_url)
            host = parsed.hostname or ""
            if parsed.scheme != "https" or not (
                host.endswith(".public.blob.vercel-storage.com")
                or host.endswith(".blob.vercel-storage.com")
            ):
                return self._send(400, {"error": "Only Vercel Blob source URLs are accepted."})

            request = urllib.request.Request(
                blob_url,
                headers={"User-Agent": "MarkItDown-Studio/1.0"}
            )
            with urllib.request.urlopen(request, timeout=60) as response:
                source_data = response.read(MAX_SOURCE_BYTES + 1)

            if len(source_data) > MAX_SOURCE_BYTES:
                return self._send(413, {"error": "File exceeds the 100 MB conversion limit."})

            with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as temp_file:
                temp_file.write(source_data)
                temp_path = temp_file.name

            markdown = convert_file(temp_path)
            if len(markdown.encode("utf-8")) > MAX_MARKDOWN_BYTES:
                return self._send(
                    413,
                    {"error": "Converted Markdown exceeds 4 MB. Try a smaller document."}
                )

            return self._send(200, {"markdown": markdown, "filename": filename})

        except ValueError as exc:
            return self._send(400, {"error": str(exc)})
        except Exception as exc:
            return self._send(500, {"error": f"Conversion failed: {str(exc)[:400]}"})
        finally:
            if temp_path:
                try:
                    os.unlink(temp_path)
                except OSError:
                    pass
