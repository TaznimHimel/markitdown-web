
"use client";

import { useCallback, useRef, useState } from "react";
import { uploadPresigned } from "@vercel/blob/client";
import {
  ArrowDownToLine,
  Check,
  Clipboard,
  FileText,
  LoaderCircle,
  UploadCloud,
  X,
  FolderOpen,
  FileCode2,
  LayoutDashboard,
  BookOpen,
  Github,
  FileUp,
  Radio,
  FileSpreadsheet,
  Image as ImageIcon,
  Music2,
} from "lucide-react";

const ACCEPT =
  ".pdf,.docx,.pptx,.xlsx,.txt,.csv,.html,.htm,.png,.jpg,.jpeg,.gif,.bmp,.webp,.tif,.tiff,.mp3,.wav,.epub,.xml,.json";

const MAX_FILE_MB = 100;

type Status = "idle" | "uploading" | "converting" | "done" | "error";

export default function Home() {
  const inputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [progress, setProgress] = useState(0);
  const [markdown, setMarkdown] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [dragging, setDragging] = useState(false);

  const chooseFile = (selected?: File) => {
    if (!selected) return;

    setMarkdown("");
    setError("");
    setProgress(0);
    setStatus("idle");

    if (selected.size > MAX_FILE_MB * 1024 * 1024) {
      setFile(null);
      setError(`This file is larger than the ${MAX_FILE_MB} MB limit.`);
      setStatus("error");
      return;
    }

    setFile(selected);
  };

  const convert = useCallback(async () => {
    if (!file) return;

    setError("");
    setMarkdown("");
    setProgress(0);

    const isVercel =
      process.env.NEXT_PUBLIC_VERCEL_MODE === "true";

    let blobUrl: string | null = null;

    try {
      let response: Response;

      if (isVercel) {
        // Step 1: Upload file to Vercel Blob
        setStatus("uploading");

        const blob = await uploadPresigned(file.name, file, {
          access: "public",
          handleUploadUrl: "/api/upload",
          multipart: file.size > 20 * 1024 * 1024,
          onUploadProgress: (event) => {
            setProgress(event.percentage);
          },
        });

        blobUrl = blob.url;

        // Step 2: Convert Blob file to Markdown
        setStatus("converting");

        response = await fetch("/api/convert", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            blobUrl: blob.url,
            filename: file.name,
          }),
        });
      } else {
        // Local Python backend
        setStatus("uploading");

        const form = new FormData();
        form.append("file", file);

        setProgress(100);
        setStatus("converting");

        const apiUrl =
          process.env.NEXT_PUBLIC_LOCAL_API ||
          "http://127.0.0.1:8000";

        response = await fetch(`${apiUrl}/convert`, {
          method: "POST",
          body: form,
        });
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || data.error || "Conversion failed."
        );
      }

      setMarkdown(data.markdown || "");
      setStatus("done");
    } catch (caught) {
      setStatus("error");

      setError(
        caught instanceof Error
          ? caught.message
          : "Something went wrong."
      );
    } finally {
      // Step 3: Delete temporary Blob file
      if (blobUrl) {
        try {
          const deleteResponse = await fetch("/api/delete", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              url: blobUrl,
            }),
          });

          if (!deleteResponse.ok) {
            console.error("Blob cleanup failed.");
          }
        } catch (deleteError) {
          console.error("Blob cleanup failed:", deleteError);
        }
      }
    }
  }, [file]);

  const download = () => {
    if (!markdown) return;

    const blob = new Blob([markdown], {
      type: "text/markdown;charset=utf-8",
    });

    const objectUrl = URL.createObjectURL(blob);
    const anchor = document.createElement("a");

    const baseName = (file?.name || "converted").replace(
      /\.[^.]+$/,
      ""
    );

    anchor.href = objectUrl;
    anchor.download = `${baseName}.md`;

    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();

    URL.revokeObjectURL(objectUrl);
  };

  const copy = async () => {
    if (!markdown) return;

    try {
      await navigator.clipboard.writeText(markdown);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1400);
    } catch {
      setError("Could not copy Markdown. Please copy it manually.");
    }
  };

  const busy =
    status === "uploading" || status === "converting";

  const statusText =
    status === "done"
      ? "CONVERSION COMPLETE"
      : status === "error"
        ? "CHECK INPUT"
        : status === "uploading"
          ? "UPLOADING"
          : status === "converting"
            ? "CONVERTING"
            : "READY";

  return (
    <main className="desktop">
      <div className="background-icon bg-icon-one">
        <FileCode2 />
      </div>

      <div className="background-icon bg-icon-two">
        <FolderOpen />
      </div>

      <div className="background-icon bg-icon-three">
        <FileSpreadsheet />
      </div>

      <div className="background-icon bg-icon-four">
        <ImageIcon />
      </div>

      <section className="app-window">
        <header className="window-titlebar">
          <div className="window-controls" aria-label="Window controls">
            <span />
            <span />
            <span />
          </div>

          <div className="window-title">MarkItDown</div>

          <div className="window-title-right">
            <span className="live-label">LIVE</span>
            <span className={`live-indicator ${busy ? "busy" : ""}`} />
          </div>
        </header>

        <div className="window-toolbar">
          <div className="toolbar-left">
            <span className="toolbar-mark">
              <FileCode2 size={21} />
            </span>

            <span className="toolbar-product">
              DOCUMENT WORKSPACE
            </span>
          </div>

          <div className="toolbar-right">
            <span className="engine-label">
              <Radio size={13} /> MARKITDOWN ENGINE
            </span>

            <a
              href="https://github.com/TaznimHimel"
              target="_blank"
              rel="noreferrer"
              aria-label="Creator GitHub profile"
            >
              <Github size={19} />
            </a>

            <a
              href="https://github.com/TaznimHimel/markitdown-web"
              target="_blank"
              rel="noreferrer"
              aria-label="Project repository"
            >
              <BookOpen size={19} />
            </a>
          </div>
        </div>

        <div className="app-body">
          <aside className="sidebar">
            <div className="workspace-select">
              <div className="workspace-avatar">
                <FileText size={17} />
              </div>

              <div className="workspace-name">
                <strong>Bonjour</strong>
                <span>Monsieur/Madame</span>
              </div>

              <span className="workspace-caret">⌄</span>
            </div>

            <div className="sidebar-section">
              <div className="sidebar-heading">
                <LayoutDashboard size={17} /> WORKSPACE
              </div>

              <div className="sidebar-link active">
                <FileUp size={16} /> Convert document
                <span className="active-dot" />
              </div>
            </div>

            <div className="sidebar-section supported-section">
              <div className="sidebar-heading">
                <FolderOpen size={17} /> SUPPORTED FILES
              </div>

              <div className="format-link">
                <FileText size={15} /> PDF / DOCX
              </div>

              <div className="format-link">
                <FileSpreadsheet size={15} /> PPTX / XLSX / CSV
              </div>

              <div className="format-link">
                <FileCode2 size={15} /> HTML / XML / JSON
              </div>

              <div className="format-link">
                <ImageIcon size={15} /> Images
              </div>

              <div className="format-link">
                <Music2 size={15} /> WAV / MP3 / EPUB
              </div>
            </div>
          </aside>

          <section className="main-content">
            <div className="content-heading">
              <div>
                <div className="breadcrumb">
                  WORKSPACE <span>/</span> CONVERTER
                </div>

                <h1>Document converter</h1>

                <p>
                  Turn your files into clean, readable Markdown.
                </p>
              </div>

              <div className={`status-pill ${status}`}>
                <span /> {statusText}
              </div>
            </div>

            <section className="upload-card">
              <div className="card-heading">
                <div>
                  <span className="card-index">01</span>
                  <h2>Choose a document</h2>
                </div>

                <span className="size-limit">
                  MAX {MAX_FILE_MB} MB
                </span>
              </div>

              <div
                className={`dropzone ${dragging ? "dragging" : ""} ${
                  file ? "has-file" : ""
                }`}
                onDragOver={(event) => {
                  event.preventDefault();
                  setDragging(true);
                }}
                onDragLeave={() => setDragging(false)}
                onDrop={(event) => {
                  event.preventDefault();
                  setDragging(false);
                  chooseFile(event.dataTransfer.files?.[0]);
                }}
              >
                <input
                  ref={inputRef}
                  type="file"
                  accept={ACCEPT}
                  hidden
                  onChange={(event) => {
                    chooseFile(event.target.files?.[0]);
                    event.target.value = "";
                  }}
                />

                {file ? (
                  <div className="selected-file">
                    <div className="file-icon">
                      <FileText size={22} />
                    </div>

                    <div className="file-info">
                      <strong title={file.name}>
                        {file.name}
                      </strong>

                      <span>
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                        {" · READY TO CONVERT"}
                      </span>
                    </div>

                    <button
                      className="remove-file"
                      type="button"
                      disabled={busy}
                      onClick={() => {
                        setFile(null);
                        setStatus("idle");
                        setMarkdown("");
                        setError("");
                        setProgress(0);
                      }}
                      aria-label="Remove selected file"
                    >
                      <X size={17} />
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="upload-symbol">
                      <UploadCloud size={27} />
                    </div>

                    <strong>Drop your file here</strong>

                    <span className="drop-hint">
                      or{" "}
                      <button
                        type="button"
                        onClick={() => inputRef.current?.click()}
                      >
                        browse files
                      </button>{" "}
                      from your computer
                    </span>
                  </>
                )}
              </div>

              {busy && (
                <div className="progress-area">
                  <div className="progress-caption">
                    <span>
                      {status === "uploading"
                        ? "UPLOADING SOURCE FILE"
                        : "RUNNING MARKITDOWN"}
                    </span>

                    <span>
                      {status === "uploading"
                        ? `${Math.round(progress)}%`
                        : "PROCESSING"}
                    </span>
                  </div>

                  <div className="progress-track">
                    <div
                      className={`progress-fill ${
                        status === "converting" ? "indeterminate" : ""
                      }`}
                      style={{
                        width:
                          status === "uploading"
                            ? `${progress}%`
                            : "45%",
                      }}
                    />
                  </div>
                </div>
              )}

              <button
                className="convert-button"
                type="button"
                disabled={!file || busy}
                onClick={convert}
              >
                {busy ? (
                  <>
                    <LoaderCircle className="spin" size={17} />
                    {status === "uploading"
                      ? "Uploading..."
                      : "Converting..."}
                  </>
                ) : (
                  <>
                    <FileUp size={17} />
                    Convert to Markdown
                  </>
                )}
              </button>

              {error && (
                <div className="error-message">
                  <X size={16} /> {error}
                </div>
              )}
            </section>

            <section className="output-card">
              <div className="card-heading output-heading">
                <div>
                  <span className="card-index">02</span>
                  <h2>Markdown output</h2>
                </div>

                <div className="output-actions">
                  <button
                    className="mini-action"
                    type="button"
                    disabled={!markdown}
                    onClick={copy}
                  >
                    {copied ? (
                      <Check size={14} />
                    ) : (
                      <Clipboard size={14} />
                    )}

                    {copied ? "COPIED" : "COPY"}
                  </button>

                  <button
                    className="mini-action download-action"
                    type="button"
                    disabled={!markdown}
                    onClick={download}
                  >
                    <ArrowDownToLine size={14} />
                    DOWNLOAD
                  </button>
                </div>
              </div>

              <div className="editor">
                <div className="editor-bar">
                  <div className="editor-dots">
                    <i />
                    <i />
                    <i />
                  </div>

                  <span>CONVERTED.MD</span>

                  <span className="editor-language">
                    MARKDOWN
                  </span>

                  {!markdown && (
                    <span className="editor-status">
                      WAITING FOR YOUR FILE
                    </span>
                  )}
                </div>

                <pre className="markdown-output">
                  {markdown ||
                    "## Your Markdown will appear here\n\nUpload a document and run the conversion to preview its contents.\n\n---\n\nThe original document is processed by Microsoft MarkItDown."}
                </pre>
              </div>
            </section>

            <footer className="content-footer">
              <span>© 2026 MARKITDOWN STUDIO</span>

              <span className="footer-powered">
                POWERED BY MICROSOFT MARKITDOWN
              </span>

              <a
                href="https://github.com/TaznimHimel"
                target="_blank"
                rel="noopener noreferrer"
                className="creator-link"
              >
                BUILT BY H1M3L <Github size={13} />
              </a>
            </footer>
          </section>
        </div>
      </section>
    </main>
  );
}
