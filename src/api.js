// ── VORTEX API CLIENT ──────────────────────────────────────────
// Todas as chamadas vão para o backend Python (porta 8082)
// Nunca chame APIs externas direto do frontend — chaves ficam no servidor

const BASE = "https://vortex-backend1.onrender.com";

// ── CHAT ───────────────────────────────────────────────────────
export async function callClaude(system, user, historico = []) {
  const res = await fetch(`${BASE}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ texto: user, system_prompt: system || "", historico }),
  });
  if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e?.detail || `HTTP ${res.status}`); }
  const data = await res.json();
  return data.resposta ?? "Sem resposta.";
}

// ── IMAGEM ─────────────────────────────────────────────────────
export async function generateImage(prompt, modelo = "PHOENIX") {
  const res = await fetch(`${BASE}/gerar-imagem`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt, modelo }),
  });
  if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e?.detail || `HTTP ${res.status}`); }
  const data = await res.json();
  return data.imagem;
}

// ── VÍDEO ──────────────────────────────────────────────────────
export async function generateVideo(prompt, duracao = 5) {
  const res = await fetch(`${BASE}/gerar-video`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt, duracao, resolucao: "720p", ratio: "9:16" }),
  });
  if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e?.detail || `HTTP ${res.status}`); }
  const data = await res.json();
  return data.video_url;
}

// ── VOZ ────────────────────────────────────────────────────────
export async function generateVoice(text, voiceId = "21m00Tcm4TlvDq8ikWAM") {
  const res = await fetch(`${BASE}/gerar-voz`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ texto: text, voz_id: voiceId }),
  });
  if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e?.detail || `HTTP ${res.status}`); }
  const data = await res.json();
  const base64 = data.audio_url.split(",")[1];
  const blob = new Blob([Uint8Array.from(atob(base64), c => c.charCodeAt(0))], { type: "audio/mpeg" });
  return URL.createObjectURL(blob);
}

// ── ROTEIRO ────────────────────────────────────────────────────
export async function gerarRoteiro(tema, formato = "curto") {
  const res = await fetch(`${BASE}/gerar-roteiro`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ tema, formato }),
  });
  if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e?.detail || `HTTP ${res.status}`); }
  return (await res.json()).roteiro;
}

// ── ANÁLISE DE PERFIL ──────────────────────────────────────────
export async function analisarPerfil(rede, perfil) {
  const res = await fetch(`${BASE}/analisar-perfil`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ rede, perfil }),
  });
  if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e?.detail || `HTTP ${res.status}`); }
  return res.json();
}

// ── TENDÊNCIAS ─────────────────────────────────────────────────
export async function getTendencias(nicho = "", plataforma = "") {
  const params = new URLSearchParams();
  if (nicho) params.append("nicho", nicho);
  if (plataforma) params.append("plataforma", plataforma);
  const res = await fetch(`${BASE}/tendencias?${params}`);
  if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e?.detail || `HTTP ${res.status}`); }
  return res.json();
}

// ── CRÉDITOS ───────────────────────────────────────────────────
export async function getSaldo() {
  const res = await fetch(`${BASE}/creditos/saldo`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return (await res.json()).saldo;
}

// ── STATUS ─────────────────────────────────────────────────────
export async function getStatus() {
  const res = await fetch(`${BASE}/status`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}