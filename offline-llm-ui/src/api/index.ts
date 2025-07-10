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

export interface QAResponse {
  answer: string
  sources: string[]
}

export interface UploadPDFResponse {
  status: 'ok'
  session_id: string
  chunks_indexed: number
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
  return res.json() as Promise<{ answer: string; sources: string[] }>
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
