// src/api/index.ts

// Default API endpoint. When running behind nginx this points to the
// /api proxy. `VITE_API_URL` can override for local development.
const BASE = import.meta.env.VITE_API_URL || "/api";


export interface ModelInfo {
  name: string
  description?: string
}

export interface ChatResponse {
  session_id: string
  answer: string
}

export interface SourceChunk {
  page_number?: number
  snippet: string
}

export interface QAResponse {
  answer: string
  sources: SourceChunk[]
}

export interface UploadPDFResponse {
  status: 'ok'
  session_id: string
  chunks_indexed: number
}

export interface AdminUploadResponse {
  status: 'ok'
  filename: string
}

/**
 * GET /models
 */
export async function listModels(): Promise<ModelInfo[]> {
  const res = await fetch(`${BASE}/models`)
  if (!res.ok) throw new Error(`listModels failed: ${res.statusText}`)
  return (await res.json()) as ModelInfo[]
}

/**
 * POST /chat
 */
export async function chat(
  sessionId: string,
  message: string,
  model?: string
): Promise<ChatResponse> {
  const res = await fetch(`${BASE}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      session_id: sessionId,
      user_msg: message,
      ...(model ? { model } : {}),
    }),
  })
  if (!res.ok) throw new Error(`chat failed: ${res.statusText}`)
  return (await res.json()) as ChatResponse
}

/**
 * POST /doc_qa
 */
export async function docQa(
  question: string,
  sessionId?: string,
  model?: string
) {
  const res = await fetch(`${BASE}/doc_qa`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question, session_id: sessionId, model }),
  })
  if (!res.ok) throw new Error(await res.text())
  return res.json() as Promise<QAResponse>
}


/**
 * POST /upload_pdf
 */
export async function uploadPdf(sessionId: string, file: File) {
  const form = new FormData();
  form.append("file", file);

  const res = await fetch(`${BASE}/upload_pdf?session_id=${sessionId}`, {
    method: "POST",
    body: form,
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

/**
 * POST /admin/upload_pdf
 */
export async function adminUploadPdf(file: File, password: string): Promise<AdminUploadResponse> {
  const form = new FormData();
  form.append('file', file);
  const res = await fetch(`${BASE}/admin/upload_pdf`, {
    method: 'POST',
    headers: {
      Authorization: 'Basic ' + btoa(`admin:${password}`),
    },
    body: form,
  });
  if (!res.ok) throw new Error(await res.text());
  return (await res.json()) as AdminUploadResponse;
}

/**
 * POST /admin/upload_pdf with progress tracking
 */
export function adminUploadPdfWithProgress(
  file: File,
  password: string,
  onProgress: (percent: number) => void,
): Promise<AdminUploadResponse> {
  return new Promise((resolve, reject) => {
    const form = new FormData();
    form.append('file', file);

    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${BASE}/admin/upload_pdf`);
    xhr.setRequestHeader('Authorization', 'Basic ' + btoa(`admin:${password}`));

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          resolve(JSON.parse(xhr.responseText) as AdminUploadResponse);
        } catch (err) {
          reject(err);
        }
      } else {
        reject(new Error(xhr.responseText || `Request failed with status ${xhr.status}`));
      }
    };

    xhr.onerror = () => reject(new Error('Network error'));

    xhr.send(form);
  });
}

export interface AdminFilesResponse {
  ingested: string[]
  failed: string[]
}

export async function adminListFiles(password: string): Promise<AdminFilesResponse> {
  const res = await fetch(`${BASE}/admin/files`, {
    headers: { Authorization: 'Basic ' + btoa(`admin:${password}`) },
  })
  if (!res.ok) throw new Error(await res.text())
  return (await res.json()) as AdminFilesResponse
}

export interface DeleteFileResponse {
  status: string
  filename: string
}

export async function adminDeleteFile(
  filename: string,
  password: string,
): Promise<DeleteFileResponse> {
  const res = await fetch(`${BASE}/admin/file/${encodeURIComponent(filename)}`, {
    method: 'DELETE',
    headers: { Authorization: 'Basic ' + btoa(`admin:${password}`) },
  })
  if (!res.ok) throw new Error(await res.text())
  return (await res.json()) as DeleteFileResponse
}

/**
 * POST /session_qa
 */
export async function sessionQA(
  question: string,
  sessionId: string,
  model?: string,
  persistent = true,
): Promise<QAResponse> {
  const payload: Record<string, any> = { question, session_id: sessionId, persistent }
  if (model) payload.model = model

  const res = await fetch(`${BASE}/session_qa`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error(`sessionQA failed: ${res.statusText}`)
  return (await res.json()) as QAResponse
}


/**
 * POST /proofread
 */
export interface GrammarResponse {
  corrected: string
}

export async function grammarCheck(text: string): Promise<GrammarResponse> {
  const res = await fetch(`${BASE}/proofread`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  })
  if (!res.ok) throw new Error(`grammarCheck failed: ${res.statusText}`)
  return (await res.json()) as GrammarResponse
}

/**
 * POST /redraft
 */
export interface RedraftResponse {
  corrected: string
}

export async function redraftText(text: string): Promise<RedraftResponse> {
  const res = await fetch(`${BASE}/redraft`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  })
  if (!res.ok) throw new Error(`redraftText failed: ${res.statusText}`)
  return (await res.json()) as RedraftResponse
}

/**
 * POST /speech_to_text
 */
export interface SpeechResponse {
  text: string
}

export async function speechToText(file: File): Promise<SpeechResponse> {
  const form = new FormData()
  form.append('file', file)
  const res = await fetch(`${BASE}/speech_to_text`, { method: 'POST', body: form })
  if (!res.ok) throw new Error(await res.text())
  return (await res.json()) as SpeechResponse
}
