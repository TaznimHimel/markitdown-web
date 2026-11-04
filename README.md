# MarkItDown Studio

A developer-focused web interface for Microsoft's [MarkItDown](https://github.com/microsoft/markitdown).

## Features

- Upload PDF, DOCX, PPTX, XLSX, TXT, CSV, HTML, images, EPUB, audio, XML and JSON.
- Preview converted Markdown.
- Copy Markdown or download a `.md` file.
- Local development uses a FastAPI backend.
- Vercel deployment uses Next.js + a Python Function + Vercel Blob direct uploads.

## Requirements

- Node.js 20+
- Python 3.10+ (Python 3.12 recommended)
- npm
- A Vercel account and Blob store for hosted large-file uploads

## 1. Local setup

### Backend (Python)

Linux / macOS:

```bash
python3.12 -m venv .venv
source .venv/bin/activate
python -m pip install --upgrade pip
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

Windows PowerShell:

```powershell
py -3.12 -m venv .venv
.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

Check `http://127.0.0.1:8000/health`. Keep this terminal running.

### Frontend

Open a second terminal in the project folder:

```bash
npm install
cp .env.example .env.local
```

Make sure `.env.local` contains:

```env
NEXT_PUBLIC_VERCEL_MODE=false
NEXT_PUBLIC_LOCAL_API=http://127.0.0.1:8000
```

Then run:

```bash
npm run dev
```

Open `http://localhost:3000`.

## 2. Vercel deployment

### Important storage setup

1. Push this project to a GitHub repository.
2. Import the repository into Vercel.
3. In the Vercel project, open **Storage → Create Database → Blob**.
4. Create a Blob store and connect it to the project.
5. Add `BLOB_READ_WRITE_TOKEN` to Production, Preview and Development environments.
6. Set `NEXT_PUBLIC_VERCEL_MODE=true`.
7. Deploy.

The frontend uses Vercel Blob's client upload flow, so source files do not pass through the 4.5 MB Function request-body limit. The Python function downloads the temporary source Blob, converts it, and the browser asks the delete route to remove the source.

### Deploy from CLI

```bash
npm install
npm install -g vercel
vercel login
vercel link
vercel env pull .env.local
vercel --prod
```

After setting `NEXT_PUBLIC_VERCEL_MODE=true` in Vercel Environment Variables, redeploy.

## 3. Supported formats and caveats

MarkItDown supports the requested formats through its core converters and optional dependencies. The exact result depends on the document content and installed extras.

- **Images:** Standard MarkItDown image conversion may provide metadata; OCR of image text is not guaranteed by the default configuration.
- **Audio:** Audio transcription requires the optional audio-transcription dependencies and may require a speech service / credentials depending on the MarkItDown version and configured converter.
- **EPUB:** Requires the EPUB extra.
- **Scanned PDFs:** OCR is not guaranteed by the basic PDF converter.
- **Encrypted or password-protected documents:** Not supported by this starter.

## 4. Limits in this starter

- Maximum source file: 100 MB.
- Maximum Markdown response: 4 MB, because Vercel Function responses have a 4.5 MB payload limit.
- Conversion runs synchronously. Very long audio or huge PDFs can exceed the function's maximum execution time.
- This starter is suitable for testing and modest workloads, not a public high-volume conversion service.

For larger Markdown output or long-running audio jobs, move conversion to a background worker and store the resulting `.md` file in object storage.

## 5. Security and privacy — read before public launch

This starter uses a **public Vercel Blob URL temporarily** so the Python Function can fetch the uploaded file. The URL is unguessable, and the UI requests deletion after conversion, but anyone who obtains that URL may access the file until it is deleted. Do not use this exact configuration for confidential documents.

Before accepting sensitive user files:
- Change to a private object-storage design with authenticated server-side reads.
- Add authentication, per-IP rate limits, upload quotas and abuse protection.
- Add strict MIME/content validation and malware scanning.
- Keep conversion dependencies patched.
- Consider a separate worker for audio/OCR jobs.

Also note: MarkItDown processes files and URLs with the permissions of the running process. Treat uploads as untrusted input.

## 6. Project layout

```text
markitdown-web/
├── app/
│   ├── api/                 # Next.js upload/delete routes
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── api/
│   └── convert.py           # Vercel Python Function
├── converter.py             # Shared MarkItDown conversion logic
├── main.py                  # Local FastAPI backend
├── requirements.txt
├── vercel.json
└── package.json
```

## References

- https://github.com/microsoft/markitdown
- https://vercel.com/docs/vercel-blob/client-upload
- https://vercel.com/docs/functions/runtimes/python
- https://vercel.com/docs/functions/limitations
