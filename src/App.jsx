import { useState, useEffect, useRef, useCallback } from "react";



// URL do backend — troca aqui quando migrar de servidor

const BACKEND = "https://vortex-backend1.onrender.com";





// ==============================

// Session ID único por dispositivo — identifica o usuário sem login

function getSessionId() {

  let sid = localStorage.getItem("vortex_session_id");

  if(!sid) {

    sid = "sess_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2,10);

    localStorage.setItem("vortex_session_id", sid);

  }

  return sid;

}



// Headers padrão com Session-ID para todos os requests

function vortexHeaders(extra={}) {

  return {

    "Content-Type": "application/json",

    "X-Session-ID": getSessionId(),

    ...extra

  };

}



async function callClaude(systemPrompt, userPrompt, historico=[]) {

  let res;

  try {

    res = await fetch(`${BACKEND}/chat`, {

      method: "POST",

      headers: vortexHeaders(),

      body: JSON.stringify({ texto: userPrompt, system_prompt: systemPrompt || "", historico, modo: window.__vortexModo || "criador" }),

    });

  } catch (networkErr) {

    throw new Error("?? Backend offline — inicie o servidor Python na porta 8082");

  }

  if (!res.ok) { const e = await res.json().catch(()=>({})); throw new Error(e?.detail || `HTTP ${res.status}`); }

  const data = await res.json();

  // Guardar modelo usado globalmente para mostrar na UI

  if(data.modelo) window.__vortexModeloAtual = data.modelo;

  return data.resposta ?? "Sem resposta.";

}



// ==============================

const STYLE = `

@import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500;600&display=swap');

*,*::before,*::after { box-sizing: border-box; margin: 0; padding: 0; }

:root {

  --bg: #08080f; --bg2: #0d0d1c; --bg3: #111120; --bg4: #16162a;

  --border: rgba(123,47,255,.12); --border2: rgba(123,47,255,.28);

  --purple: #7b2fff; --purple2: #9d5cff; --purple3: #c4a0ff;

  --pink: #f472b6; --cyan: #22d3ee; --green: #34d399; --yellow: #fbbf24;

  --text: #f0eeff; --text2: #9b8fcc; --text3: #4a4470;

  --fh: 'Syne', sans-serif; --fb: 'DM Sans', sans-serif;

  --r-sm: 8px; --r-md: 12px; --r-lg: 18px; --r-xl: 24px;

  --glow: 0 0 24px rgba(123,47,255,.5);

}

html, body, #root { height: 100%; background: var(--bg); color: var(--text); font-family: var(--fb); }

::-webkit-scrollbar { width: 3px; }

::-webkit-scrollbar-thumb { background: rgba(124,92,252,.3); border-radius: 99px; }

.shell { display: flex; height: 100vh; overflow: hidden; position: relative; }

.ambient { position: fixed; inset: 0; pointer-events: none; z-index: 0; }

.amb1 { position: absolute; width: 600px; height: 600px; top: -200px; right: -150px; border-radius: 50%; background: radial-gradient(circle, rgba(123,47,255,.15) 0%, transparent 70%); filter: blur(60px); }

.amb2 { position: absolute; width: 400px; height: 400px; bottom: -100px; left: -100px; border-radius: 50%; background: radial-gradient(circle, rgba(244,114,182,.06) 0%, transparent 70%); filter: blur(60px); }

.sidebar { width: 228px; min-width: 228px; background: rgba(8,8,15,.98); border-right: .5px solid rgba(123,47,255,.2); display: flex; flex-direction: column; overflow: hidden; position: relative; z-index: 10; transition: transform .28s cubic-bezier(.4,0,.2,1); }

.sidebar-scroll { display: flex; flex-direction: column; height: 100%; overflow-y: auto; padding-bottom: 1.5rem; padding-top: .25rem; }

.sidebar-scroll::-webkit-scrollbar { width: 0; }

.logo-wrap { padding: 1.75rem 1.25rem 1.25rem; flex-shrink: 0; }

.logo { font-family: var(--fh); font-size: 1.5rem; font-weight: 800; letter-spacing: -.05em; display: flex; align-items: center; }

.logo em { font-style: normal; color: var(--purple2); text-shadow: 0 0 20px rgba(123,47,255,.8); }

.logo-sub { font-size: 9px; letter-spacing: .18em; text-transform: uppercase; color: var(--text3); margin-top: -2px; }

.nav-section { padding: .3rem .75rem .15rem; }

.nav-label { font-size: 9px; font-weight: 700; letter-spacing: .14em; text-transform: uppercase; color: var(--text3); padding: .7rem .25rem .3rem; display: block; opacity: .7; }

.nav-item { display: flex; align-items: center; gap: 9px; padding: 9px 12px; border-radius: var(--r-md); border: none; background: transparent; color: var(--text3); font-family: var(--fb); font-size: 13px; font-weight: 500; cursor: pointer; transition: all .18s; text-align: left; width: 100%; position: relative; }

.nav-item:hover { background: rgba(255,255,255,.05); color: var(--text2); transform: translateX(2px); }

.nav-item.active { background: rgba(123,47,255,.15); color: var(--text); border: .5px solid rgba(123,47,255,.4); box-shadow: 0 0 16px rgba(123,47,255,.15); }

.nav-item.active::before { content: ''; position: absolute; left: 0; top: 25%; bottom: 25%; width: 2.5px; border-radius: 99px; background: var(--purple); box-shadow: 0 0 8px var(--purple); }

.nav-icon { font-size: 15px; width: 18px; text-align: center; flex-shrink: 0; }

.nav-badge { margin-left: auto; font-size: 9px; font-weight: 700; padding: 2px 7px; border-radius: 99px; background: rgba(244,114,182,.15); color: var(--pink); text-transform: uppercase; letter-spacing: .04em; }

.nav-divider { border: none; border-top: .5px solid var(--border); margin: .4rem 0; }

.sidebar-footer { margin-top: auto; padding: .75rem .75rem 0; border-top: .5px solid rgba(123,47,255,.1); }

.main { flex: 1; display: flex; flex-direction: column; overflow: hidden; position: relative; z-index: 1; min-width: 0; }

.topbar { display: flex; align-items: center; justify-content: space-between; padding: .875rem 1.5rem; border-bottom: .5px solid rgba(123,47,255,.15); background: rgba(8,8,15,.9); backdrop-filter: blur(20px); flex-shrink: 0; gap: 12px; }

.topbar-left { display: flex; align-items: center; gap: 12px; }

.topbar-title { font-family: var(--fh); font-size: 1rem; font-weight: 700; letter-spacing: -.02em; }

.topbar-sub { font-size: 12px; color: var(--text3); }

.topbar-right { display: flex; align-items: center; gap: 8px; }

.pill { display: inline-flex; align-items: center; gap: 5px; padding: 5px 12px; border-radius: 99px; font-size: 12px; font-weight: 500; }

.pill-green { background: rgba(52,211,153,.1); border: .5px solid rgba(52,211,153,.25); color: var(--green); }

.pill-purple { background: rgba(123,47,255,.15); border: .5px solid rgba(123,47,255,.4); color: var(--purple2); }

.pill-dot { width: 5px; height: 5px; border-radius: 50%; }

.hamburger { display: none; background: transparent; border: .5px solid var(--border2); border-radius: var(--r-sm); color: var(--text2); padding: 7px; cursor: pointer; font-size: 18px; }

.scroll { flex: 1; overflow-y: auto; position: relative; }

.page { max-width: 820px; margin: 0 auto; padding: 2rem 1.5rem 6rem; }

.page-header { margin-bottom: 2rem; }

.eyebrow { display: inline-flex; align-items: center; gap: 6px; font-size: 10px; font-weight: 600; letter-spacing: .12em; text-transform: uppercase; color: var(--text3); margin-bottom: 6px; }

.eyebrow-dot { width: 5px; height: 5px; border-radius: 50%; background: var(--cyan); }

.page-title { font-family: var(--fh); font-size: clamp(1.75rem, 4vw, 2.5rem); font-weight: 800; letter-spacing: -.04em; line-height: 1; }

.page-title em { font-style: normal; color: var(--purple2); }

.page-sub { font-size: 14px; color: var(--text2); margin-top: .5rem; line-height: 1.5; }

.card { background: var(--bg3); border: .5px solid var(--border); border-radius: var(--r-lg); padding: 1.5rem; margin-bottom: 1.25rem; transition: border-color .2s; }

.card:hover { border-color: var(--border2); }

.card-title { font-family: var(--fh); font-size: .95rem; font-weight: 700; margin-bottom: 1rem; letter-spacing: -.01em; }

.stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 10px; margin-bottom: 1.5rem; }

.stat { background: var(--bg3); border: .5px solid var(--border); border-radius: var(--r-lg); padding: 1.25rem 1rem; transition: border-color .2s, background .2s; }

.stat:hover { border-color: rgba(124,92,252,.3); background: var(--bg4); }

.stat-label { font-size: 10px; color: var(--text3); text-transform: uppercase; letter-spacing: .08em; margin-bottom: 6px; font-weight: 600; }

.stat-val { font-family: var(--fh); font-size: 1.9rem; font-weight: 800; letter-spacing: -.04em; }

.stat-sub { font-size: 11px; color: var(--text3); margin-top: 3px; }

.quick-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; }

.quick-btn { display: flex; align-items: center; gap: 12px; padding: 14px 16px; background: var(--bg4); border: .5px solid var(--border); border-radius: var(--r-lg); cursor: pointer; transition: all .2s; text-align: left; width: 100%; }

.quick-btn:hover { border-color: rgba(124,92,252,.4); background: rgba(124,92,252,.07); transform: translateY(-1px); }

.quick-icon { width: 38px; height: 38px; border-radius: var(--r-md); display: flex; align-items: center; justify-content: center; font-size: 18px; flex-shrink: 0; }

.quick-name { font-size: 13px; font-weight: 600; color: var(--text); margin-bottom: 2px; }

.quick-desc { font-size: 11px; color: var(--text3); }

.input { width: 100%; background: rgba(255,255,255,.04); border: .5px solid var(--border2); border-radius: var(--r-md); padding: 11px 14px; color: var(--text); font-family: var(--fb); font-size: 14px; outline: none; transition: border-color .15s, background .15s; }

.input:focus { border-color: rgba(123,47,255,.7); background: rgba(123,47,255,.05); box-shadow: 0 0 0 2px rgba(123,47,255,.15); }

.input::placeholder { color: var(--text3); }

textarea.input { resize: vertical; min-height: 90px; line-height: 1.6; }

.select { background: rgba(255,255,255,.04); border: .5px solid var(--border2); border-radius: var(--r-md); padding: 10px 14px; color: var(--text); font-family: var(--fb); font-size: 14px; outline: none; width: 100%; cursor: pointer; transition: border-color .15s; }

.select:focus { border-color: rgba(124,92,252,.6); }

.select option { background: #1a1a2e; }

.label { display: block; font-size: 11px; font-weight: 600; color: var(--text3); margin-bottom: 6px; letter-spacing: .06em; text-transform: uppercase; }

.field { margin-bottom: 1rem; }

.grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }

.btn { display: inline-flex; align-items: center; justify-content: center; gap: 8px; padding: 11px 22px; border-radius: var(--r-md); border: none; background: linear-gradient(135deg, #7b2fff 0%, #9d5cff 100%); color: #fff; font-family: var(--fh); font-size: 13px; font-weight: 700; cursor: pointer; transition: opacity .2s, transform .15s, box-shadow .2s; letter-spacing: -.01em; position: relative; box-shadow: 0 0 20px rgba(123,47,255,.4); }

.btn:hover { opacity: .88; } .btn:active { transform: scale(.97); } .btn:disabled { opacity: .35; cursor: not-allowed; }

.btn-sm { padding: 8px 16px; font-size: 12px; } .btn-full { width: 100%; }

.btn-ghost { background: transparent; border: .5px solid var(--border2); color: var(--text2); background: none; }

.btn-ghost:hover { border-color: rgba(124,92,252,.5); color: var(--text); background: rgba(124,92,252,.08); opacity: 1; }

.chips { display: flex; gap: 7px; flex-wrap: wrap; margin-bottom: 1rem; }

.chip { padding: 6px 14px; border-radius: 99px; border: .5px solid var(--border2); background: transparent; color: var(--text3); font-family: var(--fb); font-size: 12px; font-weight: 500; cursor: pointer; transition: all .15s; }

.chip:hover { border-color: rgba(124,92,252,.4); color: var(--text2); }

.chip.active { background: rgba(123,47,255,.2); border-color: rgba(123,47,255,.6); color: var(--purple3); box-shadow: 0 0 8px rgba(123,47,255,.2); }

.resultado { background: rgba(34,211,238,.04); border: .5px solid rgba(34,211,238,.18); border-radius: var(--r-md); padding: 1.25rem; margin-top: 1rem; }

.resultado-titulo { font-size: 11px; color: var(--cyan); font-weight: 600; margin-bottom: .5rem; letter-spacing: .06em; text-transform: uppercase; }

.resultado-texto { font-size: 14px; line-height: 1.75; color: var(--text2); }

.erro { background: rgba(239,68,68,.08); border: .5px solid rgba(239,68,68,.25); border-radius: var(--r-sm); padding: 10px 14px; font-size: 13px; color: #fca5a5; margin-top: .75rem; }

.api-warning { background: rgba(251,191,36,.06); border: .5px solid rgba(251,191,36,.3); border-radius: var(--r-md); padding: 12px 16px; font-size: 13px; color: var(--yellow); margin-bottom: 1rem; display: flex; align-items: flex-start; gap: 10px; line-height: 1.5; }

.spinner { width: 15px; height: 15px; border: 2px solid rgba(255,255,255,.2); border-top-color: #fff; border-radius: 50%; animation: spin .6s linear infinite; flex-shrink: 0; }

@keyframes spin { to { transform: rotate(360deg); } }

.badge { display: inline-flex; align-items: center; gap: 5px; font-size: 11px; font-weight: 600; padding: 3px 10px; border-radius: 99px; }

.badge-ok { background: rgba(52,211,153,.1); color: var(--green); border: .5px solid rgba(52,211,153,.25); }

.badge-warn { background: rgba(251,191,36,.1); color: var(--yellow); border: .5px solid rgba(251,191,36,.25); }

.metricas { display: grid; grid-template-columns: repeat(auto-fit, minmax(110px, 1fr)); gap: 10px; margin-bottom: 1rem; }

.metrica { background: rgba(255,255,255,.03); border: .5px solid var(--border); border-radius: var(--r-md); padding: 1rem; text-align: center; }

.metrica-label { font-size: 10px; color: var(--text3); margin-bottom: 4px; text-transform: uppercase; letter-spacing: .05em; }

.metrica-val { font-family: var(--fh); font-size: 1.3rem; font-weight: 800; color: var(--purple2); }

.chat-messages { flex: 1; overflow-y: auto; padding: 1.5rem 1.5rem 1rem; display: flex; flex-direction: column; gap: 14px; }

.msg-row { display: flex; gap: 10px; animation: msgIn .25s ease; }

@keyframes msgIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }

.msg-row.user { flex-direction: row-reverse; }

.msg-avatar { width: 32px; height: 32px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 800; font-family: var(--fh); flex-shrink: 0; margin-top: 2px; }

.msg-avatar-bot { background: linear-gradient(135deg, rgba(123,47,255,.5), rgba(157,92,255,.3)); border: .5px solid rgba(123,47,255,.6); color: var(--purple3); box-shadow: 0 0 10px rgba(123,47,255,.3); }

.msg-avatar-user { background: rgba(255,255,255,.07); border: .5px solid var(--border2); color: var(--text2); }

.msg-bubble { max-width: 72%; padding: 12px 16px; font-size: 14px; line-height: 1.75; word-break: break-word; }

.msg-bubble.bot { background: rgba(17,17,32,.95); border: .5px solid rgba(123,47,255,.3); color: #e8e0ff; border-radius: 4px 16px 16px 16px; }

.msg-bubble.user { background: linear-gradient(135deg, rgba(123,47,255,.4), rgba(157,92,255,.3)); border: .5px solid rgba(123,47,255,.6); color: #ffffff; border-radius: 16px 4px 16px 16px; white-space: pre-wrap; box-shadow: 0 0 16px rgba(123,47,255,.15); }

.msg-name { font-size: 10px; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; color: var(--purple2); margin-bottom: 5px; font-family: var(--fh); }

.md p { margin-bottom: .6rem; } .md p:last-child { margin-bottom: 0; }

.md strong { color: var(--text); font-weight: 700; } .md em { color: var(--purple3); font-style: italic; }

.md h1,.md h2,.md h3 { font-family: var(--fh); font-weight: 700; color: var(--text); margin: .85rem 0 .35rem; letter-spacing: -.02em; }

.md h2 { font-size: 1rem; color: var(--purple2); } .md h3 { font-size: .92rem; color: var(--cyan); }

.md ul,.md ol { padding-left: 1.25rem; margin-bottom: .6rem; } .md li { margin-bottom: .28rem; line-height: 1.65; }

.md code { background: rgba(124,92,252,.15); color: var(--purple3); padding: 2px 7px; border-radius: 5px; font-size: .87em; }

.md blockquote { border-left: 3px solid var(--purple); padding-left: .85rem; color: var(--text2); margin: .6rem 0; font-style: italic; }

.typing { display: flex; gap: 5px; padding: 14px 16px; background: var(--bg3); border: .5px solid var(--border2); border-radius: 4px 16px 16px 16px; width: fit-content; }

.typing-dot { width: 7px; height: 7px; border-radius: 50%; background: var(--text3); animation: typing .9s ease infinite; }

.typing-dot:nth-child(2) { animation-delay: .15s; } .typing-dot:nth-child(3) { animation-delay: .30s; }

@keyframes typing { 0%,100% { transform: translateY(0); background: var(--text3); } 50% { transform: translateY(-4px); background: var(--purple2); } }

.chat-input-wrap { padding: .875rem 1.5rem 1.25rem; border-top: .5px solid var(--border); background: rgba(7,7,14,.9); flex-shrink: 0; }

.chat-input-box { display: flex; align-items: flex-end; gap: 10px; background: var(--bg3); border: .5px solid var(--border2); border-radius: var(--r-lg); padding: 10px 10px 10px 16px; transition: border-color .2s; }

.chat-input-box:focus-within { border-color: rgba(123,47,255,.6); background: var(--bg4); box-shadow: 0 0 0 2px rgba(123,47,255,.1); }

.chat-textarea { flex: 1; background: transparent; border: none; outline: none; font-size: 14px; color: var(--text); font-family: var(--fb); resize: none; max-height: 120px; overflow-y: auto; line-height: 1.6; padding: 3px 0; }

.chat-textarea::placeholder { color: var(--text3); }

.chat-send { width: 38px; height: 38px; border-radius: var(--r-md); border: none; background: linear-gradient(135deg, #7b2fff, #9d5cff); color: #fff; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: opacity .2s, transform .15s; flex-shrink: 0; font-size: 16px; box-shadow: 0 0 16px rgba(123,47,255,.5); }

.chat-send:hover { opacity: .85; } .chat-send:active { transform: scale(.93); } .chat-send:disabled { opacity: .3; cursor: not-allowed; }

.chat-hint { text-align: center; font-size: 11px; color: var(--text3); margin-top: 8px; }

.suggestions { display: flex; gap: 7px; flex-wrap: wrap; padding: 0 1.5rem .875rem; flex-shrink: 0; }

.suggestion { padding: 6px 13px; border-radius: 99px; border: .5px solid var(--border2); background: rgba(255,255,255,.03); color: var(--text3); font-size: 12px; font-weight: 500; font-family: var(--fb); cursor: pointer; transition: all .15s; }

.suggestion:hover { border-color: rgba(123,47,255,.5); color: var(--purple3); background: rgba(123,47,255,.1); }

.ob-overlay { position: fixed; inset: 0; z-index: 200; background: rgba(4,4,10,.97); display: flex; align-items: center; justify-content: center; padding: 1.5rem; animation: fadeIn .3s ease; }

@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

.ob-box { width: 100%; max-width: 500px; background: var(--bg3); border: .5px solid rgba(124,92,252,.3); border-radius: var(--r-xl); padding: 2.25rem 2rem; position: relative; overflow: hidden; max-height: 90vh; overflow-y: auto; }

.ob-dots { display: flex; gap: 6px; margin-bottom: 1.75rem; }

.ob-dot { height: 3px; border-radius: 99px; background: var(--border2); transition: all .3s; }

.ob-dot.active { background: var(--purple); } .ob-dot.done { background: var(--purple2); }

.ob-title { font-family: var(--fh); font-size: 1.55rem; font-weight: 800; letter-spacing: -.04em; margin-bottom: .4rem; line-height: 1.1; }

.ob-title em { font-style: normal; color: var(--purple2); }

.ob-sub { font-size: 13px; color: var(--text2); margin-bottom: 1.5rem; line-height: 1.5; }

.ob-chips { display: flex; gap: 7px; flex-wrap: wrap; margin-bottom: 1.1rem; }

.ob-chip { padding: 7px 15px; border-radius: 99px; border: .5px solid var(--border2); background: transparent; color: var(--text3); font-family: var(--fb); font-size: 13px; font-weight: 500; cursor: pointer; transition: all .15s; }

.ob-chip:hover { border-color: rgba(124,92,252,.4); color: var(--text2); }

.ob-chip.active { background: rgba(124,92,252,.18); border-color: rgba(124,92,252,.55); color: var(--purple3); }

.ob-dias { display: grid; grid-template-columns: repeat(7, 1fr); gap: 6px; margin-bottom: 1.1rem; }

.ob-dia { aspect-ratio: 1; border-radius: 10px; border: .5px solid var(--border2); background: transparent; color: var(--text3); font-size: 11px; font-weight: 600; cursor: pointer; transition: all .15s; display: flex; align-items: center; justify-content: center; }

.ob-dia:hover { border-color: rgba(124,92,252,.4); color: var(--text2); }

.ob-dia.active { background: rgba(124,92,252,.2); border-color: rgba(124,92,252,.6); color: var(--purple3); }

.ob-nav { display: flex; gap: 10px; margin-top: 1.4rem; }

.ob-fim { text-align: center; padding: .5rem 0; }

.ob-fim-icon { font-size: 2.75rem; margin-bottom: .85rem; animation: pulse 1.5s ease infinite; }

@keyframes pulse { 0%,100% { transform: scale(1); } 50% { transform: scale(1.08); } }

.ob-bv { font-size: 13.5px; color: var(--text2); line-height: 1.7; background: rgba(124,92,252,.06); border: .5px solid rgba(124,92,252,.2); border-radius: var(--r-md); padding: .9rem 1.1rem; margin: .85rem 0; white-space: pre-wrap; }

.pacotes { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 10px; margin-bottom: 1.5rem; }

.pacote { background: var(--bg3); border: .5px solid var(--border); border-radius: var(--r-lg); padding: 1.25rem 1rem; cursor: pointer; transition: all .2s; position: relative; overflow: hidden; }

.pacote:hover { background: var(--bg4); border-color: var(--border2); transform: translateY(-2px); }

.pacote.sel { background: rgba(124,92,252,.08); border-color: rgba(124,92,252,.5); border-width: 1px; }

.pacote-check { position: absolute; top: 10px; right: 10px; width: 20px; height: 20px; border-radius: 50%; background: var(--purple); display: flex; align-items: center; justify-content: center; opacity: 0; transition: opacity .2s; font-size: 11px; }

.pacote.sel .pacote-check { opacity: 1; }

.pacote-nome { font-family: var(--fh); font-size: 1rem; font-weight: 700; margin-bottom: 2px; }

.pacote-desc { font-size: 11px; color: var(--text3); margin-bottom: .75rem; }

.pacote-preco { font-family: var(--fh); font-size: 1.8rem; font-weight: 800; letter-spacing: -.04em; }

.pacote-preco sup { font-size: .75rem; font-family: var(--fb); font-weight: 400; vertical-align: top; margin-top: .4rem; display: inline-block; }

.pacote-cred { font-size: 12px; color: var(--text3); margin-top: 3px; }

.pacote-bonus { font-size: 11px; color: var(--yellow); margin-top: 2px; }

.checkout { background: var(--bg3); border: .5px solid var(--border); border-radius: var(--r-lg); padding: 1.5rem; }

.checkout-row { display: flex; justify-content: space-between; font-size: 13px; padding: 7px 0; color: var(--text3); }

.checkout-row span:last-child { color: var(--text); }

.checkout-row.total { border-top: .5px solid var(--border); padding-top: 12px; margin-top: 4px; font-size: 15px; font-weight: 500; color: var(--text); }

.checkout-row.total span:last-child { font-family: var(--fh); font-size: 1.25rem; color: var(--purple2); }

.toggle-row { display: flex; align-items: center; justify-content: space-between; padding: 13px 0; border-bottom: .5px solid var(--border); }

.toggle-row:last-child { border-bottom: none; }

.toggle-name { font-size: 14px; font-weight: 500; margin-bottom: 2px; }

.toggle-desc { font-size: 12px; color: var(--text3); }

.toggle { width: 42px; height: 24px; background: rgba(255,255,255,.08); border-radius: 99px; border: none; cursor: pointer; position: relative; transition: background .2s; flex-shrink: 0; margin-left: 1rem; }

.toggle.on { background: var(--purple); }

.toggle::after { content: ''; position: absolute; top: 4px; left: 4px; width: 16px; height: 16px; border-radius: 50%; background: #fff; transition: transform .2s; box-shadow: 0 1px 3px rgba(0,0,0,.3); }

.toggle.on::after { transform: translateX(18px); }

.bottom-nav { display: none; align-items: center; justify-content: space-around; padding: 8px 4px 20px; border-top: .5px solid rgba(123,47,255,.12); background: rgba(8,8,15,.98); backdrop-filter: blur(20px); flex-shrink: 0; }

.bn-item { display: flex; flex-direction: column; align-items: center; gap: 3px; cursor: pointer; padding: 6px 10px; border-radius: var(--r-md); border: none; background: transparent; transition: all .2s; flex: 1; }

.bn-item.active { background: rgba(123,47,255,.15); }

.bn-item.active .bn-icon { filter: drop-shadow(0 0 6px rgba(123,47,255,.8)); transform: scale(1.1); }

.bn-icon { font-size: 20px; transition: all .2s; } .bn-label { font-size: 10px; font-weight: 500; color: var(--text3); font-family: var(--fb); }

.bn-item.active .bn-label { color: var(--purple2); }

.sidebar-overlay { display: none; position: fixed; inset: 0; background: rgba(0,0,0,.6); z-index: 9; backdrop-filter: blur(4px); }

@media (max-width: 768px) {

  .sidebar { position: fixed; top: 0; left: 0; bottom: 0; z-index: 100; transform: translateX(-100%); }

  .sidebar.open { transform: translateX(0); }

  .sidebar-overlay { display: block; }

  .bottom-nav { display: flex; }

  .hamburger { display: flex; }

  .topbar-right .pill { display: none; }

  .quick-grid { grid-template-columns: 1fr 1fr; }

  .grid2 { grid-template-columns: 1fr; }

  .stats { grid-template-columns: repeat(3, 1fr); }

  .page { padding: 1.25rem 1rem 2rem; }

  .chat-messages { padding: 1rem 1rem .75rem; }

  .chat-input-wrap { padding: .75rem 1rem 1rem; }

  .suggestions { padding: 0 1rem .75rem; }

}

@media (max-width: 480px) {

  .stats { grid-template-columns: 1fr 1fr; }

  .metricas { grid-template-columns: 1fr 1fr; }

  .pacotes { grid-template-columns: 1fr 1fr; }

  .msg-bubble { max-width: 88%; }

}

@keyframes scan-line { 0%{top:-10%} 100%{top:110%} }

@keyframes flicker { 0%,100%{opacity:1} 50%{opacity:.85} }

@keyframes float-up { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }

@keyframes shimmer { 0%{background-position:-200% 0} 100%{background-position:200% 0} }

@keyframes wave-bar { 0%,100%{height:4px} 50%{height:20px} }

@keyframes particle { 0%{transform:translateY(0) scale(1);opacity:1} 100%{transform:translateY(-40px) scale(0);opacity:0} }

@keyframes rotate-glow { 0%{filter:hue-rotate(0deg)} 100%{filter:hue-rotate(360deg)} }

.vid-card-scan::after { content:""; position:absolute; left:0; right:0; height:2px; background:linear-gradient(90deg,transparent,rgba(124,92,252,.8),transparent); animation:scan-line 2s linear infinite; pointer-events:none; }

.vid-card-play { transition:all .2s; }

.vid-card-play:hover .play-icon { transform:translate(-50%,-50%) scale(1.2); }

.img-card:hover { transform:scale(1.03); box-shadow:0 8px 32px rgba(124,92,252,.25); }

`;



// ==============================

function Md({ text }) {

  if (!text) return null;

  const parseInline = (str) => {

    const parts = []; const re = /(\*\*\*(.+?)\*\*\*|\*\*(.+?)\*\*|\*(.+?)\*|`([^`]+)`)/g;

    let last = 0, m;

    while ((m = re.exec(str)) !== null) {

      if (m.index > last) parts.push(str.slice(last, m.index));

      if (m[2]) parts.push(<strong key={m.index}><em>{m[2]}</em></strong>);

      else if (m[3]) parts.push(<strong key={m.index}>{m[3]}</strong>);

      else if (m[4]) parts.push(<em key={m.index}>{m[4]}</em>);

      else if (m[5]) parts.push(<code key={m.index}>{m[5]}</code>);

      last = m.index + m[0].length;

    }

    if (last < str.length) parts.push(str.slice(last));

    return parts.length > 1 ? parts : str;

  };

  const lines = text.split("\n"); const elements = []; let i = 0;

  while (i < lines.length) {

    const line = lines[i];

    if (/^### (.+)/.test(line)) elements.push(<h3 key={i}>{parseInline(line.slice(4))}</h3>);

    else if (/^## (.+)/.test(line)) elements.push(<h2 key={i}>{parseInline(line.slice(3))}</h2>);

    else if (/^# (.+)/.test(line)) elements.push(<h1 key={i}>{parseInline(line.slice(2))}</h1>);

    else if (/^---+$/.test(line.trim())) elements.push(<hr key={i} />);

    else if (/^> (.+)/.test(line)) elements.push(<blockquote key={i}>{parseInline(line.slice(2))}</blockquote>);

    else if (/^[*-] (.+)/.test(line)) {

      const items = [];

      while (i < lines.length && /^[*-] (.+)/.test(lines[i])) { items.push(<li key={i}>{parseInline(lines[i].slice(2))}</li>); i++; }

      elements.push(<ul key={`ul${i}`}>{items}</ul>); continue;

    } else if (/^\d+\. (.+)/.test(line)) {

      const items = [];

      while (i < lines.length && /^\d+\. (.+)/.test(lines[i])) { items.push(<li key={i}>{parseInline(lines[i].replace(/^\d+\. /, ""))}</li>); i++; }

      elements.push(<ol key={`ol${i}`}>{items}</ol>); continue;

    } else if (line.trim() !== "") elements.push(<p key={i}>{parseInline(line)}</p>);

    i++;

  }

  return <div className="md">{elements}</div>;

}



// ==============================

const PACOTES = [

  { id: "starter", nome: "Starter", desc: "Pra testar", preco: 15, creditos: 20, bonus: null },

  { id: "creator", nome: "Creator", desc: "Postar todo dia", preco: 39, creditos: 55, bonus: 5 },

  { id: "pro", nome: "Pro", desc: "Criador pro", preco: 69, creditos: 110, bonus: 10 },

  { id: "max", nome: "Max", desc: "Alto volume", preco: 129, creditos: 230, bonus: 30 },

];

const NICHOS_OB = ["Terror / True Crime","Gaming","Educacional","Humor","Lifestyle","Tecnologia","Fitness","Culinária","Finanças","Beleza","Música","Esportes","Empreendedorismo","Viagem","Outro"];

const PLATS_OB = ["TikTok","Instagram","YouTube","YouTube Shorts","Twitter / X","Kwai","Pinterest"];

const DIAS_OB = ["Seg","Ter","Qua","Qui","Sex","Sáb","Dom"];

const TONS_OB = ["Descontraído","Educativo","Engraçado","Motivacional","Direto","Storytelling","Polêmico","Íntimo"];

const OBJS_OB = ["Crescer seguidores","Aumentar engajamento","Monetizar","Construir autoridade","Viralizar"];

const GRUPOS = [

  { label: "Criar", itens: [

    { id:"chat",          label:"Vortex Chat",        icon:"?",  badge:true },

    { id:"roteiro",       label:"Gerar Roteiro",      icon:"??" },

    { id:"tendencias",    label:"Tendências",         icon:"??" },

    { id:"imagens",       label:"Imagens IA",         icon:"??" },

    { id:"videos",        label:"Vídeos IA",          icon:"??" },

  ]},

  { label: "Ferramentas", itens: [

    { id:"video_faceless",label:"Vídeo Faceless",     icon:"??" },

    { id:"voz",           label:"Clonar Voz",         icon:"???" },

    { id:"musica",        label:"Gerar Música",       icon:"??" },

  ]},

  { label: "Analisar", itens: [

    { id:"analise",       label:"Análise de Perfil",  icon:"??" },

    { id:"score_viral",   label:"Score Viral",        icon:"?" },

  ]},

];

const CONTA = [

  { id:"dashboard", label:"Dashboard",      icon:"?" },

  { id:"projetos",  label:"Meus Projetos",  icon:"??" },

  { id:"creditos",  label:"Créditos",       icon:"??" },

  { id:"config",    label:"Configurações",  icon:"??" },

];

const BOTTOM_NAV = [{ id:"chat",label:"Chat",icon:"?" },{ id:"roteiro",label:"Roteiro",icon:"??" },{ id:"tendencias",label:"Trends",icon:"??" },{ id:"score_viral",label:"Score",icon:"?" },{ id:"analise",label:"Análise",icon:"??" }];

const PAGE_META = {

  chat:{title:"Vortex Chat",sub:"IA conversacional"},dashboard:{title:"Dashboard",sub:"Painel principal"},

  analise:{title:"Análise de Perfil",sub:"Redes sociais"},

  analisar_video:{title:"Análise de Vídeo",sub:"Score e diagnóstico"},

  video_faceless:{title:"Vídeo Faceless",sub:"1 clique — automático"},roteiro:{title:"Gerar Roteiro",sub:"Roteiros & Hooks"},

  tendencias:{title:"Tendências Virais",sub:"2026"},imagens:{title:"Gerador de Imagens",sub:"IA Generativa"},

  videos:{title:"Gerador de Vídeos",sub:"WaveSpeed AI"},voz:{title:"Clonagem de Voz",sub:"ElevenLabs"},

  

  memoria:{title:"Memória do Vortex",sub:"Preferências"},personagens:{title:"Meus Personagens",sub:"Biblioteca"},

  projetos:{title:"Meus Projetos",sub:"Histórico"},creditos:{title:"Comprar Créditos",sub:"Planos"},

  config:{title:"Configurações",sub:"Sistema"},

};



// ==============================

const QC_NICHOS = ["Terror","Gaming","Humor","Lifestyle","Educacional","Fitness","Tecnologia","Culinária"];

const QC_FORMATOS = [

  { id:"hooks",label:"5 Hooks Virais",emoji:"??" },{ id:"roteiro-curto",label:"Roteiro 30-60s",emoji:"?" },

  { id:"roteiro-medio",label:"Roteiro 2-5min",emoji:"??" },{ id:"legenda",label:"Legenda + Hashtags",emoji:"??" },

  { id:"serie",label:"Série de 3 vídeos",emoji:"??" },

];

function QuickCreate({ onSend }) {

  const [open,setOpen]=useState(false);

  const [step,setStep]=useState(0);

  const [nicho,setNicho]=useState("");

  const [fmt,setFmt]=useState("");

  const [tema,setTema]=useState("");

  const [loading,setLoading]=useState(false);

  const [isMobile,setIsMobile]=useState(window.innerWidth<=768);

  useEffect(()=>{const fn=()=>setIsMobile(window.innerWidth<=768);window.addEventListener("resize",fn);return ()=>window.removeEventListener("resize",fn);},[]);

  const [result,setResult]=useState("");

  const [erro,setErro]=useState("");

  const reset=()=>{setStep(0);setNicho("");setFmt("");setTema("");setResult("");setErro("");};

  const close=()=>{setOpen(false);setTimeout(reset,300);};

  const gerar=useCallback(async()=>{

    setLoading(true);setStep(3);setErro("");

    try {

      const map={

        hooks:`Crie 5 hooks virais para ${nicho}${tema?` sobre "${tema}"`:""}.Para cada: texto (máx 7 palavras), emoção ativada, por que funciona.`,

        "roteiro-curto":`Crie roteiro 30-60s para ${nicho}${tema?` sobre "${tema}"`:""}.Hook(3s), desenvolvimento, CTA.`,

        "roteiro-medio":`Crie roteiro 2-5min para ${nicho}${tema?` sobre "${tema}"`:""}.Hook, blocos numerados, CTA.`,

        legenda:`Crie legenda viral para ${nicho}${tema?` sobre "${tema}"`:""}.1ª linha impactante, corpo, CTA, 15 hashtags.`,

        serie:`Crie série 3 vídeos para ${nicho}${tema?` sobre "${tema}"`:""}.Cada um: título, hook, estrutura.`,

      };

      setResult(await callClaude("Você é o Vortex, especialista em conteúdo viral. Responda em português com markdown.",map[fmt]));

      setStep(4);

    } catch(e){setErro(e.message);setStep(2);}

    finally{setLoading(false);}

  },[nicho,fmt,tema]);

  const fmtObj=QC_FORMATOS.find(f=>f.id===fmt);

  const mo={

    fab:{display:"none"},

    overlay:{position:"absolute",inset:0,zIndex:100,background:"rgba(4,3,14,.75)",backdropFilter:"blur(6px)",display:"flex",alignItems:"flex-end",justifyContent:"center",paddingBottom:"4.5rem"},

    modal:{width:"100%",maxWidth:400,background:"#121220",border:".5px solid rgba(124,92,252,.3)",borderRadius:"20px 20px 0 0",maxHeight:"78vh",overflowY:"auto"},

    hd:{display:"flex",alignItems:"center",gap:10,padding:"14px 16px 12px",borderBottom:".5px solid rgba(255,255,255,.06)"},

    hdT:{fontFamily:"'Syne',sans-serif",fontSize:14,fontWeight:700,color:"#f1eeff"},

    prog:{display:"flex",gap:5,marginLeft:"auto"},

    dot:(s)=>({width:18,height:3,borderRadius:99,background:s==="cur"?"#7c5cfc":s==="done"?"#a78bfa":"rgba(255,255,255,.1)"}),

    cls:{background:"transparent",border:"none",color:"#524d72",fontSize:13,cursor:"pointer"},

    body:{padding:16},

    lbl:{fontSize:10,fontWeight:600,color:"#524d72",textTransform:"uppercase",letterSpacing:".07em",marginBottom:10,display:"block"},

    chips:{display:"flex",flexWrap:"wrap",gap:6,marginBottom:14},

    chip:(a)=>({padding:"5px 13px",borderRadius:99,border:`.5px solid ${a?"rgba(124,92,252,.55)":"rgba(255,255,255,.1)"}`,background:a?"rgba(124,92,252,.18)":"transparent",color:a?"#c4b5fd":"#524d72",fontSize:12,fontWeight:500,cursor:"pointer"}),

    fmts:{display:"flex",flexDirection:"column",gap:5,marginBottom:14},

    fBtn:(a)=>({display:"flex",alignItems:"center",gap:10,padding:"10px 13px",borderRadius:11,border:`.5px solid ${a?"rgba(124,92,252,.5)":"rgba(255,255,255,.1)"}`,background:a?"rgba(124,92,252,.1)":"#181828",cursor:"pointer",textAlign:"left",width:"100%"}),

    fLbl:(a)=>({fontSize:13,fontWeight:500,color:a?"#f1eeff":"#9b91c4"}),

    ta:{width:"100%",background:"rgba(255,255,255,.04)",border:".5px solid rgba(255,255,255,.1)",borderRadius:11,padding:"10px 13px",color:"#f1eeff",fontFamily:"'DM Sans',sans-serif",fontSize:13,outline:"none",resize:"none",lineHeight:1.6,marginBottom:10},

    err:{background:"rgba(239,68,68,.08)",border:".5px solid rgba(239,68,68,.25)",borderRadius:8,padding:"7px 11px",fontSize:12,color:"#fca5a5",marginBottom:10},

    tags:{display:"flex",gap:6,marginBottom:12},

    tag:{fontSize:10,fontWeight:600,padding:"3px 9px",borderRadius:99,background:"rgba(124,92,252,.12)",border:".5px solid rgba(124,92,252,.28)",color:"#a78bfa"},

    btn:{width:"100%",padding:10,borderRadius:11,border:"none",background:"linear-gradient(135deg,#7c5cfc,#9d6fff)",color:"#fff",fontFamily:"'Syne',sans-serif",fontSize:13,fontWeight:700,cursor:"pointer"},

    ghost:{width:"100%",padding:10,borderRadius:11,border:".5px solid rgba(255,255,255,.1)",background:"transparent",color:"#9b91c4",fontFamily:"'Syne',sans-serif",fontSize:13,fontWeight:700,cursor:"pointer"},

    loading:{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",minHeight:190,gap:14},

    spin:{position:"relative",width:56,height:56,display:"flex",alignItems:"center",justifyContent:"center"},

    resHd:{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10},

    act:{padding:"4px 11px",borderRadius:7,border:".5px solid rgba(255,255,255,.1)",background:"#181828",color:"#9b91c4",fontSize:11,cursor:"pointer"},

    resTxt:{background:"#181828",border:".5px solid rgba(255,255,255,.06)",borderRadius:11,padding:12,fontSize:12,color:"#9b91c4",lineHeight:1.75,maxHeight:220,overflowY:"auto",whiteSpace:"pre-wrap",marginBottom:12},

  };

  return (

    <>

      <button className="chat-action-btn" onClick={()=>setOpen(true)} title="Criação Rápida">

        <span style={{fontSize:16}}>?</span><span>Criar</span>

      </button>

      {open&&(

        <div style={mo.overlay} onClick={e=>e.target===e.currentTarget&&close()}>

          <div style={mo.modal}>

            <div style={mo.hd}>

              <span style={mo.hdT}>? Criação Rápida</span>

              <div style={mo.prog}>{[0,1,2].map(i=><div key={i} style={mo.dot(step===i?"cur":step>i?"done":"")}/>)}</div>

              <button style={mo.cls} onClick={close}>?</button>

            </div>

            {step===0&&<div style={mo.body}><span style={mo.lbl}>Qual é o seu nicho?</span><div style={mo.chips}>{QC_NICHOS.map(n=><button key={n} style={mo.chip(nicho===n)} onClick={()=>setNicho(n)}>{n}</button>)}</div><button style={mo.btn} onClick={()=>setStep(1)} disabled={!nicho}>Continuar ?</button></div>}

            {step===1&&<div style={mo.body}><span style={mo.lbl}>O que criar?</span><div style={mo.fmts}>{QC_FORMATOS.map(f=><button key={f.id} style={mo.fBtn(fmt===f.id)} onClick={()=>setFmt(f.id)}><span style={{fontSize:15}}>{f.emoji}</span><span style={mo.fLbl(fmt===f.id)}>{f.label}</span></button>)}</div><div style={{display:"flex",gap:8}}><button style={mo.ghost} onClick={()=>setStep(0)}>? Voltar</button><button style={{...mo.btn,flex:1}} onClick={()=>setStep(2)} disabled={!fmt}>Continuar ?</button></div></div>}

            {step===2&&<div style={mo.body}><span style={mo.lbl}>Tema <span style={{color:"#524d72",fontWeight:400}}>(opcional)</span></span><textarea style={mo.ta} placeholder="Ex: caso real de terror..." value={tema} rows={3} onChange={e=>setTema(e.target.value)}/>{erro&&<div style={mo.err}>? {erro}</div>}<div style={mo.tags}><span style={mo.tag}>{nicho}</span><span style={mo.tag}>{fmtObj?.label}</span></div><div style={{display:"flex",gap:8}}><button style={mo.ghost} onClick={()=>setStep(1)}>? Voltar</button><button style={{...mo.btn,flex:1}} onClick={gerar}>? Gerar agora</button></div></div>}

            {step===3&&<div style={{...mo.body,...mo.loading}}><div style={mo.spin}><div className="spinner" style={{width:40,height:40,border:"2px solid rgba(124,92,252,.2)",borderTopColor:"#7c5cfc",borderRadius:"50%",animation:"spin .65s linear infinite"}}/><span style={{fontSize:20,position:"absolute"}}>?</span></div><div style={{fontFamily:"'Syne',sans-serif",fontSize:14,fontWeight:700,color:"#f1eeff"}}>Gerando com IA...</div><div style={{fontSize:11,color:"#524d72"}}>{fmtObj?.label} · {nicho}</div></div>}

            {step===4&&<div style={mo.body}><div style={mo.resHd}><span style={{color:"#34d399",fontSize:13,fontWeight:600}}>? Pronto!</span><div style={{display:"flex",gap:6}}><button style={mo.act} onClick={()=>navigator.clipboard?.writeText(result)}>?? Copiar</button><button style={mo.act} onClick={()=>{setResult("");setErro("");setStep(2);}}>?? Novo</button></div></div><div style={mo.resTxt}>{result}</div><button style={mo.btn} onClick={()=>{onSend(result);close();}}>Abrir no Chat ?</button></div>}

          </div>

        </div>

      )}

    </>

  );

}



// ==============================

const STORAGE_KEY = "vortex_sessions";

const MAX_SESSIONS = 30;

function loadSessions() { try { return JSON.parse(localStorage.getItem(STORAGE_KEY)||"[]"); } catch { return []; } }

function saveSessions(s) { try { localStorage.setItem(STORAGE_KEY,JSON.stringify(s)); } catch {} }

function newId() { return Date.now().toString(36)+Math.random().toString(36).slice(2,6); }

function sessionTitle(msgs) { const u=msgs.find(m=>m.role==="user"); if(!u) return "Nova conversa"; return u.text.slice(0,44)+(u.text.length>44?"…":""); }

function relDate(ts) { const d=(Date.now()-ts)/1000; if(d<60) return "agora"; if(d<3600) return `${Math.floor(d/60)}min`; if(d<86400) return `${Math.floor(d/3600)}h`; if(d<172800) return "ontem"; return new Date(ts).toLocaleDateString("pt-BR",{day:"2-digit",month:"short"}); }



const HS = {

  panel:{width:210,minWidth:210,maxWidth:210,height:"100%",background:"rgba(13,13,26,.98)",borderRight:".5px solid rgba(255,255,255,.06)",display:"flex",flexDirection:"column",overflow:"hidden",flexShrink:0},

  hd:{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"14px 12px 10px",borderBottom:".5px solid rgba(255,255,255,.06)",flexShrink:0},

  lbl:{fontSize:10,fontWeight:600,letterSpacing:".08em",textTransform:"uppercase",color:"#524d72"},

  newBtn:{width:24,height:24,borderRadius:7,border:".5px solid rgba(255,255,255,.1)",background:"rgba(124,92,252,.1)",color:"#a78bfa",fontSize:18,lineHeight:1,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"},

  list:{flex:1,overflowY:"auto",padding:6},

  empty:{fontSize:12,color:"#524d72",textAlign:"center",padding:"2rem 1rem"},

  item:(a)=>({display:"flex",alignItems:"center",gap:6,padding:"8px 9px",borderRadius:9,cursor:"pointer",marginBottom:2,background:a?"rgba(124,92,252,.12)":"transparent",border:a?".5px solid rgba(124,92,252,.24)":".5px solid transparent"}),

  inf:{flex:1,overflow:"hidden",minWidth:0},

  ttl:(a)=>({display:"block",fontSize:12,fontWeight:500,color:a?"#f1eeff":"#9b91c4",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}),

  meta:{display:"block",fontSize:10,color:"#524d72",marginTop:1},

  del:{background:"transparent",border:"none",color:"#524d72",fontSize:11,cursor:"pointer",padding:3,borderRadius:4},

};



function HistoryPanel({ sessions, activeId, onLoad, onNew, onDelete }) {

  return (

    <aside style={HS.panel}>

      <div style={HS.hd}>

        <span style={HS.lbl}>Histórico</span>

        <button style={HS.newBtn} onClick={onNew}>+</button>

      </div>

      <div style={HS.list}>

        {sessions.length===0&&<p style={HS.empty}>Nenhuma conversa salva</p>}

        {sessions.map(s=>(

          <div key={s.id} style={HS.item(s.id===activeId)} onClick={()=>onLoad(s.id)}>

            <div style={HS.inf}>

              <span style={HS.ttl(s.id===activeId)}>{s.title}</span>

              <span style={HS.meta}>{s.msgs} msgs · {s.date}</span>

            </div>

            <button style={HS.del} onClick={e=>{e.stopPropagation();onDelete(s.id);}}>?</button>

          </div>

        ))}

      </div>

    </aside>

  );

}



// ==============================

const INITIAL_MSGS = [{ role:"assistant", text:"Olá! Sou o **Vortex**, sua IA para criação de conteúdo viral. ??\n\nPosso te ajudar a criar roteiros, analisar perfis, encontrar tendências e muito mais.\n\nComo posso te ajudar hoje?" }];

const SUGESTOES = ["Crie um roteiro viral para TikTok sobre terror","Quais são as tendências de 2026?","Me dê 5 hooks poderosos para Reels","Analise meu nicho de gaming"];



// ==============================

function loadUserProfile() { try { return JSON.parse(localStorage.getItem("vortex_profile")||"{}"); } catch { return {}; } }

function loadUserMemory()  { try { return JSON.parse(localStorage.getItem("vortex_memory") ||"{}"); } catch { return {}; } }



function detectIntent(text) {

  const t = text.toLowerCase().trim();



  // Detectar quando usuário quer texto, não geração

  const pedindoTexto = /prompt|me d[aá] o|escreve o|qual seria|me explica|como funciona|o que e|exemplo de|do roteiro|desse roteiro/.test(t);



  // -- IMAGEM — só geração explícita ------------------------------

  const geraImagem = /^(gera|cria|faz|make|gerar|criar)\s+(uma?\s+)?(imagem|foto|thumbnail|capa|arte|ilustra|desenho)/i.test(t) ||

                     /^(imagem|foto|thumbnail)\s+(de|do|da|para|com)/i.test(t);

  if(geraImagem && !pedindoTexto) return "image";



  // -- VÍDEO + VOZ — combina os dois ------------------------------

  const temVideo = /(vídeo|video|clipe|clip|reels?|short|animação)/.test(t);

  const temVoz   = /(fala|narr|voz|voice|dizendo|falando|personagem|dubla)/.test(t);

  if(temVideo && temVoz && !pedindoTexto) return "video_voice";



  // -- VÍDEO simples -----------------------------------------------

  const geraVideo = /^(gera|cria|faz|gerar|criar)\s+(um?\s+)?(vídeo|video|clipe|reel|short)/i.test(t) ||

                    /(gera|cria)\s+.*?(vídeo|video)/i.test(t);

  if(geraVideo && !pedindoTexto) return "video";



  // -- VOZ/ÁUDIO — narração explícita -----------------------------

  const geraVoz = /^(narra|narrar|lê|leia|fala|dubla)\s+/i.test(t) ||

                  /(narr(a|ar|ação)|dubla(gem|r)|leitura em voz|gera (o )?áudio|tts|text.to.speech)/.test(t);

  if(geraVoz && !pedindoTexto) return "voice";



  return "chat";

}



// Detecta o texto que deve ser narrado (para ElevenLabs)

function extractTextToNarrate(userRequest, history) {

  // Se o usuário pediu pra narrar algo da conversa anterior

  const ref = /(narra|lê|leia|fala|dubla|voice).*(isso|esse|esse roteiro|esse texto|o roteiro|acima|anterior)/i;

  if (ref.test(userRequest)) {

    // Pega o último texto do assistente

    const last = [...history].reverse().find(m => m.role === "assistant");

    return last ? last.text.replace(/[*#_`]/g,"").trim() : userRequest;

  }

  // Remove o comando e deixa só o texto

  return userRequest

    .replace(/^(narra|leia|fala|dubla|voice|narrar|ler|falar)\s*(isso|esse texto|o texto|em voz alta)?\s*/i,"")

    .trim() || userRequest;

}



// Detecta configurações de voz do pedido

function extractVoiceConfig(userRequest) {

  const t = userRequest.toLowerCase();

  const config = { voice_id: "pNInz6obpgDQGcFmaJgB", stability: 0.5, similarity: 0.75 }; // padrão Adam

  if (/(feminina|mulher|female|garota)/.test(t))  config.voice_id = "EXAVITQu4vr4xnSDxMaL"; // Sarah

  if (/(grave|masculina|homem|male|deep)/.test(t)) config.voice_id = "pNInz6obpgDQGcFmaJgB"; // Adam

  if (/(animado|energético|hype|animada)/.test(t)) { config.stability = 0.3; config.similarity = 0.8; }

  if (/(calmo|suave|devagar|pausado)/.test(t))     { config.stability = 0.8; config.similarity = 0.6; }

  return config;

}



function buildImagePrompt(req, profile, memory) {

  const nicho  = profile.nicho || memory.nicho || "content creation";

  const plat   = (profile.plataformas||[])[0] || "TikTok";

  const estilo = memory.estilo_visual || "";

  const ratio  = plat==="YouTube" ? "16:9" : plat==="Instagram" ? "1:1" : "9:16";

  return [req, nicho+" style", plat+" "+ratio, "cinematic lighting", "high quality", "vibrant", "4K", estilo]

    .filter(Boolean).join(", ");

}



function buildVideoPrompt(req, profile, memory) {

  const nicho = profile.nicho || memory.nicho || "digital content";

  const plat  = (profile.plataformas||[])[0] || "TikTok";

  return [req, nicho, plat+" short video", "smooth motion", "cinematic", "trending aesthetic"]

    .filter(Boolean).join(", ");

}



function buildChatSystem(profile, memory, history, modo) {

  const nicho    = profile.nicho    || memory.nicho    || "";

  const plats    = (profile.plataformas||[]).join(", ") || profile.plataforma || "TikTok";

  const tom      = profile.tom_de_voz || memory.tom    || "direto";

  const publico  = profile.publico_alvo || memory.publico || "";

  const nome     = profile.nome || "";

  const link     = profile.link || "";

  const idioma   = profile.idioma || "Português";



  // Memória do usuário — estilo, evitar, CTA, referências

  const estiloEscrita   = memory.estilo_escrita    || "";

  const publicoAlvo     = memory.publico_alvo      || publico;

  const formatosFav     = memory.formatos_favoritos|| "";

  const evitar          = memory.evitar            || "";

  const ctaFavorito     = memory.cta_favorito      || "";

  const referencias     = memory.referencias       || "";



  // Histórico recente para contexto

  const recentMsgs = history.slice(-8)

    .filter(m=>m.role==="user")

    .map(m=>(m.content||m.text||"").slice(0,80))

    .filter(Boolean)

    .join(" | ");



  // -- MODO ASSISTENTE — IA geral, completa, sem restrição de tema --

  if(modo === "assistente") {

    const lines = [

      "Você é o VORTEX AI — inteligência artificial completa, equivalente ao Claude, Gemini e ChatGPT.",

      "",

      "CAPACIDADES TOTAIS:",

      "Responda qualquer pergunta de qualquer área: tecnologia, ciência, história, filosofia, negócios,",

      "medicina, direito, matemática, programação, criatividade, produtividade, idiomas e muito mais.",

      "",

      "PERSONALIDADE:",

      "- Direto e inteligente — sem enrolação, sem robótica",

      "- Honesto — se não souber, diz claramente em vez de inventar",

      "- Tom adaptável — técnico quando necessário, descontraído quando o usuário quer",

      "- Contextual — mantém coerência com o que foi dito na conversa",

      "",

      "REGRAS CRÍTICAS:",

      "- NUNCA invente dados, estatísticas ou fatos",

      "- NUNCA diga que é Claude, Gemini, GPT — você é o VORTEX",

      "- Quando perguntarem sobre VOCÊ (suas capacidades) ? responda sobre VOCÊ",

      "- Responda SEMPRE em " + idioma,

    ];

    if(nome) lines.push("- Usuário: " + nome);

    if(nicho) lines.push("- Contexto do usuário: criador de conteúdo de " + nicho);

    if(recentMsgs) lines.push("- Contexto da conversa: " + recentMsgs);

    return lines.filter(Boolean).join("\n");



  }



  // -- MODO CRIADOR — especialista em conteúdo viral --------------

  const lines = [

    "Você é o VORTEX AI — o assistente de criação de conteúdo viral mais inteligente do Brasil.",

    "Você entende algoritmos, tendências, psicologia do scroll e o mercado brasileiro profundamente.",

    "",

  ];



  // Perfil do criador

  if(nome || nicho || plats) {

    lines.push("PERFIL DO CRIADOR:");

    if(nome)   lines.push("- Nome: " + nome);

    if(nicho)  lines.push("- Nicho: " + nicho);

    if(plats)  lines.push("- Plataformas: " + plats);

    if(tom)    lines.push("- Tom de voz: " + tom);

    if(publicoAlvo) lines.push("- Público-alvo: " + publicoAlvo);

    if(link)   lines.push("- Perfil: " + link);

    lines.push("");

  }



  // Memória personalizada

  const memoriaItems = [

    estiloEscrita   && "- Estilo de escrita: " + estiloEscrita,

    formatosFav     && "- Formatos favoritos: " + formatosFav,

    evitar          && "- EVITAR: " + evitar,

    ctaFavorito     && "- CTA favorito: " + ctaFavorito,

    referencias     && "- Referências/inspirações: " + referencias,

  ].filter(Boolean);



  if(memoriaItems.length > 0) {

    lines.push("MEMÓRIA DO CRIADOR (use sempre):");

    lines.push(...memoriaItems);

    lines.push("");

  }



  lines.push(

    "ESPECIALIDADES:",

    "- Hooks virais que param o scroll em 2 segundos",

    "- Tendências em tempo real por nicho e plataforma",

    "- Estratégias de crescimento por algoritmo (TikTok, Reels, Shorts)",

    "- Copywriting que converte — gatilhos emocionais precisos",

    "- Análise de métricas e diagnóstico de perfis",

    "",

    "REGRAS:",

    "- Personalize TUDO ao perfil do criador acima",

    "- Responda em " + idioma + " natural — sem robótica",

    "- NUNCA começa com 'Certamente!', 'Claro!', 'Ótima pergunta!'",

    "- Para roteiro completo ? manda para a aba Roteiro",

    "- NUNCA diga que é Claude, Gemini, GPT — você é o VORTEX",

  );



  if(recentMsgs) lines.push("- Contexto recente: " + recentMsgs);



  return lines.filter(Boolean).join("\n");



}





async function vortexRouter(userText, profile, memory, history, historicoBackend=[]) {

  const intent     = detectIntent(userText);

  const personagem = getPersonagemAtivo();

  const mudancas   = extractMudancas(userText);



  if (intent === "image") {

    const base   = buildImagePrompt(userText, profile, memory);

    const prompt = personagem ? buildPersonagemPrompt(base, personagem, mudancas) : base;

    return { type:"image", prompt };

  }



  if (intent === "video") {

    const base        = buildVideoPrompt(userText, profile, memory);

    const prompt      = personagem ? buildPersonagemPrompt(base, personagem, mudancas) : base;

    const voiceConfig = personagem ? { voice_id: personagem.voice_id } : {};

    return { type:"video", prompt, voiceConfig };

  }



  if (intent === "voice") {

    const text        = extractTextToNarrate(userText, history);

    const voiceConfig = personagem ? { voice_id: personagem.voice_id } : extractVoiceConfig(userText);

    return { type:"voice", text, config: voiceConfig };

  }



  if (intent === "video_voice") {

    const videoPrompt = buildVideoPrompt(userText, profile, memory);

    const voiceText   = extractTextToNarrate(userText, history);

    const voiceConfig = personagem ? { voice_id: personagem.voice_id } : extractVoiceConfig(userText);

    return { type:"video_voice", videoPrompt, voiceText, voiceConfig };

  }



  // Chat — monta histórico e system prompt sem template literals complexos

  const personagemCtx = personagem

    ? "\n\nPERSONAGEM ATIVO: " + personagem.nome + " — " + (personagem.personalidade||"") + " — voz: " + personagem.voice_nome

    : "";

  const modoAtual = window.__vortexModo || "criador";

  const system = buildChatSystem(profile, memory, history, modoAtual) + personagemCtx;



  // Envia só a mensagem atual — histórico vai separado

  const response = await callClaude(system, userText, historicoBackend || []);

  return { type:"chat", response };

}



async function generateImage(prompt, modelo="pollinations", modeloObj=null) {

  let res;

  const BASE = BACKEND;

  

  // Se for modelo AIML — usa endpoint dedicado

  if(modeloObj?.aiml || modelo.startsWith("aiml_")) {

    const aimlModelo = modeloObj?.endpoint==="aiml_flux"?"flux/schnell":

                       modeloObj?.endpoint==="aiml_flux_dev"?"flux/dev":

                       modeloObj?.endpoint==="aiml_gpt"?"gpt-image-1":"flux/schnell";

    try {

      res = await fetch(`${BASE}/aiml/gerar-imagem`, {

        method:"POST", headers:{"Content-Type":"application/json"},

        body: JSON.stringify({prompt, modelo: aimlModelo}),

      });

    } catch { throw new Error("?? Backend offline"); }

    if(!res.ok){const e=await res.json().catch(()=>({}));throw new Error(e?.detail||`HTTP ${res.status}`);}

    const d = await res.json();

    return d.url;

  }

  

  // Modelo padrão — endpoint free

  try {

    res = await fetch(`${BASE}/gerar-imagem-free`, {

      method:"POST", headers:{"Content-Type":"application/json"},

      body: JSON.stringify({prompt, modelo}),

    });

  } catch { throw new Error("?? Backend offline — inicie o servidor Python"); }

  if(!res.ok){const e=await res.json().catch(()=>({}));throw new Error(e?.detail||`HTTP ${res.status}`);}

  const d = await res.json();

  return d.imagem || d.url;

}



async function aimlTTS(texto, voz="nova") {

  try {

    const res = await fetch(`${BACKEND}/aiml/tts`, {

      method:"POST", headers:{"Content-Type":"application/json"},

      body: JSON.stringify({texto: texto.slice(0,4000), voz}),

    });

    if(!res.ok) throw new Error(`HTTP ${res.status}`);

    const d = await res.json();

    return d.audio_url;

  } catch(e) {

    throw new Error("TTS AIML falhou: " + e.message);

  }

}



async function generateVideo(prompt, duracao=5) {

  let res;

  try {

    res = await fetch(`${BACKEND}/gerar-video`, {

      method:"POST",

      headers:{"Content-Type":"application/json"},

      body: JSON.stringify({ prompt, duracao, resolucao:"720p", ratio:"9:16" }),

    });

  } catch { throw new Error("?? Backend offline — inicie o servidor Python"); }

  if (!res.ok) { const e = await res.json().catch(()=>({})); throw new Error(e?.detail || `HTTP ${res.status}`); }

  const d = await res.json();

  return d.video_url;

}



async function generateVoice(text, config={}) {

  const voiceId = config.voice_id || "pNInz6obpgDQGcFmaJgB";

  let res;

  try {

    res = await fetch(`${BACKEND}/gerar-voz`, {

      method:"POST",

      headers:{"Content-Type":"application/json"},

      body: JSON.stringify({ texto: text.slice(0,2500), voz_id: voiceId }),

    });

  } catch { throw new Error("?? Backend offline — inicie o servidor Python"); }

  if (!res.ok) { const e = await res.json().catch(()=>({})); throw new Error(e?.detail || `HTTP ${res.status}`); }

  const d = await res.json();

  const base64 = d.audio_url.split(",")[1];

  const blob = new Blob([Uint8Array.from(atob(base64), c=>c.charCodeAt(0))], {type:"audio/mpeg"});

  return URL.createObjectURL(blob);

}



// ==============================

const VOZES_PRONTAS = [

  { id:"pNInz6obpgDQGcFmaJgB", nome:"Adam",    desc:"Masculina grave, narração",  emoji:"???" },

  { id:"EXAVITQu4vr4xnSDxMaL", nome:"Sarah",   desc:"Feminina suave, conversa",   emoji:"??" },

  { id:"TX3LPaxmHKxFdv7VOQHJ", nome:"Liam",    desc:"Masculina jovem, energético", emoji:"?" },

  { id:"XB0fDUnXU5powFXDhCwa", nome:"Charlotte",desc:"Feminina forte, impactante", emoji:"??" },

  { id:"onwK4e9ZLuTAKqWW03F9", nome:"Daniel",  desc:"Masculina profissional",     emoji:"??" },

  { id:"MF3mGyEYCl7XYWbV9V6O", nome:"Elli",    desc:"Feminina animada, jovem",    emoji:"?" },

];



function loadPersonagens() {

  try { return JSON.parse(localStorage.getItem("vortex_personagens")||"[]"); } catch { return []; }

}

function savePersonagens(list) {

  try { localStorage.setItem("vortex_personagens", JSON.stringify(list)); } catch {}

}

function getPersonagemAtivo() {

  try { return JSON.parse(localStorage.getItem("vortex_personagem_ativo")||"null"); } catch { return null; }

}

function setPersonagemAtivo(p) {

  try { localStorage.setItem("vortex_personagem_ativo", JSON.stringify(p)); } catch {}

}



// Monta o prompt de imagem/vídeo com consistência de personagem

function buildPersonagemPrompt(basePrompt, personagem, mudancas={}) {

  if (!personagem) return basePrompt;

  const aparencia = personagem.aparencia || "";

  const cenario   = mudancas.cenario   || personagem.cenario_padrao  || "";

  const roupa     = mudancas.roupa     || personagem.roupa_padrao    || "";

  const expressao = mudancas.expressao || personagem.expressao_padrao|| "neutro";

  const pose      = mudancas.pose      || personagem.pose_padrao     || "";



  const parts = [

    aparencia,

    basePrompt,

    cenario   ? "scene: "+cenario       : "",

    roupa     ? "outfit: "+roupa        : "",

    expressao ? "expression: "+expressao: "",

    pose      ? "pose: "+pose           : "",

    "consistent character design, same face features, same style",

    "high quality, cinematic lighting, professional content creation",

  ].filter(Boolean).join(", ");



  return parts;

}



// Detecta mudanças pedidas pelo usuário em novo vídeo

function extractMudancas(userText) {

  const t = userText.toLowerCase();

  const mudancas = {};

  if (t.includes("cenario") || t.includes("cenário")) {

    const m = t.match(/cen.rio\s+(?:de\s+)?([^,.]+)/);

    if (m) mudancas.cenario = m[1].trim();

  }

  if (t.includes("roupa")) {

    const m = t.match(/roupa\s+(?:de\s+)?([^,.]+)/);

    if (m) mudancas.roupa = m[1].trim();

  }

  if (t.includes("pose")) {

    const m = t.match(/pose\s+(?:de\s+)?([^,.]+)/);

    if (m) mudancas.pose = m[1].trim();

  }

  const exprs = ["sorrindo","sério","triste","animado","com raiva","surpreso","feliz"];

  const expr = exprs.find(e => t.includes(e));

  if (expr) mudancas.expressao = expr;

  if (t.includes("praia"))    mudancas.cenario = "beach, tropical, sunny";

  if (t.includes("cidade"))   mudancas.cenario = "urban cityscape, neon lights";

  if (t.includes("floresta")) mudancas.cenario = "forest, nature, trees";

  if (t.includes("estúdio"))  mudancas.cenario = "studio, clean background";

  if (t.includes("noite"))    mudancas.cenario = (mudancas.cenario||"") + " night time";

  return mudancas;

}



// Modal de criação/edição de personagem

function ModalPersonagem({ personagem, onSave, onClose }) {

  const [dados, setDados] = useState(personagem || {

    nome:"", aparencia:"", personalidade:"", cenario_padrao:"",

    roupa_padrao:"", expressao_padrao:"neutro", pose_padrao:"",

    voice_id:"pNInz6obpgDQGcFmaJgB", voice_clonada:false,

    voice_nome:"Adam", tom_fala:""

  });

  const [tab, setTab] = useState("aparencia");

  const set = (k,v) => setDados(d=>({...d,[k]:v}));



  return (

    <div style={{position:"fixed",inset:0,zIndex:500,background:"rgba(4,3,14,.85)",backdropFilter:"blur(8px)",display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>

      <div style={{width:"100%",maxWidth:520,background:"var(--bg3)",border:".5px solid rgba(123,47,255,.3)",borderRadius:"var(--r-xl)",maxHeight:"90vh",overflow:"hidden",display:"flex",flexDirection:"column"}}>



        {/* Header */}

        <div style={{padding:"1.25rem 1.5rem",borderBottom:".5px solid var(--border)",display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0}}>

          <div style={{fontFamily:"var(--fh)",fontSize:16,fontWeight:800,color:"var(--text)"}}>

            {personagem ? "?? Editar Personagem" : "?? Criar Personagem"}

          </div>

          <button onClick={onClose} style={{background:"transparent",border:"none",color:"var(--text3)",fontSize:16,cursor:"pointer"}}>?</button>

        </div>



        {/* Tabs */}

        <div style={{display:"flex",gap:4,padding:"12px 16px 0",flexShrink:0}}>

          {[["aparencia","?? Aparência"],["voz","??? Voz"],["padrao","?? Padrões"]].map(([t,l])=>(

            <button key={t} onClick={()=>setTab(t)}

              style={{padding:"6px 14px",borderRadius:99,border:`.5px solid ${tab===t?"rgba(123,47,255,.5)":"var(--border2)"}`,background:tab===t?"rgba(123,47,255,.15)":"transparent",color:tab===t?"var(--purple2)":"var(--text3)",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"var(--fh)"}}>

              {l}

            </button>

          ))}

        </div>



        {/* Body */}

        <div style={{flex:1,overflowY:"auto",padding:"1.25rem 1.5rem"}}>

          {tab==="aparencia" && (

            <>

              <div className="field">

                <label className="label">Nome do personagem</label>

                <input className="input" placeholder="Ex: Crispinho" value={dados.nome} onChange={e=>set("nome",e.target.value)}/>

              </div>

              <div className="field">

                <label className="label">Descrição visual (aparência física)</label>

                <textarea className="input" rows={4}

                  placeholder="Ex: homem jovem, 25 anos, cabelo preto curto, olhos castanhos, pele morena, expressão séria, estilo urbano..."

                  value={dados.aparencia} onChange={e=>set("aparencia",e.target.value)}/>

                <div style={{fontSize:10,color:"var(--text3)",marginTop:4}}>Quanto mais detalhado, mais consistente o personagem vai ficar entre os vídeos</div>

              </div>

              <div className="field">

                <label className="label">Personalidade / Jeito de falar</label>

                <textarea className="input" rows={2}

                  placeholder="Ex: engraçado, direto, gírias cariocas, sempre animado..."

                  value={dados.personalidade} onChange={e=>set("personalidade",e.target.value)}/>

              </div>

            </>

          )}



          {tab==="voz" && (

            <>

              <div className="field">

                <label className="label">Vozes prontas</label>

                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6,marginBottom:12}}>

                  {VOZES_PRONTAS.map(v=>(

                    <button key={v.id} onClick={()=>{set("voice_id",v.id);set("voice_nome",v.nome);set("voice_clonada",false);}}

                      style={{padding:"10px 12px",borderRadius:10,border:`.5px solid ${dados.voice_id===v.id?"rgba(123,47,255,.5)":"var(--border2)"}`,background:dados.voice_id===v.id?"rgba(123,47,255,.12)":"var(--bg4)",cursor:"pointer",textAlign:"left"}}>

                      <div style={{fontSize:14}}>{v.emoji}</div>

                      <div style={{fontSize:12,fontWeight:600,color:"var(--text)",marginTop:2}}>{v.nome}</div>

                      <div style={{fontSize:10,color:"var(--text3)"}}>{v.desc}</div>

                    </button>

                  ))}

                </div>

              </div>

              <div style={{background:"rgba(123,47,255,.06)",border:".5px solid rgba(123,47,255,.2)",borderRadius:10,padding:"12px 14px"}}>

                <div style={{fontSize:12,fontWeight:600,color:"var(--purple2)",marginBottom:4}}>?? Clonar sua voz (ElevenLabs)</div>

                <div style={{fontSize:11,color:"var(--text3)",marginBottom:8}}>Grave 30 segundos da sua voz ou do personagem. O Vortex clona e usa sempre que gerar conteúdo.</div>

                <button className="btn btn-sm btn-ghost" onClick={()=>alert("Integre com ElevenLabs Voice Cloning API")}>

                  ??? Fazer upload de áudio para clonar

                </button>

              </div>

              <div className="field" style={{marginTop:12}}>

                <label className="label">Tom de fala / instruções</label>

                <input className="input" placeholder="Ex: fala devagar, sempre com humor, sotaque carioca..."

                  value={dados.tom_fala} onChange={e=>set("tom_fala",e.target.value)}/>

              </div>

            </>

          )}



          {tab==="padrao" && (

            <>

              <div className="field">

                <label className="label">Cenário padrão</label>

                <input className="input" placeholder="Ex: estúdio moderno, fundo preto com neon roxo..."

                  value={dados.cenario_padrao} onChange={e=>set("cenario_padrao",e.target.value)}/>

              </div>

              <div className="field">

                <label className="label">Roupa padrão</label>

                <input className="input" placeholder="Ex: camiseta preta, boné, corrente dourada..."

                  value={dados.roupa_padrao} onChange={e=>set("roupa_padrao",e.target.value)}/>

              </div>

              <div className="field">

                <label className="label">Expressão padrão</label>

                <div className="chips">

                  {["neutro","sorrindo","sério","animado","confiante"].map(ex=>(

                    <button key={ex} className={`chip ${dados.expressao_padrao===ex?"active":""}`}

                      onClick={()=>set("expressao_padrao",ex)}>{ex}</button>

                  ))}

                </div>

              </div>

              <div className="field">

                <label className="label">Pose padrão</label>

                <input className="input" placeholder="Ex: de frente, olhando para câmera, braços cruzados..."

                  value={dados.pose_padrao} onChange={e=>set("pose_padrao",e.target.value)}/>

              </div>

            </>

          )}

        </div>



        {/* Footer */}

        <div style={{padding:"1rem 1.5rem",borderTop:".5px solid var(--border)",display:"flex",gap:8,flexShrink:0}}>

          <button className="btn btn-ghost" style={{flex:1}} onClick={onClose}>Cancelar</button>

          <button className="btn" style={{flex:2}} onClick={()=>onSave({...dados,id:dados.id||Date.now().toString(36)})}>

            ?? {personagem?"Salvar alterações":"Criar personagem"}

          </button>

        </div>

      </div>

    </div>

  );

}



// Componente da página de personagens

function MeusPersonagens() {

  const [personagens,setPersonagens] = useState(()=>loadPersonagens());

  const [showModal,setShowModal]     = useState(false);

  const [editando,setEditando]       = useState(null);

  const ativo = getPersonagemAtivo();



  const salvar = (p) => {

    const lista = personagens.find(x=>x.id===p.id)

      ? personagens.map(x=>x.id===p.id?p:x)

      : [...personagens,p];

    setPersonagens(lista);

    savePersonagens(lista);

    setShowModal(false);

    setEditando(null);

  };



  const deletar = (id) => {

    const lista = personagens.filter(p=>p.id!==id);

    setPersonagens(lista);

    savePersonagens(lista);

  };



  const ativar = (p) => { setPersonagemAtivo(p); window.location.reload(); };



  return (

    <div className="page">

      <div className="page-header">

        <div className="eyebrow"><div className="eyebrow-dot"/>biblioteca</div>

        <h1 className="page-title">Meus <em>Personagens</em></h1>

        <p className="page-sub">Crie personagens consistentes para seus vídeos e conteúdos.</p>

      </div>



      {ativo && (

        <div style={{background:"rgba(123,47,255,.08)",border:".5px solid rgba(123,47,255,.3)",borderRadius:"var(--r-lg)",padding:"12px 16px",marginBottom:"1.25rem",display:"flex",alignItems:"center",gap:12}}>

          <span style={{fontSize:20}}>??</span>

          <div style={{flex:1}}>

            <div style={{fontSize:13,fontWeight:600,color:"var(--purple2)"}}>Personagem ativo: {ativo.nome}</div>

            <div style={{fontSize:11,color:"var(--text3)"}}>Voz: {ativo.voice_nome} · Todos os vídeos usarão este personagem</div>

          </div>

          <button className="btn btn-ghost btn-sm" onClick={()=>setPersonagemAtivo(null)}>Desativar</button>

        </div>

      )}



      <button className="btn btn-full" style={{marginBottom:"1.25rem"}} onClick={()=>{setEditando(null);setShowModal(true);}}>

        + Criar novo personagem

      </button>



      {personagens.length===0 && (

        <div className="card" style={{textAlign:"center",padding:"3rem 1.5rem"}}>

          <div style={{fontSize:48,marginBottom:12}}>??</div>

          <p style={{fontSize:14,color:"var(--text2)"}}>Nenhum personagem ainda. Crie o primeiro!</p>

        </div>

      )}



      {personagens.map(p=>(

        <div key={p.id} className="card" style={{display:"flex",alignItems:"flex-start",gap:14,background:ativo?.id===p.id?"rgba(123,47,255,.06)":"var(--bg3)",border:ativo?.id===p.id?"1px solid rgba(123,47,255,.3)":".5px solid var(--border)"}}>

          <div style={{width:44,height:44,borderRadius:12,background:"linear-gradient(135deg,rgba(123,47,255,.4),rgba(244,114,182,.3))",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,flexShrink:0}}>??</div>

          <div style={{flex:1}}>

            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>

              <div style={{fontFamily:"var(--fh)",fontWeight:700,fontSize:"1rem"}}>{p.nome||"Sem nome"}</div>

              {ativo?.id===p.id && <span style={{fontSize:9,fontWeight:700,background:"var(--purple)",color:"#fff",padding:"2px 7px",borderRadius:99}}>ATIVO</span>}

            </div>

            <div style={{fontSize:12,color:"var(--text3)",marginBottom:4}}>

              ??? {p.voice_nome} {p.voice_clonada?"(clonada)":""}

              {p.cenario_padrao&&` · ?? ${p.cenario_padrao.slice(0,30)}`}

            </div>

            {p.aparencia&&<div style={{fontSize:12,color:"var(--text2)",lineHeight:1.5}}>{p.aparencia.slice(0,100)}...</div>}

          </div>

          <div style={{display:"flex",gap:6,flexShrink:0}}>

            {ativo?.id!==p.id && <button className="btn btn-ghost btn-sm" onClick={()=>ativar(p)}>Ativar</button>}

            <button className="btn btn-ghost btn-sm" onClick={()=>{setEditando(p);setShowModal(true);}}>??</button>

            <button className="btn btn-ghost btn-sm" style={{color:"#f87171"}} onClick={()=>deletar(p.id)}>?</button>

          </div>

        </div>

      ))}



      {showModal && <ModalPersonagem personagem={editando} onSave={salvar} onClose={()=>{setShowModal(false);setEditando(null);}}/>}

    </div>

  );

}



// ==============================



const ESTILOS_EDICAO = [

  { id:"viral_tiktok",   nome:"?? Viral TikTok",    desc:"Legendas palavra a palavra, cortes rápidos, zoom",     cor:"#f472b6" },

  { id:"cinematografico",nome:"?? Cinematográfico",  desc:"Cortes suaves, texto elegante, color grade escuro",    cor:"#a78bfa" },

  { id:"educacional",    nome:"?? Educacional",      desc:"Legendas limpas, destaques em palavras-chave",         cor:"#22d3ee" },

  { id:"terror",         nome:"?? Terror/Suspense",  desc:"Glitch, ruído, texto tremendo, cortes abruptos",       cor:"#ef4444" },

  { id:"humor",          nome:"?? Humor/Meme",       desc:"Texto grande colorido, emojis animados",               cor:"#fbbf24" },

  { id:"profissional",   nome:"?? Profissional",     desc:"Logo, legenda formal, intros animados",                cor:"#34d399" },

];



function getShotstackKey() {

  return "backend"; // chave gerenciada pelo backend Python

}



function getShotstackEnv() {

  return "stage";

}



// Transcrição via AssemblyAI (ou fallback mock para dev)

async function transcribeVideo(videoUrl) {

  // Mock words — em produção o backend chama AssemblyAI

  try {

    const res = await fetch(`${BACKEND}/transcrever`, {

      method:"POST",

      headers:{"Content-Type":"application/json"},

      body: JSON.stringify({ video_url: videoUrl }),

    });

    if (res.ok) {

      const d = await res.json();

      return d.words || [];

    }

  } catch {}

  // Fallback mock se backend não tiver endpoint de transcrição ainda

  return [

    { text:"Olá pessoal,",     start:0,    end:800  },

    { text:"hoje vou mostrar", start:900,  end:1800 },

    { text:"algo incrível",    start:1900, end:2700 },

    { text:"que vai mudar",    start:2800, end:3600 },

    { text:"seu conteúdo!",    start:3700, end:4500 },

  ];

}



// Monta o JSON do Shotstack baseado no estilo

function buildShotstackTimeline(videoUrl, words, estilo, duracao) {

  const dur = Math.max(1, parseFloat(duracao) || 10);



  // Timeline minimo valido para Shotstack

  return {

    timeline: {

      tracks: [

        {

          clips: [

            {

              asset: {

                type: "video",

                src: videoUrl,

                trim: 0,

                volume: 1

              },

              start: 0,

              length: dur

            }

          ]

        }

      ]

    },

    output: {

      format: "mp4",

      resolution: "sd"

    }

  };

}



// Envia para Shotstack e aguarda

async function renderWithShotstack(timeline) {

  // Usa backend Python que tem as keys seguras

  let res;

  try {

    res = await fetch(`${BACKEND}/editar-video`, {

      method:"POST",

      headers:{"Content-Type":"application/json"},

      body: JSON.stringify(timeline),

    });

  } catch {

    throw new Error("Backend offline — inicie o servidor Python");

  }

  if (!res.ok) { const e = await res.json().catch(()=>({})); throw new Error(e?.detail || `HTTP ${res.status}`); }

  const d = await res.json();

  return d.video_url;

}



// Componente de edição de vídeo

function VideoEditor({ onClose, onResult }) {

  const [step,    setStep]    = useState(0); // 0=upload 1=estilo 2=processando 3=pronto

  const [file,    setFile]    = useState(null);

  const [fileUrl, setFileUrl] = useState("");

  const [estilo,  setEstilo]  = useState("viral_tiktok");

  const [progMsg, setProgMsg] = useState("");

  const [result,  setResult]  = useState("");

  const [erro,    setErro]    = useState("");

  const inputRef = useRef(null);



  const handleFile = (f) => {

    if (!f) return;

    setFile(f);

    setFileUrl(URL.createObjectURL(f));

    setStep(1);

  };



  const processar = async () => {

    setStep(2); setErro("");

    try {

      setProgMsg("?? Enviando vídeo para o servidor...");

      

      // Faz upload do arquivo para o backend Python

      const formData = new FormData();

      formData.append("video", file);

      

      let uploadRes;

      try {

        uploadRes = await fetch(`${BACKEND}/upload-video`, {

          method: "POST",

          body: formData,

        });

      } catch {

        throw new Error("Backend offline — inicie o servidor Python");

      }

      

      if (!uploadRes.ok) throw new Error("Falha no upload do vídeo");

      const uploadData = await uploadRes.json();

      const videoUrl = uploadData.url; // URL pública retornada pelo backend



      setProgMsg("?? Preparando edição...");

      const words = []; // transcrição opcional



      setProgMsg("?? Montando timeline de edição...");

      const duracao = uploadData.duracao || 30;

      const timeline = buildShotstackTimeline(videoUrl, words, estilo, duracao);



      setProgMsg("?? Renderizando com Shotstack... (pode levar 2-3 min)");

      const url = await renderWithShotstack(timeline);



      setResult(url);

      setStep(3);

    } catch(e) {

      setErro(e.message);

      setStep(1);

    }

  };



  return (

    <div style={{position:"fixed",inset:0,zIndex:500,background:"rgba(4,3,14,.85)",backdropFilter:"blur(8px)",display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>

      <div style={{width:"100%",maxWidth:520,background:"var(--bg3)",border:".5px solid rgba(123,47,255,.3)",borderRadius:"var(--r-xl)",maxHeight:"90vh",overflow:"hidden",display:"flex",flexDirection:"column"}}>



        {/* Header */}

        <div style={{padding:"1.25rem 1.5rem",borderBottom:".5px solid var(--border)",display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0}}>

          <div style={{fontFamily:"var(--fh)",fontSize:16,fontWeight:800}}>?? Editar Vídeo</div>

          <button onClick={onClose} style={{background:"transparent",border:"none",color:"var(--text3)",fontSize:16,cursor:"pointer"}}>?</button>

        </div>



        <div style={{flex:1,overflowY:"auto",padding:"1.25rem 1.5rem"}}>



          {/* STEP 0: Upload */}

          {step===0 && (

            <>

              <div

                onClick={()=>inputRef.current?.click()}

                onDragOver={e=>e.preventDefault()}

                onDrop={e=>{e.preventDefault();handleFile(e.dataTransfer.files[0]);}}

                style={{border:"2px dashed rgba(123,47,255,.4)",borderRadius:14,padding:"2.5rem",textAlign:"center",cursor:"pointer",transition:"border-color .2s",background:"rgba(123,47,255,.03)"}}>

                <div style={{fontSize:40,marginBottom:12}}>??</div>

                <div style={{fontFamily:"var(--fh)",fontSize:14,fontWeight:700,color:"var(--text)",marginBottom:6}}>Arraste o vídeo aqui</div>

                <div style={{fontSize:12,color:"var(--text3)"}}>ou clique para selecionar · MP4, MOV, AVI</div>

              </div>

              <input ref={inputRef} type="file" accept="video/*" style={{display:"none"}} onChange={e=>handleFile(e.target.files[0])}/>

            </>

          )}



          {/* STEP 1: Escolher estilo */}

          {step===1 && (

            <>

              {fileUrl && <video src={fileUrl} controls style={{width:"100%",borderRadius:12,marginBottom:14,maxHeight:200,objectFit:"contain",background:"#000"}}/>}

              <div className="field">

                <label className="label">Escolha o estilo de edição</label>

                <div style={{display:"flex",flexDirection:"column",gap:6}}>

                  {ESTILOS_EDICAO.map(e=>(

                    <button key={e.id} onClick={()=>setEstilo(e.id)}

                      style={{display:"flex",alignItems:"center",gap:10,padding:"10px 14px",borderRadius:12,border:`.5px solid ${estilo===e.id?e.cor:"var(--border2)"}`,background:estilo===e.id?`${e.cor}18`:"var(--bg4)",cursor:"pointer",textAlign:"left"}}>

                      <div style={{flex:1}}>

                        <div style={{fontSize:13,fontWeight:600,color:"var(--text)"}}>{e.nome}</div>

                        <div style={{fontSize:11,color:"var(--text3)"}}>{e.desc}</div>

                      </div>

                      {estilo===e.id && <div style={{width:8,height:8,borderRadius:"50%",background:e.cor}}/>}

                    </button>

                  ))}

                </div>

              </div>

              {erro && <div className="erro">?? {erro}</div>}

              <div style={{display:"flex",gap:8,marginTop:8}}>

                <button className="btn btn-ghost" onClick={()=>{setStep(0);setFile(null);setFileUrl("");}}>? Trocar vídeo</button>

                <button className="btn" style={{flex:1}} onClick={processar}>? Editar agora</button>

              </div>

            </>

          )}



          {/* STEP 2: Processando */}

          {step===2 && (

            <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",minHeight:220,gap:16,textAlign:"center"}}>

              <div style={{position:"relative",width:60,height:60,display:"flex",alignItems:"center",justifyContent:"center"}}>

                <div className="spinner" style={{width:50,height:50,border:"2px solid rgba(123,47,255,.2)",borderTopColor:"#7b2fff",borderRadius:"50%",animation:"spin .7s linear infinite"}}/>

                <span style={{fontSize:22,position:"absolute"}}>??</span>

              </div>

              <div style={{fontFamily:"var(--fh)",fontSize:15,fontWeight:700,color:"var(--text)"}}>{progMsg}</div>

              <div style={{fontSize:11,color:"var(--text3)"}}>Pode levar até 3 minutos dependendo do vídeo</div>

              <div style={{width:"100%",height:4,background:"rgba(123,47,255,.1)",borderRadius:99,overflow:"hidden"}}>

                <div style={{height:"100%",background:"linear-gradient(90deg,#7b2fff,#9d5cff)",borderRadius:99,animation:"progressAnim 2s ease-in-out infinite"}}/>

              </div>

              <style>{"@keyframes progressAnim{0%{width:10%}50%{width:75%}100%{width:95%}}"}</style>

            </div>

          )}



          {/* STEP 3: Pronto */}

          {step===3 && (

            <>

              <div style={{background:"rgba(52,211,153,.08)",border:".5px solid rgba(52,211,153,.25)",borderRadius:12,padding:"10px 14px",marginBottom:14,fontSize:13,color:"var(--green)",fontWeight:600}}>

                ? Vídeo editado com sucesso!

              </div>

              <video src={result} controls style={{width:"100%",borderRadius:12,marginBottom:14,background:"#000"}}/>

              <div style={{display:"flex",gap:8}}>

                <a href={result} download="vortex-editado.mp4" className="btn" style={{flex:1,textDecoration:"none",display:"flex",alignItems:"center",justifyContent:"center"}}>

                  ?? Baixar vídeo

                </a>

                <button className="btn btn-ghost" onClick={()=>{setStep(1);setResult("");}}>?? Editar novamente</button>

              </div>

              <button className="btn btn-full" style={{marginTop:8}} onClick={()=>{onResult(result);onClose();}}>

                Abrir no Chat ?

              </button>

            </>

          )}



        </div>

      </div>

    </div>

  );

}



// ==============================

function NarrarBtn({ texto }) {

  const [loading, setLoading] = useState(false);

  const [audioUrl, setAudioUrl] = useState(null);



  const narrar = async () => {

    setLoading(true);

    try {

      // Limpa markdown para narração

      const textoLimpo = texto

        .replace(/\*\*(.*?)\*\*/g, '$1')

        .replace(/\*(.*?)\*/g, '$1')

        .replace(/#{1,3} /g, '')

        .replace(/`([^`]+)`/g, '$1')

        .replace(/\n{2,}/g, '. ')



        .replace(/\n/g, ' ')



        .slice(0, 900);



      let res;

      for (let tentativa = 0; tentativa < 3; tentativa++) {

        res = await fetch(`${BACKEND}/gerar-voz`, {

          method: "POST",

          headers: { "Content-Type": "application/json" },

          body: JSON.stringify({ texto: textoLimpo, voz_id: "onwK4e9ZLuTAKqWW03F9" }),

        });

        if (res.ok) break;

        await new Promise(r => setTimeout(r, 1500));

      }

      if (!res || !res.ok) throw new Error("ElevenLabs indisponível");

      const d = await res.json();

      const base64 = d.audio_url.split(",")[1];

      const blob = new Blob([Uint8Array.from(atob(base64), c => c.charCodeAt(0))], { type: "audio/mpeg" });

      const audioUrl = URL.createObjectURL(blob);

      setAudioUrl(audioUrl);

      // Toca automaticamente

      setTimeout(() => {

        const audio = new Audio(audioUrl);

        audio.play().catch(()=>{});

      }, 100);

    } catch (e) {

      console.error(e);

    } finally {

      setLoading(false);

    }

  };



  return (

    <div style={{ marginTop: 8 }}>

      {!audioUrl ? (

        <button

          onClick={narrar}

          disabled={loading}

          style={{

            display: "inline-flex", alignItems: "center", gap: 5,

            fontSize: 11, color: "var(--purple2)",

            background: "rgba(123,47,255,.1)", border: ".5px solid rgba(123,47,255,.3)",

            borderRadius: 99, padding: "3px 11px", cursor: "pointer",

            opacity: loading ? .5 : 1,

          }}>

          {loading ? <><div className="spinner" style={{width:10,height:10,borderWidth:1.5}}/>narrando...</> : "? Narrar com VORTEX"}

        </button>

      ) : (

        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>

          <audio src={audioUrl} controls style={{ height: 28, flex: 1, maxWidth: 220 }}/>

          <a href={audioUrl} download="vortex-narracao.mp3"

            style={{ fontSize: 10, color: "var(--purple2)", textDecoration: "none",

              background: "rgba(123,47,255,.1)", border: ".5px solid rgba(123,47,255,.3)",

              borderRadius: 99, padding: "3px 9px" }}>??</a>

          <button onClick={() => setAudioUrl(null)}

            style={{ fontSize: 10, color: "var(--text3)", background: "transparent",

              border: "none", cursor: "pointer" }}>?</button>

        </div>

      )}

    </div>

  );

}



function VortexChat() {

  const [sessions,setSessions]=useState(()=>loadSessions());

  const [activeId,setActiveId]=useState(null);

  const [messages,setMessages]=useState(INITIAL_MSGS);

  const [input,setInput]=useState("");

  const [chatFile,setChatFile]=useState(null);

  const [chatFilePreview,setChatFilePreview]=useState(null);

  const [modoChat,setModoChat]=useState(()=>{

    const saved = localStorage.getItem("vortex_modo") || "criador";

    window.__vortexModo = saved;

    return saved;

  });

  const trocarModo = (m) => {

    setModoChat(m);

    window.__vortexModo = m;

    localStorage.setItem("vortex_modo", m);

  };

  const fileRefChat=useRef(null);

  const carregarArquivoChat=f=>{

    if(!f)return;

    setChatFile(f);

    if(f.type.startsWith("image/")){

      const r=new FileReader();

      r.onload=ev=>setChatFilePreview(ev.target.result);

      r.readAsDataURL(f);

    } else {

      setChatFilePreview(null);

    }

  };

  const [loading,setLoading]=useState(false);

  const [isMobile,setIsMobile]=useState(window.innerWidth<=768);

  const [userPlan]=useState("galaxia"); // estrelas | galaxia | buraco | portal

  const [showVideoEditor,setShowVideoEditor]=useState(false);

  useEffect(()=>{const fn=()=>setIsMobile(window.innerWidth<=768);window.addEventListener("resize",fn);return ()=>window.removeEventListener("resize",fn);},[]);

  const bottomRef=useRef(null);

  const taRef=useRef(null);



  useEffect(()=>{bottomRef.current?.scrollIntoView({behavior:"smooth"});},[messages,loading]);



  const persistSession=useCallback((msgs)=>{

    if(msgs.length<=1)return;

    setSessions(prev=>{

      const sid=activeId||newId();

      const exists=prev.find(s=>s.id===sid);

      let updated;

      if(exists){updated=prev.map(s=>s.id===sid?{...s,messages:msgs,title:sessionTitle(msgs),updatedAt:Date.now()}:s);}

      else{const ns={id:sid,title:sessionTitle(msgs),messages:msgs,createdAt:Date.now(),updatedAt:Date.now()};if(!activeId)setActiveId(ns.id);updated=[ns,...prev].slice(0,MAX_SESSIONS);}

      saveSessions(updated);return updated;

    });

  },[activeId]);



  const loadSession=useCallback(id=>{const s=loadSessions().find(x=>x.id===id);if(s){setActiveId(id);setMessages(s.messages);}},[]);

  const newSession=useCallback(()=>{setActiveId(newId());setMessages(INITIAL_MSGS);},[]);

  const deleteSession=useCallback(id=>{setSessions(prev=>{const u=prev.filter(s=>s.id!==id);saveSessions(u);return u;});if(activeId===id)newSession();},[activeId,newSession]);



  const sessionsMeta=sessions.map(s=>({id:s.id,title:s.title,msgs:s.messages.filter(m=>m.role==="user").length,date:relDate(s.updatedAt)}));



  const autoResize=()=>{if(!taRef.current)return;taRef.current.style.height="auto";taRef.current.style.height=Math.min(taRef.current.scrollHeight,120)+"px";};



  const enviar=useCallback(async(texto)=>{

    const t=(texto||input).trim();if((!t&&!chatFile)||loading)return;

    setInput("");if(taRef.current)taRef.current.style.height="auto";

    

    // Monta mensagem com arquivo se tiver

    let textoFinal = t;

    if(chatFile){

      textoFinal = t ? `${t} [arquivo: ${chatFile.name}]` : `[arquivo: ${chatFile.name}]`;

    }

    

    const comUser=[...messages,{

      role:"user",

      text:textoFinal,

      filePreview: chatFilePreview,

      fileName: chatFile?.name

    }];

    setMessages(comUser);

    setLoading(true);

    setChatFile(null);

    setChatFilePreview(null);

    try{

      // Carrega perfil e memória do usuário

      const profile = loadUserProfile();

      const memory  = loadUserMemory();



      // Prompt Engine — detecta intenção e enriquece o prompt

      // Envia histórico formatado para o backend

      const historicoBackend = messages.slice(-10).map(m=>({

        role: m.role === "assistant" ? "assistant" : "user",

        content: m.text || ""

      }));

      const routed = await vortexRouter(t, profile, memory, messages, historicoBackend);





        // Roteiro — chama endpoint dedicado com Claude diretamente

        const isRoteiro = /^(crie?|faz|gera?|monta?|escreve?)\s+(um\s+)?(roteiro|script)/i.test(t.trim()) || /^roteiro\s+de/i.test(t.trim());

        if (isRoteiro) {

          setMessages([...comUser, {role:"assistant", text:"?? Criando roteiro viral com Claude...", loading:true}]);

          try {

            const rr = await fetch(`${BACKEND}/roteiro-viral`, {

              method:"POST", headers:{"Content-Type":"application/json"},

              body: JSON.stringify({tema: t, nicho: profile.nicho || "terror"})

            });

            if (rr.ok) {

              const dd = await rr.json();

              if (dd.ok && dd.roteiro) {

                const fMsgs = [...comUser, {role:"assistant", text: dd.roteiro}];

                setMessages(fMsgs);

                persistSession(fMsgs);

                setLoading(false);

                return;

              }

            }

          } catch(err) { console.error("roteiro-viral:", err); }

        }



      let finalMsgs;

      if (routed.type === "image") {

        // Gera imagem

        setMessages([...comUser, {role:"assistant", text:"?? Gerando imagem com IA...", loading:true}]);

        try {

          const url = await generateImage(routed.prompt);

          finalMsgs = [...comUser, {role:"assistant", text:`??? **Imagem gerada!**



![imagem gerada](${url})



*Prompt usado: ${routed.prompt.slice(0,80)}...*`, imageUrl: url}];

        } catch(imgErr) {

          finalMsgs = [...comUser, {role:"assistant", text:`?? Erro ao gerar imagem: ${imgErr.message}



Verifique sua VITE_WAVESPEED_API_KEY no .env`}];

        }

      } else if (routed.type === "video") {

        // Gera vídeo

        setMessages([...comUser, {role:"assistant", text:"?? Gerando vídeo com IA... (pode levar até 2 min)", loading:true}]);

        try {

          const url = await generateVideo(routed.prompt);

          finalMsgs = [...comUser, {role:"assistant", text:`?? **Vídeo gerado!**



[?? Clique para assistir](${url})



*Prompt: ${routed.prompt.slice(0,80)}...*`, videoUrl: url}];

        } catch(vidErr) {

          finalMsgs = [...comUser, {role:"assistant", text:`?? Erro ao gerar vídeo: ${vidErr.message}`}];

        }

      } else {

        // Chat normal com sistema enriquecido

        finalMsgs = [...comUser, {role:"assistant", text:routed.response}];

      }



      setMessages(finalMsgs);

      persistSession(finalMsgs);



      // Auto-narrar resposta se tiver texto suficiente

      const lastMsg = finalMsgs[finalMsgs.length-1];

      if (lastMsg?.role==="assistant" && lastMsg?.text && lastMsg.text.length > 30 && !lastMsg.imageUrl && !lastMsg.videoUrl) {

        try {

          const textoLimpo = lastMsg.text

            .replace(/\*\*(.*?)\*\*/g,"$1").replace(/\*(.*?)\*/g,"$1")

            .replace(/#{1,3} /g,"").replace(/`([^`]+)`/g,"$1")

            .replace(/\n{2,}/g,". ").replace(/\n/g," ").slice(0,600);



          const r = await fetch(`${BACKEND}/gerar-voz`,{

            method:"POST",headers:{"Content-Type":"application/json"},

            body:JSON.stringify({texto:textoLimpo,voz_id:"onwK4e9ZLuTAKqWW03F9"})

          });

          if (r.ok) {

            const d = await r.json();

            const b64 = d.audio_url.split(",")[1];

            const blob = new Blob([Uint8Array.from(atob(b64),c=>c.charCodeAt(0))],{type:"audio/mpeg"});

            const url = URL.createObjectURL(blob);

            const audio = new Audio(url);

            audio.volume = 0.85;

            audio.play().catch(()=>{});

          }

        } catch {}

      }



    }catch(e){

      let msg = `?? ${e.message}`;

      if (e.message?.includes("401") || e.message?.includes("API Key")) {

        msg = "?? **API Key inválida**\n\nVerifique se o arquivo `.env` tem:\n```\nVITE_GROQ_API_KEY=gsk_...\n```\nDepois reinicie com `npm run dev`";

      } else if (e.message?.includes("429") || e.message?.includes("rate") || e.message?.includes("503") || e.message?.includes("limit") || e.message?.includes("Limite")) {

        // Retry silencioso — usuário não vê erro

        const withWait=[...comUser,{role:"assistant",text:"? Pensando...",loading:true}];

        setMessages(withWait);

        await new Promise(r=>setTimeout(r,4000));

        try {

          const profile2 = loadUserProfile();

          const memory2 = loadUserMemory();

          const hist2 = messages.slice(-8).map(m=>({role:m.role==="assistant"?"assistant":"user",content:m.text||""}));

          const routed2 = await vortexRouter(t, profile2, memory2, messages, hist2);

          const finalMsgs2 = [...comUser, {role:"assistant", text:routed2.response||routed2.roteiro||"Tente novamente."}];

          setMessages(finalMsgs2);

          persistSession(finalMsgs2);

          setLoading(false);

          return;

        } catch {

          msg = "Processando... tente novamente em alguns segundos.";

        }

      } else if (e.message?.includes("fetch") || e.message?.includes("network") || e.message?.includes("CORS")) {

        msg = "?? **Erro de conexão** — verifique sua internet. Se estiver com VPN, desative e tente novamente.";

      }

      const withErr=[...comUser,{role:"assistant",text:msg}];setMessages(withErr);persistSession(withErr);

    }finally{setLoading(false);}

  },[input,loading,messages,persistSession]);



  const handleQuick=useCallback(texto=>{enviar(`Aqui está o conteúdo gerado:\n\n${texto}\n\nPode melhorar ou adaptar?`);},[enviar]);



  return (

    <div style={{display:"flex",height:"100%",width:"100%",overflow:"hidden",minHeight:0}}>

      {window.innerWidth>768&&<HistoryPanel sessions={sessionsMeta} activeId={activeId} onLoad={loadSession} onNew={newSession} onDelete={deleteSession}/>}

      <div style={{flex:1,minWidth:0,height:"100%",display:"flex",flexDirection:"column",overflow:"hidden",position:"relative"}}>

        <ChatBgCanvas anim={userPlan}/>

        

        {/* TOPBAR DO CHAT — seletor de modo + modelo atual */}

        <div style={{

          display:"flex",alignItems:"center",justifyContent:"space-between",

          padding:"8px 12px",borderBottom:"0.5px solid rgba(255,255,255,.06)",

          background:"rgba(10,8,20,.6)",backdropFilter:"blur(10px)",

          flexShrink:0,gap:8,zIndex:5

        }}>

          {/* Seletor de modo */}

          <div style={{display:"flex",gap:4,background:"rgba(255,255,255,.05)",borderRadius:10,padding:3}}>

            {[

              {id:"criador",icon:"??",label:"Criador"},

              {id:"assistente",icon:"??",label:"Assistente"}

            ].map(m=>(

              <button key={m.id} onClick={()=>trocarModo(m.id)}

                style={{

                  padding:"4px 10px",borderRadius:8,border:"none",cursor:"pointer",

                  fontSize:11,fontWeight:600,letterSpacing:.3,

                  background:modoChat===m.id?"rgba(123,47,255,.3)":"transparent",

                  color:modoChat===m.id?"#c4b5fd":"rgba(255,255,255,.4)",

                  transition:"all .2s"

                }}>

                {m.icon} {m.label}

              </button>

            ))}

          </div>

          

          {/* Modelo atual */}

          <div style={{fontSize:10,color:"rgba(123,47,255,.7)",letterSpacing:.5,

            background:"rgba(123,47,255,.08)",border:"0.5px solid rgba(123,47,255,.2)",

            padding:"3px 8px",borderRadius:20,maxWidth:140,overflow:"hidden",

            textOverflow:"ellipsis",whiteSpace:"nowrap"

          }}>

            {window.__vortexModeloAtual||"50+ modelos IA"}

          </div>

          

          {/* Botão novo chat */}

          <button onClick={newSession}

            style={{background:"none",border:"0.5px solid rgba(255,255,255,.1)",

              borderRadius:8,padding:"4px 8px",color:"rgba(255,255,255,.4)",

              fontSize:11,cursor:"pointer"}}>

            + novo

          </button>

        </div>



        <div className="chat-messages">

          {/* Empty state — aparece quando não tem mensagens */}

          {messages.length===0&&(

            <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",

              height:"100%",padding:"20px 16px",gap:16,textAlign:"center"}}>

              <div style={{width:56,height:56,borderRadius:16,

                background:"linear-gradient(135deg,rgba(123,47,255,.3),rgba(157,92,255,.2))",

                border:".5px solid rgba(123,47,255,.3)",

                display:"flex",alignItems:"center",justifyContent:"center",

                fontSize:24,boxShadow:"0 0 30px rgba(123,47,255,.2)"}}>?</div>

              <div>

                <div style={{fontFamily:"var(--fh)",fontSize:18,fontWeight:700,color:"var(--text)",marginBottom:6}}>

                  {window.__vortexModo==="assistente"?"Como posso te ajudar?":"O que criamos hoje?"}

                </div>

                <div style={{fontSize:12,color:"var(--text3)",maxWidth:260,lineHeight:1.6}}>

                  {window.__vortexModo==="assistente"

                    ?"Sou o Vortex AI — respondo qualquer pergunta como Claude, GPT e Gemini."

                    :"Roteiros, estratégias, hooks, tendências — tudo em um lugar."}

                </div>

              </div>

              {/* Sugestões rápidas no empty state */}

              <div style={{display:"flex",flexDirection:"column",gap:6,width:"100%",maxWidth:320}}>

                {(window.__vortexModo==="assistente"?SUGESTOES_ASSISTENTE:SUGESTOES_CRIADOR).slice(0,4).map((s,i)=>(

                  <button key={i} onClick={()=>enviar(s)}

                    style={{padding:"10px 14px",borderRadius:10,textAlign:"left",

                      background:"rgba(255,255,255,.04)",border:".5px solid rgba(123,47,255,.15)",

                      color:"var(--text2)",fontSize:12,cursor:"pointer",

                      transition:"all .15s",lineHeight:1.4}}

                    onMouseOver={e=>e.target.style.background="rgba(123,47,255,.1)"}

                    onMouseOut={e=>e.target.style.background="rgba(255,255,255,.04)"}>

                    {s}

                  </button>

                ))}

              </div>

            </div>

          )}



          {messages.map((m,i)=>(

            <div key={i} className={`msg-row ${m.role==="user"?"user":""}`}>

              <div className={`msg-avatar ${m.role==="assistant"?"msg-avatar-bot":"msg-avatar-user"}`}>{m.role==="assistant"?"VX":"EU"}</div>

              <div>

                {m.role==="assistant"&&<div className="msg-name">Vortex AI {m.modelo?<span style={{fontSize:9,color:"rgba(123,47,255,.6)",marginLeft:4}}>· {m.modelo}</span>:""}</div>}

                <div className={`msg-bubble ${m.role==="assistant"?"bot":"user"}`}>

                  {m.role==="assistant" ? (

                    <>

                      <Md text={m.text}/>

                      {m.role==="assistant" && m.text && m.text.length > 20 && !m.loading && (

                        <NarrarBtn texto={m.text}/>

                      )}

                      {m.imageUrl && (

                        <div style={{marginTop:8}}>

                          <img src={m.imageUrl} alt="imagem gerada" style={{width:"100%",maxWidth:320,borderRadius:12,display:"block"}} onError={e=>e.target.style.display="none"}/>

                          <div style={{display:"flex",gap:6,marginTop:6}}>

                            <a href={m.imageUrl} download="vortex-imagem.jpg" style={{fontSize:11,color:"var(--purple2)",textDecoration:"none",background:"rgba(123,47,255,.1)",border:".5px solid rgba(123,47,255,.3)",padding:"3px 10px",borderRadius:99}}>?? Baixar</a>

                          </div>

                        </div>

                      )}

                      {m.videoUrl && (

                        <div style={{marginTop:8}}>

                          <video src={m.videoUrl} controls style={{width:"100%",maxWidth:320,borderRadius:12,display:"block"}}/>

                          <a href={m.videoUrl} download="vortex-video.mp4" style={{display:"inline-block",marginTop:6,fontSize:11,color:"var(--cyan)",textDecoration:"none",background:"rgba(34,211,238,.1)",border:".5px solid rgba(34,211,238,.3)",padding:"3px 10px",borderRadius:99}}>?? Baixar vídeo</a>

                        </div>

                      )}

                      {m.audioUrl && (

                        <div style={{marginTop:8,background:"rgba(123,47,255,.08)",border:".5px solid rgba(123,47,255,.25)",borderRadius:12,padding:"10px 14px"}}>

                          <div style={{fontSize:11,color:"var(--purple2)",marginBottom:6,fontWeight:600}}>??? Narração</div>

                          <audio src={m.audioUrl} controls style={{width:"100%",height:36}}/>

                          <a href={m.audioUrl} download="vortex-audio.mp3" style={{display:"inline-block",marginTop:6,fontSize:11,color:"var(--purple2)",textDecoration:"none",background:"rgba(123,47,255,.1)",border:".5px solid rgba(123,47,255,.3)",padding:"3px 10px",borderRadius:99}}>?? Baixar áudio</a>

                        </div>

                      )}

                    </>

                  ) : (

                    <>

                      {m.filePreview && (

                        <img src={m.filePreview} alt={m.fileName} style={{maxWidth:"100%",maxHeight:180,borderRadius:8,marginBottom:6,display:"block"}}/>

                      )}

                      {m.fileName && !m.filePreview && (

                        <div style={{fontSize:11,color:"rgba(255,255,255,.6)",marginBottom:4}}>?? {m.fileName}</div>

                      )}

                      {m.text}

                    </>

                  )}

                </div>

              </div>

            </div>

          ))}

          {loading&&<div className="msg-row"><div className="msg-avatar msg-avatar-bot">VX</div><div><div className="msg-name">Vortex AI</div><div className="typing"><div className="typing-dot"/><div className="typing-dot"/><div className="typing-dot"/></div></div></div>}

          <div ref={bottomRef}/>

        </div>

        {messages.length<=1&&<div className="suggestions">{SUGESTOES.map((s,i)=><button key={i} className="suggestion" onClick={()=>enviar(s)}>{s}</button>)}</div>}

        <div className="chat-input-wrap">

          <div className="chat-input-outer">

            {chatFile&&(

              <div style={{display:"flex",alignItems:"center",gap:8,padding:"6px 8px",background:"rgba(124,92,252,.1)",borderRadius:10,marginBottom:6,fontSize:12}}>

                {chatFilePreview

                  ?<img src={chatFilePreview} style={{width:28,height:28,borderRadius:6,objectFit:"cover"}} alt="file"/>

                  :<span style={{fontSize:18}}>??</span>}

                <span style={{flex:1,color:"var(--text2)",fontSize:12}}>{chatFile.name}</span>

                <button onClick={()=>{setChatFile(null);setChatFilePreview(null);}} style={{background:"none",border:"none",cursor:"pointer",color:"var(--text3)",fontSize:14,padding:"2px 6px"}}>?</button>

              </div>

            )}

            <div className="chat-input-box">

              <textarea ref={taRef} className="chat-textarea"

                placeholder={window.__vortexModo==="assistente"?"Pergunte qualquer coisa — como Claude, GPT e Gemini...":"Roteiro, estratégia, hook, tendência — o que criar hoje?"}

                value={input} rows={1}

                onChange={e=>{setInput(e.target.value);autoResize();}}

                onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();enviar();}}}/>

              <button className="chat-send" onClick={()=>enviar()} disabled={loading||!input.trim()}>

                {loading?<div className="spinner" style={{width:16,height:16}}/>:<span style={{fontSize:18}}>?</span>}

              </button>

            </div>

            <div className="chat-input-actions">

              <button className="chat-action-btn" onClick={()=>fileRefChat.current?.click()} title="Anexar arquivo">

                <span style={{fontSize:16}}>??</span><span>Anexar</span>

              </button>

              <input ref={fileRefChat} type="file" accept="image/*,video/*,.pdf,.txt" style={{display:"none"}} onChange={e=>carregarArquivoChat(e.target.files[0])}/>

              <button className="chat-action-btn" onClick={()=>setInput("Crie um roteiro viral sobre ")}>

                <span style={{fontSize:16}}>??</span><span>Roteiro</span>

              </button>

              <button className="chat-action-btn" onClick={()=>setInput("Quais tendências estão bombando em ")}>

                <span style={{fontSize:16}}>??</span><span>Tendência</span>

              </button>

              <button className="chat-action-btn" onClick={()=>setInput("Me dê ideias de conteúdo para ")}>

                <span style={{fontSize:16}}>??</span><span>Ideias</span>

              </button>

              <QuickCreate onSend={handleQuick}/>

            </div>

          </div>

          <div className="chat-hint">Enter para enviar · Shift+Enter para nova linha</div>

        </div>

      </div>

    </div>

  );

}



// ==============================

function VideoFaceless() {

  const [tema,setTema]=useState("");

  const [nicho,setNicho]=useState("viral");

  const [loading,setLoading]=useState(false);

  const [etapa,setEtapa]=useState("");

  const [resultado,setResultado]=useState(null);

  const [erro,setErro]=useState("");

  const [progresso,setProgresso]=useState(0);



  const NICHOS=["terror","gaming","finanças","fitness","lifestyle","tech","motivacional","curiosidades","crime real","anime"];

  const ETAPAS=["?? Gerando roteiro...","?? Criando imagens...","??? Narrando...","?? Finalizando..."];



  const gerar=async()=>{

    if(!tema.trim())return;

    setErro("");setResultado(null);setLoading(true);setProgresso(0);

    let ei=0;setEtapa(ETAPAS[0]);

    const tick=setInterval(()=>{

      setProgresso(p=>p<90?p+2:p);

      ei=Math.min(ei+1,ETAPAS.length-1);

      setEtapa(ETAPAS[ei]);

    },4000);

    try{

      const res=await fetch(`${BACKEND}/video-faceless`,{

        method:"POST",headers:{"Content-Type":"application/json"},

        body:JSON.stringify({tema,nicho,duracao:60,estilo:"cinematico",plataforma:"TikTok"})

      });

      clearInterval(tick);

      if(!res.ok){const e=await res.json().catch(()=>({}));throw new Error(e?.detail||`Erro ${res.status}`);}

      const d=await res.json();

      setProgresso(100);setEtapa("? Pronto!");setResultado(d);

    }catch(e){clearInterval(tick);setErro(e.message);}

    finally{setLoading(false);}

  };



  return(

    <div className="page">

      <div className="page-header">

        <div className="eyebrow"><div className="eyebrow-dot"/>IA & Criação</div>

        <h1 className="page-title">Vídeo Faceless <em>1 Clique</em></h1>

        <p className="page-sub">Digite o tema ? Vortex cria roteiro + imagens + narração automático</p>

      </div>



      <div className="card" style={{marginBottom:"1rem",background:"linear-gradient(135deg,#0d0020,#1a003d)",border:"1px solid rgba(124,92,252,.3)"}}>

        <div style={{fontSize:13,color:"rgba(200,180,255,.8)",marginBottom:12,lineHeight:1.6}}>

          ? <strong>Como funciona:</strong> Você digita o tema ? Vortex gera roteiro viral ? cria imagens para cada cena ? narra com voz profissional ? entrega tudo pronto

        </div>

        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:6}}>

          {["?? Roteiro","?? Imagens","??? Narração","?? Pronto"].map((s,i)=>(

            <div key={i} style={{background:"rgba(124,92,252,.1)",borderRadius:8,padding:"8px 4px",textAlign:"center",fontSize:11,color:"rgba(200,180,255,.8)"}}>

              {s}

            </div>

          ))}

        </div>

      </div>



      <div className="card" style={{marginBottom:"1rem"}}>

        <div className="field">

          <label className="label">Tema do vídeo</label>

          <textarea className="input" rows={3}

            placeholder="Ex: Um serial killer que ninguém sabia que morava ao lado... / O segredo que a NASA esconde sobre Marte..."

            value={tema} onChange={e=>setTema(e.target.value)} disabled={loading}/>

        </div>



        <div className="field">

          <label className="label">Nicho</label>

          <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>

            {NICHOS.map(n=>(

              <button key={n} onClick={()=>setNicho(n)}

                style={{padding:"5px 12px",borderRadius:8,border:`1px solid ${nicho===n?"#7C3AED":"var(--border)"}`,

                  background:nicho===n?"#7C3AED18":"var(--surface2)",color:nicho===n?"#7C3AED":"var(--text2)",

                  cursor:"pointer",fontSize:12,fontWeight:nicho===n?700:400,transition:"all .15s"}}>

                {n}

              </button>

            ))}

          </div>

        </div>



        {loading&&(

          <div style={{marginBottom:12}}>

            <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>

              <span style={{fontSize:13,color:"#A855F7",fontWeight:600}}>{etapa}</span>

              <span style={{fontSize:12,color:"var(--text3)"}}>{Math.round(progresso)}%</span>

            </div>

            <div style={{height:4,background:"var(--border)",borderRadius:4,overflow:"hidden"}}>

              <div style={{height:"100%",width:`${progresso}%`,background:"linear-gradient(90deg,#7C3AED,#A855F7)",borderRadius:4,transition:"width .5s"}}/>

            </div>

          </div>

        )}



        {erro&&<div style={{color:"#f87171",fontSize:13,marginBottom:8,padding:"8px 12px",background:"#f8717118",borderRadius:8}}>?? {erro}</div>}



        <button className="btn btn-full" onClick={gerar} disabled={loading||!tema.trim()}

          style={{background:loading||!tema.trim()?"var(--surface2)":"linear-gradient(135deg,#7C3AED,#A855F7)",color:loading||!tema.trim()?"var(--text3)":"white",border:"none",fontSize:15,fontWeight:700}}>

          {loading?"? Criando seu vídeo...":"? Gerar Vídeo Faceless"}

        </button>

      </div>



      {resultado&&(

        <div style={{display:"flex",flexDirection:"column",gap:12}}>

          {/* Metadados */}

          <div className="card" style={{background:"#7C3AED18",border:"1px solid #7C3AED44"}}>

            <div style={{fontWeight:700,fontSize:14,color:"#A855F7",marginBottom:8}}>? Vídeo pronto!</div>

            <div style={{fontSize:13,fontWeight:600,color:"var(--text1)",marginBottom:4}}>{resultado.metadados?.titulo}</div>

            <div style={{fontSize:12,color:"var(--text2)",marginBottom:8}}>{resultado.metadados?.legenda}</div>

            <div style={{fontSize:11,color:"#7C3AED"}}>{resultado.metadados?.hashtags}</div>

          </div>



          {/* Cenas com imagens */}

          {resultado.etapas?.imagens?.map((cena,i)=>(

            <div key={i} className="card" style={{padding:12}}>

              <div style={{fontSize:12,fontWeight:700,color:"#7C3AED",marginBottom:8}}>Cena {cena.cena}</div>

              {cena.url&&<img src={cena.url} alt={`cena ${cena.cena}`} style={{width:"100%",borderRadius:8,marginBottom:8,objectFit:"cover",maxHeight:160}}/>}

              <div style={{fontSize:12,color:"var(--text2)",lineHeight:1.6,fontStyle:"italic"}}>"{cena.narracao}"</div>

            </div>

          ))}



          {/* Áudio */}

          {resultado.etapas?.audio&&(

            <div className="card">

              <div style={{fontWeight:600,fontSize:13,marginBottom:8}}>??? Narração</div>

              <audio controls src={resultado.etapas.audio} style={{width:"100%"}}/>

            </div>

          )}

        </div>

      )}

    </div>

  );

}





function AnalisarVideo() {

  const [url,setUrl]=useState("");

  const [titulo,setTitulo]=useState("");

  const [views,setViews]=useState("");

  const [likes,setLikes]=useState("");

  const [comentarios,setComentarios]=useState("");

  const [nicho,setNicho]=useState("viral");

  const [loading,setLoading]=useState(false);

  const [resultado,setResultado]=useState(null);

  const [erro,setErro]=useState("");



  const analisar=async()=>{

    setErro("");setResultado(null);setLoading(true);

    try{

      const res=await fetch(`${BACKEND}/analisar-video`,{

        method:"POST",headers:{"Content-Type":"application/json"},

        body:JSON.stringify({

          url:url.trim(),titulo:titulo.trim(),

          views:parseInt(views)||0,likes:parseInt(likes)||0,

          comentarios:parseInt(comentarios)||0,nicho

        })

      });

      if(!res.ok){const e=await res.json().catch(()=>({}));throw new Error(e?.detail||`Erro ${res.status}`);}

      const d=await res.json();

      setResultado(d);

    }catch(e){setErro(e.message);}

    finally{setLoading(false);}

  };



  const NICHOS=["viral","terror","gaming","finanças","fitness","lifestyle","tech","humor","educação"];



  return(

    <div className="page">

      <div className="page-header">

        <div className="eyebrow"><div className="eyebrow-dot"/>Análise</div>

        <h1 className="page-title">Análise de <em>Vídeo</em></h1>

        <p className="page-sub">Cole os dados do vídeo e descubra por que viralizou ou não.</p>

      </div>



      <div className="card" style={{marginBottom:"1rem"}}>

        <div className="field">

          <label className="label">Título do vídeo</label>

          <input className="input" placeholder="Ex: A verdade sobre..." value={titulo} onChange={e=>setTitulo(e.target.value)}/>

        </div>



        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8,marginBottom:12}}>

          <div className="field">

            <label className="label">??? Views</label>

            <input className="input" type="number" placeholder="Ex: 150000" value={views} onChange={e=>setViews(e.target.value)}/>

          </div>

          <div className="field">

            <label className="label">?? Likes</label>

            <input className="input" type="number" placeholder="Ex: 8000" value={likes} onChange={e=>setLikes(e.target.value)}/>

          </div>

          <div className="field">

            <label className="label">?? Comentários</label>

            <input className="input" type="number" placeholder="Ex: 500" value={comentarios} onChange={e=>setComentarios(e.target.value)}/>

          </div>

        </div>



        <div className="field">

          <label className="label">Nicho</label>

          <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>

            {NICHOS.map(n=>(

              <button key={n} onClick={()=>setNicho(n)}

                style={{padding:"5px 12px",borderRadius:8,border:`1px solid ${nicho===n?"#7C3AED":"var(--border)"}`,

                  background:nicho===n?"#7C3AED18":"var(--surface2)",color:nicho===n?"#7C3AED":"var(--text2)",

                  cursor:"pointer",fontSize:12,fontWeight:nicho===n?700:400}}>

                {n}

              </button>

            ))}

          </div>

        </div>



        {erro&&<div style={{color:"#f87171",fontSize:13,marginBottom:8}}>?? {erro}</div>}

        <button className="btn btn-full" onClick={analisar} disabled={loading||(!titulo&&!views)}

          style={{background:loading?"var(--surface2)":"linear-gradient(135deg,#7C3AED,#A855F7)",color:loading?"var(--text3)":"white",border:"none"}}>

          {loading?"?? Analisando com IA...":"?? Analisar Vídeo"}

        </button>

      </div>



      {resultado&&(

        <div className="card" style={{background:"linear-gradient(135deg,#0d0020,#1a003d)",border:"1px solid rgba(124,92,252,.3)"}}>

          {/* Métricas */}

          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8,marginBottom:16}}>

            {[

              ["???","Views",(resultado.metricas?.views||0).toLocaleString("pt-BR")],

              ["??","Engajamento",resultado.metricas?.taxa_engajamento+"%"],

              ["??","Status",resultado.metricas?.classificacao],

            ].map(([ico,label,val])=>(

              <div key={label} style={{background:"rgba(124,92,252,.1)",borderRadius:10,padding:"10px 8px",textAlign:"center"}}>

                <div style={{fontSize:18}}>{ico}</div>

                <div style={{fontSize:14,fontWeight:700,color:"#A855F7"}}>{val}</div>

                <div style={{fontSize:10,color:"var(--text3)"}}>{label}</div>

              </div>

            ))}

          </div>

          {/* Análise */}

          <div style={{whiteSpace:"pre-wrap",fontSize:13,lineHeight:1.8,color:"var(--text2)"}}>

            {resultado.analise}

          </div>

        </div>

      )}

    </div>

  );

}





function Dashboard({ setAba }) {

  const [stats, setStats]           = useState({saldo:0, perfil_configurado:false});

  const [trends, setTrends]         = useState([]);

  const [cerebro, setCerebro]       = useState({total_roteiros:0, taxa_aprovacao:0, nichos_aprendidos:[]});

  const [googleTrends, setGoogleTrends] = useState([]);

  const [loading, setLoading]       = useState(true);



  useEffect(()=>{

    setLoading(true);

    Promise.all([

      fetch(`${BACKEND}/creditos/saldo`,{headers:vortexHeaders()}).then(r=>r.json()).catch(()=>({saldo:0})),

      fetch(`${BACKEND}/status`).then(r=>r.json()).catch(()=>({})),

      fetch(`${BACKEND}/trends-agora`).then(r=>r.json()).catch(()=>({trends:""})),

      fetch(`${BACKEND}/cerebro/status`).then(r=>r.json()).catch(()=>({})),

      fetch(`${BACKEND}/tendencias?plataforma=TikTok`).then(r=>r.json()).catch(()=>({tendencias:[]})),

    ]).then(([saldo, status, t, cer, tends])=>{

      setStats({saldo:saldo.saldo||0, perfil_configurado:status.perfil_configurado||false});

      if(t.trends_raw) setTrends(t.trends_raw.slice(0,3));

      if(cer.cerebro)  setCerebro(cer.cerebro);

      else if(cer.total_roteiros !== undefined) setCerebro(cer);

      if(tends.tendencias) setGoogleTrends(tends.tendencias.slice(0,4));

      else if(tends.google_trends) setGoogleTrends(tends.google_trends.slice(0,4));

    }).finally(()=>setLoading(false));

  },[]);



  const profile = loadUserProfile();

  const nicho = profile.nicho || "";

  const nome  = profile.nome  || "";



  if(loading) return(

    <div className="page" style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",minHeight:"60vh",gap:16}}>

      <div className="spinner" style={{width:32,height:32,borderWidth:3}}/>

      <div style={{fontSize:13,color:"var(--text3)"}}>Carregando painel...</div>

    </div>

  );



  return (

    <div className="page">

      <div className="page-header">

        <div className="eyebrow"><div className="eyebrow-dot"/>painel</div>

        <h1 className="page-title">{nome ? "Olá, "+nome.split(" ")[0]+" ??" : "Bem-vindo ao"} <em>{nome?"Vortex":"Vortex"}</em></h1>

        <p className="page-sub">{nicho ? "Nicho: "+nicho : "Configure seu perfil para personalizar tudo"}</p>

      </div>



      {/* Cards de status */}

      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10,marginBottom:"1.25rem"}}>

        <div className="card" style={{textAlign:"center",padding:"1.25rem .75rem"}}>

          <div style={{fontSize:28,fontWeight:800,fontFamily:"var(--fh)",color:"var(--purple2)"}}>{stats.saldo}</div>

          <div style={{fontSize:11,color:"var(--text3)",marginTop:4}}>?? Créditos</div>

        </div>

        <div className="card" style={{textAlign:"center",padding:"1.25rem .75rem",cursor:"pointer"}} onClick={()=>setAba("imagens")}>

          <div style={{fontSize:28}}>??</div>

          <div style={{fontSize:11,color:"var(--text3)",marginTop:4}}>Gerar Imagem</div>

        </div>

        <div className="card" style={{textAlign:"center",padding:"1.25rem .75rem",cursor:"pointer"}} onClick={()=>setAba("videos")}>

          <div style={{fontSize:28}}>??</div>

          <div style={{fontSize:11,color:"var(--text3)",marginTop:4}}>Gerar Vídeo</div>

        </div>

      </div>



      {/* Ações rápidas */}

      {/* Card do Cérebro */}

      <div className="card" style={{marginBottom:"1rem",background:"rgba(123,47,255,.04)",border:"0.5px solid rgba(123,47,255,.2)"}}>

        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>

          <div className="card-title">?? Cérebro do Vortex</div>

          <span style={{fontSize:10,color:"var(--accent)",background:"rgba(123,47,255,.1)",padding:"2px 8px",borderRadius:20,letterSpacing:1}}>APRENDENDO</span>

        </div>

        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:10}}>

          <div style={{textAlign:"center",padding:8,background:"rgba(255,255,255,.03)",borderRadius:8}}>

            <div style={{fontSize:20,fontWeight:800,color:"var(--text)"}}>{cerebro.total_roteiros||0}</div>

            <div style={{fontSize:10,color:"var(--text3)"}}>roteiros analisados</div>

          </div>

          <div style={{textAlign:"center",padding:8,background:"rgba(255,255,255,.03)",borderRadius:8}}>

            <div style={{fontSize:20,fontWeight:800,color:"#34d399"}}>{cerebro.taxa_aprovacao||0}%</div>

            <div style={{fontSize:10,color:"var(--text3)"}}>taxa aprovação</div>

          </div>

          <div style={{textAlign:"center",padding:8,background:"rgba(255,255,255,.03)",borderRadius:8}}>

            <div style={{fontSize:20,fontWeight:800,color:"var(--text)"}}>{(cerebro.nichos_aprendidos||[]).length}</div>

            <div style={{fontSize:10,color:"var(--text3)"}}>nichos aprendidos</div>

          </div>

        </div>

        {googleTrends.length>0&&(

          <div>

            <div style={{fontSize:10,color:"var(--text3)",letterSpacing:1,marginBottom:6}}>?? VIRAL NO BRASIL AGORA</div>

            {googleTrends.map((t,i)=>(

              <div key={i} style={{fontSize:12,color:"var(--text2)",padding:"4px 8px",background:"rgba(255,255,255,.03)",borderRadius:6,marginBottom:4,display:"flex",alignItems:"center",gap:6}}>

                <span style={{color:"var(--accent)",fontWeight:700}}>#{i+1}</span>

                {typeof t==="object"?t.titulo:t}

              </div>

            ))}

          </div>

        )}

      </div>



      <div className="card" style={{marginBottom:"1rem"}}>

        <div className="card-title" style={{marginBottom:".75rem"}}>? Ações Rápidas</div>

        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>

          {[

            {icon:"??",label:"Criar Roteiro",aba:"roteiro"},

            {icon:"??",label:"Analisar Perfil",aba:"analise"},

            {icon:"??",label:"Ver Tendências",aba:"tendencias"},

            {icon:"??",label:"Meus Personagens",aba:"personagens"},

          ].map(a=>(

            <button key={a.aba} onClick={()=>setAba(a.aba)}

              style={{padding:"12px",borderRadius:10,border:".5px solid var(--border2)",background:"var(--bg4)",cursor:"pointer",display:"flex",alignItems:"center",gap:8,color:"var(--text)"}}>

              <span style={{fontSize:18}}>{a.icon}</span>

              <span style={{fontSize:12,fontWeight:500}}>{a.label}</span>

            </button>

          ))}

        </div>

      </div>



      {/* Trends do nicho */}

      {trends.length > 0 && (

        <div className="card" style={{marginBottom:"1rem"}}>

          <div className="card-title" style={{marginBottom:".75rem"}}>?? Trends do seu nicho agora</div>

          {trends.map((t,i)=>(

            <div key={i} style={{display:"flex",alignItems:"center",gap:8,padding:"7px 0",borderBottom:i<trends.length-1?".5px solid var(--border)":"none"}}>

              <span style={{fontSize:14,fontWeight:700,color:"var(--purple2)",minWidth:20}}>{i+1}.</span>

              <span style={{fontSize:13,color:"var(--text2)"}}>{t}</span>

            </div>

          ))}

          <button className="btn btn-ghost" style={{marginTop:10,width:"100%"}} onClick={()=>setAba("tendencias")}>

            Ver todas as tendências ?

          </button>

        </div>

      )}



      {/* CTA configurar perfil */}

      {!stats.perfil_configurado && (

        <div style={{background:"rgba(123,47,255,.08)",border:".5px solid rgba(123,47,255,.3)",borderRadius:"var(--r-lg)",padding:"1rem 1.25rem",textAlign:"center"}}>

          <div style={{fontSize:14,fontWeight:600,color:"var(--purple2)",marginBottom:6}}>Configure seu perfil para personalizar o Vortex</div>

          <button className="btn" onClick={()=>setAba("config")}>?? Configurar agora</button>

        </div>

      )}

    </div>

  );

}



function AnalisePerfil({ setAba }) {

  const [rede, setRede]       = useState("instagram");

  const [perfil, setPerfil]   = useState("");

  const [loading, setLoading] = useState(false);

  const [dados, setDados]     = useState(null);

  const [erro, setErro]       = useState("");



  const REDES = [

    {id:"instagram", label:"Instagram", icon:"??", cor:"#E1306C"},

    {id:"tiktok",    label:"TikTok",    icon:"??", cor:"#69C9D0"},

    {id:"youtube",   label:"YouTube",   icon:"??", cor:"#FF0000"},

    {id:"kwai",      label:"Kwai",      icon:"??", cor:"#FF5100"},

    {id:"twitter",   label:"X/Twitter", icon:"?",  cor:"#1DA1F2"},

  ];



  const analisar = async () => {

    if (!perfil.trim()) { setErro("Cole o @ ou link do perfil!"); return; }

    setErro(""); setDados(null); setLoading(true);

    try {

      const p = perfil.trim().replace("@","").split("/").pop().split("?")[0];

      const res = await fetch(`${BACKEND}/analisar-perfil`, {

        method:"POST", headers:{"Content-Type":"application/json"},

        body: JSON.stringify({ rede, perfil: p }),

      });

      if (!res.ok) { const e = await res.json().catch(()=>({})); throw new Error(e?.detail||`HTTP ${res.status}`); }

      const d = await res.json();

      setDados(d);

    } catch(e) { setErro(e.message); }

    finally { setLoading(false); }

  };



  const redeAtual = REDES.find(r=>r.id===rede);



  return (

    <div className="page">

      <div className="page-header">

        <div className="eyebrow"><div className="eyebrow-dot"/>Análise</div>

        <h1 className="page-title">Análise de <em>Perfil</em></h1>

        <p className="page-sub">Dados reais + recomendações IA para crescer.</p>

      </div>



      <div className="card" style={{marginBottom:"1rem"}}>

        {/* Seletor de rede */}

        <div className="field">

          <label className="label">Rede social</label>

          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:6,marginBottom:12}}>

            {REDES.map(r=>(

              <button key={r.id} onClick={()=>setRede(r.id)}

                style={{padding:"10px 8px",borderRadius:10,textAlign:"center",cursor:"pointer",

                  border:`.5px solid ${rede===r.id?r.cor:"var(--border2)"}`,

                  background:rede===r.id?r.cor+"18":"var(--bg4)"}}>

                <div style={{fontSize:20,marginBottom:2}}>{r.icon}</div>

                <div style={{fontSize:11,fontWeight:600,color:"var(--text)"}}>{r.label}</div>

              </button>

            ))}

          </div>

        </div>



        <div className="field">

          <label className="label">@ ou link do perfil</label>

          <input className="input"

            placeholder={`Ex: @criador ou ${rede === "youtube" ? "nome do canal" : "instagram.com/criador"}`}

            value={perfil} onChange={e=>setPerfil(e.target.value)}

            onKeyDown={e=>e.key==="Enter"&&analisar()} disabled={loading}/>

        </div>



        {erro && <div style={{color:"#f87171",fontSize:13,marginBottom:8}}>?? {erro}</div>}

        <button className="btn btn-full" onClick={analisar} disabled={loading||!perfil.trim()}>

          {loading ? "?? Analisando..." : `?? Analisar ${redeAtual?.label} — 2 créditos`}

        </button>

      </div>



      {dados && (

        <>

          {/* Card principal de stats */}

          <div className="card" style={{marginBottom:"1rem"}}>

            <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:16}}>

              {dados.avatar && (

                <img src={dados.avatar} alt="avatar"

                  style={{width:56,height:56,borderRadius:"50%",objectFit:"cover",border:"2px solid var(--accent)"}}/>

              )}

              <div>

                <div style={{fontSize:16,fontWeight:700,color:"var(--text)"}}>{dados.nome||"@"+perfil}</div>

                <div style={{fontSize:12,color:redeAtual?.cor,fontWeight:600}}>{redeAtual?.icon} {redeAtual?.label}</div>

                {dados.verificado && <div style={{fontSize:11,color:"#22d3ee"}}>? Verificado</div>}

              </div>

            </div>



            <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8,marginBottom:12}}>

              {[

                ["??","Seguidores",dados.seguidores],

                ["??","Posts",dados.posts],

                ["??","Engajamento",dados.engajamento||dados.curtidas||"N/A"],

              ].map(([ico,label,val])=>(

                <div key={label} style={{background:"var(--bg4)",borderRadius:10,padding:"10px 8px",textAlign:"center"}}>

                  <div style={{fontSize:18,marginBottom:2}}>{ico}</div>

                  <div style={{fontSize:16,fontWeight:700,color:"var(--accent)"}}>{val}</div>

                  <div style={{fontSize:10,color:"var(--text3)"}}>{label}</div>

                </div>

              ))}

            </div>



            {dados.bio && (

              <div style={{fontSize:12,color:"var(--text2)",background:"var(--bg4)",

                borderRadius:8,padding:"8px 10px",lineHeight:1.5}}>{dados.bio}</div>

            )}

          </div>



          {/* Análise completa da IA */}

          {(dados.analise_completa || dados.recomendacao_ia) && (

            <div className="card" style={{marginBottom:"1rem",border:".5px solid rgba(123,47,255,.2)"}}>

              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>

                <div className="card-title">?? Análise do Vortex AI</div>

                <button onClick={()=>{

                  navigator.clipboard.writeText(dados.analise_completa||dados.recomendacao_ia);

                  const b=event.target;b.textContent="? Copiado!";setTimeout(()=>b.textContent="?? Copiar",2000);

                }} style={{fontSize:11,color:"var(--accent)",background:"rgba(123,47,255,.1)",

                  border:"none",borderRadius:8,padding:"4px 10px",cursor:"pointer"}}>

                  ?? Copiar

                </button>

              </div>

              <div style={{whiteSpace:"pre-wrap",fontSize:13,lineHeight:1.8,color:"var(--text2)",

                background:"rgba(255,255,255,.02)",borderRadius:10,padding:12,

                border:".5px solid rgba(255,255,255,.04)"}}>

                {dados.analise_completa || dados.recomendacao_ia}

              </div>

              {/* Feedback */}

              <div style={{display:"flex",gap:8,marginTop:12}}>

                <button onClick={()=>{

                  fetch(`${BACKEND}/cerebro/feedback`,{method:"POST",

                    headers:{"Content-Type":"application/json"},

                    body:JSON.stringify({tipo:"analise_perfil",conteudo:dados.analise_completa||"",aprovado:true})});

                  alert("? Vortex aprendeu!");

                }} style={{fontSize:13,flex:1,padding:"6px",borderRadius:8,border:".5px solid rgba(52,211,153,.3)",

                  background:"rgba(52,211,153,.08)",color:"#34d399",cursor:"pointer"}}>

                  ?? Útil

                </button>

                <button onClick={()=>{

                  fetch(`${BACKEND}/cerebro/feedback`,{method:"POST",

                    headers:{"Content-Type":"application/json"},

                    body:JSON.stringify({tipo:"analise_perfil",conteudo:dados.analise_completa||"",aprovado:false})});

                  alert("?? Obrigado pelo feedback!");

                }} style={{fontSize:13,flex:1,padding:"6px",borderRadius:8,border:".5px solid rgba(255,100,100,.2)",

                  background:"rgba(255,100,100,.06)",color:"#f87171",cursor:"pointer"}}>

                  ?? Melhorar

                </button>

              </div>

            </div>

          )}



          {/* Ações rápidas */}

          <div className="card">

            <div className="card-title" style={{marginBottom:10}}>? Ações rápidas</div>

            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>

              <button className="btn" onClick={()=>setAba&&setAba("roteiro")}

                style={{background:"rgba(123,47,255,.1)",border:".5px solid rgba(123,47,255,.3)"}}>

                ?? Gerar roteiro para esse nicho

              </button>

              <button className="btn" onClick={()=>setAba&&setAba("score_viral")}

                style={{background:"rgba(34,211,238,.1)",border:".5px solid rgba(34,211,238,.3)"}}>

                ?? Analisar score viral

              </button>

            </div>

          </div>

        </>

      )}

    </div>

  );

}



function Roteiro() {

  const MODOS = [

    {id:"normal",    icon:"?", label:"Viral",     desc:"Roteiro otimizado para viralizar"},

    {id:"diretor",   icon:"??", label:"Diretor",   desc:"Frame a frame com direção de câmera"},

    {id:"serie",     icon:"??", label:"Série",     desc:"3 episódios com cliffhanger"},

    {id:"ab",        icon:"??", label:"A/B",       desc:"2 versões para testar qual performa mais"},

    {id:"faceless",  icon:"??", label:"Faceless",  desc:"Sem mostrar rosto — narração + imagens"},

    {id:"anuncio",   icon:"??", label:"Anúncio",   desc:"Roteiro de conversão para vender"},

  ];

  const FORMATOS = [

    {id:"curto",    label:"30s", desc:"1 crédito"},

    {id:"medio",    label:"60s", desc:"2 créditos"},

    {id:"longo",    label:"3min",desc:"3 créditos"},

    {id:"completo", label:"5min",desc:"5 créditos"},

  ];

  const NICHOS = ["terror","gaming","finanças","fitness","lifestyle","tech","motivacional","culinária","humor","anime","educacional","empreendedorismo"];

  const PLATAFORMAS = ["TikTok","Instagram","YouTube Shorts","Kwai"];



  const [tema,setTema]         = useState("");

  const [modo,setModo]         = useState("normal");

  const [formato,setFormato]   = useState("medio");

  const [nicho,setNicho]       = useState(loadUserProfile().nicho||"");

  const [plataforma,setPlat]   = useState(loadUserProfile().plataforma||"TikTok");

  const [loading,setLoading]   = useState(false);

  const [progresso,setProg]    = useState(0);

  const [resultado,setResult]  = useState(null);

  const [erro,setErro]         = useState("");

  const [scoreViral,setScore]  = useState(null);

  const [feedbackDado,setFeed] = useState(false);

  const [modeloUsado,setModelo]= useState("");

  const [historico,setHist]    = useState([]);



  // Extrair score do texto

  const extrairScore = (txt) => {

    const m = txt.match(/MÉDIA[:\s]+(\d+(?:[.,]\d+)?)/i) ||

              txt.match(/média[:\s]+(\d+(?:[.,]\d+)?)/i) ||

              txt.match(/(\d+(?:[.,]\d+)?)\/10\s*$/) ;

    return m ? parseFloat(m[1].replace(",",".")) : null;

  };



  const gerarRoteiro = async () => {

    if(!tema.trim()) return;

    setLoading(true); setErro(""); setResult(null); setScore(null); setFeed(false); setProg(0);

    

    // Progresso animado realista

    const etapas = [

      {p:8,  msg:"Pesquisando tendências reais..."},

      {p:20, msg:"Analisando o nicho..."},

      {p:35, msg:"Construindo o hook..."},

      {p:55, msg:"Desenvolvendo o roteiro..."},

      {p:72, msg:"Adicionando virada inesperada..."},

      {p:85, msg:"Calculando score viral..."},

      {p:95, msg:"Finalizando produção..."},

    ];

    let etapaIdx = 0;

    const tick = setInterval(()=>{

      if(etapaIdx < etapas.length) {

        setProg(etapas[etapaIdx].p);

        etapaIdx++;

      }

    }, 1800);



    try {

      const res = await fetch(`${BACKEND}/gerar-roteiro`, {

        method:"POST",

        headers: vortexHeaders(),

        body: JSON.stringify({tema, formato, modo, nicho, canal_id:"default"}),

      });

      clearInterval(tick); setProg(100);

      if(!res.ok){const e=await res.json().catch(()=>({}));throw new Error(e?.detail||`Erro ${res.status}`);}

      const d = await res.json();

      setResult(d.roteiro);

      setModelo(d.modelo||"");

      const sc = extrairScore(d.roteiro);

      setScore(sc);

      // Salvar no histórico local

      setHist(h=>[{tema,modo,formato,score:sc,roteiro:d.roteiro,ts:Date.now()},...h].slice(0,10));

    } catch(e) {

      clearInterval(tick);

      setErro(e.message);

    } finally {

      setLoading(false);

    }

  };



  const scoreColor = scoreViral>=9?"#34d399":scoreViral>=7?"#fbbf24":"#f87171";



  return (

    <div className="page">

      <div className="page-header">

        <div className="eyebrow"><div className="eyebrow-dot"/>IA Creator</div>

        <h1 className="page-title">Gerador de <em>Roteiro</em></h1>

        <p className="page-sub">Roteiros virais com IA — hook, virada e score em segundos.</p>

      </div>



      {/* MODOS */}

      <div className="card" style={{marginBottom:12}}>

        <div className="label" style={{marginBottom:8}}>Tipo de roteiro</div>

        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>

          {MODOS.map(m=>(

            <button key={m.id} onClick={()=>setModo(m.id)}

              style={{padding:"10px 12px",borderRadius:10,textAlign:"left",cursor:"pointer",

                border:`.5px solid ${modo===m.id?"var(--accent)":"var(--border)"}`,

                background:modo===m.id?"rgba(123,47,255,.1)":"var(--bg3)",

                transition:"all .15s"}}>

              <div style={{fontSize:13,fontWeight:600,color:modo===m.id?"var(--text)":"var(--text2)"}}>

                {m.icon} {m.label}

              </div>

              <div style={{fontSize:10,color:"var(--text3)",marginTop:2}}>{m.desc}</div>

            </button>

          ))}

        </div>

      </div>



      {/* TEMA */}

      <div className="card" style={{marginBottom:12}}>

        <div className="field">

          <label className="label">Tema do roteiro</label>

          <textarea className="input" rows={3}

            placeholder={

              modo==="terror"?"Ex: O apartamento que ninguém conseguia alugar por mais de 30 dias...":

              modo==="anuncio"?"Ex: App que dobrou minha renda em 30 dias...":

              "Ex: O experimento psicológico que provou que todos mentem..."

            }

            value={tema} onChange={e=>setTema(e.target.value)}

            disabled={loading}

            onKeyDown={e=>{if(e.key==="Enter"&&e.ctrlKey)gerarRoteiro();}}

          />

          <div style={{fontSize:10,color:"var(--text3)",marginTop:4}}>Ctrl+Enter para gerar</div>

        </div>



        <div className="field">

          <label className="label">Nicho</label>

          <div className="chips">

            {NICHOS.map(n=><button key={n} className={"chip "+(nicho===n?"active":"")} onClick={()=>setNicho(n)}>{n}</button>)}

          </div>

        </div>



        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>

          <div className="field">

            <label className="label">Plataforma</label>

            <div className="chips" style={{flexWrap:"wrap"}}>

              {PLATAFORMAS.map(p=><button key={p} className={"chip "+(plataforma===p?"active":"")} onClick={()=>setPlat(p)}>{p}</button>)}

            </div>

          </div>

          <div className="field">

            <label className="label">Duração</label>

            <div className="chips" style={{flexWrap:"wrap"}}>

              {FORMATOS.map(f=>(

                <button key={f.id} className={"chip "+(formato===f.id?"active":"")} onClick={()=>setFormato(f.id)}>

                  {f.label} <span style={{fontSize:9,opacity:.6}}>{f.desc}</span>

                </button>

              ))}

            </div>

          </div>

        </div>



        {/* Barra de progresso */}

        {loading&&(

          <div style={{marginBottom:12}}>

            <div style={{display:"flex",justifyContent:"space-between",fontSize:11,color:"var(--text3)",marginBottom:6}}>

              <span>

                {progresso<20?"?? Pesquisando tendências...":

                 progresso<40?"?? Construindo o hook...":

                 progresso<60?"?? Desenvolvendo roteiro...":

                 progresso<80?"?? Adicionando virada...":

                 progresso<95?"?? Calculando score viral...":

                 "? Finalizando..."}

              </span>

              <span style={{color:"var(--accent)",fontWeight:700}}>{progresso}%</span>

            </div>

            <div style={{height:6,background:"rgba(123,47,255,.1)",borderRadius:99,overflow:"hidden"}}>

              <div style={{height:"100%",width:progresso+"%",

                background:"linear-gradient(90deg,#7b2fff,#f472b6)",

                borderRadius:99,transition:"width 1.5s ease"}}/>

            </div>

          </div>

        )}



        {erro&&<div className="erro">?? {erro}</div>}



        <button className="btn btn-full" onClick={gerarRoteiro} disabled={loading||!tema.trim()}>

          {loading?<><div className="spinner"/>Gerando roteiro...</>:

           `?? Gerar Roteiro ${modo==="ab"?"A/B":modo==="serie"?"em Série":modo==="diretor"?"Diretor":""} — ${FORMATOS.find(f=>f.id===formato)?.desc||"2 créditos"}`}

        </button>

      </div>



      {/* RESULTADO */}

      {resultado&&(

        <div>

          {/* Score visual */}

          {scoreViral&&(

            <div className="card" style={{marginBottom:12,background:"rgba(123,47,255,.04)",border:`.5px solid ${scoreColor}44`,textAlign:"center"}}>

              <div style={{fontSize:10,color:"var(--text3)",letterSpacing:".1em",marginBottom:4}}>SCORE VIRAL</div>

              <div style={{fontSize:48,fontWeight:800,fontFamily:"var(--fh)",color:scoreColor,lineHeight:1,

                textShadow:`0 0 20px ${scoreColor}66`}}>{scoreViral}</div>

              <div style={{fontSize:11,color:"var(--text3)"}}>/10</div>

              <div style={{fontSize:13,fontWeight:600,color:scoreColor,marginTop:4}}>

                {scoreViral>=9?"?? Potencial viral altíssimo":scoreViral>=7?"? Bom potencial viral":"?? Pode melhorar"}

              </div>

              {modeloUsado&&<div style={{fontSize:10,color:"rgba(123,47,255,.6)",marginTop:6}}>gerado com {modeloUsado}</div>}

            </div>

          )}



          {/* Roteiro completo */}

          <div className="card" style={{marginBottom:12}}>

            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>

              <div className="card-title">?? Roteiro gerado</div>

              <div style={{display:"flex",gap:6}}>

                <button onClick={()=>{navigator.clipboard.writeText(resultado);const b=event.target;b.textContent="? Copiado!";setTimeout(()=>b.textContent="?? Copiar",2000);}}

                  style={{fontSize:11,color:"var(--accent)",background:"rgba(123,47,255,.1)",border:"none",borderRadius:8,padding:"4px 10px",cursor:"pointer"}}>

                  ?? Copiar

                </button>

                <button onClick={()=>setResult(null)}

                  style={{fontSize:11,color:"var(--text3)",background:"rgba(255,255,255,.05)",border:"none",borderRadius:8,padding:"4px 10px",cursor:"pointer"}}>

                  ?

                </button>

              </div>

            </div>

            <div style={{whiteSpace:"pre-wrap",fontSize:13,lineHeight:1.9,color:"var(--text2)",

              fontFamily:"var(--fb)",background:"rgba(255,255,255,.02)",borderRadius:10,

              padding:12,border:".5px solid rgba(255,255,255,.05)"}}>{resultado}</div>

          </div>



          {/* Ações */}

          <div className="card" style={{marginBottom:12}}>

            <div className="card-title" style={{marginBottom:10}}>?? Próximos passos</div>

            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>

              <button className="btn" style={{fontSize:12}} onClick={()=>{setTema(tema+" — versão 2");gerarRoteiro();}}>

                ?? Gerar variação

              </button>

              <button className="btn" style={{fontSize:12}} onClick={()=>{setModo("ab");gerarRoteiro();}}>

                ?? Criar versão A/B

              </button>

              <button className="btn" style={{fontSize:12}} onClick={()=>{setModo("diretor");gerarRoteiro();}}>

                ?? Versão Diretor

              </button>

              <button className="btn" style={{fontSize:12}} onClick={()=>{

                navigator.clipboard.writeText(resultado);

                alert("? Roteiro copiado! Cole no CapCut ou no seu editor.");

              }}>

                ?? Exportar para edição

              </button>

              <button className="btn" style={{fontSize:12,gridColumn:"1/-1"}} onClick={async()=>{

                try{

                  const audioUrl = await aimlTTS(resultado.slice(0,3000),"nova");

                  const a=document.createElement("a");a.href=audioUrl;a.download="narração-vortex.mp3";a.click();

                  alert("? Narração gerada e baixando!");

                } catch(e){alert("TTS: "+e.message);}

              }}>

                ??? Narrar roteiro com IA (AIML TTS)

              </button>

            </div>

          </div>



          {/* Feedback cérebro */}

          {!feedbackDado&&(

            <div className="card" style={{background:"rgba(123,47,255,.04)",border:".5px solid rgba(123,47,255,.15)",marginBottom:12}}>

              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>

                <span style={{fontSize:13,color:"var(--text2)",flex:1}}>?? Esse roteiro foi bom?</span>

              </div>

              <div style={{display:"flex",gap:8}}>

                <button onClick={()=>{

                  fetch(`${BACKEND}/cerebro/feedback`,{method:"POST",

                    headers:{"Content-Type":"application/json"},

                    body:JSON.stringify({tipo:"roteiro",conteudo:resultado,aprovado:true,nicho,score_viral:scoreViral||0,modo,plataforma})});

                  setFeed(true);

                }} className="btn" style={{flex:1,fontSize:13}}>?? Muito bom!</button>

                <button onClick={()=>{

                  fetch(`${BACKEND}/cerebro/feedback`,{method:"POST",

                    headers:{"Content-Type":"application/json"},

                    body:JSON.stringify({tipo:"roteiro",conteudo:resultado,aprovado:false,nicho,score_viral:0,modo,plataforma})});

                  setFeed(true);

                }} className="btn" style={{flex:1,fontSize:13,background:"rgba(255,100,100,.08)",borderColor:"rgba(255,100,100,.2)"}}>

                  ?? Pode melhorar

                </button>

              </div>

            </div>

          )}

          {feedbackDado&&<div style={{textAlign:"center",color:"#34d399",fontSize:13,padding:8}}>? Vortex aprendeu! Próximos roteiros serão melhores.</div>}

        </div>

      )}



      {/* Histórico local */}

      {historico.length>0&&!resultado&&(

        <div className="card">

          <div className="card-title" style={{marginBottom:10}}>?? Histórico desta sessão</div>

          {historico.map((h,i)=>(

            <div key={i} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 0",

              borderBottom:i<historico.length-1?".5px solid var(--border)":"none",cursor:"pointer"}}

              onClick={()=>setResult(h.roteiro)}>

              <div style={{flex:1}}>

                <div style={{fontSize:12,fontWeight:600,color:"var(--text)"}}>{h.tema.slice(0,50)}</div>

                <div style={{fontSize:10,color:"var(--text3)"}}>{h.modo} · {h.formato}</div>

              </div>

              {h.score&&<div style={{fontSize:13,fontWeight:700,color:"#34d399"}}>{h.score}/10</div>}

            </div>

          ))}

        </div>

      )}

    </div>

  );

}





function Tendencias() {

  const [aba,setAba]=useState("google"); // google | nicho | global

  const [nicho,setNicho]=useState("terror");

  const [plataforma,setPlataforma]=useState("TikTok");

  const [loading,setLoading]=useState(false);

  const [dados,setDados]=useState(null);

  const [erro,setErro]=useState("");

  const [googleTrends,setGoogleTrends]=useState([]);

  const [loadingGoogle,setLoadingGoogle]=useState(true);

  const profile=loadUserProfile();



  // Google Trends — carrega automático

  useEffect(()=>{

    setLoadingGoogle(true);

    fetch(`${BACKEND}/tendencias?plataforma=TikTok&nicho=`+(profile.nicho||""))

      .then(r=>r.json())

      .then(d=>{

        if(d.tendencias) setGoogleTrends(d.tendencias);

        else if(d.google_trends) setGoogleTrends(d.google_trends);

      })

      .catch(()=>{})

      .finally(()=>setLoadingGoogle(false));

  },[]);



  const buscar=async()=>{

    setErro("");setDados(null);setLoading(true);

    try{

      if(aba==="nicho"){

        const r=await callClaude(

          "Especialista em tendências virais de redes sociais. Responda em português.",

          `Liste as top 8 tendências de conteúdo para ${nicho} no ${plataforma} em 2026. Para cada: nome, por que viraliza, dica prática de uso. Responda SOMENTE JSON: {"tendencias":[{"nome":"...","motivo":"...","dica":"...","emoji":"..."}]}`

        );

        const clean=r.replace(/\`\`\`json|\`\`\`/g,"").trim();

        const p=JSON.parse(clean);

        setDados({tipo:"nicho",nicho,plataforma,lista:p.tendencias||[]});

      } else {

        const res=await fetch(`${BACKEND}/tendencias?nicho=`+nicho+"&plataforma="+plataforma);

        const d=await res.json();

        setDados({tipo:"api",lista:d.tendencias||d.google_trends||[]});

      }

    }catch(e){setErro("Erro ao buscar: "+e.message);}

    finally{setLoading(false);}

  };



  const NICHOS=["terror","gaming","finanças","fitness","lifestyle","tech","motivacional","culinária","humor","anime"];

  const PLATS=["TikTok","Instagram","YouTube","Kwai"];



  return(

    <div className="page">

      <div className="page-header">

        <div className="eyebrow"><div className="eyebrow-dot"/>2026</div>

        <h1 className="page-title">Tendências <em>Virais</em></h1>

        <p className="page-sub">Google Trends em tempo real + análise por nicho.</p>

        <div style={{display:"inline-flex",alignItems:"center",gap:6,marginTop:6,

          background:"rgba(52,211,153,.1)",border:".5px solid rgba(52,211,153,.3)",

          borderRadius:20,padding:"4px 12px"}}>

          <span style={{fontSize:12}}>?</span>

          <span style={{fontSize:11,color:"#34d399",fontWeight:600}}>Grátis e ilimitado — disponível em todos os planos</span>

        </div>

      </div>



      {/* Abas internas */}

      <div style={{display:"flex",gap:6,marginBottom:16,background:"rgba(255,255,255,.04)",borderRadius:12,padding:4}}>

        {[

          {id:"google",icon:"??",label:"Viral Agora"},

          {id:"nicho",icon:"??",label:"Por Nicho"},

          {id:"global",icon:"??",label:"Tendência Global"},

        ].map(t=>(

          <button key={t.id} onClick={()=>{setAba(t.id);setDados(null);}}

            style={{flex:1,padding:"8px 4px",borderRadius:9,border:"none",cursor:"pointer",fontSize:12,fontWeight:600,

              background:aba===t.id?"rgba(123,47,255,.25)":"transparent",

              color:aba===t.id?"#c4a0ff":"#4a4470",

              transition:"all .18s"

            }}>

            {t.icon} {t.label}

          </button>

        ))}

      </div>



      {/* ABA: VIRAL AGORA (Google Trends) */}

      {aba==="google"&&(

        <div>

          <div className="card" style={{marginBottom:12}}>

            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>

              <div className="card-title">?? Viral no Brasil Agora</div>

              <span style={{fontSize:10,color:"#34d399",background:"rgba(52,211,153,.1)",border:".5px solid rgba(52,211,153,.3)",padding:"2px 8px",borderRadius:20}}>Google Trends</span>

            </div>

            {loadingGoogle?(

              <div style={{display:"flex",gap:8,alignItems:"center",color:"var(--text3)",fontSize:13}}>

                <div className="spinner"/><span>Buscando trends em tempo real...</span>

              </div>

            ):googleTrends.length>0?(

              <div style={{display:"flex",flexDirection:"column",gap:6}}>

                {googleTrends.map((t,i)=>{

                  const nome=typeof t==="object"?t.titulo||t.nome||String(t):String(t);

                  const dica=typeof t==="object"?t.dica||t.descricao||"":""

                  return(

                    <div key={i} style={{display:"flex",alignItems:"center",gap:12,padding:"10px 12px",

                      background:"rgba(255,255,255,.03)",borderRadius:10,

                      border:".5px solid rgba(123,47,255,.08)"}}>

                      <span style={{fontFamily:"var(--fh)",fontWeight:800,color:"#7b2fff",fontSize:15,minWidth:24}}>#{i+1}</span>

                      <div style={{flex:1}}>

                        <div style={{fontSize:13,fontWeight:600,color:"var(--text)"}}>{nome}</div>

                        {dica&&<div style={{fontSize:11,color:"var(--text3)",marginTop:2}}>?? {dica}</div>}

                      </div>

                      <span style={{fontSize:10,color:"#f472b6",background:"rgba(244,114,182,.08)",

                        padding:"2px 7px",borderRadius:20,fontWeight:700}}>VIRAL</span>

                    </div>

                  );

                })}

              </div>

            ):(

              <div style={{color:"var(--text3)",fontSize:13,textAlign:"center",padding:16}}>

                Nenhuma trend encontrada. Tente novamente.

              </div>

            )}

          </div>

          <div className="card">

            <div className="card-title" style={{marginBottom:10}}>?? Filtrar por nicho</div>

            <div className="chips" style={{marginBottom:10}}>

              {NICHOS.map(n=><button key={n} className={"chip "+(nicho===n?"active":"")} onClick={()=>setNicho(n)}>{n}</button>)}

            </div>

            <button className="btn btn-full" onClick={buscar} disabled={loading}>

              {loading?<><div className="spinner"/>Buscando...</>:"?? Buscar trends deste nicho"}

            </button>

            {erro&&<div className="erro">? {erro}</div>}

          </div>

        </div>

      )}



      {/* ABA: POR NICHO */}

      {aba==="nicho"&&(

        <div>

          <div className="card" style={{marginBottom:12}}>

            <div className="field">

              <label className="label">Nicho</label>

              <div className="chips">{NICHOS.map(n=><button key={n} className={"chip "+(nicho===n?"active":"")} onClick={()=>setNicho(n)}>{n}</button>)}</div>

            </div>

            <div className="field">

              <label className="label">Plataforma</label>

              <div className="chips">{PLATS.map(p=><button key={p} className={"chip "+(plataforma===p?"active":"")} onClick={()=>setPlataforma(p)}>{p}</button>)}</div>

            </div>

            {erro&&<div className="erro">? {erro}</div>}

            <button className="btn btn-full" onClick={buscar} disabled={loading}>

              {loading?<><div className="spinner"/>Analisando...</>:"?? Ver top 8 tendências"}

            </button>

          </div>



          {dados?.tipo==="nicho"&&dados.lista&&(

            <div className="card">

              <div className="card-title" style={{marginBottom:12}}>

                Top 8 — {dados.nicho} no {dados.plataforma}

              </div>

              {dados.lista.map((t,i)=>(

                <div key={i} style={{display:"flex",alignItems:"flex-start",gap:12,padding:"12px 0",

                  borderBottom:".5px solid var(--border)"}}>

                  <span style={{fontFamily:"var(--fh)",fontWeight:800,color:"#7b2fff",fontSize:"1.1rem",minWidth:24}}>

                    {t.emoji||"??"} {i+1}

                  </span>

                  <div>

                    <div style={{fontSize:14,fontWeight:600,color:"var(--text)",marginBottom:3}}>{t.nome}</div>

                    <div style={{fontSize:13,color:"var(--text2)",lineHeight:1.5}}>{t.motivo}</div>

                    {t.dica&&<div style={{fontSize:12,color:"var(--cyan)",marginTop:4}}>?? {t.dica}</div>}

                  </div>

                </div>

              ))}

            </div>

          )}

        </div>

      )}



      {/* ABA: GLOBAL */}

      {aba==="global"&&(

        <div>

          <div className="card" style={{marginBottom:12}}>

            <div className="field">

              <label className="label">Nicho</label>

              <div className="chips">{NICHOS.map(n=><button key={n} className={"chip "+(nicho===n?"active":"")} onClick={()=>setNicho(n)}>{n}</button>)}</div>

            </div>

            <div className="field">

              <label className="label">Plataforma</label>

              <div className="chips">{PLATS.map(p=><button key={p} className={"chip "+(plataforma===p?"active":"")} onClick={()=>setPlataforma(p)}>{p}</button>)}</div>

            </div>

            {erro&&<div className="erro">? {erro}</div>}

            <button className="btn btn-full" onClick={buscar} disabled={loading}>

              {loading?<><div className="spinner"/>Buscando...</>:"?? Ver tendência global"}

            </button>

          </div>

          {dados?.lista&&(

            <div className="card">

              <div className="card-title" style={{marginBottom:12}}>?? Tendências Globais</div>

              {dados.lista.map((t,i)=>{

                const nome=typeof t==="object"?t.titulo||t.nome||String(t):String(t);

                const desc=typeof t==="object"?t.descricao||t.dica||"":"";

                return(

                  <div key={i} style={{display:"flex",gap:12,padding:"10px 0",borderBottom:".5px solid var(--border)"}}>

                    <span style={{color:"#9d5cff",fontWeight:800,minWidth:24}}>#{i+1}</span>

                    <div>

                      <div style={{fontSize:13,fontWeight:600,color:"var(--text)"}}>{nome}</div>

                      {desc&&<div style={{fontSize:12,color:"var(--text3)",marginTop:2}}>{desc}</div>}

                    </div>

                  </div>

                );

              })}

            </div>

          )}

        </div>

      )}

    </div>

  );

}





function PlaceholderPage({ title, icon, desc }) {

  return(<div className="page"><div className="page-header"><h1 className="page-title"><em>{title}</em></h1><p className="page-sub">{desc}</p></div><div className="card" style={{textAlign:"center",padding:"3rem 1.5rem"}}><div style={{fontSize:48,marginBottom:"1.25rem"}}>{icon}</div><p style={{fontSize:14,color:"var(--text2)",lineHeight:1.6}}>Em breve disponível.</p></div></div>);

}



// ==============================

const LAUNCH_DATE = new Date("2026-07-15T00:00:00-03:00");

const PROMO_END   = new Date("2026-08-15T00:00:00-03:00");



const PLANO_FREE = {

  id:"free", nome:"Free", emoji:"??", desc:"Experimenta sem pagar",

  creditos:50, imgs:5, vids:0, voz:false,

  preco_mensal:0, preco_anual:0, cor:"#34d399",

  features:[

    "50 créditos grátis",

    "?? Tendências em tempo real — ILIMITADO",

    "? Score Viral — ILIMITADO",

    "Chat com IA (10x/dia)",

    "3 roteiros por dia",

    "5 imagens por mês",

  ],

  modelo:"Gemini Flash",

  limites:{roteiros_dia:3, chat_dia:10, imagens_mes:5, sem_video:true, sem_voz:true}

};



const PLANOS_BASE = [

  { id:"starter", nome:"Starter", emoji:"?", desc:"Para começar",

    creditos:250, imgs:25, vids:4, voz:false,

    promo:9, normal:19, cor:"#fbbf24", anim:"estrelas", animLabel:"? Estrelas",

    preco_mensal:9, preco_anual:7, creditos_anual:300,

    features:["250 créditos/mês","25 imagens IA","4 vídeos","Roteiros ilimitados","Chat com Gemini"],

    modelo:"Gemini Flash"

  },

  { id:"creator", nome:"Creator", emoji:"??", desc:"Postar todo dia",

    creditos:900, imgs:90, vids:12, voz:true,

    promo:27, normal:49, cor:"#22d3ee", anim:"galaxia", animLabel:"?? Galáxia", popular:true,

    preco_mensal:27, preco_anual:22, creditos_anual:1100,

    features:["900 créditos/mês","90 imagens IA","12 vídeos","Clonagem de voz","Chat com GPT-4o","Score Viral","Tendências em tempo real"],

    modelo:"GPT-4o via AIML"

  },

  { id:"pro", nome:"Pro", emoji:"???", desc:"Alto volume",

    creditos:2500, imgs:250, vids:35, voz:true,

    promo:57, normal:99, cor:"#9d5cff", anim:"buraco", animLabel:"??? Buraco Negro",

    preco_mensal:57, preco_anual:47, creditos_anual:3000,

    features:["2.500 créditos/mês","250 imagens IA","35 vídeos","Clonagem de voz","Chat com Claude Haiku","Análise de perfil avançada","Memória do Vortex","Suporte prioritário"],

    modelo:"Claude Haiku"

  },

  { id:"elite", nome:"Elite", emoji:"?", desc:"Sem preocupação",

    creditos:8000, imgs:800, vids:120, voz:true,

    promo:97, normal:199, cor:"#f472b6", anim:"portal", animLabel:"? Portal Cósmico",

    preco_mensal:97, preco_anual:80, creditos_anual:10000,

    features:["8.000 créditos/mês","800 imagens IA","120 vídeos","Clonagem de voz premium","Chat com Claude Sonnet","Todos os recursos","API própria (em breve)","Suporte VIP 24h"],

    modelo:"Claude Sonnet"

  },

];



const PACKS = [

  {

    id:"basico", nome:"Pack Básico", emoji:"?", creditos:500,

    promo:15, normal:19, cor:"#fbbf24",

    desc:"Ideal para testar mais — sem prazo de validade",

    features:["500 créditos extras","Sem expiração","~50 roteiros ou 100 imagens"],

  },

  {

    id:"pro", nome:"Pack Pro", emoji:"??", creditos:2000,

    promo:45, normal:59, cor:"#9d5cff", popular:true,

    desc:"Melhor custo-benefício — 22% mais barato por crédito",

    features:["2.000 créditos extras","Sem expiração","~200 roteiros ou 400 imagens"],

  },

  {

    id:"max", nome:"Pack Max", emoji:"??", creditos:5000,

    promo:89, normal:119, cor:"#f472b6",

    desc:"Para quem cria muito — 40% mais barato por crédito",

    features:["5.000 créditos extras","Sem expiração","~500 roteiros ou 1.000 imagens"],

  },

];



// ==============================

function ChatBgCanvas({ anim }) {

  const cvRef = useRef(null);

  useEffect(()=>{

    const cv = cvRef.current; if(!cv) return;

    const cx = cv.getContext("2d");

    cv.width = cv.offsetWidth||800; cv.height = cv.offsetHeight||600;

    const W=cv.width,H=cv.height,rand=(a,b)=>Math.random()*(b-a)+a;

    let raf,t=0;



    if(anim==="estrelas"){

      const stars=Array.from({length:180},()=>({x:rand(0,W),y:rand(0,H),r:rand(.2,1.2),a:rand(.2,.7),phase:rand(0,Math.PI*2),speed:rand(.3,.7),color:Math.random()<.1?"#fbbf24":Math.random()<.08?"#c4b5fd":"#fff"}));

      const shoots=[];

      const si=setInterval(()=>shoots.push({x:rand(0,W*.8),y:rand(0,H*.4),len:rand(40,90),angle:rand(.2,.6),speed:rand(5,9),life:1,decay:rand(.025,.04)}),3500);

      const draw=()=>{

        cx.clearRect(0,0,W,H);t+=.016;

        stars.forEach(s=>{const tw=s.a*(.4+.6*Math.sin(t*s.speed+s.phase));cx.beginPath();cx.arc(s.x,s.y,s.r,0,Math.PI*2);cx.fillStyle=s.color;cx.globalAlpha=tw*.7;cx.fill();});

        cx.globalAlpha=1;

        for(let i=shoots.length-1;i>=0;i--){const s=shoots[i];const g=cx.createLinearGradient(s.x,s.y,s.x+Math.cos(s.angle)*s.len,s.y+Math.sin(s.angle)*s.len);g.addColorStop(0,"rgba(255,255,255,0)");g.addColorStop(.5,`rgba(251,191,36,${s.life*.6})`);g.addColorStop(1,"rgba(255,255,255,0)");cx.beginPath();cx.moveTo(s.x,s.y);cx.lineTo(s.x+Math.cos(s.angle)*s.len,s.y+Math.sin(s.angle)*s.len);cx.strokeStyle=g;cx.lineWidth=1;cx.stroke();s.x+=Math.cos(s.angle)*s.speed;s.y+=Math.sin(s.angle)*s.speed;s.life-=s.decay;if(s.life<=0)shoots.splice(i,1);}

        raf=requestAnimationFrame(draw);

      };

      draw();

      return()=>{cancelAnimationFrame(raf);clearInterval(si);};

    }



    if(anim==="galaxia"){

      const CX=W*.7,CY=H*.3;

      const stars=Array.from({length:140},()=>({x:rand(0,W),y:rand(0,H),r:rand(.2,1),a:rand(.15,.6),phase:rand(0,Math.PI*2),speed:rand(.2,.6)}));

      const spiral=Array.from({length:260},(_,i)=>{const a=i*.18,r=i*.5;return{angle:a,r,size:rand(.5,2),color:i%3===0?"#7b2fff":i%3===1?"#9d5cff":"#22d3ee",speed:rand(.0015,.004)*(r<50?1.5:1),alpha:Math.min(1,r/40)*.65};});

      const draw=()=>{

        cx.clearRect(0,0,W,H);t+=.016;

        stars.forEach(s=>{const tw=s.a*(.4+.6*Math.sin(t*s.speed+s.phase));cx.beginPath();cx.arc(s.x,s.y,s.r,0,Math.PI*2);cx.fillStyle="#fff";cx.globalAlpha=tw*.5;cx.fill();});

        cx.globalAlpha=1;

        const ng=cx.createRadialGradient(CX,CY,0,CX,CY,100);ng.addColorStop(0,"rgba(123,47,255,.14)");ng.addColorStop(1,"rgba(0,0,0,0)");cx.beginPath();cx.arc(CX,CY,100,0,Math.PI*2);cx.fillStyle=ng;cx.fill();

        spiral.forEach(p=>{p.angle+=p.speed;const sx=CX+Math.cos(p.angle)*p.r,sy=CY+Math.sin(p.angle)*p.r*.4;cx.beginPath();cx.arc(sx,sy,p.size,0,Math.PI*2);cx.fillStyle=p.color;cx.globalAlpha=p.alpha*(.6+.4*Math.sin(t*2+p.angle));cx.fill();});

        cx.globalAlpha=1;raf=requestAnimationFrame(draw);

      };

      draw();

      return()=>cancelAnimationFrame(raf);

    }



    if(anim==="buraco"){

      const CX=W*.65,CY=H*.3,R=32;

      const stars=Array.from({length:160},()=>({x:rand(0,W),y:rand(0,H),r:rand(.2,1),a:rand(.2,.6),phase:rand(0,Math.PI*2),speed:rand(.3,.7)}));

      const disk=Array.from({length:120},()=>{const side=Math.random()<.5?1:-1;const dist=rand(R+5,R+65);const tt=Math.random();return{angle:rand(0,Math.PI*2),dist,speed:rand(.006,.018)*(dist<R+25?1.5:1)*side,r:rand(.5,2),alpha:rand(.4,.9),phase:rand(0,Math.PI*2),color:tt<.4?"rgba(255,150,50,":"rgba(123,47,255,"};});

      const draw=()=>{

        cx.clearRect(0,0,W,H);t+=.016;

        stars.forEach(s=>{const tw=s.a*(.45+.55*Math.sin(t*s.speed+s.phase));cx.beginPath();cx.arc(s.x,s.y,s.r,0,Math.PI*2);cx.fillStyle="#fff";cx.globalAlpha=tw*.55;cx.fill();});

        cx.globalAlpha=1;

        const lg=cx.createRadialGradient(CX,CY,R,CX,CY,R*3.5);lg.addColorStop(0,"rgba(123,47,255,.18)");lg.addColorStop(1,"rgba(0,0,0,0)");cx.beginPath();cx.arc(CX,CY,R*3.5,0,Math.PI*2);cx.fillStyle=lg;cx.fill();

        cx.save();cx.translate(CX,CY);cx.scale(1,.3);const db=cx.createRadialGradient(0,0,R,0,0,R+65);db.addColorStop(0,"rgba(255,160,50,.5)");db.addColorStop(.3,"rgba(200,80,255,.35)");db.addColorStop(1,"rgba(0,0,0,0)");cx.beginPath();cx.arc(0,0,R+65,Math.PI,Math.PI*2);cx.fillStyle=db;cx.globalAlpha=.8;cx.fill();cx.restore();

        disk.forEach(p=>{p.angle+=p.speed;const ex=CX+Math.cos(p.angle)*p.dist,ey=CY+Math.sin(p.angle)*p.dist*.3;if(Math.sin(p.angle)<0){const f=p.alpha*(.7+.3*Math.sin(t*3+p.phase));cx.beginPath();cx.arc(ex,ey,p.r,0,Math.PI*2);cx.fillStyle=p.color+f+")";cx.globalAlpha=1;cx.fill();}});

        const sh=cx.createRadialGradient(CX,CY,0,CX,CY,R*1.05);sh.addColorStop(0,"rgba(4,4,12,1)");sh.addColorStop(.75,"rgba(4,4,12,1)");sh.addColorStop(1,"rgba(4,4,12,0)");cx.beginPath();cx.arc(CX,CY,R*1.1,0,Math.PI*2);cx.fillStyle=sh;cx.fill();

        cx.save();cx.translate(CX,CY);cx.scale(1,.3);const df=cx.createRadialGradient(0,0,R,0,0,R+65);df.addColorStop(0,"rgba(255,200,80,.85)");df.addColorStop(.2,"rgba(255,120,40,.7)");df.addColorStop(.4,"rgba(200,80,255,.5)");df.addColorStop(1,"rgba(0,0,0,0)");cx.beginPath();cx.arc(0,0,R+65,0,Math.PI);cx.fillStyle=df;cx.globalAlpha=1;cx.fill();cx.restore();

        disk.forEach(p=>{const ex=CX+Math.cos(p.angle)*p.dist,ey=CY+Math.sin(p.angle)*p.dist*.3;if(Math.sin(p.angle)>=0){const f=p.alpha*(.7+.3*Math.sin(t*3+p.phase));cx.beginPath();cx.arc(ex,ey,p.r,0,Math.PI*2);cx.fillStyle=p.color+f+")";cx.globalAlpha=1;cx.fill();}});

        const ig=cx.createRadialGradient(CX,CY,R*.6,CX,CY,R*1.05);ig.addColorStop(0,"rgba(0,0,0,0)");ig.addColorStop(1,"rgba(180,120,255,.3)");cx.beginPath();cx.arc(CX,CY,R*1.05,0,Math.PI*2);cx.fillStyle=ig;cx.fill();cx.globalAlpha=1;

        raf=requestAnimationFrame(draw);

      };

      draw();

      return()=>cancelAnimationFrame(raf);

    }



    if(anim==="portal"){

      const CX=W*.62,CY=H*.28;

      const stars=Array.from({length:180},()=>({x:rand(0,W),y:rand(0,H),r:rand(.2,1.2),a:rand(.2,.7),phase:rand(0,Math.PI*2),speed:rand(.3,.8),color:Math.random()<.12?"#f472b6":Math.random()<.1?"#c4a0ff":"#fff"}));

      const rings=Array.from({length:5},(_,i)=>({r:25+i*18,speed:.008-i*.001,angle:i*.4,alpha:.55-i*.08}));

      const particles=Array.from({length:70},()=>({angle:rand(0,Math.PI*2),r:rand(18,130),speed:rand(.004,.014)*(Math.random()<.5?1:-1),size:rand(.5,2.2),color:Math.random()<.5?"#7b2fff":Math.random()<.5?"#f472b6":"#c4a0ff",alpha:rand(.4,1)}));

      const rays=Array.from({length:10},(_,i)=>({angle:i/10*Math.PI*2,len:rand(50,110),width:rand(.5,1.8),alpha:rand(.1,.35)}));

      const draw=()=>{

        cx.clearRect(0,0,W,H);t+=.016;

        stars.forEach(s=>{const tw=s.a*(.4+.6*Math.sin(t*s.speed+s.phase));cx.beginPath();cx.arc(s.x,s.y,s.r,0,Math.PI*2);cx.fillStyle=s.color;cx.globalAlpha=tw*.65;cx.fill();});

        cx.globalAlpha=1;

        const og=cx.createRadialGradient(CX,CY,0,CX,CY,160);og.addColorStop(0,"rgba(123,47,255,.12)");og.addColorStop(.3,"rgba(244,114,182,.06)");og.addColorStop(1,"rgba(0,0,0,0)");cx.beginPath();cx.arc(CX,CY,160,0,Math.PI*2);cx.fillStyle=og;cx.fill();

        rays.forEach(ray=>{const a=ray.angle+t*.3;const rg=cx.createLinearGradient(CX,CY,CX+Math.cos(a)*ray.len,CY+Math.sin(a)*ray.len);rg.addColorStop(0,`rgba(196,160,255,${ray.alpha})`);rg.addColorStop(1,"rgba(0,0,0,0)");cx.beginPath();cx.moveTo(CX,CY);cx.lineTo(CX+Math.cos(a)*ray.len,CY+Math.sin(a)*ray.len);cx.strokeStyle=rg;cx.lineWidth=ray.width;cx.globalAlpha=.6+.4*Math.sin(t*2+ray.angle);cx.stroke();});

        cx.globalAlpha=1;

        rings.forEach(ring=>{ring.angle+=ring.speed;cx.beginPath();cx.arc(CX,CY,ring.r,0,Math.PI*2);cx.strokeStyle=`rgba(196,160,255,${ring.alpha*(0.6+0.4*Math.sin(t*1.5+ring.angle))})`;cx.lineWidth=.7;cx.stroke();});

        particles.forEach(p=>{p.angle+=p.speed;const px=CX+Math.cos(p.angle)*p.r,py=CY+Math.sin(p.angle)*p.r;cx.beginPath();cx.arc(px,py,p.size,0,Math.PI*2);cx.fillStyle=p.color;cx.globalAlpha=p.alpha*(.5+.5*Math.sin(t*2+p.angle));cx.fill();});

        const cg=cx.createRadialGradient(CX,CY,0,CX,CY,22);cg.addColorStop(0,"rgba(255,220,255,.85)");cg.addColorStop(.3,"rgba(196,160,255,.5)");cg.addColorStop(1,"rgba(0,0,0,0)");cx.beginPath();cx.arc(CX,CY,22,0,Math.PI*2);cx.fillStyle=cg;cx.globalAlpha=1;cx.fill();

        const cd=cx.createRadialGradient(CX,CY,0,CX,CY,11);cd.addColorStop(0,"rgba(3,3,11,1)");cd.addColorStop(1,"rgba(3,3,11,0)");cx.beginPath();cx.arc(CX,CY,11,0,Math.PI*2);cx.fillStyle=cd;cx.fill();cx.globalAlpha=1;

        raf=requestAnimationFrame(draw);

      };

      draw();

      return()=>cancelAnimationFrame(raf);

    }

  },[anim]);



  return <canvas ref={cvRef} style={{position:"absolute",inset:0,width:"100%",height:"100%",pointerEvents:"none",opacity:.5}}/>;

}









function GeradorImagens() {

  const ESTILOS = [

    { id:"realista", label:"?? Realista", prompt:"photorealistic, professional photography, 8k" },

    { id:"cinematico", label:"?? Cinematográfico", prompt:"cinematic, movie scene, dramatic lighting" },

    { id:"anime", label:"?? Anime", prompt:"anime style, vibrant colors, manga art" },

    { id:"dark", label:"?? Dark", prompt:"dark atmosphere, moody, gothic, dramatic shadows" },

    { id:"cartoon", label:"?? Cartoon", prompt:"cartoon style, bold colors, illustrated" },

    { id:"3d", label:"?? 3D", prompt:"3D render, octane render, highly detailed" },

  ];

  const MODELOS_IMG = [

    // Grátis

    { id:"pollinations",   nome:"?? Pollinations",      desc:"Ilimitado • Grátis",     creditos:0, cor:"#10B981", endpoint:"pollinations", free:true, grupo:"Grátis" },

    { id:"hf_flux",        nome:"?? FLUX Schnell HF",   desc:"HuggingFace • Grátis",   creditos:0, cor:"#F59E0B", endpoint:"hf_flux",      free:true, grupo:"Grátis" },

    { id:"gemini",         nome:"?? Nano Banana Pro",   desc:"Google • Grátis",        creditos:0, cor:"#4285F4", endpoint:"gemini",       free:true, grupo:"Grátis" },

    // AIML — usa créditos da sua key

    { id:"aiml_flux_schnell",nome:"? FLUX Schnell AIML", desc:"AIML • Rápido",        creditos:5, cor:"#7b2fff", endpoint:"aiml_flux",    aiml:true, grupo:"AIML" },

    { id:"aiml_flux_dev",    nome:"?? FLUX Dev AIML",    desc:"AIML • Alta qualidade", creditos:10, cor:"#9d5cff", endpoint:"aiml_flux_dev",aiml:true, grupo:"AIML" },

    { id:"aiml_gpt_image",   nome:"??? GPT Image 1.5",   desc:"AIML • OpenAI premium", creditos:10, cor:"#f472b6", endpoint:"aiml_gpt",     aiml:true, grupo:"AIML" },

    // FAL premium — créditos calculados com margem de segurança real

    { id:"flux_dev",  nome:"Flux Dev",        desc:"FAL • Thumbnails",      creditos:10,  cor:"#7C3AED", endpoint:"flux-dev",  grupo:"FAL", plano_min:"creator" },

    { id:"ideogram",  nome:"Ideogram v2 ?",  desc:"FAL • Texto em imagem", creditos:25, cor:"#F59E0B", endpoint:"ideogram",  grupo:"FAL", plano_min:"pro" },

    { id:"stability", nome:"Stability Ultra", desc:"FAL • Ultra realista",  creditos:20, cor:"#EF4444", endpoint:"stability", grupo:"FAL", plano_min:"pro" },

  ];



  const [prompt,setPrompt]=useState("");

  const [modelo,setModelo]=useState(MODELOS_IMG[0]);

  const [estilo,setEstilo]=useState(null);

  const [loading,setLoading]=useState(false);

  const [progresso,setProgresso]=useState(0);

  const [resultado,setResultado]=useState(null);

  const [erro,setErro]=useState("");

  const [abrirEditor,setAbrirEditor]=useState(false);

  const [modeloAtual,setModeloAtual]=useState("");



  const gerar=async()=>{

    if(!prompt.trim())return;

    setLoading(true);setErro("");setResultado(null);setProgresso(0);

    const tick=setInterval(()=>setProgresso(p=>p<90?p+Math.random()*10:p),600);

    try{

      const promptFinal = estilo ? `${prompt}, ${estilo.prompt}` : prompt;

      const isFree = modelo.free === true;

      const endpointUrl = isFree

        ? `${BACKEND}/gerar-imagem-free`

        : `${BACKEND}/gerar-imagem-free`;

      const res=await fetch(endpointUrl,{

        method:"POST",headers:{"Content-Type":"application/json"},

        body:JSON.stringify({prompt:promptFinal, modelo:modelo.id})

      });

      clearInterval(tick);

      if(!res.ok){const e=await res.json().catch(()=>({}));throw new Error(e?.detail||`Erro ${res.status}`);}

      const d=await res.json();

      setProgresso(100);setResultado(d.imagem);

    }catch(e){clearInterval(tick);setErro(e.message);}

    finally{setLoading(false);}

  };



  return(

    <div className="page">

      <div className="page-header">

        <div className="eyebrow"><div className="eyebrow-dot"/>IA & Criação</div>

        <h1 className="page-title">Gerador de Imagens</h1>

        <p className="page-sub">Crie thumbnails virais em segundos</p>

      </div>



      {/* Galeria de imagens REAIS */}

      <div style={{marginBottom:"1rem"}}>

        <div style={{fontSize:12,color:"var(--text3)",marginBottom:8,display:"flex",alignItems:"center",justifyContent:"space-between"}}>

          <div style={{display:"flex",alignItems:"center",gap:6}}>

            <span style={{width:6,height:6,borderRadius:"50%",background:"#7C3AED",display:"inline-block"}}/>

            Gerado com Vortex — clique para copiar o prompt

          </div>

          <span style={{fontSize:10,color:"#7C3AED",fontWeight:600}}>? 8 exemplos</span>

        </div>

        <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:6}}>

          {[

            {img:"https://picsum.photos/seed/terror1/300/200",tag:"Terror",tagCor:"#ef4444",titulo:"A Noite Que Mudou Tudo",sub:"True crime • 2.3M views",prompt:"homem sozinho em corredor escuro, sombra ameaçadora, terror psicológico, cinematográfico, thumbnail viral"},

            {img:"https://picsum.photos/seed/gaming2/300/200",tag:"Gaming",tagCor:"#3b82f6",titulo:"Level Impossível",sub:"FPS gameplay • 4.1M views",prompt:"personagem de game em batalha épica, explosões neon, thumbnail viral gaming TikTok"},

            {img:"https://picsum.photos/seed/crypto3/300/200",tag:"Finanças",tagCor:"#f59e0b",titulo:"R$50k em 30 Dias",sub:"Crypto • 1.8M views",prompt:"homem surpreso com gráfico de crypto explodindo, dinheiro, thumbnail viral finanças"},

            {img:"https://picsum.photos/seed/sunrise4/300/200",tag:"Lifestyle",tagCor:"#10b981",titulo:"Acordei às 4h por 30d",sub:"Motivacional • 3.5M views",prompt:"silhueta dramática ao nascer do sol, céu laranja e roxo, motivacional, thumbnail viral"},

            {img:"https://picsum.photos/seed/anime5/300/200",tag:"Anime",tagCor:"#ec4899",titulo:"Protagonista Épico",sub:"Edit • 5.2M views",prompt:"personagem anime em pose épica com aura de poder, estilo Jujutsu Kaisen, thumbnail viral"},

            {img:"https://picsum.photos/seed/dark6/300/200",tag:"Dark Art",tagCor:"#6b7280",titulo:"Segredo Sombrio",sub:"Mistério • 2.8M views",prompt:"rosto misterioso emergindo das sombras, luz dramática, atmosfera dark cinematográfica"},

            {img:"https://picsum.photos/seed/tech7/300/200",tag:"Tech",tagCor:"#06b6d4",titulo:"IA vai te substituir",sub:"Tecnologia • 6.1M views",prompt:"robô futurista com IA, código holográfico, estética cyberpunk, thumbnail viral tech"},

            {img:"https://picsum.photos/seed/fitness8/300/200",tag:"Fitness",tagCor:"#f97316",titulo:"Transformação 90 dias",sub:"Fitness • 4.4M views",prompt:"transformação física dramática, luz intensa de academia, silhueta musculosa, thumbnail fitness"},

          ].map((ex,i)=>(

            <div key={i} onClick={()=>setPrompt(ex.prompt)}

              style={{borderRadius:12,overflow:"hidden",cursor:"pointer",position:"relative",height:95,border:"1px solid rgba(255,255,255,.08)",transition:"all .25s"}}

              onMouseEnter={e=>{e.currentTarget.style.transform="scale(1.03)";e.currentTarget.style.border=`1px solid ${ex.tagCor}77`;e.currentTarget.style.boxShadow=`0 6px 24px ${ex.tagCor}33`;}}

              onMouseLeave={e=>{e.currentTarget.style.transform="scale(1)";e.currentTarget.style.border="1px solid rgba(255,255,255,.08)";e.currentTarget.style.boxShadow="none";}}>

              {/* Imagem real */}

              <img src={ex.img} alt={ex.titulo} style={{width:"100%",height:"100%",objectFit:"cover",position:"absolute",top:0,left:0}}/>

              {/* Overlay escuro */}

              <div style={{position:"absolute",inset:0,background:"linear-gradient(to top,rgba(0,0,0,.92) 0%,rgba(0,0,0,.3) 50%,transparent 100%)"}}/>

              {/* Tag */}

              <div style={{position:"absolute",top:7,left:8,background:`${ex.tagCor}cc`,borderRadius:6,padding:"2px 8px",fontSize:9,fontWeight:700,color:"white",backdropFilter:"blur(4px)"}}>{ex.tag}</div>

              {/* Badge */}

              <div style={{position:"absolute",top:7,right:8,background:"rgba(124,92,252,.7)",borderRadius:6,padding:"2px 6px",fontSize:9,color:"white",fontWeight:600,backdropFilter:"blur(4px)"}}>? Vortex</div>

              {/* Info */}

              <div style={{position:"absolute",bottom:0,left:0,right:0,padding:"6px 10px"}}>

                <div style={{fontSize:12,fontWeight:700,color:"white",lineHeight:1.3}}>{ex.titulo}</div>

                <div style={{fontSize:10,color:"rgba(255,255,255,.5)"}}>{ex.sub}</div>

              </div>

            </div>

          ))}

        </div>

      </div>

      {/* Seletor de modelo */}

      <div className="card" style={{marginBottom:"1rem"}}>

        <label className="label" style={{marginBottom:10}}>Modelo de IA</label>

        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(130px,1fr))",gap:8}}>

          {MODELOS_IMG.map(m=>(

            <button key={m.id} onClick={()=>setModelo(m)}

              style={{background:modelo.id===m.id?m.cor+"18":"var(--surface2)",border:`1.5px solid ${modelo.id===m.id?m.cor:"var(--border)"}`,borderRadius:10,padding:"10px 8px",cursor:"pointer",textAlign:"left",transition:"all .2s"}}>

              <div style={{fontSize:13,fontWeight:700,color:modelo.id===m.id?m.cor:"var(--text1)",marginBottom:2}}>{m.nome}</div>

              <div style={{fontSize:11,color:"var(--text3)",marginBottom:6}}>{m.desc}</div>

              <span style={{fontSize:11,color:"var(--text3)",fontWeight:600}}>?? {m.creditos} créditos</span>

            </button>

          ))}

        </div>

      </div>



      {/* Estilo */}

      <div className="card" style={{marginBottom:"1rem"}}>

        <label className="label" style={{marginBottom:8}}>Estilo visual <span style={{color:"var(--text3)",fontSize:11}}>(opcional)</span></label>

        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:6}}>

          {ESTILOS.map(e=>(

            <button key={e.id} onClick={()=>setEstilo(estilo?.id===e.id?null:e)}

              style={{padding:"8px 4px",border:`1.5px solid ${estilo?.id===e.id?"#7C3AED":"var(--border)"}`,background:estilo?.id===e.id?"#7C3AED18":"var(--surface2)",borderRadius:8,cursor:"pointer",fontSize:12,color:estilo?.id===e.id?"#7C3AED":"var(--text2)",fontWeight:estilo?.id===e.id?700:400,transition:"all .15s"}}>

              {e.label}

            </button>

          ))}

        </div>

      </div>



      {/* Prompt e gerar */}

      <div className="card" style={{marginBottom:"1rem"}}>

        <div className="field">

          <label className="label">Descreva a imagem</label>

          <textarea className="input" rows={4}

            placeholder="Ex: homem olhando para explosão de luz, perspectiva dramática, cores vibrantes, thumbnail TikTok..."

            value={prompt} onChange={e=>setPrompt(e.target.value)} disabled={loading}/>

        </div>



        <div style={{background:"#7C3AED12",border:"1px solid #7C3AED30",borderRadius:8,padding:"8px 12px",marginBottom:12,display:"flex",justifyContent:"space-between"}}>

          <span style={{fontSize:13,color:"#7C3AED",fontWeight:600}}>{modelo.nome}{estilo?` • ${estilo.label}`:""}</span>

          <span style={{fontSize:13,color:"var(--text2)"}}>?? {modelo.creditos} créditos</span>

        </div>



        {loading&&(

          <div style={{marginBottom:12}}>

            <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>

              <span style={{fontSize:12,color:"var(--text3)"}}>Gerando imagem...</span>

              <span style={{fontSize:12,color:"#7C3AED",fontWeight:700}}>{Math.round(progresso)}%</span>

            </div>

            <div style={{height:4,background:"var(--border)",borderRadius:4,overflow:"hidden"}}>

              <div style={{height:"100%",width:`${progresso}%`,background:"linear-gradient(90deg,#7C3AED,#A855F7)",borderRadius:4,transition:"width .5s"}}/>

            </div>

          </div>

        )}



        {/* Aviso de alto consumo quando modelo pesado selecionado */}

        {modelo.aviso&&(

          <div style={{padding:"10px 12px",background:"rgba(251,191,36,.08)",

            border:".5px solid rgba(251,191,36,.3)",borderRadius:10,marginBottom:8}}>

            <div style={{fontSize:12,color:"#fbbf24",lineHeight:1.6}}>{modelo.aviso}</div>

          </div>

        )}



        {/* Info do modelo selecionado */}

        {modelo.creditos>0&&(

          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",

            padding:"8px 12px",background:"rgba(255,255,255,.03)",borderRadius:8,marginBottom:8}}>

            <span style={{fontSize:12,color:"var(--text3)"}}>?? Custo: <strong style={{color:"var(--text2)"}}>{modelo.creditos} créditos</strong></span>

            <span style={{fontSize:11,color:"var(--text3)"}}>{"˜ R$"+(modelo.creditos*0.023).toFixed(2)}</span>

          </div>

        )}



        {erro&&<div style={{color:"#f87171",fontSize:13,marginBottom:8,padding:"8px 12px",background:"#f8717118",borderRadius:8}}>?? {erro}</div>}



        <button className="btn btn-full" onClick={gerar} disabled={loading||!prompt.trim()}

          style={{background:loading||!prompt.trim()?"var(--surface2)":"linear-gradient(135deg,#7C3AED,#A855F7)",color:loading||!prompt.trim()?"var(--text3)":"white",border:"none"}}>

          {loading?"? Gerando...":"? Gerar Imagem"}

        </button>

      </div>



      {resultado&&(

        <div className="card">

          <div style={{fontWeight:700,marginBottom:12,color:"#7C3AED"}}>? Imagem gerada!</div>

          <img 

            src={resultado} 

            alt="gerada" 

            style={{width:"100%",borderRadius:12,marginBottom:8,display:"block"}}

            crossOrigin="anonymous"

          />

          <div style={{fontSize:11,color:"var(--text3)",textAlign:"center",marginBottom:4}}>

            ?? {modeloAtual} • <a href={resultado} target="_blank" rel="noreferrer" style={{color:"#7C3AED"}}>abrir em tela cheia</a>

          </div>

          <div style={{display:"flex",gap:8,justifyContent:"center",marginTop:8}}>

            <button onClick={()=>{

              fetch(`${BACKEND}/cerebro/feedback`,{

                method:"POST",headers:{"Content-Type":"application/json"},

                body:JSON.stringify({tipo:"imagem",conteudo:resultado,aprovado:true,modelo:modeloAtual})

              });

              alert("? Vortex aprendeu! Próximas imagens serão ainda melhores.");

            }} style={{fontSize:16,padding:"4px 12px",background:"rgba(123,47,255,.1)",border:"0.5px solid rgba(123,47,255,.3)",borderRadius:8,cursor:"pointer"}}>?? Gostei</button>

            <button onClick={()=>{

              fetch(`${BACKEND}/cerebro/feedback`,{

                method:"POST",headers:{"Content-Type":"application/json"},

                body:JSON.stringify({tipo:"imagem",conteudo:resultado,aprovado:false,modelo:modeloAtual})

              });

              alert("?? Feedback registrado!");

            }} style={{fontSize:16,padding:"4px 12px",background:"rgba(255,100,100,.08)",border:"0.5px solid rgba(255,100,100,.2)",borderRadius:8,cursor:"pointer"}}>?? Melhorar</button>

          </div>



          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}>

            <a href={resultado} download="vortex-imagem.jpg"

              style={{padding:"10px",background:"#7C3AED",color:"white",borderRadius:8,textAlign:"center",fontSize:13,fontWeight:600,textDecoration:"none"}}>

              ?? Baixar

            </a>

            <button onClick={()=>setAbrirEditor(true)}

              style={{padding:"10px",background:"linear-gradient(135deg,#0EA5E9,#38BDF8)",color:"white",border:"none",borderRadius:8,cursor:"pointer",fontSize:13,fontWeight:700}}>

              ?? Editar

            </button>

            <button onClick={()=>setResultado(null)}

              style={{padding:"10px",background:"var(--surface2)",border:"1px solid var(--border)",borderRadius:8,cursor:"pointer",fontSize:13}}>

              ?? Nova

            </button>

          </div>

        </div>

      )}

      {abrirEditor&&resultado&&(

        <EditorThumbnail

          imagemUrl={resultado}

          tituloInicial={prompt.slice(0,40)}

          onClose={()=>setAbrirEditor(false)}

        />

      )}

    </div>

  );

}



// ------------------------------------------------------

// EDITOR VISUAL DE THUMBNAIL — Fabric.js no browser

// ------------------------------------------------------

function EditorThumbnail({ imagemUrl, tituloInicial="", onClose }) {

  const canvasRef = useRef(null);

  const fabricRef = useRef(null);

  const [titulo, setTitulo] = useState(tituloInicial);

  const [subtitulo, setSubtitulo] = useState("");

  const [corFundo, setCorFundo] = useState("#ffffff");

  const [filtro, setFiltro] = useState("nenhum");

  const [fabricCarregado, setFabricCarregado] = useState(false);



  const FONTES = ["Impact", "Arial Black", "Georgia", "Verdana", "Trebuchet MS"];

  const [fonte, setFonte] = useState("Impact");

  const [corTexto, setCorTexto] = useState("#ffffff");

  const [tamanhoTexto, setTamanhoTexto] = useState(60);



  const FILTROS = [

    {id:"nenhum", label:"Original"},

    {id:"dark", label:"?? Dark"},

    {id:"cinema", label:"?? Cinemático"},

    {id:"contraste", label:"? Alto Contraste"},

    {id:"vermelho", label:"?? Terror"},

    {id:"azul", label:"?? Tech"},

  ];



  // Carregar Fabric.js dinamicamente

  useEffect(()=>{

    if(window.fabric){setFabricCarregado(true);return;}

    const script = document.createElement('script');

    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/fabric.js/5.3.1/fabric.min.js';

    script.onload = ()=>setFabricCarregado(true);

    document.head.appendChild(script);

  },[]);



  // Inicializar canvas quando Fabric carregar

  useEffect(()=>{

    if(!fabricCarregado||!canvasRef.current)return;

    const canvas = new window.fabric.Canvas(canvasRef.current, {

      width:1080, height:1920, backgroundColor:"#000"

    });

    fabricRef.current = canvas;



    // Carregar imagem de fundo

    if(imagemUrl){

      window.fabric.Image.fromURL(imagemUrl, img=>{

        img.scaleToWidth(1080);

        img.scaleToHeight(1920);

        img.set({selectable:false, evented:false});

        canvas.add(img);

        canvas.sendToBack(img);



        // Adicionar overlay escuro

        const overlay = new window.fabric.Rect({

          width:1080, height:1920, fill:'rgba(0,0,0,0.35)',

          selectable:false, evented:false

        });

        canvas.add(overlay);



        // Adicionar título inicial

        if(tituloInicial){

          const txt = new window.fabric.Text(tituloInicial.toUpperCase(), {

            left:60, top:700, fontSize:80, fontFamily:'Impact',

            fill:'#ffffff', stroke:'#000000', strokeWidth:3,

            width:960, textAlign:'center', shadow:'5px 5px 10px rgba(0,0,0,0.8)'

          });

          canvas.add(txt);

        }

        canvas.renderAll();

      }, {crossOrigin:'anonymous'});

    }



    return()=>canvas.dispose();

  },[fabricCarregado, imagemUrl]);



  const adicionarTexto = ()=>{

    if(!fabricRef.current||!titulo)return;

    const txt = new window.fabric.Text(titulo.toUpperCase(), {

      left:60, top:600, fontSize:tamanhoTexto,

      fontFamily:fonte, fill:corTexto,

      stroke:'#000000', strokeWidth:2,

      shadow:'3px 3px 8px rgba(0,0,0,0.9)',

      width:960, textAlign:'center'

    });

    fabricRef.current.add(txt);

    fabricRef.current.setActiveObject(txt);

    fabricRef.current.renderAll();

  };



  const adicionarSubtitulo = ()=>{

    if(!fabricRef.current||!subtitulo)return;

    const txt = new window.fabric.Text(subtitulo, {

      left:60, top:800, fontSize:40,

      fontFamily:fonte, fill:'#ffff00',

      stroke:'#000000', strokeWidth:1,

      shadow:'2px 2px 6px rgba(0,0,0,0.9)',

      width:960, textAlign:'center'

    });

    fabricRef.current.add(txt);

    fabricRef.current.renderAll();

  };



  const aplicarFiltro = (f)=>{

    setFiltro(f);

    if(!fabricRef.current)return;

    const objs = fabricRef.current.getObjects();

    const overlay = objs[1];

    if(!overlay)return;

    const filtros = {

      nenhum: 'rgba(0,0,0,0.35)',

      dark: 'rgba(0,0,0,0.6)',

      cinema: 'rgba(10,0,30,0.5)',

      contraste: 'rgba(0,0,0,0.2)',

      vermelho: 'rgba(100,0,0,0.5)',

      azul: 'rgba(0,0,80,0.5)',

    };

    overlay.set('fill', filtros[f]||filtros.nenhum);

    fabricRef.current.renderAll();

  };



  const adicionarElemento = (tipo)=>{

    if(!fabricRef.current)return;

    const elementos = {

      seta: '??',

      fogo: '??',

      choque: '??',

      bomba: '??',

      alerta: '??',

    };

    const txt = new window.fabric.Text(elementos[tipo]||'?', {

      left:400, top:400, fontSize:120,

    });

    fabricRef.current.add(txt);

    fabricRef.current.renderAll();

  };



  const baixar = ()=>{

    if(!fabricRef.current)return;

    // Escalar para 1080x1920 e baixar

    const dataUrl = fabricRef.current.toDataURL({format:'jpeg',quality:0.95});

    const a = document.createElement('a');

    a.href = dataUrl;

    a.download = 'thumbnail-vortex.jpg';

    a.click();

  };



  const escala = 0.25; // Preview menor na tela



  return(

    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.95)",zIndex:1000,display:"flex",flexDirection:"column",overflow:"auto"}}>

      {/* Header */}

      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"12px 16px",borderBottom:"1px solid rgba(124,92,252,.3)",background:"#0d0020",flexShrink:0}}>

        <div style={{display:"flex",alignItems:"center",gap:8}}>

          <span style={{fontSize:20}}>??</span>

          <span style={{fontWeight:700,color:"#A855F7",fontSize:15}}>Editor de Thumbnail</span>

        </div>

        <div style={{display:"flex",gap:8}}>

          <button onClick={baixar} style={{background:"linear-gradient(135deg,#7C3AED,#A855F7)",color:"white",border:"none",borderRadius:8,padding:"8px 16px",fontWeight:700,cursor:"pointer",fontSize:13}}>

            ?? Baixar

          </button>

          <button onClick={onClose} style={{background:"var(--surface2)",color:"var(--text2)",border:"1px solid var(--border)",borderRadius:8,padding:"8px 12px",cursor:"pointer",fontSize:13}}>

            ?

          </button>

        </div>

      </div>



      <div style={{display:"flex",flex:1,overflow:"auto",gap:0}}>

        {/* Canvas Preview */}

        <div style={{flex:1,display:"flex",alignItems:"flex-start",justifyContent:"center",padding:"16px",overflow:"auto"}}>

          {!fabricCarregado

            ?<div style={{color:"var(--text3)",fontSize:14}}>Carregando editor...</div>

            :<div style={{transform:`scale(${escala})`,transformOrigin:"top center",border:"2px solid rgba(124,92,252,.5)",borderRadius:4}}>

              <canvas ref={canvasRef}/>

            </div>

          }

        </div>



        {/* Painel de controles */}

        <div style={{width:280,background:"#0a0015",borderLeft:"1px solid rgba(124,92,252,.2)",padding:"12px",overflow:"auto",flexShrink:0}}>

          

          {/* Texto principal */}

          <div style={{marginBottom:12}}>

            <label style={{fontSize:11,color:"var(--text3)",display:"block",marginBottom:4}}>TÍTULO</label>

            <input value={titulo} onChange={e=>setTitulo(e.target.value)}

              style={{width:"100%",background:"var(--surface2)",border:"1px solid var(--border)",borderRadius:6,padding:"6px 8px",color:"var(--text1)",fontSize:12,boxSizing:"border-box"}}/>

            <button onClick={adicionarTexto} style={{width:"100%",marginTop:4,background:"#7C3AED",color:"white",border:"none",borderRadius:6,padding:"6px",cursor:"pointer",fontSize:11,fontWeight:600}}>

              + Adicionar Título

            </button>

          </div>



          {/* Subtítulo */}

          <div style={{marginBottom:12}}>

            <label style={{fontSize:11,color:"var(--text3)",display:"block",marginBottom:4}}>SUBTÍTULO</label>

            <input value={subtitulo} onChange={e=>setSubtitulo(e.target.value)}

              style={{width:"100%",background:"var(--surface2)",border:"1px solid var(--border)",borderRadius:6,padding:"6px 8px",color:"var(--text1)",fontSize:12,boxSizing:"border-box"}}/>

            <button onClick={adicionarSubtitulo} style={{width:"100%",marginTop:4,background:"#0EA5E9",color:"white",border:"none",borderRadius:6,padding:"6px",cursor:"pointer",fontSize:11,fontWeight:600}}>

              + Adicionar Subtítulo

            </button>

          </div>



          {/* Tamanho do texto */}

          <div style={{marginBottom:12}}>

            <label style={{fontSize:11,color:"var(--text3)",display:"block",marginBottom:4}}>TAMANHO: {tamanhoTexto}px</label>

            <input type="range" min={30} max={120} value={tamanhoTexto} onChange={e=>setTamanhoTexto(Number(e.target.value))}

              style={{width:"100%"}}/>

          </div>



          {/* Cor do texto */}

          <div style={{marginBottom:12}}>

            <label style={{fontSize:11,color:"var(--text3)",display:"block",marginBottom:4}}>COR DO TEXTO</label>

            <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>

              {["#ffffff","#ffff00","#ff4444","#44ff44","#ff8800","#ff44ff"].map(c=>(

                <div key={c} onClick={()=>setCorTexto(c)}

                  style={{width:28,height:28,borderRadius:4,background:c,cursor:"pointer",border:corTexto===c?"2px solid #A855F7":"2px solid transparent"}}/>

              ))}

            </div>

          </div>



          {/* Filtros */}

          <div style={{marginBottom:12}}>

            <label style={{fontSize:11,color:"var(--text3)",display:"block",marginBottom:4}}>FILTRO</label>

            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:4}}>

              {FILTROS.map(f=>(

                <button key={f.id} onClick={()=>aplicarFiltro(f.id)}

                  style={{padding:"5px 4px",borderRadius:6,border:`1px solid ${filtro===f.id?"#7C3AED":"var(--border)"}`,

                    background:filtro===f.id?"#7C3AED18":"var(--surface2)",color:filtro===f.id?"#A855F7":"var(--text2)",

                    cursor:"pointer",fontSize:11}}>

                  {f.label}

                </button>

              ))}

            </div>

          </div>



          {/* Elementos */}

          <div style={{marginBottom:12}}>

            <label style={{fontSize:11,color:"var(--text3)",display:"block",marginBottom:4}}>ELEMENTOS</label>

            <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>

              {[["seta","??"],["fogo","??"],["choque","??"],["bomba","??"],["alerta","??"]].map(([id,emoji])=>(

                <button key={id} onClick={()=>adicionarElemento(id)}

                  style={{width:38,height:38,borderRadius:8,border:"1px solid var(--border)",background:"var(--surface2)",cursor:"pointer",fontSize:20}}>

                  {emoji}

                </button>

              ))}

            </div>

          </div>



          {/* Remover selecionado */}

          <button onClick={()=>{if(fabricRef.current){const obj=fabricRef.current.getActiveObject();if(obj){fabricRef.current.remove(obj);fabricRef.current.renderAll();}}}}

            style={{width:"100%",padding:"8px",background:"#ef444422",border:"1px solid #ef4444",borderRadius:6,color:"#ef4444",cursor:"pointer",fontSize:12,marginBottom:8}}>

            ??? Remover selecionado

          </button>



          <button onClick={baixar}

            style={{width:"100%",padding:"10px",background:"linear-gradient(135deg,#7C3AED,#A855F7)",border:"none",borderRadius:8,color:"white",cursor:"pointer",fontSize:13,fontWeight:700}}>

            ?? Baixar Thumbnail

          </button>

        </div>

      </div>

    </div>

  );

}







// --------------------------------------------------------------

// VORTEX STUDIO — Pipeline completo de vídeo IA

// Claude ? ElevenLabs ? FLUX ? Kling = Vídeo único Vortex

// --------------------------------------------------------------

function VortexStudio() {

  const [tema, setTema]           = useState("");

  const [nicho, setNicho]         = useState("geral");

  const [estilo, setEstilo]       = useState("cinematografico");

  const [modelo, setModelo]       = useState("kling3_std");

  const [loading, setLoading]     = useState(false);

  const [etapaAtual, setEtapaAtual] = useState(0);

  const [resultado, setResultado] = useState(null);

  const [erro, setErro]           = useState("");



  const ESTILOS = [

    { id:"cinematografico", nome:"?? Cinematográfico", desc:"Dark e dramático" },

    { id:"viral",           nome:"?? Viral",           desc:"Vibrante e dinâmico" },

    { id:"terror",          nome:"?? Terror",          desc:"Suspense e horror" },

    { id:"gaming",          nome:"?? Gaming",          desc:"Neon e energia" },

    { id:"educacional",     nome:"?? Clean",           desc:"Limpo e profissional" },

  ];



  const MOTORES = [

    { id:"wan22_fast",  nome:"? Rápido",      creditos:60,  plano:"starter", desc:"Geração em segundos" },

    { id:"kling3_std",  nome:"?? Padrão",      creditos:90,  plano:"creator", desc:"Alta qualidade 4K" },

    { id:"kling3_pro",  nome:"?? Pro",         creditos:150, plano:"pro",     desc:"Movimentos ultra naturais" },

    { id:"luma_ray3",   nome:"?? Premium",     creditos:155, plano:"pro",     desc:"HDR + cores reais" },

    { id:"veo31_fast",  nome:"?? Ultra",       creditos:185, plano:"elite",   desc:"Máxima qualidade possível" },

  ];



  // Etapas sem mencionar APIs

  const ETAPAS = [

    { icon:"??", nome:"Criando roteiro",      desc:"Desenvolvendo narrativa e cenas..." },

    { icon:"???", nome:"Gerando narração",     desc:"Sintetizando voz profissional..." },

    { icon:"??", nome:"Renderizando cena",    desc:"Construindo identidade visual..." },

    { icon:"??", nome:"Animando vídeo",       desc:"Dando vida à cena final..." },

  ];



  const motorAtual = MOTORES.find(m => m.id === modelo) || MOTORES[1];



  async function criar() {

    if(!tema.trim()) { setErro("Descreva o tema do seu vídeo"); return; }

    setLoading(true);

    setErro("");

    setResultado(null);

    setEtapaAtual(1);



    // Simular progresso visual enquanto processa

    const timer = setInterval(() => {

      setEtapaAtual(prev => prev < 4 ? prev + 1 : prev);

    }, 8000);



    try {

      const res = await fetch(`${BACKEND}/vortex-studio/criar`, {

        method:"POST",

        headers: vortexHeaders(),

        body: JSON.stringify({

          tema, nicho, estilo,

          modelo_video: modelo,

          duracao: 30,

        }),

      });



      clearInterval(timer);



      if(!res.ok) {

        const e = await res.json().catch(()=>({}));

        throw new Error(e?.detail || `Erro ${res.status}`);

      }



      const data = await res.json();

      setEtapaAtual(5);

      setResultado(data.resultado);



    } catch(e) {

      clearInterval(timer);

      setErro(e.message || "Erro ao criar vídeo. Tente novamente.");

      setEtapaAtual(0);

    } finally {

      setLoading(false);

    }

  }



  return (

    <div className="page">

      {/* Header */}

      <div className="page-header">

        <div className="eyebrow"><div className="eyebrow-dot"/>exclusivo vortex</div>

        <h1 className="page-title">Vortex <em>Studio</em></h1>

        <p className="page-sub">Descreva sua ideia. O Vortex cria o vídeo completo — roteiro, voz, imagem e movimento.</p>

      </div>



      {/* Input principal — grande e limpo */}

      {!loading && !resultado && (

        <div className="card" style={{marginBottom:12}}>

          <label className="label" style={{fontSize:13}}>Qual é a ideia do seu vídeo?</label>

          <textarea className="input" rows={3}

            placeholder="Ex: Um caso real de desaparecimento misterioso no Brasil em 2024..."

            value={tema} onChange={e=>setTema(e.target.value)}

            style={{resize:"vertical",marginBottom:12,fontSize:13}}/>



          {/* Estilo visual */}

          <label className="label">Estilo visual</label>

          <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:12}}>

            {ESTILOS.map(e=>(

              <button key={e.id} onClick={()=>setEstilo(e.id)}

                style={{padding:"6px 14px",borderRadius:99,fontSize:12,cursor:"pointer",

                  border:`.5px solid ${estilo===e.id?"var(--purple)":"var(--border)"}`,

                  background:estilo===e.id?"rgba(123,47,255,.15)":"transparent",

                  color:estilo===e.id?"var(--purple2)":"var(--text3)",fontWeight:600}}>

                {e.nome}

              </button>

            ))}

          </div>



          {/* Nicho */}

          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:12}}>

            <div>

              <label className="label">Nicho</label>

              <select className="input" value={nicho} onChange={e=>setNicho(e.target.value)}>

                {["geral","terror","gaming","finanças","fitness","tech","lifestyle","anime","motivacional"].map(n=>(

                  <option key={n} value={n}>{n.charAt(0).toUpperCase()+n.slice(1)}</option>

                ))}

              </select>

            </div>

            <div>

              <label className="label">Qualidade</label>

              <select className="input" value={modelo} onChange={e=>setModelo(e.target.value)}>

                {MOTORES.map(m=>(

                  <option key={m.id} value={m.id}>{m.nome} — {m.creditos}cr</option>

                ))}

              </select>

            </div>

          </div>



          {/* Info custo */}

          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",

            padding:"8px 12px",background:"rgba(255,255,255,.03)",borderRadius:8,marginBottom:12}}>

            <span style={{fontSize:12,color:"var(--text3)"}}>

              ?? <strong style={{color:"var(--text)"}}>{motorAtual.creditos} créditos</strong> · {motorAtual.desc}

            </span>

            <span style={{fontSize:10,color:"var(--text3)",

              background:motorAtual.plano==="starter"?"rgba(52,211,153,.1)":"rgba(123,47,255,.1)",

              padding:"2px 8px",borderRadius:99,

              color:motorAtual.plano==="starter"?"#34d399":"var(--purple2)"}}>

              {motorAtual.plano}+

            </span>

          </div>



          {erro&&<div style={{color:"#f87171",fontSize:12,marginBottom:8,

            padding:"8px 12px",background:"#f8717118",borderRadius:8}}>?? {erro}</div>}



          <button className="btn btn-full" onClick={criar} disabled={!tema.trim()}

            style={{background:!tema.trim()?"var(--surface2)":

              "linear-gradient(135deg,#7C3AED,#9333ea)",

              color:!tema.trim()?"var(--text3)":"#fff",

              border:"none",fontSize:14,padding:"14px",fontWeight:700}}>

            ?? Criar Vídeo — {motorAtual.creditos} créditos

          </button>

        </div>

      )}



      {/* Tela de processamento */}

      {loading && (

        <div className="card" style={{textAlign:"center",padding:"2rem 1rem"}}>

          <div style={{fontSize:48,marginBottom:16,animation:"pulse 1.5s infinite"}}>??</div>

          <div style={{fontFamily:"var(--fh)",fontSize:20,fontWeight:800,

            marginBottom:8,color:"var(--text)"}}>

            Vortex Studio está criando...

          </div>

          <div style={{fontSize:13,color:"var(--text3)",marginBottom:24}}>

            Isso pode levar até 1 minuto. Não feche essa tela.

          </div>



          {/* Etapas de progresso */}

          <div style={{textAlign:"left",maxWidth:320,margin:"0 auto"}}>

            {ETAPAS.map((et,i)=>{

              const feito   = etapaAtual > i+1;

              const atual   = etapaAtual === i+1;

              const pendente= etapaAtual < i+1;

              return(

                <div key={i} style={{display:"flex",alignItems:"center",gap:12,

                  padding:"10px 0",borderBottom:i<3?".5px solid var(--border)":"none",

                  opacity:pendente?0.4:1,transition:"all .5s"}}>

                  <div style={{width:32,height:32,borderRadius:99,display:"flex",

                    alignItems:"center",justifyContent:"center",fontSize:16,

                    background:feito?"rgba(52,211,153,.2)":atual?"rgba(123,47,255,.2)":"var(--bg3)",

                    border:`.5px solid ${feito?"#34d399":atual?"var(--purple)":"var(--border)"}`}}>

                    {feito?"?":atual?"?":et.icon}

                  </div>

                  <div>

                    <div style={{fontSize:13,fontWeight:700,

                      color:feito?"#34d399":atual?"var(--purple2)":"var(--text3)"}}>

                      {et.nome}

                    </div>

                    {atual&&<div style={{fontSize:11,color:"var(--text3)"}}>{et.desc}</div>}

                  </div>

                </div>

              );

            })}

          </div>

        </div>

      )}



      {/* Resultado final */}

      {resultado?.video_final && (

        <div className="card">

          <div style={{fontWeight:800,marginBottom:12,fontSize:16,color:"var(--text)"}}>

            ? Seu vídeo está pronto!

          </div>

          <video controls style={{width:"100%",borderRadius:12,background:"#000",marginBottom:12}}

            src={resultado.video_final}/>

          <div style={{display:"flex",gap:8,marginBottom:12}}>

            <a href={resultado.video_final} download="vortex-video.mp4"

              className="btn btn-full"

              style={{textDecoration:"none",textAlign:"center",fontSize:13}}>

              ?? Baixar vídeo

            </a>

            <button className="btn" style={{fontSize:13,whiteSpace:"nowrap"}}

              onClick={()=>{setResultado(null);setEtapaAtual(0);}}>

              ? Criar outro

            </button>

          </div>

          <div style={{padding:"10px 12px",background:"rgba(123,47,255,.06)",

            border:".5px solid rgba(123,47,255,.2)",borderRadius:8,

            fontSize:11,color:"var(--purple2)",textAlign:"center",fontWeight:600}}>

            ? Criado com tecnologia exclusiva Vortex Studio

          </div>

        </div>

      )}

    </div>

  );

}





function GeradorVideos() {

  // MODELOS de vídeo

  const MODELOS_VIDEO = [

    { id:"studio",     nome:"? Vortex Studio",  tag:"Exclusivo",       creditos:90, cor:"#9333ea", api:"studio", plano_min:"creator", desc:"Pipeline completo — roteiro, voz, imagem e vídeo", aviso:null, studio:true },

    { id:"hf_ltx",     nome:"?? LTX-Video",      tag:"Grátis",          creditos:0,  cor:"#F59E0B", api:"hf",  free:true,   plano_min:"free",    desc:"HuggingFace • Open source",         aviso:null },

    { id:"wan26_fast", nome:"? WAN 2.6 Fast",    tag:"Open source",     creditos:5,  cor:"#7C3AED", api:"fal", fal_model:"fal-ai/wan/t2v-1.3b",               plano_min:"starter", desc:"Alibaba • Rápido",           aviso:null },

    { id:"hailuo23",   nome:"?? Hailuo 2.3",      tag:"Custo-benefício", creditos:10, cor:"#8B5CF6", api:"fal", fal_model:"fal-ai/minimax/video-01-live",       plano_min:"starter", desc:"MiniMax • menos de 30s",    aviso:null },

    { id:"hunyuan_vid",nome:"?? Hunyuan Video",   tag:"Open source",     creditos:10, cor:"#EF4444", api:"fal", fal_model:"fal-ai/hunyuan-video",              plano_min:"starter", desc:"Tencent • 1080p",           aviso:null },

    { id:"wan26_hd",   nome:"?? WAN 2.6 HD",      tag:"Alta qualidade",  creditos:15, cor:"#7C3AED", api:"fal", fal_model:"fal-ai/wan/t2v-5b-720p",            plano_min:"creator", desc:"Alibaba • 720p",            aviso:null },

    { id:"seedance2",  nome:"?? Seedance 2.0",     tag:"#1 sem áudio",   creditos:15, cor:"#F59E0B", api:"fal", fal_model:"fal-ai/bytedance/seedance-1-lite",  plano_min:"creator", desc:"ByteDance • Top movement",  aviso:null },

    { id:"minimax_vid",nome:"?? Minimax Video",    tag:"Personagens",     creditos:15, cor:"#EC4899", api:"fal", fal_model:"fal-ai/minimax-video/video-01",     plano_min:"creator", desc:"MiniMax • Personagens",     aviso:null },

    { id:"kling3_std", nome:"?? Kling 3.0",        tag:"4K • 60fps",      creditos:20, cor:"#0EA5E9", api:"fal", fal_model:"fal-ai/kling-video/v1.6/standard/text-to-video", plano_min:"creator", desc:"Kuaishou • 4K",  aviso:null },

    { id:"luma_dream", nome:"?? Luma Dream",       tag:"Surreal",         creditos:20, cor:"#10B981", api:"fal", fal_model:"fal-ai/luma-dream-machine",         plano_min:"creator", desc:"Luma AI • Cenas surreais",  aviso:null },

    { id:"happyhorse", nome:"?? HappyHorse 1.0",   tag:"#1 mundial",      creditos:30, cor:"#f472b6", api:"fal", fal_model:"fal-ai/alibaba/happyhorse",         plano_min:"pro",     desc:"Alibaba • lip-sync 7 idiomas", aviso:null },

    { id:"luma_ray3",  nome:"?? Luma Ray 3",       tag:"HDR 16-bit",      creditos:35, cor:"#10B981", api:"fal", fal_model:"fal-ai/luma-dream-machine/ray-3",   plano_min:"pro",     desc:"Luma AI • Primeiro HDR",    aviso:null },

    { id:"kling3_pro", nome:"?? Kling 3.0 Pro",    tag:"Top • 4K 60fps",  creditos:40, cor:"#F59E0B", api:"fal", fal_model:"fal-ai/kling-video/v1.6/pro/text-to-video", plano_min:"pro",  desc:"Kuaishou • AI Director",  aviso:null },

    { id:"runway_gen4",nome:"?? Runway Gen-4.5",   tag:"Melhor controle", creditos:35, cor:"#74AA9C", api:"fal", fal_model:"fal-ai/runway/gen-4",               plano_min:"pro",     desc:"Runway • Motion brushes",   aviso:null },

    { id:"veo31_lite", nome:"? Veo 3.1 Lite",     tag:"Google",          creditos:15, cor:"#9d5cff", api:"fal", fal_model:"fal-ai/veo3/lite",                  plano_min:"pro",     desc:"Google • áudio nativo",     aviso:null },

    { id:"sora2",      nome:"?? Sora 2 Pro",       tag:"OpenAI",          creditos:120,cor:"#74AA9C", api:"fal", fal_model:"fal-ai/sora",                       plano_min:"elite",   desc:"OpenAI • API até set/2026", aviso:"?? Consome 120 créditos por vídeo." },

    { id:"veo31_fast", nome:"?? Veo 3.1 Fast",     tag:"Google Premium",  creditos:160,cor:"#EF4444", api:"fal", fal_model:"fal-ai/veo3/fast",                  plano_min:"elite",   desc:"Google • 4K + áudio",       aviso:"?? Consome 160 créditos por vídeo." },

    { id:"veo31",      nome:"? Veo 3.1 Quality",  tag:"Melhor do mundo", creditos:325,cor:"#f72faa", api:"fal", fal_model:"fal-ai/veo3",                       plano_min:"elite",   desc:"Google • Máxima qualidade", aviso:"?? Consome 325 créditos por vídeo." },

  ];



  const [modelo, setModelo]       = useState(MODELOS_VIDEO[0]);

  const [prompt, setPrompt]       = useState("");

  const [duracao, setDuracao]     = useState({s:5, label:"5s"});

  const [ratio, setRatio]         = useState({v:"16:9", label:"16:9"});

  const [imagemRef, setImagemRef] = useState(null);

  const [imagemPreview, setImagemPreview] = useState(null);

  const [loading, setLoading]     = useState(false);

  const [progresso, setProgresso] = useState(0);

  const [progMsg, setProgMsg]     = useState("");

  const [resultado, setResultado] = useState(null);

  const [erro, setErro]           = useState("");



  const DURACOES = [{s:5,label:"5s"},{s:8,label:"8s"},{s:10,label:"10s"}];

  const RATIOS   = [{v:"16:9",label:"16:9"},{v:"9:16",label:"9:16"},{v:"1:1",label:"1:1"}];



  const gerar = async () => {

    if(!prompt.trim()) return;

    setLoading(true); setErro(""); setResultado(null); setProgresso(0);

    const msgs = ["?? Enviando prompt...","?? IA gerando vídeo...","?? Renderizando...","?? Finalizando..."];

    let mi = 0; setProgMsg(msgs[0]); setProgresso(10);

    const tick = setInterval(() => {

      setProgresso(p => p < 85 ? p + Math.random()*1.5 : p);

      mi = Math.min(mi+1, msgs.length-1);

      setProgMsg(msgs[mi]);

    }, 4000);

    try {

      // Se for Vortex Studio — pipeline completo

      if(modelo.studio) {

        const res = await fetch(`${BACKEND}/vortex-studio/criar`, {

          method:"POST", headers:vortexHeaders(),

          body:JSON.stringify({tema:prompt, nicho:"geral", estilo:"cinematografico", modelo_video:"kling3_std", duracao:30}),

        });

        clearInterval(tick); setProgresso(100);

        if(!res.ok){const e=await res.json().catch(()=>({}));throw new Error(e?.detail||`Erro ${res.status}`);}

        const data = await res.json();

        setResultado(data.resultado?.video_final || null);

        return;

      }

      const body = {prompt, duracao:duracao.s, resolucao:"720p", ratio:ratio.v, modelo:modelo.fal_model||modelo.id};

      const res = await fetch(`${BACKEND}/gerar-video`, {

        method:"POST", headers:vortexHeaders(),

        body:JSON.stringify(body),

      });

      clearInterval(tick);

      setProgresso(100);

      if(!res.ok) { const e=await res.json().catch(()=>({})); throw new Error(e?.detail||`Erro ${res.status}`); }

      const data = await res.json();

      setResultado(data.url || data.video_url || data.resultado);

    } catch(e) {

      clearInterval(tick);

      setErro(e.message || "Erro ao gerar vídeo");

    } finally {

      setLoading(false);

    }

  };



  return (

    <div className="page">

      <div className="page-header">

        <div className="eyebrow"><div className="eyebrow-dot"/>IA & Criação</div>

        <h1 className="page-title">Gerador de <em>Vídeo</em></h1>

        <p className="page-sub">Escolha a IA, descreva a cena e gere em segundos</p>

      </div>



      <div>

          {/* Seletor de modelo */}

          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(140px,1fr))",gap:8,marginBottom:12}}>

            {MODELOS_VIDEO.map(m => {

              const ordemPlanos = ["free","starter","creator","pro","elite","elite_lifetime"];

              const planoAtual = loadUserProfile().plano || "free";

              const bloqueado = ordemPlanos.indexOf(planoAtual) < ordemPlanos.indexOf(m.plano_min||"free") && !m.free;

              return (

                <button key={m.id} onClick={()=>!bloqueado&&setModelo(m)}

                  style={{background:bloqueado?"rgba(255,255,255,.03)":modelo.id===m.id?m.cor+"18":"var(--bg3)",

                    border:"1.5px solid "+(bloqueado?"var(--border)":modelo.id===m.id?m.cor:"var(--border)"),

                    borderRadius:10,padding:"10px 8px",cursor:bloqueado?"not-allowed":"pointer",

                    textAlign:"left",opacity:bloqueado?.5:1,position:"relative"}}>

                  {bloqueado && <div style={{position:"absolute",top:4,right:4,fontSize:9,color:"#fbbf24",

                    background:"rgba(251,191,36,.1)",padding:"1px 5px",borderRadius:4,fontWeight:700}}>

                    {"?? "+(m.plano_min||"starter").toUpperCase()+"+"}

                  </div>}

                  <div style={{fontSize:13,fontWeight:700,color:bloqueado?"var(--text3)":modelo.id===m.id?m.cor:"var(--text1)",marginBottom:2}}>{m.nome}</div>

                  <div style={{fontSize:11,color:"var(--text3)",marginBottom:6}}>{m.desc}</div>

                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>

                    <span style={{fontSize:10,background:m.cor+"22",color:m.cor,padding:"1px 6px",borderRadius:4,fontWeight:600}}>{m.tag}</span>

                    {m.creditos>0 && <span style={{fontSize:10,color:"var(--text3)"}}>{"?? "+m.creditos+"cr"}</span>}

                  </div>

                </button>

              );

            })}

          </div>



          {/* Aviso alto consumo */}

          {modelo.aviso && (

            <div style={{padding:"10px 12px",background:"rgba(251,191,36,.08)",

              border:".5px solid rgba(251,191,36,.3)",borderRadius:10,marginBottom:8}}>

              <div style={{fontSize:12,color:"#fbbf24"}}>{modelo.aviso}</div>

            </div>

          )}



          {/* Prompt */}

          <div className="card" style={{marginBottom:12}}>

            <label className="label">Descreva a cena</label>

            <textarea className="input" rows={3} value={prompt}

              onChange={e=>setPrompt(e.target.value)}

              placeholder="Ex: Uma floresta densa à noite, neblina surgindo entre as árvores..."

              style={{resize:"vertical",marginBottom:10}}/>



            <div style={{display:"flex",gap:8,marginBottom:10}}>

              <div style={{flex:1}}>

                <label className="label">Duração</label>

                <div style={{display:"flex",gap:4}}>

                  {DURACOES.map(d=>(

                    <button key={d.s} onClick={()=>setDuracao(d)}

                      style={{flex:1,padding:"6px 4px",borderRadius:8,fontSize:12,cursor:"pointer",fontWeight:600,

                        border:"1.5px solid "+(duracao.s===d.s?"#7C3AED":"var(--border)"),

                        background:duracao.s===d.s?"rgba(123,47,255,.15)":"var(--bg3)",

                        color:duracao.s===d.s?"var(--purple2)":"var(--text3)"}}>

                      {d.label}

                    </button>

                  ))}

                </div>

              </div>

              <div style={{flex:1}}>

                <label className="label">Formato</label>

                <div style={{display:"flex",gap:4}}>

                  {RATIOS.map(r=>(

                    <button key={r.v} onClick={()=>setRatio(r)}

                      style={{flex:1,padding:"6px 4px",borderRadius:8,fontSize:12,cursor:"pointer",fontWeight:600,

                        border:"1.5px solid "+(ratio.v===r.v?"#7C3AED":"var(--border)"),

                        background:ratio.v===r.v?"rgba(123,47,255,.15)":"var(--bg3)",

                        color:ratio.v===r.v?"var(--purple2)":"var(--text3)"}}>

                      {r.label}

                    </button>

                  ))}

                </div>

              </div>

            </div>



            {/* Info custo */}

            {modelo.creditos>0 && (

              <div style={{display:"flex",justifyContent:"space-between",padding:"8px 12px",

                background:"rgba(255,255,255,.03)",borderRadius:8,marginBottom:8}}>

                <span style={{fontSize:12,color:"var(--text3)"}}>

                  {"?? Custo: "}<strong style={{color:"var(--text)"}}>{modelo.creditos+" créditos"}</strong>

                </span>

                <span style={{fontSize:11,color:modelo.creditos>50?"#fbbf24":"var(--text3)"}}>

                  {modelo.creditos>100?"?? Alto consumo":modelo.creditos>30?"?? Moderado":"? Econômico"}

                </span>

              </div>

            )}



            {erro && <div style={{color:"#f87171",fontSize:13,marginBottom:8,padding:"8px 12px",background:"#f8717118",borderRadius:8}}>{"?? "+erro}</div>}



            {!loading && (

              <button className="btn btn-full" onClick={gerar} disabled={!prompt.trim()}

                style={{background:!prompt.trim()?"var(--surface2)":"linear-gradient(135deg,#7C3AED,#A855F7)",

                  color:!prompt.trim()?"var(--text3)":"white",border:"none"}}>

                {"?? Gerar Vídeo — "+modelo.creditos+" créditos"}

              </button>

            )}



            {loading && (

              <div>

                <div style={{display:"flex",justifyContent:"space-between",fontSize:12,color:"var(--text3)",marginBottom:6}}>

                  <span>{progMsg}</span>

                  <span>{Math.round(progresso)+"%"}</span>

                </div>

                <div style={{height:6,borderRadius:99,background:"var(--bg3)",overflow:"hidden"}}>

                  <div style={{height:"100%",width:progresso+"%",background:"linear-gradient(90deg,#7C3AED,#A855F7)",transition:"width .5s"}}/>

                </div>

              </div>

            )}

          </div>



          {/* Resultado */}

          {resultado && (

            <div className="card">

              <div style={{fontWeight:700,marginBottom:12,color:"#7C3AED"}}>{"? Vídeo gerado!"}</div>

              <video controls style={{width:"100%",borderRadius:10,background:"#000"}} src={resultado}/>

              <div style={{display:"flex",gap:8,marginTop:12}}>

                <a href={resultado} download="vortex-video.mp4"

                  style={{flex:1,padding:"10px",background:"#7C3AED",color:"white",borderRadius:8,

                    textAlign:"center",fontSize:14,fontWeight:600,textDecoration:"none"}}>

                  {"?? Baixar"}

                </a>

                <button onClick={()=>setResultado(null)}

                  style={{padding:"10px 16px",background:"var(--surface2)",border:"1px solid var(--border)",

                    borderRadius:8,cursor:"pointer",fontSize:14}}>

                  {"?? Novo"}

                </button>

              </div>

            </div>

          )}

        </div>

      )&rbrace;

    </div>

  );

}





function ClonadorVoz() {

  const VOZES=[

    {id:"onwK4e9ZLuTAKqWW03F9",nome:"VORTEX",icon:"??",desc:"Voz oficial do Vortex — dramática e envolvente",estilo:"Épico"},

    {id:"pNInz6obpgDQGcFmaJgB",nome:"Adam",icon:"???",desc:"Grave e autoritário — ideal para terror e suspense",estilo:"Grave"},

    {id:"TX3LPaxmHKxFdv7VOQHJ",nome:"Liam",icon:"?",desc:"Jovem e energético — perfeito para gaming",estilo:"Energético"},

    {id:"ErXwobaYiN019PkySvjV",nome:"Antoni",icon:"??",desc:"Tom suave e narrativo — ótimo para storytelling",estilo:"Narrativo"},

    {id:"VR6AewLTigWG4xSOukaG",nome:"Arnold",icon:"??",desc:"Imponente e confiante — autoridade máxima",estilo:"Imponente"},

    {id:"EXAVITQu4vr4xnSDxMaL",nome:"Bella",icon:"??",desc:"Feminina e carismática — engajamento alto",estilo:"Carismático"},

  ];

  const [texto,setTexto]=useState("");

  const [voz,setVoz]=useState(VOZES[0]);

  const [loading,setLoading]=useState(false);

  const [resultado,setResultado]=useState(null);

  const [erro,setErro]=useState("");

  const [tocando,setTocando]=useState(false);

  const audioRef=useRef(null);



  const gerar=async()=>{

    if(!texto.trim())return;

    setLoading(true);setErro("");setResultado(null);

    try{

      const res=await fetch(`${BACKEND}/narrar`,{

        method:"POST",headers:{"Content-Type":"application/json"},

        body:JSON.stringify({texto,voz_id:voz.id})

      });

      if(!res.ok){const e=await res.json().catch(()=>({}));throw new Error(e?.detail||`Erro ${res.status}`);}

      const d=await res.json();

      setResultado(d.audio_base64||d.audio_url||d.url);

    }catch(e){setErro(e.message);}

    finally{setLoading(false);}

  };



  const togglePlay=()=>{

    if(!audioRef.current)return;

    if(tocando){audioRef.current.pause();setTocando(false);}

    else{audioRef.current.play();setTocando(true);}

  };



  return(

    <div className="page">

      <div className="page-header">

        <div className="eyebrow"><div className="eyebrow-dot"/>IA & Criação</div>

        <h1 className="page-title">Narração com IA</h1>

        <p className="page-sub">Transforme seu roteiro em narração profissional</p>

      </div>



      {/* Player de demo de narração */}

      <div style={{marginBottom:"1rem"}}>

        <div style={{fontSize:12,color:"var(--text3)",marginBottom:8,display:"flex",alignItems:"center",gap:6}}>

          <span style={{width:6,height:6,borderRadius:"50%",background:"#7C3AED",display:"inline-block"}}/>

          Estilos de narração — clique para usar o texto

        </div>

        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>

          {[

            {icon:"??",cor:"#ef4444",bg:"linear-gradient(135deg,#1a0000,#3d0000)",titulo:"Terror & Suspense",sub:"Voz grave e dramática",exemplo:"Ninguém sabia o que estava prestes a acontecer naquela noite. O silêncio era ensurdecedor..."},

            {icon:"?",cor:"#3b82f6",bg:"linear-gradient(135deg,#00051a,#001040)",titulo:"Gaming Hype",sub:"Energético e rápido",exemplo:"Esse glitch quebrou o jogo INTEIRO! Ninguém consegue passar desse nível... até agora!"},

            {icon:"??",cor:"#f59e0b",bg:"linear-gradient(135deg,#1a0d00,#3d1f00)",titulo:"Finanças",sub:"Autoritário e confiante",exemplo:"Esse ativo vai triplicar em 2025. Aqui está o motivo que ninguém está te contando..."},

            {icon:"??",cor:"#a855f7",bg:"linear-gradient(135deg,#0d0020,#2d0057)",titulo:"Storytelling",sub:"Narrativo e envolvente",exemplo:"Era uma noite fria quando tudo mudou para sempre. Eu não sabia que aquela seria minha última chance..."},

          ].map((d,i)=>(

            <div key={i} onClick={()=>setTexto(d.exemplo)}

              style={{background:d.bg,borderRadius:12,padding:"12px",cursor:"pointer",position:"relative",overflow:"hidden",border:"1px solid rgba(255,255,255,.06)",transition:"all .25s"}}

              onMouseEnter={e=>{e.currentTarget.style.transform="scale(1.02)";e.currentTarget.style.border=`1px solid ${d.cor}55`;e.currentTarget.style.boxShadow=`0 4px 20px ${d.cor}22`;}}

              onMouseLeave={e=>{e.currentTarget.style.transform="scale(1)";e.currentTarget.style.border="1px solid rgba(255,255,255,.06)";e.currentTarget.style.boxShadow="none";}}>

              {/* Waveform visual decorativa */}

              <div style={{position:"absolute",bottom:0,left:0,right:0,height:24,display:"flex",alignItems:"flex-end",gap:1,padding:"0 8px",opacity:.3}}>

                {Array.from({length:30}).map((_,i)=>(

                  <div key={i} style={{flex:1,background:d.cor,borderRadius:1,height:`${6+Math.sin(i*0.7)*5}px`}}/>

                ))}

              </div>

              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>

                <span style={{fontSize:20}}>{d.icon}</span>

                <div>

                  <div style={{fontSize:12,fontWeight:700,color:"white"}}>{d.titulo}</div>

                  <div style={{fontSize:10,color:"rgba(255,255,255,.5)"}}>{d.sub}</div>

                </div>

              </div>

              <div style={{fontSize:11,color:"rgba(255,255,255,.6)",lineHeight:1.5,paddingBottom:8}}>"{d.exemplo.slice(0,60)}..."</div>

              <div style={{fontSize:10,color:d.cor,fontWeight:600}}>? Clique para usar este texto</div>

            </div>

          ))}

        </div>

      </div>



      {/* Seletor de vozes */}

      <div className="card" style={{marginBottom:"1rem"}}>

        <label className="label" style={{marginBottom:10}}>Escolha a voz</label>

        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(150px,1fr))",gap:8}}>

          {VOZES.map(v=>(

            <button key={v.id} onClick={()=>setVoz(v)}

              style={{background:voz.id===v.id?"#7C3AED18":"var(--surface2)",border:`1.5px solid ${voz.id===v.id?"#7C3AED":"var(--border)"}`,borderRadius:10,padding:"12px 10px",cursor:"pointer",textAlign:"left",transition:"all .2s"}}>

              <div style={{fontSize:22,marginBottom:4}}>{v.icon}</div>

              <div style={{fontSize:14,fontWeight:700,color:voz.id===v.id?"#7C3AED":"var(--text1)",marginBottom:2}}>{v.nome}</div>

              <div style={{fontSize:11,color:"var(--text3)",marginBottom:6,lineHeight:1.4}}>{v.desc}</div>

              <span style={{fontSize:10,background:voz.id===v.id?"#7C3AED22":"var(--border)",color:voz.id===v.id?"#7C3AED":"var(--text3)",padding:"2px 6px",borderRadius:4,fontWeight:600}}>{v.estilo}</span>

            </button>

          ))}

        </div>

      </div>



      {/* Texto */}

      <div className="card" style={{marginBottom:"1rem"}}>

        <div className="field">

          <label className="label">Texto para narrar</label>

          <textarea className="input" rows={6}

            placeholder="Cole aqui o roteiro ou qualquer texto que o Vortex vai narrar com a voz escolhida..."

            value={texto} onChange={e=>setTexto(e.target.value)} disabled={loading}/>

          <div style={{textAlign:"right",fontSize:11,color:"var(--text3)",marginTop:4}}>{texto.length} caracteres</div>

        </div>



        <div style={{background:"#7C3AED12",border:"1px solid #7C3AED30",borderRadius:8,padding:"8px 12px",marginBottom:12,display:"flex",justifyContent:"space-between",alignItems:"center"}}>

          <span style={{fontSize:13,color:"#7C3AED",fontWeight:600}}>{voz.icon} {voz.nome} • {voz.estilo}</span>

          <span style={{fontSize:13,color:"var(--text2)"}}>?? {Math.ceil(texto.length/100)} créditos</span>

        </div>



        {erro&&<div style={{color:"#f87171",fontSize:13,marginBottom:8,padding:"8px 12px",background:"#f8717118",borderRadius:8}}>?? {erro}</div>}



        <button className="btn btn-full" onClick={gerar} disabled={loading||!texto.trim()}

          style={{background:loading||!texto.trim()?"var(--surface2)":"linear-gradient(135deg,#7C3AED,#A855F7)",color:loading||!texto.trim()?"var(--text3)":"white",border:"none"}}>

          {loading?"? Narrando...":"??? Narrar com IA"}

        </button>

      </div>



      {/* Player de áudio */}

      {resultado&&(

        <div className="card">

          <div style={{fontWeight:700,marginBottom:16,color:"#7C3AED"}}>? Narração pronta!</div>



          {/* Waveform visual */}

          <div style={{background:"#7C3AED12",borderRadius:12,padding:"16px",marginBottom:16,display:"flex",alignItems:"center",gap:12}}>

            <button onClick={togglePlay}

              style={{width:48,height:48,borderRadius:"50%",background:"linear-gradient(135deg,#7C3AED,#A855F7)",border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,color:"white",flexShrink:0}}>

              {tocando?"?":"??"}

            </button>

            <div style={{flex:1,display:"flex",alignItems:"center",gap:2,height:40}}>

              {Array.from({length:32}).map((_,i)=>(

                <div key={i} style={{flex:1,background:tocando?"#A855F7":"#7C3AED44",borderRadius:2,height:`${20+Math.sin(i*0.8)*15}px`,transition:"all .3s",animationDelay:`${i*0.05}s`}}/>

              ))}

            </div>

            <span style={{fontSize:12,color:"#7C3AED",fontWeight:600,flexShrink:0}}>{voz.nome}</span>

          </div>



          {resultado.startsWith("data:")

            ?<audio ref={audioRef} src={resultado} onEnded={()=>setTocando(false)} style={{display:"none"}}/>

            :<audio ref={audioRef} src={resultado} controls onEnded={()=>setTocando(false)} style={{width:"100%",marginBottom:8}}/>

          }



          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginTop:8}}>

            <a href={resultado} download="vortex-narracao.mp3"

              style={{padding:"10px",background:"#7C3AED",color:"white",borderRadius:8,textAlign:"center",fontSize:14,fontWeight:600,textDecoration:"none"}}>

              ?? Baixar MP3

            </a>

            <button onClick={()=>setResultado(null)}

              style={{padding:"10px",background:"var(--surface2)",border:"1px solid var(--border)",borderRadius:8,cursor:"pointer",fontSize:14}}>

              ?? Nova narração

            </button>

          </div>

        </div>

      )}

    </div>

  );

}



function GeradorMusica() {

  const ESTILOS=[

    {id:"dark_electronic",label:"?? Dark Electronic",desc:"Tensão — terror/thriller",provider:"elevenlabs"},

    {id:"cinematic",label:"?? Cinematográfico",desc:"Épico — trailers",provider:"elevenlabs"},

    {id:"lofi_chill",label:"?? Lo-fi Chill",desc:"Relaxante — lifestyle",provider:"elevenlabs"},

    {id:"hype_trap",label:"? Hype Trap",desc:"Energia — gaming",provider:"elevenlabs"},

    {id:"ambient",label:"?? Ambient",desc:"Atmosférico — ASMR",provider:"elevenlabs"},

    {id:"horror",label:"?? Horror",desc:"Assustador — true crime",provider:"elevenlabs"},

    {id:"suno",label:"?? Suno AI",desc:"Música completa com melodia",provider:"suno"},

    {id:"udio",label:"?? Udio",desc:"Música + voz cantada",provider:"udio"},

  ];

  const [prompt,setPrompt]=useState(""); const [estilo,setEstilo]=useState("dark_electronic");

  const [duracao,setDuracao]=useState(15); const [loading,setLoading]=useState(false);

  const [progresso,setProgresso]=useState(0); const [resultado,setResultado]=useState(null); const [erro,setErro]=useState("");

  const estiloAtual=ESTILOS.find(e=>e.id===estilo)||ESTILOS[0];

  const gerar=async()=>{

    setLoading(true);setErro("");setResultado(null);setProgresso(0);

    const tick=setInterval(()=>setProgresso(p=>p<85?p+3:p),500);

    try{

      const res=await fetch(`${BACKEND}/gerar-musica`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({prompt:prompt||estiloAtual.desc,duracao,estilo})});

      clearInterval(tick);

      if(!res.ok){const e=await res.json().catch(()=>({}));throw new Error(e?.detail||`HTTP ${res.status}`);}

      const d=await res.json();setProgresso(100);setResultado(d.audio_url);

    }catch(e){clearInterval(tick);setErro(e.message);}finally{setLoading(false);}

  };

  return(

    <div className="page">

      <div className="page-header"><div className="eyebrow"><div className="eyebrow-dot"/>IA & Criação</div><h1 className="page-title">Gerador de <em>Música</em></h1><p className="page-sub">Trilhas com ElevenLabs, Suno AI e Udio.</p></div>

      <div className="card" style={{marginBottom:"1rem"}}>

        <div className="field"><label className="label">Estilo musical</label><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6,marginBottom:12}}>{ESTILOS.map(e=><button key={e.id} onClick={()=>setEstilo(e.id)} style={{padding:"10px 12px",borderRadius:10,textAlign:"left",cursor:"pointer",border:`.5px solid ${estilo===e.id?"var(--accent)":"var(--border2)"}`,background:estilo===e.id?"rgba(123,47,255,.12)":"var(--bg4)"}}><div style={{fontSize:13,fontWeight:600,color:"var(--text)"}}>{e.label}</div><div style={{fontSize:10,color:"var(--text3)"}}>{e.desc}</div></button>)}</div></div>

        <div className="field"><label className="label">Descreva <span style={{color:"var(--text3)",fontSize:10}}>(opcional)</span></label><input className="input" placeholder="Ex: suspense com violinos pesados..." value={prompt} onChange={e=>setPrompt(e.target.value)} disabled={loading}/></div>

        <div className="field"><label className="label">Duração</label><div className="chips">{[5,10,15,22].map(d=><button key={d} className={"chip "+(duracao===d?"active":"")} onClick={()=>setDuracao(d)} disabled={loading}>{d}s</button>)}</div></div>

        {loading&&<div style={{marginBottom:12}}><div style={{display:"flex",justifyContent:"space-between",fontSize:11,color:"var(--text3)",marginBottom:4}}><span>?? Compondo...</span><span>{Math.round(progresso)}%</span></div><div style={{height:6,background:"rgba(123,47,255,.1)",borderRadius:99,overflow:"hidden"}}><div style={{height:"100%",width:progresso+"%",background:"linear-gradient(90deg,#7b2fff,#f472b6)",borderRadius:99,transition:"width .4s"}}/></div></div>}

        {erro&&<div style={{color:"#f87171",fontSize:13,marginBottom:8}}>?? {erro}</div>}

        <button className="btn btn-full" onClick={gerar} disabled={loading}>{loading?"? Compondo...":"?? Gerar Música — 3 créditos"}</button>

      </div>

      {resultado&&(

      <div className="card">

        <div className="card-title" style={{marginBottom:12}}>? Música gerada!</div>

        <audio src={resultado} controls style={{width:"100%",marginBottom:10}}/>

        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:10}}>

          <a href={resultado} download="vortex-musica.mp3" className="btn"

            style={{textDecoration:"none",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12}}>

            ?? Baixar MP3

          </a>

          <button className="btn" style={{fontSize:12}} onClick={()=>{

            navigator.clipboard.writeText(resultado);

            alert("? Link copiado!");

          }}>?? Copiar link</button>

        </div>

        <div style={{display:"flex",gap:8,justifyContent:"center"}}>

          <button onClick={()=>{fetch(`${BACKEND}/cerebro/feedback`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({tipo:"musica",conteudo:resultado,aprovado:true,estilo:estilo})});alert("? Vortex aprendeu!");}} style={{fontSize:18,background:"none",border:"none",cursor:"pointer"}}>??</button>

          <button onClick={()=>{fetch(`${BACKEND}/cerebro/feedback`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({tipo:"musica",conteudo:resultado,aprovado:false,estilo:estilo})});alert("?? Obrigado!");}} style={{fontSize:18,background:"none",border:"none",cursor:"pointer"}}>??</button>

        </div>

      </div>

    )}

    </div>

  );

}



function ScoreViral() {

  const [roteiro,setRoteiro]=useState("");

  const [loading,setLoading]=useState(false);

  const [resultado,setResultado]=useState(null);

  const [erro,setErro]=useState("");

  const [feedbackDado,setFeedbackDado]=useState(false);



  const analisar=async()=>{

    if(!roteiro.trim())return;

    setLoading(true);setErro("");setResultado(null);setFeedbackDado(false);

    try{

      const res=await fetch(`${BACKEND}/score-viral`,{

        method:"POST",

        headers:{"Content-Type":"application/json"},

        body:JSON.stringify({roteiro})

      });

      if(!res.ok){const e=await res.json().catch(()=>({}));throw new Error(e?.detail||"Erro");}

      const d=await res.json();

      setResultado(d.score);

    }catch(e){setErro(e.message);}

    finally{setLoading(false);}

  };



  // Extrair scores do texto retornado

  const extrairScores=(txt)=>{

    if(!txt)return null;

    const dims=[

      {key:"hook",label:"Hook",icon:"??",color:"#f472b6"},

      {key:"retencao",label:"Retenção",icon:"???",color:"#22d3ee"},

      {key:"emocao",label:"Emoção",icon:"??",color:"#f87171"},

      {key:"shares",label:"Shares",icon:"??",color:"#34d399"},

      {key:"comentario",label:"Comentários",icon:"??",color:"#fbbf24"},

    ];

    const scores=[];

    dims.forEach(d=>{

      const patterns=[

        new RegExp(d.label+"[^0-9]*(\d+(?:\.\d+)?)","i"),

        new RegExp(d.key+"[^0-9]*(\d+(?:\.\d+)?)","i"),

      ];

      for(const p of patterns){

        const m=txt.match(p);

        if(m){scores.push({...d,valor:parseFloat(m[1])});break;}

      }

    });

    const mediaMatch=txt.match(/média[^0-9]*(\d+(?:\.\d+)?)/i)||txt.match(/score[^0-9]*(\d+(?:\.\d+)?)/i)||txt.match(/MÉDIA[^0-9]*(\d+(?:\.\d+)?)/i);

    const media=mediaMatch?parseFloat(mediaMatch[1]):scores.length>0?scores.reduce((a,b)=>a+b.valor,0)/scores.length:0;

    return{dims:scores,media:Math.round(media*10)/10,txt};

  };



  const sc=resultado?extrairScores(resultado):null;

  const mediaColor=sc?.media>=8?"#34d399":sc?.media>=6?"#fbbf24":"#f87171";

  const mediaLabel=sc?.media>=8?"?? Alto potencial viral":sc?.media>=6?"? Potencial moderado":"?? Precisa melhorar";



  return(

    <div className="page">

      <div className="page-header">

        <div className="eyebrow"><div className="eyebrow-dot"/>Análise</div>

        <h1 className="page-title">Score <em>Viral</em></h1>

        <p className="page-sub">Analise o potencial do seu roteiro em 5 dimensões.</p>

        <div style={{display:"inline-flex",alignItems:"center",gap:6,marginTop:6,

          background:"rgba(52,211,153,.1)",border:".5px solid rgba(52,211,153,.3)",

          borderRadius:20,padding:"4px 12px"}}>

          <span style={{fontSize:12}}>?</span>

          <span style={{fontSize:11,color:"#34d399",fontWeight:600}}>Grátis e ilimitado — use sem créditos</span>

        </div>

      </div>



      <div className="card" style={{marginBottom:"1rem"}}>

        <div className="field">

          <label className="label">Cole seu roteiro aqui</label>

          <textarea className="input" rows={7}

            placeholder="Cole o roteiro que quer analisar... quanto mais detalhado, mais preciso o score."

            value={roteiro} onChange={e=>setRoteiro(e.target.value)} disabled={loading}/>

        </div>

        <div style={{fontSize:11,color:"var(--text3)",marginBottom:10}}>

          {roteiro.length} caracteres · ~{Math.ceil(roteiro.split(" ").length/2)} seg de fala

        </div>

        {erro&&<div className="erro">?? {erro}</div>}

        <button className="btn btn-full" onClick={analisar} disabled={loading||!roteiro.trim()}>

          {loading?<><div className="spinner"/>Analisando com IA...</>:"? Analisar Score Viral — Grátis 8"}

        </button>

      </div>



      {sc&&(

        <div>

          {/* Score geral */}

          <div className="card" style={{marginBottom:12,textAlign:"center"}}>

            <div style={{fontSize:11,color:"var(--text3)",letterSpacing:".1em",marginBottom:8}}>SCORE VIRAL GERAL</div>

            <div style={{fontSize:64,fontFamily:"var(--fh)",fontWeight:800,color:mediaColor,lineHeight:1,

              textShadow:`0 0 30px ${mediaColor}66`}}>

              {sc.media}

            </div>

            <div style={{fontSize:12,color:"var(--text3)",marginBottom:8}}>/10</div>

            <div style={{fontSize:14,fontWeight:600,color:mediaColor}}>{mediaLabel}</div>

          </div>



          {/* Dimensões */}

          {sc.dims.length>0&&(

            <div className="card" style={{marginBottom:12}}>

              <div className="card-title" style={{marginBottom:12}}>?? 5 Dimensões</div>

              {sc.dims.map((d,i)=>(

                <div key={i} style={{marginBottom:14}}>

                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}>

                    <span style={{fontSize:13,color:"var(--text2)"}}>{d.icon} {d.label}</span>

                    <span style={{fontSize:13,fontWeight:700,color:d.color}}>{d.valor}/10</span>

                  </div>

                  <div style={{height:7,background:"rgba(255,255,255,.06)",borderRadius:99,overflow:"hidden"}}>

                    <div style={{height:"100%",width:(d.valor*10)+"%",background:d.color,borderRadius:99,

                      boxShadow:`0 0 10px ${d.color}88`,transition:"width 1s ease"}}/>

                  </div>

                </div>

              ))}

            </div>

          )}



          {/* Texto completo */}

          <div className="card" style={{marginBottom:12}}>

            <div className="card-title" style={{marginBottom:10}}>?? Análise completa</div>

            <div style={{whiteSpace:"pre-wrap",fontSize:13,lineHeight:1.8,color:"var(--text2)"}}>{sc.txt}</div>

          </div>



          {/* Feedback cérebro */}

          {!feedbackDado&&(

            <div className="card" style={{background:"rgba(123,47,255,.04)",border:".5px solid rgba(123,47,255,.15)"}}>

              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>

                <span style={{fontSize:12,color:"var(--text3)",flex:1}}>?? Esse score foi útil?</span>

              </div>

              <div style={{display:"flex",gap:8}}>

                <button onClick={()=>{

                  fetch(`${BACKEND}/cerebro/feedback`,{method:"POST",headers:{"Content-Type":"application/json"},

                    body:JSON.stringify({tipo:"score",conteudo:roteiro,aprovado:true,score_viral:sc.media})});

                  setFeedbackDado(true);

                }} className="btn" style={{flex:1,fontSize:13}}>?? Útil</button>

                <button onClick={()=>{

                  fetch(`${BACKEND}/cerebro/feedback`,{method:"POST",headers:{"Content-Type":"application/json"},

                    body:JSON.stringify({tipo:"score",conteudo:roteiro,aprovado:false,score_viral:sc.media})});

                  setFeedbackDado(true);

                }} className="btn" style={{flex:1,fontSize:13,background:"rgba(255,100,100,.08)",borderColor:"rgba(255,100,100,.2)"}}>?? Melhorar</button>

              </div>

            </div>

          )}

          {feedbackDado&&<div style={{textAlign:"center",fontSize:13,color:"#34d399",padding:8}}>? Vortex aprendeu! Obrigado.</div>}

        </div>

      )}

    </div>

  );

}





function MemoriaVortex() {

  const [mem,setMem]=useState(()=>{try{return JSON.parse(localStorage.getItem("vortex_memory")||"{}"); }catch{return{};}});

  const [perfil]=useState(()=>loadUserProfile());

  const [editando,setEditando]=useState(null);

  const [temp,setTemp]=useState("");



  const salvarItem=(chave,valor)=>{

    const novo={...mem,[chave]:valor};

    setMem(novo);

    localStorage.setItem("vortex_memory",JSON.stringify(novo));

    setEditando(null);

  };



  const removerItem=(chave)=>{

    const novo={...mem};

    delete novo[chave];

    setMem(novo);

    localStorage.setItem("vortex_memory",JSON.stringify(novo));

  };



  const CAMPOS=[

    {key:"estilo_escrita",label:"Estilo de escrita",icon:"??",placeholder:"Ex: informal, com humor, direto ao ponto"},

    {key:"publico_alvo",label:"Público-alvo",icon:"??",placeholder:"Ex: jovens 18-25, gamers, mães empreendedoras"},

    {key:"formatos_favoritos",label:"Formatos favoritos",icon:"??",placeholder:"Ex: talking head, POV, trending sounds"},

    {key:"evitar",label:"O que evitar",icon:"??",placeholder:"Ex: palavrão, política, assuntos pesados"},

    {key:"cta_favorito",label:"CTA favorito",icon:"??",placeholder:"Ex: Me segue pra mais! Comenta X se concordar"},

    {key:"referencias",label:"Referências/inspirações",icon:"?",placeholder:"Ex: @fulano, Nubank, estilo Hormozi"},

  ];



  return(

    <div className="page">

      <div className="page-header">

        <div className="eyebrow"><div className="eyebrow-dot"/>Personalização</div>

        <h1 className="page-title">Memória do <em>Vortex</em></h1>

        <p className="page-sub">O Vortex aprende com você. Essas informações ficam em todos os roteiros.</p>

      </div>



      {/* Perfil resumido */}

      <div className="card" style={{marginBottom:12,background:"rgba(123,47,255,.04)",border:".5px solid rgba(123,47,255,.15)"}}>

        <div style={{display:"flex",gap:12,alignItems:"center"}}>

          <div style={{width:44,height:44,borderRadius:12,background:"linear-gradient(135deg,#7b2fff,#9d5cff)",

            display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,flexShrink:0}}>

            {perfil.nicho==="terror"?"??":perfil.nicho==="gaming"?"??":perfil.nicho==="finanças"?"??":"??"}

          </div>

          <div>

            <div style={{fontSize:14,fontWeight:700,color:"var(--text)"}}>{perfil.nome||"Criador Vortex"}</div>

            <div style={{fontSize:12,color:"var(--text3)"}}>

              {perfil.nicho||"nicho não definido"} · {perfil.plataforma||"plataforma não definida"}

            </div>

          </div>

          <div style={{marginLeft:"auto",fontSize:11,color:"#7b2fff"}}>

            {Object.keys(mem).length} memórias salvas

          </div>

        </div>

      </div>



      {/* Campos de memória */}

      {CAMPOS.map(c=>(

        <div key={c.key} className="card" style={{marginBottom:10}}>

          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:editando===c.key?10:0}}>

            <div style={{display:"flex",alignItems:"center",gap:8}}>

              <span style={{fontSize:16}}>{c.icon}</span>

              <div>

                <div style={{fontSize:13,fontWeight:600,color:"var(--text)"}}>{c.label}</div>

                {mem[c.key]&&editando!==c.key&&(

                  <div style={{fontSize:12,color:"var(--text2)",marginTop:2}}>{mem[c.key]}</div>

                )}

                {!mem[c.key]&&editando!==c.key&&(

                  <div style={{fontSize:11,color:"var(--text3)"}}>Não definido</div>

                )}

              </div>

            </div>

            <div style={{display:"flex",gap:6,flexShrink:0}}>

              {mem[c.key]&&editando!==c.key&&(

                <button onClick={()=>removerItem(c.key)} style={{fontSize:11,color:"#f87171",background:"none",border:"none",cursor:"pointer"}}>?</button>

              )}

              <button onClick={()=>{setEditando(editando===c.key?null:c.key);setTemp(mem[c.key]||"");}}

                style={{fontSize:11,color:"var(--accent)",background:"rgba(123,47,255,.1)",

                  border:".5px solid rgba(123,47,255,.2)",borderRadius:6,padding:"3px 8px",cursor:"pointer"}}>

                {editando===c.key?"Cancelar":"Editar"}

              </button>

            </div>

          </div>

          {editando===c.key&&(

            <div>

              <input className="input" placeholder={c.placeholder} value={temp}

                onChange={e=>setTemp(e.target.value)}

                onKeyDown={e=>e.key==="Enter"&&salvarItem(c.key,temp)}

                style={{marginBottom:8}} autoFocus/>

              <button className="btn btn-full" onClick={()=>salvarItem(c.key,temp)}>?? Salvar</button>

            </div>

          )}

        </div>

      ))}



      <div style={{textAlign:"center",fontSize:12,color:"var(--text3)",padding:"8px 0"}}>

        ?? Essas memórias são usadas automaticamente em roteiros, chat e análises.

      </div>

    </div>

  );

}





function MeusProjetos() {

  const [historico,setHistorico]=useState([]);

  useEffect(()=>{fetch(`${BACKEND}/creditos/historico`).then(r=>r.json()).then(d=>setHistorico(d.historico||[])).catch(()=>{});},[]);

  const ICONS={chat:"??",roteiro:"??",gerar_imagem:"??",gerar_video:"??",gerar_voz:"???",gerar_musica:"??",score_viral:"?"};

  return(<div className="page"><div className="page-header"><div className="eyebrow"><div className="eyebrow-dot"/>meu espaço</div><h1 className="page-title">Meus <em>Projetos</em></h1><p className="page-sub">Histórico de criações.</p></div>{historico.length===0&&<div className="card" style={{textAlign:"center",padding:"3rem"}}><div style={{fontSize:48,marginBottom:12}}>??</div><p style={{color:"var(--text3)"}}>Nenhum projeto ainda.</p></div>}{historico.filter(h=>h.tipo==="debito").reverse().map((h,i)=><div key={i} className="card" style={{display:"flex",alignItems:"center",gap:12,padding:"12px 14px",marginBottom:6}}><span style={{fontSize:22,flexShrink:0}}>{ICONS[h.operacao?.split("_").slice(0,2).join("_")]||"??"}</span><div style={{flex:1}}><div style={{fontSize:13,fontWeight:500,color:"var(--text)",textTransform:"capitalize"}}>{(h.operacao||"").replace(/_/g," ")}</div><div style={{fontSize:11,color:"var(--text3)"}}>{new Date(h.timestamp).toLocaleString("pt-BR",{day:"2-digit",month:"2-digit",hour:"2-digit",minute:"2-digit"})}</div></div><div style={{fontSize:12,color:"#f87171",fontWeight:600,flexShrink:0}}>-{h.quantidade} ??</div></div>)}</div>);

}



// ==============================

const CURRENCIES = {

  BRL:{ symbol:"R$", code:"BRL", rate:1    },

  USD:{ symbol:"$",  code:"USD", rate:0.20 },

  EUR:{ symbol:"€",  code:"EUR", rate:0.18 },

};



async function detectCurrency() {

  try {

    const res = await fetch("https://ipapi.co/json/",{signal:AbortSignal.timeout(3000)});

    const d = await res.json();

    if (d.country_code==="BR") return "BRL";

    if (["DE","FR","IT","ES","PT","NL","BE","AT","GR","FI","IE"].includes(d.country_code)) return "EUR";

    return "USD";

  } catch {

    const lang = navigator.language||"en";

    if (lang.startsWith("pt")) return "BRL";

    return "USD";

  }

}



function useCurrency() {

  // Moedas internacionais desativadas — só BRL por enquanto

  const currency = "BRL";

  const setCurrency = () => {};

  const fmt = (brlVal) => `R$${brlVal}`;

  return { currency, setCurrency, fmt };

}



function Creditos() {

  const now = new Date();

  const LAUNCH_DATE = new Date("2026-07-15T00:00:00-03:00");

  const PROMO_END   = new Date("2026-08-15T00:00:00-03:00");

  const isPromo   = now >= LAUNCH_DATE && now < PROMO_END;

  const preLaunch = now < LAUNCH_DATE;

  const showPromo = isPromo || preLaunch;

  const [tab,setTab]     = useState("mensal");

  const [sel,setSel]     = useState(null);

  const [timeLeft,setTimeLeft] = useState({d:0,h:0,m:0,s:0});

  const fmt = (v) => `R$${v}`;



  useEffect(()=>{

    const target = preLaunch ? LAUNCH_DATE : isPromo ? PROMO_END : null;

    if(!target) return;

    const tick=()=>{

      const diff=target-new Date();

      if(diff<=0){setTimeLeft({d:0,h:0,m:0,s:0});return;}

      setTimeLeft({d:Math.floor(diff/86400000),h:Math.floor((diff%86400000)/3600000),m:Math.floor((diff%3600000)/60000),s:Math.floor((diff%60000)/1000)});

    };

    tick(); const id=setInterval(tick,1000); return()=>clearInterval(id);

  },[]);



  const planos = PLANOS_BASE.map(p=>({...p,promo:p.preco_mensal}));

  const preco = (p) => showPromo ? p.promo : p.normal;

  const creditos_tab = (p) => p.creditos;

  const pad = n => String(n).padStart(2,"0");



  return (

    <div className="page">

      <div className="page-header">

        <div className="eyebrow"><div className="eyebrow-dot"/>planos</div>

        <h1 className="page-title">Escolha seu <em>Plano</em></h1>

        <p className="page-sub">Todos os planos com créditos que renovam todo mês.</p>

      </div>



      {/* Countdown */}

      {(preLaunch||isPromo)&&(

        <div className="card" style={{marginBottom:12,background:"rgba(123,47,255,.06)",border:".5px solid rgba(123,47,255,.2)",textAlign:"center"}}>

          <div style={{fontSize:11,color:"var(--text3)",marginBottom:6,letterSpacing:".1em"}}>

            {preLaunch?"?? LANÇAMENTO EM":"? PREÇO DE LANÇAMENTO POR"}

          </div>

          <div style={{display:"flex",justifyContent:"center",gap:12}}>

            {[{v:timeLeft.d,l:"dias"},{v:timeLeft.h,l:"horas"},{v:timeLeft.m,l:"min"},{v:timeLeft.s,l:"seg"}].map(t=>(

              <div key={t.l} style={{textAlign:"center"}}>

                <div style={{fontFamily:"var(--fh)",fontSize:28,fontWeight:800,color:"var(--accent)"}}>{pad(t.v)}</div>

                <div style={{fontSize:10,color:"var(--text3)"}}>{t.l}</div>

              </div>

            ))}

          </div>

          {showPromo&&<div style={{fontSize:11,color:"#34d399",marginTop:6}}>?? Preço de lançamento — garanta agora e mantém para sempre!</div>}

        </div>

      )}



      {/* Seletor de tab */}

      <div style={{display:"flex",alignItems:"center",marginBottom:"1.25rem"}}>

        <div style={{display:"flex",gap:6}}>

          {["mensal","creditos"].map(t=>(

            <button key={t} onClick={()=>setTab(t)} style={{padding:"7px 18px",borderRadius:99,border:`.5px solid ${tab===t?"rgba(123,47,255,.5)":"var(--border2)"}`,background:tab===t?"rgba(123,47,255,.15)":"transparent",color:tab===t?"var(--purple2)":"var(--text3)",fontFamily:"var(--fh)",fontSize:12,fontWeight:700,cursor:"pointer"}}>

              {t==="mensal"?"?? Mensal":"?? Créditos Avulsos"}

            </button>

          ))}

        </div>

      </div>



      {/* Card do plano Free */}

      {tab!=="creditos"&&(

        <div className="card" style={{marginBottom:12,background:"rgba(52,211,153,.04)",border:".5px solid rgba(52,211,153,.2)"}}>

          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:8}}>

            <div style={{display:"flex",alignItems:"center",gap:10}}>

              <span style={{fontSize:24}}>??</span>

              <div>

                <div style={{fontSize:14,fontWeight:700,color:"var(--text)"}}>Plano Free — R$0/mês</div>

                <div style={{fontSize:11,color:"var(--text3)"}}>50 créditos • ?? Tendências ilimitado • ? Score ilimitado • 3 roteiros/dia</div>

              </div>

            </div>

            <div style={{display:"flex",gap:6,alignItems:"center"}}>

              <span style={{fontSize:11,color:"#34d399",background:"rgba(52,211,153,.1)",border:".5px solid rgba(52,211,153,.3)",padding:"3px 10px",borderRadius:20,fontWeight:700}}>PLANO ATUAL</span>

              <button className="btn" style={{fontSize:12,padding:"6px 14px"}} onClick={()=>setSel("starter")}>?? Fazer upgrade</button>

            </div>

          </div>

        </div>

      )}



      {/* Cards de planos mensais */}

      {tab!=="creditos"&&(

        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))",gap:10,marginBottom:"1.5rem"}}>

          {planos.map(p=>{

            const planoAtual = loadUserProfile().plano || "free";

            return(

            <div key={p.id} onClick={()=>setSel(p.id)} style={{background:sel===p.id?p.cor+"18":"var(--bg3)",border:`1.5px solid ${sel===p.id?p.cor:"var(--border)"}`,borderRadius:"var(--r-lg)",padding:"1.25rem 1rem",cursor:"pointer",transition:"all .2s",position:"relative"}}>

              {p.popular&&<div style={{position:"absolute",top:-1,right:12,fontSize:9,fontWeight:700,background:"var(--purple)",color:"#fff",padding:"2px 8px",borderRadius:"0 0 6px 6px",letterSpacing:".06em"}}>? POPULAR</div>}

              {p.id==="elite"&&<div style={{position:"absolute",top:-1,left:12,fontSize:9,fontWeight:700,background:"linear-gradient(90deg,#f472b6,#7b2fff)",color:"#fff",padding:"2px 8px",borderRadius:"0 0 6px 6px",letterSpacing:".06em"}}>? ELITE</div>}

              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>

                <span style={{fontSize:22}}>{p.emoji}</span>

                <div>

                  <div style={{fontFamily:"var(--fh)",fontSize:"1rem",fontWeight:700}}>{p.nome}</div>

                  <div style={{fontSize:10,color:"var(--text3)"}}>{p.desc}</div>

                </div>

              </div>

              {p.modelo&&<div style={{fontSize:10,color:p.cor,background:p.cor+"18",border:`.5px solid ${p.cor}44`,padding:"2px 8px",borderRadius:20,display:"inline-block",marginBottom:8,fontWeight:600}}>?? {p.modelo}</div>}

              <div style={{display:"flex",alignItems:"baseline",gap:6,marginBottom:4}}>

                {showPromo&&<span style={{fontSize:11,color:"var(--text3)",textDecoration:"line-through"}}>{fmt(p.normal)}</span>}

                <span style={{fontFamily:"var(--fh)",fontSize:"1.8rem",fontWeight:800,letterSpacing:"-.04em",color:sel===p.id?p.cor:"var(--text)"}}>{fmt(preco(p))}</span>

                <span style={{fontSize:11,color:"var(--text3)"}}>/mês</span>

              </div>

              {showPromo&&<div style={{fontSize:10,color:"#34d399",marginBottom:4}}>?? {Math.round((1-preco(p)/p.normal)*100)}% off lançamento</div>}

              <div style={{fontSize:12,color:"var(--text2)",marginBottom:8,fontWeight:600}}>?? {creditos_tab(p).toLocaleString()} créditos/mês</div>

              {p.features&&sel===p.id&&(

                <div style={{marginBottom:10,display:"flex",flexDirection:"column",gap:4}}>

                  {p.features.map((f,i)=>(

                    <div key={i} style={{display:"flex",alignItems:"center",gap:6,fontSize:11,color:"var(--text2)"}}>

                      <span style={{color:"#34d399",fontSize:12}}>?</span>{f}

                    </div>

                  ))}

                </div>

              )}

              <button className="btn btn-full" style={{fontSize:12,marginTop:4,background:sel===p.id?"linear-gradient(135deg,var(--purple),var(--purple2))":"var(--bg3)",color:sel===p.id?"#fff":"var(--text3)",border:sel===p.id?"none":".5px solid var(--border)"}}

                onClick={(e)=>{e.stopPropagation();setSel(p.id);}}>

                {sel===p.id?"? Selecionado":"Selecionar"}

              </button>

            </div>

            );

          })}

        </div>

      )}



      {/* Packs avulsos */}

      {tab==="creditos"&&(

        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))",gap:10,marginBottom:"1.5rem"}}>

          {PACKS.map(p=>(

            <div key={p.id} onClick={()=>setSel("pack_"+p.id)} style={{background:sel==="pack_"+p.id?"rgba(123,47,255,.08)":"var(--bg3)",border:sel==="pack_"+p.id?"1px solid rgba(123,47,255,.5)":".5px solid var(--border)",borderRadius:"var(--r-lg)",padding:"1.25rem 1rem",cursor:"pointer",transition:"all .2s",position:"relative"}}>

              {p.popular&&<div style={{position:"absolute",top:-1,right:12,fontSize:9,background:"var(--purple)",color:"#fff",padding:"2px 8px",borderRadius:"0 0 6px 6px",fontWeight:700}}>? POPULAR</div>}

              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>

                <span style={{fontSize:22}}>{p.emoji||"??"}</span>

                <div style={{fontFamily:"var(--fh)",fontSize:"1rem",fontWeight:700,color:sel==="pack_"+p.id?p.cor||"var(--accent)":"var(--text)"}}>{p.nome}</div>

              </div>

              <div style={{fontSize:11,color:"var(--text3)",marginBottom:8}}>{p.desc}</div>

              <div style={{fontFamily:"var(--fh)",fontSize:"1.8rem",fontWeight:800,letterSpacing:"-.04em",color:p.cor||"var(--accent)",marginBottom:4}}>{fmt(showPromo?p.promo:p.normal)}</div>

              <div style={{fontSize:14,fontWeight:700,color:p.cor||"var(--accent)"}}>?? {p.creditos.toLocaleString()} créditos</div>

              <div style={{fontSize:10,color:"var(--text3)",marginTop:2}}>Não expiram · Uso livre</div>

              {sel==="pack_"+p.id&&p.features&&(

                <div style={{marginTop:8,display:"flex",flexDirection:"column",gap:3}}>

                  {p.features.map((f,i)=>(

                    <div key={i} style={{fontSize:11,color:"var(--text2)",display:"flex",gap:5}}>

                      <span style={{color:"#34d399"}}>?</span>{f}

                    </div>

                  ))}

                </div>

              )}

            </div>

          ))}

        </div>

      )}



      {/* Resumo do pedido */}

      {sel&&(

        <div style={{background:"var(--bg3)",border:".5px solid var(--border)",borderRadius:"var(--r-lg)",padding:"1.25rem",marginBottom:"1.5rem"}}>

          <div className="card-title" style={{marginBottom:".75rem"}}>Resumo do pedido</div>

          {(()=>{

            const isPack = sel.startsWith("pack_");

            const item = isPack ? PACKS.find(p=>"pack_"+p.id===sel) : planos.find(p=>p.id===sel);

            if(!item) return null;

            const valor = isPack ? (showPromo?item.promo:item.normal) : preco(item);

            return(

              <>

                <div style={{display:"flex",justifyContent:"space-between",fontSize:13,padding:"7px 0",borderBottom:".5px solid var(--border)"}}>

                  <span>{item.nome}</span>

                  <span style={{fontWeight:700}}>{fmt(valor)}{!isPack?"/mês":""}</span>

                </div>

                <div style={{display:"flex",justifyContent:"space-between",padding:"12px 0 0",fontSize:15,fontWeight:800}}>

                  <span>Total</span>

                  <span style={{color:"var(--accent)"}}>{fmt(valor)}</span>

                </div>

                <button className="btn btn-full" style={{marginTop:"1rem"}} onClick={async()=>{

                  try{

                    const planId = isPack ? "pack_"+item.id : item.id+"_mensal";

                    const r = await fetch(`${BACKEND}/criar-pagamento`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({plano_id:planId,usuario_id:getSessionId()})});

                    if(r.ok){const d=await r.json();if(d.checkout_url)window.open(d.checkout_url,"_blank");}

                    else alert("Configure o MP_ACCESS_TOKEN no servidor.");

                  }catch{alert("Backend offline.");}

                }}>Pagar com Mercado Pago ?</button>

              </>

            );

          })()}

        </div>

      )}

    </div>

  );

}





function Configuracoes() {

  const [config,setConfig]=useState(()=>{

    try{return JSON.parse(localStorage.getItem("vortex_config")||"{}");}

    catch{return {};}

  });

  const [perfil,setPerfil]=useState(()=>loadUserProfile());

  const [msg,setMsg]=useState("");

  const [aba,setAba]=useState("perfil");



  const set=(k,v)=>setConfig(c=>({...c,[k]:v}));

  const setPer=(k,v)=>setPerfil(c=>({...c,[k]:v}));



  const salvar=()=>{

    localStorage.setItem("vortex_config",JSON.stringify(config));

    localStorage.setItem("vortex_user_profile",JSON.stringify(perfil));

    setMsg("? Salvo!");

    setTimeout(()=>setMsg(""),3000);

  };



  const NICHOS=["terror","gaming","finanças","fitness","lifestyle","tech","motivacional","culinária","humor","anime","educacional","empreendedorismo"];

  const PLATS=["TikTok","Instagram","YouTube","Kwai","Pinterest"];

  const IDIOMAS=["Português","Inglês","Espanhol"];



  return(

    <div className="page">

      <div className="page-header">

        <div className="eyebrow"><div className="eyebrow-dot"/>Sistema</div>

        <h1 className="page-title">Configu<em>rações</em></h1>

        <p className="page-sub">Personalize o Vortex para o seu perfil.</p>

      </div>



      {/* Abas */}

      <div style={{display:"flex",gap:6,marginBottom:16,background:"rgba(255,255,255,.04)",borderRadius:12,padding:4}}>

        {[{id:"perfil",icon:"??",label:"Perfil"},{id:"preferencias",icon:"??",label:"Preferências"},{id:"funcoes",icon:"??",label:"Funções"}].map(t=>(

          <button key={t.id} onClick={()=>setAba(t.id)}

            style={{flex:1,padding:"8px 4px",borderRadius:9,border:"none",cursor:"pointer",fontSize:12,fontWeight:600,

              background:aba===t.id?"rgba(123,47,255,.25)":"transparent",

              color:aba===t.id?"#c4a0ff":"#4a4470",transition:"all .18s"}}>

            {t.icon} {t.label}

          </button>

        ))}

      </div>



      {/* ABA PERFIL */}

      {aba==="perfil"&&(

        <div className="card" style={{marginBottom:12}}>

          <div className="card-title" style={{marginBottom:14}}>?? Seu perfil de criador</div>



          <div className="field">

            <label className="label">Nome / Apelido</label>

            <input className="input" placeholder="Ex: João, @joaocriador" value={perfil.nome||""} onChange={e=>setPer("nome",e.target.value)}/>

          </div>



          <div className="field">

            <label className="label">Seu nicho principal</label>

            <div className="chips">

              {NICHOS.map(n=><button key={n} className={"chip "+(perfil.nicho===n?"active":"")} onClick={()=>setPer("nicho",n)}>{n}</button>)}

            </div>

          </div>



          <div className="field">

            <label className="label">Plataforma principal</label>

            <div className="chips">

              {PLATS.map(p=><button key={p} className={"chip "+(perfil.plataforma===p?"active":"")} onClick={()=>setPer("plataforma",p)}>{p}</button>)}

            </div>

          </div>



          <div className="field">

            <label className="label">Idioma dos conteúdos</label>

            <div className="chips">

              {IDIOMAS.map(i=><button key={i} className={"chip "+(perfil.idioma===i?"active":"")} onClick={()=>setPer("idioma",i)}>{i}</button>)}

            </div>

          </div>



          <div className="field">

            <label className="label">Tom de voz do conteúdo</label>

            <div className="chips">

              {["Informal","Profissional","Humorístico","Dramático","Educativo"].map(t=>(

                <button key={t} className={"chip "+(perfil.tom===t?"active":"")} onClick={()=>setPer("tom",t)}>{t}</button>

              ))}

            </div>

          </div>



          <div className="field">

            <label className="label">Link do seu perfil <span style={{color:"var(--text3)",fontSize:10}}>(opcional)</span></label>

            <input className="input" placeholder="@seuusuario ou link completo" value={perfil.link||""} onChange={e=>setPer("link",e.target.value)}/>

          </div>

        </div>

      )}



      {/* ABA PREFERÊNCIAS */}

      {aba==="preferencias"&&(

        <div className="card" style={{marginBottom:12}}>

          <div className="card-title" style={{marginBottom:14}}>?? Preferências do app</div>



          <div className="field">

            <label className="label">Duração padrão do roteiro</label>

            <div className="chips">

              {["15s","30s","60s","3min"].map(d=>(

                <button key={d} className={"chip "+(config.duracao_padrao===d?"active":"")} onClick={()=>set("duracao_padrao",d)}>{d}</button>

              ))}

            </div>

          </div>



          <div className="field">

            <label className="label">Modelo padrão de chat</label>

            <div className="chips">

              {["Auto (melhor disponível)","Claude","GPT-4o","Gemini","Groq (rápido)"].map(m=>(

                <button key={m} className={"chip "+(config.modelo_padrao===m?"active":"")} onClick={()=>set("modelo_padrao",m)}>{m}</button>

              ))}

            </div>

          </div>



          <div className="field">

            <label className="label">País para tendências</label>

            <div className="chips">

              {["???? Brasil","???? EUA","???? Portugal","???? México"].map(p=>(

                <button key={p} className={"chip "+(config.pais===p?"active":"")} onClick={()=>set("pais",p)}>{p}</button>

              ))}

            </div>

          </div>

        </div>

      )}



      {/* ABA FUNÇÕES */}

      {aba==="funcoes"&&(

        <div className="card" style={{marginBottom:12}}>

          <div className="card-title" style={{marginBottom:14}}>?? Funções ativas</div>

          {[

            {key:"analise_perfil",name:"Análise de Perfil",desc:"Analisa perfis de redes sociais",icon:"??"},

            {key:"roteiro",name:"Gerador de Roteiro",desc:"Roteiros virais com IA",icon:"??"},

            {key:"tendencias",name:"Tendências",desc:"Google Trends em tempo real",icon:"??"},

            {key:"gerador_imagem",name:"Imagens IA",desc:"FLUX, DALL-E e mais",icon:"??"},

            {key:"gerador_video",name:"Vídeos IA",desc:"Disponível em julho",icon:"??"},

            {key:"clonador_voz",name:"Clonar Voz",desc:"ElevenLabs voice cloning",icon:"???"},

            {key:"musica",name:"Gerar Música",desc:"Trilhas para vídeos",icon:"??"},

            {key:"score_viral",name:"Score Viral",desc:"Analisa potencial viral",icon:"?"},

          ].map(f=>(

            <div key={f.key} style={{display:"flex",alignItems:"center",gap:12,padding:"10px 0",borderBottom:".5px solid var(--border)"}}>

              <span style={{fontSize:18}}>{f.icon}</span>

              <div style={{flex:1}}>

                <div style={{fontSize:13,fontWeight:600,color:"var(--text)"}}>{f.name}</div>

                <div style={{fontSize:11,color:"var(--text3)"}}>{f.desc}</div>

              </div>

              <button className={"toggle "+(config[f.key]!==false?"on":"")}

                onClick={()=>set(f.key,config[f.key]===false?true:false)}/>

            </div>

          ))}

        </div>

      )}



      {msg&&<div style={{textAlign:"center",fontSize:13,color:"#34d399",padding:8,marginBottom:8}}>{msg}</div>}

      <button className="btn btn-full" onClick={salvar}>?? Salvar configurações</button>

    </div>

  );

}





function WelcomeScreen({ onEnter }) {

  const cvRef = useRef(null);

  const [twText, setTwText] = useState("");

  const [twSub, setTwSub] = useState("");

  const [showSub, setShowSub] = useState(false);

  const [ready, setReady] = useState(false);



  useEffect(() => {

    const cv = cvRef.current; if (!cv) return;

    const cx = cv.getContext("2d");

    const resize = () => { cv.width = cv.offsetWidth||800; cv.height = cv.offsetHeight||600; };

    resize();

    const W = cv.width, H = cv.height;

    const CX = W/2, CY = H/2;

    const rand = (a,b) => Math.random()*(b-a)+a;

    let t=0, raf;



    // Canvas só com partículas sobre a imagem — sem buraco negro desenhado



    const stars = Array.from({length:300},()=>({

      x:CX+rand(-30,30), y:CY+rand(-30,30),

      r:rand(.2,1.8),

      a:rand(.3,.9),phase:rand(0,Math.PI*2),speed:rand(.3,.8),

      color:Math.random()<.35?"#c4a0ff":Math.random()<.2?"#f472b6":Math.random()<.15?"#7b2fff":Math.random()<.1?"#22d3ee":"#fff"

    }));



    const shoots=[];

    const si=setInterval(()=>shoots.push({x:rand(W*.05,W*.85),y:rand(0,H*.4),len:rand(60,140),angle:rand(.2,.6),speed:rand(8,16),life:1,decay:rand(.018,.032)}),2500);



    const draw=()=>{

      cx.clearRect(0,0,W,H); t+=.014;



      // Partículas saindo do centro (buraco negro na imagem)

      stars.forEach(s=>{

        const tw=s.a*(.3+.7*Math.sin(t*s.speed+s.phase));

        cx.beginPath();cx.arc(s.x,s.y,s.r,0,Math.PI*2);

        cx.fillStyle=s.color;cx.globalAlpha=tw*.7;cx.fill();

        // Move partículas para fora do centro (efeito vórtice)

        const dx=s.x-CX, dy=s.y-CY;

        const dist=Math.sqrt(dx*dx+dy*dy)||1;

        s.x+=dx/dist*(0.3+dist*.002);

        s.y+=dy/dist*(0.3+dist*.002);

        // Reset quando sair da tela

        if(s.x<0||s.x>W||s.y<0||s.y>H){

          s.x=CX+rand(-20,20); s.y=CY+rand(-20,20);

        }

      });

      cx.globalAlpha=1;



      // Estrelas cadentes roxas

      for(let i=shoots.length-1;i>=0;i--){

        const s=shoots[i];

        const ex=s.x+Math.cos(s.angle)*s.len,ey=s.y+Math.sin(s.angle)*s.len;

        const g=cx.createLinearGradient(s.x,s.y,ex,ey);

        g.addColorStop(0,"rgba(255,255,255,0)");

        g.addColorStop(.5,`rgba(180,100,255,${s.life*.7})`);

        g.addColorStop(1,"rgba(255,255,255,0)");

        cx.beginPath();cx.moveTo(s.x,s.y);cx.lineTo(ex,ey);

        cx.strokeStyle=g;cx.lineWidth=1.2;cx.stroke();

        s.x+=Math.cos(s.angle)*s.speed;s.y+=Math.sin(s.angle)*s.speed;s.life-=s.decay;

        if(s.life<=0)shoots.splice(i,1);

      }



      raf=requestAnimationFrame(draw);

    };

    draw();

    return()=>{cancelAnimationFrame(raf);clearInterval(si);};

  },[]);



  // Typewriter

  useEffect(()=>{

    const LINES=[

      {h:"Crie conteúdo\nque viraliza.",s:"Roteiros, hooks e tendências com IA."},



      {h:"Do nada ao vídeo\nem segundos.",s:"Cole o tema — o Vortex faz o resto."},



      {h:"Trends antes\nde todos.",s:"Fique um passo à frente do algoritmo."},



      {h:"Seu criativo.\nNossa inteligência.",s:"Estúdio de IA para criadores brasileiros."},



    ];

    let idx=0,ci=0,phase="type",timer;

    const step=()=>{

      const line=LINES[idx];

      if(phase==="type"){

        if(ci<=line.h.length){setTwText(line.h.slice(0,ci));ci++;timer=setTimeout(step,ci<4?140:ci%7===0?90:50);}

        else{setTwSub(line.s);setShowSub(true);phase="wait";timer=setTimeout(step,2800);if(idx===0)setTimeout(()=>setReady(true),1200);}

      }else if(phase==="wait"){phase="erase";setShowSub(false);timer=setTimeout(step,550);}

      else{if(ci>0){ci--;setTwText(line.h.slice(0,ci));timer=setTimeout(step,22);}else{idx=(idx+1)%LINES.length;phase="type";timer=setTimeout(step,380);}}

    };

    step();

    return()=>clearTimeout(timer);

  },[]);



  return (

    <div style={{position:"fixed",inset:0,zIndex:300,background:"#000",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",overflow:"hidden"}}>

    <div style={{position:"fixed",inset:0,zIndex:300,background:"#000",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",overflow:"hidden"}}>

      <video autoPlay loop muted playsInline style={{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover",opacity:1}}><source src="/bg.mp4" type="video/mp4"/></video>

      <canvas ref={cvRef} style={{position:"absolute",inset:0,width:"100%",height:"100%",opacity:0.4}}/>

      <div style={{position:"absolute",inset:0,zIndex:1,pointerEvents:"none"}}><svg style={{position:"absolute",width:0,height:0}}><defs><filter id="goldToViolet" x="0%" y="0%" width="100%" height="100%" colorInterpolationFilters="sRGB"><feColorMatrix type="matrix" values="0.7 0.0 0.0 0 0.0 0.0 0.6 0.0 0 0.0 0.3 0.3 1.0 0 0.0 0 0 0 1 0"/></filter></defs></svg><img src="data:image/png;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/4gHYSUNDX1BST0ZJTEUAAQEAAAHIAAAAAAQwAABtbnRyUkdCIFhZWiAH4AABAAEAAAAAAABhY3NwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAA9tYAAQAAAADTLQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAlkZXNjAAAA8AAAACRyWFlaAAABFAAAABRnWFlaAAABKAAAABRiWFlaAAABPAAAABR3dHB0AAABUAAAABRyVFJDAAABZAAAAChnVFJDAAABZAAAAChiVFJDAAABZAAAAChjcHJ0AAABjAAAADxtbHVjAAAAAAAAAAEAAAAMZW5VUwAAAAgAAAAcAHMAUgBHAEJYWVogAAAAAAAAb6IAADj1AAADkFhZWiAAAAAAAABimQAAt4UAABjaWFlaIAAAAAAAACSgAAAPhAAAts9YWVogAAAAAAAA9tYAAQAAAADTLXBhcmEAAAAAAAQAAAACZmYAAPKnAAANWQAAE9AAAApbAAAAAAAAAABtbHVjAAAAAAAAAAEAAAAMZW5VUwAAACAAAAAcAEcAbwBvAGcAbABlACAASQBuAGMALgAgADIAMAAxADb/2wBDAAUDBAQEAwUEBAQFBQUGBwwIBwcHBw8LCwkMEQ8SEhEPERETFhwXExQaFRERGCEYGh0dHx8fExciJCIeJBweHx7/2wBDAQUFBQcGBw4ICA4eFBEUHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh7/wAARCAUaAt8DASIAAhEBAxEB/8QAHQAAAQUBAQEBAAAAAAAAAAAABAACAwUGAQcICf/EAFIQAAECBAMEBwUFBAgEBAYBBQIBAwAEERIFEyEGIjFBFCMyQlFhcQcVUoGRJDNiobFDcoLBFiU0U5LR4fAIY6LxRHOywhcmNVSD0kWT4mSjZf/EABoBAAMBAQEBAAAAAAAAAAAAAAABAgMEBQb/xAA4EQACAQMCBgECBAUEAgIDAAAAAgEDERIhMQQTIjJBUWFCcSOBkaEUM1Kx8AVicsHR4VPxJENj/9oADAMBAAIRAxEAPwD4yhQoUAChQokcUFLdFRTTnWABgxyFCgAUKJnnXXrb1UssEBNOApwiGABQocIkRWilV8ocyeU8LlolTWhjVF9UgAjhQodAA2H1K2275QyFAAeTOHpgoPpOve8FfIDlsjcRq1KHmV1VSuS2nKtYAhQoAFChyc9YbAAoLxOSdw+edk3yYJxorSJl0XQ+RCqovygWscgAUKFCgAcJEK7q0hsOhsABUjKPzr2XLhcQgRrvIlBFKqqqvlA8SdR0ayxzPv7V27b4UpWtfOI6F2YBiiQ2nAZFwh3Tqg6+FK6fOIYlcIi3nLlLTVfBNIAIoUKFAIUHzDGHDhEo+xPPOT5uOJMSxS9oNAlLCE7t+7eqlEpbzrAUNgAettqW3Xc4ZDokeGvWdWN6ruCvCnlxT5wDIYcK07tYbEio0jXev/KAQ9oWyNd7dRK7y218k46xFDYmVHnTHtGR6JzrSAZHdu2w2FEnWZZW1s0r/KAQzhHIddCp3oAJZdtZmZBpXG28w0S9wrRSq8VXkkMcBQIhrW1aVTVPrHHBtNR3dPBap9Y5AMbCjtNKxyAQolbC9DVXBG0a73PyTziKFAB0lrHYc2bjR3DukkES4SyyEybv3w2ZW+icVWulN7T0pAMgNst0itG//fCOOBaXxDyXxiOLzabaHF8aZwuSxQmkbwiTSRlGwYBqxtCUt6iJUlVVVVXVYAKhwWheRBcvDTetp66Q1y28sutvKvGkMglwnymr3OsdPXXWtUgAGhQ4VhsAhQo7TSscgAUTNo64OWAXd7RPBIiGOpcW784BjrCsRzu1px/lDRt70Lds84bAIUdRI5E8w+T9t9q2gIJQUHQUonD9ecAEKrVYnlngaMiJht+oENDrpVKV0XinGIkBbLu7WkTzLLTSDlvI6SoiqQVtSqVt1TinCFfwO3kFiRtQvHM7POkRxJRu0u1dpbp+sMQ6ZyEmHOjE4TNy2KYoJKPKqIqoi/OIYUSMohHvXc+HpAB1ghB4CcazARUVQrS5PCqRINhzROI22Dep5anpT4a8fLxgescgGPcWprQbU8PCGRYMOvvSYsy0o3dL5jxvNh1lqoiLcvwp+VVji4e83ItzzzjbTb12Rrq7aVCoicKedIABzo/MfZ2LLuACqlyiNpBIxEjsFV1Xw84Ql4iKwyAAuYZlgAFams0iuvTLUUHXd151TXygSFDoAOovd5aQ4CbEHLm7iJNxbqW6/nBDzloFkWg24Aidq1qqUXnqkBilYBbHIUKHkne/7QAcjnGOQ7+GAZ1R3BLx84cg39nw1qSQxE7XlDYBEhINgldxrp4RHDotto8UksT939CwSUwpJWSbl3UlzIukODWrxXL2irrTSACnhQoUAChQoUAChQoUAChQoUADrd26GwoUAEguODfaVqGlCppVKotPqiRHChQATOWtvdS7dTgdLYiJaxyFAAoUKHVVflAA6l5CLYlXTzqsRw8E3x5a+kPeay3DbVwSUVpuLci+ipAMhh0NhQCJat5f49PSn+cRQoUAChQokyzsvt3f19IAI4myupF3Mb1JUsrvJ508I4TLotA8TZC2dbCpotONPSsRQAP3jqXgn+kIre7dy4/nC3dKdrn4QyAY4SJOzEotuP5r147uqqZoir9eKxESKK0WOVgAci0Hs/OOEtaeSQqbva+UNgAUKFCgETPOm8WY4RG55+FIYAE4doDcS8kiQhazrWXSy9N8xt9dEVYY6ljxChiVF7QcF80gGRw5EVV0hsPDmNtxLAI5du22w4rgHLIafLWGwackYNulNPCw6jQOtg4hVdQqUtp5LXWmkAwCJ1UmzFxvMa5hr+aLEEdrAImcaNEaq3TM1Ffi1pDTEmHiErbhVU5En+UEutOvyHTKywg1azaigBroq1tTUvMoGIHGl3hIC0Xw9FgGRQS7LuNSzL5dh2tFTy4ovn5eaQw94cxy43DXj/vjEiS0wsmEzYXRs3Lv7t9EVfypAALDoe+3lPm2hi5YqpeGor5p5RGMAjkOruwiS1aQ6hK3d3R9IADcTlZaTxTo0vOtYmyiAqOsoQo5VEVR3kRapWnDikBF972bdeHhCFC+8u4KnPWE4ZGauF2l8qQhjCWsESDwMTjDzjDcw226Jqy5W00Ra2rTkvCIIKHo8pP72RPMtr+MQc/Qv0hgS4s9h0zjU3MSMo5JyDjpkyxfmE0K1URrpWnCsBvOOOuk46ZGa8VJaqvzjjwgJ9W5eOmtKRHAASDJCz0hxkiZ1BF7O9T86REJ2tkNordTXmkPmFHQW1cy+V/jz/OI2xIzEB4rpABPh8nN4hOtSUjLOzMy8aA0y0CkRkvBEROKxCQEJ2kNpJXjpErLszIzYusOuMTDJ1E2ytICTmipwp5Q+fWWcfToqTG8KX5xIqqfPgnjWFcLAorbHSTRN75QyO0hgSvi0lqtlWqapTsr4efrEcOJBQB3q1/KONiRlaI3FAA9lREwubE99ONUr5ekORtyYN92Xl1tCrhCFVRsa/olUSqwPHawAOIaHb4eGsciSYyLkyMy2wbr6dqmvDlWGtqImhENw+FaQAN4fOEi/SJZVh2aeRlkLjVFVEqicEqvH0iCAAmZastcFLW3d8BvQlQaqmtOekQIpdnxjgw9sCI+r3qVX6QAOJkhabd3bTrTfSuninKIYIlXjYezARtVoqb7YmmqU4LpEdu+vl46QgI4mzERjLy29db+96RHDYYCiZtkzZN1LbW6V1Suvlzhl27banrzhkAiQLe98SfT1iRtrNIrVAEtIt86cNaeaxEQUAS8YQrx/wAqwDJXwbEGyZdI9xL9y20tdPP1hiNGrJPIO4JIJL4Ktafov0hCblmVmbhUqldNOESPDLDKsK2+4TxVzgUKCNF3aLXWqekICG/q7d3jXhr9Y5HCjkMRJdS8e1Xnzhow2FAA4k/FWFd/h8IUOUCyhO3Ra6wAMKFSO29ryh7bhAhDraXaSvGAZHwjkKOitIBBGVLe787padIzbcixexSt93DjpTjA0PASM0Ee0sIkp/l4QDG1jkEtS4HKPvLMsgTagiNFdc5WtbaJTSmtVTjzgaAQoUKFAAoUKFABLLuuMPNvtFa42SGC+CotUX6wnnXHnnH3CqZkpkviqrVYihQAOhsKHQAcrHY5TSscgAeI1Ai8I4KXQ2HEkAHSKoCPhBLjYSvRHkcl5nMbzCDVbN5UtLz0r80geu7b4V5ax1h0mXwebWhAqKmiLqnlAMih27f5RJY7l5+WWXdS63dr4RGSfirABI+IhZa6LlwoS0RUoq8tf5aRHDYUAg/Dp7oQTX2KUmeky5MfaGr8qtOsDXQ0povKqwBDq1H0joiThiIjUl0RE5whnLystu3YbBEo8ctNNTDYjcyYnvhclUWuqLoqeUKaPpEy6+2zYKldaOqDWGAPErTrrV6A4QoY2HTmnh+URQ4RIuyNYBHCpXSOin4awZ0IPc3vLpspd0jI6Nf13ZuzLadnlWvGBLzsy7t2taecAxkKFHRSsAjsNhQ6ABzZCLgkQ3jzThWHEiG4IsiW9TT8XlDBKlKaEi8YeguIPSLtb/j3q8eHH5wDEYvyz5CWY082qiSaiQqmiovhEjKtPzg9Jd6O2vaMGq26eCRE86488TrrhG4aqpGS1VVXiqrDIAHUca+Iaj+Sw2Hmbrq1IiOiU1WuiJ/JI5lOI1mWrYvOAAl2bbUwViSZapL5RpqdxW0VzXgq8dNEhk9KPyb2U+IiSgJ6GhaENU4L4LA6Ko8IfZu3D2dE5V+kADUFe13fGHtOkN42tlelN9K09PCEWcrPZPKu87bv84YSFrABLOy5Ssy5Lk404Ta0UmzuH5KnGGKFGhLd3q8/DxSGVGHKli2l5eCwAGSAMYhjLDc3OMYew+8IOTGUtjIqupWjrRONEgN5BF4hFy8UVaH4+cTNyrjwPOSwOOiyCuOadkLkRCX5qkQ2dVdpxpx1+kICOHCkNiSu/wBkez/KGEDmmHnQccbbIxbG41RK2p4r5RImdNqIojfUtL8Ibo1X5r+cMF19oDbEzAXRofK5K118UqkNbTfHMEiHy8IQDQEi7I1prDIdw7MPcND4NiHpXWGARh8vLPjMrMzoyqtskbSEBFnGipRvTsquq1XTSByPqcvLHQlW7n6ekNVKCPZ1/wB6xyABsWBYbiJ4MuOdFP3f0noufRLc226z1t1gIkUe1+sKpW293jSD7AchyWWFrQk4ecRw6AAxzD5gMHYxRcno7zxsDR0VO4UFVqNaolCTVUouvhA7itbuWJdnev118obQcrnfXhTlEcIB0cGO3FZbdp4QoYgp73f7ulsnpPTbj6Rfbl26WW869qtfKkCUjsFSUw5K3uI2BNuATR3AJaLxpVNF8+KQDA47+sdO2/d4QoBDYldPNeIrRCvIOEOYdJtt0Bt60LFqCL3kXSvDhxT05xESWlSAZK2y9mEOS4WVUjGi6InGvhHSeq2bYiIgZ3cEVUpXnx5xJIuzrCPvShvtjlk28TRKm4WioSpyXhTnELZiLLg5SERUodV3f+8ICMUqv+0hKqqusKJHssj6m6lOC8l508oYEYJXvWw65Mq21K14x14BBUtcE91F0r9NYjpAB2Gx0YRQCO9rtFEjDLrqGrTZHYCmdo1tFOKr4J5xDD629kuPGAZwSpHBg7E3sPd6L7vlHZayWAJi97MzXUrcaaJai6butPGIJJlH5kG8xpuvecO0U9V5QgH4k221POtNPsPtgVqOsoqAdOaVRFp6okCRKbRoAOW7p1tXxpxiKGIdTc7XyjrhEZ3FxWJJyWflJk5eZaJp0O0BcU5/pESoX1gGL4YkayEMMzMXjfw+VIhhQCFDxtsK6vl6xK8TjjTRGKWCmWNBROGvzXXjEFIAOlDYUKABQotWMGmX9nZrHEflBl5aYblyA5gUdIjRVS1utxIiDqqJRNIqoIm45iwoUKFAIUKFCgAUKFCgAUKFCgAUKFBM/L9FmMnPYf3AO9k7h3hQqV8UrRU5KipABAhUFU8Yll5hxhHEbJBzAVst1FqK0014cOMRkvZ3aU/OGQAKHtqKKtw3aL/3hkKABQoUKACRHHEDLu3K1t5V4Vp4xHChQAKHFbpbCJblrDYAHgVK8NUprDm3HW3AcbMhINRJNFT0iMlrHIAJBRw7rbi5r/nDRMh7MPaJwLssiG5FRaLSqc0iKACeaeKZeKYdO51wlU91BSvyjjJOhc40RBpRVFaceUd6O/0RJlWXMgjVsXLVtUkRFUa+KIqLSGmQ6Wjbomla1XmsAyKFEwS759llxdxT4d1OK+kRwCFHRK27dFapTX/fGGQ8gJAEl4LwgAIdkZtnD2J9yWeCVmDNtl4g3HCClyIvBVS4a+FUhkuw++LuQyTmWGYdEraKcV9NYahOmAtXEQhUkHknjp8o4S9rvV73D1gGEygOsM+8mZhkDl3gsC9My7VUJB5olOPpArzpvPG84VxmSkq+KrxjgARqVvIVX5JDIAFCiZx1TaEbB3a79N5fVY64yqXZZI6IihEQItE9ap4rSARGajXdgyZmZsJIMNcRWmRLMsstuVU0IvHRdK8EWAfOLOfmMTxlZnFsQnTm3mhabNyYeq4QoNgIlVqVBFE04IkIZVxMiWtd06/9MQw4UHvFDEOvcysq/q63W10rwhu9b5Q99bnlKwW662jwSGQDHtgpga/CleEdZbR1QbD70zpvUQdeGsRjHSFQO0uUAE0uy+4jyMtkdgXOW8hTiq+XCGgC2ZlwcbbOf0hiGVlo/OD9oJKZw7FX5adK6aSwyVF+IUL9CSEPwVpQ5wRRd0qxz+GCSlTCcblyVslO3suDTepz4Jx+UMVhoiL7zTefalES93gP0rpD3gEAtXqnBrva78TS4f8AhJhu0b1VDABUrk0RK+FYscRHCwwOSbamVcxBxxzpbWUvUWrRuhcCuFV0ThSJuXiUWW5mo3lrfpu01WHGgiz93vEtRO7lqlKQ6RCZcnmhkkcKYU+qs7VeVI4yjGd9qzRHWtiIq15cfOARHLsuTD4MsNk44ZIgAOqqvhHUIkaNvzTTnHXQVkx6wS0QtxfH+cRDbdvRRJMr7hywSxGOW2REG6nFaV148o5kl0XpO7ZfZ20rXjw4/OIS4xLLm2DwK4CuN3JeF1Lk8KwARUjorRbv9YmnHGnZp11hhGGyNVFpCUkBOQ1XVaREXYHd8YAGQokcbcbUcwSG5EIapSqLwX0hi8eNYBHIUTMvONIeWdt4KB+YrTT8ohgAUKHp2V/3SGQATC8QsEzu2kqKWmunnEMPEa13uEc3fX8oBiWmlIJn5CckFZSdlnGFfZB9q9KXNklRJPJUgSH3fFvQASOqIray4SgqDdy1hotkQGaW2hSutPy5wZhuFTuKzKy2EykxPOowb5gy0pKAgKka+golVWALi/lCAbD+76cIaiQcyuF+7prO6Z0zq+i2W5f/ADL66+FKfOGANLiwRdc4QJRdUGuvKJAZmX5V1xsHDZlkRT8AuWn5rEdg5N1UUl0RE5cNV9YjhANh0KOUhiOitD/zhsPIiVd7XlHW23HLrBIrEuKnJPGAAmRmBbZfluhsvnMiLYmYkpNa1qCItKrw1rApiQGoloSaeEcrTsxLMzD0y84++4rjjhqZqXFSXisAyGusFT7Us1M2yj5vs2it5t2LqmulV/WJsZwx7Cphll9+UdJ2XamPs7wuoKOAhIJKnAkRdU5LosV8G4baCrEgDcJ9rcTSiefOGt23pcNw80rT845ABYS7+Fjgc1LvSDrmJG82rEz0i0WgS68VCm8pVHWulPOACO9bi1KGQoBDo6JW6d1aV845HBWkAHIeYEFt3eSvyWJSerZljlUC0rK7/Gqr68IHgAUKFBMhKvzs4zKSrSuvvGjbYDxIl0RIABoUOJFErS5QoAGwVJSc3PzgSkjKvTUw5WxpkFMyolVoiaroirAsESc3NScyEzKTL0tMB2HWjUCHSmiotU0gAHhQoUAChQocVtd2ABsKFCgAUKFCgAUdFKxyD/dWI+4/ffQ3fdvSeidIpuZ1t1lfG3WAAKEidryhQ2AB0Iv+8dAyC6nPSGQDOjHIUPcK7etEfSAQyFChQAKHQ2HXQATrNTJSXQ+kPdFA1cRm9bENURFKnCqoiJXygaFCgAsAlXzwg8Qo9ktuixfTcRVRVtrXThAME4ZJTeJT7GH4fLPTU1MuC2yy0CkbhqtEFETiqrDJyWfk5l2WmmXGXmXCbcA0ookK0UV80WEMhRFX9YeJ74Zm+I8q8vCIod/OGA8QIrnBbJQDteXrD5Nl9+YFthgnz45YCpKqJquiekRjd2RLtU5xI27Myczcy4bLo3Dc2dF1qi6p80gAjIh+HnX08o4W+pF/pHRbMgNxB3R4wzuwAKsTAqjLmov2qW6reuqcfpWIIUAh0dNKEu9WORZ7RYHimz+IBIYvKLKzBMNv2KQlVsxQwLdVU1FUWAZXACn2ButRSL0hOIKABDHQSoEOXUvHw8YZ/FxgAkcyclvLzMzW+tKeVI44QEAWhZRKLvVqvj5Rwv8AF/pD1bUCIc0Oz48fKEBBD+rye9mV+VIPwnDZrGsUDD8NlsyYdQstoTROyNV1JUTgirxiF51kkYy23Eo2guXGhVX8OmmkFwsMnZaYk3smZBWnURLgXilfFOS+UIAa1czBKy3cKqXV4/SGPFe8RkrhVr2lqXzhXpkZeWNbrr6b3p6QActrdUhDn/pFu1KYemEOKs649NG0LzIMN1QFuUTB2tFHS1UVKpFfLDLi4JTSOnL733aoi3W6cfOlfKJsHnZmQcfel1cS5g2jUFVN0xt/nEyWtr6k7auv/Zm2+wt+VwuoO96acoI6ZkTM4/KMgzmXtGAGhjlElFEVWtdOfGOYfIsPYT02ZnWZNL3QR0zVwnDEEIQsHeGvC7hFWwy4ihd2T1HWIiC2OMhv9cLiV7FPi84lW7LzOry2yqG5xXTdr6cliz6M2wyzOvzbZOPm62rRbxt7qdYXLW7SnwxFMAIS2RdcI6lvbqF4/SL3I7QGflejODnNk3msi6KJSiXajzXSnzhqy6tS5uEzmt3iGcC7orxtrwVVT9I6J5RmTdu9u5fH8v5xG4YA6QN5hS9ewa260505pDET4qTL+ImUvLDJjpazXs0Hmq814+qxXwQq/YjTpH7VOr8dF3omkstZaYbMnbzERabaX7w7tLk5px4c6QbBOoxmfeaw2ZkRFnKmDbM1yxU6hWlpUqKb2qJx+UCuAQFaQ2rD5qXflnnGJlpxp5tbTA0tIV8FRYjiiSVL3AUic+7FKIS68eCRCNK6w9s3AXqyVPSJZparc5m9IuLOu8YAICSOtiThi2PaVaJ84ZDwsoV1eGnrAAiRQMhLlpHRBVAi+HjDW13obAA4luhsdp+USvZC25Nw7iXXrWpc6UThABDCidgTTr8nMbbIb9N30X1pD55xqYnnXZaWGWbcNVBkSUkBFXQUVdVp5wXENl5h+WMil33GiIVBSA1Goroqacl8IYwgk6IuHlgqpcVtafKIxWkTSrDkzMtS7I3OOGgAlyJUlWiarwgGMVbd1vz18U9Ijgqfk5mTmXpaZby3GHSacS5CoaaKlUXXhxSIEM0utLtcYAOsnlvA4oidqotq8F8lh7xZ80642yLdykVjdbQTjp5JEbeXeOZdbzpxhorSADsIrd235w59zNdJylKw2ADogRARfDT8460dh3WoXkvOOXD8MIgIO0kAEgsvkwT4suKyJIJHatqKtaJXxWi/SIIJZffld5h4hr4eaKn6KsDQCFCiwxvEnMWxWYxByWlJYnyQlblWUbbGiIm6KaCmlaJFfAA5e7u/6w2Hcd2FAAolmsnPtlzImU7BGlF+dIjr2YZAMdHN2Onbu2+GvrDYBChQoUADkElu3eHHyhsPQiS7e48fOGQAKO60jsaacw6WY2BkJg8PfCemJlyYSaKlhy/3aInPQwOFLYlKuRl4UKFDJFChQoAHklP5L4wyO+EOcQRMrSuGui8KwAchsKHoFbt5NPz15QAGPnhq4VLAyzMJP3msw4ZplkO7YgpSqKm9VVXnDZdySCSmheYccmTQUYO+1G9akqp3qppTzgSi9mCcSkpzDZ96Qn5V+UmmDsdZeBQMCTkSLqiwrDuCRJmFl5d5WVrbXSvjSI4dXhDESS7mS8LlrZ2qi2mNwrrWip4Q1w7zIrRGqqtE0T5R15l1gybebICFaEhJRUWIoBjq7sSzXRs4uiZmTpTMpdwSvDzr8ojqVlvJIZAAodEsz0fpB9GzBa7t6opflES6Hu/KABsKFCgEWWANYQ9iFuNTc1LSeU4t8syjh3oC5Y0VUSilRFWuiVivEa18old6PlNZWZfb1t1KXVXh5UpEIwDOQ7/aQ88vetEu1pr3YigETykw/KzTczLPuMPNkhg42aiQknBUVOCxx1115wn3nMwzJVJTWqqq8VXnEdsFYZ0HpP8AWCTCs2HTIpdfatvHlWlfKACBsrD3m0PRePmkRRI62428TTg2GOioWlIaI3Gg+MAyeUZz3bFdZaqJLVxaJolfqvLziVBWT6HMi5LPKfW2dq20lShIvjStPCBKb3+1h73bXq7F4UiShjh3uEXj4aRzuQ421EBLx+scqPw8vziiTkIUhsOgAMf93phssLTc0k8hudJvUctR0st5ovarXypAXGJaWbxDUTFacv8AdIknZc5Z/Kcy0WwV3DQ01FF4p6/KEAzpL3RejZnVX5lv4qU4+kSyzI5sqTuXluHreVEoi01VOCQHEzREK3N7pDWCQgeRdHmnMl1NwiQTDgqcNK8lhgsuE0b49kKXa+MdBsVKmZ3Lv9Ie+09LOFLvCoklDs5apX9IBnTmc2TBh0vuNGaAPBSVVuXisDRM8rj97+UIjdvWBRErDXGnAtVwSS8ahpxSACOvzrDyFvS1zw5QyFDESEBNTFqWkQLy1TSOGY927VN/1jrItldmOW2ju7tbl8IZT/FCALlmJnEZggl2c1xGyO0ERKCI1VfkiQS65hufJrhyzMuvRkGaOYtNM3W5RRE7NKaLrxhmHuyUk9M9LkWsRzJU22rXiBGXCTRzTtW+C6LD8Bw5cUmeitvSjDtjjuZMTCNDugpW1XSq00TmukTJosF3hOJTzWyuNykt0bosyyw3O5tl2jlzeXXeRa8beXGKBl8Bl7FavcuQsyq1BErUfCi7uvKH4lLDKy8mqTctMHMs5xZJ3ZVVVLC8D01TwVIBZNxqZAx7YUUdK+fCJVS2bYuMYZlGcamG8NxDpsuxQmJlllWkLgq0FdUotU+UKfw4sOyJnPYuO3sHmlWlbl0onHhA0s5fMtzL2S+V+YQFwKi1oSeflyjRYXLYfjDL7VzctktOvb52367gD40XTxpz0jOWxNMMjIk3d1f7S+ldLf8AfnE+HyU3OPUk5dTcbAnCt7oiNVNfBETWsaPEJDAsl1vD250x6swJ50ENNzrBIE0Le7KovDjFUStyyTeQ+4JWoDRy7nVmK9oS5rpy+sVL+CITyVSJdMg7O5xNuFcZ8SJK6qlecKaCWFR6K445UN+4aUWv58okkpOaxCYypRh2aeoR5bYKRWilyrp4JVYjaVgVdzW3LVRcu0uBcq+KRrcyxGSZk1Mi8D2U43vgX4k1T84kxOem8Tn5jEJ+ZdmZuZdJ151xakZEtVJV8VWIC313R+kOURyrrt7Tc1+sAh08koj32TOVmwfvaIV1NeHKtYhbG87bkTzWJJg2jRtG2MpRCh7yrcXxa8PSGMgThi2PaJaJFEhjTuGpgrzLkq+WJK+BNTGd1YtWlcKhTVVW1a15QCiapygkJN5Xn2yQRJgSUxM0Hs8UTxXySHzEww7ISsu3Jo08zfmPZpLm1LTdXQaeXGEAEUciZtlxx7JbG4tYsHcJxSXwFjHjl0bw+bddl2nbh3zBBUktrVKISa0hgAI462yrYuEjblqmN2hUrSqeWsQQonFh0pgWBC5wlRBAd5VVeCJSARxtq5twswEspovEtaaR2jaMAXWZl38Nvr6w1RsMgdEkJKpTgtfOLF88TmcFl2DeV+QkgJxseTOYaXfUqcKwhlfRvQiLx0TinhEW7HIcUMDlIcSkva9IlbHNzXCfACAK71d7glE84HgAml2s97LzG2q13jWg8Iml3ehTMrNsmJuNqLtDbqiEhcFRdCTSIG/xXW+X5fnHXyc3ANy9AHc1rRF1p+cICw2hxSd2l2hm8WmWpdJyeevNuWlxbC5fhAUoieSRXTCN39Xdw1ReS846zbe3vWa6lWI3O1ABLmOmAMm4VgVsHjSvh6x182T1bZyl7w3VTlwrr4wpNiZmZppiUacdmHDRGwaRSIiXgiInOGOA4HbTjX/WGAyH2Jk5mYN11LOfrDIbAEkrh5rt1oB6aJEUdKHASiaFStPHVIAC8XmZSaxJ2Zk8PbkJc+xLg4RoGnxFqvjAQwU4aTDkw+Y2XVOjYIgoqr4ck9IGJLYAFDYUdGAR0bbt6OuJaVtRWnNIRJ+IYZAAoUKHQAcSNzOSUu5Ky0gMy/iDvu5gQuTSXIutJsfJK/nGNkmhfnGGSPLFwxBS40RVpWNzhL8k1tpNTcnN/wBXsPOAyXxNiKAJfNFSMqu1zeh3RE+ZPPoUKFGpgKFChQAKCpB5uWn2Jh+Wam223BM2XbkFxEWqitFRaLwWiwLCgAmmTB2ZccbaFpsiVRAaqgovJK+EKWcbaeFxxgHxTiB1RF+iwy8rLa6Vr84ZAMUF4nPz2KT7k9iM29NTTlL3njUzKiIiVJdVoiInygSCCRtq3sO3t8lXdVf5pAIHhRMTD4Mg8TTgtOVQDtW0qcaLzpDETd408POAB9VdNScc3tVqVVrDAQVNEMrR8eMcBaL2aw5sLjtIhD1gGEOYfOt4Y1ihSjoyTzpstvW7hGKCpCi+KIQ/WBYeTrqsIyrhZYqqoFdK81p8oYtvKABQ98xN1SEbU+sRQRKTLktmo2o9a0rZ3Ahbq8aV4L5pAB0QWVnBGbZLcJFNstK86Q2acbdmnXW2BYAzUkaGqoCV0FFXXThrEUd4B2ePOABkSMoBHRxywddaV5Q5ttD728XYTzrEdhfDABKDzgNON6WuUronJa6eEW+zMns9NSeMOY7i8xIvsSRHhzLMtm9JmKpa2S8AGlVVYo94o6Q2QAIbkPdhERlbd3UokWO0uNTeP41MYtPoyky/ap5LIthoKJoI0RNEitpCCfgXauKHI2V4jbqXCOIo31t+UNHjDAsnHJj3PKyi4c0IE8bjcyjFHHa0FQu7woqcOSqsAq25eacxrd8uMGzMzNsvE085mCN2XzEblreHJKrrVIAJSI7i1rEwNh753mPgiInarDjdfBjomYuVfmWfipx+kQ0hcYYiZ9nLtoSGK030rThqnygeJK3Kl5LbEhLVctod2/d3d6ALEMOc+Ls15Qh3D+KE4ZOvXOFvLxWABsKFDiC23z/KGMscdwx/AsYckJlyUfdaEDul3hebW4UJN4dF0L5LFfUcq2m9X8o4ttvahFyu/wBpEjJ5CbmZV0llHMpXAJsvMSSiotYa9MzLrLTLrzhtsiotCS1QEVaqieGsRutkCCXcXgvjDB13YYvgOxfEprFZ052ecF2YNAFTQEHQRQU0RKcESOyOKzcjLTLEu6iNzNmcJNiV1hIQ8U01SAQRK1WOWwWjYeu5Ot0xMG4VtTUl5AlePonpA/GHKhCtpaQU/JE1JNTGfLmJp2QcqQ8dFTx0/SDYW4JWHAsOAByjJSp4ecPYYVwLt5N8QRabtV8V5QhwXWAvYejT0hjb070Rxk5hlJLLMukWKjd13d+JK1pEeyIB76lXH0mXG8zrmpc8t0mu/aa6DVKpVeEUmol+UH4VOvysxUbTvAm98bktLReP6xDLpJqjaxfwXj0oQTvvDA27W2J0uiMumDjia3DdyKicV4VivkJgle6WTZWtujy6upLrdT9EhxPtHKPyCyrbkw+4CMu30y6Lr5LWA1SYCY6I5MFlgetvZuHRF8F8Kxkq3jU1ltjQYq00mGtzMpMjNuGbpm01LkGRQqJ8lTXyjO5In1hP862Bx14rFrhiZL32mbm5BzcsMA7pLvXc6W6p4xbnh+F5R/ZnizPuphNVtu3nLea01p8ozzwNMMzPbOvty07nOyzz42GCZbxN7xCqJUk5V4p3k0hmME3iuLzk5IYfLYayKZnRmTWxpEoi23qpLVdaarrDZ114Zk8lyxN37octCt0QqJz5+sGuDdKsPdW6Zkdx5Nvhz5ov5LGuWOpljloUOX8WkTNyhPuqhPthuEtzhU7I1t9eVIJnH21MHBlG+/8AFbr/AJQMeeq9KcS/MrqetfGNImZIZYIRR5+xpN6xFt/WHvC4koyRZFm9bbbd8+f1h7pOTWbMll6W3UtHy4f5RC6Qm22OWIW139al6xZlMWGCN129/rDXAIDtLRYeIrb2CXnDgZJ1l13Naq3TdI94q+Cc6QxSQxyOwSzLE7LOzCOtdWQpYp75XfCPOGTa4kNg5EGBlvtCGRE9euo0Tdpw0oq184bh85MyE/Lz8k+4xNSzgusugtCbMVqhIviipWGvigGrdbra60pHZdjNB1cxoMsL986XaponiuvCEOR83MzM9NvTs26rr8y6TjrhlqRktVJfVYGJS7N3CFBuHCJZipndIbo42QdkbdVUkp4QbC3AobEhGThkR99aqsLKc3+rLc7WnD1hgNjlY5DjG3vCvpAIehuIyqXbh8Ur/KIof8PV/wCsG4y7mzx/YZaRUBEFZYutqIoirqq6rxXXjAMDJ0iaFteyFafOE8LYmqNuZg+Ntv5Q0eI3dmOpbfp2fOACVh6YlnW5lg3GnAO4HAVRVCTwXxiN48x43PFaw2LbCcNHGDalZQmpd4GnHZl+ZmBBpBHWvDTTSmqqsLYNx09hZZ0k3LOS87NzrTbgMSHWZd1UyyGlczTUUrxgGTBq903Zro7jQXtpYpXmipQfL1XTSIpd56WfCZYdJp5skUDArSEk4Kip+sREqktVgsO5PPTL85OPTcyd7zxk4Z+JKtVXSOTBtOKOWzlaIlEVVrpx18YcMspYec1nMIgOoGWppetUVaonhpx9IUnKuTGfZ+xaVw6qiaJT68eEAgcbe9D3Ast+EtU9IiiREuAit7H+fOGBHD0Kgluitfy15RPOzL845nTLl7ggIJp3USifSBhgA5ChQoBChQ7uw2AA/BsxrEQfDtMVd/wpWLzZV1tEcljlGnXpzdzHO4I7609VtjmzeHI7spj2IvSSubgMS0yq6A7W8h81UBKKtk3JOQ6Q31ZqaghJ8v8A9fziJ6lk1XptJVQli42Pwb3/ALSSOE5uQMzMNsk5bdZcaDWnPVYDxiQewvFpzDZm3OlXzYcpqlwEqLT5pFZRliRhOOQFE0xLvMZeY2o5gI4HmK8FiGHQyRsKFBUkrgZjzTjYKAL2qVVC3VRPOiwACwo6USBlb113Z0p8X+UAHV6PYe65du2ap86xDDit7sKAYbMYliT+FSmGvTbxyMqbhSzJHuNEdL1ROVaDWARgzLbLDs7qRICsUcxbzrqi08Ep+cBQoCTsJItPdrP9Gfe3vSQzul5HQbi6RbZdm0pbZXTjWvKK4TXLVu0dactfrDibhMWGxwY7CgEWW0D+GzmMPv4LhjmHyRqmVLE+ryt7uu+qIq61WK2JG8uwriJD7scdJDO5AQPThCHOuoVKsOugcwwt7jdSVN3somq0Va/lAcEy5oAlMaZiFQBsQk19Y4ptdBplDnZlc3MW62nZt4cdawiywxFvAA2fwxyQexEsXMnveAPAKMCNyZWWqaqqpddX5Q3DAeWWcmpWYlWJiTFHA3rHTqVN34lTj6RVXQUqsLIsXGN6OEhII71umqrz8oUjiSNtFQ0cIVt58q+OsTpIuvTItMpmkTeYllToKJXWickTXwiFWHhl823cpfWvKttfrBDOJTMpLtty32d4SJekBUXaENqhci9mnLzWD7Bp5ImilOgEBSzizCuJR7N3RHmltPzrDXJUwmjlyJu4K9/TTwWGjMDY0BMtLZXu6lXxWCHHJDIlsjMB6xekXoltbtLaa8OPnBqLSxYyuAS7+yE3jvvmQaflpptj3cZ/aHRJK5gJzFOCxVuNXt5jzu9YOWlnKvPw9ecKrfaF7vdm3l4wRZ9mSZVxu0yLLEjvJLe6Sck1+cTGXsucfEALwvEYCdxaIga8uUcESdNtncCmleHnrDhC+LFlrCPcb5uOzo4wMw3kgLY5GTaV5EVbkJFtolKUrFZE4lZMUEyabeV1kCWxeFfOnKOA2rlgN3E4a0t/SJxZ3/i/KJ2W2AbeV1lwySxQUOwNeRLx4fnCzCFAFuaW1bkcA/pTyhI44p3XLd5afpCNvf41idpp0OvDuU3/AMXr4w7ihZI/uiH4019PLWCsfxSexzF5nFsUdR2cmSvdMWhbqtKdkURE4ckhrs668y6y7aam9mk6QVcu/e408obh6NrMdc026lhfeGop2dFqnhxp8oCrXBR7BfKJXSNQauy+xRLaePPz9YlAmznsxW2SEj+71AdfPkkMDcvb3C9dfpBcIUjtDJVczeu7FvLxrCJu921i4x04+cSzLLIA2bMyLt4VMbVGxV7uvH1SBkGsMUx8DnsxCVsq6LqngsRxKGV+0u/3whxJuN9Zd/7YLixuObbdM0lm7rjLsefKOADbifAe6gpyJeevKIihWwijqgV9vgsccTe7NsFzCNuttuS0tlC2AC6V6lU/i8q+HlEIoIPdYN/il384LjxJncSnX2nWnH+reMDNKIiKQpRF08EghopvBpqTfzWFIcqcZG4XQu4jcOqV01RfnAzYtjLvNuoouIu4VOPkuuic4bLNy2S9nZ2fu5NqJbx1u58OFINBahmLtk9M9LzpR9ydFZk0l9EaIjWoKnAVTwTREVICXK7m72edfWIxibEpiYm5w5ubVFde3rhARRfkmiQiticylzk97MOYTRLez6+qa+sKVX/+py8Kc/nEUgpNzIl2HNCbLwXksWkwyTWJO3TbbuSZdc0dwKfGorw1WMn00NF11LWSYGfzHByHHAaDOMmrFappotaInnzjeyuJ7MsbDzODSwy55k22fvl0KOS6W77Yh2rFWPIydmXXXTbG9vdvUE6u4vi5cfziwmJ+ddkRwuZyXSGxtot2revBCTSi11rWOapQmZjU6qdeIvoNnJbPm5xx91tiabdBoZfJIb0WtSTkNNOPG6LHD8FIpSczyBvIZV3edtupxBPiNeSJxgDDZxAenvecv012ZaVtqZJ4qtuISdYK8C0S2i8ijVYG/gE1MsYXjb70ph63uOzcvL3Ptu5e63rxBC/WsFWZUVJYYxM/JuyiLLYkUy06jSOSwaKG9r46VTwgEsvrLR49nx5fzixmJUS3cy2lV31pRfBIrq2H2RLj2hjoRsoMGWxwnXglilLRFtTuXcS6qacePy4QPbBzqDk5Yj5r/ovhSI5tu0NW7HO+n6UTlpGisRKkDjzpqnWEVAs/h8IneaaaBGr3BmLizKpQbaJTz8awPaO7vflwgpHpdJB2X6M268ZCQTFSQm6VqKJWioqU4pWKJsV5RIyYtncQqWi20WlC5L8oIwuV6ZPsShPgwLxiKun2QrzX0jk+DHSyGVJsmkBNRuoumva1irmUqDuOOOmTriqZGVVVeaw0SIF09IKZeaCRmWHWc0nEHKO9UyyQkqVOC1SqRG6xZLNPZgFmXaXpVKeKcqwCmB02y0wpNC8LrgGoqQLUCTkorAsESLjTUyJvSozIJWrZkoounikSTxS/R5dqWUToFxnlWFcvEV1WqJyXzgAEUaCi+P1ghc0wNx5x7ri7S9klTjWOOSsy2bCK25e8CG2lNVTlT6Q+ZGW6PLKzMuOumJK8BBTLKq8FrvVSi1hhYFu3LbR9ecPmGTYeVtwSAkpurx1SJC6MkgFhF0jNK+oaINEtotf3tKeERA4QqXmluqVgJER9SLfhVeyn6wVhL2HsvOliUk5NtEw4DYg9lqLiith1otURdac4CFN//OHCogpVRD4p/rDAYKVjqotK+MTzBDeOW2LW4PZJV1px+cS4ph0/hkyktiUlMybygLmXMNE2VpJVCoutFTWsK4WBkIclRVvfqm/dwTwpBM+zJNS8k5LTvSXHGbphvJUMg7ySyve3UFap8VOUBr+GJ5kFatl3JdWngrfWtVrSmn++MMCFy2/d7PhDIeSDaNO1zhfuwBY5eVlvKJxfToZS2SzVTQ823fSiKlqLXgtfySOyDwS88xMOyzUy224Jmy5W1xEWtq01ovCHYgbD8y7MMMAwDjhnkN3Wsoq6CiqtVRE8dYABV+sdJNfCusMg5spAZQFcZfOYzCv6yg2WpTlWt1VgACGOQo6UAjkSbo/i05aUWOsqYnc25YSV1rSGQAcheUF4ZJOz2Ky2HgPWPvAyKeZEiRd+0fAJTZ3bKewnC5l6cw8DRZOYdC0nm1TdKifOFlF7FYza4XLsOt7M4XINzn/1DpEybLu62yKbl9fFUAvy8Yz+MH1rTTS0bZCxC8S4l+caifks9QlGGi6Rh8oIPS69oBaBTdOv712kY+XamJ6ZFhtLiNVVE/Nf0iEkt4toaPYZGJWfwuZeecavxETMx7jTVCUqc9Vr/DA3tIlpST27xxmRmlm5XprhMvEFiuApVQreWixptlcLDafbTEWJKXWXbl8Nmp0JYO4QtXEP1ih9puGv4fjUm683Ys9hkrNon7zaJ+orGCP+P+RvUS1H7SZOJScUmgbtHcVVrTVa04rz4RFCjrOMUOiyKYeXZ5uT6JJWdLJxHsoekKVqJYpcbOaJwrFXBEhME2UZtm9u2jSuqJx8ojgqdYFmby3Jpt6tFV1tbx1T9UgWAc6E0w2LYAo5m9XVUoKrXu+KQ3OJGibFaCaopJy04QVOYrOzmFSOGvvXSshmdHCnYvK4vqsRjKgWGHN9LlxIHRbyN7MKqEtyaUolKca6ppC+4fYgyncrMyzs+KmkMECLsw4ToKjTj+XpDK/nDAnYBX3mmRaIiJbaNpUi18PGIty/8N35Q2sdgAlcVvJFsG95DKrtV3k0ppy/1jsw4JqFjLbVBHhXVUTjr4wxGnFZV1Gyy0Wilyryji7q90ucAEjSO5RiPZKlY42TQA6LjN5ENAW6lq14+cbTZPaHZqR2FxzB8Q2dZnMWnSBZLESOhSlvGic6xjH+3GSPMtMTFjpqUVVIZZuQLD2wMl3UrzgxnPKT6Ikq2uc6ig4ob9USlqF4a8ImXDsSSUylZ6tXB03aqa6J5xcvBjFOZKmJHAsct/TWC5qSm5KbfkpkFYebcy3Gy4oScvlEWTlHdmNlT5wZQHLkHVCGCmhV40enXHsrUMyl2qDomvyiV2THNtWcZPRKWKpRPKSmeHRPeLIN1zKEW7dSJl4GtOSsKywe1frd4eUTS9Jd5CmJbMBapYW7+cTlIdSTmY3onxRO3h7ZhmdIzRpv0At3/fjCmopXKkrnAy19CpcK1hu7f2iEYOnJO2Y6x60ud7ZD/KHBJ2WutvSxlXslr+uiwZwLCTj8nP4cbMvOyqsK80EwF+6pNmNRKvgqax0ns1lpov2QqjVoomqrXXxh7cg+Zh0hzgG7cdeHAf8AekSZb8s839m3QJO74LXVYmWKxmBjYnLWTzjDmWJk3dw6xB4fotIZLPTss0TSOuNNO0VwQLt04VTgvGOzqtv9JffzOlOPZg2/d2rcpeda0p84L2c92niUp7wz+g5o9IykRTs71qLoqpAH2K5tts93KIS7vn4QUyy2YO7rpi2CX2hS1a0RS8q6Rd4LszOYy3is+MzkSuFyme9MncQN62tNrTUbl3R84WH7MOe6toJubxKQYmMKZZeKWOY6x8XDROrpoSjcKqkDBEeilZlxbyHJvrZUd8AaMd7XeG7u/OsQTAdT3dN9E4VrFlimIzc9M9JcGWFwWgatZlwbC0RtTdFKVpz4quq6wJk/Zs9trdDcd7yXLW39Im+pUXsDEczNG5mEThHvn50idwECXF9yWZIVaIO3rdwvWi1rXx0WOSduc3mNFb3srtfKsFzGWYSzeSwZbxl2r9S73LTlTlBcYF0USyHVl3WZNw7M34lHtUVaJXy9IGmAYCaPIzDl71sv3SUeVaaItI005s88eyrONtYlhxMuT5S/QelfaGCsreTa9wuRp4axTDmSrL/UMFnBZc6F1qXd3wXTj4Q8gsVgtiv7TlE17O5aFpAHrUq8VRf0ggWXT6sW+2fw70cKWEJYTvb9O99ONPOHmGIOwAdJHNaJxvjYGiqn8oju/u9zdovnErYdcO/Z5w9tm8PxaWhzWvhDyHiQOJZu/XWscVO73vFIIeNywW+4GnZp/v5xZBhyFs305ubw4sp3rW77ZkSLRN1e0O7Wo1pXWC4YlUN7t+7e5xrqq6cYIlzGWDeEDzGuJJcqCvG34STxjjI2gW9vWr868ogoNl3er2f5wrgSCF7vVl1bh28k+vh+kdmWnWWj3OrI7L7UWqj4L/lDmCFoAyMwZjeQ1r3V0oifWJ3mso3GH2MqYu4Fu5dOKW/7pCysOwVtfgEts9PSbMpjsljDM1IMziPyi6N5g6tki6iYroqRVsuCa2uuZX4kG78qxE7CbC0wL/aRW5MaB+JyzEpOdEkp0JqXK3rguHNrqlwr2VThTksRkhMZjfWDy3fzSCZNhh/NKZJzsr1o9kTXsqXgPHhrwgjGsTHEMYdnSYYbzTQ+qDLTsomicl0+tYylrmmIJhYE+822XSXGRK90GeNO8o8kWnOPTPY5h+zOIPT0ptHh8251PUz+8ISRXbpuoiLcP6RidnZgsNez2Mt/pLLrBsge+ra6EJU7NeMek+yzanHZHFcQxLAsHulwkUl8Q3LwRq2wXT/FXWvCscXFVGtNjs4ZFvqee7TSIsTLnV5bI3tsu/3pCv668YpHAbdeHOHdWl+UicPJPGPWHNjM2WYnZvM6LMARhNgFxIo/h4EninzjMS+Dykz00Zk3GHm5eyRaCzrHBXQDquiW3a+NIzo8UtvsXW4ebmWbBoN3Jyt9CQvibTyXz1hbU4FiGC4kEji2HzcjNE0D1jwWllmlRKnmkTzTNrLhbw2juXguv4Y7MTszjmJPzeN4q448zLJY7NkbpOWUQGq68uFdERI7KbX1OOfRnnD6lW7RHfu7O/ppx8P5wpVwnJkBddbRCTLvcG5BHx+UEPMG4bhW7te0I7o1XT0SB5cUbmAcNrNbA0qBVRCROI1Tx8o6VkxaDjhN93swyfyekEktvMhoBEFpKnmnjBM4LKGpN2676IFbRr3dddOECDbfcQXDru1pFKQ8HBedRk2ULcOlU9OH6xMcyI/2VkWKsI05rfd4lrwr5cIhAN8d4Y4WvziibEMSMArjwtoYheqJUyoPzXwh1KL6U4x1yywbap8Xr5Q7kYDmVfGcBG5hAcbKgOX0pTwWITK5eFIQBcYjcg15rygucdYNuXZSWRs2hIHXhMizt5aFReFE00gAbJPmwpdGcyjNo23FKiooqmqapzSA4LzW+gG10RvMvFc6pXJRFqPGmvH5RPhM69h4TbzTN2bLnLX/AAX6L86XJAFit41uKOU/OORKJWgY81pyiiDgW84PxrGsUxubCbxifmZ58GgZFx5y8kbBKCNV5ImlIAMLRHerX8vWGwrDvOxKy42DgETAmg9oVJd6GIhOXeWsNuWy2Osp1g7l/wCHxhiCBUGmS6sTUlG134aJqlPnz8I1Hs+xLZjApyeLa7AXMYbeknGpdgXctWXyTccVfLwjOYPJP4lOdBlJJ6bmXhXJba7VU1Vac6ChQEKEZ0FKrEMuWhaPhN4OEtxRIw4TS3JaSabhaovqnOI4bFkSEIzeFzN7lAud3OwlafThrA8TC641ejbjgiaWlrS4fBYYA7hFdw5eMAhzoWHahCeiLVPNKwThGIPYZN9JZalnSy3G7X2RdGhgoroSUqlaovJaKkCGtx7o2+UMgA6KVjoIRHu8YbCgA0GxbXSNp2HXxzEYvmHLvwCpa/NEjX4uUpP4tsVPTL7HUYQnSA/FLk4qAX71ojFL7P5VosHx+YL742WpNnf1q6dS0/dAvSLTGQXDcD2PTNXpMzIOuupYK9U46ar9U/KOWo/Vb8v2OukvTf8AP9zNPTsz0PFcQe1em6MEfiRlmOfp+cTYJib2ykuk7KKTeKzQJlGQIqstLqpJXmXD0r4wfOYc22si1Og90KSaSdxHL43OlVATlco2okZfHsTmcYxmbxKaVM6ZdVwuCUry08tI1jq08Gc3p6+TX7P4/k7V4mbck269NSJygvhcJNHaiK6NF7S208N6Ge1Z4pxvB5110nXhaelCP/y3ipr6HFl7CMJYxL2pYPJuuNn0qYVjJ72oKVfClUi19reCdA2KTDZlxxrEMAxPLel7O9Ngrh3eY5QjHBzFTiVX4j/uDtwZ+HaTyB1p1q3MFRvFDGvNF4LDbdy6GQo9Q8sdDYUKACcWnnQzdctu0VPkNeERnotui05pzhkOpX5cYBjYUKHCtq1gESy6MkS5zhANq8BrrTROMRClViwwSeYkcRSbmMNlMQEa9RMoeWXrYQr+cR4eMm9iI9NzmJYi3+jheQ+iKqV+sK+5dr2BdzL719flSOmnWdWtUThu0rEoMqjxjXsVXeRUupypBTbCSU9JP4iwk1Knlum2y+KXt11G5K2lTTXVPCFcMRjbBmZuvPS7RCY9W5pdXyROXOAzCw15+nCLCYfZaxLpEpLdGHNzGQuUstLqjrxKnjziy2lxmbx6Zl5nERlmpgpYAddaQRzlGtHHEFO2qcV4rxiMpNMIKNlwRaMcgCvpvrVVH0/1gpJSbNjpTTLhS+blZwNqgKdK218aa0h+AymIYristheFskc5NFlMg0O84a8B+cRIk5f0CYdea3uwarS5NOH5QSOCVZWkyDLhtjmKPWGfYr8VPCLTGFWUxJ1CmZCeyDRvMljtbetTQxVERaeeixUS6v2WtuW/lGo2y2hksX2Z2bweWkXmJrCpZyXmJgzAs65y9LbRRUpXvXL5xg3dB0LbGSikFb93zThZDc0hi4BkRKbgrVCAeXOq11iaRl8uT97O4fnyKOrLn3aOKCqI3eNEu4d2kLZ4RlcQlptcNHFG2DzHZQxKxwU+KmtKxcOYM27LYQ7Iy2KTOduz4G2DYI8paA0qKu7bTUkT6RLvEDRJkyZzTzm7lienwcPpFx0b3firXWyk3L3A4D2Shi4nHsL9FFaRZyezGRNzI4kWQICe+062e+nZHtUpXiv5RUzUiIXXTMoP/wCWDmo2ii5dRdZAHH3+nEcpuleRDuIiJ8uCekNdxCbfmXJh6ZInnCq5wGv0ix6N0o3M3FpV2/fdPKM7aeg8/KGvYJ1zbefmPH3Gml9aLdTWkXmnknBzszieJOYa5M+8X3HM4FdvNC4DQeO8qp9KRMzOTDmDudIGQacZq5e6PWvidqII8ltpXlxWBW5PDe9NuF/+FYKwfBpLEpsJZjEnnZh47G2glCcPhXgi8Ii6ev2KWHv/AOwrFpDHcGeFrFMNelHiabdEHWRusMagVvgqaxWS7s2/M57MsTmWBGvUpyTwpTSDyRtLv/mJxtz7u82XOx66rTyi2IsTxXZyTw3+l2HJL4YbjUlLf2e4XPvHLrU48N/WIhoj/JNOXcppGZYJ5tzEJR6ZZEkV0GrQuH96i2/SExNYWTm/hzMry6u7Xz1VYtNm9k5/Ec9uSxTB7m7ANp2fBq+5aJbdoSJzXgkQ4phWLS8yTRS2YTPV/ZzAx3fMdF9ecRLrla4ct8bzBNKyuCfbnfek3LdhGWcqucNd65aomnGixQTkmRvdU/u+H/bnF040XucpmbZm+kOzG5fLra4Nu8V/ihaUiicZF0B3esvXe/D4U/nFo3yQ8fASzh7t4y3V3PAQBm7v69lYu9q5+QxjEZ2d9yt4U8bcu2yzKfc1bbQHDXzK27TmqxS4TNOS04xbMzMp1qdaB1p504RfznSWmRm3JuQfmDMs5nsOjvqidnQqprVOFYTsUkRYrtj8GxbaPER2XwspBt+dNXAOZsb3mwIqC4uo1ROCdpaRTvS03KTORMl1lgmKgd2hf74RcYhMyzm7NsONPXpvaUROe7S784vsO2W93Tjcy663KZ7ITcl0sN2ZbKtpilFS1fOCa2MahFHLSDHuNzPRnP7sLTIL/OnZ73yhCWb1e9k332fz8K0jUz2CN+7RuG4s4u992g+mioteOnDSKlzB32rXcpzLLS/tD6V/zgWurCaiyhWzuDS20ePMSk9jslhDOgdLnuw20PkKbxInAeJRncQC3MbG1wblQD9OfzSLOY+yG21lNuWl2xJRL0XlD8NxN2T6WwwxLOS80YZsu81mVADvEbuKa6LSiqkamZSuIPRpZnIscC8yPNrdXhu93+cNJLHhy93h/i/7xfdGYmveE2w6xKd8Jbe3hIuwH7vnyiv6JmMk73eF34oGkCpRlyamRbutcNwQuMrR3l4kq8NeawRPYfNYZiEzITGWTku4TZk06LgLReRJVCTzTjE0xKMtvDkOuO1Ab9Ld/wDnRecGS8lMyssziT+G9Jkc0mdVUAcNBqoXJrVEJF0h8weJUSpmxMg62VrgGhIXhSDkalEmZv76dZscynW+r3q7pkOule7+cQWCTPWXaBuWimq87ljjbRbsLIZE8JB1ZcuyPrDpJvruv7K3du6nDy1/1h2WX3n7O6z58eEPErbSuv8Ar9IMgHE3eGVu6Du7iV+vGOSssw7+91drX98qlRd7gGnNYMxydksRxibm8NwlnCZN0kypNp03AZS1EohHvLrrr4xXOBdBewBeNSj+HYxM4fMsZDjDqgTQPI4ja/vItC9YFctcPMb5DXfL6+uvKCJXK+7clifc3V6oqbqdpKenpSB2ZYiD8N0FwLmRlHFw0J3Nlrs7LEL+uGg1utTurwr4x6HsLJ4lhmXijDsg3Lk0SzGdMKHBaZaimpKvJI8+wtm5nLHLb6OJOHeVpObyJanxKnh4Vj0fBdqxY2Pd2by2MtyZCZO0EvJRFU1PjwWPP4iLnbw7Wn0e3ezLHNkpvY3FMHxWQRZswcclanXVR4DXgvDXnHie0DEocy/huQLHVFYBSyCZP00QlrXVeC+mkaeXe2dldm55hjEuszW3QdBndc013u2KJd9RrFThD+HYvguP4XO9Imcdw2X/AKq6JZl2XXuuukupUTh4R59NZj7HfUa33k8pxmVnclzN3ckgaMTd3kVa0oK600Xhw+cVeGsk5M5DrkyUmRCswLPEhH8tPONoWHtvTmFBPTLc5KutHMM9DmANxu6vbXiJXJVUXlAuGyU81M9Lm89hubM2HnpYdbVojtE/d5aVj2qE30g8mtpqA7L4A5tJMhszs9hPS8enXvszpTeWlggpE1au6SrbWqrxjOlKvkAyxC50i9QybNa+njXlGvZkikZzNlJmdGRlphzJNrcdGugnp2VVESqV0SAtrZMsDxiWYafF2almUdmJnD3ic3l3u13VFCFFp9Y0h/Hkywkxzre6W92PrBWITOf92NkugAAXAN26PiieaxDY828Tb1wkvaTgusTTbrrgFdu79bbedKfpyja5AA4Dd4727b+f/eOkDjWUXeLeHTlyiVwy/vO5Z47vhEVLd6KuTYjMbhu/PlHCFzvRPLt94u59Yfbm7vZoH4ivX/NfCHkKx2RkimnykgbeKcPRlsKalXW5VXTSsVxRMY2rBLJgy05cyy7nNKG/Wra1TeTzi4khluCNjcoipWXLxXh6xJegUbbK7Xe+AqcFpE8rKOPtOOBv5O84Caqgcy9E/nEM0jHSHMjM6PcuWpol1OVaaVguTjYY9MOmwzLkoqDNyBuJzWq684jYUQdEnGswfhrSsJQ73dWD8XnZWd6H0bCpaRyJVth3JU1zzHi6VyrQi50ongkURiRAGHrKtZj0y2/mqjnVooo3TRU1rWtdIChy6n2fkkTyTzbEy08bDbyNmik2d1riV1FaLWi8NIQEKq3koOXv1Xfu4/KGWwTNOyzt7jbOU4bpFYP3YgvBBrrp58og3kVC7PhFEnWTyzu3vktNIOe6ImESrzcywE4BmBNNg5fbxQyJVt8kQeXGBUIWn3G8wDEt3Mov1TnEA/XyhANiUUHKOpULSieMdmAyjy7q/FoqUXmmvhEXCGB3hCg9+VA8LanQmSemHHXc5nL+7EbVQq863L6UgJFKxQ7q6wrhMEzLhSkzdRh1UFeIo4Oqf6/KG5odEyMlq6+/N1v4Ut40pz4QPEraChgTgFl/SvzhgRQodHWwIzQR4rAI9T2Hw7C5DZzCMY6O+uID7wnJy77voos2NfPMvirnGcRx/aTAMEq6/wBCwxpt5JdmpMtCKuOetBWqrGjZln2NsH9gsLysuYlJfCZk3PwkLjrn4d675JGcxzaSWkMRx9zAn3hOeOYl5ma5Oy5HRttvmiKI1JefDhx4o3+f/J36Qvrx+hUbT7ROTUu7hsq4vQnZvpb3/NNN1tF8gDRPUooGpYXFNOkMN28cwtPlTjAqLBEwrJESM3iyi7l+pfOkdiqcTPfc9s9luBTW0W1Ozm2OHdAkWyxRqQnGr7UB0wOjtqdkCtp+9FftbmT2G+0lqefmH5xl6TmQ3rrrXVbIyVdeyf5xhtk9psQwzC38HkN1Jkxed/ETRC439FEv8Sxvva1hsz75ntoGGnWcN2kkwmGPhIiaF1Q/h3dPSPHqU8K8S35flMSewjxUozb8/wBLHikTZLuQT2WWWhICnyquqJ9EiFeMPESKtBrTVY9k8UZD17CbuvjDI7SABLEzD2U26OW2eYFu8nZ1Rap56Qnmm27LXQdvBC3a7q/CunGIINwDujhLzKNTzbm81eiNGNd4ah4+KVTjAUdi6ncIZw6dlpednJaZGZlQfQ8PeF+y8aiBa0QkXQhXVIV7FY32KakX2BTOJyjGI4Sy4LLeIS3Xsujq9bvgg6Kta6pwrwitliflTfVokS0FBzfTUV0VPP5Q/DTm/eH9W/fUWwxWwhprci10X5xM6lr0yCzLjzrxOPOkbq8SJa/nDWXFbWCJGSems6y3qQzCuMR3a05r58ImxZ6QddbKRk+ijkgBhmq5caDQjqvC5dacuEF/AW+oHmc50M+0srs+SeCRJh0g/M9Y23eAdrhySvNfCDsFwrEp9cgX2JCVf0J6beymtNdVXj8qw9hMNld3rJxz/wDph/8Asv5Rmz2i0Gq07zlIVte/huJYuuObO4Szgki64jbOHMzZOuM2CNTWuqXLr6wBh0g64ZuO2sd6547f9Yunp97FJYxfayHG5YWpbocsAZpCqW5nDu3b2qrpEr+ymN4DhstimJSzmHjOXdHzd11RTvWrrRfGOeavTadDeKWt41LLZTApx6ampSSl5qdl8Qw4pj7JI5twAVx2qdLbSHUhgM8MZ3fsEyF57jswdg1+lNPyi6wbHLZWVTD2XGH8OveZcdmTMrDGjzfw0Xt2olYEeYdYxXInpSZfyhVMrOtotN1btdOC05xySzZnXELiBY+1OymLTLbbkgD+aLZHKETra0TiJcCRY2/st2Bx3aGfxPG3toFwF6TlCmGncmxt8/7tFTdFaevpAI4RtNiEg1Iy2G5fRwUxFpmx95CX0uP+SRO9hW1eDbNtyk3i7ktlTJH7rKYtJqo/fEPBLuHjGT1JtjpBapF8tTPY5sxiWEzOW/LFa51jRW9oV70GT+xszM7IYbik3JSGGyczny7c/wBIKrrrS3LmBraaotqJRKprE+00vhcuEo5PbV+95qZl9/omYRSZ3JahVTrN3kiprzijdZnH7msNYxVyVArx6QllfxW1oi/nFU84WJuS+F5tBW4Ls/LFiUsxPYo8xJk6PSClkucbHxy1VKr840nuTYvpOIN4limMSnRjJMmYADfc8NEqNacddIjl8NxZrGOiN7SSgZtgH0R43UcRdbd0KL4a84biWzuUDnTcYeFwyW8Dtb3vOtF19IupVlp1b9CUTTRf1CXsHwbDmf8A6bjUiW+vSJuZFsnhs+7EEDRVrxqukA4fPyknl5EjOk42W68zO2Gn7tAqkavYNfZ61tNLNzczPnh28bkvLDc8G5/eloSV8kiJvaHZaZxXIlMJn5neNbOruJsaqXLTdT5Rzy766TP7HRhHuIMs5J4I/dKf0a2g6Y5XKaa6zd5W+fGuipBGFSuBSqo/M4BibdG1bsPsFoqXFXnz9Yvdotvdm2A6DgmzLErkvOfaOmZwuNnRRHgmo6pXnBmHbZT2E4e1Mt4Dsxe3kuWdBAnLD3gMqooqC8FiperK9sx+ZONO+/7Gbw/Ctm5CTDFJ1+bck3zclrAszGjS1btVoSUL5xd4X7PcJ2hwSbxLBtom/s7rbQy8w0LTpEfgl3Ln4RYT/tfm3WuiYphuHTsm9N9IelykWRVtO822Vu6ip9Ir/wCn2Eky9KTeymEsOb3RD93N5jYEu7cS0UqJz5xDc75HHJ+CZn2V7US2JDg2IbQy2DN5SuS7s/OEkvr8NtdV48ErBWNez/G+o92uYXiv2cVdC5szaIR3ry09U8ofshtjgGHTzk7juz2E4iyYIgJ7v1uRa3aGia8IOwLa7YOem3HMdwDJlHJgjcbkVIKCvdGq6enhzjF6tb7/AJGiU6X+SZeY9nO1siTs3i2wrLcmyzmG9dkog0rcioW9p4VjPy+G4W6y71U+1ZvnlWuiKfiTRRj2zGWvZzirKYxJ43tJIti8MvLLMtE8AiIaAB17sV+C4Ls3iXTintrcFemMoegnNhlJffvZtRS4bfOH/Fz5/wCw/hzyLFcNcn1J1rEG5vpVAveZMTuThQtdYB91YlKfsnQy9zqjv9fNPSPXsS2CxJ/GH35TApB8mrVCZ2dmhy214oStoSqnyosc2kwWbPr5ubn5maNpM56blC6yvwnahaef1jb+K2M54bI8nwlcS6Y5lT3QrwLe1G78Gnj56ReOJMjP+5sIuns6YAOj5Qk866g0TeDitSJNI9AkvZ1tDNYak7IYYxieHjL5iTciZaDzuFe8nhGNLAS6Y50RqdbelRR0jZ3stK6HpRePhrE/xCsw/wCHlYM1NHJHMuy08w8w9LBlAFnfEtRJU1qmuq68oKb2eF212WmW3Byq/GlPlqnzSD3sExDEHnX232MSJsCUxMspz94kKi6L5rAJYdiWHvdGxCUmZaaYPrc0FA9U0T+cdMVP6ZOdqf8AVBDjUiMmEs61IzNrTQ9JMHcwXDr2h03UpbovnrFbPTfvPGH5spaUbcnHczKlgywZrpYIJokaOY2gnhypZhhvJYBQADBLlFdVuJKKeq86wGL2DYn0FtyWHC5hgFB6bADdzirWpCnDw0jSnUmO+DOokT2yDOYbMsMzLT9rXRSvOVeOw7l3d0eJEnPwSKhwM/q3yLLv/eEa87f91jXzGEzLUm1i7HWd8bN4UtXRa8lqPAopsYl8qffzS6w7HLraXXpUl+Sxqzq3YZYMncZ0m/ha7A6/5xIWR0NscvrriuO7RR5JSnLXXnFnOSzQPON29gUu3kPe71qp3YEnk7IiJCKDuCR3etPJV1pE3GA5ThfdiWYlT3ONsPk2GHJZwX8/O/Y2W21+Eqrp41SvpBUj2HWMtvftW+yppSuieCLXX5RC8Drdw/sztUxu404V9IeQrEbRC6y0xlN7l2vZJa67y86R15jLDLJom3hJb7vly4w5tbvhEhog2hT6+fnBDcwRTme/1rl1TJ6riL+9zWJmRlcQEDw9zgv+SwS3MzLuJdJ/bE7m7g27/G6iaJEd1u8PaSCJV5yRAnJRyZamnL23TB2gkyQ0IKcdeetFSLuBYOG3LTPTXMybvC8+l7u+Vd7dKpeKLz8IIw0WyAuvbzhttHtI7Xit3DTmnnFW9MuuybbHdCpgPqmv6RYs459m915d2H2p3AzS03bjT4V5Rla8Gl4LJx/FBZbbmczJe61kf2butN3w8PKKbEGmGGZl3pY9K6Rl9GEC1aUaqd/Dju04wsGZaamZnPmez91YFyOFXx7qecXErIS2Ks7stKNzDY9FG55QN5wjqjtezVOzRaJSkZ6JJp3gewIe8NpMPkGGHDcMj+5K03FtVeen+keobXSmCYe83LYexkTDcizce/V2YpVwSEu8t1K8N2PMtmcSndl9qm5kWOuYI2zaMfkSLG7lcZe2q25N6fc6TnPZrsxoG6iJd/2+UWrytTLxYnGGp4+blW9hT89islLMPkw3NGjdnacGnfUe95LzSMZjMs7MSzmIDMtGJulLmAO0LRK1IfgXx4Vj1/2zYTLYZPtsSUyzNshL5nSWjLsEO60XISTwjymVZkTebFvqnHbwdR7ss/CqKmq6cUWM4mzyaOvTEGYmpb9oNxOW1L/f84ImsKxCR6Hmsf2yUSYa1Fy5s6pXStOyXHVIupwW2+rkS+9ay3t+tyr2k/dXTSKlxm94m/um2dLy7JH4VROKx0pUucrJYrpiT6MAiRN74ie6V3FP1TmkOkww85/7YL4y9pXdGtu7O7S/TjSvlWLJ5xqZlmZJ/ojBNf8Aicoru33iTjRF404D4xWkxZmDulyvT+Uaw5AIDJCobtxUruaxyYB1pAbdt/vEtpwXzT9OUEjaJ7rpCOu/5f6xJikjPYSYy8y1kdIl2n7LxW5sxuDh4prTjGsMSVrzRN2/jGqekObbbUxuPd9K0+UEvSkyyDUzkELLiXtuW6F/uixE8NjI9Xa4ut9/d9IdxEROZbJCNvWU3u8NOXzifBZCZxCZd6MrFZZhyZLOcABtBLl7Soir4JxXhAZBDXQIF+i6LGkGbDnzzXTe3UUjrbw468PCI+NeUSiDOdTrMv03oip8UMmRvFfCHC2VhHRbB4lSqV5R0h6q60u0uvKOCbtmXcVh005LThDM7CZZJ23ujWl5aCnqsOF5QGy0S0Ud7Xj4eEPcc7u8LY/s7/rDHe2TjY2AdbRrWieEMNtgh5tTkGptrDSbYDqXHt4hNzUuPBFt5eCQGAkXZ5QW4U/LSKMF0pmTmrXbFuEHrbkQqcCotyIvrDZWfmpOZamZR05d5qqCbW6Wta6p5LT0hALOlfdpN9GumScuz1d4D8KD/NawKRXdrteMNKEMUSdAiHslSHODb3q6JDYJnURuyXKUNiYZqL15LUir4LwomlIABoVS+kTkJtsuCTbfaHe5povCIB7fjAAo9CXZJjAtr9nAz3z+xN4hiKOt2dGdC43Gvkgjr+KKD2a4Gm0O22FYW4hKw7MCr9Er1Q7x/wDSixudr8blsWYxDE7X28QnJiZl2Qv0FrOQzu81S0Kesc9SpOcJB0UqfRLz4KXDNopkH8ex+d+2zEw05e892r3RUB14976DGPnEdNqXlkbudsV0/HhpX0FIMxPNbw1iS/vzWbdH4QTdGvyuX+KGSeEu4pguJYs3mmcq60GUAXbp3bxL3US2nmqxpiqtLGeTNEKVrUy4kocoluWZIWqJpTwXlBUnKtTEoeSDxvpS1e4Kc1XzXwifB8ImcRV1WJZXeis5jidkURNVuLSnomqwHi4zjEwUtNbqhbuD2URUqlE+caLKmbQ06hOymINYLtNhmKTcl0uXYmG3XZcuDzaLvD80qkbiRxFzFZliQ6W8Yy7zjss0bt4ZalvNDyqgWqnlcnhFT7Q8Hwz3k3MYHJTGFypM16DPOdYyqDXQiRLgLiK/KKnZ2edljbm5f77D3Afr8QoWv5LT0jhqqtZc43O+lLUWwbYvdksCwxjanEsJxaWGYeceLDJRpxC3XHLhR/8Ag3VpzujBug4w84yW4Q1Ak9OMewe1OczNp8Cx/BllveuISUpOdGkw+4mWtFu/EqAJ+aLGC2wkZZjbqabnXnmJOYeSYV1AvJG3UQ7kSqV7XikaUKudr+YMq9PG9vEmaAbzEfHTVafmsEJMTEu7RpzKJAVola0uFaotVTjX84a23Lqb90wooIkra5fbXknlWBxAijqOUeDZFwjjg2xr/Z1tLg+zaYsmLbOSWN9NkjlmukVTori8HRVOaRRTQsyqOZ8ve66Amzvpagr3lROK+XKMs5ytY2mnGGVwd1l5+TWcpe2yQtGeiImm758EWGTSyyzJ9ER8JaqUzaESeqokC1go2MuXVXHLHKp1SotVTjd4UjQz32JglJY8VclWZvMavIGnhZXrPh3eVfyjrGTLzh5jWYIVHKM/LxTwXWJ9m8GxPHp08PwxtoiUCcNXnQaABFLlVTNUROHjFnhk1huzyyOISIN4jiIFmF0iXuYb/DYWh+q6Ri7203k2ppfq2JXdjcUkZZx/H/6ha6IM5LpONEJzgl2MoaVKvj2fOBRelpST6TISjQM35efMWuO3UrujwT1p84RYjjeOuo6+9Nzjsq1Yjrpq4LDXIRroApX08IjOWwyTG5+ZzXCrcIBcX14JXx1pGd/Dbmvyv6hrUoxjOCPYk5ikw7i7Dot9C6O44brPHNzOyCDwpESYIyWHuTruMSQOZgttywO3vOKo1qvBEROaqvHSKliYmZg6DUWgDeEOFv4vH5xdyWB4vtRNy0hhrZG2yBV3aAwCJcRkXDRNVWBumd7QNWh/F5LLAsQLDdm3HJHDcLcKYeyulzCC7MtUSu6i9hF+NE+cXmFzm3G0Jv8A23FJ2VfAWps3TV0MvlcRVQfKlFjKNN4ThwdGaz8SnLtD7DVPIe0XzpG2w33/AImDEy410SXmvs5mDXatp+yBeXjup5xwV9OqP3OyhrZZ/SD0DYz2GbWPTLc4/g7wyoH2NxHPmKrVI9fxP2NzmEyIY1KSUtNYkEm0y3qnVGKUV1btFW2PPti9p8E2SxL3hiGNzeN4133XZjM/9K2/Uij2jFNv02jwVMI+4empfrBbPrAMhuEPmn0qkeY9VbMz3v4O5adSJVUtbyeI7QSeL4aA++dvhkZeZesm5ORmiOZt+K5KIX8RRgpGZ9nmBbQDPuYXM7QChlczPiLgEK97dJEuTlxiz9qY4Tf0vAm5mfbyivam2rzY8ezu/Omkeaz06/PYbKSLuGsS2TmP5wM2uPAdN4y76Jbp846KP4nVcz4i1ObWNTtb7TZNzB2sAwmQbPCZSZc6Iy71ToXa3mTepeFLowMnjmOuT8s1hDUsM448PR8uXC+9V3bTKq8eGsS4p7vlXn5bCWumt9IvZm3WVB4gRPhqqIi8afnAs83imNTLj831V53lda2Nf3RT9EjupJTT/wBnFUqVH/8AQQoYk49iHvrFnGJ5h3flzcNTdcv3uGlU4wTL4MOJ4k7KS0zLFuOH0iceyRUQGve7y8k4qsVo4bhsqpdJxAnHE/uf8z1/KCBxTC5SculsPzx8Jg1d1+VsNtZ6BR/v/uBE0LUtkNTLhb9UaybePnxr5RZPOzrGzbDJbNsDV54PeG8Lj1RTqy1pQPCidrWAp7GcQTKfYywZvXKtsEhJNeCa6cqwHP8AvSZe96T9yvTl0wb149ZUlRSWnDVF0jSEae4iWWO0tpORfKW6W5LSVsvapZoKVflXei2mcUx5/wDrJ7GJAZdkBkbchsQyvvBZy+1Z4aacKxjM4rP2kGP4b0yWlH5abZm5p7MvlBuRxoQ1uJV3aKngtYmKc/VP7BFW20F/POSM/muuYtgMoL535UtLH1fppVEhYlOdPmOl4ttdLzjx22PPShkdAS1N62tqIlKRnpSdwn3PiUt0LKnHXmHJQkG7LEbswblWtFRU05w+cS/CpP7Nli2BN369ZvV9KpXlDmlj/kD53x/c1jk/hqdLm5DG8LzJsTlzlwkztabPjZei2+XNIriCWJlx/wB9yQuablh3Fy0oNNEjN4U60Bm06I2uEO/qqtoi62+sWWc0w8w+w/Lbkwh2Oivd4XJTsr4RnNHGdx8/Lwab3vja4IOAf0klH8KbPNal+k9UJ/EKKmixLg8li02brTk30vOD7NlPA4OdVLbq92lU+kYWaLp8y/MzLrDDhb+41aJFXgIilB8eSQ+T3QJsXPmMKaEf5BcVv8ueiNvbTYG9NsTpTMg86CKf2TeLmI7qcF8YK2f292klZ+ZmeluN9Gl8x2yZKWOy5E3UTQi3uFF0jJYxtHOzM45M+8ptx6xsALhuiCCnDwQY5hc/jONTLUk0w5is0QmuT0fMOgpVbefZRVjn5F+5YNuf4hpPe9l/bDiuCbOPGuDdHw+dmuj9M3TIituIaaIq2rXhDJParZnE/tM3KYTuPbl7VtyeNtyGKp+ElSPF3pqUvdY6I3N7rdhykydmo8hVFu40XzibDXJS/effbeAVbseZQx8KaLy/WOZuEX50OheI+2p7lK7K7F4iy/iWDY3NsTQHe8Et1wWl3SbOhkJcFopRVe0HA5SRnFn8JxjpnTVI3pGWDL6MfdDLc7vhGFlZyZwzB2BkX5IphmYSaamM7rN5N5smyTeTT5axNjW2ePzOf0uZffezRUZZ2XFxi1e1bxQRHkiRHLf2aS6ks5sp0lmU6WxKSk87UHZQD6LNjvbvVO0A6/hWAtotiZth5iUYxJubmGQyBZeHJdbQeDeu6SpXxWLnZXb2RzsjHWn5SVa38kHc1h38CMPIY/4VHSL5uf2SxWWfazW2HDdVxro1Gg17qy7u7/hONGd0IwSoeTstzuFTLstiDE3Lcbw+7OtN3jxSsSTDzbrzbU2+M6200AXANht6VVNeNqrTwj0rEMB6MZSnVzbZheDVm9//AEXNf/6ZQHNez+U+zZcyLM5OM5uUBVyi/uzbKhCX7tYr+JjyT/Dz9JisN2bYxCWmXMPnmHHGRzBamOqNweaDXQ18q8OEZucw6Zk5whmWHGh7neT/ABRsdopPGcKwoMPmWnHGZYyyXQKuVXtJ5JXW1eesAYfMzLof1g10ls+/dx/i/wA43Sr9V7wc704va1pKwZAmJbozr7NuV0oLd7eIU6u5ErdSmi6IsUs1J7l1vjvR6LjglistLSTUzl+7Wujsy8w0IOCKkpKK0TfW4uK70UmE4KxM4w3h+KTvu2XMqOzBS5O5XmoprbXny8IvmwxnNKYMf0YmN7ebK3e5aL/pDG5R90xaYEicPsiPONHNJKMff/ay3gdvPdLkNtN6iJ4xTjL90fhrdyi7k4kErPTMjlix1bjTuYJWDchW0XinCnJdKxGTFpt57bmWoofhUV4KkGvSVh54uZra/wB72q26+cclenAy6+0Lltthu26IJaUr58IMhYgUuxub3fr3kTVOPpDpdlubmXeiMZAiBOWZvdTjQi4r5cVh8vK5h2jlt7qmV5oHD15+Udl06M9nsfeXbgGF/wA/CqQ7itsH+67cSalmMQYcvFvrpe5UG5EWnCtR5+aLFuUsWESBMYgWY2d/SBl9d+tBuLslp+ReMRt49KPsyXRsP6JNNyhy8zMC6plMkVesVF0BaaaRXTGbe2TD9pJ3NdQouvhTlGf3NO3YvJrZmblZnFswsP8A6sk8x7OeDsFbbl6757yUtqsVGCzbTuPMP4y+4xKzDt5zIs5lPEkFKXU8II6BJTWFTM65jMsL0m0PR5d2XIDmR7yDxRFGvPtJziibz7M3qyFrfaaPgW9qg+OsCjb2a/EJyexCfdJgn3hbZ6R97paHe100T5xUkbc29m9GzJozNx569auV11TgNPGLXZvG5n+jz+BOsMPy5kT7LJtJo6nGh9oUpyrRYmw3B5bE3nch1yS6SAtgH3gXV7JGnZFeNVrHNPQdNs7FZtB7rfxIpnCxnXPs4dJ6XYS5nAjGzRB7NKxUssZGZlyjEyUyBN71xEzWlHBoqJmck49rhWNt/QjEpFmbGdcfkmzqy6e9QRRakhInFKomnpFDOYkUngjeDDhrDdjyzHSMq2ZcKmlx8bU5Dp48YulV/p1JqU/LRYy89JlLGTRNZbgVuEqiSclEk5U8ONYY9Ll1TThZUuZIaHfmC3d8Spzpy4+UaDaaWI5yZJgumt5TRzc5eryZp6mV9E0UtNa8OMZ0Zd9zMtEibZHMd8EFFRLvzSOtJONtCGTaliedKfffbZsL+zgJFVE3d1VTdrx5okV2S9M3E03dlBedvIU4rFo4Ep15dY2W7k04cd675fnArgZVuXu1ChXefH8o3VzKQUVLJIbnMutafp5RC4l0GlLOdWXdWv5cfpDekudDclG/u3bVIfNOC+sXDCK+2JmbQzCLtcLeeqelIknGBaPq3BcGwexdxUdU15osQOXn2nLrQ7xck5f6RruRYYLtjNtvWXfeVVFpSijErwjMSjSso8460C5goG6AJShV81XWBTQucEMOq2yeWrgXgQmoOW3itN1U8PKNCLA7jLrVpENt2qRLUW2RJt9VNxFF0LeCV8edeMTSio2TJzbGfLX6hqGZ4pdTT5RPs0mEpj0o7jzE67goPD04ZNUR3KrrapaIvhWC5OJUfw+MSiPR3izBEiHSi7yfksEhLOTEw6GFszDouEdjQ7x2DrvIngOqrw0WIZdsHFXOI2wt7SDXXl8qxVzPEbe6+HWOkQsBuIR9lK8Er5rWiQNX84mdpW1Mvc0qne14xwmrWUcLS7s+dOMMmTm9lClvjrb/ADiKCVe3MtvMBs0HMGtblTnD3VlPd7TQtudLR0sw792yiWoieKLdr5wCIQASZMs1BJKUDXe/7QwzNw7nCUiXmuscgwWTaZO5tnfaQt5d4UuTUdeP8oNgiLg7wtIdGSU004pTlrHBbKCpNvMmR3e1HrXt32cwPCndnZ3AJIZWTmcLFt63vTLJk2+fzJKxhU4iEaF9nQlDJZY77AZP3Rge1e2marDsrJ9BkT/5riXuKn7rY/8AXGQNqUmZnCGBZmXvs/SJwL7am64q2D4VGxK+ceuSjUpsX7G/d2PS9FxORdcRulu8dDPX4t1hr/FHkWHC0uD4zjMzinRJiWZDowI1dnvktiAPwWhctfAY5aD5uz/NjprJy0VCmxhwZycxidFuypjaAdkBupp5JSieUHbFgy2JriqzLkg9aayLLuX0qzs3l3W0LivH4ddU1nst2YwqSlGMd2yw7pMq+0TuHSKvo30g62ib3eFivpdy0gn2nYhhuzTP9CsCm5LEEB1JvE55mXsGamKaABLrkNpoPBF3ljpirDPyznalimcmSmsVmZfGJScknfd5SzmYyTYUCWHhuj4/Ul8YzeOTzs9i03NuTcxNG+6prMPr1p+ZesXOHixLtTk/jM7MsPdGd6IDTQuE4+qIg3VXqx148d3SMpzjp6b2XaDn8XnyemOe0iexfL/pIw3jUp0FJLKme3LiJKQWH2tFUv4VpySlbhWAty208o226TmE4rexLvfv7thfiElGvyXgsRexqawmV29lvfYNHIusvtkjw1C9Wjy6p+/bGl2Xbv2EcmX5lopfpLe5+0YcALwmP3UVCaLnRR8o43Tl3wi0HbSqcy2c/Yz+O5Us8BT4zfSncNl3ZXKJEQHA3DvSleAEmlNYd7Q5ZZjCdnsSvbccek+iGQ/EyVB//wBZBFpttMBi2H/0hSRSQmpLFXWZiUvvQJaZUnW1u7yVVxK/uxOkrOYh7L8W2feLM9zmuIS252bbQd15orbgF/DCX6ZE/wBS+zy9gAV4BfIhav31DVUTnRIt3MNQ8CfxJudlhl2HbAZUxR8lJdKh4W80qicI0GxeFsTew20GfKy2Y61nykwbVzglLUIwEu6hCev7qRmpuWdyW3nP7KBE20Sh2rdS4evHzSNuZk1o8GPLwW8+SsrYAEPaggZRHJZ18ZyWXKACUCK0zUlpaKL2lTivlAjhEZQZhQyBOv8AT3nmxFgyZywuvdRN0V1SiKvFY1kyjXQTbMkGGOPPPOdMzRRtizdUKLUlKvFFt0pD5eXcmmTnZt/qW1EN498vARRf14JBUk29j2KtJiM+0yrtjaPPboCIjRK0TQUEeSRC4y6bPSy/sQu5N6fW0U9P9YjL9TTHz4B5p52zIHq2O1lp+q+K+sXeDYaONZcl02UlbQHyzVVfHmqc+SJFfN4g1OvSfS5ZpmWYAGj6K2IG6CL2iXgR07yxLhWHzjjzuISCPMYcw9lrOO7ot3Vpcqd5U5JEt2+i07/Y+Yn1bA8Pw5kpaXctzWgdI84h5r466wNKyzkzM5TgE5+AOP1i9flhkQJiUzmJ6ywlyquHX8P7NLfnB+G58y9LYfszg7kzOWChstCTiuEnaU14lXw0FI55qaaG/L/qkjntm5TA1zcddy5hmYFt7CZY/tIhbW66iin5rBey+zuKbRzbL03OsYFgW/8AaJk8tkRQVVbf7wqfWLLGcOwLAwYbYmWdo8ampZH3WWiLKkSXi24nfIfWkUuIYnLSLLb86/71xKzc1+zyo8gEeBL/ANKeaxhmzfc2wVZ10gvJVuS2Vbw/HcN6S/8AeAU27Y3m/E20OpilO+qRRPY9nvE30nKl3D3paWSn+I11L5xXZ2KbQm3KftjLq76BcRcLi5+VYv8AHNlcL2cxqzG3yYJmy6QZmgmHbrd65wNwarXxVIjBY79ZNMmb+XopfYWM30DD8MwnCZabxbHDF2RNoycmWGhNRVu3gKFxqutErpFzhuPe5Z/pb+KZW/fu9abpIW95JVU4rFHj2JbSSc5/RnCZaWlhsB/+rnRcWx4BXff7XZWioqoiQHimASmAs3bRTN01cNsoyVtefHtL60RPOOJ0z7vPjeTsR8O39fBufadtRhWO4j0v2e4ZMSSzLXWg12gcX7y2nJf8483dwfKzX9rMWcYmMmxkAMdKcBPnTlQfrFtI7bzfu13CJZ/3Fg7h7/Rpe4swQKyvfWvBVrzrHns5MkT2bmlmL2ua/XnHTw1B4v4/ucvEV008/wBjUzu2uF9DflMH2elpEcoAB1ozS0k7RFWqnd+JdIpWDxScyizm/tOYgDdlANvFC4JFG864PVldaBfrCzrj/aW90eMdq8Oq7R/2cbcQzdxZS5ty0m9LTMkx15AozB9tmnhRefNFgCYnidRtn9mzVA3ETj+vzgeZnnXmWgJz7nQNOCKtePr4wmRdmd1pre1MqeCJrG3L9mORM31j2YUW+2Ehg2FY67KYNjI47IgAWTgMkyLhKCKVBXXdLSvOkC4HhXvKVxKZ94YfKe75bpGVNPZZzG8iWNJ3z1rTwiumLT/abwfnCx6itl+41kc+bBts2m79L3StEfVeUSZlwQVLyc9NTnulhjPmAI7QlmkdUtKrbZ2koNecCNmmW9/ZyuMU313x51TlTksVa5JJkNiYPdY43RM2wKW15a6f5xNKvFusF1m92dbaws6U6B2nCmgeHqtMogTzRbq1/KIVecdMpkresMjt+cKSi92k2axfZfG3MIxmRKUngsUmTp30RR14aoqRSzwm3OOS3ebJQIfAk0VPrE05iRTbTjk26+/NFb1puqWieNeOn0gd55p9lom2C6Q2BZpX1FUru2p3aJ61iVX2DTfYs8NZdmQclhls3g4fDMtHjavHhySGS77bH3RZZa9/n/2gBl1s2Dd6TlPAQoDVF3tFqSFyp4ecGuA27hoTObKXMEjWTwcdQqrdw1ROFeOqRLQVBJa2QD1txF+Xksdk5x3D5xubkX32pgK74HauqULVNaKi0gaXMZd5rpbDhMnv2fdq4H4Vp+esRXRFrDuWkuf/AOO/8qRYSrwtvN57mW2737F4fF5xVMnlm3c3w7h84kzbjbbJov8AEvDivpGbQWrWNMzjs2/hTuCC+30OZebmDvEe2AqgreqXClFpTgsCs4j0U2OiXNllJnXFcl+vZGmiUt8da6xUS9vWfs7Kn2uVdOPa/nB89Lvy33lvaUNDEtU48FiMFLzYvG53pV0242TrwDvu25g28N+vBOUWmAuS2TkMTxMSM4YBOgEvm0t1S2v6aRjMuZstFtzfG+3XeHii05jzrwg96bnpYyln2+hS5m2+cozuDoO6VqrxtXivjGLUjdas7ybR54sNk5n7TPu9n3cdwHLq13hcBa2rzSnDhF9sXthNnITcpi+HsT0qDX3r0ur4NeVF3vS0tIweC4s6xmOygk3llW/tURdEQkXRYsMSm8PaDD91tvMZzL5QlK1VJbhNtdL08uVI52p/B0LU83PTZPEpvHAzCxRh2YFqgBMiT6WpwHhmh/1JFTimzGH4hhvvLoXQLncs5horpdT+FT7i/vRRYOmbJ58j0Cc6Hdc6REDtXezTVCqKpoqcOcXmD7Qz0tJuSWIPzLTLtP7QWWDheOaiKlf/ADEIY5mU6Va/T4MhNbP4kOJPuXdJtK87y6z96ne9UrFzKyU3/Rh/H54c+Vbe6Dfm0eRxQvGnxDT1jY7Fy2CT0+6w/wDZG3R6q8OJfGAIu6qLzbWn4aRr9pvZ2xiOxzE/hb0vOTQc5Ggu/iXL4H56CUE1r7+CcIXabXPm2ew1iaPpOG3F8Q+HyiNnCP6qmZvNy7HQDKsWhIut13BKKnBddaxrHNnug4a6WX1gul9raNbS/AQUqBIvjEUq1Mz0g5LOdXLm6CG7dal/cuTmn4uVY6IraaawYtQ110kyk5JdTnjLMNjMb4WVXJppb8/OKOhA83dc43clwXUuousbWcwp8XnGmHep+7LvW+KFTQk804xROSBXkP3lpL2a0/PxjZHMKiFa9kTMyPUZTN5WCA3EIqtU176p+cRYxJlh845LO9pr4fSqfr/KLmYw6baw1vEsu1kJhWQMe3mIN/ronOIJhtsXnRm8uZeMEUDamLkuKi3FpvaVRU015xeRGJUYW2RGXeoKqXOlOa0i7eMX89rDZZx5vKDrXkq42ADvcNBFVr8o7j0/my0iw3LNsdDlOi5rVbnhuVUu5aXU+UDy5uy0nkP/AIX94RFzeGg0Lio8FVPnBuOItoV+Hsuzc4Mt94Op5V1lwDqW96QRgmW7PtC7lOSYZmU1NunltiVV4jr/AJrFrgbrUthWIdLbbd6U1YzZ22nBNKHw3dLtNLvlFjjDF2VPMS0pLNzAZbItBaNWxoVU+LxVeKwnqDSnpczuGvNTU4DbhOC8Yk3cNB3lSg3crfFI9M2ZwJ9t6SzJKb69lOiiy0Ii78RXFoo14rHmMrIELze73u15x6/hOJji+GlLMZnR5SVIJaXdmdGHCpe4P7y8vGMaxvw/yeu4/jOzOI+zhmUlZVyYngcy5ro6b7qgGp17yU5+XhHzDtY7LYjivRJQW2rb7M00AfHU105fWNxMYoxhuPSOGzoz+HvSbtk29Lu7+9+HhoK080jO7bS8seX0SWbbyBsmDpRXCqu96UtSClR5fcFSpzFmFPPHifm5xxy3rHqbjQUr+FBT9Ie9M3MsdLzHyaq3v6ZYj2ARfDygvFpR2WeFxjMES6xre3qfFp+sDtrN4Y9m5GW4cvfbMADuYDiUuFFSlfPikdcMceIJONOzmfNttdZ967ZYI2ktEtFPPknCK99S7Rc6IfOsXOEyHSgbyC66/fvBbGwRU3qprTjX0iWaknXZ9+WkbZno2a8cxL7oEArXMGtLRROHPyi8icNLlELIvgXWMN7yW38Vr5+XnAFl34RuT84sZz/1/wC6wK41ZGqMZNBGz8L+Zl98Q8vy0hjKM5LmcP8AHSqp4U1pqvFfCJnOqC3rM4q3+Fionz46xFaR7sa3JAyEfi9Yc51l7ne40AKJ+XCLaRxcsPkMUw9iRw9xvEGgaM3pcXXGkE7rmjXUFVeacU0gF5mstnD/APk3kTXlROK6RpckFJ98pbo3SHDYFVcFu5bEJU1WnCsRC441cHBF7YeNPFIQ9goW8Z7xb3isakD5V+blevlZlxktQ6s7Soo0XhyVFpE+HOSwSmIZ0iEy4TCZTivKCsFeO+iJ2tNKL415QFDIZGwTJuMojrTzDRI9ojhXVa1rVKfTWsCom52v4YtCmRewphh8WEblb0DKAAdIjWu8VKmiU58OCRWt7hIf84ZniSMsuTGZQh6ttT3zQdE8K8V8kiJtfwXV0idGSdNttnrXHO4FSVPL1hjxCZtrl5VBFFp/6oAsLJ7bY1dc5KHCicYf0oshiWNtvLZMi0BBJa0rUk1Xhz4REKq2aq24ScU8FpEiM7ol4/qnGFIQpq/ZxI9P2rBxpmrMmDs8YH8DQKdFX1QUj1TF5ssf2Y2AbxeWb6DhszOm9YH3oDlFaX77m7/FGE9nKS2HbN43ijhfbJnLkJdkA7bf3jpV/hbT+KNl7QjfwXZjDdmxf/tE0P2cBS7qgTe8UuedLT8MebX6qsHo0elLhf8AxJ7VNbTbN4NNt3dMmerJmy0GWmdFt+K5wlX+FEjy+cYy8NkcNBnPyCzZ7d3c8+yz52iP1ujTlM4biu1Uph45hSOG4cUnIndapPoKrml+84pLTwtjYYH7NJ2UlmptzC52ZZyepaACrNzC/wDtTmXIUi6cpQWEEyPWmXU842smhY93sOuOdaAPTH94RcPoKbgpw4xWhgzuKsze0jwTDGHsuLYgeKJuN5i0G7holxfhjQbVSWGYLinT8bmZbF8SDcDDpd7MabL/AJ7oaaf3bfzJIzG2O0M5isgz099HTTdk2W0y2ZRrnltDujcvPjpHTle0Ic+O7OZ3GZpqYmAypZllWwsMmyIs0tamqrrVYERXDZUE7CLd/KOW0aRyo61Sldf96xHSOiIOSZLdWW5hUlpDfcbEnGjpaapxUCTxTXhxjQY9i8zPnhHu37tkM2XlmwtEDVOs0TtEpAtV56RlsOdZlz6QYkZCK22nYQF3TFfJYKw12ko845m5zRDMMkO7VLqHT9a+IwD9SbDZpXNscNf2ZafZlpxpo/d2Z/4sUW9JRS+JFqTdedR70WGw+LFJz/2ke2zkTzTu71aiss/d/CQl/DGS2UHC/ezvvCYmwl97Kcl/vBMq5Z/I7axoZp3GMcxjE9pJv/65JnXGJYxszGyFGzcp+RfvXRx1VtePB3UWyiJL3YgFwXHnNjMZwMnpiQnJlmbe6RaLbTreSunqomi848wxyTmcKnZvC5n+0Mumw95KB0/VI9TLDJmc2wwvEOl5vvaUG8zLeE2BsMS/EiAJfxJFJ7ZnZTE9rT2olJJmWk8ZlwnAl7lLeTq3EUviUgu/ijCjV/E+/wDc0rUvw/t/Y8uHtQSy0hqT7n3deA8yXupBV7R4rnykkLbN96Mn1oiPgte184tMUwiZwsEcnWHBlF6uWmMsss665gr3tPrHeznElO+vorZaalKdGm26NqdTea3j0HQURdLawK7/AGejm+fcoXZT0845NPOEAyiPXsMmWXpTjxX50g/Z6Rz5vNcavl2KOTF5WpbXhXlXhA3RGQLd5xHS+DzTMjL4liDBMSM1dkuL2nrVoWWnPXSvBFi3kJx13FJKYGTYawuRcR0JZ24mNPj+JS5rxX0iLayZ977UllPt9HvFtnJAhbZD4AReScPNdeceiY7gB4bs3s5s3huLLPTWK2zM/hDWpSswJWN30qt1peqRyVa1oi/n9jspUNZx8Gc2Cwt/H8bQ5lqZHZ9ufD3hMBaLrbRlvDmF3reXlG52+lcL2HyNndksZ6S5MtG49Mssm1MpcRIgEPHsa6ctYBlZ2X2dXaLZ4cLlH56YYJsHOkZbOE2H954HVOfnTyjytcRmzmTdF8rtesEluKunHjqn5RyRDVmv4Oh2ijHyFPYw03JNSGD3Ny9l08dlpvld3irVR8konz1ibFJVraHEpl/BMK91yZAFkt0gnRaXRF3y1oq1WpcPGCcD2T3ZTGMXmRwvC5wHhlZk94XXA0tJEW4RuWilTTlWIpecfxcH8Al5lmTlWWzMLOw84PeNfxcEVdE0jplv6PG8mCrf+Z52glY2hncFxJ05HERnsUsylxHtqO7b1V3Cg6X0rThSBMHkZuanOtlHCl3mT37O7/eCq6JRe+ukESODP4a+67j+HlWSBG8h4MveLUczvFxrbxXTlAe0u0M3PTCtPE+1LEI7nedUezd5JyFN0eSQdzdH6j7Yu/5QW2IYrhcjJ9EwdknHNL5kyXKFU+FO8v4i+QpFNLYm/wBMdmXcjEJqZZMDOZ61d9KV1/aJyXksUs5OPuMttkfVh2Q8K+UQsu/ijVKGJhU4jMtrCF7KId7veKRaY8WzP9G8L92jP++OsTEc63JXXcVvnw4osZvpI3710FS7XTp8WGstltx3cznkBB/eNdPnDmnrcS1NLewZtl+aMWGBuvLs/wC9IRMbpMOdXMAfpp618f8AvDCfbaPsZnxAWn6QyUamcTxFiUb6194xZauLmq0RKr5rG8bGHkHJYMwt2XB77Wl7eui3J9Kc66xBiUu9Jzj0o+2TTzJk28C8jFVQkgSsVa5N8ZJye347nV/dgesduh4iyLrDpphjIcacmpWaQ1tfZespVKeG7TmqclgJh7oU6rgIy7ZVOsBDFeXBYYxLzMyIiy2TvGgBquiVXT0hotKX3fILt7T19Yk0HgDeShXOZil2bd2319YMbFvobpnb8ADm0JF+KnNOUCNZVQzBIuNyXU9NfWJBtLq8zur291K0iGLgbfd+KCJOWJwHyvbDJazLTO1VSqJu+K68PCHYe9KSc0xM9GCeZC03Zd+4RcXvAtqotPNFRYHF3rkeJM3TgfBPD6QhjHGbTgmXF3OBv4+ykWeKy0o09ntyk/KSrrXUg8m9mIlCGqolwoVdeNPOK2YeadBjLYystqwyvIswqrvfh05JppE3yKtiTzU4/Nz+c/bcAC2KW7ooKU0Tl4+sHS8qweV9uFvqrzvEqNnruf6+cBYiwzK4g9LMzrE82zuNTDIFa6nGqVovPnE0u7uWkRWr+sZVCoJiBz7zezNFuiSXDLBt/MzM2/cLkvDxqvjyjc4PiuyLXs5xHC5/B5g9o85OizmZuNN8xUfGMY2QgeYLDZcd09UWsc6ve8WNmSFtMSTFME4y0/Mk3MuNFliDtV6tA3f4UWGyJNXtlM3ON98AK0qetKRE2y50a7tWfX/ekdbAr7ooC8wPHsSw+fbmZR/LJtkmAPS7KIaEF3GlFp6R3GGmHcNlsSYmXHXnHTCba6OdrH931nArkuWmlLYfJyAjLNTzjDmTejY7ioDxpqQKXJbV5axH0ibHpcsxmS0i+8inLCaq2qj2a17VtdFXWMPJrrawPLrl711o/nBnXky4N26tO1Tx04+fhBErMSLEtMsTeHi+48zYy7mkHRjuRcyidvTSi6axJhuHTc2yTsla/Zchhcl9qDVStXlTnCl/JUKTYXM9EnOs7PYPJJPqldIv9n8RmRedmZZ18W2Q611oxQmwLdKgHunWtKRn2ZJxu3qy7N9tq8PH084Kl7Wv2Ga5rvkXZ86Ri9mN6cyppZx1+WP7I1uiF4jbaVF7+Wq7tU8IstldoMWw96W/rJ/MzSDo7oKBNfCubyRV8dEiswXFiawrEpL3fLTZTQN9c60hOMo2Vd0l1GvDTlFhNXSeyWF4hNuYbOys5mIEt0j7SzaVPUEXlWqeUcvJ02udPNg1sjtU1jGfKYhLSzOJOLuTdoA7cmiiX7N5PJaL4Rc4pshkdJxrBHZSVyZcwcOXa6tbhtK5ot5paLw1TmkePFJE5OOP4I+Uy2AXnLuhvIPgQ8CHzSNnsjtdM4Qbb7Yk7u/2Z137v8IH3g/CVaRg9PHsNoa+5n2cCm8Klh7XTP7ruON/hLgSQJMYU2P7LKeEkzb6gIqutFEt4acK8I9xw1/Y3aHDX2suYYmso3Ew3d6k/EFXx+HjHnOMYK+5OOYhhrj4zQb7suf3o05j8Y/mkaRV16tzPlX7YPP8YF8Am2MuWbceIUdayUram8LglwGq6bvH0jPuSHe/9vCPRZifYmnmH38PbKwetB4NxXfjGlKCvMOCxUY5hT7ANzLjbDbMwRKGVSzzFE7tPBY6VqmD0fMGOJvqcu0d4k3qbyei+C1/KK5uWK/4RuXejUPSzTUzd0sbhBDAmd5LtN1VWlNPzh44P06ftkmC3zXKZN3Wia0u01jTmYmXLuU8jnkGUN3Nbba/P5flF9K4lLNdJlH8PlivZFoP2tpJRc0SXskvl6RBg8m5Mm41Lf3Tilv27iJva+nKLbDcDaFmQJp+WmXpq77O1dms0XgXLXjpEM0FqshO0GDylnTZSU+yuS4m0fY39Lq/OukQYP0kjlmHXxGXN293o4BUbtN7x/dWPSGcZ2cY2N93ZbfTwvMXnhuoqhQgFOC+NYodkUwtrB3xmZmWazKgNw1ISFNDr58FjlWp7OpqeuhDtZssMnJtP5r/AEh3XNmAtuHuqKLx9Yz/ALqKbwHFpmb/ALQw1mBfMC2q/wAKp1noi1SNXMbWNTL0tKT2GuOMy8p0cMo95SQlXN3vXVOcEe0CWItmJJrLYlpW5XwmzaKjrttchaVSq8UVfSO+aea92xxZ4ttueICWf9/u2fipp8MMZkHHTdzXRcul72bBF3vdn8GlYOmJJ/JcxIsgROYVuy5LkWl3Y4oPnw5RebIz8kxtO1jM3h7YyozDec0G4258TY/vJFqZ2MpMB1zlso2xeAhu3JSnaL+Lw4RDPSXRWZR+WmW3SduzWnU0aJNPRUova8Y3XtTnsEnNrJqbwWVZlcHnLTl22QqTdU7GvZ14pGDxY33Tz5sd5PRvROFEp+nGLmLMR4KwZUXc/Nm2m8lpVC64sxU7g08fOiQK4jfRrR7WtxcqcqfnDieJ20buGnyjomIs5eUP/m61/wAv5xqZA7ze4JPkVxgitXDW5OHjokMK3o3duH8W8VfLy/nEzzLrX7Mhv8uPL9YGmAIDJsurcDQrvFP5xrBAK524a5l2D8Wtf5RNZccRlcB/ijWDIlCUlDwp58sQbamhcEQliaKpgorUkJNNF0ovjASETYE1aOpJvW66eCw9zdjo9ghtzNzc3uzz/wBp5xrckFKE2gxPnKF2WNlQyz73rx4QlBpMreuqFVqNuvh5+sWTYgBtDetVwQ814RK5Kvgy2842YtmqoB26HTjReC0rDbe9ErLx1abNwcsC3AcqoDXitILk4jJdzLQ2xYQ3XKWHcVwfu0XmmnOGCzcm7vU1PTgnrHLLTibLfa7VwXih/vCuqfKC4YkbIjvbvj8oJlWoklWs27+8I/l/useiexbYp7abbJm9jNw/DGTxGf1tTIa3lCviS0FPWOerVxNETLQ9A2C2D6Tj2zGy7faadFzEb/2ZoAvP/wCESbCMjt0yOK+1PHJzBHunSssdku6H/inF6sSFOdxkSp5JXhHtEjPYTs9sHtPt/OzPS3pjNaCX7j77x35Il30rbd+EKR84YPju0UtMzs7Jb05NZjrzuSJUGi3kldARELjpRI4OFyqPL+tDur2SyF5sLLPsbVdEakpR9yXJekX7/ZXVBL18P0j172ve2ZjaDZyX2TwuXVmWFtG+rOzPJE5+Ar4c+ceM7P42/s5sq9juFzso1MTgPSCB2n94Otcb+ARErL11VSKkY/HMTB+f/q9jLGxoA/eQN4vVV+kdPK5lTLxBjzeXTiPI/GFzM99i5uXYtvIuZF+z8P8AKkZl9xZh43S0IuyIpp6fSDMSnXHJduQbecKVZIj8icLtHTzpT0SA22XHt4G6Cmlf9847kixwO19CNkgE0JwLx8K0gyUZlXXDM23LO42DlPzVFgmTdw6Xw91Dw/PmztynXHN1qhVJbO9VNNVi82Xx+Vw33lPTkl7xQgBoG3FbBu5Tqq8K8E0QaeekXMTaZJW14gyM0w7LTBMvbphEgzDnSBmLR3e6mifTzidya6VINSjrIk+z909dQrPgXx8uaRDhs0/Jzzc3LtNkbO9abSGPnVFqip6xUkQaPZtzBpTHhYxn+xGFcxoLzW2jjaD+8o2KvgSrFphRY3Ne0FnFZJxJWdxOYUvtH3NzpkitHXRW17OulIz+AYZOYyDfQpa9yVeDNPgDQGaCJGvAUvKleVY9B9s+GBg+0chhLHS5Z6QkW5SZzbbc8e0bSp2myuqixx1p6/mYOyhH4eXiD0vYLB8GnMdbYxKS6NJy0wXVOnd0GaVvJdljLvDUm3APvCPlHlu1ks9PbDPMO/2rAMTJo0/5L2i/4Xm/+qK08WnsPkDm5B16W6TZKYpL8s1s0cD5FbVPDeSPRtm5PBMVn2nZnMawXae6TmJntKyTnYLwzG3xGteNa8487DkvmejnFZcTyj+jvRtlmJl93ImJwCnN8Nzo4raGqd4jqiJw84o8fn518+jTL7lrOmTfuN00RBGtEommkbvarD8UxXFZ+RwaSnXxlGivZAbjal5dKbyeApqvnHnYgTvdjuotl1McFeMehB8lh8xMzTGHssq/MPmAsiyl5GRdkR9a8PGNMzNHgx+5BEX8iYFycDQgdcDRR/dTeSvjVYFwnpeGG/iUl942GU09/dmadofxIl2vKsa/2ZyGy7ktMzeMvzLTgS7z7vVXt5AhwEh3gcI9zeS2i8YivU0vua0KeuMaTIFPbOv4ThDHS8N/rLHZcJ2Uy1vKXkiJbdOKGXKuqCNecb3ZPFZn2cbLT2D5IyW02PstF0uYBP6uly7Tpl2xIk5cuPOMzsjiso9jzu1WO55dDC9mXa7zyDSXZFPhRbdPAYzntHxGf9/T7WLYt7wxIrXJyZbO4HHlRKh6D2PUfKOSzVWxOrpprkVG0c4zMvOyzEyoyt6q7MGm8+ScCLnTwTlxhmycvLTXVPstg2H3swZFz5eGn5xBhMt7xeaZczMv8I1UfJPFVWFjh9G+xNkOW3/dcLv9OHrHX45SnJ//AEcP2oCZOcG6U6DKu3dHzRtF0R07XAvDTSsFbJYYxISDuJ4lNLK32nvDcIN8aqPfUl0EP4l0iPZ5r3kjWIYjb0KTDLl5b9nciVJVHkPeL4iVE5wHtliTeIYxlYW++cnf1IPdu5aIpFyuXy0RKJyhWy/Cj8y4mE/Fb8i12wxHHz2glpLap9sEEAcsddzQbB4bkdIm1qZWlWqqpcl8Ix+JTBXuSzL4vs5t19napoha6pVOUQz4A2FuZc9eSOW0t04UVOMMa3WhuuuL6U/7x0pTwOWpVl5GOBuQhBwWc+3q7rPnxjU4/sjiGEbLYNtE+Uocni4OHLWPCR9WVCvHiP8AOMm8LpoTxcLuMaI2WxnUSU3LvaTBZbDZSSmZTG8LxRmbaFz7M6uazupUHG1SoKirTnWmmkUinuDESqVfSLxueV/DWMKnklGpeUJ1xvqERwjNE0IxS5U00rokVJC6lM4BCSXBbfqnosNFYmF5vOFwmt1KJaJKnDziDtQxCJawS0/ZKOsZbO+o7yhv6ckXlA6hQLrk40holSHuF7ChQ8Le99YbDCweZuS6NZQA08FyZzbi1L86c+UQDdcR/BTWI2/9p4w8cv8A3+kZyak7zuaZv/tjOq2pRNYfLZsnPtmbbam3QrHRuH0JP5QzOHJQexaVQ0/nxgzDsRfk55+bHJdccadbNZloXe2NFXXveC8liSyB4MrdcbISOhh+6sOblX5x7KZ6xxwvqsRk4JtNDbvBxPW7/LTlB0mt7J9Y4RMARhaPdRe1X1+cZteNityfF5tyZEGOmzc1Ky1W5dZmuicV0qtuvKKvsluwY2YjLOZzZZhlUHbtPPT+cDW2f/3REDbUMkcojAZkbmQqZ20E6c7VXivlHWxC/q95u7S/RaecPl2veDzUs02224ZWD3aqvxRLhLIuTLcsX7QxC+7s668dPrGbFehNmQg4PxjTs1/2sWGFtNTMy2Mzn691lq8uHdHmsO6APW2vt2hW2umZRabqePOJ8PCZaebfYccbeAqgYFQkVOCovJYxua2sC5O/uwdIsF978H5esGy8k64EXOHyGeyxKNtNsObyG7qmbVapdy0jN3NUQqmesNqWmZl9uVuVdzetqnFB4Vh8nJlGgw3A5knstzsr2iEaxoZPZKdcty5ZwvlHO9aINlosxj5yXlncrIlMvihhcpJ+9VfHw5RyVw18N5srf3Y9Mk9hptx7rZR/L/dot3+VYuW9gZuweo/6k/zjH+Ig35E7mCmMUnsQlm/uJRzozciYstKGYy32bvGqrrTjSGTWFOMA2PVuNpcrTzQbrqLzu409aUj0dv2dYg72Zb/qSv6xa4fsFjEllusMPNuB4BdxjGa0eDWKf9R5dh7Eo5JkxMsONOb1jzPeXkhovL0pAuIbPvyjOY+I7+4TTo2qtU0UeZevKPU5rYabat+yE3TlavHnxjreycyTLrT7RC2Y1usuK4eyieSrCivYuaNzz7Z3D8UawR/IlsyTlLXDtHVtS0RbuOsXWIBh+S7h83LZE5aKGbVpH426bpp9FjR/0emWJYt1zsdnsj5VipxjZ5hqZd6DnuS+igToUXhronnWFLI/3HGS6eDNsszcrM9NaJy1KfaQu7Sdm7mi/nHouC7SzDrUjP43h1lwOS8tigsJY7XQszzT401jPyMkTR9GxAX+saGwgJOfC74kp84nmMKxLD59tqUnm3ZMHUcDf6r5jyWmixkxpEGnxfYSVxiRNxnKl3E60zbO8VH+8onL8Y/xJHn20kiOGvNsTeH5TYWgbWqi8P8AeV8edU0jRbOY3jsjiT7kvhv2Nl0nz6NWyXQl7Qr3R/JY3Lx4btynRhSXRLLES2xwi41QuAkq93slEL0A3k8Pw3DWJPEpueYm5ZlnoTqSzrrWdvElLLe65StFXgsZ+Ylhs6vl3f0j1fajCpuVnOludc26HR78nL7KUy3BTgf68Uil6Dh97HSxcdkSdVXRZtF8Vtom9Ts1/wB1jfnEco85GQmehuzItlkskKOnbutkXZqvnT5xZNq1LPNzOU+LZdjf1pzoX11g3FJZzOyBHdGiGA96nNfSBXpW2TzLhtuTcv3lr8KeHnGmdyMMQlvDZvEpkZuWbLosyStS4XXap3LuZQZMLKSe0Mk1i7DhZNG55oLQrT4fOnjziPBxnrG35ZpwpFt6/Kv3Gz4by91V8V4w/wBoGE4k/M4eTGJN4lezmWs69GuX7si5rEbvqVsuhcSOCe98rpZPtNyzKqHVVtZVVUSpzqvOKbbKbdk8H6M01a2twXGGtiqir+mnMdYsNgcfxBifY6W/1MmCN3Fxy61t8xry5cIm9r+0RYtNuy2F5nus3ukg26Apa4Q73DgnKBcle1xPZk2MBgrHvmc6FKNSDc02JzRzLrtg2tjWwU4f5rFVijvvKcdm3x3nbnDsCg3F+HgNfKLSTw0mj6TPSzTTM5RtmY3qM728Qona0g7GGWGgcw/Cy6l6xmZePg+QGqi4KcQHyjrObG5mZhwptlqUmchzNezCdH7/AEC2ir8FutPGKzGCb6ZONsYgL8qtQB4hIUeAezRF3hrySLPFpHohi6Vrjd5dgu1bovmiL+cBzjOHzMtIi06+05lJ0jNCvWKS3W07qDbx14xupzvFjP8AQ27G3BzOwKu7nZNa7vpw1h8nJOTL1rBMXaA0BGg1VS8/DxXhGm2kn2JmTwuSbwmQkXJCXyHnpYVRZveqjjmtFJE0rGdxAn3zzHLcwARjlwHROHH1ja5kC4lmH944449eSnvXcV1WvmtVgFxItcQbYGccblHcyXuoB2qNR03qcflFfMAI/wCJd7kqcopSGOXZXXtNttlb2e33aKWumvhyivnCveK4RAtN0BtT6QZeQ3Wl2xUC9FgcWB3iu/d8f+0bpJkwHZU7YUEvNjutMDcR293eu+FKefziBwbT3uXHuxtEkEVt3ahohEtu5d3Yc2zcy4/8BCnFOdfnyh3EWGzE5IYfP9JxLCZbF5fKcDo7zpgNxAqIdwa1FdU9Iq1avKg9vX6Ila1/lDyX/CpemsJlkTeC4rRql5Fy114aw7hIxuWfNnObacyx4nbp9fSJ5VjMg1wd91hgrZU3isG8rdOyqV7WnOlYv9mcN95zkjheHyV08+7k9u7NMioO7wGn5xlUqWKVPBWyMhc9dl5dY+ktk9mC2S9joTr7H27aYh6m+wnWE+4a/dU7nS/CFOcC+0PYDC5b2kYDg0hIdEw9vBmJjFDH4WyLOd/it+axucDxPANp8Sxjb7aOZ6LgOB2y2HSd25uh2fxII2pROJFRY86o/NXQ7KacuYueO+2HHJQ5/Z/ZDEs+TwPBJYVmMlLnXXj3ict4Xlyr2btYwG2u0LTGzZ7P4ThDGGys0Ym6armTL9i6XH8CLyREQiSusD7XY3iRbSTe1LrjfSHp032eBdYq1TdXkOnHypGfYcWcZxDEsVdrMNtB0doztuuXSg01QUrzSO7h6fKSDkrPzGnEqniNrKlN7gm96/D5QQ9PBKsvNtjfOODY46W9b8Vvrw9KwM0zNz2KBLMkt/d3uwPFVryRE19I5PNS0vOn0R5w5Xg084FCJE4kictfyjthctDkytqPOSb6GE0UyjjxXZjKAvVeFV8+NEhjzzdgt9nl9f5enGLTAfs0zLTYuWDKvNPmdtyiiGi9ldF4cO8sN2oxcccxWZxJ9hi9yYeeXKaFpKuOEe8qceOiJwTSHs1tyG1i+wBItTM2y5JSjSE3ehEe6HCtKkugprWnjBGMYTKSBMtJi8jOPqFXBlTXLa/DeqUIvG2qecCA09PTkvLZwjmEgp3Ww8/RONYixZbZpWEezmWKtsnbbcCKtFp51r84c3yBbY3LbDkxPaicw3BujHOP0CRk8hoc3UtwdKX6lz184Bx7BZ/AMYmsLxiXelpmXImzGneTlEwtz+zr+HYtKYh0eeE1cBGjUH5VwC0uTRRXgqLzi32k2xd2rlsNlsfw+UzpPNzcRlgtm5q9bqvEq0cVF1StF5VhZTP2KwiI13AcMccwmQaxOQxRHkO3p0pvAOh7rZV0crS6iVpGiHEmpw59roz83hpnZKGVasmWre9wTSqW80jH4lhU1KSgTLR9Iw9w9x9vsXeBJ3SpyXWDJDEJ6awVuQaJcvDhOY3N3RSHVfiUV1Tw1iZRW6iodk6fAxmcyL2nxe653rhN3dcFOCUpVCRe9WPUvZbPzLXvXAJR/wCxzkuUw0DwauNW9bu/3iBvoqc2qpGOnsK/pfhTmN4JLf1hJtX4jLNc0HtPAn5knhr4wPs1jc9LzUtiLTnXYVluNGfdbQ6W+Y72v4SKObiF5im/Dty2PXtoJ88F2twTa+W6rFOklKYxL/8A+azS+6ncfbK7wW4owO3my7GB7c4pLSwuN4adJvDvxS7u+39EKn8MbXZLC2dsMRWWfl/d8xNAEgh/3M+zXoql/wCYHVKvpGr2k2fHHPZ3s/jEvLOdLwP7LPg7/wDbkZW//wBNy4F8KpHmzW5Wh6HLz1PDsWl3CZm+6TOXmjoFrzta2ingg0jR+z3EhwXYfEsHcwl92Y2lmJdrO7N0k051jQc7jc08N2KTFhfCcF8pZs3kMn3RPgteAF8v1j1LZduRxzbNuWl9nuje7cDy2egn9w4Dd7jtrpb3aLSvnFPWxT7hTpZPlOlim26d2XlsbSe2Zw33fhcg8LDUvm3A9iBdow55bQ+Pep4x5NtgzI+9czDm1tp1m8q3Hd586cfODNruk+9ejNl9nlag16rqpeqrB2IYGUmfdy8pp0yuuy7wutX8XlGiTyrNcl8qt1tpBGLM9s3IS0yxLddbm5ob4jVKby8BUbkSnJSipeBNoDkJbD8PlJV5iXGXLKurMncSq6ar3luotNEQYFnsRxGcTobsw/0MDIwZv3UuKq/OvONnJ4fJbObDe+Olj70nfuWbN5lnkvq4SU/cEvGNb8uP90mf8xrfTBR7QTMhJyzkhhfSQlzALL6Dm+JknhddRP3VWMe89aGXb1l3ajRhMz/vQ5abYlp6aOY6SvYW9xR7xcLKLqOmsZZw7nro6aCYnLXfLUa5bBUtIzkyj6y0s86jLWe5QK2gneXy14wyRaKYNZdu5XD7A+JRNLYjkuyhdHZpL9vdXr0urQ9dU5ctI6Dm+4KT7hbrzhEPrwhritkA0uu1u008qRK4fSDmXspgLt+0d23e4ClfPhrpAsOCZmQyUk1mGzcR1sBbpmXd1FVEr58YgNLFt4kiqninyjioqIm92vP9YSCOTd3qwDOIZWqPJYMMZdaPNvi2QAJZdpdquqJx9a8ICpWvlHKwATvvZtd3vkSn3lr4rEYjcJLcKU/OGQ5FoKp4wAFGgSrzZNuMzG4hdlbaqmorXwgYUWFXdti62Sx6Z2dxX3hKMSj72S6xbNMi6FHAUFW1dKohVReSwp0g0WImdSqbH9PCsd/eibKJ/Ly98j7qcYicX4iu/PhEGgU0xM5ZOXNmDQjpeK6H4J+vhCZR1wyIctuwL/Ds+Hn5RzCibZnGXXRay797NBTH5omq04wxwe1b/wB4mQCJfrN5xvqbkzbKIXyVf+0ds+Het7RWrz/LSGCDY/i/KJW7ozmSggW35q5hjrLKn2t1sU8FXhWOMyuaH+/pErbcz0bMz+pePeC/mPMh+eixe4bIPnhX9kHt5md3iEtEHjwRRXlxrrGTNY0hblSzJ2/ir+UHsyAlbul2d67x8vKLORkLv2W9dFy5LSOHhdOuW/h4l9IwaoarTAcNwx10BtacLd393RNY02zuy0tMzP8AWEz0KXtXrSC5LkTSuqaKuleUUjm1fQ2XG8Layr0sIj1VU48OHGKCex6Zmfv3yc/eKMuW7fBpDovyb8R2fw/+0zwul8DI3/nwjrm1uDSv9kwvN/E87/7UjzFyfuDrSt/dhjc6RHa0P+KH/Dx5D+InwetM+0fEG5PIlJSSlBvvualhv/xLVaQBNbeY2/8AeYpMj+67b+keaOYi4X7SIxmRG4d4ihxwyegniX9m9c2snnO1iD5fvOl/nDP6Tzf/ANy4X8axielF8IxKzMl8VsHJX0HOb2bxnaSb/wDuX/8AEsWuH7a4zKH1GLzbf7swSfzjzUZooJbm3fijOaK+jSKzHtuE+1XayWXdxyYIfB1UcT80jaYJ7ap9bRxHDsNnU51ayy+qR82yc4XxRbSc/bGDUINFe+8H1fh3tD2LxVMufw2YkSXm2qOD/nGglMI2bxtqzCsVlZmtOrraf0WPkmTxT4StjT4TtC+xaQudn8UYNTiN4ubL/taY/c+hMW2DNS0ZRLeH+kZqY2YmZV5spYXLt5TENC/xc0pygHZD2o4tKWNnMZ7PwOb366x6dge2Gz2N25w9CmPHiP8ApGU0kfSJt9//ACVza1PWYvHx/wCDzcsHuzX8LHozzoo2UsXB5F7Xlx5cIp8NlmZadff6WWGz4PC30fJW0h5lXuqK8o9wm9nQS6YkrTBxFus1uReMZfEtmG35bLebsIfun7blFOSF8SfmkZVKL0+6DWnxSVNpKyXnZDaBq1xvIxNsLHmntW50fNfHwLikZHHNmnpGb6S0y81L61bPttKvjyL9F56xop/B5tOjSjjbbU03cjTw9mYFeCKUWTE6M26zguJzBAre7nGG9Z3hJefrGBqvT27HkbeGyTcy70th+3JLcA7d9eyXjZFKUj1wi1a1Y6K5vFW6L3f1j1jarZQZabOcYuLVf3k8C8FReP5RnJiRkbGy6N1d4rMEWlCtXcGmtq8fWGtWxraGPMsUbflTdHNzW9beV3gtPH9IOw+bm5Rn7JNsN5LqTTUwIb+ZYmiLx08OFYtcSkRscLqyuFUtIbuP6KnjEUjhA2TLBSznTNEaADREEq713jpyTnG2cTBGGpVYGrEzMzbTjDnTJrQDDS01OpKo+eunjGk27Ze2eewnZedFl+XknSmQdAN640SrZeNFThE2z+yeI++mpcR+0q4rbrCdsF+E/XyjY43Lhj+1cjs1i0vlTbe5mOpvOFTQap+vOE1Tr0JhenWY9mdOWTHJZvaraGSJ+RduZsZUWW81NLRt7KJx4axgtoJdzD5Z2UatdbmLTPKG80tVbaaVFfTike3baYJgWB4e7INJmGjY/cvbgvc6jzSnzjzLbB7LZlujPuFcHxrewg1TLry0105LGlJur7EzrTuea4kXUuSz+8yYIYOgCKWo7vHkvNIrZFmUYme6426zYRugpZRLxMaeC8I1k8Ep7hat6M45MzHWtWEjrFibtC7Np3cuYxnZwGm5lzIzGmy+Pjb50jtVzjdB0jg+G4hhWNzczizMi9JS4uyzJhXpaqVCAfNE1jJFLdTdukJXW28dPFOUXuLdXLMZHfaS/j2lrovolOEAizmg22L+ZXWzs2mvFNdOXHhGysYshTuA62DVzTnR3uyVO1au9avlEBffZmZa53P98OEW+IMyjjzfQhfbbBkc3NO/rO+SUTQVX/vAEwAj+6X6xrEmMwVZBufiiNtvtFulZvkJFS7XhBDyRCUbLJjJA8WYDLTbDbbjZl1oVvOq6VWvLlEDje/3vx/z/wC8FONWH/tYdPOsOZGQwLVjKA6o6Zha1VfGukbwxBDi030wxcJiWaIGW2upaRtFsGiKqJzXmvNdYGlnX5N7Ml7bjA2+zdUSGi6L5LEg5d+8Vv8ACunn5+kRvJGkSQMdcA3icZDIGu6zqfrqsStpuQxmWccttbvv3Bt4qvpB8jLXd3upCeQJJM3Hcth8icy6I1v1QQ+FE9dY9m9g+y02b+IbWNyjzjeFALcrYCl9qc0Dh8A1Nf4Y8uw/DivbK3/DH2p7DJuU9n/sxnJ2fNzo0myBzYfHNuFvCnpuB/CscVecui9rnTSjGM7XsUftUxuWwjYd61M3FZqRlWJ03f2aIPVMf+pxU+seN7fT2G4P7PdncEbucxJ5lcQnwruMNkXVN0+Il31X93yj0rarBZnavbV+ZxTH8F9zoZTz0wzMdTvURa891LQr9NVjzD/iHxTZxzbp93YkEnWLA6W+/vibo6UbbXgAoIpGVKMek1a0xczi4o/g+yze0kjsvJBMI+Nj2ImL/VFoJAwW9vLdVwv4fGPMcYxCZMG7rEM3Okbg08h+SImicosdrcQLEHwcmJg1fM75lw+8qabv4U4IkP2T2fkcbScxbG8VawvCpUDEXT1J15AUm2RFEVd62laUSPTpxaMmOF9elDNycxOo88rBlmTAEDn4hLjWD2cFxSYebblpRx279rQiCvFaLSi08qxIU6sqyOUA5zXZ4UAf3fir3lrE2HbU46w8y4xiD7iyl7kujx5gNXDadAKopci6x0LLfY5WxtbeSxTDZ6Xw7oky1M9CB3PczxNsCOlLitRV04JrA0thUvi2dLSkky0TbZO9Il85xApwQ0VF0JdEXTVUgbFZXHcB6M3OuOSizcu3Mts5/Fs+zcPd9CppEkntNNyjbkhKTz2TN2dLvMhbdtWoiSd4UXxjR+XjdSF5mVm2KgX8mXckssM5zdIz/ZpXsj8PnDnMKcawt2efm5Vpxt4WuiG515VGt6DTs+cNxnCsRwvFHpDEJJyWmm1S9pU7NyXD8lRUX0iF7LCTVpxtUmQd5/DThx5L+sQX9w7GsRnpqWYlpxtwWwS9jO1MRXwJdVHyirS4Osy4448RncREelN/WDZGYIQszFaZO5tzS65O0iKnrDt6IvfcJwTaDEsHWa6GbfRZ1vLmZZwENp4a1oQr4LwXinJYMlXsMfngm5JlZUzLLekUJVQwLQrDXlTkvDxihILuPVXf4YhUSBYTLr6kqH09m/wz3psNtAmHpMT8liTMwvTpbdHdHVswLvVFfT1RYm2owpH0xLHMCVnLYOyebZ0Cx7sugnJsl3VTulpA+A4oOOuYW/iDebPYM31rhs5wvSgdm8OJWcF8Q/djazmMykpgM63s3hso/hc/MN/srzlHC7ctrvEyfdu+Ee9HM/T9zqpWb7eCL2b4iL+zE3mE4M000ErO/iYu6l795ty1K/CUfS3sbkMJm9iXWBe6x1k2sSZPVaHuOmnl92fkqFHywy9/R/ad8sPlHpG9lyVnsOmw+6vG1xvXVU5pzT5R7V7FccmcNxTD5/LzcPepLT/+GhF8x3v8XhHh8Zvn4PX4frp4eYMnKbLvYTtfM4Bi0o1N5c2ITIXWrlNFmGV3KqDT0JIknMexCRZxCZfyJZyamfeDOTbVgHAJSEST4kJsVT8Meye3PBpfOXaGVTq59OjTa0tK9v8AkSIi+aR5R7Udintl8Dalk6+98ACYAktdAgzaoPHitK+UYZdRvE3TKDzFrC2nXmMZalveTMlbMYpKPTANXCh6oOtxCSaKqVVFi89p2K4JiE+zheBZEpIssrNn0irYZ5jmE3XiVqWtjFNMSmVMuTctm2sgpheCXcKcOHFYDbdlOhtMYv02ZbDpGUIOoJBUUsLVOzdxTmnCO2IzaPg5ssFmNrmYlWZnF8V6tjMmHyU7Gg8qronCifSkGbWY+7jD3X5be4G4yFo7oIDaW+QD9SWN37M8NkfdWM4liWMSEk3h/wBkZbCXvmnukfeODRUU7AQ+PpHms0eGuYvNzMyMz0dzNNro9o0PuVrpbwqnHwjsSYd/scjxhT33Kd5Vak1LMIczdIfjp/JP1itJYtsZl8lzJcRxhwGhIgdBUW5df0VOMVNkejT2POq7kwr1NG21v1vXjp/KGMgJvCJuWD8XGkSgbkulzT1hOAqFYS6JwUV9YiBVBbhKKIOywsLMCMw4QNd4gG5fpEk6DN5Gw8Tjeib9BL6VgeCcOkynZ5uVbdYazF7bzotgnqS6JD+RfAKMTi8QN5aV0O7ju6eUSmwyQNdHeU3TaVXUXdtJFXdTx0RI4zh869K9Lbk5h1i/LzRbJRvpW2vCtNaeEK8DtMAq17S84c6hidDG0vpHW3CCqCVt6Wl6Q6zqr72+1bb3vWAB0oAOGTZA4bhpa1b8arpWH4lJzMjiLspMsuMvNHaQGFpIvmkI8ww6UAttICoG4tNacacfnCcWXKWE+sF9O1Xeu868vSEVYFKCSXW4W7B0SzjyiJ4e8IkIL2awSyx9gemNzqzAVq4iFvXcB4rw48vnBI1jU6mYZk8XZ0Xw4wdj0thDDeHnheJOzjj0oLk4Jy+XkPKq3NjrvIiU3oqMwrLe7WsdFYmxpkEE447/AAonAacIIbC6X+67BdvnrwSkQvP5+V1TQ5YI3uBbdTmXivisHyJsdDdb6Jc8ZioPXl1YpxG3gtfHilIzcogbEf4u7BrMsQg2Vu64NQ89afrD5MG+rzRzGwNDsutr8SfNIvpHBycZGZa3mSOz0Xjb9I5Xc2RLgMnIOXt7vb0HzjSybeG4cy65iTrje5Rqyird+v0iqxLEpbDuoY697/pH/WMvPYi6+eY65cUTjLlZQhpp7aX9lh7WQPx9/wD0ikennXTIriLxiozLu1DCf+GNVpGU1Jks+klELj1n731gDMuhCcXyycgrPIY6UwR23O/6QIMdh4BcKviZsxgATiZs4iUHcLE4mbOAxWJO1GUwXAe27BbLg97/AKYqwSJRK2M5NIkuW3Rgpl+2KZkygpt2M5g0iS+lZmLOVnrbd6Mwy7B8uf8AFGLKbKxt8NxFwT//ALo12A4+TRj1lv70eWSr5DbF1hs8Qxz1EOqm59F7GbfTcoQIj278PEV+UetYPjmGY4za5ay+f5x8jYLieW8PWR6NsvtG6BjvdmMlrPS03j0FXh0ra7T7PdJvAgBk2y6xnU0Qtd7+UY3HNn3Bez2+tyaH5on+9I0Gye1gPtCzMlen5pGmmZKXnGkeZoY808U8ItuFp8St6W/o5F4mtwrWqbGCwyaemaSb7AtN1pr592vgv6xXbS7My0u71ff7P4STkv8AvWNhN4U5vCOSFyZdTT6fPziLDWekXymIu2FSzf8A2ievinjHDPDt2Nudf8THeu3mDybGME6dON9GbHrR3AAfu/iEqcaLz8Iy3uomjd3vuarb8WtNP1j2SbwzoRPvScxTI6wORrrRU9U/OMo9IdFunW7bkPvjdqteS6Ekc0dO56NN4eNDHYBiuJ4JjQzsqljrvV3/AIVVK0rz84tdupxudx9pzC3ppJoXiPpLhWkSL2beaUTnzgMpVzpNv3ba6F8/0gzDBFrFwennc3ItRpDDMQqcB9Ei8h4RfLyV01g+IOSwPuW9dU2bq1IU0L8/HjGfxhn3ZmulnudSdth2qLijSuqcq6pH0FtC7s80zKvtzEk3ktiQX8B526ePhHl+3EgM9JuTrbDIZzu4gdrhUtPh84v+U1r3MUfnLe1jx7ELmMpghzWUHcaMrESv5p4xSzzQkzd93uju89e96Rr8alOjMzbDFsy26KN3mGqaotRr2S0p6RSPS2WG9kP534uxTThxSkdtNjF1kZt5iez2PM4b7pwD3VOSzNJt3NJ3pmg0P4RpQv8AFGRbk2slweyWq3kWlE5RrRlrZB9i4hqQudmtVRFS35xXvG10DrWGHLGujiKFYaEtVFwqdumqV4cEjfmGE0zMTVstJ22uC8dyO7+6ra03bf8APRdIqZxPhG1tS3buK+sXk8G5baPjdFfMMtNZjb7bmZ3bSTRfxeOkdUMcrKUzjdx+ukQEPaHvcIsJhB//ALoFmFdIG23bssK2D4V1WNVkxmACG2EfZ/3WCm1yjFy0XKa2mlUXyXyh9lkndnt2m7Q2b9/TW63hTlXxjaJMrFf0V8geebbI22aZpfDVaJX56Rwe75QSy7lPOk20JC6Bt9aN+6X805LyWCpjDykcSclHH2LmTsJ1l3NCqcxIe0npFywsQCXYK8e0P7vHSPQ/Y5sl/SrbvCsEusZeeHOP4W01Jf8ACKxmZXBp2Zln51iWcdZlARyYdEdGhUkRFJfVUT1j27/h1w7KlpvELXGnJr7P0n+4lwISmHPH4ATzJUjCtVsprRpZMeiYr7K3XfbDjuMy8qzh+CYba8yTTO7flDYIBwIk4+tIExzCsUL2aN4P0PqzeGemymXrW2BTs3fEVu8vhWvGPWsd9qeBSKZ8yP2awiYbLtPmmnDyWtVXhSPmD2pe1TENqtpxaalG3MFYMLMMS7KmjX+8QdSQl4JzjCnTZ6kOs6QazUlUlXjUocY2txCRn8/D3GPc8g6Du+1/b5nVGjMf7sd4wDkg3LqseT41OZ851b+e5d978RLz+usbr2jOYfJ24fn9LbBonidkw6op0+0GvZFtNy3ilseYzIlUnI9BZzm5yPGEYhuMvSD0wLjjT2ZLti0TI8Lh0U1LwUosmZTEJjDZGSVXJuUq50eVliTRylUzAXXX4vDhFVO4XjWFSIMYgLsjLzbQTKA9u5w90reK+VYTmIsdGYypRxi1kWyJXlPNNOJJXs18E0SN4Ta0mEvZuqNypmpeZbeJt6WdbeXVbwUfyWLfZvF5bB2ZrMwlmanHLEl5gyuSWotVIW+yR8KKVUHwjm1u0uJ7SYqc7i0/Nv7gtNA68rqg0PZCq+ECisoCOu4fOZWaht5LwVIQp8VKa8OUaz1LaTFel7qTYviqYscy9MuuI+5Rxx56rzsw55l3U8k00iplgzXbSVbqbu8ia+aryiCHWlYhW6eMPGxMtluWshNTizLStYmbbu6g1Mk4aJGi9o+N4xPS2HyGPy8qmJSGa25NCAk9MXHdc64ireqdlPBIy+Gssdc9MuutGAVZAAuzFr8XdRPHWDNpZbD5ZJRZDEEmleZzCZFC+yqq9giVKEVNVt01jPCM4k1ipOEwVIobKtPUFa7w8+C80gybnSnWm81BMpdoG26IgWgNdNO1x4rrFcQkBqPOJQdbylbJlFLuGi0VP841Mfgt8KmHMMN029VmJfqSUBLdJdeOlaCqV5axXExctre7f/hXwid6fmpnDWGbdyVJVvs7N3n4KqVp418YOYelpzDd52x5s/uhZquveu8K8o17oI2kI2Wc2aFqbLEJzFcNxDLUZY5cBcZquhC4naoo14QQxL4lJgT+HzN3R3QvyT8Fq07+6q8F5FAu1+CPyctKY/L4XOyWE4lekmUy7mK4rdEcW6iV3l8IO9nrr0szir7kkxMthJGX2h5QtAiQFMB75IpCqJ845Z06rnVGtlsepYjOTO1uJf0mx3CZnGZifZ6yYlGsh7qwQc0B7J04ElI9b/4c5PCpbB5jEXcZlpmSmlyABkCM2zHeEnR/Y2r46LdHjexO0sh/RXF8NxBidzJeXCblphk96XeA0HOHwG0kQ6eSxqPYttIRbX+9pfGJTCJo+r6W8FrU2f8AczQppvcjRPzjwuJotqe3Sqray7ntLW1X/wARimcGmOj4cyyBNzNiX0po25TkiFoXghRhNvdn5l7ZPD5ibzOmYa8eETvetUN5lfmC0+UNxBH9m/al/SXZ+Qdl5Gb3zYcG5m8tHGxNN02y1p/pG6knHJ2UxJvovTsIxC2Xev8AvJYx1C74ib8e8NI892x8nWizGixp6/ueGT2EMSuzc27nv9IN3KysrcIbKiV3G5C5RlJiTw1icaLFpZzJ6IljTLqXOEorbvd3e115aR9Te0D2bq3stIPSTVblFyZ/fstT5LHzvtVI+75mZuYuEWXQ7FbajS75LzjWhUaGxeLSTUVHTNNYMI8fRsBym8tuYF5zf7xI4IouvgiCun4oyTrJHMjcOY2gq4Y32bo6qleWkbPaLEX29m5PC/2Ocs3bYmhqFna493hGZxtg0ZdF7Lzmgbas3eHy4+setw/9zzK39ipexF10JnObF/pFvWvdY4NOFpLqi009IrpxHAmfvb+CoaFd+flBmVAzhNnlN2iOq9Z6+PpHopoeY2oK52ri1VeMPG03b1EbU7nCvlB+0eMTOMzjT023KNmxLtyqdGYBoVFsbRWgpRVpxLisCk+0si2x0dsHWyJc3W4600X0jXwTpcTbjP3hWirVLAQPvN7va+ET4tPv41jUzPvssA/NuKagyCNgKr8KcESAiUTFSXRdNESE2jROrcRAGvK6nhBYV/BHaXhBi4nPrKlKJOPBLkeYTKGogp20utTStNKwwZsxkejCDSdZffZv8KUr4eUC1g+4bbCGLqewx7CJOQn5pZCaDEpY3WQGYFwm0uUamIrUCqlUQvWKj9l2/lCrdBI1DMMcy3FcH7ylA7NKrprXlArgEBkPwxKOQEtq250i/n2bP1rWGOONrda3+7r2YRfgsJ7GsSnMHw7B5uZvkcNzOiNWj1WYVx6olVquuqwNNSZMS0u+4TfX3Eg3opIifEPEa8q8YE4Q4QIoWwbiH4e7Ezdp2d2n+6xxsB3hKDJVkeqHPbC4966vV/iXy9PCJZiog4yz8UW2Gt3dGbmXH+ioa7oByVd5R5VgVtsb93e/F/vxi6w2X3LnStEfpHK7GyKSsyDedu/d67x6aefLhA2IY3YyUpJOWs98/i/0gHHMWz+oY3Zf/wBUUrkxCSlluNqlu0mmH4HcOIiciMljqVLGNyW6FEVY6KxVguSXQ5tYTKNmXWOWaL3LteSRGKwWGTjHLoZdHRiLFD7oeMNGHWwgJxicd2B21tiYVjBioJhOJm1u3YHiQVjKYLgKFYKb7EBMnBLJxlJpAY2sFsmW7AY7vzids+zGcmsFqy98UWUrM2fiG75xRMmRQfLnGTQbLJpsNnGvxRqsJnrDHe/6owMi7+K3d7sXeFvfEVpaW+HnrHNUU6abHruzu0DrTw3FbHrmx21BJbvXNlHzdhs92RKN5sviToGNpXfEMct2pNkuhu9Naq4zB9KJ0bE5e5tYq8Tw2+0g3XB5rz8Iy2yGP0t6yPQpd5idZu+qR6qSnGradG/ueFVR+EbTYpMjp0pkuCIzIf8AVGYxfChylbzrqXILdv3ddVFfnrG6mJcUMHRG1wOfingsCYrJsOrneKJfTj5LHHxHB3SfcGvDcXg0ejxzEpN0XhIreq07GmnlziuxLBzdBhyUfe3Eq9cnA/KnLwrHo+M4ffvZdja91OFyRVysr0c5iXFBdactReIotCqi0jx5iUPfStDRcxLz0zjDzck/JMNvGaGmUNqaJSn8/WsEbTYZiDUm3Kbwtywmhup4Lx+X+cb3E5KUwvF2JgRblxnery8vsBz1g32jSsi5hDUxnE23o0Sh3x/yjRqTdU32M14tckW2jHgsyxJAbDEoT2IMmze60aZWW6ui09N3XnFCzskxMrn+9pZtzNNHW+yrQiF16qulC4JTnGux6S93Tj7cs/m8rwHiiwO4PSpSWzZKW6LJGWceUQZ5ElUbNxOemnhG9JzR12MxtFK4fiX2vDyFqYedPNlmWctlltAShDVarwJVTlGJnJP7G7Ni1cyLpN3FTmlR86018I1u0Eow1MuMNk3My4nuO91z8SV146VjPSds9jDEhOzrOHyLii27MmFwsglaEVNSRFXjHXTOWoZF5vLyyfuFs/qqeKfOK+cDf/L1jR4hINjvZ4/eqHZXspwOvgvhx5xTvNFZaPduPeKiLTjSvFfzWOtZON4sUk024Njlu7qn0/nrAkwDQst/e5lxX7u7Tu0XjXjFlNBv/i/OJsYwzoPRnOky08y6028RSzqkLd2uUWm6aJxTlG6mDQZ9whybbR7Vb+96en845LzD8pnZVvXsm0dwIW4XHjwXTjxSCsUGWznClBymSNbAI1NUHlvKmvhAVCP5D+kbLJlI8nidZaYJpgMmu+AIJFVa7y97XmvpDmQzDiJsYOkQddnGpZgesfMUAA+JdB09VhkH0Z7FMElpr2O45gvQ25rE9oJd85az75MgatDT8ZidID2GwmQmdrcPw/p/QcJw3KlnXr/vC1N/y1K9VXgiDWKxmcm5vEsLwjZaebw+alsPel84ncoRtBa7/mKFr+KMntJjbeDYU1gWATzc69Ng10h5ns26Ll6692peQinjAlDI052Ox6r7WMe2KcxeTw/Z/CUfZnibA5tx3tAO62I1+7bUtSXiSCUeC4hiUy3tOWISMzMudFM35aYvRsnHR/bJyS4uCckokarY/aPB8Sw3EMHm8Iw7pnRnnPe08bijJARUutHTROH4ijD4pijHR5uUFiWnXHLGgnderab5NJyu8eNIihMrdbF1sZs19AHaTabF8SwfDcPxLI6LJk+61lNohuuPHVwzLiZ10qvKI5Obw6eky97Ygko4MqLUt9jzSO1dKIlLe9vrVVjVbCyuyraz7u2uEz7sjkWNvSijcxML2VIV0NKcR5cY89xg8zEpyZw7rmAdsB+2nHQaJy4R1Usamno56uVOMvZrtvh2dw5cLw/AnOnTTbV03i8zeJzTh6/dH92jabqc+JRipufLo5yzbTFCLeeXrHFp+LknoiRcT2IzLuC4RhOMdZKSnSHZc2RHM61daqvaS8efKsZ1lyXGYumWVdbotQArNaaa05LG9JfzOas2umhxxubfJv7M5coJZY3S4U56Jr6wXgs0zJjNFlvZxy6gBI6iDr2kJFTeFU5aQdsm3N4lNNyTcxOE5SyXal1udU1RbRFPhr2vBNYix/GJnEZKRw+YaksnDcwAeYaEXHrjqqmXE/BK8EjSfRmsaZFDFhhIJMXyWWRuzJADVjKGd13AdUpXy4wKyYi8NLePE9U+kOmwWUnjbF8Xcs911otFpwVFip1IjTUNnOlsOzeDC0fVvlfc11q2aUKldEpWnBFiFXsN90ZPRHun5lekZu4gfDZTj51gMXHEPMEyQtda6+cTPPS5ywJ0fLmEXeNF3VGmm74+cFh3HYkqnOG4Mokq271jbQ3KIivhXWkQMt5p2oQjoq760g92bcfwkGhO3IohB8Q8l+Sr+cButWrlmKtOj2kXgsECYYbzplcrkEyDnXErnz+H504RG90ToDCBmdKvPN+G3S2nnx/KOS7bxXZbojQMxesQeH6r5RQj1XbaUn5v2bYZiLmLYnPYbLYg/LyMq46hsSAEAlZVNbyXgnCg6RiMPxH3ajj2QxMvGhtFnb4ZZBaunii6ovKO4FjL0rhUzhL0yrMpNbpuNrd/CYd8a6/EK6ovFFttjXsClnsVkcUw1ibexDDnZSQfde6uUmCpa8NEW/wpS5Lo5scd9TpyynJQeVff9z/2sRmLctpneFzL5qPIhWpIqLr8o10qwyGzEptRhrGVLybzUviLV9ct9U0c/dcQVp4EJJHnMvKTfTClh+0uAdnUlmXU+GnGPV8ExvBcO2DLC9pdm8osWMOjTjgKH3Z1Khcrt4N7slQvGOatH5nRR6vg9f8AYf7WtnylvdO0EpNNyQOk7Iurotq1oKpwJELhTsrHrWyr+z83hsxj+DzCSZvLkzEgZJkTDiJciD8JKmqecfHm1mEjs5iUt7rxSZndm5vrMLm5jtMXdto04CQl2qce2kXuw+0k3Js4lLTL/VvS5B2/u3hK5s0+aLrzjzK3DL3JrB6FOpn0vMxP+eD7elZ2R2g9n6upMdHbJuxTPTKJOFfyj5E9phYhh05j8p1jTjMvlvX7u6rgpp8SV/zj0Vz2lz2zmz2yPTej4rgeNMu9Mc4FkqVpNfvtkpb3OB/bxs30zYGRxJqdHEXsJtlymw4vyD+9LuF+6qWwqiZ4vO8RYVF+VLJG0yfOe0nSZn3fLO5Df2ftWU4mq7xevPwir6U7iEhh+zr7skxKszZH0h1kUyr6ISkaJeQJStNaco1+MYdmMyPVFuSxh207lVL6RlpqXlmMKa6wXXimzvlwaITQLE3szs0XwTVI6KDRYiusxMyZd3EEw2flncOtGalHycSZ7V5IW4tqpSiU+fOKOfmHZqZdffK951wnDLxUlqq/WLyXk5aZnGxmZvojZ9t4hqgaLqvzigJL49ekeVUuNERGuZ4aU8YOZlJac+5d6MgM1cOZPdJzwFUTSvKv1gaYJpZZi1oRc3rzuVVLXTTglPKB9bfKNTHYc4P4eEIBvryFIdLWK91iKo696nKIlSGL5HW8BQSvWOWkKXfKCMlzJaeF4S47qHvDTyiWcI5temvPq9MvGROjbReW95114eEK48SJmWdmMzozDjotjedo1oKc1py84H7MG4bik/hizPu+beleky5y0xlnbmNFS4F8lpwgKAYRLuMJMNE+Lrrf7Qa0WnkvKIytvPL7PK7j/wB4QOEAG2ltD46f7pHUacRnP/Z323efGADgrZ84KlXSlX7xFtXG69tEMfpwgUe3/taw620/SJk0Uv5iXwto225PFyflzlAfOsuo9fbvNKnkWl/BU1gNtps7+tt03N2tV/l6wNLhmRYSLJX+kc7zY23DsPlidOBcaxK77IwfUh2i+Jf8onx7EMhnojZdYerpfyjMuHCpU76g7Y6DnHIhujkcjrhTmljt0KOQoBXHDEjZUiKHQFRI6EMNh0Islb/3dwia/wD/AKkCwXJyz8280xLN5jzpUAR5rENBoIUjowdiUnJyYNixiHS5q4s7KDqhpwtPv89aInhWBIykDoxM3Esiw27mOuuWssjeeu85rRBHzXx5JrBs1jEy/LdEay5STtEOjS4WgVq1FT5mVe8usRIwIYkFIjHTtfnEoxhJpA+2Jm4YNtn4okb7fwxnJcBjZ29krt2CGTEvwwGO7baXa+UTt70ZzBrElgyHwwW3dADI3Hu7u7+kWTdwHaVrn7vnGTGy6hkqsWkmtsVbNpRYS4Oxixspo8Pf7N3Z+GNVg85vjvW/yjFSJRoMLO2OWpB2U5PUMBxJ1oxuLe/VI9W2Sxm4B3v9Y8JwOb7IlvD+kegbNzOQbdpXCsYI802ygK1KKiTEntzZNzLSEMQE1v8A/Tr4RVbP4huCJc40FBKPpqTLxVOG8ny1VJoPKmcxmS3PSKcZRupDbvqY615JypG0fYF0CEopwk+u3t3VU9I8fi+CmKmkaSd/D8X02krdq5Fqbw5hx4hzWqmJqvgnCkYTEZrNbYlJ3pAMJ2w71V+Gsen4l0X3ceYNScCiVT6x57iki4+ZOPCSt/dtHXhTgnokedxyQr38yel/ptS62bx/mhn/AHO/I4lLPsPjwvB0qKiIqLx/yinxQJkcKApSWym3Jkrd/i6gp46VVNUryrG4lJJ3D2QnCyphtwCHJPepy18PKMzjSE4841dbKmKhvhX6jyWvPwjOnNtzvmctjznEj6diTnSZJub60jMGty6ib1CTgnpGYxDDW5XDesacbcmLTaMgVBcb1RbS/eT5+VI2200jLSs4WU6TrOnYGxa2+C+C6eiRkp5Lw3ust07S6eaR2o1jBluZbEmRvu3nOG8ei8OHy4ekVU5LzJs3CPVtdhPX4fTnF5iTOUGaW9vdnw8/DWKicnG84SYlBatZy9wy3l4Ka1Xivhw8o6Uk5ngFmhKWwG33g2TczMXuyQdu4B3XC04bxIlF8dIoZhwm5Zxrun/Lh/3i4eVjq8snHN1L7xtoXMU8U84CxCYvkG5bqBFHjcCgb+uioRce6lE4cVjpU5XKKYatPL7yadqqfXhA28JxZziC72WhaH4R/wBdYgmAd3bmO4iXCH+9Y2iTGwPZGu9kOGuTm2BTLUs/MuScs480yy1ebjvZbER8biGM10Ym8wXN0g/32uEbjYObmcF2Yxl9jqCneqCYHdLqxuQQL94kX+GNF10gz21ktMLnp6WwfaadlJFtxuwZMzLtS26u8KcapvV/eSsZXD8Kaw82MSxdhxyXBopt2U3mydYEkTtcRFxd30uix9k7M9Oe0jDMLm8Y90Ye9n9MmXTQRQCC53taXWCnpDfaFtJIT+I4yGzmY7gM1MA03NzhZs3NCzzIl1EVJa2oid2N2qOjY+CEVWTLW5iJ3G8QlZDFSYHoTONukDoMt2tkAndlD4CKqOnkkQ4W030H3piDrCSsnZ9nvsdmalXd568z5RFOg+4YzZNdTKrXrR6u7igr5kvL+UQ7atYSxOB7rm3pxH2gfJ14Msm1Id5uxNEoVaeVI0VYb8zOXldfReT+0stNyM25KSPROk/ZZGXzicCUaLt0Uu0apaN668Yz2EzOEijkliTLjai6ptTMtvKJcKEK6EPpRYj6E77raJ91tpu8rGv2xV4rb8OiarSDMJeVqSNGJJsElquvPAPX00G0jXspXTRI1SlZZsZPWmWjI9Ee9l2J4p7PC29LGZQcOzMm94DF5x7k2DSJXWun1jyXFJH3c8TEyxMtzA8QdDLp8l1i2TFZ9yUmzTEjlWQdzUlgmSUlPghIirqqcy4wOmMe8J5pnEicfkAdceRl2YVN4h3lvoq1W1PHWJpJUT7FVXpvtuUyPE07dLOOB+XLXhDGG810W7xCvM1okGYsOFJMh7pemyYyxu6SAiSHzTdVapXnpHVkJ1i0Cl26vsI8FSBer+Ktd3h6xuc1gaYYeZXrW7EWtPBaaLSOPAu65lEAFw8FXnRYioqwXI4g9KMzLbaNkMwyTR3gh6KqLUa9ldOKawAQHLPAGY42QDWmukcbRuika+iRM8+Bo0jLOUtiCZKd1xcy17PokDOJQ1QoeoTbwTST6MTAuK3eHAw+IecTusuooy1h9bQ2R7VRXhTzWK+CmXhyclwfMD7wr/lDFBKJuMiTcy1e3q3vjvNr8+CxAss4rTjzaXtBS4vCvCNJtk5IYobWJYdiU5M0lWBmveNgvZ1tpCKp94CU0JdacYzaC9LqD1KVXcLii04+sSsjZbBDLrAy7KINHhe3zIBULeXn4xG3OPNOlattTutHREXxTwXzSDp1xZqUFGZMpZLxuAELLNy3inwrTlAr0g6rkskuBn0miNimpKdaKNPGv6wrxJWMxsGbPOTnT8/DX3m5xoDfAwOwm7UqpV9LuEX0ntPiktIYpgz2W+3OCAO32upUTvEkJa/X8SxjxR6TnEQ0ynmj3kNOySLzT+UXsw241NU6My0U1LkaC+loIJcCBedabq/KMqlNZ3NadRojQ3+ym02zLGz0th83LYs9KuPf1zhxzAEw8HJ6VLtMPD4aovCtIimElsHmZxuUzJvCc0jw6bdtCZeYP7oiThuqNFp2VjzJuddY3SHdLth8XrHoWyOOzf8ARXFNn+iNzuBqBTZXgGfKLoN4n2rUW0lQePHxjF6JqlaZNZOYixOezTZtqWm3HJyWnp5ZiXPsNNkQWEPrzj1L2PbQywY7/wDD7bHqZadZPD7HT+PeEbuGh6iv44+esLmXTwScwkn5YXJKbqt37S7haXDjXTStY1+zeLSmJyfuDomRNdU4Ey9qYuDxEadkVjhrpbxsdtGcvzPZdrvZOxs7hj3vSddOVlMSRTfYC8uiutql1nxXIMfOe0ErblETvbJbvwx9jbHLMbTbLU2tbmG8Sdw3opHxSZZu6uZ87C4+t0fPDeyrT+3jGzeP5kmz0zo8wQdpril2vJF19I5KHS8m9SWZLeTxPEnWhw1yW6GPSCdFRmbyQhBEWoW9nVaLXjpFCLXXWluxt9psAxLDNoZvBpmWLpjEwbCtWXVJFVNEiglTclJzPF9xjdJL2u1wpT58I92m2mh49WNdSkJLz3it+X0hjuVQMu6tN/18oIe+H/phjY1R5Mm8rdPw04rG8GJzOfQCDM0ctu+XCLPGsKlcPk8NmWMak512dls91pi66UK5Uy3Kp2qJXTksVkuLKvda6QN/Eg3L9IcwDnSRzBLdVLhsuX6LxgkcEDYG4VrYqSxytpbhL+kdpv8Aa844SQyTpNrbeKFZ40hNEgGhECH5LEr1zfUi/mhou5WnD9UiERUztHnABMTeVuvNkhaf5/pDHEsdVIjjtICwmXDNZKrjYZeu9xKvJIlbtG1wS6+9eWnlDAdsZJsXOrO28fFU/wAokstO3/WMmksNZYFWRdbc/e5Fdx4caecHOPDJyef+0XsesDYa3FfjU1nzNo/dt6DGMLmxpe0XBHnCM7i3qxAUOhkdcQc7SKFDYUUZ3HQobDoAFHY5HYktR0WeG4ROT0tMzbYtjLyw3OvOuCAJ4DVeJLyFNVitFI0W0crN9MYwuSk5kpWXl2nAAQU9XGxIj0+JV4+CJCLuZ+L3BXuh4JOzIlbMTf2QPJtdXV8qpaPoSxXt4dNuz7Uk1LPlMOFYDOUV5KvJBpWNxgexmbJ9ExnEpCTclZtQ6J0xsHXDMU6q8lsEkt4LrESUYoWycPd3o5bbHt2GbDyy4c8eD4IDGKf+GlJ+Xz2py372yZIktMfhS31ihmfZlOriBu4g1NyuVYc1KOBa4zvb4kS8Bt30d1qNydpIy/MswQs2ScsPx3OfXQfyT84Ll8AnQBidxBibkpGYrlPFLkubTtZad/14ecekYGeF9PzMLlH8PweXa/trQXPzJpwEnTRcpC5I2lU81j1rZ/a7aDGcHa9xMYXh8rJsrvvfaOqTtF1q7wovE6UrzhYBmfMTzzcneUjLdEZ7N8xvuf4lS0f4frEEriuIMPE4xNvt3jYW9W5F5LVKKke4PbTTp48UliDeBOyZu7mIS02jPH+8aQjCn8KxPtd7JC6vFPcTfRXN83ZYhb0Xvi43Vqn4lEU5LSM2WxpE3PCJ53pcznjLS0tuAhAzURVUSilRV4rxVE0jgjbF9jWzjkjMu5T+fJhWx2y0q/AY9wvLgvEVVIqLbTt7MYSajW0KCG4UqGb1Yjc8ZJZxVV8qecEiNzI2iNw7heK/L8ozYuDjKlB8uRQI2v4YMl7YzY1UsJUvi7MWsmfwxUS5iR9r97zizl1t/FHO50oXcmfxDF7Ij8JRnpM7d1wSGLzD45Hg6kNThe4Yxt9nZiy0h/wxiMJc7N29GzwVWt23d/SONzqg9L2dmhK0f9pG5w165kRLtR5ngNw2lG9wd64Rj0v9Mryjnif6lRvFy7VIgdZEt6JxjsfTPSWpB4MTMFdPS6Ezd8FUFKeVIzWIYaOaLfFsB5RszC5IDmZUSD4fOPI47/T89YO3heKmmYl6WZyXGXLhrSi/CnPTnGOxq4QBh9sXBbutGlF1XXWN9jEv2+6KRkto9WXHuNoJea8fCPnKi4z9j6Phny19nnuNSGbmF1bVtN0+PyTnGUxgpSTB+5jNedHtajkndvbqaFVOHLWN1jDBNzjnSyJ/hcWuuiLz8ox2LSuYZdURX1t3a1Lkn+sbU2N2gxOMSLh9a6O7Yij5IuqfWM7MMsD8Tn5RssQk27N4mG7K97VfknOMzOMt3/tP8On+cdtOTkqKZ+cF1sMvKtEt8N3kvPzivnEmZqZcfmXcxw6mZGWvmsbDaSflpsJZuRkejDLyzTHJSK1FUiUvMiLw0p4Rl5hq67ul+GOlJOV4AJMmmJxh9yWGcbA0M2TrY4iaqJU1ovlrELj5dYI9W2ZVyhLdTVafRFpXjSCckY7ksEDY29ZreXJfCNjKYLj2QzsthG3+H4lMyTc2zJ5sx0d0bhctbK0aL5xqfalh7GGnhuz+EjmM5zzktu8UcNDEvoVF/dWK7Z/Z2Wk9lW9ppvpPXYsEnL29hWxbVx5a+KbqJ841+0jOIBswxtM26xM4hiDXu2UkmgvdkBeIjEv3zG6ichjZMlmGMWVZiVk8rxaclJ7D3kYZ+2N2SUtb2cneVw/3zOmvnGj2AwTZr+hWI4piM/NSeOypj7lbZBCF5xPvCcqlNFon6VWJ9l8JwLCtnvemNyJYgzLTLv2cHsrOmFG1tu5NbRFL1VPw+MQSDuIYf7OsXxTIlJHD+kiDU6a/aXnF0KXl0/6zPu+sE3lZ+44i0xf0Z6cwrF/7I/hrWTJy5vgzm35F/FxzxdPgiFvL4USMviM7JYhic1i7Eu3KXvr27TPyAAREQUFOJQZh+0Nk4xLTuYxhecjjoS3bbHvuDXtOKOl5RkzcbWZdclGXHAvIrF13a6XKnGO6mcNTbQOxrEinJkG8OlmsPbId4GnSL1IjLX+UUxszLXabLxrT84Jflp68nXJd9sTS4jy1QbV/KkbTAcHxGUxmUwDaHEZTCpeftB/3mtzbLJb+YaCtR+JOarGrVMTJKeRixRhcMcmb0ac0ZBsK1d5kS+SJT5xW8otcUWSXFZgGXSOVbMgl3GwtqCLQStXXVNfnEBSBEf2RxH927haX0X+VYqGJlJ8AMPbC50QvRNePJIJdYTKqOYbyKSuDl0tHSi1/3SBIsm1gmelXZObOUe0IFp5evpSBjShqN1fOLgcTdbwqZabezXJujc3nMgegrULCVLh4a0pFW0DZ7t1ha6r2eH6woBiGJEIURUtQq/l6Q9gWCB3NdICQOrQQrcVU0XXTSusQQyRQXINAr2c+yTss0Qq8IGgraq8l8YEhQAXB4gJMzEm05MNS66MIR9y5VQTpRF48eS+UQzFxs/aBbQgtTSgF9O96xzD8NOckZ2b6RKMBKNoSo87aTqqtEEE7xc6eCKsHYq9hcuy1JSkpMu2am5NHS+op2RRNzWvNapSIt6NstOoBw2fmJZ25uY3U7jlVEk8P90j0aWxDB8QwRhqZwVpmTlZkpr+0/bphxwbSFl6lCQStOwtfBY80zJQi/s1v8axo3U2efmH/AHFOzso27OZcvK4iImGQXZvMe8hcd1EprWFV4aW1UdHiMItJlX7s48y66q1u4/OCmJlVAAedcUG0XLDjzqo+SLGnelum9KwyfZaxF6QbVfeWG9YQCmlHOGYPn2k8VTSMiTTjLvmkF76STK21jyWk66jkmyx1JjfcDppa5T4bvD14LE+GzTctLOZZE282W+1d94K8aenh4RKMkzODLYTheS9MF17jpPWi1u74VXdtS266BccwxrCjGUfOYaxJvSYBbCbT4bSFdUVOcRExsaSsxqbfY993BngTF2XsNwPH5Y2JgzZzlWWIrmnre9YY6Kmu6US7M9JlMeHM6NMjvdHevUW5oU0uAvFOKVovJYqG3p3FdjGulvk45h7xN2X9ls6L2fhu58K1jcezwMNxB7CsEwnDX5yanaNT0i9Oj1zw/t2apVs6cOPZpqkcPE+Tt4beD2r2R7XszhM7LYtN2T0s7mYPN8Rvc3TYP8B/RFjbe1vZ6QxaSa2ulmOjYnhZgGLMd/K7JF9O9zT0jzTbHYmW2bwvB9rsEmnXaGTE2zlE0su55ouoLXinJeHGNBi3tGTG9mpHaGWxC3G5BnKxSVC37Q1wJbV0ISTii6IvhxjyVXmeD0Hi05RPv/P886nnHt42UmwawTbVv/xTRSk28P8A9wzURc/jAUKPB8SZaaB3qizC7G9wWv56f5x9r4Rhg7TexWawZ3LnpNw83D5zhY0XZMvhJo9w05JWPknbTDSkJ9+SnZImp5h5W3WXeCKlUUS51rHpcJU+j0efxK36jzxwCvhF8Pw6bunHxg5yUyg3uzCxCTdkZnIfYcac3TtdCwqElRWnmmselc8+xVzAEFu7BuFTKNYl0uaRt+wSVQeM0zNKUuFa1/yi1xnaqcn9ksO2Xel5LoshMOPtPBLoL5KfFCPvJ4JyjNIJhRyKXWNRtZZ6R7jX2bP/AB2fRIabiumGZ2QFB+SQ5NxQNQv/AH+Cx1oc00bbazXHN0AGtUJV5InGKII2U49ZZCZMm3RJtbTFUUV8FSHvM5RWOLa4hEhhTUVSGM9vxpDANxSUfYNlx+ZZfOZaSYqDt671e14F4ousDq1Z+0bL906xNMNsdFbOXzFX9upaIhLwFNeFOcNl7BacucJsrNzcrfXkvh6xJZG2Ake8VsWMuxuC5c2V2lt28PnSAhaIXssu1FnIh2YxqSWpNOODLSBF+0PRP5xnCWLLHHr5nL7ren+cVZRdFdBVGOFDYUKNzmFChwxwoBkguWtEFo7ypvU1SngsMhRJLmLTwk42LlO6fD8oALGUwSbek+nOKxKyutrky5Zf+6nEvkix16Sw0Ja5MScN7w6IVv8AiUq/lAbzs3OzA3E4+52R5/JE8PKNpg+z2EMZjGLOTeJT1u7I4SYUH/zX1qI08BQvVIiSijwplvD5GWxDo7c9PPmqsyxtXgIDpcY96q8E4aVjVzKbUbRYdIvzHT8MelQ6PY1JONtuBVSE0RtERONPpSNvsHik2/IdCw3DSDCcK++6HO5R2LcW68dLxFR1MlREu3RiCT9q+DYQfSfduY846P3U9nZQXd510SIy5raiJFY/Isiz2c2SxZ/CJnAsMm357HpiTvyJ2dIDvQq3yiHbfUdwxVbh80jDTOykpIYDKM7Wy2KYfmTExYcuCXNHegb7Z0uHqy0RRKvCsa/2he2SR2nwd3BJ7DX3Jdh29mZZeZJbx4EJWJu+WlecVGA7e4BtVs3/AEQ2tlsSb7jOKS3Wv23VEX2v24iWqKm+PBKwsAzJMW2j92dBdwt9vMkMu+ZkrgYnRto3M5S9hwh3HEpqo1XWsawvanP7Qyz2FzLg5MxLjLP2B/4QyHNZQuNorvj8NSThHmWKYBtFhs4/hco70spaUKb+6ML5Q+0tppciLurYuvhHqmwsp7owr33ins+2ebck5ft++Al558bd77PcQmSp5DWFgVmZj2oY6U1l4Nggty2B4XvlYNAK3T5+FO8t0ZnGNp5mcMfektezuZv2cL5krd0PgBsU4NppzWqx6u9Kzu3G0OIM7HbC7OOybkxZ0c5R9p6aBeyZOdlpR4rRU3obj3/Dd7T3cKw9gZbCSZkwcedE8Q3iePU+CeAiKUiaiZF03xMNgu1UzPZklh+ZIXD+yaluH72UiJ9YvXJ/b/ZHB2tn+lzPuvGOsw8s4HWgfHXqjArRWnaaXQkXhGK2y2F2i2VkJZ3abBp1t56vVOtWSrXgNw6EXz0iv2Vn5l3pck/0RqVyScyrxYbbcDVtxPxV08VupHH+Z1feD2nY/aHDpw3cN2/wuUJuclilG55oCYcl3C7IPAWthLz3hErVSkeW7YbMykjiWXhs9mX78uDv7b8AnwzEoqWFaVRVNVjRTW0WCTISzGM47Mzsq5LNumB4epg0JjvAhIV4qK6V8R84t9j29ncekHML6Czikx0d7snY2+83atw3dkXgUT/CYkqcYx7TbuPLsBZfan28S+6bkiF9134bV0T95V0pA7JOla/d2zVd3imtf5xq8cw7CGM9iefx2SeR1c2WdlwLLNOzcSkir6qNYyTYWPNtO7rf4N7dXmPJYgNg2VC8xzd0bt4rbqJ405+kWM1Jv4fOOSjmUVtFEwKouCqVEhX4VTX8or23bYusSclOh4PlE+U10Rel38BLMLLEf4LfrGbGqjJcPwwfLh+GAJd78UWEnMFHM1zqWxdSt3xFvDQrvKLzDw7MUkm/F3h8wUcrHUljQ4Wka/Ce7GVw2YIbY1eDv3W9n/DHHUOlTd7PmQ2xusHcrb3YwmAv9ndGNxg59ndjo4PvPN4+LqaMOykPhgdmHx9lT7YPmZFEbw3BEkcWCpF1mAgzGMS2bdcQjGSxpmWFkh3nC8KU09Vj0DEGBO4t2MbjTO+QuN2x8b/qFLltf2fRf6fVytB53i1vdbEbNN+pfNfSMrjAuOATZTIuNgS22dn1SN/jUmI3b29GSxK1qTclhLMF5UN0bKKJDW2heixxUmPZnWDzvFgte3RG21O6qU/OsUGMJb2d3cTshb/v15xtMQYfJlwrXOjoVCt4VXhWM/jhtO3OzJXTG6m6CCioiU3vPhw9Y9BJOV4MW8O/2boEcb3HR/ad3d51/LSLiaZEDEsy3fXdGtRpwWvDXy8IBmAErusjrWTjaCtcC24WszL07f8Avxhm6J/d28O9XXn9fCDCbJ0/vbijR7C7OFie0Mt1WZLyolOTN/DKa3yRfWlPnGlzKxYbWNTMnsxhGzPWW3gbodzMXtfS8k+UTbH4xO4fP9GxIpmbmmb56XBoerYmXAsbu57rfLlupF5Ly4uY87i2LTeRLyMv0yeMd7LN7eyA/FaQpX8SxQbM7SNMYrO4hmuSPSHXM7EXt7ozfE1HxcVNPmKR10lbtXWxzVZW+TbSafaH2VzWD7LSeL4064GGNgT9rX3hEfcHwMvPspHz/tdi3vXHmXJ37Fh7NrDMsFSGWZr2QHitE1rxJdVWPVttvac9jWFSuEzPSGcDzb5dqtxg32bq98uK/vVjxvG8RDp4ZLjwS6OqpugnbAeHmn6RXDy1wr2IcXmOj4C5I+8JjfncwZLKtSyygukXG5eFvziiKeOtJb7M3QRIW7t6neXXVecHTs1iG0b7znROkzjjrky66AKTpJSq117IonhAEqwitEVxZmmS0jd2YtefKn1jvRYWDgfq2I+mPZeWMxMLf20VzdVPCkGuzEoxhbzOVmzz9N9S+5HmnmS868EgvA8ZLZ13EkmMNkpiZmZVyUUJqWuOVu0Ugr2HE5LRVTyionphJgQbbaRphvsJVCLXjVaIpa/SK3nYjaNyfZtyQbxaVOdw9/EGUdHMlm3LM0fhqiVSvjGlnuiSc+ztDN4FKs4f07qcJOZcU8tuik0q8cvWl3GMcw4LLmZeWYH3dqc/OOy804kw0TiC6LZ3ZbtVBfFFTzpCank1y0qYriWOOYsxiuKz02xg8rIMzDzj6SssRC0yKrVAEVXgPKKSkFzaDMTbjzLAMNOOLYAVVAr3dddI49KqzLtG5cJOaiNO58X1r9I0i0GTZSQzEu+xlq8y43eCGF40uFeCp4p5xDFhddhdJkHiKopLmd1qClbhTlzrAMOJImB45dnev1/0jrjl4B1YbiUqicfXzifDp+aw6ZcfkH1bI2jZI7e4Y2kmviiqkCQAETcvkE2Oc27cAnVsq21StvqkQlbam7r6wxOMWU3IzqA1PTss5LMTaK424TVomNVSopzSqU0g2HvsBOEQpk3XAi10idrfZucEnUDTncA8l8KRHJvkwZbziNuJY4gaXBzSGi+4hHQrBc0NA0qnhDjQW45kbnaDll+/uwVKNZEwiTadWW4f4fOOYgxIhLg/KTZOZjp9QY74AlKKSppVfBIGYzwEnm26iFLitqOvJeUWr21JZfBcMS0pLJPSz7DgziW5R5tMvXXTvIqc+WkNexBp51prFGXX7OrNey6PoXP0KsDG6UzM5nVjuCh7+6vLRV7OmlFiCcB9uZNl3MBzS/N4+S/TnCqYMNGdS/w3CDkcUl8RZl2J5gLZjocySCbzC+SLzSvBbk40g3AZHD3cYedJjDHGZdtXmpDEJgmifRV0bEkpeSeo3JwiowaRxB5ZWedl2hkSeygN4LWXXQG7LKlK14Kv4uMdfmprECbYtWZl5ZskZr+ybrcoinwoq86xxvDeztVl8Qa3B091Y3lYphbjF9QeljAm+qLtAglrw4LrqgxpZjY/FJOckHcGaczHpgVkXQ7RivYJF/3RUKJdn8YxmWORwnFsNYm8P6M25Ly03Sbayy4E2dbgr4CWi6Uj6Lwac2G/+HJyTkskpi8mJsMs9I3mSc1yxcLQa+fCsePxNZlPV4eisx7/AOjAYR7QGeh4hsPtdiT2JOZRh73PrOtt1AkTUm+SF2kXWPGSmMQznXJRq56TuzTa45fDML5LRV8FqsXOPSuDZ2Jf/UpHFGf7IzlV30LfbPvAVOC8IoNn3MhmZxkcUKWnGf7MHHOIqoV3i1S4S/eHSkVwi49fsnit8D1v2Ee0OWwqZ/oriTzjEjiR5of3WYqWK2X4THdLwK1YD9vuxc9f/SC7pnRrJede/vmv/DzP8QJll+NvzjxuTmX8Bx7oj77DrbLtDynUcAv3TTy5pH1d7IcV/pPIe5XftjL8m5lf89ld15r8K8F8jHwWK4r8CrFRdpMqFqlOYneD5e2m2Om5XYCU20F1hyTfxE8NJoa5jTghcJFyoScPSMU4bogVpfeBln5jH1hjuy0tg4H7LMS62Rxs5n3XOf8ANMRclHP3kcAm1/fj5fxKXcbeJh1ixwCoYW9kk4p9dI7eHr8w461HApHGxv3RKHmjRA71Oe84naSo5ZXfRdPlBTcvdMiN2U26e9urQf4U108IYcm4Ug7Nsl907llviPEVXhW5eHpHVEmEQVLof9OkWEizKjg7+I+9sjEGZhsWJZAO8xVFUnENNBtURSnFbvKBaVZ/LklP9+MceZNhWlPdzAQ/Hd/3yiySRlXSzRycwnRrcvHzXWBW9PnpD6Xd7q0/T0hgoX8/lDAt8J2exTGJadmcLw+Zm25NlX5nJaU8lpOJlTgieMANhaY96LjZvarGcACfbwbEJiRbxCWKUmxaP71kuIF5RViju8Q9nh4aekZdRengOlWhblnXCYlnM5LAu7TSoqLcKIvy1qkFM9VLOP8AwDWB8Pys7rxJwfhAkRfqvnEuOrkYa2x8Zfp/rGXcxp4uZ9474hKHlDI64OZhsKFCijMUPNKH2rvSOR1OxAMt5WVblcELFH/vXzVmUD07bny0RPNfKBMIw2cxXEWMPkms1980AA81/RE4qvJI0HtFmJSYXZ/oDbjcq1gss2F4CNxJdmlu/wDMv84K2VmG8I2Tn3JZu7GsWMZOX8WpYq5lv4nFSyvwoXjE3Kx1sdCQwnDtoGNm1nelszLotzU9IihZ4rwRq+lGq81opJvcKJF9h+F4xi+AsMS2KyEpL9INoze6qXtTs2UHrFRLiXjpxig2Ik2VdfxBz7/uuH2ZdkN551flQB8y9IuNrdsMd9oeLYrMkj704YUlGgtbblpcUUnGwbTQRQB1p+KvGEP7lJtpj6TLaSGHYzMvyIpkWWWXst0tVRTdQVW40DlzWsS4JtmxgQ5ezeCS0v1dhTMza9MmvxXKNAT8I081WMkKOPvdGksxzMtC3m4v/fgkHY5hZ4ZKSauOOFnCXMLbhKh20VVoi6VWlVRYsz3Lb+lzeIPE3jeAYXiDh/tpdno79f3mqIXzEo9N9lewexLmK++dpsSxHCWZAOlPSPSAzmreHWhQkKvABS+vGnGPK9lZCbw6fbn59Pdsvp9teGuTXWoDxI6cPCtdOMWu0G18nIS83g2zK57au/8A1d1lW5h0PhQFVctK14by81io1Fse/Sf9Hdo8SnMX22xv3BgdorKYX0kzNiXFd03Q7Z1Uu8vEqx6NgO2PsE2SNuWwKSw13MlM8J/ol4n+H4hXSPhJqcncQms+bmXHS1ucNbiX1XisW+wUy1/TbDW56ScxCVOYEHZYJjKVwV47+tKcflSDMMZk+7cW292XkcYwp/C8dwvZv3i3mTXTmSILrd0xaFU15XLRFil239umLbLbOOLheKYHtf0J4ek4jI9qwuzmtdzXS8VIeWix8bbbY+/j2PT2L5v3p9U1X7tlN1tB8kFEiPY/HncNxX3hNzOdmH0d+XPUZhkko4BeSjw86LGWfRfya4dePg97Z/4m52Z6rFNicFnWTu6WFtiTI27qEK1FKL9Ywm1mMezDHHpbEMGwKd2bnHPvpb+0yYn6LQqL4CsZbabBHMFxgpbpI+7zAZiTnu6/Ln2DH4l7qpyISSN57I9ktkMZzXdourZANw5jGGZI7+6otn20+kc0tn4OhUw3kp9sMKwZiWw2bdy2JWZzMmZlyN1ivaIAId4aLwBwajdzSLb2MyE3MnPDLMdXlOZMwe+JdUaWaLbWhcPD0grGJ/3L/V7GG4bN4OFzL3VD9p57zgqtSHiBitR80qkW+yc1szsu9Le6+nvYhjdoA72Wsi4s66mmYIpYvLvJHC79OJ3KnVkVI4bh+1ls3LYp9s0bmcLmT+02d4G7qI8Hwqi3DzSAsY9nU7hks5JNuS0zOMvdKACeAH+imNN4PG/lXz4RI3i2zO0cgUtj+GvYNiwB1UzKy2aF/mKfEmtnDmK10g3FHpuU2bYxDZlyWas6rEHcLdPLc+EyE99pV5gXBeER2l9xny2e90TLT+NuSw2Uc6PdfmeCKSaFXwGvmqJFZOTBTc47NufePGpl84ixI5nE5ZzFHxc6RLuo3NPd0rvu7vhJaF5LSIhF8QacJsss+y7bulTwLhVIGIUsWwd3ru78UGSYlf8A/r5QEyu5E4mW8Q90Vjnk6YkuZM4vZE4rp7DmpPGHpRp3MbAW1El/E2J68tLqfKD5VxgPxRzVDppyaTCzJy0Y2OChl23bv70YPD5wu7uxpsNeIrbo46kHWh6Vg800Ntu9+UbfCZrsx5Xg8zbbG4wWZsZFxzvdlPGIptgxlxFPNT0SRe3Eug1F0jLYfO170X8m/mJH03BcZDREHzPE8PKSFwlhRGRR6btjByRFwPEWiIFtLjz8IymKGV5tjvj8B/5xsM5CdVkuP5xRY9ht7JZfb8OS+n+UfPf6lRzjND1OBqQjQrmFmnZR97euY/Ce8P8A2jLbX4fIBN/Zy6l7fuv3AVe7XyjWYkj0iYTr8pmthX5/Py8Ix+ITBFIZ7T7ZXncbPMfWuiovlHztz6en7voYnEAEZYxEePf8KRkMYyilmmspjMQzUjGt/KiFyt8PnHpbkm3OPNuCLkoybog69SoD46eNOXOPP9pGP61fymicErrLtzTkVPTlHdQqGdZDKvN5Z7w+cV7m/mWj2de1Fw8yVhOiNwhS8uSV4V9YEmJd3tO90dy4eNOSekd6nCxY7C4Oxi+0MjIuNla/MABldwC5Ll+SVj3PZvYiWlMN2nfw5kpaXnph2Vl3XCtRmSBdSuX4lokeXezNnocnim0Tv3cmAMAHecNxd4R80BC+ses497W2pHZHENn28LlmJ3o+XKsunVtsy/Zmv4R4r8WkOOucTN+mIaDxX2mTb7QMbKYIxkSOd10y7ulMuXfURS7s9pefhHnHtCmhbn5TZ+Rnm35XDgsPK7GZdVxbu/rxLhXdTQUWLjbiexLAMiWm8PblMUNonbyHrKnwdWv4eyiab13GPPZyZblJB+UK7Octu+EafnX/AHrHq8L00zz+KszkGIYsU11GaWSz90Pkq1+WutIFPFpmVlpqSz3BF9nIMALu3odpeVyVokCuOE3mNi5czeqhpSvK7XXhA1neG4raqY26JT+UdSJEHIzzM3Hyz7g8Leen81gpnG51jEZSZ6Y46Ula3LmWuW2BVG1F4eMV7gPkyU5lWy5uWVRKDdxtiFwbdBcvqiKtK/SNsYMs5jYmxCemJ/E38Rm3SfmJh4nnTdW5XCJaqpLzqsMVostHi3BM1TnT/aRFUculm9Xjd/KD2ymujNS0wrqy2ptIVaCq03h5JWiRU6ERqQNTbg2t2Nuohou+F3Du1408oPkpuSKecddwtu09UaBxRAfkVdPn845OYb7uakpnp0k/0llHaMu3rL7ypa4lN09K2wfJ43huEysjMYbKuTOMsOqvSJxsHGADuiDSoqKtdal9IhtdoNF6Z6pPTvZRsBsjtXNvs4jiDuAS77G64+NzOanAQJaaqld3X1jIbU4LgUqcz0nF5l5xp1Q+zyBlYI6ChKaig6ctYqpbafFp59+dxCeemnOjufen+HS1OA68kSBRxx7pzGc+4QbtXAPLcUeYKWqfNUWOJKNXPqY7Xr0sLKpWOIzMTLbEkLzyUtbadKtSXjSlET0iaQm5tqQewJnCJR2ZmZkCRwpW6aAh4AC8URV4pTWJmX5NzFWm5vIFk3etM2VvYS7itlLqJ4cY0e2S7LNS8rh+CuTc/jDc3emNXEy3MMqOgZZ7yEJcDrrHXL4zjY5VTKJY8+eXfXds8Ui3wnaB7DsbTFG5HDHXEC3KekwcZ7NOwqUr5xWTgGEwQON5ZItFHwWIaaRta8HP2yKHuHUQ7Wnny5R1xp1GgePsuVovpHDdcIAacIrW62J4V1hiJHGLHLbkc04t7yQxGHlNW0bO4eI0XSN17K57Z3BHp7FtpMN95tOYe81KZY5iyU3plPGFw7vhrGUCYxFMSddkpyYOYeuvcacK9xF411rr4RnnrMGnLiFifY3CMQSTCYYcYYeZmQQTU2hIgotUIFXskn56wbiWO4o/J+6Vn2/d9exLtC027TgRIKJcvmtVSDsMw6UdwCYexGQWVed3ZN91DBtxQ+8G7VEP10ipaNmUbnGkV0W3QQbDYA1Le+Jez6pxiMlZtjTBlXfQ63LynuMnWcTc6YT9jstlKjeTSqOKfDtaW0ixdD3PijMljUwT/Rmh6nVCG8K23d1EqninlxikYKbZacblH3kYmKNnaVqHzRFSvj4xo9rsHm8KKUlMU93dOBrrglzBwx4W3mCqJEvhW5OcDb2vuJdr22D8MwBx/BMSxnD+l4lI4d0f7Q0FrcujtbgcFdRKuiKO7XnEM9Mse9XfdEkMi27VGmpczPcLuXFqVf0iPB8axBicz2n25RsgBp3JHKBRTkQjodfBa1XWPaME2T2Pn9iMTxafxWWwfFRl8tWcvLamRWhLai7zR/lHJXq8vc66FLm7eDyPC8S/ozNuyUtNsTLD4tmc5Lt3OSLn4P0LkXLWN1KrM4fslPTb4ztwvSzrMw01mSzzNy5pKf8AEKp9FjBY3hshhmNf2t+jadkgsMx5oHED8eNFjuDbVtYZ/VuJS3TMMcebzLHjBxpq7rBCi2748UVF1jOpS5tpU0p1eS0q02LfFtpZSb/q/HZJ514LQamZd2jjQd39+1OzzRNKwMUhPYfIftH5N6/KSYaUM34rOYuIvEf1SAtp8NGSxByTlpmWnJOXIuiTEvQs1g1vAyJO1ulRa6itUjj2N4oxMt4gTmbmtZT1dc0aUK+vOnPySNVp2XQyepMt1FdjEu7LS0niGRbJzIllO/EQrQk8lTw+cez+x3b1rZTaDDMMwjaNFwMJ3MOZORo866bYo42QVuFteyn4rSjAbfS2EYv0NjZCfexDo0sOY08zknNW/tRb5uIO4VNSsuSMm2xJSvRHGJnefaS+79kV1CFV8E418Ib0ucnVOwoqcp9I0k+tMW23w7bXbqb2OxmcDoBvi/gWKI1luyT1yWkvlfuknlWPOP8AiX2QLC9tW8Xycr3u0T8wAdkJodHxT1LfTyKPPZjFX8Rlhx27MmJOYSVmf+YJDQXPmokir4x9A4jjmEe0f2Y4JhuLPtsbRXAso672ZlwBtrd4OCNir8dscPL5DKx03irdT5y2w2PxTZzGG8NxYRlnjZbmBO68ctwLhNFTjp+ekY2cuADbHs339jnw48Y+m/atgju03sX2c2xlhzJjDM3Dpz4snMLJVfTUI+cMSlt8h70ehQqZnFVp4SUjdw9Z4wW2w5NoOWxfuZYWWjvJrr47vOI3mdzvRCQkjIkXZ1jqMBhnQ/hp84eAuTG40zUgRVWzjTz9IRts9GFxHusU1TKt4JpRa8P+0cZ6QDRuN1QdEI/9YZJwnXDbBvuhW35wVKhm7rjmWVu4R9nTl/vnAsu2RHZbvLFiTbY5VrtxF2xELbdeHnpEPJoobIo0/M7vUN/jqfL/ADgbaQ/tIN/ACfnBMmNr3+1irxg7590/xxincafSAFDY6UcjsOZhsEPSsw0yw+6y4DT6KrRqOhoi0Wi86KlIHh1xLQa8OEBA2FDobABfYY61OSsvI4s+4xIMvUGZBrMJi/tUGqXJpVUr6cdbzaeQzzwpjDsUw7IWSGlXskRESUL+sou9bf470Ukl0KXlnsNxFXKPso+0bf7F+m5XxFUWi+FdOGt8uGs7QbPyL6TUlJOYfh9jpvPCO6Dxcq1rQxpRFVYiTRS0wdcGwLZZtJ+alpxJt51JqXkHrnnmx0b3lSjQ3XKlUWq604QdsNNyjDM9iszhMpJyOcw41ldvowqrExbXeJLH7lJeJD9M9iM/KO9PxLBsLamGG9Hpl9kW5dojG3q2q+WlVL0jMji88rpKL7jnU5BmfNr4Pwj5JDp0/q8iqVMox8Bbk70PGHmMMkLTYE5eXWm/WtM0vE6eiJ4QbgGz8w69Ouz78t7vwaWWdmamhBcVEBqvMzK1KesWDWADjEm1tLhM2w7ktf1jLOtGZhbpeoAiqQFwVeCLxohJBW2gsbObPYNgW83PTAJi+It5Fg5x/cM2+At6+pwVG+n2FNb9Xoo3HsQx9JVManjcyNxiWtstEt6vCmvjx+kasvZwWIbMP4tKYvs1hXQm77JyeynJkfwEeji/u6ecYZp2enZrp7903NTTy5YHrmlzVfwp4cPlH0X7D/YYO1U3KY9tjheI4zKu8XZia6LK/wAP7V1E/DYPhDzVY6ibN4PnMCncP3Zjok2z+B4D/NFrGnw/A8U2Z2Zf2qxSSekzxNk5bCc8bCMTHrXhTjagbqLzU9OEfa2OezP2TbLPS0zhOwuDliH3cseUTrTbv4riXe8Kx81/8VDeM4VtJh7e0kq897zlDm2qnviPYH92iDw84z6XTJTRZlWsx4DLHfMk4fwl+lItMMw8J6XJk3m2HPvGczsuKiahXu15KuldIrplhWWm8wCavFDtXtKi8F9I0OCSuz8pNSM3M4sU7L2Zj0vLtq28hf3dT3U/f3k8otlmxKtaT1L2AyuF7ZT+FbD7ZpOpIzbzpYVNSrtkxKPiNSt0XcOlFGnaEVTWPqLZP/h69lQSzzjaTePNucXXp1VMS/hpr6x8z+zzan2Xnt3gmOzGBz+yT+GzYOH7umymGHxHxBzfBfFRXX4Y+wsTZw/aXDWtodjMUkn25sV+6PLzvG0koomnwl84ypYrfI1q3a0qeP49/wAOM5IniMzsorwyrn/8ZNvA42+KcN5KKhc0XinjHnUjs7i2Hs4pgGISUzJzzMo/NSIPBa60eXa6KeNzXNOYjH0L/wDETE8AxP3XjKdEuD7PXVCJE7G9rcS8NaViywLbzANqcSlJfFcOZccu+zP0Solz9PBU+qR5fEp/u3/Q9Dh6j/03t+p8abEWT0tNsYx9hstYamLMzLu4XN99u7iibw1Qh8I2WwbElNbQuSWLYlNyM1L9f7/w53NY6OHazdLTEuCGuvJUjR+2L2czewu1rmIyEqM5spihmFvJq5N5kvhWuoF+FOaR5LhmIykrNYl0bF8RlMadD7BNMu9H6XXRxh8eGYvI+yRceKQ4i+5V9LqWe0GxM2GFTOLYfimbguITynh0xMNZATYjXX4QKpKiIVEXksZrLclZaWw3PJxxozdmAvubFwtKDyqgpqvOsaHYnaWdwrBywmUxlxqTeNb5HEQIQrz+IPyFYuJqc2QxNn7STcpjG8mdIug6DlOzu0Ebl4VqnzhOCmSnmhlmZT7SLjjzWc60P7FblQRJeZWpXyuSLPZmQfmT6W7LE/IsuijvdRxeOXd4qifIarGp2fwTYJ2QmZud97TO4bcvnTLTTSP8lOzuJz3q+UNx7GpZ/ZUcLw/oDpSTp3zMtc0Ks/8AKZVN0a6mSqRktK7sZNEGizNzOPTj89iT82+W88auFbomvgngiaekHS7kUTbv59kvTjFnInn5be72u1dTj4rwokc7wdKSabD3RG3eujTYfNfi3oxMm9lbve4Rf4a7l2k7/hjjqKdaMb/BZgQ698v4Y1GH4jedxFHm0nPX/uxf4fO/ijkZTo3PUsLn7u9GpwecrbHluFz1rI73ajZYDNXZe9GvD1ZRoOHiqEMsnorJXNosMe3g9Ihwxy+X9I5NTOUdpR9W1aJpQ0+T5jCc7QVpzAtzBS71oEvBxdKeiwhmrXVliLpHPwUk8U84H2gbFwM1ty+v/TGYHGBkOrmWydcruHW23zFfGvyjwK3EzSfCdvZ61HhucmS7+i52nw/pEorzLg5R6a9718/OPLsTlZuQeddlm7NwgNpwLlRF/wB8Uj0fBsRcdzeml2CTOBaXL5oPPwWB8fk2cWAFk8wWm65Zp2vOn/6rHnVoWpPMTT4PR4Wo1H8J9vZ4HNPPibu8Q8nfBR/nFU8TDmYL8y3ltAqtZxKN1O6POvrpHou02BEUy/hMtltzDpC71vV5tEXgS8vLxjzfEiyAm5F9q1yzc6m9bkXkvc9UrFU+o7mYqCwuZmwtFy4Wq2NXIhePDvesdcwGbHBPeGW4Uv0joqFdxdtutROPCI8PeclpzqC3SJLrtUj6M2X2awrEsFwOX0bnJJXJ98A3uuIdwl/6VpHamUHJWdY1mDxbaBotk8ElMLw+Z/rIJd56bs/8M4v3rnqI2tj53R5ziU30mQ6c7kCQG3L9GvuUqDW6neSvFfEqR6V7SGfdHTXcsm5gAB/7T3mgLqxt76m5cZJHiM5NOn0nFH2rXHDNGt2wMxdStH4RReHiQx6PB9XUefxUsmhfzmI4Bi+A4rM43NzLmLMVmANpnMfnJm2gjd2WpZtOPMl4cI8jnpnpL33Dbf7nPzLzi897tSjzfUZjPB6XzVEXh+AlTW2v1irk25aZObcnnMijJZNiDq7VKCqcaceGvCO+mmJw1KmRXiaOyvRrWQtMnM3evLREs9E40pxVdYgN0ZfOZTMW4acbfr4p5RPirwzM+64xLNyY8Mluvz05eNOUPypJxoRokvazqp3HefxJRN2vhqkdUaHPPVpA2ZawvoLX2iZOabuF+0EJqnctXRfJa/KC8LkZp2UfOTw1uZsk3H3l3Ty2hJEVzju0WnnrAWHSD7rtGQzb9LL03vLjGwnPZ7tDhuyLe0M3ITDeDTLygw9ZaThcLf8AemkZvVVfJpSpM2tjEyjrTbxlMiWgFZYIrQ6aaLpT/aRArpGzlmbhKNMve3UTnpCm0IT3vp4RI3c8bSMp11Kbmil/r+sbnNPodLTjrcu9JPTEwMq9QjAC0Uk7KqnOkNmJN6XZZmVFTYd7Dg9lacU9U8IjfDfHLb3dE4LqvPjErL2vRnswW7t8R13uF1OapDFf2aSXcwibwH3hiU9mYo9OuA6yG6aN5dRc4Wql+njAo4dh78pJ9FJ9uZRs+mdKsBpDTUcsq71R5LrXhHZyclJXDClsTwQ5rFHXUdanzmjFtWbaIgtiiIuut1fKkc2bxfDsPBpyZ6T0hk8xmwBdAVp2lA9KxlbybXvpJdpstMzBS7D+H2kAtunOhVxptgk3c6xFtRPi4pwVIGxnB8WwjBMycc6JLzTiF0dx0SzwH9oLXFEReekX/s99o0zsvhWPSuD4tNse8pVZZxp2TBwXm17S17hIhKtdYyWMzjbrOQeSKh93MsgjgP8Ahcq7wrT/ALRj+Jn8G9qcJeCgxHLvG2y6mtn5c11gUraJRNecESwsOn17ws+agv8AL/KI32kFUMEJGjVbK+UdkaHDPVqQQQ1MOAGWq3t/CvCvKHzQzYg264yTDb4bm5aJimmnjrA1fwwxBUpOPyzp5L7jIvDluo33gXiNOaeUTy8x7sxLpMsjT7e9lE+wJIQrVK2rVEX9Fiuh15WIJLuQrDyLOVnsYFiaZZfmDbs66ypIg+flBOAzrMtLvvYhKNzktuXsHMm0TyV1RLeNPFeGkTPYi/hmETMrgeOzQ4XiJ0mJNHSA1t7Ocg0EuK04pFfjb2GPOXYWE0wzpRh4r0DxtLwr4p81jO1/BrlK+Q7BZ/B5aZ6U23NSU4w8j8o9cLwIQrURIFRK68/yiyZmh2h2k+0gw1MTTyufYxBpHCJa2iPYFa8B3U5eEYtOPCsSkhMraQuNvAXpT/WE1K4LWtpY0U3iL2C4kw/h06245JvnYD0iLbgF8RgqKN3zWipFxgy4hOybDTIOuuTjT1Dze0SVXiveTn43RV7QbS4hjsnJyW0M17wOTaLocyAgrm9ra6VLj1+Jbhh8lib2FYK7KZrbpMuC9LZbv3ThW3btKHoIoqclSMnTpjTU3ptaZ10O4Fjk21n4e7bMS5gv2Z5nNbdLkijxEvAxoSQHLS0piuNBLsOph777oCykwSKzUi7zi8E81RfOJXpBiYHEMTlcUlhcasfYl8s0cdvXeEdFRLOdV9Ir8NeOVxBiZymZzOreyYXcVpqnjzSKiI1sTlOkNseg4RO4VM7dBKTEpKYQy8WVNgyF0szMjUVINV6suf73hGu9ovssmNm9m2Z15u2VnlzmHe3lCnp4+fFI86dmpbCXnZltJQ8QnWuslujG2eGzAub24uiLRNOOhLwWC3vaBjc48y27ik22zLNWM272WK9whXQgrpSOCpTfOGQ7qVRFSYYrJdvDcPw2ZGbaf94G82cjMtPKOVZW8Cb/ABVFULiKjGjDZ5jaXZ2WmlyFxt/MsdlO2hAWgzYcAzLtx5PQoz+0L2EYpgpvN/ZMTbpY33Hvis+Hxt4eC8osvZ/tjt3gGCYrPYe457rnXRlJ2bsHdIk7BLxoQ3aLpxprHVGUpeNzlm0NbwVWzZzOBz87KYpKW5wOSk5Luhao1504oQkgmnmMbDDyxTBmXOlvsTJbPug81v3tuMOHqo+I3W1/fiu2ymtnZ3EnctyZknOr6NmmT/UqCUvcXeK1aoi9q2grWkEbOuTeyeNuYJtNhYzOH4kygdu8bHNM5o00NFRdfz1SMmbItFsfTfsHnsB2t9luJ4YjGVIvTj8u+yfbaZf7K/wHzj5S242emcD2kxDCZ0eulZhxg/USp+fGPZ/YFNYhsXPPJMsjMYfMvG3d3FNvtCv7wa+sS/8AFVsz/wDMS7WS2QUniZ29V8aAKpX94LS/xRwcPVwrN6OmrSukHzLOS++OWXLe3aa/z9dPSBZ3Dzljc6XdLEjQuA28Birt3C3Tmi1RV0VOcXWISxMHvD2+z/v/ADirxg335nr5npJWCl+armiJoNy+CaU4JHsIx5krYp462ndtgh4GRZ72Zd/Db+vGOMu5Twut9WSdmNcibEcES5/n+UJtLzuabzbEvMLdNP1SJRlbGWH89gs27qkPfbp8Scq8omSixw9IopzeMi/EsaKRy8ku1mJ9KU+sZ6c4xnT7im2BYZD4ZHWcsihQ6FAFgmQmHGXlRt8mBeHKcVPgLtJ6RI9hs23+yzW60zWt8fqkKVwrEZrLJiUdIDVUA1S0Fpx3l0/OLnBMCmEnVcmX7G2aKYSzouuHroCWKqJVeZKiQp0HvoPwfZ2f2kx11GGHsnpGWZAF5fuineKnLlzpGp212XwRlmWZlMpmcCYNjJljF1ttkAqZvTCrab1eIhoPDjpFS/tdZhpYRg770lhrlpzQWIJTJXVISJN7LrwCvmtViXZ3EGGBnOkYdLzuIK05Jy3S3eqbV8rROzhUUIlTlWi8tcXlvpNkhfqMM9e0iN3dvf8Akv8AusGTWHttYTLYg3M5iTCKlqcQcFd4C+VqovOsB4hvz7ojyOxPlon6Qd7xcl9nXcJ6l5uacF9bg32DCqJaXmK6+VI6DnOYSMyxiskzLTcww49bvMmoENy6/lF7tNOHtHt5N9EKdxB6Ym1CXzt59/ut3U7y6ViuwuZdxXH8OVwVdcZRM0yJVqI8PRBGiJHqzGCzXs62YnNohw/+tsQYF110973fJula3+6Tq/8ATonOOeoyrUg6KazNMt9jdmtj/Zhlze0/QtpNpxD+yZt8nh/4Cpo4fj3U/OLzab27YtirI4aMznufFKO5QfhQRFN5R4UrTwj57xDE3MRe/tbeY4feK2nqS6JD9msRJZxc+U6TMPCLbTzhL1CovbGlErTTXhxjflp9Wphm306H0lgu1+M4rOZDc2/Jy7INBMiZXbwjQy89eCcU4Lzir/4ivaPg20eyEs5iBTc1ikrM5UmzugwTWl4ud4q2iq68Y83x7aUsOkG5SWm+uAM+YdQqqRL2U86J+ZRlJZ7+lEw1iGOupL4ThTNp5VEdmSUlWwficJV1LgIpVeGtsy47EKrZWKcQxHHH3ZvEZxtpk3CccmH+F3O2mq+iaJ5RZYRhexXRUfxDazEW5gDGstLYVfeN29a4riJVB11TyiqxbEGZ7EnjbZ6HLpXJl+2jSJwBP845g2z+N409TDcNm54+eSyR09aJp84Qz0aexH2GnlS2F4Xt3LOB25s56XOv4spRt+VUjT7HbSYpsEfvbZ/F/wCkWyb1vvEGurmJX4TdaWqtODycG4V4Xco83kfZX7QxQnh2PxKZboolkgjpjXnaCqX5Rs9n5babZNlrGcWw3s/ZGWcQ6ty1B1ER0JRpotUVOSxzV6bejp4eoseT3/Y32hbM+0mTe2dxubYnZhs/sk67L5Tjicrh/KqRitontosO22cFzIYkZNonunZVuc0yN29Ti4nZ+LeSsZXFC2exLB2MS2QwD3Ji3SRzujvFa7Qa2tNd2i7y2rHoM4TntI9lbuPkxlzDDTkviA229clv2gB892sebxK42a2knfw83ut9YLTZD2nMbWYriGE7TNNe6sRYWrHHnu2/j8F9I+fvb3gWLYR7RJ6Qn5JvqbEZmJZnLaeZtTLcRE03htr+KHYK9i8pjEjgjczaJzOdYIpVDQfi48E4RvdrtovfWzGzuLOP5mXMHhExMf3Tnblz/dtImyTmPmiRNNOXU+JLeeYl/MGB2Xw3Hdp8N6NKPsb7rYO5xIO93TuXs3W0XxL1izw3HMN98S3vd+WkZhpno4Tvu8XPw9c0qWn5lS8eOvCDpfbCem8VYksbYlpaakRcaM7BamHmS7TZqNBcMeIHopUrxjAY9gmLSuNzks5mTfRQ6QcwneaXVHddda/WLx67E5dNzSbUA/KbWuMY610mV7YNS7xqItl2TYVVVB8U4iqU+UU4BSZ5bb9zdt4PD+0BeBJ6py5LVIlkzLF9j2nXd57Dc1sPHKGh2fISL/DBUnLN4rgORLNE3PSYOTdhO1R1nvoKclTt+aXc4xY0KuXNtu27rKgvilq8Py4xZy5WGQ7pU03SqnyWKhzL6vKcuuFLt2lF8PP1i3keje53HSmbZoJgABqztAoqpFdyoqClOd3lGTwapJbSJC31pFvd2LRmazIzDczmWxYSL2/2o5Zg6lY2EnN7kXGHze+MY+Xdt73/AFVi8wt662OZ0OpWN9Iz2+P++MbPZ2e3248pw+buejabMze+3vd6MJWw26j3HZx69CHy/nEmMLYhfKKnYx252nrFpjyd7/ax7lN8uCv6PnKiY8VYrGXxKWmBcy+rbJbPJYxe0w58nMtftGqKu7veVPJYtSecDFRbtuF6oEn4V4/NIzATrk1tS10crnHHsq9xbUt4JX5R5NT8VPmD2KCctpnwVzO0rjbQS0231jJ3NPd/90vFPPlGob2qYlZtt6Xy+ivMpmGu9v8AxOB3VReacYpdqMOYYmOk9EYVsjVl4D/ZOJ4U8YzbmJyj8t7pHLlJrXrvi8BL08U5Ry02ZfudbU6dWI9G022alscwqVKdGx/e3wpvV4KPJa+HBfWPKsQkHZWfbYxeWJ1k/unh0Wnz8OYrwja4NtLLMbMvys3L0mgMZdWl3shUWqkNeAknDwWNFiMhKYzJpMttuTjGgPg4fWp4FX4k5Fz4RbN1EpPLjHweb4J7Pmsb2klvdc6y5Jt9ZNmYqBCCfh8+zosETm1eJYVsrNsynUTU/Om0s2i/fld2RLkIpRKxNtLJTOy2ZhctijbUw5Y/nG7lq2PZaatTvVVS8oxPtfxRvobbMpMtzGH4YIyDTiFbnPKNzjgjxpWuv7sd1NMogwapF5neCk9oG0rW1FmEB0bpze4eKOukmegjrcPZFBp2+KoMeb4xKzc8cs0wxmSssygS9obrg8VPzuXVefKJ8URsNnm5smnJRmZuYOZLfupqVg+lKxofZ9tvJbKYLPy3upudceYcJk5letliotDTkBrXs+kd8fhJ0QcsrFRuo8px6Tcvy8rKeAy6QANI20PgniqxRT2ZLKBNvgpON62cQ/B/2jXTkuOLvN5E830p10Gxl5l6wt6u9etAtRdKqqcYy2J4bMtvF1ZH1uVuJcl/w1TjHpUH9nm109FciEwYubulF+JIt8Kk5vEpXEMSz2BCSZA3cx1BIkIhBBEV1JdeCcEgNuTfdZzWxbaZ7BOmaIn5/wAos5ybwZmSk5bC5cm5iXv6RPOXF0klKo2tro2gppzVeKx0NN/uYL07jBmikmRdPLas7DYAKG55rzFPPnyjXTXtI2lxjYyT2Tm8Sc92g5cEsyPYJV3VSmpU8PBfGPOXWXxdJZio5g5lT1vTyXn6xbS2GYm5NdHdaCRKTlVf+0fZis7SarRSJa6c15Rm1FPJdOu8aKVM+6866ralfZ/KBryFy4S3h4KmkWWOy0pKIwzLTTUy8I3OPNKVpKWtN5EVFHgvnFWSka3LHSuxzVL5FpNzk3ik10rEpiZfznFcdPtb3fJE4VpRYGnG5YZxUZfz5dO+AWKqei8FhspNLLTDZ0zGwO/LPgvrTyiXC5NuefCXIsknTtbPiN3gv+cGxPcXTyYouCypTa+8JLDguZYN0TBpl0teyVRW7lyrFK7LsqGfJvacUbX7wf8ANPNPpF1I4dtC0zPYB/Z5d90xeam+rHOZFSt17LiJoic60jPHLzLNik24NwI6H7vxRMFt9hzOITbClZMOohrU0vVEL1p6xG249Lu3Ctir5aKnz4pEspLP4jM5LKCT5XL2kG6iVp6w6UlJl94mGJNx92nYAFMh+UVoR1ETRgbo5jbdE/hu+cW+zuGrjmIuYZh0hWZeGsvfNiFlu8WpURajyinVuiuI8uWYaWW6xbty8tIYU8s4+pzZqCtSos7qgut6ud3yRK1gbYpN+rYqGBKYmGWXXVEaoNy1Kweeia6caJEsnITM7MOtyQ52UJuEXZRAHiS14JTxg3C9o8UwzFZXFpF/o0/KnezMsgImJUp4UXTxSIcDxqdwnG2sYlchyZaNXOvZF0C8bgJFEk8lg1JtBX2DaRZg6U0119P9YZd3eUTzz5TMwTxMtNV7rQWp9IGihSPbAjOwU1i+lZbAJnAZk+lTLWL57QSkplXA4Cj1hk5VLaLwSi8Yo5cxbeEjbF0U7pVov0jrxIZ1baQOGiKsTMXGs2LaYnui4ekkzLYe1r1jot5jxaU1Iuz6JSKejjpEuqrxWJHHjc++qZciXj/rFpOYbh786Q4FiCzDFgKPSxFhyqjqNKqi0XSqLrC7SrZbFKKqkWWAszM5izDMtLNTTxVVG3zQQOiKq1VVTSnmkW8xsfizuGjiMlhM+UqFrbruSSjncxuTSAZXZ7aPo0xMs4ZOAyALnHYoog8+MRzabxuacmok7HruxDWw6bDf01nn8a98SUykt9lmGJfJJW913LQVuBOyilS7hHmkw9IOszv2vrFPMaJ6Uo68t3xIu7+aRVSklPuSzYSEnOZxIWYQLo4PHgngkXcvjvuyQlHpF5hueVoukg6CvNvcrHGjFQTTmmnosc/KxnSbnQ1XNdYtYpJibdkXpKclJsumffk4jt1p3aeaEicUWN97EJqWd2wncYngafmgkX3G8Pdb6jFKp18qXwkTSmor8QjAS4DhuN7PyTOEs4R7xedaRZlmeNplk3buqeR4bRKo6KhWxXYXsvJSGMPyO1OMzGB5IH1oSSzIZidkdwuyvxDWKzSdNpIWm0T7gm23wLDWcY/qubzpd0Ackejy52Ptqle2q9pOBVTtCUVu02HMYRPue75tx+RmGgflD/vGy+KneFbkXzGL3C2WJ7+pJTKcxBgifamM21S3aq2K1toiJVOarGg262Vndl9mMKXaLB0kcQnWM0Jd7f6U0fB4aL1To95OemkQtX2aNSuYfYJmfxTF0ZlJbps4xQ2WTACFxFKhBvaa10/FG29oWNYX/SecwbZth49m5o25vC2ZtrLKTcMUzBb+EbrhVOC89Y82xJMJk8RX3eziqMmyOX0m0Tv59nQh8OCxqdkcbkZ7YfHsCxRGScZZKcw99x2w5d1KXWfFfwUOfHlFVF1ytoTSfTDaT6J/4b9oNncMlZ/ZXa+SRsJoUe6zfyzCv+Hyp+ixpMUwr+mew+1OzmEjMzL0hODMSxvNWWk2P3VvFFJvhyWPl7ZrEUwfCnXcRfnZfaCTmBMBO1W3ZdR4fFenHwIY9z9jXtJCb9oMnJyUz9sm5HoE273JtxrflHP3rbml+UeVxNBl6/R30asMsr5n2fP+OSm+UZiaZy7d666PpDarZHBJb2ytYTM4e/N4XtCypyG8ratG/WwhVOKtuaU+seFbSYPM4RiT+G4h1b0q6bLofCYlQvzSO2hWhog461K2pU4fikzJT+Hv9Q4Mk9mADsuDg6rvXCSUJF8F0gDEWOucflmnElSdLKIx5V3UKm7dTkkTTA2xE4870PL6T1N9cm9e1TtW8PnHZEnMCNll7w9rxguVgUYJZtG3eu+LyhsIvZVfsbjfdG5fqkZmbjSYa91ORaO9rdbr2acfDyjOzUZ0+40bYDXjDYcvGGx2HMx1sCMxAdSLRI03Sk2UeWUYk2ffsu4WdMuqLwsfgAVS25OZa68Kc8xCgJCZ6cmZoqvzLru8pb511XjFrIYhO4JhbD0hMq0c1mZlB4jRW6a+Sn9YoYtXG3JzCsPy9VbMpfwopFcNfWq/SFIQXexezbGJ/wBY4pNhI4WD2W4dyIRF8I14VWg3LVBrVYP25xtqZ2kk/dLspMyeGZeTlS+TLDZ8Nd9zs0zHN4vBI4+3MzeDYfhyue7cLlQynnHK5Wddc5dRN866oCchH1iv2qHC12fllw1hpkRmCDNeOs3NrSpOEPZAE3UQU511WM13NG2tADtoEq1tPiT8niklPA/ME4Dkm2Qt7+8ttyJREUrflFbhUjMzXSHm5d42JRrMmnABSRltSQbl8NSRE81SBSAbMzu8PVYLYxF+VkzlWXiyZi1Zlqu67au6heNOMbmRu/YBhZz23p4yrEsWH4MyeITgTH3eUC9gv3lokQe0Ha2d2hx7GJmdmW8vFpkXTvutFAUrUFB4Jy4LSB/ZvjeIYJs5tOko+0w3PyfR3s39sKEi5Y+a/pGSmmHXWinUbIWydLx0rqmv1jjwyqzLfkdeeFKIUT0m+ksE0yHUHcSWmhKNFotUTUfnxjXYVKSXQ8LxBgXuuPLmM5rcF0eNp96qa/hrSMOSW0tcrVPT5RqsDmejtSchPP8A2O4nAEj3GjNKZnlwGvkMdVmOZbBPvRvGtrZmexvMmelzOZMnoikNUu3UonZTlSIfaPtC3jGNk5h8lKYbKB1ctKSiWtsNJwEflxJaqS6rGdmyclZl9vNFzfJszb1AqLSorzReMav2dYTg2IbQy03tViTcph+vWvXEF9vV3U1sQuNOSR0dMr0mGsNqN2W2dw+bmffON/YsNM/s8o04t76+SrqIea6rwTxj1j2be2bAtj0mrNnJeck8rLZlT0aDe/LSuuqx4vtntFM4lMvy0t1OHtmLYg3qK28Cr5rcvzjNsvONHcC/ziVaE0Gyy2p9JbAf8TW0mzeNzMt0aQdwl+aIxZyaKyJFwFU1onnFxtH/AMQTO0j0o3i+GYTPSJV6XJWE4FykvxbwlTjYtOEfKSEqR0DtNC8PDSM3nPwWvSfSkxsZhGPTnvn2fTs/l9t7DHesdlvxNODo4P0NONFgn2R4zimxe0L0tjtzuGvbjzMw6vW3FaqDXmQl9RjxDY/bTG9np2WclJt1lnMElBSWxxUqm940uX0j0HabbDD/AGhy2HzeIZ7G0EsBJPTOmU9b2XPEVpxVI42oczpOtKyp1nou1uyUtK+0WSmcNavalnWnJF0Gv7ZLX974nBS4fMfOKf25YW7hGD7T4e21lyPveRnJQ7bbWyFxEjRez3bEpnBPtzrEy5h9X3WXviGnWCSbwXJov4hj0D224fg+3XsKncYwneUZdJpq/tjlHc42XmiKSx5dTOlVjLwemjI6Tj5PnfaRnD8R9zY6LEs4U8z1soZ2iTzejotlXcVV37ap2t3wjXuO7O4jg+EdNlMW2Wew25uRmcQZObl3QLtS5OWoVnwjvW3aR46/Oy39GX8GdcK771m7uPBp9HG91fxCMT4Rj897qaYdmXJuR+76JflCw5/eCPZuL4lTe4LHTjpc58rMeh/0fawOcPojD+IN4nnOyTWUTTHYVLN/fMuVNIycq1M5z/Sc1t5tpw3bt0kWlNU5arSN/ge1eCTOwc3shtN+0s6J0m6XmpZ3ukN1QOnjcO7pwpGdnpjaLZyZ/rnFCnpcE6pkzB8XR8xcRd3n3vLxjljI6GM6MrM4jiWRh8kREdLWZe4+Ca09dV8odeIdWJdjtF4rz+XKOOY5iTk+7Oy0y/JOPCadS6obpaEOlN1U0olE8orekd3uwxQXMq5/v+cWEm5FC29daX3lxUtu/lFgzN3b1oiRF2R0RI53U6EY0Mq/F5IzdoEX+GMhKvWG2Xw6/OLcZm5kR3btfJSqtYwZLnQrmqw2b7UbfZeaK/8ADdHmeFudmNxs69az++VIwqKbIx9A7CO3TAeY/wAovNpXbEuEt4NYy3s6O6ba/d/lF7taWh7wju96OlKmPBz9zyqqX4uPsYXaGa3yLMze+PJErqqRjNolakT6SNxNvUyS4fvV9OEaLGnHAMm2LhzkBvf0uuXT5V5xhMemOudYmRK5m4Cs1tJP5VjhoyevjaDSOYsIyzUtNsODnUMxdL75suySefHXnGQ2oluh9Y1mW9tl637wPPwJIU47MhJy3Tm8q9m8DdEhuRezb4jpyieYn256T6M/M3dN6xo/7t5NCSnKv80iqq9cOo6fbjIsHx1j3OwL/WZpk3O7ibw/siE+NU1jRYHi8xgU9IjLtuYg3NTzMnLOIVtyOFqBD5Jr5R5nNSj7UgTnRHG8qYyXnr925dRFR5Lpxg4jxfENp8Jwhoi6ZKyhzbpB+xN0aAq/iRrX+OLijrl4gzmppK+ZL/2tzjGDHPS0zb73xCbNxx4zQiZlgXcQfhI11/dGnOPBsYxeedw1+UHrWXjbMzyqqJXbu9xGqrw5xptosRf2n2wb2flLXWZU1Zlslq5XXVoNv4rltRK6R5/tdMkOJFhrXSZZvD5hU6MZb2cK75lTS+5PkmiR6lCltoebWqfITjDs3hmMHKYs3lvYYCtdDnWiHILjbb8etfXWMs9jGbMvv5YtNukZ5QVtFF5JXWnrEDk++68/MzLrjsxMFebrp3X11K6uqqvnFM2b7GXM7w8wP0jvSjBxPWkMnsQzZtib6Mx1dl3wOW00UfRNfGOYpiRTE6/NyidCbN4ngal7gBqq1QR1WiJwTnSK58HL+t3STx084bLjmnlk4Lf4z4JHVCQc8sanZyTwCawGbncUxL7VLTDX2EGbX5psqoRNO6pcK2qoqmqc4pxkyl2TmZjJcZuUE65BK7nQeP5U845NSzsiATDzDYPXp1Lm6VttRKzjaqc4BlsQm5adanWHlCYbPMA/BYFW4O0RuWL83LYi8kq04chJgZFKtPOK6DV3aqVK6qleHGIhnpo80lxN5XXtxzN1uBOzvLWB3ZN9cNGfyuqzibJ3MTeOl1LeKafKHPTcqUhLMNSxAQAuaV1ancu8Phu0RU8ouxlkTy+ET5l0vIKbbAcw8rrdPxW1tr5xX4g2LU24LbbrbddxHUoVvKsGS81iuCm4kpNzMr0ltEcyXVC4dFtL9aLCxeffxJlp6a62abqjkxdcriLqlfNNfl6Q+rL4F02+SvvDJty9/wCOvLwp/ODcIkpidCZyms9qXlzmHgF0QURHS7XjRVTRKrFemp8bIleFgXuocM29N4gtLhrpVf1iiC4exLp+HI+8T7uLS8xnZ7hqea3RE1rzFRTXwXyhmNuy7+KNvS7xNyr7dQbQ/uBKtW/RCr8oWDXNXYg5KPO5RiuZYJB4UMV7SL6xcrhGBSuzbGJlj8o/ibz7zXQUZJcuXRrQyr2TuWiJr41jOXVTaEZzHN23bw3fOkWOEmD80Izc6koKdqZ1vFPRNS9OMDkjIoSNNqJgXf7Xl5QTMBITM0+bc6bYZOamc3RXHaJUN3RKrdRYudTOOkndlp6TZKdaeF+Xv/tAt3prw4pUV9aQd7QNp2dqsXZn3JJySRqUalwYB68BQE7tU3RXVaclWKKXnXZd64Vut3aHvCQ/Cqc0i4xCTwnFpUJzBA6E/wAH5J93dQvFpxV1H8JbyeJJwiYxaGYtZyWYUzPdjkKJRTNe3bQqvyT/AEjUxE2u+lxUHz1SF1ZL8H5pEkuUu06LjrXSR1qF6j+msWuGychO7P4g85icvJT0kguNS7rdOlAq0JBP40qlBpqlfCCw7lGSUh4XAoOJp6Ra4RirgTzQzs5Mtyp5bT5tUU8odNEXRaJ4wPjFrU+6yD8vNCDhAjrIWo4icC08Ym87FWXeCvg7D5Zs7pmYKyWaUb/iKvdHz/SA2xvO3e/WNHhDb07hB4Ew5e4/MtOS4WItVXcLjqK9nhxpCdrQOmt5NVJe0/EB2Xf2YbcelNnkmQmG5CXetJumlRNdSXmtdFjFzqOdJRxTq2qZje8Sg6nzXRfHwjuJYbJYZJvS86c2mLBM2WA2mUjadolJd5VrwREpTnAWGTrcq9a+0kzKl22T0r801FfNIySki9Smz1nnpYKefeYZb+yZTy1PXs2cqJx+cCzE8D88ryyjLbRr9wzUQT0qqqkW+008uKOsTrs4U+eULYk722xFLRbc5aJwJOMVWGSrLthKV5X74Ii1EfHhrWsXG15M53tBodiXGX56YwmcWafk5yXOkoy9lZkwDZ5F3JbSiHFXmpOTblpKZanb0+6JgrmS/Cq6cfCLPaDYHEsJ2WwrHXJmS6PO5yWdLHNTKLW5viK0WtIyU6Z9jMBomQ4JUbvP1jFYh2vc2aZRbTBaYJMYc7n5stdY1e0GbYd/r3k/Okblnbva3EdknZv3s3NtyrrUp0SYtmMpnu3i6KoTVdxF5Fx4x5bJTxyzJtZTa3GJ3274qngv8o083iklJzfSMObq3PM9i/cBpwLXmlHxv3kWvJIHpRlrAU6vTpITjJYbiqvzPRJLB8QDR6TO8WiNONi65a/hXTwWM5s7Olg20bE90bOFgiU2C0uC1UIVqnNF8IIxkSk1bJzrJhD60D3rkSiif4hIYnmcVlsYxJ3ozXuaWNtcpgHcwGTt7Ike8LaryqtPONITHbYzzynXcsMMxMMfw1jC3pWuKNWtykxmfeNp+xLxX4V/hhSMnjOA43KZjE3KTFwPS+aKtqW9ukPlVOPjVIzk/J4lgc6LM7KTEm9YhjmgQFauqEn+ceuyuIf/ABCwSSwudnejT0n3nf2bpaI5+Ftzdu8D3u9HPWbl/KydFJeZ8NB743tFhu0uObJLNyjOG9aGMYTPTBdreTpMqNPxoVK/hjyL/izwaXw72rz8zJuZrGJg3Pj/APkTe/MYyQ7QYhhobMYbPPzuXhc9MXsu22sOZiIVlN7hqqLz4R7vt5snI7brsHjE4M30OZmXMLm3rssRDeNip621VbPyjzf5NSPUnZpUSfj/ALPkaaDswESfs40eOSBSc/MsF2mnTbL+ElT+UUz0m+TLj/7MLU7aIuvCic/lwj1Ea557raStKJpchHe3XPwxGQWx1kd/4f5xqZl1h93ViX+6xTYgFrzg/ii1w934v4YFxxrLn3fr9YyXuNPBSlDYkchsdZjMDY0m02z7ElhsnjWFuPTODzjY5b5olWn0HrGDpohIuqeIqKpzgzafBnsUwdvbHC2G3MPPLl54GAQegzCBS0xTgJ23CXAtU4osVeCYxiGEsvsSkyfRpimexxbdpwuHxTkvFIVybFKwKkcajANmsQcR2bnhKSw1LkcN4SG63jalFLd5lSg811our2TxmZ2ic6ExhezDUxLhmm8eENtPZYdo0eGiXJ4qgwPt9ju021uJYk6xi07N4a+6gdb1Yq032Ly7PmqV7Wq6xDvdsYLRLLkxzEsub2GYxh+WT3WDvQZABeNLJgRAnXDDVN5N6ldflHdoMGLEdhtnsYnW3ZKSbln3Xnsi0XnDfKjbPBC3R1Xsj+UBYdiMvh2zDmE4ttBfhs5MNPzWGyII44RtVtcuVLGzoqpVFWqcYpJxcZxvBJqdYbmTwbCMpsydfuyQMlFoNf0FKcVpDpp7FUqX7SgnnBde6sbW00AfBP8AfOImwI3ctvVVhsSUQLCq2dU4eHrGpiWeIPCzhnu1t5t0RfR3c8VbRC/OC8CmP6lnpZ5vMEwym96hARaoXmiWrp+KKqfFxrIzBbo5Lgo0Wuny4L5Rby5ygSctMtFMtvBL7/D7xCW23ypTjEspatMFOgsdOaz7iZJRuyqXWr4V5wfjCtdPdBt9l1ttMsMsLbkQd3Tx8fOBmW2Lgz+vzG1IBaKiiVedU18aJA0uQi997l73btrwjbyZhuG4eZ9Em5jLOXdfIVazKEttFJVp2R1pX1iTHZ0f7IyQlYXbDs6fD5R3FcRk3WxCQlik+qFsxV27sjvEi/iKqqnLgkVIsvHLq/b1Ykg181hK+MAy3kigqTkJia+4C7/f5fOB2ysh7r1xnlq4IF3SOv1iBkoyo52WbrYW8Sv5xILcpvd7+P8AlzgGwvCJZhgmXibK1VDjYVyfWHEgPmG2+01cTfKHYfMkwf4V+cRA44AaDwXjSCEFuYNx5vcLioafkkTI4PaNifadKSuY0OFyzEvMS7bLzXaV2zvqa61VeKcI+hPYPiuG7RYJtPgMpmdHcYV1ll628Nwhu03Vr5eEfC8q8UpOButuABiVvEC8l9Y939iPtIdw7afZ+RaalJRnpFjuU1Zm5hU3171EW1EjzOOTTKx6PCP9Ny6202F2Jvf2q2x954C89LNG3geFtB1pkOjjRnUcpbbl+FdI8jxbD2JZkpvAn5mbw0zRsrwQXWj4iLgpu18FTQt7hwj6B/4hNo/e0jJS39CJt7CMIxA5ZictIw3EtdaOnG4rSRNI8+e2Yw/FGJXGdkly8FxZRwzFpQz/APp0w590S88sjttLku7HPTfSDqZcrgGypf0o2KPBJ2WJ/olz0t/ey1PvGh5kNN8U/CQxQ4bPzstgLzGe5MtyrofZnjvYJotOyvZoXMadqJMNn8SwXG8QcmZl1uesIDLvC+3Sn0UKRdbSNYJiU50vC2nmG56So81eG66Y3XUTuo6JJTwIYX1T6H3L8g+LYQ3M4JLYzhElksnLq87lO3jaJWkXiJCVEMfxCaaFpmcp8wcfFoslq1DMQ3Urw14VWJNl8ZncHxJh2RmXGeuS6zwXdL/pIkiKYemSmX+kvuOuI6QETpVXRaReJnkTSp/4e7Fm9NuPm2TpXEAoHZRNE4Vpx9V1itzs+6ZffEnj7QWU4UROCU4a/wCsSk5/dXfxcYxZTVWLiX7DZZouXDXdKqjr3tNFg0Xt+KeRdIbrS7u96QSy9ccYyupvDaGqkXNwbe1G12bd+3tj3QH848/w8rrY3myYddb3jJI56kaHRTk+hPZWBZrd3wKv5Rb7ZzOUjvmOsA+ywerdeLk3Am3U4QmZD3a+cTUnHhIjzMycsLnxk/EGCxw/tmRM3daI5REVqNqq6H6JGQxiYGTmXHBfF0rzB0uI1u4p8SLxiyx4iblhdLPzDrYZFuqKfD6RnZqWmX5B3GJmW/q9uZBp0wdQN4tbRr5etI56S5HpO2IRtpOzeIyEjOkWY28dCdooNMHybHkIqOtPGMth7jnW2/eIN+93aLqqfKLMpnpeGzeHtYhkSO860y6dUIw7I6JqdF46JFO2y4+GYL+YS6EPOkdadpztubSc937Qy3vfpctKZMs45PA6do3gFRt8b10SKHECf2Z2PdxTFn3wx7EwJ+jR2O3OjQAPwBA3lTwtSARem2MNfwnIbYl5a6bxOYdavywIMsBt+JLiIU5koxj8YnndoTfLDW533fhrVSJ48wxCtMx0viJfDglBTRI3p8N0fFznet1fJSliU9hWzDuHykt9qxU+kHMD94kq1X/CinvfwpGMxZ0pWTZJ4uumiJ9fiEOArXjrvLT5x6HjAN49Mi3Illy+GyPXOzdjRZV33ZKOhVLQU4rFJ7SsSkcQx5/FMNwZvDXnXW7JQN8WAAETdr40rHdRqXY5KtOymZl5CbfZ6TJSLz7LCIl+TeO9pcXJPTlEGNSMyxM3N4T7vZO2xrePgKVUVLXXjBk5i2JYq86+/Mk3YADkgtBs4Jw0XzVeMR4wz9mw1uUk8uYJk8503r84rl30HuIg6fnHVTj2clSY+kiTCp6awc35NsZl4jGUKVDrX3DWp5gt0uEaJS5OekZuTmEk5i85dt/iitujuxdYfPv4Li0jiWCz8zKT0sYuNTIFbY6i6KPOnrx9Iq54Z3pj7j5dcbhK9w7SrVeGn00joQ56gLMPLMGrjn3i8VhiNqblre/B2GlhxT1cUJ/oneyRHNpr2a7teHGBpU5ZM3pDThqra5dh22nyVdFqnlGpnvuGYbOOMnKMzcr0mSZmM42bKZnC5FKleCQLOg2k2ZABC0aqYaU3V4RFmuNGmW+WnBRVUid+bn3WwJ2ZeIRbygqfcTu/nwhBuaHCtjsdxqQl5mRVmcemXyYGVz0z91vMvtLuWj2vKkUcww9Ly7kubQlvCWYJ3INK7ummqrHJNG3ZZ9ybemUUAoxb2b1+JV4JSvmsAARAu7EplreRvjpYcFqH1g8l8oklhmDfuY+8rx0SkJxZh5vMO4229OGg15eUEnnTrIlmMLkBliFBErU15Il3rxiiYgFZMEUxcu1Tu+PL5RaBKK6wy2/NtsLYpl0hxLBHlRBqVV8KRTGNh23XekFYf0LpAlN3k2KKqgK23eA15V8YTQUs+C82Zn5CXxeUcnsJZxfLVerutR9KKlpV4+S6LBG2Uns9PYqU7saLrGHrlgkjMvXTTZIA3qum9Url3a+kZgzbZmxdllWiUJL05wS7MOTb/S3H/tzj12Z2dV1uVU04+ETh1ZF8yJXGYG4jKtsZbjTme2Wl3DeTjEctNOyamKZboOIl4FvCvNPmkaBjbPGpWTn8HxMGp+TnHkemWZlpFInRFRE7+2hJXksVEmuBG19tCfB3krJAo/RUr+cOJn6oItET0yVjaCp711vlxhNnYv6+cMh1CpdGhmTyUpMzjwsSku4+6VbQbBSVaJVdEgvGW8HBuR91zMw+4UsBTeazl2PLW4B3luRNKFpXwgFl95peqcIPRaRMxLA7KuuJMNI6BgIMrdeda8NKaeawivAJWLLZ2bk8OxeVxCew+XxOXYeEnZN4yEXx5iqpqnqkLCJNtx4ZibRrojZ0cvesr5aIpfRFgArV8uMGk6BaY1LbBZPFZqYnMRwZh5oZBoph1xo6ZLdbe1/Eieca7ZxrBcBxXCJrad+WxSXzU6ZISrhZzTPhmUoK66CmukeetvOgVWTNv90lg4MTn0mftcw44oEu6+mZrzqixjVpy5tRqKh6BtviOyU1tHNhs9s4UzJPuiEjMTM+eZYvZRRrbVPPSPP5wn5WcycvKsPsaJqixYbK4o1hOIy+IDKymKZDyuHh88zdLOtild7e19IjRlufWdxmZbYRpCzHZdt4GFS8qIjQrW5E8BTRPKJpphoaVanM1BJzEJ0bmXnXVdA1Q+sqH0TSCcPxOWLEgem86QbsUXXMPbRCLw3VVE1XjwipcYMAzCAgQlWzzpx+kWLEuyWHTbjjbjAsgKXZV9zirVEr3Kp68I2lVgwhmY10pj8zh2FFgGIsvS44k4w/N9JlhVx0Q1bcFxd4NFXhovONPt5sfhrGPyeDbH7UTG0Sqyj8vLJLA662yQ1sIeOYO9UPnHk2GzjBzMuxiwvTEk3pa0XWAP4VXw40XSJ25yb9+Mzrcy4ZiY2TFygWnArk1FfOOeaOOp087KC5272UXZ3GFaxSbk7pmVGaZ93WOtb/AGR0Xd804pAcpJBJykzNtz+HTjLbws5S3Zh3DXMEVTgnjVNY1W2RnjknLPuYbJSTkg0DE5k2i68Zftj131LmaaJzjL9AxBiTcFhq2TmiDet7dhLSnzWBJZkjIHxV5xgldZkcRlGJZtHJWZBpAbM3bhcP59lC5eC+SxVYbIOJ0liYaIXAQ9wlQLCHjdX9Is8VCeacZcm3czIlwL7SW6QpwbH4vTwjXz+Nym1eyWIPYbgY4ZNM5HTsmYuAmUOiWidTohqK9rd4cKRGbJHuJHhFT7wUMli72LYHM4PjMzmYcNroPO9acm7S0XB71hWiBDy0WKLZvGZvD8XR+W7RgTLwLrmtElCDXy/NKxWzjJBihMeJU3NaosXWO4Y1hWONTOETrOKSDbo9HeNjLzbURd9pdUT14pG+EWMc2vf0aXaB7DcQxLp0tMzLk4bJHMBMU7Y6XiXeuG0vGtUj25varH2vZphGDMDmizMsvu5JXi63Y3MgP7w848U20PD8XeY2iwnDW8PlzoEzKSzRizKPcVbGvLnGm9j+K+6NuZFibkZt3pTX2Rq62mZ+1ouh1C6njHnV1yo5eY8HdSbGrb2L29YaxI+0XF8hq1mZdGba/ddFHP8A3R5cTPe73w2/zj6w9oezuFYrtJKzrkt0yVn9j5oMLcdC299nVs/3svhHy7iDWUcTwdbJYgOKpWa5Uzks43a6TWXf2N1URfSBmx3/AP1RcY1jeLYjhuG4fiE68/J4a0bUi0fZZAiuIR9V1ioEhvj0VOBvgMlTte//AGifHg323fjD9Igk1y5kSa9RixxBvNw3N+D/ALRm+kmi7GWcGICg2YCBHI6EkyYttmNo8Z2cnDmsInnJQnm1ad4EDra8QMFqJj5KixaTm0OCz0zmObOyQXce12ua1BR09frGSiy2dZZdxhjpLauS4FmPBwuAdVT5olPnFN7JW89J6U3hjuHbAPz6yUo0ziIhlBKnaTtd4RNSrwFL1TklK8YyGJzktiMgzLMMy7eT8c+699BKgjE+MYoYs4tLTA2Ti8sy8WxcJFJB+GgoIRH7O5F3px4hkMOWS7zrLT9LXcsVVdF7SJ4c10jnXpWXY3ezNCrsEY/hL2y2z5yk9ITbE/P2iCuIgiQpvEQcVMeyla0X5RmsQmRlmXcMw6YcKUdyTer+0dEP0QiOkbCalcIYwLFZrFsYbGak2/d+HyK1ddcdLecdpwbBOHqWkedxtRMq29hQ2JmgCtznZTw5xyrZfEPhzjUxDMORgjJiYUW2z/aWXWly80ReCxcTZ2LOLKynRGnzyujXX5YW3W3FrFaOEz8xMmzLy17mcLOXcN9y6Ilta6+MW2DYJjExMzMk/KPk8zm5rSiV45YVJFTj2f8A0xmzLHk0VWnwVeJMzZi68K5cvJmIABOahdrupx466cIeU1JHMNTTOH3TKhvNcWr/AIrePnbwr5aRe7czSI1kLJsPFOAzMNzh6vC3loiNoqbtPHSukY9tRBpS7RLVKW8PNF8YVN81uOomDYkJrHRKze70NG3vQ8kACTvaJ5RtcxI1SEMSuOqe8dVc+OtYdnUMCabFu3+L5rWEA1sHHTtT/aR1t5xm8WnFsPQvAk80joTDqPZmYta+sRqm5d8vSAYbNA2dvW9y8UVUX+HTnAPf3Ye8y41bd3gQ09FiZTymx7O+GtQ8ef8AqkSMMlTanW8p40CZ/vTO0FHwpTjzrFx7O3Uk9vsKfftcZlZ1pxy/eBRE05c0XwjOFLKcuMwy2tO9vVi4w2SmSw2Znxc6xkK8dfD5U4/SMKtsZ+Tpo3yjTY9bwz2sbTYDj202IYJixP4fiWIzN4XXBvGtp2d1beBRvvZx7V8Q2mZcwvCZHB/6RdGMMmZZC7EvMHf78eNhbp+sfJ0u9MCf2ciQ/wAPGNVgU09M4ixJhKYc28jggs5ZvqVya1RaUr5cI561GMPsdFOp1fc9c9q2D5W1uLu9GcDGgnJadnpSz7sH20v/AP8AaWvhdGVwUpSW2hmcLxbM6PL5zIZPaEx3hRPHeGmvxLB2HzM67tP/AEmxnHel4sUwbE/IutU6Qwo2UbPs8B7K0ttGkVOIYa7JzL+KNzMpiXSrzlOgu5lxOV3i4KFK8F5xzmxkc22ZzGyy7DvH5LVIMbmHHTcfmSzXHSVwyLjcq1VfWI75ZvpbD8jmTFotgeaqIySFvLRNDVU010SGZn7Pdtur/tfCLYzgJvgzDZkQmRdclmptsO006RIJVRU1VFRfPTmkBEoiy351Uht+nrWOMnbvRkaQXDLgiH4e9BciW+PeioZd/iiykV3/AMozZTVWNZh5fCXd3o3uya/bG7d6kefYT2yH5R6VsKxmTLbX4o4K2x3UtZPo32cM9H2ZemPj0jJbbTgsZtw/ejS7w9PBY3MsgYdsXLt9m4LvrHju3GJSxvP2kQjbuXa1XSqeXPWI4iLQieo/uZcN1VHf5/sZTGJ6SamR6WL8yyHZynbeOtKqmmsZDEpibmmXWhmfsoXPlLCa2tU0vtXnTSvGLDFHG+r68XrhRbt5La8QWvNPFIzWMNCMy8JONuZRUEwOoL8/CKpaG9UPlwbamWmpt8mhtTeaoRJVNF40gzZ1km8VzXczJk75iYDxRvW3+IrR/iiHYvD/AHvj0pKC1czmob292Wx1NVL91OMasV92bPYliWF/Ypidm6M53GWaU1yh1766nXkgVjVNWxMn0W5kfaZiGJNyx4RimJZs9OO+8MWsHhMF2WyXvZY8uCcIxcrIE7hTjDGF/ZXXgsnniMcqlajVNwbq1WtVRE0i3wXBXdpds32s+6RlgN9528RUmm01tu0UlXgnisCPYvj8thctg9kxLYVMzAPgxMV6MRAVM0vi/EqecexUx7DyqWWWclTjWB4bh3RmHcUtml/tAXC0l9tyERnyt1RERV3qrqsY/HprD3HpYpR2ZNzKrMG7QetrrZztpb2ta1i32weamenuObRSU6505Zizo5Zj5nukYrSiCiJ2VXwpGbnMPnWwb6hxtt7faAw33RTvW8bUROOiQ6dHHzcVWtnosWsbn2Y4NJbUbVSWGvuSksM11Mwd3cL9pbwGnjXjFh7btjsL2R2lmsHksTlXm2LRzFMqufh0RUSnMfGMCOJP4JmFKTbbnTGjlekN95u6hW80ReEXvtCm5SbwTAZ1h9xxyYlPtKG0oZToraVh8DFdFqnBdFjLFs49Gma8uY8nn2L9Y+WXl6araf56/wAoIlRfGRERYvcmkVAqo2EHBfNCuRFrpwgWbl8166Wucbqgb9EWq8v9YDbtuUcyz/fOPRjWDzr2k68y427a5xX8SRESKBqJcosSksRm5J/Fm5Qjk5bLbffab3G1XQbqaIq058ViOfLphvzjbDEuNU6pkbRpwqiKteP6xcSRKkEwec4bgNkDV3jdTw1iFslA7vCHOtuNLaXr/rDphuyzdtvGKJD38VcmHnnXGmeuuU2qWtIRDS8RSiCqRXZZC9lluFWm9pSI6RNXMo3u15Lw+UTaw733JBVvJcZcIrhKo2FVCXh6fOBoMk5TEH5n3dLMOuPvaZQhUipr6xO9KTcvh0lMOSzKMzAOGye6qnrYtfRU4LwrWHcLSQtS2Zhr03e3ayYiQ1oe9Wip4pp8oiGWcJhZgbTESoo3b3040844hEDJsUvzLV9KRJe02cqVc0URFO3q146jX+cVYm/sazNvMTOexltl+4hInyWsFyzeMTkpOIxnOS7I58wg7qW1pcqfOOrNMT7v21tzwzQ7dOV3IvyWB5qTcBMxh7pLPxhy/eTiPzhaj0D3tmcZTDJbFLWHZWZPKbMJlsiv+EhuuH5okUpibbigSUJNFg/CZ9qRnmXZrDZTEGmTqTD91rn4VUFQqfOJHglsTfmHJCVKWeJ1SalgJTEW17qKWunnyiIy8ltjPaVZIQrvDSuvyjkEzTE2E30Z4SV0bQQK3+gpSv0hT0jNyM05LTss5LPNlabbo2EK+CouqLFXMwVYeaWHulX0hzYCQl27k8Arp5xHDHsStqFW877vnb2qRZzkxKOyjIysnKMI3L5bp76m6SEq3rWqCSppRNNIp45Eyo4aw8i1TdspFyi4auClNG70rE3l60Hrlt3u0JIvNON3jpFKil9YJZdlxuzJVD6q1KGqUKva8/ThBI1BYNw2cmJbPZYEHOlN5JAbaHWvhXgteCpqkGYVKYfMTFmXic0g2mQSrQ3ICauLz4DXXh4xXzosJMuuSWaMvmLlZpipoNdKqnPxpBeJ0C0xqF9CfYOYl0aadJG+uvH+z0XVKrSipwgAMke1mF6aRcCfTNnEaHDnMxh/rJtolLMI+yjiL4UKi+sQyGBvPzLbc3NS2GMmJHnTR2olvklSr5UqsTf2Vj/SPxGewmZD7FhyYY4luoOEdyINF4rpVdVjZexXZmZ2h2yk5bD8UwducX7kZ+mU74iQklFSldPprGdwzZNrF3svCsalH7GScevAwIbfhGiqXy/KNT7PNl8PxJ9qQYxHp2IHdayAI0w1brmOuuUSzTWkcvE1FhLRJ18NTaXyaCHEMGxDCdsJ7C5FjPmMPeJsiljzg3SpUSTiH/aPZfZR7OHts8AxJluSbYmnaPgyfV5bvMhr3STiniMeKSczN/0knZnCWGcNHt/Z7mW2R8dV3U8tY9i9mntkndm0YRZ1+b3CM5iZ74pyAV7I+uqxhUzZYt/7Oingszff9jG+2zZeZk8YyJlqZ+x0ZZlwaoLbQ+dKIparXXWPOsJxB/BcS6TJN2srUDadOtzZaEJL6R69trtPi22m2Ry2Hzr/AL0fPqWmiIgmLtRy07pKi9nh4R5ljobQte8pZ+SzXJV0emk7KI5kmhKiXFTcqumvHhGlDswczr9+aFzPMt/0sY2vamcNYcelvecm0y0INuuNlYUvYP3Z6c0oq+sYXEpzpVvZbyR/xJXT/t5QTszjHuh8XpnD2Jl5l7Nsf/aAqWm2SeCpz4ouqRzH8CxPD2pLE5iQclsNxMDmsMMzRzMZvoo3JzHmi0Xy1jen0tb9DnqtkuUF5/TAmNj5TBG8PYbbP+2GBFdMqJ9WZCu6LgiRBenaEtY02x8tLYLtPs3jue/OyrUy2ru72pcl3CHw7wKPIh84weCymH4nMutYhiEthbOUbgEbRuCRJ2Wkt1SvJV08Y+h/+GPANntqZbGdl8UxhtyXABdkHsom9/vW3/Kqc45eL6F6Y33OnhddX8Hqmys3gLns52NexV595hiffbEf7lQI26V7qWnrHyP7T8M9z7Z4vg9tvQ5x1ii8aCa2/lSPe9nxlp7CMW2Zm8caBtjFBYl2z3MwZi5onB59tG1jz/8A4ndmZvBtvGpmbXrsTw9iZd/8xAy3P+oa/OPN4LpqnZxUdH+ezxCaa3I5iEq2xMudEcz5dr/xFihmV52rqmukWBXMGXVtlcKpvhdSvPyXzgCaK5nK3e1W63e9K+HP1j3FPIawxt3ci5w9wTZJgv2o0iig3DXrD3hzPw3KiflA63gSNaQLEGrYrHBjR4oz+1+P9ecUbwQUmG8AlI0GxTJTM/Msi+y0XQ3nEzedo3Wp5rbSKOyHyT70rONTDP3jZoQ89UjZoyixms4zcscFUpzH8yZbbcB0yJ9XVtERXtEq8qcYuJLEm3J9tuSebCXljbqbgWq+KEifwj+H5rVY0uNTeGt4ILDmCtuNzthTfQJjLcbeD9k4pXXUUq8ET1pGLnhkmpM3sOw19pM1GxdcnEc17S7qCldIyic4NJ/DkgxFr3ttAeQjrpPOmTlm93lXd+XjFVOogzBCOXQNNzVPrz9Y1e3Uu9KTdz067PPGyIJMZWUNiiBbopytNP1jHjGtNrqZVlswt4t2LDD8OKexGVw6XVsZiZMQRXTQQGvCqrw8VjmGyzRWzMy8rUshE24QJcVbVVEp58IvGAknpbEMakZWYDJonXb4opchtTRfMv1imbQlV1B25YcP6TODOsGbJ2E5m0Nwir92PaVPE4HwrajHMMR4JHE5uWB8xM7HFru1RNePAlT0WKx57cIXWbnq9tf8ojlbekBmFaNdVUbvyhyqtpYUMyze56rs3szhu2kpNu++ZDDOgYZn5MxeRO5fcZEUVTrxpHmuPEPvN5ps3DbaNREjayyX1Hu+kOlsSclUNltb2rlJouyQeaUXSvNIvtm8O2Tn5WbfxWfxUp5KZMpLy4rm17RZilTd40pr4xzIvJvfWDpdorWtpJkWWnHTy2wIy8EgoZccjMezkvVEb3NPPXy8Eiz2mPAm1ZYwWRxSXJq4ZlycdGrteG6KJZpyqsH4C/PN7KYkki90qTPSdw5QU7Bt3ZjhpaWl+ipw4FG+elzDDWxkKQfOPNrLy7AE2eUHbFmw6lqokvepwSBFDcWvbuhplev5cIszOCl0dIypbyhxNPb1zZbna04Q1sbjtgGEt2iAFunoW5z+cRG64+8JvXOcPonJIkl2s9MlsbXd9SNTpVEGtKfJYbKy7j7zTbdpE4dopWn/AGiStZC8LlnJyZblGyFq8+26VoiniS+CRtNkcRYA8SlsQ3pP3S5KiLIW1tISHTxVa6rrrGUzJZiZkn3ukuk29WZHsroWiCX7v0j0r2GycticzimFzOG+8HJ9nKlxPeVnM0J0KftB3PKl0cXEtZMjs4aLtieWqyMub4176tp+7/rGrwHDJdyVYnVdyHJiZAJdqn3nEXRu7hDulReKRL7Y9lJ/ZPbfEcHn5ImXpbLPThaQJQq+CrGd2WeYznemtvus2lZY4oow6vYdX4qLy5xWXMTIduW+J65PbNYlhmDs7TOyWa5NMliEtKO7vYJEJ10V3ssT1RO9+7WMLikrM9DfYmR59Olyt7h/eDpyrRaclEo9G2S2vm9ndkcTl9qMOdxmXmpgTDFGizJyRmbd0qn22jDuLoSXQDsTg/8AS05vD8ExSWxCesefkcMGyXzCMKOCgn+G2iIvdjmXT5N36vg8wl9zdi4lcLYdwqexBzEG2HJYG8pkxJSmSI6WiqaIqJUteSQdiGxWO4ab3veW9zNy/wB8c6Yj/hBFUjXyH6wHimJSj8m1I4aJNysv3jpe85zcKmieCD3U+cMzAr+z1v8Ah7uvD+cTvHmG465b1u+O6iJr+FNB9Iri3TK0rvxcImE9y2Iku4bLnvj+z/F/OLfD+x2u9uxTMlufi/KLzBwHeuK0kpu28fH0jJjVDU4K2Q5fnHsfsskCmsVlmx3iMxT6x5VgrN2X59mPon2C4ZlzDuIv/dyrd38S6JHn1FyaIO+G5dOWNzt/OA0x0MXRbEGrdSpwSPAdpnXwPrB7YoY3eC8F+aR6H7QMYF15+64i7geP+0jybaKZLobsy7llmO5Yb9Tbon6U01jCWl6ksaUU5VKFASeaawebzMwXnCBsOqqJDWpby8FSg0RPOM7iASw5GU7mXtIZDzbPVFFf105LHMUnukvZhcrUtuWmiU5rxgrozE1LYQxLTOZNO1aMMmzK392pd/Ra15cI60S0GLvebGo9mr2KYPjeHtMYa2574S8De5stktVHyv4qvwxm8axuU2l2tdw/3gTGHy7xdbYp1LgrtqdpV4eSQFtBtALAYy7hE8+42duGYc7325MV3iT4bl0/jjNYeQ4VLMMDLC/iU591Y8lzO/QswOIl4IvrHd/D8vr8nFzs+nwe84FsBKns1NbTvlJdGl2kzGpX9oYjpovNaoseQ7ZTe0nuRzDcQm7cP6Q39nKhk2rYrYA0qtqCS+VY0Le0vS2Wdm+lvMYaNzbtm9mu2qpPW95buCeEeWY1jD+H426xg07N5l9ktk3CRCWn5py46xz8Oj8w6a7pCGRx5q37v+K//ekCTU/N57vSs9yYNvLueMrhqnFa68NNYv5xnpWdhczN4ax0ZVPsda4a6E2hpxRE5EttYyU2hGJTSO1zTVLSO5yic1j20g8Rp10JcTdFw2skt0GxRNyy3TX8+fOCTmsQnpZqQzXH22r8oCPcau1K3kNVTXxWAGCVqYlXyJluip3LqU5knOJWXBziJvecE9y3QV14xVicrlhJvM4pL9FOWlpY5aUoGSG8+4K7tUrvEtaKvhrFMIKFsw42JtXfFx+nCI8pTdMWd9Eglhu8/s9x8OWuvKnr9YuxDNcGCYdBo2RdcRpyl4XUQqcK+MHsTTaYF0YjdJxt4jAMoVBBIKEV3Gug6cOcCYjLuys47LONm2bZqKgYWEnkqLwXygaKsRexMTjayohldahfeX93wp/OI3HXHFq44R8tVrpDYc2dilzqKp9YYh7IChp0hDEDTQv5+cSyzgBOMFN3OsAQoYoXaBF1RIlbnpo5AMPcebSWbI3QEgTtKNF1pXWn1gZlQpa9mWa/IoRUE0wbTM8eQ5ntdw13Spy9FieRcl+kyhWi7lvISsvLaLg8VFSTx4fOK9wCaKhJ5wykKw5Y1W0mL4fN4s77rwVjCsN6W5MS7PbeZbL9lm8SFOUUspLvzU10KUYKYVauNh3iREr/AOlOEdexvFH8Nl8NmJtx+Tl16lk1qLfHs+HGJWX5KcnA6R/Vw3ggmyCkDSc1pW7z0XjFs5OMFZXe6vSv+cGzDE7h0627OsuNk51n74quuqfOC2pIKPPSRFMTQHczkCihYNbzVF1TuqiUhjRTOJBLYWI2M51WzNF6pS0Le+HmsRmVCETsyrAnkNs5b4KHYRUL5d0k8odIYPNzso47KZThBbcGaImlfwlRV9UrAzrczIT+X93MMn/1J+scW+aV+ZcmAF265RPS6q600pF77E7aSXmKzWEuy2fISUlhDjThWyvXG/oKKh5i6ceCaUpAuze0OJ7PbQNbR4eTT80F6H0toXgcUwISQxKtyKilxgTHcaxTHJ8p/FZspqaJsWycIUqoilBrROSImvGK1UiYXQbNeS0BMMfw4laV9vEb+xu5RgvhzReCUXSAWX3Jd7MERRwdOHDz9YY3o4H3f8WqfOJBVmoI8ZkKfAiJ+awAT4viDmJPBMOy0s04gIBky3ZmqnfJOFy86UiFthwzHd3i7A/pEjjM1IPskrdhmAvN8FW1dUXyiz2g2gcxlts5mQwuXeRBRx2WlkFx4hTtl5rz4VXlE6xtGhWk7yUSj/rD3mXpYxzm7bkQxuTQk5L5pBT85Ozh5huVRCu1ERGtPDhDSms0cyaNyYe7IIZbojy/7cIcXJmxDLzD7CuOMvuMkQqG4SjUS0UdOVOUDQQLbz2Y+2zUW0uO0N0UrSIYoQZI4lPyCODJTbzCOW32Go3WkhD9CRFi0xPF5HFJaWadlejPA6RvTApeTl3FSJd4vmsZ+JZWWfmjsYZJwvKJZV3KVp2NJJYO3MPP+58Wk32Wd+9wujuU4cC/kqx3GMOxbZzaCWwudlpmRmhyyLNaUSW7USRO8PNPGDMO2bkMQ2hlZSRxSQk5eZs6qcnwE2t3eucUUBFrWn0gdzF+lT7/APSCZn8UFiUKWkgdPNtQV6sLlWogn4f0jm7m9nZ2rHifuWu1R4zJyDUtijjbjjzrj1zzVky0gmqb1dQElW62MsziTjU40OaRiAE3byGvh84tMIxttMTLEG52ZkZphpDlryR7fTSikfdtrovpAWIS07Mzjz3u1wZ29Zg8tqwMulewnZ8a8IdOMNGM6vX1KXErjz7knhsywOXNYda3e1UXFBCqK3JqlNUrxSD9tcefxWQlsQbfaCaxDOSbdl5gyffG/QJpOBHzRe8mvGMGszbKZTaWFeq3oS3Ki930h2Evvy80y7LPk0828DjRJpaQroSL4osU1GL5ErWm2PssMQwzGmcUaanWy6RYC9a4haU0Fa8Fp3V1iV6e6dlsVcHLMrwt6sELtGI9zzpxpHo3tmd2bcbwxlrZ6awuYycx6bmN6ZcfIutSZ4367wuJxSMDOdCwXFpdGJt9qcC9udILHW7TGl7ZJ2hUS4LCW7WmxUxCzK30NLtBhGCYbsPmSDTs1PMTrkv70CZ+yTdC4MAo1KgqNeCpdFl7Kcbm8On8PYbLLbmJhq/0Q0+fCsZPZK/F3ZbBHZ37PNv3Ay65QG3V3M3XglO15ReSstN7D7ZuNOTrbeKYfMI5Iuy1j8u84P4uCiqcF+sTNG6yl7yVzpVoZYtB6ttdKy23WK4viGx030uaw10XTayrHJtu7R8E/wAKKP8AEka32/YN/THYfC9qsJw97pUnaE3W7dB4a6+QvISeV0eM+x3apvZ/bbC8Qcb+xzDIyE2Jn48DTmlCtX6x9q4HMyuL4P7wdZ6H0gnZHFGO0IHTtJ80u87o8fiFajVg9GnUV6eUnxN7Zdh/6DbVOYNnuOt9GZfvMaVvBFJPkVUjzaYbj6o/4mEwvbDDJvarDbszCJxvDTPLoD7JjcDg/OqLHzVNM5h297u8kjv4Stmpx8TSxkqJMBOZbbJtx0SruNdpdNKaeP5Q5vdhoo4J5jRZZB3hK1flzjmYVlpcy7Vuv1jsOUtBHPkya+Y/KKOaai0kZizu3fyiwlMFHFMYlJTpLMm3OO5ec8tjbZKi0uXuopWpX8UZdsmvdBkN0TG7s840OxmF+8dp/s1rjEmDk2V+5uN68PNaaRT4zIzmH4k7h87LOS00wdjrRpQhJIstlcXm8DmXJmUyuul3JV28LkUDSi/PgqLyVI1aenQzW0NqVmOzDr2MTL7q9YbpKdN3WusXrMkQMyMs0wxNuGBAbPbcFw6KpW8UoNtF8lgnFcGcd2tlcQeDpcniDPvBvozS9b8QW8lvS1fCOYBNe7pmbWZ38XnAcbFrNy0Zv7RGXKqaW+EJuzQpe/UH9oBS/Q8IFXCWeYbOXeFf7sFTJOnmC8edEjMOdVL2375UQgt5ceP0jTbRTeM7Rzb+1GKS2e43lZzpBa3ligtACClNEQRTSMrMuZrynbanJI0o9tjKt3SwTheJTOHOkrGWQmlHG3QQwNPNF0i/2l24nMXlklJTCsKwWU3LpfDmVaBwhSiGaKq3F5rGam2HGAazLUzARwKGhbq18OHosN6O50bpFEsvUO0laoiLw48+MVKLM3sRDssWIq61h5Zdg23X84Zbu3QZg7ks1PCczLlMtUWraHYq6aapwip01JjXQdg2HTeKzzcpJSzky8d1rbepFalV/JI5Li2oC4XVkBfUV/y/SLafkGsOwXD7Jtzpj95zLNluUmlm9zqi8Im2alMNbdbm5uZYdcvtWRNkzR1tU5kPZXw5xEt0yxpCdUKUuJtzazf2pwnHLBvPjpTTXnpBWz+KuYVL4jltkaTcocsdHjboJU13VS5PEV0WPSfbM37NpXC8FZ2KexB0lkA6ab395+un0jy/F25bdKUNwx4b4Up8001iaL81Niqq8p9xktLuToPODZ1LY7g9o/knHhqvKAwdcCthW3cYvZYH8OkWHb3GHJpk9QqK5Vaf9S1+QxU4lIzmHzZyk9KvS0w3S9t0FEkqlUqi+Kaxos3MmjEGIyJVIiJbuPnBMoREw/LZTBZg3XGm8Nuu6vn4c4FJI7ee5+HhFEkt1uUQDqn6xcSEgwcjPOuWuKy0LyWlbuqqJ86KSVGJ9kJBMZxVnD3il+kTcw2jcxMPI2LZKVFvJdERfPgsQY1LTWD4piOBEQ2MzhNl2SW4CUdFT+WixizXnE6EXTKSDC5KcxjEW8OlAz3iut3kTdEVVdV8ESPYvY9iYbKz7DjM3ZNP5L8pPNTyAMvxEmnRppei269nReEYnEdn9m5PYmUxdvFZ0MYmXTlzw85Pq2iaVM3ra8FQgVEp8SLEOyuJYhhmJDM4b1bgAQG6FjoWENpV0VKKi80jkrxzEmx0UrU39nuX/FLgJTabP7UbTE9KTT0g9JvAza7mvNbzI6LShIWpR8/zEqcrMtzbkyP2yudu2CJIaXASJyTdX0j6RxSTwbaj/h2wx/EMdyfd0/mzDuSrvRyICbs/joCov4o+a8YmScZmZYt3eRz0VEoqfT9I5eEeccDq4lceqxupKdf6XL7POk07luFhbhMu1zx+8lzu50qYovwlSKHEH5uRkBfcbbbeCbCwjlhFy5L7t7RVTdosCO4fMyUjLHvNzDzrWV8W4yi3fUhjR+0aZlv6HyGbM9MxCfnDmwv16I2QoroD5E7vf7WNfrixHib+Ch2kNt3KxCSzBl5gd1ojuyDTtNXLyTin4VSK6YxWZm5ZhiZaliyQsF0ZcANR/ESalTxXXziTC3G5mTm5aZmRYFsOkARiRbw6WpTmqF6bsANhmvdoW6/GtqRUaGc6hV7brIiPV7tTvLQiTw0000pHJdN/s3RC2g7v/VBLIFndVdzt9P8AtGbFKHy6ZlsX2Ehvj9VKKbDwujV4Szc9u/xW+UYVNDenFzc7Iyee83H0pKNDs3sExK9iYmxzXfGnJPpHlfsH2d95Y0DswP2aWHNdX8KcvmsbX2jY102bdRt0R30baT10SPNdt5/L/wAndjk0L4jWf+jC7WYxLFnzIzLjE01o01xu03lu7vpHnOKTnSQLKErRCp+VOPyiyxyby3neozXiJEA7lubJC4pTRVXhRaxVzEwX9JH/AHyx7vclmluZGVtXNEd0CHxJeKrF0qehdSp4KaeAXDu6TnvWj2Ozbb6cU4Qds3MPy3S8QaG5yXZJlrwzXUUB+iKSxqvZfsrhu023ciykyw5ID9onAd6pbE1IBTmledeED+1jZNzZPY8XJabGZkemuKRgPadOtg152tIP+Io7KTLLqknHVvCzMHmuIT77QMYFgxN9KdmaWM/8vQN7wrcX5xCzi2BYR9kYYHEsQvd6TOZpDV1QoNhcVEF1/EvlFHhr0yM/0Zi0ZqfDLM/7tte7+GqcfKkV3SH8Kn5aZlMvpANK5vJdlXVHeThdbr5VSPSanlJ5yVJWDRSOJ4TI4O+5PPzLmKDMB0KXvtbstW8zXjottKQJtZgWN7OYbhM3imHuSU5OyjkxKHmpmuMmVBIhTVum9ReK3RVTMrhqyD2IT82TEw1YkpLNt355IW9Ve4KJz1qvCH4hj+JYrITvX5ErOZYFKNFduNditd6iLrx1WFhZrr+ZeXTZvyMwpAxL5aO3OH2xDs08IEmZonAFv4Qs9ErWNJt5spObI44/heJZVZezfZdE77wQ0oqacF4coybP3or89Y7Es3UcVS69JM3V9CzHB6tvS86aJyT68ILw50JACmZiSz89lxtglJRQT4X/AIqeHCI8PZR+ZVx5klZSrjhBu0FONOXlEnTxDCXZBplam9fmmder+C3gmuqqmq8OEVPonbUFnwbZmBVlyqKAn+6qpWnyhgPPAeenar2/P/OJTYIDYSZcbEHwEr+1aNacuenCICQsrtbt6/8AeKJJHplx93McS5xRoZLqpfiVV5+cNdZsl2ns1ssyu6i7w08UiNpRG65u+qfTzho9uGIPmsjoctLSytTBUzXHEaITEl4gqr2kSlap4rArakz2w3XE+qeUSNtG7NkzS4zr2IHFaGPf8oQFhOC30RtW20UU0F3sqvkSeKePhDscbw2WebawfEX5yWcYA3VcZylFym8NKrwXnXWAm3SbvHuFxHlB7pS8w285NufanMvJMAo3TvKVOeiJw8YnYvSTkkmHuYRMMONPOYiTgdGK6gCKVuRfG7l4KnnFey0TrmWnFfHxhzpEdvViliW7nOnNf84tWZqVBvps3IszoONG0TKPEFj1lBd0596nBVRaw9hblJbBbaTs5Y0y26/lgtoiFbR58ItMExZzB5GdccwTCcRTEGSYB2dZzSly5m3run5qixUdNm8kWOkOI2FUEK6a8YNZDSAuTlWpWflTxRwwlVdHORgxJ3LrrRK8acK0iLEpiXXFppzCRmJaTJ41lwNy4xbqtqKvNacVgGOVgsLL0HzWJ4i/kdJfJ7JYFhrMRFtbTsileSQERkXaKHgo0LMuXc3def8AlEdNKw7CvcW7DYtZtmUlsLaFHpaZmZm1xTAjrLjruLoiVWtV40t84rFShUrWCAkkLLyE7ebXX4aRHHewe6UTzs7NThtuTLyuk00DQXcgFKCnySGA8Zps2cuYbqoAqNmGheSF4p+cTYJLYfMTZDimIOSbAsmaG2wrpGaDugiVTtLpXgkVtI6iqkKQiQydclXUlm5eVVhW20F4jdUsw+ZeSeUMmJR6VCWcmG6DMN5reqbwXKlfLUViNG3zA37XCEaXnqqJXhVfOCMSnHpoJZHkl+oZRocsBGqIqrvU4rrxXWAf3BbHLsuhV8Ic40/de4Dm+vFU4rEjc5MjMtvA+YOh2DHtJ84tpp5JHDBrNNTk5NAt5lvlLD8CV4EvNeXDmsK8jtFiuOVbZlEmHKu38MvsiXwkvjGiXCpFAw96bxhAZfDMekgCx5kEp3eyqkmo68OMRSmFbNBsbLY09tBnYp07KmMGySbXKpo4LuoqnJdEVK84AcEnZzpvRMuXM6i01dbb8Irx8qxmzZaGixhrYs9sHtn23RDZk5roGSCOszaIjyud4jUd1Urwt8o7iuIrPaTOHSQ5oNuHNSkut/ZTd40rprwrFW8K9OceZy2H+ItshcIqvcT0T1iyweaYmZaYwZ1+clL5arbbTd+dNj2BIeNFrSvJYztY2vl+ZnJ9qX6Q6WH9IOWFdDdBEL500SCcNxibwuc6Rhz70vuZZ2nqoqlCH0VI020Wx0xsjhssu0GISgTkw4249gbTxdKyv+YqIoNl+Et5K1pGXzpdsXsmUZ6ytmZUya8uSfNUjSGV49wYyjU59BbrxYxMg9Y31DaN9WwmYrYp2yFNCVE4rx0rDJ033WZdhxymTpLuVoGVqqJ/i8ddYrJczbPObzAs7wLwWNDsviErhWIyuI4hh64jgwPWPNaCWqb1q6oJU4cobRbYFnLcAlsYmOjssHvkzuBd3w+AvTl4QW37tm8Hfa6M45O6dHpoTPjXkQKnzTj4xWY3NNP4i+5KN5csqqjI2oi5aLu3U0upzh+A4nMYZPy0y2Ld7TiG2bgXInjVOY+Kc40v0mdoiSVuRmZXGAkJr+qZlmt5zNwW89aJVK/zg88T6VISzTrbeZLBZeJ68d1bfLhpEe2eJuYm5LdIxR7EXpZpZe8h3BbEly0bXtK3aul2qcIWFyTshMo1iHWYejwFMDLPARqNO4uutpekSs21KbXSDXbO4I/jMsM2IuMYay6wE9M23DK5x5YqvPtcKR9PbJYg6wE9sjtI+/h8xlNSuJ/8uZa+5mmy5tugIF6iSR8nyc+1J4a1bMvtSrzt+9UM0Bd8K0JB4/vVj7CwrFNlfaBtGElMLN4ZiMvKHKvTBth1o6KP8N2+PMbvBY4eN4Zq6ZJ4OzhK60mxaTN7P4a7jXsk2/wmdS6eb65LdbnJdd750/KPnvbrZjEtnMS934k2IuOMtvhYVwk2Y3CQlwXSPqbD8IxT2ee0aVbn3M7AsdPo8wjY3ATihaLieNU0VOMZL2+bGiXszwTFWOsLB5l3Dju7WQRKTVf3eEeZw7zSqYHbWWKi5f5/mh8suAIXC+3mW3dkqb3r4J4RXzAjZ2t74P5+EX2JM23QA3KsPyE68++50hnK6OA22uVOhXc9E4U+ce0p5bAEqsaQnRxCWf8AsjbA6LlMitjfLmqrqvj4xSzEq0wzuu5jl/bDsENuvHWqLpHZd53s738MJoyGk4k7mIPuq2zi0sOJtshltZxkJtinITTWieC1iN6cwCXAf6kmXS8HJ8rPyFF/ODpqXz5bPEesHtQGmDEkzIO4xdh8jOArzTvaJwE4Wimuq6VVPOEsjY12yu0TbuAzUtObOSQYG7uZMs4bUzmV1Jl1bl/eQtxdE4xX7QLs7JyHTcE2YxGYlZpzqHp6ZER0/Zk21S9ULWtU9IFlcZflZmTalpYcu1JcpfuOb1CHyRal597jGd2inX5rF6EtrcrVqXC7RoBJaIP+6qsC9w27QqbLH3ZOZzJtsGTY62WAx+7EkXsJ2UQqaaQ23Zh2YdVGXpVzdsZOZq12Ur1iCq8a6KnOlYlkxmp111oZnrJyWccmTdMQGnKpL4kg8NV4RX4ngbsph3vRlCfkwf6M+7bYIP0uy0rvLonGiRa6+SG0jTUrptt/IF7oytS5FuLbovz5wPS24Sb3tPlFpIr70m+jmItCboIFnBpFMR0+sOxOS6HPzjU05vytzQaamYlan5JWNsvBlhfqK0Ji11hzJZ6umlmha97xgzAPtO0ckDyX50yAHU8vtFRd7u8ePKK4QUuzctNV04J4xwU3bvCKmCImx6D7U5aRwxZHA5dvNxbDGcrE5wX1cbfcuW3L/Cg2695YyEg3NuK+zLuCCttE45c6I1ROOq/onGLjF8+en3cWmyuvaaO/xLLG0f8AfKM9bkTPZzf3+C+MLh+yC6/fJx2ZqGXl0oCB9OcPvzAAXMzsUD5RzFpoZ3EX5puWYlRdOuTLhYAeQpVaJ84cTTe70R9x2xoTW4LbS7yJrwRefOLWbGM6mgxGZlHMFudffGcCXaBoKXgQpotV7u7wp5xmJiYmZl4n33nHnV4mZKS/VYlBXkabJ5lwmdUEvKu9RY7iCsG8TjCIA6WBTX+LzjNFw2NXfPWSRejzGY46NpCzUcgEtQk0S5P1WBGW6gblpK2HGnivD84fJ5aXXaf+4eafSHzLrWU43LC4jJuVG9alROFaac40mTOIJJQnHZjLubtBK8gSkaLajokztAxP2dSbYZ34yAEQjpyu0WMkiEFjijovCqaRocPnOqcxSZyJnJyzNp79rvpu056flGFRfJvTbSwG9iGbOZ7rjm9VSC7iS/pWLPA89/HZadwsOguG0qjlO2pe2FTSv4kS6nnSGTWMTM4x0XEpNnEpOWAsk2t0pe/URzBStqEvZLSsM2UynLpR7vdYH74/5hd9IKkdAkm7n0v7OHpLaj2H7Y4JmSi4iuF9Mbd+7uoV1jndvEk7XgceI7Plh+DY1TG5Jyb63Im5S9LHZYh3t7umJ2qipHtnsdw3DcPlsX2Zc63GMRkXZU83cybpV0yW31ERSseNbPyzmJSnvv3zhstikgjQMy8z2pquiIHIqc7tKc48Wk3d6PZqX09lrtdj2If0SwmSYyGsmWNh2YZZFCfAXKCSudqtLUJNOCRitoEbzmG2/wBjLNB87ar+saFmdksQZa2exZ/3bfiHXHk7jHIlReKeYcN0V5R3bDDMCw/Epm6bxp2ezSzWjkQYARt6u1VJVJFS3XgqapHRTManVqY1l4mAfG3eeayy8hUkVfrSkdHeC35xEQ78PGNJMB8qlx/DFyyxbJtv3N752ZXf4Vup8PKvjA+64yzuj1YWbo0rxXXxXWlVgyXzHXhcfInLaBveXBPlGLamq6Flh8vbG62Rw7NmW2rbozWByxOnHvfsR2dbaMto8Rb+ySnYQv2rvIflxWOLiKmljspJ5PQZKWHYrYZqQEf6xnqOv+IpyD6R5hjmNSz55Uzc31u+Y67vPd5rGi25x/p6TcwT90wJ9gSpxrr6JwjybFpkjeblnZlhu/W8uDdfiXjpHMiZSdUdC/MkWJOOzk4QyguO17HdLy8oox6XOTgtlnzMw4dN6pG4Xz1VYKex0ZOcn5bBn328PmbA+0AOaQiqENVTsrdrpDKzeIT4k0Tj0086n7xGvD5x1LGJzs2UhOGhiA/ZpHMF6cdCT3d0t4t5P8I6xo/aIM3tVtDgew+zeKe+XrDOZAzEZYZol3yFfhQdK6+UB+0w5LBpDCJKWbbYnvdzvSHmnus1K0nv3z7AfhuWMNL4i7s1MusYM/054GXQzmQPd3aZniAj5+vON6NHOz+TnrVbdBazuC7HbJYriH9KpyfxKY6O5knhjljbjw6IV3FWxLTzp4R5gz18h0lp1t+YvLNB3Te431XQq6rrwgzEgHGsSlpLDWJ2Zmn2QZssuJx7wAU7vh84r+gYtIstTYyU2wyDqKDxtKIZgryJUtVUUeEeqqYnms0zPwV+cL5k243nuah21TeXhw1Wi8E4Ra4Aw3IPVnhcdm2qKxhwNb760rvL3W/Hmscl9pJfD0fncvpePzjzhzM6dvVCdbsvlmFcVT7vBEjNi8+V+X1m4qa71B/0SKwuTnClyUpjWJyL088yzks1mzusTcIqX07RDXTThFC8z0dx5ubZeamEVNyltOaxbbPyTDkyw7OtZsuWlubbciakiUqXZ8oBl5lAPOXrZhdG7t7yqvnTRIqNBd2simMT+xLKNt9VQQC5VUhFFqvlvLx9IERBNWm3Eyl0RS/D4xJi07NTs3mTYgLjYI1aDaAgoOlKIiRNg8x12W/Lm/LKg9IAE3ssVrVFotvrF2tBnfJiscS0rfCOl+9E+IEx0x/ot3R8wsu/tW8q/KIVSy3eRa/lFEHCS397w8IQcd6tvlBgMyyAjz8zeuYoK0Hatp2qrpDJiVUF6u4qUuQgtIfVP5wrjxIjdNwAEi+7GgelaxGKDdQtIncIukE4WXuL2eCLTyiWXlyxB1tiWRSfOu4qolxKuiD/AJQXCwUxhbI5pT0ykq2AA4CFvE6JfBTRfHjwgWWm8mWJgN3MWplam6qcLV489UiTFn5o5t7p6XvIItrystREpRNNKUiE5dtqSJX1eCYKw2QUN0m1rUq/SnzhLHsqWttoclQJ0yGrd3mdqr6Lw+sWcnhD/SVw+ZfZw/ODM+1gQ8AUg4Iq73BFTRboqZUM2YaZJxG7iRL14IixcbRJKhir3uefnzlQEAY6YYo/agolFtVUREXgicqQN6EtrXkoiWhl/OOGFqCXdWCJoBAxcuzc5u/0JeP0WGy7YmeWXP4deWkWSQqJCIkvPhCsOzMt3a0r5xwv+8NgAUSOC4C2OIQ86RHErjjrq3OER2oiarXRNEgEcIzdVMxz6w5t4gFwR4GlFqKL/wBojFIkmnnZmYN97ecPUtKQDEy8TSOIKB1gWrUELmi6V4LpxiOHMg46eW2NxFB0nNTI4bNyITYsyjtjjwf3pDW3lXS5fKEFrgkqw7MzDcuwN7jhIIJ4rHHGXAfJkk3xK2ia6xLhzQTE41LuTbUo24VpPOVtHzWiKtIJwaSkZuafan8XZw5tthxwHTaNwXHBTdbSxFVLl0quic4PITaxXo64gK2hFYvEa6RHHaQbhnVPdLS1TYtMANq8XCqm6qcKevhD2DcEFSA6pxg9cWnVF7MJp3OpfmNCSqqc60rXzibHp2bxWa6S9IyksXPJYFlCXxpATEv2XXUcybqErf8AJeFYm194He20hWESWJYrNuMYZJTEzMkBHlS7N24KVIqJwRE1ryjSyWK7NyuAzWHzQzc4887LFLTGbZkNj96BClbruXhxgOYnmGJOa6FNjhbZSwNhLyJGeff2hdc4rROKcOSJGUW2/drb5xnhzN9DaKnL21PScVxzZBjZxtzBdl8Sw3EnjKjvSSOWcaRe0BGmZWtyKiaecUjGOue/pLGpaQZwZzDxRwDw64FJ0ey5vKut1NY5sgjs7MsYXiTo+7WzUAmJi8mJK9d5yicl4qKcYup/ZomJCey5ZzJZsDf7Tgqe65+FFTVI46j06TYz5O6mlSqsNG0GgdZkNsdjMbx0ulntQDvScU7GVNNGdM0UpUHEO2qJ2kKPN8QkEbX3cMk4E4xf0nUrv3SBezbHpmy+FMSuCP4NiH2OefZcn8552wWWADczE49pbqceysecvY2UzjczPbTMuYw4/XNdceVHrkGglmcdN3jWqRPCzOTW28D4rtXLeStPDmmcLWZfnUbmSsViWsuzW1uqSlwGipwXVaxWlmClu9SNO8OFzOzbDEtPUmFmDc6O5LolvBPvfNOXBKQXiWEP7K4dOYLtDs7TEnzln2HzmEuYaVFXdFFtNHBIda03Y7oq/qcE0f0Mvdky7Vwc7rF/9SL5/wAoIxWa6a0swss004p3GTAWBr4jwRfSK55d6lStThWJ5JxVrLXCjbhjdctOHnF4+TPK+hLhGJT+FTjOISTmU81cjblqFSoqiprpwKNZslNOv4cLs90aZlWWilgCY46b1gKmqFvVT5xjnXkTqhb6q+/f7XpXwg/Z2ayZkmHnMqXe8eyJ8l/lXzittSd+k1E1gcliWFZmCOOe8mvvcPeX7wfiZX9Q4+Eekeyna1+ePDcPlpGZ/pJJs5F/9+LfY045iBuqnetTnGYwHZ7D8XxJqUxB+ZwtkreuOjrrba/tdKI4ifh5cI9Gx72RYrs9gGJbVP7QS03OSxtuS85LFVjEpdOFrvdmBVK0XjSKeeSssuokiKjRDaGoxLaET2tw/C8Sxl+Wk8Vl2piRmXTq1h74n1dqchQ7kL8JUj1XaBo9p5XENnXpZjLxPDjzTDsy88JXDvcLCXUS/FHyRtZtb/SzAWpubzWsUw+Z+0CGgOi7+1RO6Skm8nCuvOPdv+H7anF8HwCSHaGUmZnZvEGiGSm+1ZRaKFfhry5LqkePxHDvUpc21mjeD06dVUfl3vHg8De2VxaclsbmW5Tdwa3pwkVCauPLTd4rvaeUY2alrMyPvpPZtKTWO4jONttdHxqRclMS+F9C3mZgfxVRLvPWPjbbrZ6ZwXG57DZ1nKmJZ0m3E80X+fGJ4es31aDq01m+Jg5q0gbtEhFB+Ku9zXy9IWF4liUizMy0pNvsszQ2PAH7UfhLnTRNIsRbyriJjM4WkXAV9OenjEM4kpY2UtmNuftbqUu8RpwSnKO69zltYbLzRBaV3COS+H/b+ljvNnv/ALqp/KIWzyjHqGy49rXj/lF7gqbjT5MZkubuRcRaXKP1rziH6dS010KzF1CR2qaqOU1LPs3X+Vql/wC5YbtzgruHbYz2HuD0QTmyyTmN1MoyqLleFtFrVOUXW3WzczJnJYv95J4pKJNNH+Idx1tfxCScPxJGdxraTG8TwqRwudxB9+Vw9nIlmj/Zt3VQfFaKungmnCJpNlbEp4xvkSbUOSeCTYN4Urjk0if27u7m71POiqNb13vCnMzAsJfmMLxXC5tzows5UzMh2jtt1c0/u7kJU40UoBnZjFMSkJHEpss9ttpZO+xO6tbS81Qq1XVflBWyoOsT7b8o6xddZlXpeVdCS3vVRYtpsnzAl7/iQDYLDGH9r2JGffYlpV17oxzbp2tsqXByvglKwJtPN9OmHzmXG3JtXXHXn6rc8RFolOGnH5xqcfkJDZ/DpQcUbT7ZLE+0DP3xGNW1F0a1bElTReNBrTejCpKTL1zxsOdY2TwLSgqiLqWvJNYun1tmRU6E5YIy4QFukSV0XzTwjrYKQFu3U+qefpHZXdmR70Nls3OHJ7fKOo5Dbsj0j2ayzjxBllieUem8NjXa/wAJflGVxyZmZ2ccm5l5XXHF7RDaqolETRNOFI02wKTeJ4biWGy2WTsv9sBvxFRJtxU5aIaF/DFHONTmGSJsuJLG3MgOqUNRoVdC7q140jnp9LSp0VetYYrGWFclnXUUerpVOescBzsCLe+i/X/WJ5JG+nAGeINmqIRqi7iLx89PKGzIPXnMNjutmgXhpvcl8q0jsnaDk82DMPPNZyMwicPcDX7uq8vVYHxVp5h5ZN9ttt6VuacpStULmqLr4ViAjoI0JzOJVvr+X1iSVMqOjUUVGlThyVdf+8RJceiF1smFaK9srxQtw0L5LTgvlCeBtFEW3BPdRa8NV4p8ogVIRUrpCAOk8lbQdud/BdaP15fKHtvcHeiC4yzuKBdmpItFXnWuvyh7RS/QzknEFXEcFQeb8OYrzXyivPS4bucT5H4LXZ6bm5fOYln3W2ZsEZmBTsuDci2knNKoixq9jzlsK2klsbflJZx6WmQVqSda3HfEjT4P1VfCM77PpvDZTamUXGZR+dwszsm5dk7DcbVO6XJa0X5RsvbBNYu/te2OLTfSZhiTlpcHgAQRWRb6vs6HurS9O1rGHEPdsPZ0UEsufo3/ALKcbw2T2wmsPHD7nmXlynmi3nkK6txLx7fHw0jy/B2Jbpko5bum7kOtH+yuS1NfBeKedY2HsFwR+e25wvozm6bTaO/huKynyWkMk8G9yvT0ljctLOTGaUmrXS8uZYcA9HLadlC8eIlHk6U2b8j1NaixcpMLnHX9p2OnF0bMym5y0Lt9sbc1RXvaVXx3ol20myfxV3CZnJYZljslrezL/E345d1Vprby0jUyrzGB4a1ta/sZNzM9OdIDpczMC5h5OLUCEW0SuicRJa1iik8Nkse2ndkZ19iTmnDBwD3hbISFOqL4aXJaXyXxi79WRDduJgyb7Xep8OqfWHthBzku/LZjG83duOj6LwX5pHG2OzGtzDGxOy6T+WJW9UCNjaKJonCtOK+a6xbYfKZltsASLG/G12NwmZxOfakpJgnZh4qAAxhUbGDemstJpfZXsw/jmMNSTfVj23nS4NAnEl/l5x7NtdicpLSctgWEutyspLhlt3nb6kq+KxU1w/YfZ73TKOC5OOazrw94vhTyT848/wAcxjN3swSIhr2q0ryWPO/mzc9GI5cEc1iTtj5Zm7ona7VV/OKOceYsLNbbdccCglcqZK17XmtPHTWA8Qn5l+ZddmS665Ess8qctEpAc4/mvCQtZf4Rqv6x1LTOd6hHOAX3WbmM3X+Gvj9I9Px48H2X2Swb7SPvLDpJXXcpNc+Y3yG78IWp5XRW4TsXm+zxvafEpvoguT4tMZvZJgUXOcLnRFon5RkNuMRlpyckdksEzJts3cwj7xXa1XzVPHQUjopUea2Pg56lXlrLFK21PY5ircziBFmT59TzN3kOWPwpwReEWO3zG0fs2n5bD5GW/o70rD1WZNp6sxNtOaZbxeC07GkSdMwDZ9lvN62acAgl3pd77pxOy5XiQp5U8oz8wzintE2nz+kzMy2pi0D0werp8LtearwTkkehZ+bCJ221OHp5cu86mWbcmZOcam391ztiDW4Vvy7CU5xPNY9iDsg7h7Tsy3h+7MPMg8eWID2UQV51Xj+KLD2gGuzizWAYY7nq51WIPDRRdMS7ArzFC8NCpXwjIyUy4xhU3LOP7zzoXNX9q3Wq/ONkm5lU6ZAJ6ffnZx947bply9xoAtGvLRPDyiywfCMQnD+yStzZjvvH92wnNTXgNE8fpEQyuZiTAy2ZiDj1qCy00aKRL3Epqq8tI9LxeV2rw/YPE9mXDw4JOTsmprDWXkb6FMuFQU01eftTs1KxPOJq1LdpVGnfVjEz+N4XhcguF7NtKj57j+Kubrro0ootp+zbXw4qnFeUZEiLd0pTn4xaYbhkzPszSMJeUo0T5/8Alp2vpxhs2rKYaDRSvWN3UdE+NV7yeXlFpipFS7a7EmGuSUw26eJtPOWNFvtEiHcvYNa9qi8U4qnOGNNnLzLjbbzc3JMHeZIpC24K09F14RFKCw5KONZDxTaatZZfPVKa6V4RX8/WKtuRlsPdJst4d2qruck8KQ1kL7t4RtSusENI25LEOUpTNUtX8PhTx51hk8RuzJPlLgwjm8gAFo08k8IszsPbYdmGcwV4bi1WnBNPyT8o0uzJ4V7oL3jiwZxnuMjKETg0/wCb3UXw1SKvZ+adSQn8HzARrEm03KV61srg9FXeT0KJcBw1o5eYxCelpt2Sk26zCsWiQKW63dXuqeixjU6olTelpMMavb7Y/ZbAJfC52Sx9zGmZyXzXVlgFrJc5tLd3h/NIx3vfLwmcw2RkZdhuZcE3HV33rR4AhLwSuq0oq+kTz86c/LTM286yEu48IJLIe82VuhoPwoiUrFA4BNGQFoScYKSTEdUlV31usWJ5QHJh8GA+8NbB868lgvGla6SDA5xiy0LYK6qcuNKaW1upADT7jNMsiG00MPIk5wcyj7AN4lMyaTEk64Q0IqCRJxTRaiutY12OfeBTOHuBhUpiW6LLxuM9tFK8KKunFEoQ/nBg4tLe5EkHJCWV46XzGSJHbWt1a1QuXgqQS8/ITuyOG4bIDNniMrMPvTCHbblmgUFvWq0sVV9YqZ/DZ2QyM+UdbzmkmGrwpmslwNPFNF1hdLdxWqdpK+L8xgjAsN3tsOFdl/i1S7z7SRA2c0jAsuSyutMrpuagpeaenOJVlqYE/MijeRnNoCku9dQqpTnp/KK9mYmG2ybbecEV4oJKkMRNirbTGIvtsq8oiX7UUEvOqJ5xFMmyeXksq1QEQ9+64ua+XpA8OG2i1+UOxNxsSNuGFbTtrx84jhQxEwkSgLZOELV1fKvjHZY2gPrm8waLu3U1posdyTyM5bUHlVdV9Ei0w6SlvdqzeKq5LS53pKGDada7oi1/APFfomsKZsWqzMggypSaS8zPsdS5vg0RWk4Pj4oi+P0hk04/iU048LKXW3kDQUERFOSeCJEeIOG5OOqUwsxv/e671NEXWImgEjG47R5r4QRHkTN4gih4qXYu0WOoG7cV1vLzhzD7jDwvMlluDwVIYhzTgoKi4F48t63Xx84MwzEBl25mXI5hpl60upOioQ1tr48Yre5CgA0WxeHs4ptbh8rmyx3u3r00rWitqVha1W6lvLVYfjWKYvieKzeJScgOGsmbgBLybVjMuBcWw8E5caxRzUnMyoMnMsm0j7SON17wrwX0iDina8qRP1XH9OMlxPSIe58PNp4LiRzOA3B6skLTzoo0iGXZw6XeApx3pLZt3WMHRbl4ISqmnnFZGgbmMLa2Pew05NwMXKbFw5otRybdGqcU3t5V+US14NFlfRcy+JSkyzJ4O7OzbsnJf2fJZFoalqRqi6ktdKrrTThH0x7KcT9n2HbAz8ltOy87ibTd8t0qhmLddxNOyiHyKPlHAXXM5xiWtFvKr0l3dygTtF8+FPSLCRx0hYnGy+7saARE+4hL+f8AOPL4zhZqbeD1OE4mFizefyNXtljcph22HvH3WLrlxq70h1XRfEkUf4hovFIzS7JYsxIsz+OsOYfhbxi6DxS9xvoo7uUPeuTzpzrFJN4mStEj457OqABLShfEnhT84uWcXw/GMJwsJtZ17EMNayCCYeJ1t2WRaoLfNu1Lt1NOcaUqLUUgipWWu83KyWcbkpwnwks1u/tTTSKNK6bqaJAu1OLLiU+Sph8rJNDugzL32BTwuVVgrHn8LNS93tTLbd6ZOaYlua9qnPhqkV2Mo2htZGYUuQoQX0r+LVPOsdVKLzlMHHVmYiVidAFwO3du0pTvfnEeUfJFX01iWTYffmBbl2nDNeAANy/SL7CJuSlpWblyw10sRXsTDT2602glmDl01rxurpHT5scsxNrldh2HpMsCRzjIcbG94ypzKicPnG42a2blHdkMZNdqJPDWXslp7peHkd29cNpjcQ6pqtOEZbavZ/G9mp9hrFcPmcOdmJcJqXv0zGi1FwacUVOcW2wk3s/MBPMbR4riWHPZP2R2UlxcFw/hdSqKIr4pEVonHQ0otGWugUMltDgy+62p3DsXk2Dvl1l5wTHXvN1oSIvh/ONz7LNvXsK6Tsrt/J4i/s1OPC69LM7hCY8FH+eusDbN7C7N4rg/SZb2g4fMuAeYGHm621M/itF2iFXlRflHNjcYwbYzGym/t7r05nyeHOvOi0MoVthOGO9vVLs8FSFzH9XHgvmbF77XdkdjMSef2m9l+LdLw8G78Qw7hMSw8ytXUg89aLG/9nG2P9AkDZ9qU98bJ2DMNdMatdelHaLmW9ncO5KpC9lM3gGI4q1hO3DDTj2jQH7vBs7V03XW6EtfzjWbX4P7PJ7ZhrZbYjaaWbnJB53o4PTF7jN3baAj1sVe4uka5sv0meKt9R61imJ5OxknimxrgTEuFLAXe6te0FONf0XyjxD/AIgdhX8SwKT2vksuZcbYQJw297Nar1bvqibpeiQ72TTkzs4j+E7dTeKYfhb1ZOYMdGBd5C5pUKjqhpSNbsFtxgGFY5i+xE7ZiGBA+fRpsjE+rPihU7SeaR5PG0MamaToehwtWZTGYvP9z48xKRIe7FPMShXjbvV+Hz5esfQfts9lzuzeIuT+GJ0rApkqyz4b+XXXLJU5+HikeMzmHEL1sFKtcp6N9YM1kONvFu2kFboIkxlt4Zt1xvcKzKBCW/u1qvZrxXikWc5KFYN27+KKiYa3C+KOjPIwlcTSYDjUpIyzcpjMp70w9t3P6E6W4RqlC14hUeac0FaRmMelpHpjj8ph7ktJma5I52Zu+BFTinyjQ7US3TpwcZw/7TJzgAbveNh6wUcbcROzqlUWlCFYKZxeWmWeiY3hreIXiAC9eTUw3alBtIdC0+JF9Yy7eo27umSj2NxWUwefaffw3p0rd10s6e46PgSU10/7pAs8uJPzkzKSThO5ZbnQ5emYHFCWmo6Kmkei4f7Nxmzad/rLC5NzfzsRaBtu3yVN4/RBqsSY1iUtszg+Hu4W1heWwy4H251tx43EOgn0dvgfNMxS0iJr/wBMXkpaP9WhiNt9n8N2cBxrpLeLHMSjWXN7wgJHQlcFO0W7uoi/iXwjFT5IAPDK54y52oCu8XAT8uOtIvcdmFnsIOfnUfcmjmDB2YceuWuijp6V158qQAbjZMzTziHlG3lylKdkfXglK1pzjpoZQvVqY1bNOmhSyZCCOkVa2LYeuhf68IHpzg6WczphqWz+jSqOKdS30D8Spz4QI84Tr5uFqRqqr8464OKdjVeyafHD9tGCdzeivMvMTItdomibVCSObRBiWHL7pWbdy5MXmwZPURqvWWp58Ym9nuFzIbXySEOZc7lADS3ZikOoovzjTbeu4bjeJS2JUcR5lv8ArEXHb815r7y0u7cCDp41jkapav8AFjrSnlR/M8uEcrLLtKaLuc6f6we/KjMNOTbb7e60J2HxPktPNOPpAc1cxOKQudYJdzl6LBeHFL/dLoL9t7pJq2ScaeMegnVY4X6bgPXTO845XLa0uXupoiJETK2nE02yjEyYNu5oou4aDS5PGnFIH7MLHEL3DJWWzXg7WTmChlbqNYGf++P95Y2Hs2xbBsMn3hx/D1xCUflnAywmMta21He5UKixlCdFJjMtE/0r6RjDTnMWN2SMIm+5cbPYHMY79iwqWeexBth6YdG8REm2xvJRrTURQlpxXlHZbBpTEsNcdlMUYDEGGnX3paY6tCAderLgR2626LppWK+Rmplo2ZsZxQcl95nXs72unzrAja9cFu8S/rWCFaW3FLLC7FtswDDUyTr/AN4IErQ/8zu18E518ouXMSdxBmUw+ZdF/oEvlyzvNE7at+YotaJy5RSYY/MNy0zNpq2zp2Kje5u/WiL9IdhKiUyw22Tud0gcoA4rX/8Aut+sTW1/IqjpFvZ7b/w+k+3iWH4g0XV9LblzAe0SdYaXfh3ePjFvtA1iW3Gzsttjh+F+8MWxAxkcRea7TMyG6JEHAhdC3XkQxnfZvis3ge2EpspiEtlzHvCj1hJVl6xwUDTS2p/WLH2O437s2bm8LnfdvR5ybdAmXu0VqJuuDwyi4JzujxGicpY9mLYwptMDPGtj9jG8D2owD3bL4k6RzJz0hnsPfDe0i7h+JjrzjzXajZ2dk59/GxYmehuy1M42rAJ0httD4kpqn4Y9b2OwDD2to508Ny38NxDC3v6vxSatFl0LerNwvh4ifGkUu1mxnQ8HHFJaZmXJPpbkt0Od6xZV8dSHjaSKOqGPFOMTliPG+nk8ZxRgjebf3SJ0EU7eRd6vrx+cQsyJFG9xqVfxWfafckZRggZFkujM5QuW13lFNLlTwpwjuH7Mzc5ONy0tLZji/RE8VXkkVzoJ5E3M/gODvzkyzLSzBOvOlQQHise0bMy0psThuQxa/jUzuOup+yr+zH+a84rWWZHZeWJqRIXZ4x62Y/8AaPgn6xmMYnZmbMbbicIvi5prHM16s/B0rEUo+Sy2mxfpVvxCRZpE72qck8F5eaxkXpsXGStLeu/KHTEyLssTVvWXdq7Snp/OA3CcfeJ13rHjLeP004JpwjdExMXfIaRWvdVd2tC4aRu8B9nuIYns9LYtc0wM3e5munYDEu3oTx/vFuinO0oZsJ7PsU2hk57GGZJw5GSp1IXETxL+zHn5qvJI0+3m3WHzmD4fgkz1DgWtO5TX2WVt/AmrhJyDhXiuqw+9sVJ7Yyk899rW1wuyGG7JYM+8/LsIEqz3bxu5eFxLXXjx4JGfxiTwaUe+zPvzbkrLZOITMp/ZnnE/ZtuL2k5EXfpupSNhLy2DN4k7Nzcp9oJrsX3uCPwGfBDXvU17qUFIj9qT0+eyGCY19i92gZNYYzmtoy3Qt77N2narxNdI9NaXKpxiee1TmPOR5kysocyGLYh0TLb32pMz3S+G6motp/iKDsSwocPwHC8SdxmSfl54C6PLSLt2Xb2kPS0F8tVjbbIzDmAbN++dptlsDbmp37XJzs1h4Ba1wzCCtpVXsIgr6R5jtdtC/ib0tKTc2+/hso844EuFGhC8kV1QClAUv8vSGuTa3JfFdLGrkMZw3aXCMP2X9ySEt0YnXZjFAeyCtX9o84qLRtvwTjy1jz+cbwmVmXJTDn5mZcvJtywBbadFO8JHv68dUSOYkeVJkMtmNMuoL1t6FuLqF1NFJE/OAXHwxbGsmTXoMu+aNo7OTHyq45T+VEhpSxuNquUR7Ht4xN4e9dhv2R4CvGYZuR0afjrcnypDMBJyZnGyfxByWqRKDvg4XDWqURV4rySKrFHL5x5MtpuhWojPY0008fWDLJZvB2nc9zphmXVWbmX8V3GteUaynSYw8y32NFs/MvM4w01mMBNSZE206ChYeuoHTQwKpJd4L4RrPaV7Ncc2NwTC5vE5eWa6fdMybOYPV3fEXNRS2iR5tg6BIKM6eW84G/l8m6cCLx15JFvjO1mLY3hmTPTr883Kn2Hiu6sv0oX/AKo5np1M4w2OxKlPlznuZt+WmJOfq45kuCfbA7tfJU4/KBQrlqKZetPWCpsBV51tppzc9FUfHhy84glWFfmG2W7icPs2a73LSO6Dzp+Bly6ENGibROGiqtf1/wAonGdcUW85VmAaEkEHlUhSvh4eMNmlQJ7MVkOKKrfLzT6wxw2xGjYD27hPW6nw+GkMRNg+IT2DYlK4rh74szUu5mMnaJWknBaKipFqcjjOK/1lKYc85LzTpMhlARAToihG2PnrdTwWsBsyktOymd0ttH7t9u22xPi/EnpqnhE+H4/i0hIO4fLz8y22B5rGU6SCDlLFMU8VDdr4aRDa6xuWmmjbADE1Mlhh4artsrnI9Sidulvrw5Q0RZdEpeoZgmqg+pKiEKJ2aefL6QKgdba5uRa4eM7NjNSOFZijMmFWlpcSDVR18qRU6ExqU8TtumksbOYuWapuXaV+Kn1+sS5BuyDk1lVQTECUT4L5p504+MB/vRe5GwSss4yZ5wqOXoWuqV4L6RPJ4rPMGz1quttJYAObwoK8RTwRarw8YDUzKhVvt3flyghgpluQeQSsl3rb6037S0pz08oVo+od5jtLXabGAxOcN2TwiVwmQcttlJYjJkXEGl2+q6rziicCzj26rUKcIudm2MKmZ+WYxjpbGH5v2p2UFDcs/CK6VhYuTfu1uYZfknUd6gwykF4Mvskv7wqmqenKF2WWCu7qkoIUO7sWAyjD7bfQphFPJU3getbtUeNFVaFXlzh3IsVsKFChiDpGWJ26ZcaI5WXtV7WmiroNfFeUQOOKdKuGSClA52p4ekWM3MTMqy1hL7ZJLtui66yu4pmqc+fDRPCACy1edcBCabqtidqnglf5woKYhESIrR1VYnIMgus33U7vFB9f8oKm8PmZPDJCeNAAJy9W+tRToJUut4ildErxotIBIlM+6PAfCDcWxNMnmtC4T2Yfw+GnhEMwbRmKtt2biV3rqlzX5+ENIyVBH4YbFCOQcaC5MbqsZqp3aA2OnnTX+fjD+kybWGuSgSTbsw4dVmzJVUR+ER4JrzWq+kA3XCI2ilOfj6xO5WwQzOzAMPsI71b9MyooqlThqusCJD1BUAS7pVpDIYrzJY4E1JniA9NnOitAJHflK5vIlUGieK6QfKrhIzWZiUtPzDZpc4bLqNar4XCuiRXNSpBhoT4zMvcryto1dVxKDW6nIdaV8YHmJmZdW115xz94qxON76lw+Pgt9pnG85G5OcKaaeEHDdstuOnZ87eFea1WA8LEVlMQFao4jKGGtOBjX8ohkXWFmZdueN7oonv5dLkReNKxDNZd9ra3U7/xecKF0sNnvOQ6YcFy3qxGnFUrvecE4aZmeSzQHFMTaO9AsVPNYAsOy63d8YZDsTlrc1Ls9ITkh9p6IMwJ/ATZ+qEO6XzRF842ctshheNezWZx2Ux7PbwqZsDDjtGYtc7S6cQuTj+keVMm2D12Xf8AhLxglwn5JxxkHHETloo3IvOi+KRzvRn6ZsdNOtH1xcMlGJvpg5bbjHJLEIKenPh9YvtpsM2Y2Z2nmJKWxyaxo5XszkgAAwZKCLu3VWiKqounKKPZ/GSw6YmXUal1zpR1m11FKl40qHG005LygWdw6ZlVmBfl1uCxzMvRUsLgvgtapwi4WctScow6YNtLbYYdPYXLYXtDh6zLEo1lyjrpX5Y8Ua8Rbrwt1GvNIyeKvYbMzX9X4TMYe2XYbOYzfzVEivRiyWcP0RIt9lcbxPAlmcihy8ywrUxLzLIusuAvxCX1QkoqLwWN8sFsc+ObXkn2RnMEw3FHP6SYW/ijKBuy4TWSN/K5aKpD5JT1j0zHZz2NTk4Ut7kcYbdy3GZ3CVcYyahvBY8pX0XmtKxRuey1zE9g2NrMCx3C5thu5J+XOYynmjTs0A6KVR4W1rGOKSxQmW8PKbz+tvalqKJXeI3IlNPOMWZOI2a1jaIah3Le56gzIYthDL+JbD7RP7SYOyFgZwZUxKucU3F+HxBflAWB4tjuM7ZkximBe98Qmrd29GnBc7rmYGlfXSPO8HnJ2RMX5R+ZYmGj7bR0JFT0i1nNnNrppnFcZNuZeyJhtk3pdojB10+5cG7cia0WJjNWxdrx+4+llyRbSfSuG4ltf/SGbltpNtsFf6UYN4tIzMsc0BWjSwrBtEkT4Y0r2yXs92Ln5XbiUlprEdnXD6POSfa6OZdk7Voqh6x8xYHtHiEoyx/SvAp9y/7nEBdNl9bfxLUHafi1849a2S272Qw3odNs8eacd6t+XmMIFwWBX+NRMfLjBVpIwqdVlPqLCpbZvaPDs/B1lJrBp0LXwZ1ad/eDiBp4x5vifsYw/CtsJfHMKBrE8EvVJySe3nGmyRUJR8aVr4pSM+oybU2xj/sk2xwmTfeoEzKHMi1KzBfELZrc3X4SSngseg7DbWYyzImu02Dy8tiDLmXnBabNxajRwVVLS4J4FHj1EhT0acvvE/kfO/ti9nzmyeNOSn3sm4OZKv8A940vBfVOCx5PNSFp9mPuTGse2P8AafgTmATDfRpzWxXBG+XP4hRe0njSPmra/YTFsIxqewl6WJ16VDMI2xUhVrk4i/CvjDWrFObXvBfLmpF5i0nlwow1kFKNuS0wAqjzovFVxbtNO5RNKJWvGLGTx7GZEyJvF5ti8O5RSLyQlTT1g8cHcvLMa729EGLBNzzwuTJOOCy0jLN37Nsa2gmnBK/zjbOGM8JXYr5rHsQfmc+59yYTsTDzxuGhLppVaDpWCcQwcNpcVwuUaekpSY6JLsdDA0ZN4ySqqJEmWJEpJ2l1WGsyjfuHErhf6Re0stYGhElyEhL3UQCVdOKwPjGHzeJ4li89hso+/LslmFYP3bdERK+UCzEfAa211BtqMGnsKk5vZ6dwsukBiIZZ80o0tzVPGlv+GM1h+FvzjR4dJZ789Mk2DMuyFyuDqqh68FokbHB5v35m/wBIpubmZomsmUPUnGnGxRWj07qbyKvwlXlAslheN4pNuTeEO/bsLczW5YS37bt42qdui9pONFrwrTVKuGhLJD62PPiB2XcclR1cPdOze/hSDpqR6JKGyckXSM1CB6/u29m3hx1rxSNVheCEePYfKTbP2o5wbMlUQWlUq71O0tfPRITvvB2TxbDMqUVQl1mEyrBEgB25whXvL6LWkb8/PtMOTCR1FZscc7hmLYNNo+604cyjjWvcuoReVf8AOCBeH+kON4M0xm9Jdc6P+EwNV/Mbh/ihuze0BT/tAkcbxZqU6LKG2ToBL9S202NETLTl5c1iqwV+ea2qYcadyXgmc8F8CXz9IcrOUzPoM4hYx9leCZ8sUkjLOYT14PGVq9ldzXx4+sCE+4EskuLrmSqo4ocr+FfpG29pmCS0jMsMSTYt2G4zMD0gXVzxpcWiboKhDankUYUUv6vnyjqotmuRx1lwbEO6QQtDMhKNnQcsyMLhqtfotIr0Sp0up5lyi92ckZrEX2sJYmctmdcbbMzOxkHFWgKa8BRF5rFZicqshPzMk4QuuMmrd4LpUVotPFItm6vkmFnG/gFRVaOol6EkNFKkiQu5CFbT9IQg0pRW25nMdbFWaaV1Oq939YGotM3hvUg6bnHAmELLH7zO8VvVNKr+dIhkizptkXbybzLneJad5aJ5RK+5LaNcYLyeMsNw2Sw1tescAZuY31IbyTq93ghCBcde1FPIC429morgutnukPd4731i9YVvGMZmJ19G5dlx24rB3WxXsgKelERPCFtGUk4GGuYc2oXsfarP/uB0L5W2r/FHPD9WJ0MvTl62LZs5vA/6P4pZlE9ZiDR5txEIOUS7w7JaLrGtl5PI25nmGpRx1lmYceJnvK0W/wAvIox2KA0xIYRLP/eNSl7tp3KOYVREk7tB5fijRbSTM2xM4FtJIvutPPyzSZoFqL7PVl+Vq/xRysv/AGdENp9rHp2Fsy3UuyOKMYpI9Be+xPbpXvDljLkPxEvMdN2sb32SYns/N7OyOBY2y8uFTIumwE3NibjDiHS4C+Hkl0eNzWMYphWzezPu0m3ZrHTLFc0ZcMxqYR5Whsp4INaeKxrJfG2GNsMbwl3GZTF5PNpJYg8gDdbry0StxJpzjneidK1LnuT3sfkJh4X8KnRelV+NN8f84otrNm/ccsUtKS2Qz3y7znrF/wCyDbXD5eWfYeccYkwHqekGNHXPga5/WNxjk9geMMi3OS7UyydbHmz1040XxTwWOWrwnRne0/saU+KeKmLReP3PmDEimWpaZlmCJtmYojoaLdatR1pVNfCkY7FJUiPs/wA4+j9qfZ0rss5M4G70weOX2XUT073yitkvZu5s9hwY7iLMs9P/ALFuZ/s8t/zXfiVOQ+PjGSZpvBu7022nX15PHNidm2MQeencZYe90yYZkzlbpuqujbIr8RF9EuWNF7P/AGVT2Kz/AEnGRckpUOs6P2XHU+fYH8ZfJFj3P2aNbOSciElISb2MTPSc9+b6Nu5pd5K9lESKH2yBi0ziyYe1iUlLJZm5Ts3YBeFREf1WN4ye1vJz5xDStjL7J41If049xMYhNTkrlmzMS2FoQSss2ni4tNE5l3vGMx7T8RfxhxrZvCZXZqRw+QeV1n3TfNzTn7to/WMltVs9txh7zjGIYpKN4LiH7WUey5YiHulTeu8i1WMxOYjgmzRyPX4k/PNzLbgPA6Uu02I9rdHrCJfHTSOhaK5wZM826jX45KYRgGRLPue5vs97o4sF00V3MGB0RfC6tY85xP8Ao65iU5jM5ik7i8iydks1MCMvMTZU4EIquU2nNUXhw14F7X+0OV2rxgcRxjZ33269Rs5lyYOWe40EQNFVLU/GkYvaSWmZOcdlPd78pf2Em2kzLV4bybpfvJosdeL23ObJL7BGObbY3tbirMtjeIF0Fsxymf2cqCadUHAKDp5811iHaSUYwWcbdJrE8Qw8833eE2yLBuNotEcKxV0ryRePOKNxubak+oecf3OuyGqhLtqXeJE4qv084pZhxwXdD1DsmNUjoinsY5+w2SZmcQXIayx7++8IJp5roqw2Tal2JsSm84mRNLwaO0vPVeGnOOYQx0rEWmHFRptw0q6etgrxXz8aJqsajGZXD2pxyWlsVbxlyXcVuXyZfowmA6iZEdCp5cfOGzwvSQlOW6irlMMkMURsW5uUlqOGCXkWaVaqNyUVC4W1Gmq6x1/EMP8AdTDDklaTG+B5l5uHwsrRLA71NdU84DbxiZy5pphxuWCaoLrLLaCLgVu1LjoqQO3OOSjs5LOyzZJMt5Ro+3q3qioScxVF/LSFi1y81jYBeMnFzPy/ySLyVCXwrBcPxTfN2dOZl32ittykQUqnOtSX6JFM624RhLoI6aXJz+cdHJORO/NzG6Zfw6rrWNdzG9pkJnMNxGQAnHJaYZJhzLM6KNqqNyfVNfNI42y07hxzbbmVNMEK0+NFXtJ4KiwfO4y5P4ZKZk3M9KC1iZ31XMbDRkvO1Kj9ICwtZnpL7ctcbmSeghfeNNUp4U+kGtvkOnK0bHH2CdwIJ3LXcfICd+Ouv5fzgCXUb8s3LGypcVtaRaYO0MxKTcp0ZX3TtybeRcuGq+kVze4jqZYu1b513NU/PlDgU+JICQgPwVIkV1620luThva056RLLBnZjr15i0HKvomtKJ8/CIUN7Jyriy0KtPOKIJW/tcw00RMNaW3lup6kv84OwAb5PFW+P2S//CYxVuOEdt1NPL9fGOtuK3RW7gc+JCppCmCla0heDTIys317edLuIrbzV9tw+vJUXVPNI7M4e9Rxxm1xpum8C8UXgSJxp+iwMku843nqJZZGo5ipopUrSvjD25hwmRZUlq3qz5V4p8/1g+wfEh+y+GTOLz72GSjeabjDjnHQcsFcUq+SCsQMPuvYUuHIrANg5nb1bjJaJpy0T00rDJduYmC6Q23mK3q5l9qnmifrE208thkljz7GCT789IDasvMOs5Jmiii6jVaUVVTjyheR7LcA6xi7d7K0rFrgWBP4vh2MzouCDeGSnSnSLnVwQQfVVL8oqGl4jcQ1+dfCLTZjD5jF8Vbw2WmWJdx/cvdeRtFRe7qqIvpGjT07kJ3bFPWCsNalnZsQm5jIYWt7tinbp4Jx1jj8tlPTLRPt3Mko899UKmn66xEDpg0TaW0LjprEhtucCqraOtfGCsOclwPraguu/li6n+Ff1iQcOphCYi+8LQFUZdO1mkipcOnZoi13uPKGYpPrONyzQstsssNIAgHNe8S+ZLqsKddC16dQdxwn3s6ZNx2q758VX5rDDW9fAU5eEWGHybk5NtSD0yzItoaIZvHag14kvjpD56SkpNlpWsaZmVflUdMGWz6s6/dEqomvOqVSHnGxOEzGRWCo2ldddTdhzzDku7a82qLRFp68I6T55oODoYW2r6cImnZibxbEnpl7rX3ivNRBB9VomiQCI5dBzd1vOLz4J/nE+NMNSsxksnmDYJZmm9VPBOynlxhqP9Fokm4d9ii65415J5frAxCOVmZvWXahRfrWF5KvpYbllYJU41/KJHFbcyhbay6BQ1v7S+PlBAPzb8m2w459ml6oBU+7qtVovHVYhsF5ctgS7VBDiZRRJE9ai2gtyJziKJXLhEd2ldeERQCLaWaYew9psCFskMyedVbd2mgefD84DeCXCy16+oVVBClpfDVePrA8IYQxF+7SODDiXu+cWsmfRcNctlftD5CbT6nTLbFVrpwW5fH4YUzYcRcgDEJtJQ5O5HmXLjsMbkEytqQ+BUFErxppHXJQ3HUl2mFBxlpTe6xFTTW7wTSiesCNg4+ZW62ipeGiRe4NjzeGSc1lykoU4YDY8bKFZTdtROzqiqqqtaqieEJtNi0tPcZ81H4d7WsOeeccERcIip4xF4wQSAE31RI+Ir2rO18lizMh7NsXDE8rrRNfdSSOCfRk3gqnr4xUuled1ojXXTSCpCWKZmWZdtz7zVz8CJVVr6IlYlo0KSdT11GdicP9mcji8jOzGI4tMXhO4f0S0JBouFplWlyj95r8owczikhIYw4bmBt5lF3Jt05jeVNCVKoheP8AKM87iE3nOE284AlpahaW8k9KcoTEwDU11wq633sk7a+i0jBKGJ0PxGdo2sWUjjzsvKHKPpnyrh5hs321O2l1eSpAU+zLIxKOhiGe86i5zRtEKs66aroVU1qkSTcjfaTT9/4TBRIf5fSJ8I2fxKekMSnmGm+j4cAnMGcw2GXdoOhKilX8KLGkQq67GWTN07hT2EYhLvTLPRHJXowC4YvFaQiXDzKv4YeztJi2DvMN4FPzsqLLaVyTIcxzmajwXwrThBuxW0+E4WrL2Pys3jotOgHu5y3Jcl+8COrU2irwUEiuxBpqZx53oP2Zt01NpnOrl3ao3ctLlRNNaVicmy6i5RZXpNME7im02z783MTz81Ny2/Ng7aG5wFR4IX0rEOzJ4XJ5+ITZMTzjOV0aW7rhKW/mDxtFE4c7uMVmIGOCvNyOIYJOhMB22pt021WvBbaItP1jQ7L4fJbQvOtEOD4XMZI2O9IGXY05FWtxqnPSJhWqedxsy0/GxrJqZnttpN+ZkpHZeUl5OXKamJfDJQAcabHtEQpU1+sb72R4dslg3X4lttOtT01K39BwkMzcXese4gS01s/RY8mZ2SwCWxJ5ibxvEpF7RspmRa6SyzdxbcEbSJF8QuRYu8J2twLY6Wdwt/AMA2r6NMXyk7a61d80UTIfwFwWJsvbYrq3mT6BwHAdi8Yx6UxmZmZscPnNWpR1r70+C74FueNqx7hh2yezzeFBJMSSFK5Jthe4Rlln2huJVWi+FaR8k4H7esQxwPdbkzs1spJnpf7rIwH921CWvnSPQ5HaGbewDpcl7UNmpluT4PMuuSp6/ESjv/NFiJ4dPVx8xmnusW21HsbDD8cansOlvemFI6izMspdaIc0/FpqnOMP7TPZK5s+HSZROkSD33L1NdeCF4LSNZsf7bph8MrFJ37YBZf9kzBdH4qhz+VI9UkdqMB2rwt+SmlFxmxL1NMu70Q6FX5R5TpTvNrxPi+x6K1aq2yiGjzY+Lx2eflQfm+sEpZ1sxG3xqn8ki5GW/pNLb0tIYRnS/u7Ol+qB6YHfaJ4e7cO7XgqpH0Xi/splpyRfdwyYoxMtdhzQh1qn0WPMtstnR9nuDv/AGRyensRDo4HlXWnxEwDVBtXgq1KvgkZ3e8Q0azsb5Up7Z2PL9l9hMYlJz3sWdIOYS7n2y6IT93DerugC8Kn2uSLGf2gXENnsVcYYlJnAun/ALEAK4mq8q7/AMXCn0iHaSZmZPEn3+kzpPO2dLA7xumB7Vy13qLz8YpNoNqcU2jnMyef6TiF4ADuqnkiOjY8+Ovisdn8LVy69jl/iacJ0aSD4tOtYO6D7Y/bnjRyUO/+ytiXeFO+S8l4D5xPj09hc/P4bi7zOFue92nwmJHo/R2ZAlLLRwbNOPWJTnWqRm52SYn8Sfdbfbkm7TcFo6rw4NivNV5V+saOTXouxh4fNuSjbzb3vCQmjbvOUOtqgv4XONFRaKNY7EWKdjkd5qXKzBm2NnsTmX5OYZxKWk3jNiZySFuacpRpbT7qVvosUsx0t3aFhp/emr2muScKInCN3iuIzuMMdDxaZwKWZxM235NuXuyJRzsk9X9kJ98fySMlK4NjGEbZTLU610acw7fdA95dVQUQfirclFTimqR2MlrsceeVlLjFMa9z7ee+8Ny5sjzH+uatTrEcDUeSoi8fGMBNKz0jNYbXL00Ve8nGNo5ISxY81KTMs+4ywAo8DR75CPaQV7pLw4LryjMY5INtYjMBLKeSPWAJlUkHwXxVOCxdKhikMTUq5PMELMy4wYPSz2VmUvpolU8vXWLLa2Tneky2KPS+Wc+Ofw0vrQqcqVSv8UVs5I9HZJSuy9Mt2m6pWoqj/rGskcdfxPYAdkpsXH/dbjk5I2NCtglTOS7jaiIJpy7UY1G2ZTaku6MYVxRzrh7PGDXZmRXC5ZhuQFuaAzV6ZzSVXRXgNvAaeXGIklCdEsneND7PrwpAlI00Yy1U6qU3rePCNFgjfR8LxCZVq97o2SxqOhOEiLouq7t/DxjPb2g8fhjeya4XLbJNOtNPjjHTPvjLq8u3cQU8aoRKvjbEVamC/cugmTFM+z0OUKQ+7yRq9+JxeI/Lh8lg/ZWcaw2Zfa+zTMrMS3WhMy2YOb3VCi1EhVdDr6pTSIMJwnFsTlptvILocvmTbq3oKaDQluXmqcE5rFjs670zaqWm3W2yuebPKJqwNKIgWppqiUjOmuV4NajY2m1huLYZ7vmXpS7MutMHv7wV1Q/nGy2LYbntnsSw3GcLIpMGlxGUPUBzG03hQvhMd1Y3e13s4amsHzZR9tpuTO8JkwIWxlyKpXc926lONRtSKSTn8dYlpJ3ZDMkdncLlyM57JJsXndUteItHXV/u0qKIXDisY8yKiWnSYNuXNNso1iQZvafaYcN9zYvh7EoN4PS9kojbrbbgIgSzJdxshtXx8eMZZx+Zwd6dw+dlrd9QMHQ3myTw+FUjYbG7VTONYq5LYyw1M9Dlwea6kRCWJs0o6IgiINK73GqFGj9tEnhu1GJO4theU+89Q3TsscZcXiw6nA0ReBpw5xhl+Jsa4/h6SZHZ/bCedxKWfc67ojQpkkFoiA8rfT849F/p5iD8zMvyj+UzNzImTN9uQvBt3ypwVfCPGsLl32sYuxkZkbPvbu3woPr+iokT7TYiLW07/u8nOjhQGs1rKK1ATtB3VXwjqvH8u2hzxfv8n0pgftT93H0TG8vMArSNkrgqnfG3s+NR0XyjZP7YYVtFI+55+ZIXH2r5d9p371ORJ3S9F9OMfJMjiWITT2G7r7s0AfZrgG1xkOyifEqLcmvFI2IzmFz0zOtYfiTDUu2IPyzR1aO8qXtNjzoUY1OESp/LLSuy957DMN47s/s/1+1WVIM3KDsvLlvOF3KJwPwujzF7/wCImLvOzfvkmpPfsenpkWWzVNbUcPv0i8/poxgs4zKC5iWIYPNS9n25kXCuTtslTdcRFibbLZ+c252blndjMbeKyrXumYevaH/yVXsr+AtfAo40yo9LnW2NSMlPEJjaToj2Vn29JNOmvTLpTBFvefBE8tfOCNosBlmMB/pJhe0mC7QMznVm08BDONfutn3fxDGe2q2fmZEHGpmUmW5qXey3gddBpf3bF36+cU5G/KMi/lZDblwBv6JTTd56eMdvcpy9rDpx+WcZbKZlmGmQOpNNHvvqn/pRP91ihxrHpvE3m2n3MuVYuSXl7zMGBVa2giqto+SUi2wtnC5w3OktzLTINbxNPA4d3xCBIlwpzFNfOKrFzbafeJr7bK/2ZmZySZ4JurROdORVjZJ+kxdfqI8JnZmVxJl+UxJzDyMxDOzSbt17RW60Tjzjs2xLJfYTczvkBkl1NF7Yr4L6V8orSZzLQYFw3PrWLaYEn8Ubbw2Ud+0mgMS5W33URFW3lvVokWxK7WDNlcMl5naHCpTEMMdmZd14QymnRacduLhdRdfBVSDPaJs3P7I7Rz8tMiDD7cw6yEvmi6QcluJNFomlfHWK8Jf3FOG9Mu/bATuGLtC5aotOPmsWG0WJliux8i6/iDDs1J9Rkn97llU77u8lyrxqqL5RzSzcyJjWDqiF5cxbWDGts3W74/Dwp+cX+yezWN7X40cnhsg7iE5lEOUG8a2gu950pX5QEAMng7hbuYBjw7VC0+aV+kaT2WYpM4JtZh83g0661PGqMS5gVhNvuAorpzTW35xtUqNhMrvBz00XKIbyUWNYXMsSJS7yWzWH9ofjZJe152ktF9U8IpH2TYZbu/bAh/LlBmLTk07PlMPXXa3gSkvFdR1hrkg6QZrDRusE2bgn4IPGvpGqTOMZGdWFlpxJ9lZuQkcaD3q1n4e8BMTNmqoBpS8fxCtCTzGIJURk8ZL7Q5RpSynGg7fw6KqaF+iwECWo6W7wp9fCLBVF6Ql3XHDzrCbAv3eA+lqxZn4NTsThtcakpmSzMw3etat1Z3kVtwfiRCp5ovGMdizLgT7+duuZpX1/eWN57MNo8U2Px2V2hkHLH2P7MDoXVNfFPBE+sZnbvEnMXx6exLtdIeV89OCnqv51jFZbmfB0NC8r5M8JkIECGSCXaTx8I6JuKYl304aeEcbKxblET9YsMDnJKSdmHZmXddcVg0lzbcsVp3un5p4p4RvJywVfGJkXIcMaNucq8fmiwUyhdDfmG2Zcx0Ry4dQrwp6wK1kWHnE4JU3LBRUr56pSGK1gvL6VKOPMUDK33Gq/JSRPpWBiueeFtsbi0EEBOP8AnCAAy1tK5VT/AAxbBOSk/iAzDgMYc43LbqMt7rzo6J+6q814aecTsXbIq7clAcEvFCTgolBWOLQpZVWXNwpcTJxp2++uu94EiaKnlAU6y9LzJtTDbjbidoTG1fpEk06TktLsr+yuQdxE0Va8efHnD9E+4BhK07oKYbzVBxFy0vRDPkKrz9IESLRVWadvzZcEym2z3Ra4D4c1SnHxi8rCxvsS4rl4PtFPMSStzDbd7NztjyFVLVJFpTzReKRXTIrehJl2iiJcCbpevnET55jxHSlYPM5lqXPClCYavsM2SVaEaJoVvjaX5xGxW/wQsE1qrhKiHW8AHs+BJ/lHcWlGpKfcl2pyWnBGlHpclsKqV5oi6cPWBt1AQgcLM1qNOCesEYfMzMm9mSh5b1KLeIqlP4ookMbkcNlXhTE5/e1q1KJmctEUq268NKxVvOXmVo2D8KcoNxBmQlgFuWmwnnDaAycASAWiXtBvIl1NErw8K8YAAeBFWyusTHspp8QSuuOO5Ta29WloWCnjXlxXWLopWWwiUddKdlJqYXLsbYcvA66kJcF3dNPHxSBlbmGZBrFmHmpdM5WmWxPrE3e34/xePhFXRveuuIoWOX2HfH7iVSde8zXkP6JE70tMSrptTgOS5J22jS0vosWUtNSUlhA/YrMTGYzG384rraaJbwFEXWvaXySK2fm5nEZ9yfxCYemHnTueeNbiVV814w4vJM2g7NIRyzTiKNFuVGx7iVp+cQhMvpOdJRxc6++/8UJx4jZFug2hwW3e+sWUvOC7gXuvocoNHhd6TTrB4oVV5oqU08otSZ1O7TYhKYpjKOMA/LSYNg00BnmEIiNPzWq/OKVIkNsgUapoXBfGI1gmbhawuUWeKSWHyzEmspiiTcw6ypTIZKgLB10BCVd/TmmkP2cwosYxhiSR2WYza70w+LQbqVVLy0SqJAM2rJF1WZzrcVeelPlEX6rFeLkCJdpFpNzc+zhKYO+zltZozA5kuiOdlUShKl1uvDhWIsAnZ7DsWlsQw47JqWPNaKy6hDrWiwpmZOZn3pjFDemXnBKpZm9eqaVVfBeKQTrI40U7hssU01Mg22ze0wblTcstEdVVPiWmlOMV8TNI4BAQ9/h+kRrbqve8IZI4m8s9/e8PAvnBzUz0OZnNVAjAm06M5aOv6jA8nLzE/Niw2l5/oifyjfbUez3EsIlpbGpvDXMPkcRaGYlAmOBN2XEdfgT66jGVSqqaMbUqTPqphpeXWdbcFtZZoZYDdU3DQFJKpp+JfBEg7B8Sw2WbnJTEJLNApV5qXclysIXSUbTJeJilOyvjEOMOSM7MOO4Wx0OXZaDq3XrjdLRCOviq60TRE4RULpGlstzO+M6BVWenEgWg2tUqe/8AOJ5eUlFmVF+dymczQ3Gi3g13tK0rw+cAie5l0qNa+cWOIuz2IsniszV5OraVz4KDQQ/wj9EhSCg7jampOS6ZbJluATnnw86ekRzEy+82Dbrimjeg/wDeGsOFvsojfW0Sppw15Lyi2HZuf6A9ibrBDIsO5DhhaRC5Zcg21uovxUp5wXtuOIlu0rsNBg3iR8nB3FssJEW/u8eVePOkPdmHXp512ZdJ941W8zK65fFV5ww2SZtmG+sCgqS2KiCq93WCmwzQbynN1Li1C0W/4+Kwmkax4LBjFp98MqYxDNyWUBluZ6zT4BUq2U5cos5rB5SWZNzDcQ96X2ZXRA1RbauXtrvoicEJNFosZ9uWGZmW3OqcJytWmtLfXwiaYeOV6qWccG9LHbHVtKi15Ri3wbR/u1DRxyennminn3Jno4A21mnqID2Qrxtp/wB47jEw/MvN4g+3LNdMIzQWTHkVF3KqoeVaViDDWM/eIiyw1Kvh+9FjJ4c0XS5ttxtqXAwvDdN0QIuIiXbpzVIBazocwsiaNt1je/e3q/78I9Jw88Uxec6djrrWFybzthzJ4fRppadgGxSl1O7FOMxiWPvNy0zlzLgGKBPBLWO5aJQRIQ08/HzjR4Oe1e9s7LTM3NszLw3SLo5zbx91csuK+fHzjFnW/UbIk20Pof2YB7IpGYYn2tqGJ/FLBA5jFGt7+FF3QjR+0Oa2WlNoJXEjVzObrmSzQCnSK9kyLiH6knKmseMYHs3huwsgzimMyzc3jzjqrLS4atM0+EeBUXvronBEXjEHTMWmZxqZnpIpspt4r2XiMVNE7Ve8leFeMSyLxPSsaFLPI6mk9ZkPamnS7MxiVl2WScbZtpfTQQFOaqvjyrHlntm2lx/aE2ptrPYySyj6NMC43moN+4QLwt3udPGI/dWP41PuYlh+H9Z0hb8lrcZp2REfBKJSumkG7ebB7UvycltJN4fMk3v9OO/fUXC3qUREHQi5UrHdS4KKdjifi876WPJ8a2m95TkgW0Ut03C2TADZkrWeAohEJf3hJ3lrWMQ3LNdPdfacyMszMFOqHp2Uqnfp8o9Uxj2aYlKSbufMy2TcHRmt4nZkV1FwG0Sttq8Vp4cYP2dw6ZCTw+U/oy5lyhmw7PMyn2p1tf2ZEfVjTs3dpEi88r3JxnSx5pgeDsNTmfNt57fbJkD3teAkvcr4cUSLnbDBX8a2banpTIcmp7EAw2Rw+WHeIkGpWj8AjaiKsaPD9kH5ucKW6dISzl+5Lyym+VV7unHwqqxcsuyjEm65LNDO4HKSmS7MnLG049NGFDtNreBsUWxArRd5VjNl6enWZNVbq6tFg8WfxkmMKk9mZnoj7mGzZHJ9XeBER9Y1emthLw5RrMFn8dxDbnLwvYWQ6Vh+a49h8zN5lss3qTTd5cAS6ltVTlBlmzs9hQi7gmHYb0UksORw9Mx4i7I5pkqp/lrFbMYC409I7RbMsOy2JSEwP2fDr855Lt63it9K76pRY0p03MndPALs+/hb+1WKYpgktPzMmwYzH2sgbmGmLkUitStddL04bq0jMbaNMT20M7iTTgtNzUy46Mu0KmbaEVbblomnjzj0TFMW2XPaqRmZLH/cDzWZ9raw7Nzrf7+X0Jl63ccDVs+0nGDMBxvYmUwF3G/6EyGNzWci2OzBhLyyd25pNba8NdOysb559NzHHDqiDxubfwtqXcw1rD3geOmc9NWkYU4WpRLfksH4DhWJyWCu7VyrZFI4a8CLNgyRjvrYrRLwHRS7VKxW7bk1P4xM4k21LSbjzpH0VmtgV5DVVVE9ViilZijoi8biM137PD04LGLU8NDRamfUHTn2LEn5Zxygp2DD8OoF9KQ6ckW/djGKe8JZ96ZNzNlwQsxlBpvHpbQq6UVeC8IP2lY6Y70kZNyXyJNrOIjVy6iWo55CenjaulYzxG+cuA1NG0qnHd8VjJYubO2Og/DWyfna04VcX5ax6nsRJ4E77O8UYx/CZksVvbfw6bCc+65KLrVNG1TnxXlGQ2XlGWtncQxqcVU4SsojdpETvb3g42UGlycCUYK2dxzLDo2JPzPu85kH3QZJKkYjbcldKoKqiV0SHFPnTMbRAuZyojzc3Xsu21TZaWxPDcNYGZl8XbSXnOlsiTBCnDcWq6eMbKR2e9nzr0l/STLw3pz2TKdBdyzdotDIhWoi2i7t68S4R5rIjhcnmYlNusNM5ydHZ7Ey4haiZCncpxLmvCLjFsX2LxXbOSadwvEJ7A5IAYam5cyZcm2QHXcPQRJy5VXtb0a8inT7dzPnu/dsafbhvbFqfm8/a+dw9yTxNrqWutl5Rln7gs660jTk2Ny+MaCRwfGdttlWJmWx/wB6XzZ9L6aYy8wy5xLLGuWQEmu7QvGNDhf/AA+4lja4NjGN4wy3IzRo7MSMp/4JlUuFoKrThRFoiUjbbQ+zlvA5NhjZSfblm5Z1ZiWaadS5p2nEvj3dF8Y5qvCNU8m1LjFTweDbXezTabYzadyZlG53oLwfZ51pkiFwCHeA1HTyVOFIu2doZvA5CSJ+UknpXF5LvygOk2N1DHXVbDGo86Lxj1aVc26KTbxBl9iSbmAvB115Zdv+FB0VPKkQOYbNuzjGJbTS2F4h08Ck2QCWvBx61SaOum8pDaqjSu7HE1XlNGe8HYqZrOO0nm+Fs4Jic46xjrrDkrk5zN/VE74GwaaCfiC7peCRTbSezTFJ7EndpMLf9+tmec6f7Qf/ADQ4/PVI9Sk8IwCW/wDqmzLjW5mBkuvtg2pdrdUSp/OLjZbFNgsIb6RIbRvA4271roOCeQRabyoO6hcKKlFjCrxP1KbpR+ljwnGNjJuVy8oc/NDMvaaMOOqjaqVSi+GkW2B7O4l0aRkZTPbceeF0s2iI08nwlxTTXzj6DwLHdiMQ2ozJbaGXnHHurclibFwTr8NqJRa+EekM4Hs4I5jMlLkQLmVpVUp/vhDo1KreYixnWiku8TqfH85s1PdMYm8SfcbZde3Hb16wvwBzr46InOLNvbB/CsSbYwbAGJKTyrHcrSYv5uES/wDpLTzj6Gx3GPZ5LTmRiUlhRzBtKdpNXLan8MZ/HGtjNqJBpyS2c6azfYLsk9ZMafhpVU9VjpWtRqL+JqY4VFa9OLHmO2DuyHtXw1qSxjLktom2vs+JMtVzKd1we0Q+XaTlWPnbbDZue2YxJ3C8QkWDcQNw+224C9lwCTtivJeHzj6n2iwnAsPxLo0p7PtpXOib4TEpLBdf+ElK756+UUs9heDbQ4b7vxvYDbVuX/8AD7gG4wS/AVEpXmOo/OMlV79MdJo2NtZ1PkgmMhnqBJvcVD3uNfDw00gBmScm5y1qWzSs7PhTivySPuT/AOA3s7YwoH8SwufkW6fezuLIjmviIpRF8o8c2m9j2Gm8+7sPjI4lMb/9XPW5pCn92abpr+FbVjpZuXF2OdFzm0aniD+CvNYQ7iTszKsIGjbF5ITpd62iWramqpWtFhuBYlLOPSEjiyTE9JhMVLLtzBDmDZEnPz08oKxiTffB1p3PzGjoDXIVrQqivBf9rAbOGOsTLjRDa8yahcBaKSc6w75KO+LaC2ow3EJNliZmWHuiz9ZmTePg62iqG6vDdpRU5LFBIzLktMtPj+zOvqnP6xr9pimZ7ojnWdHMSRkCLs0ohbqaDUtdOPGIsH2eVXutl+kZ8q7YLNCJskRaKXw0VNfwwJUsvUNku3SAyL+IhMN4HIyEs49MTTTsp1QG9cSioAh8q7ukVcxiL67Qv4k02Mq8cyT4ts1taO+5EGvgsG4pMiDDEsUk2FLnAmABEcNzRN4uYJTRNKVgGcZG85lv7s1VfP8ALSNV/uYs0/oaXb6TVnEAmXXGVPEgGf6kLBNt4UcRfKhXJSLWaw7DcG2By5w8akcSnXgamJezqclW8wH7vPhl/DrGPmsTWflmnJneckxbAPNsdLfl/wC5Yhm8VfnJh1vMpKk7moyF1g+FqKtdE0TyjPltpHo05i3mfZHOynReocIeSifETFe8kaTZ3ZqaXYvENq3RlXMPw6fabZzezMPWK4TVvEkUB14Ui02vFiT2TkcIYYkulSDWZNzAIN7oudm0k7bfZNF7SXqkZJ/Hp7oDEi3OTHQWXM7o3ZHMUbSKicappVdaaRUMzroKURJm4TjWNOT0ys6w/ZLs2Nyss8d5tM62gK94R1Tx4RSz50mGnMvd+D0LhHZuVypk5e7q03mz/CWqfVIWJsuy8uwzMtG28N1UMVRaaU4xssLoYtLa3Al0PdW+I04xI0agaLvJ+7x+USZV7hhLiTvw7u9RNeHpFmQwjEXt3fBOzf4QUckiS3SjcymXELJ0uvJKVDTguvOAU0WC5Zx/oUwGXexop/gLkSefKAPuDApCu7/3gjEWlbeFxDbPOBHOr4JXilOVF0pEXWNj2fNC/wBYNzJydw0+rzRlCzCOm8KFRNfKtIchA0MQcSTclXmmXgdMDIzBFdS3SgnxFKcuHCGYk7KHlMyYmjLY6E4KX1XjVU4oi8IFdK81JBEEVeCcoLxBMN6dMdEemXZe1Mk3GxAlLStyIqoidrgvhEjAYnblzI2x/vex6+EDRYjMT87INYfe46zKZjrbXwIup0+lYcigEyXM4m7d8a1T04x1sy3ysv3aVXu+cFyMi5iZttSgPTE6Z0yQGtRp2q/rA7gAwatuJe6JEJJVFHyoqLrBcePkVxTCIj7lBbboGn0SI3nFc+ic68NIlkZtyTmBmG0C8UW1TGtPNPNOKL4xAd1bi72sAeAjDcrpbZvohMiY3jxuTwpzi4ewqQncc6Hh2LSvRxl1femJhMhkTELyAOJL8CaVJeUCYgcrLSzbTGWs6oIjhN9htOFqfEa95eHJIZheIHIyE40MrLOFNBl5joXECV7ngXnEazrBei9LA00uaeZlZQrwDwTkg11giWPoqjMS4iky0N2/Rbfxa6V8E1pxgJlp1+ZFlvfdMqcf5wx0LNwk340n+kzjTU4quGZOLUy4qvGEZ38qcIOw3DpudrkbjPB15xbGg57xcPlEk+3h8m9kyTvvArETOy1ALudqLqXqtPSFl4HjfUkwCQwxybJcfnncPlG283cZU3XvAG04VX4l0TjrwWLEsWfmcPYwtuwMPlXHHJcLAv314maIikvBNeHJEjuNYtMYojZzbjszNUTOmHjUzOiWiOvARFESkVSQojzI2nxBPKOi3MtG41ntgaKrarRC8tILTDnJmfblpRW3M06Cd6ANV81pRE8V0jjEoTTLEwS3Z11gBqaU0qvh5QOZuEBDdYIdyLVb6kNMxoST0lMSTxoatuo0dqm2V4V/eTSA+K+EGWuTEsgtNfd1N0huXT4i5RASDrllufj4rDYUFzsxO9HffPokq9lybtiuiu4qp94lO+nKulYAdaN1654UlW9yqnXsl3vEvGK9Ie4646dzhEZaJVVr6RniaZ6WLs3ZdLBkhOsnmZk61dvjdQFRF7H/APdFFFpITrkthE3LZbKszhti4at3OCgrduKvZ/nAU7kZ59EzujXrlZtLqedNKwKDFtMSE5gjUs8WaHTJYH2nLFFCAvCvaoumkXkxt3tHMYX7tnZx+bw9uTGVGTeNSbRqtRSnJULeqnOKCYmukjh2DlMuPysue6oVW29UU0FF8/rHMek3GpyZnZRqZcwvpBAzME0QiSckVeFaJwjCUhp6tzo5kpHQHYHs3imOoc3KShdFNwJbMyiUBeP7prTvFbp4wFj2z89hSSTkzk2TkvntWPCVBuId7XdKorousRzeJqw637tNJbLNHL5YzGppqK6r3eS8YGF8pl0CxGYmHGt/W64kXVefiS1X5xpEPffQz6LWtqOlikWZSZR4HXJkkowYHQA8VXSq6aeGsENz0k6n9YyTjzxuEZutPZdUUKCltLUoVFrz4QsRYlPdeH5DL4zhMkcwbhpYu8ttn8PGvOK0mHhZbfJtcty6wvGnGKjUmbroOmJV6XBo3RtF4L21+IblSv1RYnl356adalGSI3XDtCnaVS0pXjrEtEXCXTmek5m6DBaW0HtCtddPKK1td9II1FPSFvNzMpNOMzA9YwagYHvIhItFRfnFtJU3C+wTXSGTtZ3qMkulVTREJO0mqp4wL0Zl0+rdIGbLwuG5SL4dPFY9Q9nXsZ2mx9WHMbfY2dl5qlhT1c8h8RZTVE8ytSMnb2aJ8HmuEyjhXEPp6xqcP2V6cBW3dI3bGra6d5a+WmnnH0bsL7FtgBeFtjDcY2oyzo7MTEz0aXr+43/+yx7Psz7N8PwgAeTZHZRgA76CXY/ir9Yxqs+OSwaU4S9mk+LcNwxjDNnp3D38GGZef/8AEHoTJJSwgp4b1UXQrvKLLB9gylZBjaLaSRc90uXdGC+zpNvG4uINp4pqvBPFPtXF8F2C9zHNzmz2FNVqIdQPWL4jTtJHi3tCw3BMZxIW57atj3XKgLcvIy7SuOkg/EKUEdeFeUcyVGzjzf0dEorLfa3sF9kXtPwnAJtiTDC5RmX5y0pLAif4uN3qqx7BN47KJKyW0rmzmH9MmvuUcbEXkFeYkm+WnOiR5VsP/RTCpzKY2f3Ww3Zl48xz6dkddPGNzsS5Muz7WKTMlhYyswZsATV2bcKVtHiS+kdNRJf6bRBill3a9y+lpXZef6o9nJQpqxTBxt41bSiVoRcR0iWZk8HlmkfwnY/Mn7e69dcip8SKvFOcbVie2flWUsflw3ez3/mnGM1tT7R8LwqVzMOZ6Z8RCVqB6xyVcaS6tv6Nqcs7dKzP3kw0ntBs7s+8b+JbM/0f6pd/pZ5rlOAC2i3EtfGiJGM269vH2NzDZSWI2WWkzQeO/wCRL3v0ii9uO2j2KSrAZHQZxws+xkBtMC7x13xP8lSPHx2dmZyW6diE30S50UAP2kyK9oxHhp4rStYdCnWbvmSqr0l1WIPSMP8AbDtpiWFTbWFzshI1DLCwAbNvh3lTdBE5/SLTar2iY+WC+6ZufwmdlnrM6jQysqbia7lescH8a214x5mLck0fu3DcgWe+bru8pL3iLy8E0TjFRi2B4y/ivu1iWm5meCv/AIfft4+ppTWvzjt/hMPNjlnictoPTcJ2pdzsUfwnD8AzpPDH5j7LiKll7lqby0G1FL0rSKEvbFtNh+z0tslh8s3hsiw0jHRgl6kXxXlRVNSXWvOBdncHw/ZCQ96Y7gj+M4hNksu1h37LMHeJp0v8KkKJolo1qsKXexD3VkNf1biz7yfaZaYK1tn+4t8B5L3UjSlm3bGVjOrhFr6XOMzWG/Yuk5DfvBp7rrcrorwFTfFe0nJfG7SNDsn7YJ7ZgJb3NIty0mJ2O5TQB0k+JXkqVr5cox8nsxtJI42OOvse+Zc3jbCd+/bd7ve7Sp5pDcD2Ax2cmRcaYYYbzVQL3U6yniPIfFVpWOyh1HJXstrFN7QsblMX9sU/tm4xISzc+y4/lPS5Os5+VYoEKarVefiVYm2GldmQZPaRzbH3JhLUu4DuFnL9JfdcIeslxHRCAt1UMv8A1DG99onsPxTD9gQxTDcUksZnGXc45aRucIG7N46+vFKR5XimE4b/AE8lpbYnpeLys1LNBKy8wze84+QdbLkGl2/cmn4aLDqITTY7guyDeOyefh/SZ69rMBqW6wtON1EVRt51SvNIoNr8LkWTk2pJLKAvSe9Y5d8VKqlKekbjZp0dlMIxvabZHaZzZ3EGZYmJjD5m4Z0DM0HKZXvp2t9UEhtoSQFtVtFim1gy8/tBhrEzNXrKfZ5EGHSdEUXtAiVVRJC3ozbq30sarpt5MbgpiWJMSmMP2SrIKBujvq2zxVRSqXU4onOJRw3AGZ7FWZ6en2soG3JEPd6g7N19So0NFuVd6qcIeeHYY+47KLinu3c/8cAu9Zem6itVUBoqqqqnLgsWMrh+1LTs0/NE/iUqbzEo3Ngeew+Y/dCLvDQeVUonGMYTU1z0M1NSbgPBeJNN/kI+PjTy5xbyMjKTJi/iDjjGHtmDTsx8N3ZH1XitK0TWkX2JTuyWA9LlHOk7STjrVj0zLzeTLtO/8slFVdROF62pxpprEeyOMYJjRYVs/O4XhUs8jr3R5iZznAvd5vAHbXsoK8tK6R0SyqpgqyzFk3N/0sxuc22xmbw1opN1gGWnguZfFqgNMNscTFAGq1olOPGPRfZrhTu1220jj+IPz+JbN4S7987h4shfdfkNtBVBC7VfKPDtj8OcxB6Zz37GZb4N8nCu0AeWvGvh8o9j2L2zntjgYawR99imlmbclv8AOLpIRWa2h9QYtgeIdGufmXHHMpZhqzvD3k+VRVPw6R5rtRiW1cjgLmCONPi446i5zLSJmNfiLtKleCJxjdbA+0bFNo2pZmZ2enp2TRSzZ/Ky91R18i86Qbtg7s21ON57T0ldL/Z+kg7LtufxcvyjRWMWXzB5H74xnB8KcxD3zN/b2k6IzuuA03+0IxLQVRdBtSvOK7BccxZrMYcxvdf6sCmHszoz3Ft78NpWr+cbOcwR+ew3pPRJmblSoBCzY4BIPC2nYVPj4+Mee7SYFijsnLSkow45kXdHlw7oKVVt0quutxRz8VRV1nY6eFrSjQQbSTW1vvWby5TGsJxD9q8y8Vql+0PdVUMbuYpS0kXSAG3mJmWmX9oMybecaRuanZYMp3LUt0XVTcc3k7yItU4wRikt/XeBYlhczlTkth5H0m/7x9NHHmh4mI+PZKngkVu0GzG02PTOG4X796a42689dMBa24A2KKkIDUnKlRa10jz+V0dWkHoRU6+nUv8AZ/DnMOP3tsLi3S8WTNAmd27LId3Lr+0TmPzFYFkfadtJg/RLZuZaeZvB4TqhXV515xCOCY7hueI7N73bI5R4yHztHlX00gwsVYdzMP20w9yel7epmHuqnmPDfVN9PIqp4Ryvwav8nSnFSukxY9ekZbBy2OY2z2km5aaxPE275OlKI3/eKCUuJPPRF4xptnPals3JSbUlKSEy6yAUvvC/zuFNE+UeHbO4NgWI4C7g0pjfTZXNzwdssnMPK2n3X7Rr4rfWFsn7P8Z6HimJTOM9Gewp3O3ew7KoKr0hs+8lw20/nHXwvIprtrBx8TzXbfST6bHCsJ2hkOn4JNky44l+Wplx/EPaHWPF9tJ3aTZWcc6T9pvv7ZZlv7pAqKJeS/rE+x23ey2C7Nt4bLbQ9GxI3M96bnb2b6/sr0qop+XOLGa2k2dx+YKbn7sVwsJdQeekstx7MWnZsW49fiSvOKWtTfeBcqomsSefs7Wv4vtC/g2ISOe3jEvlXSzuS6Rd38BH4LRFWCfZvsfLSO0jEzhu0m6zMCb0lOs5MxbzTVbCL6QfiWzct7yYxLBBw3L0bliaxBXbq6oVtPvE5jpAG2kg/hm1T2LzeGyw3SiHO4eEwVWTVN18edirr5LVFjlf8S6LodSdFnYrl2Vw7ar2lzMtt9J4pgM5MGaSz0swA+8KLuXF2MxR7ydpeMajDfZR7PH/AP6bs7jWIWaO52J2GPjcABuwDshtczJ4Mw9jrbc1hzzyh0ZXBIXre1u8QIapQtPnHrTMpsjtVMS2M4FMmxijNDJhHyZcfFO6SitSTzSsKk/L6KkCqrl1pJ49O+x/Zl/Fcp7ZbHMLwtTsanmp6/6g4KfrFXi3sXxXAemTez2LMTLb0o6w30topY+s0Xe3mq21TVR4x6r7VPbCGB5mATuzMyNe/eJNuD+H/JdUjzmR20npzKfwTagXHjBfsW8pM/8ALNDRLq8rVKsLiKLY5pN4kdCr1YtFpg+atuNk8XwjGOiYphMzh7nGyYC1S8xXgSeaVSIsdkJ3CpZuew6dcc6TLlmugzl7pha4Gva4qK0j6/2ZxzBNsWf6GbX4fhbhPf2cD3GzP/l95lzyTReEeI+2rYB3A5Z53Z2b96YPLETEyFv2iSqf7X4kr+0T0WJp8TOitpJU0F1aDxfCzk39h8TklawxicZebmekPGWe+32clpOzoq3rzX5RRSA9cX7hfpGik5KWYn35bqzZXMaB4w1ovZOnlFUKnK5st3TXf87eGsekk3ucDxt8BWFudLxzo5NvTLz9rLLTSIua4qIKB/FwqkM2pw9/DMSOQdCx5vcMLkIv4qd5OyvmMBYpMOrPNPZoXg03YTSW0oKU+aePjDzRyrc3mGDxFm3/APur4osUq+SWfeAtZxl3CGWH5YTmGuw5XXLSu54Km9X+GK/EsQmcQMTmnjfcStXXSUjKvxEvGLF6eaxEwnXHbMQzQE+pEG7LaXbvOvlrxrWKvE8vpKtsoKi31dyd6nOBfsD/AHB3AtOkSybqS8yDrjWaCdoL1G5PCqRBdCEalbGhkPIbzNWh3eNONEhCjeUaldd3PPXWGt3XbpW/OkEuzWcyww4IA2zoJACV1Wq1+KAZERO5QI5qKdiv6QXIozkzLjqOBcySNrfaN+i089K6ekR9HJ18ZeWmBfS+xvu1r5Lwh6NuSZTDcxahNKbeWVC3+C/TxhX8BaY1Gyo9GNiddRk7HANGT/aDXw8NKL6xHiUz0ubN9RpdwTy5fRNPlAqQlgsGXgkULWhcqK1qlK6p6pEuHvlKzbbwk4FF1UCoVq6LRfNKpA8SvhlLahXLRLtFS1fh1hz6CNNSz6dMYNjqv4JNLLm2RZDzJbyCadmvPRaRUFxglZZ0pIJoVFUvJu2u9oleHhRfygwJsnsNRG1yH2AOrl33gFxH/fnEFzqVPaiVkm0E8xu/TTilNeOn0+cNeuVR3hPTlEzjbLbJ1QnSqNjgFQOGqUVK1/yWLIB0TXhWNJimDkxMTLMrkujLtgZudJEuIjuDwuKpa21/mrML6BgzzM5MIxPcdwwImrvTS+nPVE9Yo51xXpt1y6+41W622vy5RCtMtoXjELqG4rhvu2f6DOFlzAHR9NDyvLRaKvpBO1E9g85i78xhMi8yyR9WDx1oKCiJp8q8VilAbz4inrpFrLKuEATzksy9MvM9Vmb2RdwOnxU4V4cfCG37gm3wAOm8K2EdN67L5Ivp4xDWu93q+MODfNScLzWq9qHdIcHNsJQFztonrWARHYSIJEK2rWkTSMq5NOmgputgrjnkKcYG1i0wWdWRM0NvPZfSx2XvUMxE1S5U1pdRaJxpFE6Bk9OyD+AtSTeHmxNDMK4bvSKtqNqCg2U3STjWuvhFLl/6wQ+442bjeTkfEFF3frEjkqKYH01X0uKYywa0uWg1Ui105InzjZ/gzUdOTss9KNy0rLdGbbZRDoaqT7le2X8kTRIq45DwGv8AvjGJpuMhRK0046eW2KmWtKeWqxNPSoyps/a5aYR1oXOpJStr3SqiUJOaQX8BbS5K83Ojgss45b0M3nMrhW9EG7z+GGOnKDLE2OYblUsOtBp3tPNf0jjU9MtSbsoLnUupRRVEXmi6KuqaonCBhthDCMOdcYmxfb7TdT1SvBI02IbR4htNgstJYvjErKy+CSZN4ZLdHtAhuqrY2J2lUq3F9Yzsk0ys3kvvNgKgW+tVEVp5cYHEM10lbb3dSp4CkTKxM3KhpiLDWWydNAbAjNeCDGpwTEpENkp/AvcErPTzz6PjO1LMYaAFuEeVFWi/wxQpNDkvE4K55rVshK2zxWnOqaQzCJhqWn2nJhs3Ze8c5oDsUwrqN3Kqc4TRlA0bGRhzDjksktvWod9PPh+kWsjhj8xgs3OsW0w+1164SJN4rU1pbX148oGlm5F85xSccYb/APDh29btBJfTnF3jb/QMCHCsKxTOk5lpl+eBoSAc9K0bKvbsr2uFS0hN6ga23YCwU5uel5WWnXXDwuUmBCztI1nFqojVLiWn5RJhey0/jWMnheFSxOPMuOC847RtppsVpmGXAE8a/KscwDBsTx4DlWJY6SV0xMzFu5Ls6XGa8kRfrwSPX5dMEldj2M9h/D9mWd8JQCtnMceTi66fcbr/AIeA1Kqwvq0Huuo/YwtlNiZd/wDo/J/0j2gBrLPFnW6S0kS95mug05GWqxoZOcHEJYXGBmZ3f65077HneJXGupl/hjzLaDafEMTZcYYw+WwvCw+0Bh8kNrTY8BVeZL+ItecVmOY9tFjOFe7cN6axgubndGF0srMQaK4vK6nFY6qVNV7tzmqVZnpXY93wv2uTLU//AEblJtxvqXAa93gFovIO6P7te0VdItnttcfdkZSQ6fM4godYbbVchpfwkXbX8Zbo8kjw/BbdnMKlhclrhes6QN+WcyKFcSXdoBr4cUiwxjbb3nOPutSUoxm77TXbFpOQ/i/nGlWnn3RoZ06mG257BL4lPYz06ZfmZshCSI6S3Xm24mgiXIRXmXKM/s7K4viEy7LYbgzky8WgO2EWT8W6m7cviXCM8ztbM4DsfKSMliUg5MYo7mze+vbTsNkKDUhFOKDpcVOMS417YHJw32JRjrFZQDDpBsSTAj/dMjvFr3nFrXlHn5Vcp5anoWpysTUY9ew2a2UwiWlJHGH3J7HHjNudZlLSyya7VxdkRrTX5xBtptnjs9hrEts37ukcLbreyzPNtqqfvXIZeulfCPmea2mxbGjm3H53KkZl37QDVrLWZbUVUfGifNYCwvEc/qp5yWYG1fvhIbS/h1u9dI2ThV+vWTFuJabQmlj2TZPbvFAmXXCdfakwubIpf7y0tO8tKr+Sax2TxzF3Om7RNSJO4XLdRvjdLXnoLR/F46Rh9j8rEMSwnBsUxDIwtmY+1zwb+S2XatJE3yomn73hHpcjjGJOyzmCYQ+xN7M4bMG7hjc7JWbtd15xNLl14npHL/DKrZSdX8QzRjBXFtB71+2+4pJtuQ6iU6W6mQwPMy775qvCugpREgBvD5nFc2bz3MQHXpB5VB/kI+ir8olxbC23MVlsbxnpc8zMO9bMEFgu07rAcT9dBiXHttM3DZbBJbD5YcPlczowPFXdIrt5BoJUTSsdaRn2HK/R36GYmMBYdxL3hPYk+8493M4XX3ip2d2tPD0i3IfcfQehZkjiVw9I6NMIIt0NF8VK+nGtE5cI7s7iPRZ9t+ekWylZ5pxgpdosgkRwN07lSgL4FVa84rtnZvDZvaGW6JI9G6N1hy5Ffm5KXkSlpdUhH0SNno5b7QYrVhdt5LNnamSxxlssPw+dmcWb6T0iUemLhaq4rhODpWhcSVeekVDc25N9e+w238OTdr5LctdOdICxyTkZE3JmbxBqenJ9o1xA5cq/aCO8sskoiIibtFqixcYfLSk1hUo/I4hnkDKbr0uQZB3V36dkfhNKovBaRdBlprC7RJnWiajTN9jR4a906TbfmXc6YuAGS3ic07wCKWiCaaRtSlpbF8YbxnDcNYwt7qmwyurrclEccpu7y8aUThGPk5/F5yWJ1wm5vJdI3nWSFFzV0vKnFaaaJSNrg+0mM4fLS07PSj7eGvu9HdNq1CdJNaF8VONF05VjXlY3e2plNXKy30PV9gtmMZaebm8dzHcklNrKmLRr5jSseK/8SHs92dxjFHdpNm8zZ3EJOYH7WyFjUy92rkROySfEOse4YbtxiM7sw7iEtI9WzuG88CtiP4iJN2niqaDHhW2m0A4izNzs3h+Veat3va3cU3STtfn4Rzw+U9RtjjHSeCzUh7+xjDdlMWfYHFHp10ncT4q+TqftSXtb/El4XLGVm3H8P95bN4zITrGKMTStzBm79yQpZ2fiqlFKuo8o1XtAwedOce2k2eubk5Noj654b8rgtxaIRLd2U1py0hYjtdhm0LEnOY699vOWGVfxSXDMKYAewM4xopGKaZza7yUqirGHb2nT3WyPLnmBafcbF8Ss7zfZ+ukbmQ2jlMNalsHksMkcRwt1lw3mJwCJx15zdzCUVS10U7FvBPGsCvYdh44w0OF4pITNhZn3pAA0/E6KfRaxa43g2GzEueLDjuHtUoMybWWYC4nAxQSRy1R+ENC0hs06CWIi5Q7VYQMm9KTMjLTfR8QRejA5vOsvCVpskneVF4aaoQwyXOW2XSbXrjx5y+Vab/8As7ktccUk7RrvCKJw1VdaRqNmtqdm2topGQSUxTEMPl2ncqbNRad6a4KCs0IrURQRTQFVezcu9FXiGzDuG4909iW+wvXPYacye9NM3KgvCPEqqJfOMs+vEuEsmZoMDHDcBZYlpaSmZlw6ZrTzw0IlH8CVHyWteUbjYnafCMFef6dg0liD3Yl72RPKNdLvPyRdKx4tNY06IDLFMuE20a2tDwGvGNX72w+Zwr+q8JfkWekJ/aHc07lCmVmUTdVUJUqlax29vd5OTVtVPcsN2onn3m2CdblilniZBrpIuFrS7hu05ckSPcNjTw3o0y+70nMMBOYeeXNacAuHHVESPiDZnafEsNmejYbiXRM095qwaetV0SPTm/aDN4bIfZsWnZnFnXei5uamRaipvIPEkqWl1I6WVcTl6sj27HJLAjZflpFjDWpiU/8AESV4ut3aButUIjVeA019IosY2e2ocwqRltr8Zls4APpAkyVJ0U1EHya7NqcQHdVeKxH7Mdutm8Ix7EJLDZljoc48inMTFyzTpoKCThOL2kUrqJySNxj0nny03iDWITLU4xRxrOom54iXAkppHNyc7Zm/NmnfHc8I2gFzocjPDLZbmdWXes3LeYD+HlZ4LBGHbWYjIYqLmDyIBiUrI2NTGZag5pKZf9NqRYbWTOG4GbZTbU67h/SBOZGX1bEVNLt3iRUu13YzO2U2xiEt70kcxv3kbjjrQs5YtIJqIinxDaga8uERUwzWm0aG1PLls6yFYt7T9qOksYhPzc2MrmkDxtO3aoqLu+aJyWNQXtFbf6Th+0WF4XO5eoXu77l2tokAqJFQvKPJmzYH72Wcf6HLuXtOvCIOXdoh8KaUpWKOXxUpN73a07kSrpivSHWrnBp+7rSvJOMKrwNB/AqfGVl0uenEns+x7FekykzO7LzmmUf7Ov7w6D+UejSOG47I4a01N9A2k2fICCYCWO3OElqrlUXdJPFNPFI+d5OYfyWsQf6I/ed+SZKRO0LeQhDsp60XwiXAdqsdwCcz8JxB/D+LiAJrlua9mnBfnySOCpwDL/Lb9T0KfGq2lRf0PUvad7PJP3aONYATk3hLlafG2XNs05Gn+sea7N4Fi2Cz7WLSjz2HuSzvSOmIO8zbolvxEqlRE5+ke2+zr2r4FPG0xtJIe6Zg9HnWRulH6/3gcq/EkbX2sYjhX9EyZwXCpJxt8NXAFFrThYSafTXyjzuZUp35mh3IqVLYRf5PnTZPab3V0n+spuSmPvnnbxcad3u+wvbVC7wqhJGrLp+3OMSGLS2JdGxhw8nNM7W5pf8AlkugGqfsjpWPJManGvtLE3hfXH2Xs1aj/DwgXCdsC2f/ALFnutvtIE1LTNMsjrpT8PDXRUj0J2zTc4/9j7Hq21OzqSeCYtOObN+78cw612Zw6yxHWP78PhTxtVRiq2F2wlsaecwiWJuSnDZLo+c7ba6nA2zqm8ngtKxSYptPtM7ta3O7PbeFNzEkfu/Jm3s2XtLQgEy0Ngl03vWK/wBpWyKYPmTKYd7jm2renYc6d2QRdkhXvMEvZNPRY55hX0fz+xt1U9U8fueizm2jh/1Jt4/JT0vO7jWIPdi8dLXqbwF+NN4dOKR5p7QMGLZfGCJgpl+Ru3QM0z5Vz+7cpp5oY7pjqmtYw+JYrMuPfaX82wbN4Lrk817y/nG6xDaCRc2fwLC8xMRbZqTTzzg5r0iaU6KdOyTZiRBXUbo6ETk2+Tnd+b+RDs3tRiGIdJw8bX56YaFlopgwt7Xxn2D8Cr849K9mO23vPFegzb/9aX5F71p53dJlzkZU0Q+/2S5LHzrt5s8WA7QZDT/S8PmAR+RmeT7Jdn+JF3STkQxbYHiuEtSzWZny042G5MNF2i7tw/lVPKFxHDRUXIfD8RKNY9Q9vXs3w/Bcb994E1kYe8y3NzUkn/hgMvvA/wCVXRU4gunBUjwjHnWvs2XK5Bb6OO3F1u9oXgiommkfReE7T/00wRrF28v+kGEh9pamPu51hdCu9eyXJbhXjHmHtu2Le2anJN+Ubc/o/jDXTsLM96yvbZUviBdF8UosZ8NU+htzTiKfTkp5+69LHgTu5ZMXttblaOClVUiVefZ0ivvX3eP4CIfr/tYMxR4JdnoEsb2SRC4d5JvEiU4J4axWNFxbutE/9pHehwOPFtwWr6EIGNf3qFT9YiASPgka7ZXCpvFtl9o3mlk2wwyQB9zPW1bFdD7v8Slb8oyCw1m9xMtogV0GTcrlADmZLqJrZ1R3Uoia/Ov6xebH7MljOBbR40++DUjgsijpreKGbpmgNAIlqVS404IKxnW0v6nvfzjQkHhR2sdiQHWFZdxFOPzhipCpEreWZpmLlD4oNYAGNpU0uK3ziaaAWzy23m3hRE3wSn6pXnDCbNx0hbq7ZXh8Kc4jgGENIAS/SEmbHwcGwErXnvV5Uon1iIlE0IyIr6/Xx1gvpDBVdeZzXFAhLuoi03TSnNPCIsNkZnEp9mSk20cfeO1sVJBqvqqon1WEAdhe9IYhLLP5FAF9tuirnGK9nyWhEvygJl7ozhWiBKqcV1s9POJsMVprFQGfR02Vq25lmiFqlNFXTSOTb/SWm26Njlgnl2Uov14wihkpKLNzJS8sLrrxVyW2m71MvCnHhXx4RCWX2Mzh+CLbC8QfkcGPIalmz6UBszYHbMsmIr2VRbrVRddKVjs17mPZplUZnffAzJlMPXjkEyqJZp2r7rqrwguGOhVzDsxOvZriq6fD0TkiInBPJIGVFRYKkp+dklLoky4zfS6xaVpqn0WDptiZlzaxGf6ybmOuQHd4lrwMk8F4pXjx4cS+IWy1DcHw6SlZIJ3Euumn/wCxyYarT+9c/CnJO8vlxo559Hniy1IWblUBJar6r5we21NvMTuL9NcF5q3Ua3FetOKdlKf5RXBLu2OvN7zbNtxevCJXeZuU+0QNdYcA1bsK4RqflziCHkpEVxc45GhmSMhmeACnaWL/AB4sOYnnG8MW2WbAW23G+07RO2S+JLr5RQoZNqIqOgrdRecWW0mKt4zib86EtLYe2X3UpLha235J/nFJaJykTf0g4Mi/hszNuzdroPNiDK6k7ddUq+VPzgV+qHb8MEyyyDayzzzj7q5i5zIJZQUpSha6rry0pDJ6Yl3XqykmMs3T41MvVVXn6Ugz9BiTSuFk5hszPPTctKiwAGDTx0cfuKnVjTepxVeCJALKt5o5oll87dFhprcvjHCt3YgZPMPq8o9W22oig7iW6IlPmvnxWIIbBDHR8p7NvzKJlU4VrrXypD2DcHicVsllIXN491Qt7vGtfWGNkKGmYNwpy4Q22AQThhygTzRTrZHL13xTjEwAyJtNyzt8waoly7oJX1/7QCdtd3/tDYQ72JZhtxuYNt37wSVF9UhpoKKKiXH8oNw59gXn3J2UScvZMAveIMtwtBcqnaoutOCw/HMLdwqfmpQn5SY6O6jebLvC42VUruqnaTzhX8Dt5gllRmVZljlparnbatGvY1IljQLgE3jmHSM9IzMtPYhjGIOMdBl/vhc0Xs8EQlLT0jGi68Ng5hDoqJryXj9Y9x9heD+6Nh8Z22fdyppto2ZA7ak1duEY/wDMLUA8N8uUY8Q+FmNuHTO8EbuGN7LYQ5gBzf8AU+65iOUf/wBSmG/iX+6EtBTnqvGMj7wx3bTapuUlpZybeO7Klmd21tsFVUH4REBX5Re+0wmMGeYwiUxCWm5gJcZjETDebF9wKCwPxZYaV+IijzMJmdkXs2UccYLsXgSiVqpRRr4LwWOql0J8nPVbN8Z2NZktT2GzJSjTnSGTzHnc0bMkqCIoPaUruPHTlGsbxvF5TYlvBsWx0pllnL6Phjp6Nb3V7qJyuI6RX+yzYp/EcVlPfc4xhGe6ISXTAuQ3dLcwU3hb3uP7sTbZYOxhE5iElN4pLFNS0wbGTLBmuOuXUW3lSvOMuYsvaTbBoTKCjxjMcnJsZZ1ydbT/AMS6Ct3AnArVXcTygVuc6MDM2/1jh9ho6ChJ8Vibyt+aql3KJsD2p937QJm4FJTsvLfetThk4N/xlRUQiHknZryWKDGp1u9yZbLM6S84fWmJO8eJ+f5eEdmefxBx4QnzJa4vj5F1j4/aD3xelzy3AtGgWr3BReSU0jNzuIk5X7zOMlzTIrrvl4+K11hYcL85PdTlOEKE51pIgqgpVa1Xw5c4kXCZ0mPeAsy2S64TP3g7hW3cK1FKcFXSF/xH/wAiWVXNAWnOs3e5yi0kZSdnpyWknHbRb3CIxtyxu3jL08/SK7ZxcuaYcac+0Zo5IB27k1QvDRUj1jEJjD9rsb/q/D5KUceMHZ0AdImCdTtuuulqVSqqimlSWB2xEi5SbqcdlJbZJqW2Uw9/D9k5M8xqZmw+04nM8M6nxckpuikZAtpMSde6JmOSWGuktxiGbmKn7Qv7zXTwTwir2mm8fkQmcL+1lhucj+cYWgvIbOQB5JxpHZqQm2sjDZnozDxgGSbpiJ9ZvbuvZJfH8o5kXPu/I6WbDRSyw/EsPcwd9p/p/TBMOjaiY5f93cS0a11514RCM5dntvuNtZrTaOs/eOvNiV264qUDhrw8IyeMSvurG/duIYpLN2HvjLn0mwue6GhL84NF2RGfmX8NabxCXNqxr3j9mc3v2ogBcl4VWOhdOzW5i151fwWkjPYhNYaMo+ThS7bxmDRdgDLtJ60jR9GlglpvoT8sOGy+W1MdIZ618j1ccGnZQVERt/F5xR7K41iw5UtkNs5Mu4wy9LPZDjVaqW8iLfVS1uqtNKwJJy+004zOTM30JiVwiUCV6M0ZdaMwZfafAt8d5dNbdI2f+losYJa+Szc1c1hspM4b9pwababu3yaNCcs+H4QonlovOK+an8Qm9oWp3pzskygCw06yVCZARoOnC2nLgusXewez2KZ3SWsSbYsBTOYB3pFATjUQuqK+C6QVtFgTE49l4R0SbxI3bwZl5gGhylTVMl2h3XapRVTlFWXK8zcjqlbRBQbP9Can3WMZxRyR7djrMtm2v8hMapai8iSLjENu8bwVludmSlpkRsDsXIVvZAvgc0qnimsee41N4phGPOyj4uNzTfVTDRhvbvESEvBKRBjm2+JTPvL3V95Ny39ZhKay9gUsIQp1eXamqcPSFVqYRuVSpQ86werznt82kxWWHCZKZYw+TmatBLGIHuL8biprzrokUmMbbYNi+z2H9bMuzDVWDkrSttT9oxy0/wC8eDS+Izb7zpPvk445dmmXEruNfWDJd6dF5hxp9xspcr2Tu+71rp5V5Rx1lzs21jqothdd7noG1W2EpKnbgkk2xKye51zKE44q9onROu8vDwHlHn2I4bL41LT2M4bltPS/Wzcoy1a220qoOYGvBCVEVOVa8Issal+l4Uy/0JvLM/7ReVzVE1ZJOBInES40irwth/DJlw2xuFUJl5kt3MAk1H5pHLkv07nXafq2DMUcLHwaJiREXpOS67KtGrbIIly+JInFeJRTtSbczLATcy2w9vtPK8VGx3aoteVeHrG72T2SlpnZLGcXxnpLEruN4W7Z99OcUbu4UyxKvnbGIlcPIZ5yUmZ9ZZh0CqWSRoVEuDdTxWnpE028eiqiT3TG5zCHnfdy3L9zaDP4Ly3l9aDFztftFiGMtMdVZ0GkoyWaREAfs2wHuim9SnMojwGWffwR7D2JZ43pwA6PZ3nWiuUPVRJfnSAsPZdycp99uTyqvA69cFpjyGiXXLSiefhFLjll6Ia+ML7KeQfAbm3hczL9793mnrWC8PxJ1ifz3ftdx9h01VKfi+XBeUWeFbHYzM3uE0LbvbvdNa/4URV186RuZPYrAJt6SuxKbyzl28r7I21p3ueu9drHRHXY5p6LmFmpLEjNp9jN6LMdg+F1ORLwuTnF+JzYvOS0zLdGcyhzSd7aGnhzAV8I+m/Zp7GsK2p2e91HiWINYTKEb7W4yYNzJ0Qj/ftFPFIptrvYhg0vtVN//OL83NBZm9IADVwy0S5U7PmqppG1NW7W8GVRltkvk8h2dk9oJvI93zJTbjLWYMuOjjQp2rQXtU/DX0j2DYnGcSHo0ziBMvyc5cw01KOiky6afhVd3zqnpEOJezBrDsNkm5mUxtl5l7fdZADac/8ALmAWnDhciQNtdgOx0pu7Lzc71O4bs46JOZiFrdbpai6Ivj5R1+jknzMnqe0Wx3Stm5GbnZm7KPrpZ4/s7AJvVrzRLdVXVfCPCMQxTG22Za133vI701W3q73N47CTeDzp9FgsjlJb7NiUy7N+8cMcNpmWezRzFOmY5vdmglx4+EZyekpFqWtyMtsXe2ZF2l+JE7KfzjDlZ92sG8VMO3SSScPBMTkPeWEzL/bsmJF5qjrJ/hWlrg+Y6pzGKqYwEn5CexBiW6uWyreJFvHRSL5cfCBMQIX8uUdJ/LZmLwdzjPKu71vd9U1WPSsF262hwfYGcwnBMS+0PXsm9Nthe5pudHLiNw1+8+scFZqlH5PQoLTrX9nlQzAykyJBM5Dg9q06KPL9OUTC7KSc5dKPsTcqjpM5TzRAL4J2Tp3a8qLckPxLGJtqTlm8SYxZucvO/rg/h3SC7X51WHTG0j7WGzOFtTeJSjjh/a5Sdkm6afKt3ySK/iGfwTyFXyF4lMFKfa5TD35TD3istN3M/eBHKUWn1SPQdkvaQ7gE8xKFKS85ge6xNs2cRXsvEPiqd5KajSPLMBmn56WdlJYh6O31jrTO6N9tL8tzcVaad2NtgOGyOMYqLXvJhicNqhnMDl5mnAm14iv4VXySOTi8ZXqg6uFhonpnc2ftP2f2N2owWZ2s2IxFh2VkjRJmWcWx3eKgmNe0CryWPmXahp+RefbfYLMfVKZrVpAia7vLXy5R7jOez7bHZdoMSw2WeBm48167q7eWveBU1r58Iotpcd2J6exKYpJTM9JPS6f1jKNI31ifeNuS51AiEtKjbVLVjh4biMJxXWDsr0Mlu2knjOGvOy33DmWQ9+PR8S9ohYnPyzmIb0rmnuO9aUnWiEI14tFzDh4axWTmH7HFhruISj+W429u9GmszK8DNhxEct/dIoy8/hL8pmPzc409nEJsvBVxuZQl3iFxNBJOYlRY9TGnW3jU829SjtOgdtvgM7J43lyEtYzOFcyyB3aUqNhL2gpqK+Gi6pEOzOMsS0+90uWYck5qzNapb2U7YF3C514LzSka72f43KYh/wDJe1co5i0mMu+3hbTVt7Ew4PcL5XInC7TnGKxORkpdqZ69scgCNp7f+11JEFEHuaV/nFU/6G8CePrXyXjylibJYMw4442EwRygTAIJXF/6L0tqnCtsZFzIfzRfeJiYYtAGcrta71V7tvnxhHtFiM1ireJT7/SngBtvf3agAIIpp4IiUXjpBM1hxnNSM7LTLZ9JeynnTPdF4i4kq8EVFr9Y2Mdy/wBi9qJvB8eYxCbfJ1sKNu/jZttt+Qx703Ml7VdhJHY/TpiZsqw2e50acaDMZeH8LoaF+9HzbjL+FSWLNDLy1EaWyelr7xFwDoeWfMV4p4ecejbM4uMtPykkL7zXRgDfuszgZqsu5XzZP6gkedxSbOuknocM/wBDHlG07ZLiTjWW8LksAtGBilRUdC4eC6RSklsew+3rAWvfrO1cg4x0XHmlfM2t5sZoaZo3cN6oufxLHlU9Y6uc0zlDu1C6uvNU8lX6R1Uamawcteng0hLbGJNYG/PNtvDh79GDds3TISErK+KbqxWCPiK04/KNODsph+xDrDrcpiD2JgJMn0or8OIXd/q+FxoI6r3V0jLRqvkzfwdvJAy+UGNBbJgTsstpHuPJ5cR/3wiB5GyFTZAhFKcVr/v/ALRKb7fRG5dsnKcT8Lv5xamcj8almJebRZZxomXQR0BB3MVpF7hLRN5OcBDbvV+UEuhRlrz3T58NUX6LA7oWHTiPJfFImBz7O9i6139dfGJSYbRpbnhRzS0EFVrXzgWJCMi7WulEhgORXGltTdP6L6Q5mWJ1l1wberC5d9EXjTgvH5RG8448auOERkvFVgieSUCcJuWdKYZHQXLMtT86VWiwAQ32KH3Z268PyXxhqmRGVu7XWiQwYIZCyZbzHLR3VUx3rU8fVPCACNtetEnaqNdYsZ0WgxV9lJZ5hi8yl2rqmN2oVWm93fWO409hszPNOSMp0NjLEHLTU7zTQnKL2buNutIdm4g9jEi/0q6Y6nKeI+xSiBVV4UoifKIuXa3yVwkQunc3cSxbPuqOGy5uoktMtNojS5VM5pV73iqLwXmnpDJ96bfemXJtxtZjOccceG25TJd6pJxRV/WIgnmX5YJaeSZJtr7hGzrZXjovjxhzAomxxxtcHnlF9j7W1+yc1yy/EnOnh9fCJRJ7EVX9o84qBeepOGZdpf09Ijl5UjIAWSddKZbpLfERKdLtO1rVI12xOz0kxtI+xjr7coOH1OYadO1bwJEs9biovhRYzqOqLLSaUqc1GhY2KPaCWm5TC0fclhYl5gujt728at0Uypz1JNeEZ+nVDS6yu/6/9o9C25w2Y2h2zfwnDp+QflMM6jp2cgMOmR1I0VfiItE8EjCzrSM4i7JHOtuMtvKGc1UmyppePCqeHlE0Jukeyq64tPoDRbFX/vHP3ucSOMOtKSOtkFKdpKLrwjjxOGaOO9/n5cP5R0HOM/e1/wB6QyHQ4Q6y1zcpxgAYMTvC0AN5buYRAinu0tXw/wBYkeF8pAXP/DA6oBqnaVKr+XOA4W4bHfCENK6x2hIl3jHXAIFS7mlfrDEOFr4tzdVUrzhkIv3oeDThgRdwKVXwrAAyJWXBADEu/Tlw9POJcQYCTnXZdqZambFpmskqgfpomkBwDJzJtWqCxat1b68vCII6K0iVhzKK60S0Xj/vjABNJI1ZMC66bZZe4IhW8qpur4esDNrafZugqUYE2mszcFx5AzPhTn+sdnJXo7z6dnKdVuharVIkfgmwaSexfGGJZNxDXfOmgAibxfIUVY909sm0DGE4DgOyGD/ZpXCpFt6Yasp9qdHdQvEhC35qUeeezfCn/cs7jbDWaTa2qnIGQobhF6llAn70Vm1WK4ljW1jkzik99ozazD3LMXUyonh4J4UiqdJXaG9DepKLj7IMPc6VOSIzfWy+bnTIiVhZd+9vct3nBb+JyOGYr/8AL2a/NA4WRMuUXJSu7YneKml68+EZ/EHWxmVlGLkl0L9puqfgpeHpyi02alWJkMxx1uWcYlzyNz791S3RX6rr4DG2Ob/Bz5YL8h+Nzs5ILTPcKgDmu37xkupb3HeKKHFZ/pjUq+FzL1LDbC7epwcrXivCnK2IcZmzfmEl7722t0fNYDAlGm7bl1184Ht9JSZW1CyRxhkm+zb21473+kNfczLMtm17dRLPHx9VizwccHmcBmZR1h/3tmi61M5tGm2BAswSTxVbaL8ucVbc89LzAv4aTku4z2XULf8ACteXyhczfQOXsSYkzLMDLZaEBZQ5t9LruK6J2ddErrSCcHxoMImW5uUw6UmXgr/bAzg/wLu6cdaxRxeYbhs23Lyc8csjjMw4WSGik6oUrVONtfziV6ukqdOotQmMUxLHpubxZ593FZzffcLRdU7OnZ04+CR7JgLWyGy/s9az2pvEJrFs5CyuqAcvQbjpvUIq2D848qx9ySw2XZAJ9maffAXZx9oS7Zaq1Ve1bzppXnFC7i83iUx0Zp9xqW/GarYPNfL0HjBVpZrChTqYTLG92q22nnMSkpkn2G3JZltgMloXdAG0aiW5X+esY1yaxB0HHWhcbbmSXt0IypxqvaT+cGN4fKSuGt9L6ty3PBTaK54V4Bp2f96x3EJqUcwqTxCUlmmXmay7wpMKpuudoXLaUALdzRdVSNEponbBD1GfukXQMs+giMlmXffS2/mJx7XhT0izx5mdw96UxCd//lZfpbI96xSUBu8OzpTlFAy9m5bU6+LY3b5ck/w6l6RLPY3mstSj783OsybRM4fmnbkipV8938Cc+caZawZWvE3NFIvuyPRGnHuiSuIUynZjcB0kWm6vwoS0VeCc4KlZvFHHpmUmcgRYmXG8pkxMHbNCuMfvPJezzSKXCcDxDahkGJabZm5rKcCUlHZ0W3B726LlAVF8BXVYvNhMH6RhDTs3MtyzbDO5fdV4rl3QROPnyokQ1eFbrn8jRaLNHRH5mn2PxUsMZflJQp2U6U0Wa7IvWkoFwbIU0ME4rTWM1tVL9Fnyfyp19vuZv7UqcE50RNV8E46x6th+N7IOSHvLaLD3WpiTl8uYmMOZBpLU0E7OyRJypRfGOYxhWyHuFiZamfeTmJy4uO5XVjKMXVBgi7V1d40SlS47sXRrZdONpkzrUcIvleIPHZ6c2kdw1lqWzMSmpmXOUdaSXWYcbbU9xOCrVe7zRI1Gwnsx2xakJCZndnWsCcGbJ7psyYszL4Km81aRLu214jz1jdy+N4fhGFDheGyTciLXXHYXEuN5KninGq8+UUk9tTLSzL8thuHyjHVZz0wTpXu0oq5dxUBVXSqal6RHEUH/ACK4euv5l5s3/wANspi+KuPt7QYbLMvPHkyzQnMuNh4KSIIaePCNni3/AAxYRY4/M4pNtNtAICbOQF1veKvOMvL+0ZjDzaYwvG8ya7FwO2CLmlu8u6oilUu4eUY/Hva1tVjqTM7i2JPDhodQMwoK43mU3U3VSikmsZvRX+o1Sq19oPRtjPZz7P5GcxPC5/FphG3ZdADpCAY5wluGlna56fKMvt/7A3sLkl2jYxJvFJR1b84HBHj5LqielaR5Xh+07j+JE7nuEzfli6zu1Pu1EtaKlfON7intLmQwrCJbD57eSXNqYuEXO+tqkK+XNOUeJX4Wqj3pzuexQ4mm69fg892ixLbFjBWsCxTO91YfMXS8vu5bCn3xp2q/FrrGw9lWxTm3WIyrbMpe6l+YvZsKxf8ApLinnWDcFLZvaOWddxBz7m5ieknTy3mLtM1pU0KhW/LinOKnZTaKf2Nx2UYknnpOcZm1l3+6I0LTXnWtflEZs/Ra0wbYQvXe8SV23OyWMbPYpKbMyct/ZZsTNke10iiDul48PnGexTDpnA8Sam5uby5pHVfzbrzI7l3hryr3148fCPUB2slsQkNq8Sxdtt2caPokviPw5hKjhiPBVsEqLyujx56efmtpOm4S/wBJKX6xow36C337T7qJyWukbcLzPr8GXFcu108hOKbUP+6ugtZ7jlxOTH2hUadr4gnaLxUlWLzZzb+f92s4fLYJhcjhMqbc1POpKdKczOxmKri97Tc4RjZXEZuTn2pv7I7nE5cFgO3VqhXD/FVK+SxXT2G9F6/DZ0Z7cRTEAO9r8JoqUqnPikeliuh5eTanr2z/ALR9pmjYkcPx1yS6S7R0GqMNZhLQVom6KefKLzZvbnaDpM60xkdIlHkcN0JfNz96mWRpyXlyWPCWp9x2WBh8curwKr2UtWx4L/Dzp4xe4bLzr7M07LMTbBGo5NuYIvtoXb8FUeNeHzjs5px8rI+kS9q2PzzOU3MyjF4X9HalsvLGtN6vKukURTDe0LwyTDjDExNmIZWUg5h/DcPnyjzlnFGvc7s7ik7kYhLSztekOimeFloh8ROLw000SsT7N+8MaAfcHSZZwDHo0xfa4jaftRbHski8NdI2Wou3kyanO87Gxw3COg43iWGtzOGyU9LtZGJuzzwtA2+Li1yi1uKltUgie/osMyxLTeITONy7IqrzMlLE1vLyF0+6i86cIq9otm/6OYDLTwvuF1ptHnOgrhTA6nomtu9214xh5rF37HHS6mYYeR/OardQeyAp+9r4xOPyVDR6NRtU8x0933bso7IuYq0Ky4iSu9WvZyB5Vt49pUjL4lO7SYlmTYlKSUrKCN8vK2MgNNy4m63kSkOta6xWTE7M4yzN/wBtcmgpMX5q9SI6uuF/0+kQYlj7YyfRMPfmW2zeV4mnbXR7NB3lS8i415RxOvVjudyN05bFw5tL9g9143h+ZnGTpzF1z7ZCu6THIKcwqol5Rm8UxnGweF1/EHJ2VWaJ+XmzDtuaVWq7yFwqC/6wEU641ntTOW6SGOVYAGxvakNe6vpzrHWbf/HMuykjNb/ey3LdFMFXg4P+nOI5eHgrmM+kyGt4w1iEzi2JYgw4U5PO3mYO5Tbte0FgJbWu8lOHhF9h+PuMMsdEm+ky6fetPAJOMf6fjTT0jH4/hbuz86adJ94Ya9csjPsgSNTIppeKLw8FTiiwJhmINvTktvMSL0sK2zO8hFTVK073JF+sS6K6lI7Ix9b4F7XkkdkT2SxaUWcBWh37t4RJK2p5+HKvlHhu2mDi6c6OF9fLv/aJR28QbKnw3d624VDjUfSM9LvT2L4q/wBJzSmrFdO3dG1E1Kid1E4onLVOCxdy+23u3ZiZ2TfblvdM+YumeUjjzDo6FbXThy7yUXjHmLw+D9O56L1oZNdIPKJhy+Y6y60Pg4xfYdtQ90ZiQn5NmZlmxsTLFG3KfiVNDp+JFXzir2jlui4o8LZg42vZdaKoOIveTyWK6pBbHqrrY8ttJPYNlcF2Wxecm8UY2mlMAekGUmGZaeNet/G24neAtbO14R57jTh4krjmdnuGZPX/ABES7/1LWIUxCSnXpAZqXSQblpfKNyTDfdVKqJlVaXqq0VdNIZKzT7syIlTOREC0QRLuVdOJfmsFOOqch1G6bKBVlOgEitvdMzU3rksQKLXSnGtOcXuHFLT+DjLZmU9bkGPJxOIF6oX5LAczMzuD9JkVlsvpQg4aTMslybq0Ib0qNUIteaLA2GoYyxk25xrmBTUacD9K6QyB0lMsSsm+2TTnTLrb7t3LVFQxVPHhRYudhH2H9ocPk57+xTR9Ec/DfoK/JYpzSXclZm6XLpBqDwPZtBENbkUaaqq0ovlD8ActnWEFsfvm3EPvVEk/JYh+q5ovTMHtU40OL+wfHdm+k5k5s3OjNtNZX7MCJtzXu7h1p5R4KTpt9SWogVRReS/6x7x7DehbS7ft4bPdJunOkhPWbwvNrdbcPlcSL5Wx4pjMq3JuTck4050yWmyaNzu2jUaU8VVKxz8PpdTfiNbNAEa3tWt603vSB92Oiagdww5yhKTiII1LsJy/0jsOQdKuq0ZcbDS0/RYKnZp99liUmHBLoqK22lgjRK17ScfnAg0be65mumocOKaRIotrLtuoPDcc/kv+/CDS4a2sWruGMMbOTL8zMZU43MNWS2SVytkK1NS4DwHTnFRQrLratcrvzRFi1mpx97D3W35lx8Bl2xZ3+yCHoK+NKrx4RUG88TQMk4SthWwK6JXjT1gtaZC94gSBmnazWngqxDBTbbd/XZg8/wDL6+MNdy0fOxCy9aIa731TnAIjcTf+lIapEUTmx1IvNuIfxCnaH5fzg2TTD3kkUeYeaabNEnTbO4jBS7Qougqg6esNdRToCqDCm21mWFfa4fEaePjBWPsSDGJOsYe7ny7S2jMCJIL1O+KFRRReSLrAmJA01iUy2xmZQPGIZnatQtK+cEOvrNSzcrMF1kvusmvw/Av8lhbTcqNYsDS8q/MvtsMMkbhcuaxoRkHyCcnClWWeqcLcDqbAs1bX4qrFLIBMgvS2rerp30qip5Vr/pF/OPnJYqcgWHTLGHTVsw1JOHvNXjWoF+ninGMqvwbUfkzwt25okJZgmNC5J6w1s3AZdYsAwqi289NKoqfnHpm22x+F4Fs/hU25izbrk6yLkwGSubKb33bw13Tpr5x581IEElMTrcyzWWMEQFKhmJVS4U50pr4XJCp11qLeBVKDU5tJZ7NFPYSDG07fVLJTDfRjJLuu7SURfhRFWn7sMZFzJfxnGM77a04QPlrmu5m8KefH0rrFltpJvYZJyLU7xMBfeazaGhOCigFnFOrEKlTvUjHTky5NHc4uidkeQp5Ql/E6vZTTyun0X+FozijM8Ts21ItSssRyzN9ok4RCNK+NKqqrxpGdJvrstsrvPl/2jVSMtPtey6dxCWbNZd7FG2Xy6PolgKodZ6l2Yzs2BSglKON2v3data+gxaeSKm0HZybdm2Wm35l5zJ3G79aD68flygSm8I3/AOkSsy7zh5bbJOkSVRASv6RbzEmxgIyr7s1KTmIKqOdERMxtlOWYvBS/BrTn4Q7xGgoWW1KVWTERMxUUPs/i9IiFKxLMOuPuZjhXEsGT7CYeWS1Ny81mNCpGyqrbVKqGtOHBYq5NgArYaMPJN1CuHXl4Q+wAEFPeu1oi8v8AOGIcGa8Ft1W2qlRS4eNIKlpnD+hTqTko87OOIPRnQdtFta71yU3kpwpSkQzUm5Ly8s8ZMqL4XCgOiSpRabyJqK+sROg8wQI82o6ISIY8l1T5LE7j1gSS7hNK4K3Cg3HRezrTXziFeMdu3LYKw55mXmmHZ2S6XLidSbvUL/K5NYoQIJUWEqxfYa/s4cjM+8pCd6bcPRuivCDVEBUW66q9q1ap5xW4ixLsK0rM6E0Rhc5aC0AvhqvH1iYbWxUrpchmxbQxVnMyyRLb6V8+HnWIYnkt2YBzIR4QMVICRbV14L5LFxtHPjObSzT7cphg3bjYYa1lS6FSiEA/58YL62FbS5VzdzUu03aQafX/AGsQoreT2nL/APphr5ITu7oiaQbhEpmY9Jyj43ibwXoK1qK0Vfyhig9KxqZf2UwKTwNvonXYMyc3kfER59HPx1sRU8BGMGI5Us1O9qYeQrAL4uKl/l5xqtu8VdcHF5lClJl7FsvNIKqUtcallcO1QRRfKmsYWdmHXct5XBFWqNgHMac40o9NMK3W4KV5iTpb29xr/KNCrzchhFv7Szc/fXn8opsHSVPFpRJ7N6LnB0jKoh2Xb1tedOEWG2M5LTe0c27h6OBJo4XRxdJCNA7typopUoir4xdNsYmTJ1ymIK+QfebVWZcRzXiGhrSqKi1RRXurXnDDZmbOlvA5lmZJmmi0I01VK811/OBiSmkGFNKcixJG49ktmR0rVKrTglacoxjSTXeAXMKhDctF4+cXmxe08/szjEvOyjiKyDnXMGAuA8C6EJCSKJIoqqapFB5LHRSBoy0kFmVm8BmINtnMk9KCqSzrx5InbciV0Qqc6KkX+EMtyYPuMzraiyPXHypz/PRETVYzcoBGe72uX+/LjEj8yb+Wwyii2K7oJzL4vVYtelSWm8hs+TmLzTPRpYhvXLaDRE0/nzVVi0wvDKALctvvZROOb4p2e0VfhT84EwwHJFb2t1xkkW/8X+UDzjzZHu/eF96Zcq/74xsnT9zJurQtMQxksRw1qUyt6W3GTEETcXVULvFrw8EgGXfLOeGbmersvML6XKPARppWB55tyRJWm5mXmWHP2jS1RxBLjrvDryWkE9AemQ6Sx9rcKXOaeaZC3JEVW67yTjpyVINgtMjJwW+hsTbDT7TdcsycId5zju01pT8+cQG402ryZebfutOncNKF2kT00ovCAL3Hpi4hJ1fBP98IOwuc93T8nP8ARpabFor8l7USp8SItfP84WW48C2c63CmimyucZ0l5aztDWtS8B/NfSPUdituPdWw2EMyktISz0nng90sLxM0czBEL627pcOdI8hnHmXXXFlnHCuod7xb3BFKvjRefONns21gGJsyGGz21Elh/vHrnHTZccGQdBSERdr2kIdbh4JbWMeJpKywzamvD1GWZhdD0XaraSZ2vw1uZxRuQ+0tdFAGmRabsRUM+zz7KV849D9nns6cx7Zg5vCZ2SFxphSMDPgtPzjxDGsr3xhsjhczKYhKhKD0YJSZvuG5briolHCVCJU/dicduZ3DwdlMLxCblJVyqdq4qJ8Vv/aO/h8eX06HDxOWdm1sF7RSHuOZfbF+WdEbgMRO8NeN3n/OMptNOSLoSmVh5SzwNF0i7cF0q7jgJx7PHxXhDJzFmMQkDxCdnnCxC+x1kB3ng+JD4XeKL6xT4aOITkg670ttuTN4WJgTeEja5oeWu9aicx9IVWsvgKVKfPkHxDFW+itS7YN5w3kbo1vUV0QF5UTilPHWAsVxSaV6xyZbcEREOqGgEiJu6JS5U8V1jj8nh8r9rmcZbfb6Q42MvLoWdanBzeS0RL1VfKDmMR2Uz2f/AJexCe+JHsTsuLl2A0jkqOddNLBMviGEFPtP9Eck5HcA2QmauJu7xgZJ4668OEBzWKTMj0vC2n235fOrcIiuZTskK8bVReCLRYkxObkWVNl7ZmWkyAlCwJt+4aceJLqkSriWATEmxJfb5dtkyIJc7Hmri7VriWmn5xz/AJG/xchw/FploJKZbJwetJHTMdCp3fxUHx8o2uNTze0LMjj8znuMsmErMA1urYHYup3ib0r4jGPmtmn5bAJDFGnGJvpSObsvMXqzaVOsHuqXFE5pEmxuJu4a3iTL8sTg2Nv2GK2lY4KpcnguqRy1KcNOabwddN2XofaSfH8SQWQawVt2Wk53FHn5cH3d4A0FsSXhVBXjFLNZuITL/wBm+3dj7M1RHSQt65E8uaaRp9r2/wClsy1N4fhbMkRzZr0SUS1lrN1QQReyNyUilms2Tln8Pkd7jnPf3yJxp/y/BO9x8Iql+5NWPPgA92+796dfuc+CWVCUf3nOyK/VUh2B4lMyMy70aZfaZepeATDgi4icLlBUVaePKK+axWfmpJrD5mZc6Gy6bjcvwETKlxU8VREqvlBWLG1hbj0hKDnsuZTyOzMtY92a+K0Te1+LSOv/AJanH/x0LWcm+mTh/aehttaHZOOOh5lcS/kkW20WKliIdGwl2dbwnNy2ZSdnldeoI94U0QPDzjKjhc/OYU/iZNtWyZj0nrhBwAJUQVy/hqvFEWBXXqKbAzP/AJdm/wA9Brp9Yunb9Cal9vZ6hsvj+1uzIP8ARsIwsekstH1uEg8RNl2bKp3k4/FAkjtIxhzLUhLSkpKThmUwycu8o5Yn2miHukJDupyRaRkJPEpvob8tP4piUtktFlMhdTNRewSVS1OOutPCOS+PYas/KTOJYTLTMqxLuS4SzHUlqJUdI9VI0IrqrWvpG2RlC62nyelzG1uGzeyreBY/LPsEbzr7M9L9Y72EsbNqurd/NFRddIxU4k8/hXSci1npGV0jNFN9Auyi15caxm+mE1ml2XDCm+Hj68F5osGHiWM7RScnIzs9mSOFgosioj1AmtV0RLiSqcdaViGZvy8jVVGE8crIOFul1rfW52/zqNtdRXmtNKJBE457xmX5nD2Le27Y01wBO9b3dNfCKRxxh8LBYy3s1LDV3QR+FUp484bPXC8bDZDmARAeSdRP92nFP1gYqBj776hbeWW53L+acKp4xZy7zeLGxKZeR8XW2hdbRSRF0GqJ9YqnZopmzPJBFvs2Ag6eX6w/DgtMX3wImbt7l9F8YhStjWYXijjEm3syT/S8PmnRcaaMKkw+WiKPnyVOCxkpqXOTnHGnvvAJfygqYfbee6y1q8LMwDVN9O8Sef8ArFnnYKOENHlvTUwea3OZvZur1bgLxrTj+75xn2mnfpIJJ4riQzMo+zMuu9DplHVUyk8E8OP50i52pw/DXcHk5uSmf6wS7pbXc43AYfhUF4clEkjIjmyZlvWlW0m/FP8AKLLCp5uYmOjze6J7jO/bll3aqqdlFXXyjKov1L4NKTbq3ktmp/DZ/Y5vZ5yQlgnGpp2Zbn9cxy4RTK/dS2qV8YyCI46dqXGX1iyxpG5ac+zOXDuGBid3Ea0rRKqiwAr7iTPSBctcuvuTTXjyiqa+iajeJ8DHmnWHzZebJtwCVDAxtVFTiipyjrB5Z5rZEDoqihTxrEmITkzPzr07OPOPzDxXuumSkRkvEiVdVVV1VfGBhWkaGZaYvNTuIqGI4i67MPGVpuuHVXOPP6xBJHbPXNFlN7y2mdKimttfOlIivedaIK7o9ZT9YhUC0LxhB8hmJiTRth+BF0Kui6p+SxodiZJjGsXmZqdmZeUZk5d2cmeAbgD2QTmRFalE8YzmU86XRW2VVxOQ68K1/wB+UXbWIFg+yD+FgMo6eLOtuTO51rQNEqiCF3blWq08BiXvjp5LS2V58FlsFtJjMhtO5tCxNl0pkbXS4EbZDYQ/4f0iT2mNSL/tTxT3e5n4fPPJNNEG4hZjd/PzJYzuDTAgmIALH31tPwIhVjZe3CTlGtt8Osfa+1YNJuO60yXFapavhwRfnGE9NX8jfVqX5nmhildI5UihElpRPKSb82ZNy4ZhoCnYPaVE40TnprHUcoWaLiKMZJTcxiGouAa3boppavHRE4eUR9XKy1OrfJ9pbx/ut7T56fRYFzMt/MlicCi7mu8nzSDcMBuemglTyGnXerF10rQqvBSXl6wRawTMzIOyCuS7yiBdWFS8O0kDRZzI9EkXmrm85x3LOxxC0Djw5Kv1pFZTeihBs2xMggOvsuNnMiht3D2g4VTy/wAogZUjPL7XrHBucBVJ6mUO6hF58EhwDb1jrRZZ1s8/RfKACaSaYSbsnbm2V4mnc/EnxU8OcdB1j7p7dINM1vvD5pz9YnW6UkWHWcRumDVeop2Rpxqumq1SnHSGFlsACPSmeQoVSzNLVTd4c0XX8omfcDj1JNjuFTktbPvDczN9aw82V4GC+acFRdFRaKnhAEgEu9iDIzr5tS5uCjzgjcQgq7xInNUTlEeY81u1JEXu8l+UWEpiEokhMyU1IMrnE2YPgO+0o17PkVdU8kibsOyg2JNyTOITLWHvuTMqDxZDzjWWbjaLuko1WiqmtK6QdM64LKYgJPdIZeJojotE7wb3CvaongkDYNhs3ic/0aQDOmF+7ZSqm6vwiPEl8okmZl33Ucs3mCz0jMda7glbRP8A3JDYaaDH8Tf6W662886Lv3mcVyueN3jrGl2cwyX2hmJGQwpp+YmyZcV+XQdRtLRRJV3kp9IyLLTLg0zxbJBMt/homiJTmvCGnMPE4J5lCFEAbdNESkZtTvFo0LWrabtqOxKencUnnZ/EJl6amXivcedK4iXzVYEhQo1MTQYTkHg9jc64OIJNirbLhILAN2rVyqrS6tEhxS2CNycy9O4m47PDbksSzdwHrvXOLw+SLWM8ixe4G3Isyc1iU7Mq1MS6AUixk3JMOX668KDxXx4RDQaJPg1rWMpsvIBijEq3hWIuM2SMmz27CT76YJd4q90NEXjS3j5sSquqwTPzL83OuzM2+Uw86SmbhFVSJeaw+Wl38Sn2paUl0V5y1sADvFwT5qv5rCRMBu+eg7DpLpITEy8eVLyzdxmvMl7IJ5kv5VXlA7zbt7pPbpBSqesEzj77cqmErUW2XVMwpxd4LX04fXxgLeyrac4oibHW8qjmZmVt3KeNeflSscdQbyy7suuleMdZQTMBIrNdT8EgkZlZafCZlF0YPq1IE5c1TVKwxAUGzc3MzbEukyt4sN5TS87UWvzpWB36E8Rt3Wkq214wQBzEsjjbLyt5gZRjwUhXVa+Vf0gHsQSwNG51zitt61JBr6aQTIS8tMdIGYn+jo1Lk4zeCqjhpTc8q66+UCboHvb/AIp/rHDNTKtKJ4JBIoOu5dUy7uCVr484ZChzfOGA9uYeBlxgXCFtyl4+NOET4fLDMZ7jky2wjTauVNdT8BHxVYHcFW+rcbIHEXWui/SLzZT3OYPt408TcqBtukLX3zootqg3pbdQq72m7EvNouXTXJrSUYqitEhFRU1TTj840OxzzT2PYc1iThtybAOkpsgl6DYS8eesUA9G6Yl2Z0e/+K3/ADiyYcZcxd9JDNFlGXRZv7dthdqmlYUgug7EpnMk7S+8zf0H/OKgXHBeR0S30K6vnFnjYi04yTWZvNJfdTt2pdTyr4xWHbaKoW9zGlKRs07GVrGg2RwuVxT3tNzuJMyiycoUw2BhcUy5ciC0NOaqUZ0luNYvdmMbncAamprDnUamXmXGL7aqIkNtU+FdVosUMTjYeVx5gV43a3UXjXjBGISqSr2U4Vr9SzmrFRWiRezrxgYmiRfHRF014xZYIuDGsy3jSzo1ZLo7svatjvduFeIrzoqLEyOCpiS4rcuJGZc33kZaW5fokWuz+DN4pNuy64rKYe400bl0zcI7jZGu8iLRVUUFPFSSFLRA1SW2AlEWpTdVxJhzS23ii8f5JSHSTWUzn/trqAnw+JLHMQYe94C137A3q+IotfzhC8+L0y40VrZJQvMaxpTYl1NNJtNH0T3a1MzM8bOWYZIu9Yta5Y613eCrqmqxmcQFoHuo/wAdf9/WH+8TCZbJpwm8vvtEQ1X4vHhpHWpppyUVjojWZQkExHeW74vROFI0I1IKNkyKt1zNcwzVLfK3nEqTWZJu9X1l49YrvL4be9Vda8qQ2ekUkWW898eknQ8oN6wV+JeS+UC5P2bPzG+3bl3b/CtaeHnESxVrBEtMOsEVhZROjYrlV3RLj9U/KEzPzLEhMyLZpkTJAriWJUrK014px5cYGA9+5wc3yVV8NPpE0ouQiTTjDb7O83aa81HyWula+FYGa4RoSnPGkoUszajbgNofVDVbdePHivz0gjCVEHms9t4rCF0gEK1bTUl+n5RUIlViwlZpxuTdy0ZFbFaVabxof+SJCyCxZN+8mpxhpy6WFnqqu7gM136KXzr4w+exJ2ZecdY3XHdLGd0ddLf3V8IpptJ6TV2RmHHmSB3rWCJe2nNU4VhzLrTsn0YWHCnDeS13N0tp2baca61rGq1PBDJ5LRyam3Xm2pl25yyzKHTLpogqKJx+sHYhPz2GdCkZ7C5RpyVu3Sl8uYtVa2mXa9K6pFUE4xh8gyynXzQTJm806yOX2bU30W4uemgxYdG98TMzN4gTktiD4g5KSbUkf2m7RLeQjbrXWsQV9vJaSSbLzmJdN2mYxyUZmAJxehNMmpqXZojlqU80hYTgeFzP9YYBiH26WPMZw+bauN8kPdFulUIvEC40KkZibe6Q0DAiglmferu+XHwSCWZx3CpljJfbZeZ/ayLq5nmt6LRF9OEZuaU/kMxLCcUdCbmxls9vU5jJtLLu13hTeDXy04Rn5Vp/OuaizxLG5t3G38UY6SOY6pibrpG8g8rnaIpLTnFjK4xJPycyMzhrEzMPW2TA9W6zTtLpodU019YWTLAWWZCZjabMxL3h0KQYuaaaOXALWnLQQa2/ipcv4tYt8PmJINnsbmXJib+04X9hALXBMUeTMAyXUUDlzWMltbhQyM4SMP8ASWcoHBPKsW0hrW2q2pEOFrMjs9PAM22207Z1PePe1UdKac+GlI53RZtY6abtEzEnrWzu0+zuISeKE1LS2zt8ixLssykuToE5da48RLvCVtxKSRgtqUTOcm5CflujsmbNkvUyy+F5VTgte0vpFXKvOyIAy11WfLuMFv8A3lyL9PCkUiOTJna2+4OYFD37Ut8F8olKfXLlNW/DhLEisMNEZDM5ttLd1Ru+saLDJvApLBveTUzOy2OMW2MmAPMzW/W5RNKCIonBbqrGfadlpWXVM1yYeLuBugnqvEvRKesManaNOALIA6ff04eGqR1tZ9DkXo1NBhWz8ltN0t2QxuTw82Gifd98zIMI6XwtnwI1+HSKiUwObmZvIYVh80EVoDw6qvdGqpcqeCQJOTjr4sOK/VxsbES2lqJwpB+DbVY/hGGu4fIz7jci8d7suYC42ZUpW0kVK05wmyXtCMZnqAp/peYfSM08qgHeV1F8FWIJuXKUfNlwhvCnYNDTVK8UWkEvYi7MNGwXUMmSG6LOgEqcCUeFdYbPBL9ElXQeM3VFUMOjoADThQq7yrz0SLyJsMKeczSeHvt5ZXb3dpz8vpHJcifmgG9uXropdkfNVgOsSKFGRcuHVVSne9fSDIAkhK/LyyzDXc5XIsRtzcy1n2uKOcNjqciStaL9IjR4srLPeDl+H0iZ11tuZBJcyfZaKoZocfHTw8oJa4rWGvE27blNWUHf3q1XmXl6RZbN4amIziSz+JMYdLvXAkxM/dZiDVBJe7XhXlErNSwyZnFYlTbmT6w2e3KarpbyAq+frWKrEXEdmai0yFBQeqrav4tfGJnWJsVGk3kPmMSYOQlJVqUlkyb8zqRudJeanxVPBO7rTjEUjaLzdxNt8V61KholbS8l4fOJcDw9/EWZ42nGhGVaz8pXBFTKtEtFe1x4JEuJpltMTsv0dGZmpdEr90vCijxpXUVidF0Hq3UPx9qWnJiXGQamwLobRIExS5aDVUGnEfh50TWKO1xnLc+LUdYfKzDrMy2+26TbzdFA/BU4Qphl9A6Q6m6bhDdyVU4/rDCddThvZjSi5deipT+cFSkuHX5bDk11BlUU7FKLf6JrAzEsT4OWbxBRfKnD9aRo56SPZdHJIZtl3E35Y2p0W3hJuXA+5cK6nRNeKJWnGIZvBapM6mYfyKjk38Erd484YIbhF4U5+MWM3LFhxyj7kq71rYPAj4bjg14p8QrSkVxLesWs3IZbEjT1i/FukOvKvOOS+Xm1eWop+cRwVKzIiz0d5vqVcRwyEUzNNKIq8OMEigv9nMZHDsTwvFN5lySzDzpB3KmL1UrbiWqdpU5dnSM/iD3SJsi/3Xn+cQ5lBMU7y/P6wdhWHLOS85MFMty7cq1f1letNVoLY0TtLr9Fh9oayaDY2QbLLmXf7OUy0Dumgihiql80u08ovv8AiBflnfaxijMs+M3KlKsNsuNcF6kVCnlX8opWJ9vqcJwt9zordm7/AHsxZbmL/EaongkVvtMeF3bjFMty8GXsgS/8sUD/ANscaLLVsv8APB2u0LRxj4M+brhADZFuhW1PCsSSU2/JzAzMs64y+GoONnaQ/SIBJQNC8InMlyv/ADdS3eaKvCOw4iAoQwfOyzIy4zDEyjobgHdulfbVaJXVEXSv5QAUABE6yLEyTQOtuW03w7K+cCxK2Km9b2LtNYmZXIZeIhYcIqtWHqQ/iTwpTjABAC2Hd4eKRYPTZzcgwy++9WTbsYAlqFqmqrTw41gOTEXZkBceyq98uCevlBHRXJPEeiTbdq8PrwVPyWJkcBzzUg03LOdNRx87DdTJqDaEK1r8Siv6xySwjEJqd6FKNsmYAbn3woJCIXFRVWmo8E4rD8IlJKbV/wB4FMt2SL6s5IXdc2NRQvw+K8oHYVidl2pZ13IcDcDd08d7yX8l9YRXycmwYSTUJTPeLU3r0S0Q0yyHnWi6xWOGR23d1KRoWMLfNXML6N9p7bXjw1GvNFT5VgKew9vDzYRx9HTNkHCQe6Ra2rXmmlYWcbFSjTGQPgWIzeFYiM5JffCBgOle0Kov6xzDXJsX1l5LMNyaTJywG7Mu7tOa1pHJxtHFKYZG0e+Cdz08o5Jo2AuTPSRBxpRsbotxenLSniixZnsT4jg0/hruVOtAw5lNu2GY1UT4f6py5xXEi/TSJkVyZMriqeqp+q/ziIlSwbBtXmteMC/Imt4I4cpVp5Q2JWWnH3hZZbI3DWgimqqsMRYYBINTkw4/NLSSlRzZm0xErKolBrxJa6JHcZxJJ3EVcUL5VscuXa7Ig2nBERF5fnHcQdw4JOWlpdkzfbDrT7KKa8fNacOUV7gPd5v8oiNZuaTpGMHb3Hgbb3erRbdETTjqsSyzqNKVW1Nr963epoq+i60iSXmylZN9joku7nbuYYVIKchX5xE86qstSpA2GXct1uqqvj+nlDFsDjddcPLnBUxKudKfb3urXrDPl4/nDJFhZhxG1cFoVMUUzWgD5rEjQPzDzcgzpU9fNfiX5QBEaBKzsn7idkujdcbwE27woIoV1fFSVU9KQLN4bNy0o1OG0qyry2NvDqBEiIpCheKXJVOUMxF/pMzmC022NoiCANEoKUT5rSscZeAGXGnhI9Or36IJL3qQbC33GMOZT7TtonYqLaXDjwg3G8UcxOcemMmWlgeeN1JdgLQar3R508qrFbHQAjW0YdvIXnYZCjoxKKXnvOW14+UMkii4PB59t1qVmZbozyy/SRR0kDMbJLktrxqnBIqIJSacGUdZQl62270Hhr6xM38FrbyOJ9ZrEukYo4+8pu3TB3VcJK68edPGIwyenpbXJzNL+NtefyiFUVO18oKelllpNp14VQ399v8AcRaV+f8AKGKAucweZkpOWnZ1pxqWnDMW3FD4CRCp4wTs70Z7am2UZcGXJt1AA1qSpllx81gXH8QTFp9+bFFZDdsZN1TXgiaL8qwb7PHRDbLCG/72bbbv5pfuKnpvRn1YdW5pOOdl2IdqmnATDzyybbfls0LvBSVP/bFS+yTGXdYWYCGlpV4+PnF3tekyM5kTcs5LuS25ZSm7wWn8SLGei1a8Gb7h0q1MlhE6401cyCt5x/DVVt+qxzBWJSbxRhidmeiyxl1jvwpEDLyhLvtf3lv5LWI71ts5Q/YaRYmYJujrdpb9LdfBYtccwViSmzXD8SbxLD7AXpgNE2NSGqgqFrePCmsMwUhCealm5D3k4tUabGv3xUQeGpJ5c4s8ewzF8Meaw/H/ALE61dTD9L2a8er4Av72sRLmipocw/DMLbwIMXn8SYSXzhZew4H1SdcHjnCNttvqsVeLe7wmje2eTEegiIo4U0g1qvJbNKL4RufadguzmE+7X9npJp2RnJJp0ycxIZt9t3vIeXagF+D8488Zflkmb35cXGb95kDIdPKM6bZamlRcek3Ps/ldkcReY97LilVZcbRmWtBUftVW1zD3bEXVU7VIpsYY6DnttP5jMwPWh2dRLRCTxRdYr8PnDwDEWxNp7tCUwydPUCFfGi1RfPwWN1gMhszjOMyrWL4s/KYZNZhmbDOY8O6qo4A8C17Q/vJGc/hvl4L/AJi4+YPKzQeLd3PTw+cS4c+/LTPSZZ8mHG0VRMNF8P5xpdppZkXylpKd95YNJksvLTbII0jgVrdbxQlrWha+cUmJ9Gk5lWcOf6SzoYvGzYS6cKLwp+usdSPkctRMAebVsd1l8zuAc1CC3f5+qIvPnAYxKCZum8TxLpDBjQgkc613qWrEp2K14Jrx+sRR1y2u79IZEgOEqLurSHll5IUuu1u8PKIocq8IALNiYGksy4nTms5HSlrFFTVdFG9N7kiaQx6UmMpqdby8s04Nb2SN1qX/AA1XhXjATbrgWq2tqgVyEmi19Yml5ybaZflm5pxpmZpnBeqC5atyXInaovCvOAZK489kjLPPVBt4iyR01pqVflEL0w++eY4+RWCgjcarQeSJ6QPCK3uxWRNiR08wA3Wwt3dOfmsPHqDB7LFxuq0E+fqiL5wPWOtjeaD4xIyVXXAAwR4kzES5E4L5LHZV8mjK0W98bLjHs15p4L5x0JdVIxMlzE7gjcSrEoi/Kg1NNMuN7266o95PDlVPrBYLk0lib0td1TZloQHzAk/kvBUXjFzjxSX2dvDZSbkW5/LmVbmAtFNF7HxN3XUX5coqsEweZxecRoN3cJ110+y2A6k4S8kTn/rBDgZ7r8wwd0tLCLLGadCovDd/xKqJwrGejNBteYSbmk2j2mkp7ZXD8NmZK+fkLRk5i0QRpodSHdTfJS1VSrFftbjODYtKC9KYW1IPPXOujK6N5hU3aLqIjvaJpvJAEw70pvD28SlnGmxl1blnmQQcwEIt5fi10rpDHJZJCdTCJmYb6E/Y+1MWadndPxRFrRf9ImaKrYrnO14ko1ZJGwNR+8rbr4Q6cln5SYclpllxl5taGBjaQr5pFpi2HMtTxg2LjTa9i9ULT15p4L4QLiTxPq+688KuGY8A40GnHlTwjVerWDFox0kHJ8HZe19CJwBEGlSiIiJxr4x2SZGamQl89iWQ/wBo6SiCevGBSSkTNF1ZN7tTpvLy+fKGSFSDrLcjPNuTcyyTjQoDbYVF7eRaGtdERNeC6wI2+62y4yJ7jlLk9OERqNI5SFYdyQ2lEWyuHf8ABeGtNfCIonZcbBo0y7nC7JLwRNa6ePDWIIYjsFhMMtyrQty1s026rmfeuo6UG3hoqKtfOB3Rst80ReNYsMSm8MfwzDmJTC+iTTDZpNzHSCPpJKVRK1dAoOlE48YVx2AgfdC9BJUv7fK7yXy8olm3UmXnTYlshqt2UFSQPmvKIGEAjTMK0Ytjx6ZWSakZKUlZNEaynDYa6x9F+NV4+nCFM+hxEeSnbJQXRIOZxObBltvM1YoUufeaVCu3V+sEYjOO4oDSTEsw0/LM2XtNIGYA/EicSTx4rzipsKy/lB3bj1UkbBx127mRcfOGJoe9qkXDM1h0ph7aMybi4gDqOdJcOllOAiHDjqqrWFjruJ4iv9IcVMDOfdMxJEEcwkXeW0aWpVfBPKFceOgK9Nzs4yjKuVy2UC2ggiNjqiefGvjCw5nDXmXFm5qYYezAsQGkMSFSoXNKKiap48NI7h0pKu4dPTc1OKyrQiLDaDVXnFLh5Ig3Kq+ic47jstIyM50SSxFMQspe+CWtqX4a6qicKrxg+A+ZJJxnJN+XKdZfVg8sG7rqileyXBPlxiucy1d6tCBPAl/nEVFi42dm8PlsQlSxzDVxHDLivl23so1qNKofFKLRddFpDiCZYr5qUflnhbebcavFDDMBRuBeBJXkvjA6lVY0c+xOYjLk69MrMvMsILYTD63NNB/dVWhDTupw5JGcVKLAs3BlsKLF/EH+hsSLDhBLMOK6NNLnF76/SieCQKAN9HLWjnHWltv61rHXiMjBl4rRbGnj58vGDccaG49mD+De+8K98SkzMOe8umTLzbqXLLtCpkOvNSStYxOIzJT2JTMxwWYeJynmRKv84u8GOUkdnJyfpOdKcZOVBbOqEjVOBeNl9f3kigl3nJWYzREbkroYoSfRYhF6pk0dumIGG26PaBdCt+fhEouAbIsZW9rrXiXL/KCX3WZuSG1tthxhtL95evW7tU8aLr6QNKk7LTbDyETBIYuAdOFF0JI0Mtjm62z8e+K/ksQKkWbElNz8pNzcu0463LkOc9wEEKtLl4JVU0+kBsOID7UwYi9YaVbPgSJyXy5QXFYGh5XHvcY68d5kVqDXknCC5YGTljJwnM4LeW7l8PWtaQSERcBLjFrJzgq0Dczq419wZbw0+Ak+H9IBcAWXVBwbqV4L5af5xAkExkF8T0fZLEG8M2kYdwRpzfQ2HBcTrGymmVZIE+JEItC84xuK4XieB7QTOE4jLOy2ISL5MPM94HBWijp5wXsnjZ4ZisrNkIOOS5ioZnZVEWthfqi8lROXCLGnJ9jFXX3Hc8pmr+d/eiWqkvnWtfBaxCxi5q05JBo9k8fxTAp6RxZtvN6GaPy4KAmAuDqlyL3fKusVu3O039JdoJnGn5CUHpjxPE00FggS6kI0XRK6wGuJ5chN4e9LaOOtOtWPFa3b+HvVQueqRFmlOALSSzLTZ2hcHDM5H5V4LyiOV1ZWK504Ykk2+w5gkn0bDxlCAXGXXrlLPK+v5CVPCiQFOyg2OPSzfVtHaa5wl6U5046xG+08yTso8y6DjG4YF3Tu1r+kEOlOhhTnV/YTmSS60a5lvDx4fKNcbbGbPluN2enmMPxNqZmcPlsQl0+8lpi6w/W2ip46RXODpeibirppBDEq+/LvvtsqTbFuZRezVacPWGgJuNkiK6oBrolUSukXbyZ38AsWmDTHQ0dmKuA4QE20Y6Ur2tfTTTXehmBYTO41ijUhIN5rzlxdpBRBEVIiVV0REFFWqwROOSRi42T8xks1STb3eF3e8K8a84hp8FrHkjn3GMRn3nmglJG/sMsgeWmnZGtV+vOJXpAmpNxz9qlqHzpXjr66QTLLKNK4Usw41enVq51htDTtaU1X8o9C9h2wrW3WKLgr8/Ly3SGtw3DttJNU/wB845q1blwdNGjzJPNcNk1zrsvMyAV9wS4UFP8AtEOFTWTiTbsxLysyIOKqhMBUCVUpvUVF8+MeobT4AOB7SbQbPdQ7MPA4wTucINMNt0Ij+IqWeVY8tnDzsiWFhLQ3RygoTlVrvfEv6Q6NXmBXo8kJxN/CwkJFnDWH25ti7pb5uoQuuV0sFE3RROfOD8GLB2dlZzp4Pris66ISDuda0wCfeGacVr2U/iipYblJnFujsK+xJG8nbNCIG+arRKKqJWLHarHJSfx6ZmJHC2JPDsjo0nLW3ZTKaCtfjXipc1Uo0lfpM1f6pKSfSSGZPoROkz3Myl3zpp9IHHjy58Y65aR7o2eXGHS7ROlaPzVeCJGxhudyxroVQQaqtOH+10iNtaGi23eUGEYgrVeul928OxdTlpr84EcNDPs2D4JCHIbPnKFKyjbch0eYESV5zOuR25d2g92ieesAENsPEbQzPOiQ1EG+275wCJCCvWM3Fu1PTsrWkRQVLzT0vJvMCo5czbd4paui+XFYDhgEOkwTDWW05mJXMNSqi+FE5QwzJ52vNYLl5O/Dimektj1uWTfeVKVu80/0hPsFTq95Co2Hy1WEPUGmmSYeJlz7wNC8l/nFlJTT0lhOcz0ZHCmgIDs61tQ1S1eSVX50iseRoUC1y9ab27Si/wA41GzMlKPqwuLM/Y0LMKxbd1dbbvHd0SIqNit5LpLk1oLz2lPzeN4gU/aXRX5PpEtf3WyLOIa+ThOpGFxUmc1oGW2xbBpKGnFytVqXnrT5R7diM7s1jHsew2Qw3DMvFMNxR2X35i++WeQnBAv4konnXxjwqebyptwVGzeXd8Iw4Wpl0+jfi6ePV7ImkuQ/SsXWzmHyOITDjmL4guHyTbJUeCXVxScRNxuicyXmvBIgw3C+kvSlZtiXamr0V11d1q3jdSq/51gmYLMZHdypdppbADl5r5rxrHXEZ6QckzhrJOy97hlJht2WumptlOjOtP6AN/b/ABIqJRE08YdhEzNv4BirbbLr6OE2b7ucI5RX0SicSUuEUU2428AE22Ykg0P4dOFPlEDLitHckC048jl58FjjJ5QtSRMPsTTNUmRe0W9F5c09F5xXIR9qlbPL9YIxCb6X1ruYc0RErzxuqauVpTj4fnEMsj6qeRmdhb7K9jnWnKCRCdqYZn8P+/8AfKDpSZ6GTItzV9bXEJKplOf70XxSB3W2xExbMHBCm/qNa68F+aQHE2yKvjqa3AAYaenpSZmeiOOAOWyaVbdquokvDzRY7jUumzb2E4jhOI3z2j8wPRyEpGYEio0V+hqg0Kqab0Z1h3PUJeYdsHgLhVW3w+UW2JT8+INYdjbea2LSCDves7hIXeROXlp6REWYuZyUod517jvGv6wTiTbjKixmKTbO55XcSp84lfw19JDp+V1N+XcnxeacUr4xY7QyuDSKPgw3Pu9JypiQmXd3qlFbxIea3aVRe6saTpMGaxpJnKQ5xBru9nlHBt70dbAjNGx4rDJGRO2wRgp3NpSvE0T8ocbFouq65lutlTKNFuX/ALQPWDfYe25opTHJNnYicwFzA8PfmnpoH2sROvSGRTi2PK1ecZ5Uh7OVmpnX2c7OP5w0zIzuIql4woiw2bIbwh4luKNo6015pDm2r/2jY184JmmJeV6u8niWhCYaJ9IqxIFHFh7aERbrd0WASDeUD83Oy7AmZCoAt7g0T4U5Lw4wpmIHCzIC0JX+Eek7I4HjO1+D9CbmZCWw3Cm3Hc6emBl5dquqkRd41+ZLonCMxs5g2KTEnOYxhuDrMSeHWFMTsyHUsXaDdXd1XhDcOx8sON3sTzipQTeC4Q8wFdBX8VKpySMKjM2im9NEXVzebVYrhUthibL4JgczLNOtNdOm5vq5mdPiNA/ZtV1EOK8VgCe2AxRrCpQfd86xiBtE70OZl8o3A4oTNfvN3VU7XlSB9gcZYwqc9+zrrb84jt+U8JGXjmXLp5a6xf8AtA9qeN7XYl0vFp3pLjfWAPAWuaW/D4xa8JgndaSanE5va14PNdn5CexPHZbD5YekuXUASLdQeK3fCPOseoY97IcSxbZWc2uwJZScw/Dmmwm8kyv83BCn3f8AlWA9qNrWHdnpFrIkgnnwddngZkhlj3jrYSj2xJEE/wAoWxftVx/Z6QmpKUm+jSs0GW8ALqo+C15RdBOb1NpYis/K6V1uUklSU2HnmldwvFLyEOgTdRmGKFuuML3q7yEKL8oyUlI4diL1QnW5H4m5hdfkXBfnRYs9v3JGZxt6bwkvsq2Z1m8IGvaUad2vD6RThin2NqSmWWpiXR/NLdQXfxJfxovgtYTUsJnEaVIe2QFPScxJvGzMtqBBx5p9UiF1BQ1sW5IKPdAnpdywDNUy61p4VWlFgU1XSvLyhxJLRYjhRIBkDiF4eOsc/wDdDJGQomZyruszOyvY8eXyjjLeYduY2H760SHYCKFErzOV+1bP9wqxFDAmvc6Jl3dXfWnnSJMMmeiYixNW35TouU8aLWB1iUUbybrusrSy3l41iJgazabwbzbzbnEtvMcTFHMCwnDcx3LEMPlbOIW2+JaRjZhHEEZZ7V1ON/cp3U/nHoHsz2g2a2GxEsSx7C5faDqS6PKJMJaLhDRDK2ttK+N0YfHJgSnOkMC2LThXplXJ8tddI5aWjYrFoOyrGS5S2oDiAPBNkk05mOd8rrtacK+PKGMK3vgrKmZ6N71LVr+cdnJkpkx3RBsdABOAp/vnEbAK4dLhHiuvlHT41OTzoWO0Mm9hc6WFPo4D0qtr7ZU3He8mn0+UVcSTAWOqN6H5otYigjYG3CGnHTa6JcVpHcI30G7hX6RG1Yjw5g3DXVK0/OIoPclil5Nl1yidITcoYluVotUTVFRU5xQhMPK6HQnDLJqpNjx3vL14RbYrL+72HpeVmRnOkNjnOHLW8KHuEWtUXRaUrTmkVeDzTshPNTrJPIss6LoE0ttDRd1a8os8JbfxLPcIm3Cl0WwHa719efJUXVFXnSM2/Y0XX7mfESM0D5RsNhtkn8exmYakCZfVkVQGjNBN0lSm6Pet4rFFiTSt4kkwXVCdCSxE8NfKsek+xx7B8E2nYm8WbafkZVpJl7fQ18RtVOBKtqeSxz8VVZKcyp08LRV6lm2MbtJLzuG7PSeBOioWmU28H4y3R+gD/wBUU2E4cc2Drl8sAA2S1emBboqeuq8eCcY+nf8Aiab2PxqYc2k2fZcVVyGsQBq3qTIOrJR8+zX4hj5lVtkZ8u1ljcXnRBWI4WvzEkfFUYRoK6XtGYoXZ7K/pHXpc2jJstHBK0g51hrdqGmYm7pXxp5RqcXbam8VmZ1gnsQYatBrObscdZpa2ZU56IK/iRI7ZaxxquUGczibklZDRHFqdD7SJwqnlAyJu+sXuMyEhhrnR333nZ9l0gmWbbQHdRUoXihKSKlOUB4hIuMK0Mu+3OMGg2GzVUuJE3aLqheKQoa45SYB5YpQG3W5ph4nFplkLlti86jTX6pB2zs49h704/LPMipSjjS5oCSGB7pJRedF9U4wXi2CtSzLbDjjZTwoLr2WddwwGgWUqhgSEhJFMw5MyBn1X3zKjvh3C7w14eSwRZoFN1klmZCe6OT7re6wIIXkJdkvReFYGyaS+aRW3djndrRfT5xbSmJFh+KuOOtfZzq09L8nGipcP808FosVc6KNPmy25msiS2H8SclihaEaNkQE4ja2Bbcvr/nEzMzc0jDzhWjXLX4FX+SxBMO5ryuZbYV7oJRPpDQAnDtEarDEWWNr9uucFzMMA3zdzL1pqaL4L4coa2uGutZbr7zLnx2Xj56cYdKTQkzllbmJ4ghXfXn+sOyZacB0m8tZhaZYtqjaedwr/wC2JK+TXYJsw5tDg8zN4JMuYnirVvTDmCbZZEC0atIyQjcUkVKUjETLTsur8tMMug825vie6o+NU8Yv8CxOfw0vcOK5jOFTJIM4GUNytr3kWlVt7aa0qkM2iJ+QxGawHGEzXpd1GwnOJiHJfxgo2qleFdIhXeGt4NHVWW+0mdcIrAKvH8qRdbLNSrj7g4ljC4TKGH3wMq5mEipu7v118IDXD3UwybfQFdZZdAM8OxrdT60XwjkrNGDhPJKMvNIgobNN3RKIsbQs1VlYMlbltDTFxku0/KSCYio2g9e0yVyaqlLtOaULjwrAwoIJmObxL2B/mv8AvWLnEcPRuXw4JaZ94EcsDmS0BdUZ1VQX08vGIxw+QawpJ/EcSbV5+7KlmKE7unQszkFUqqca+EZ30Kxm9jmGyM/Pt5wk4bjzotj81pqvdHl4fSNH709wnM4fKOD0gCys5p28Bt7VhJ2qr3vCM/iW0k7Myr2GyxLKYUZiYygdndSg3LxL581VYqjfVbYyelzO42Wty+zf2azEcQD3JPYpPN9JxCdeCXZeUu6O84Xmq7g15Rkiece8teMeje0HCNnMKw3BsIex185yXwZuYdbl5Ld6Q91tpERJ8QJciLoMeeMNvTT0rKpaF62AvDivFYdGFxJrZZah8hOTOF4JOI0LKe8w6PebdTRoSRStXu1VERfFKpAuNnIlMNdAYeabCXaE83iriAl5aclKtPKOYo8sxPIy25eyz1LPKoJw+vH5xL0CdexQGAkicdmRUm2/JU0XTwTWNNtTPWemAaVCZffy5fdUwofdS3mq+XnELtomrbZVCvH4vOC3325eV6HLLvl9+78X4E/Cn5r8oFYTcMkt+FK+cMU+js0TRumbII2FUoGvhx/34xEy6bTouNlQkg2bfaZaGVZlW2nAuB56+9Xdfoien1gJwCCl3e1hwKThLDgaUyAW94j5fOGqZLp40/KCJF85CeB9GxNxkqihapcnD1osMX3GzzSy845Lnbc0StrThVNIhK4N1dPKCX2HG2mphKmhcTsWiFru1XRV5xAAk89vFx1Ul/OFATuX2DJLT+KjIyzOQ2+1lNX79rlE3q+ZfSsWm1mx+N7NZUji2HzMlOKCnlPBaoiWv6RncEnSk8VbnJYrHWyRWU8+Uaf2g7aYpttivvLFJ96amKNthmd4EFEp6osc7Z5xbY6kwwm+5mvd39RPzaNOE6xMABmhjYgkK0041qPHhEElMvA10a8sut9ldK8K08Y0GA9Rn/2ZpxgL/wC0W9K7pgPdJVEuHlF1sLs3h+J47P4zlW4PgzIzLzMwaXOmpWts+dx/9KLFs2k3IVLzobv2W4JgjUm1gWOtZWLbSbjLxu2DJ2jmMaeJFbdXgJDHlXtMwfFMI2gWUxCUflF7YMvBbbdr80XjWNB7SMZxd17CMYemWLmVLJBNCHfuzCT8RcK8k8IbiUtm5BY7Nz7+JMzig7LmW6LCChNgBLVUVSLhwFNY5Uo1KVXL34Oh6tOpTx9FOOyc3IYRIzc629LdK1dNxpbGkXUAX8Sjv040pAzk4w1JvyzkpmNvj97dQ20El3fDeKlfIdI02LbR4htLisy7tBOzLguuk9ffcImooN1vDQR48aDGYxaYwmaeWSwS5whmHQB10Msn2tEbXtdpd5aacY9BMksr+TifFupPBmXO98MShKGUr0knGgbuINT3rkGtKcdfGlKxP7unylZmb6FMdGYdFp5zLK1oyraJL4rRdIr40czUbErbrjSlluEFwqBUWlUXinpEUOjMZIjS5WZcPbtpXWI7d6kODVo/KkOmhUHi+v1hFW0GnottKUgqXmEMBlpp1zJTsd61fTwgKkcgsK5fYzIYpLYXITEwhLIvgRyj2lhii7woXii8R4pAbGIn0ZqTnBWYlm1VWwI1SyvGipwRecS4HiGISp/Z3GnWWetWWmKG04vDsLoS6+sS34Tis/8AaVawa8tSabI2R/hSpJ8qxP3Lj3BusNf2Sntjp9MJwKQwzHz3GnJu+Ybebt3hZUltbd/eRa91ax5zKyXSZltrpUuzeaBe8Vgj5qvlF9s5si7i8+yzKYtJOtkfdmEbP5CdNYvtoGJscEYwJE2fmOhzLmTNHLC3NkPNsz7wpx1rTktI5ualNsbnVynqLeY2PPpgcqYco82/Q1FSSqoX4tU4L9YHNRU1Ud1PCL8cHedB253DGmwtzHBO60VJEuoNVoirxpFbNy0qxNOspPNviBqKONCqif4krTT1jpV1OVqbQORGmMHPOw+96aUVlpjO7AiqoW6nGq814U0ivTjB6zGHBJ5QyLizCGvXK9y5JbSAIqCZDfdswMt0t5MqXvy7113qVt050gmXmcOljYWXw3pkwDiFV9dw/wAOWnFPnAPV9GG58iqpdWnd8F8IdICyuaT7zzVjak3lhdv8q66J5xNr7lXtsGYw9MTuJE/OJLSKPuG4rLLdgM+KI2PZTyifZXC3MYxKWw3D+ipiD7lrXSnwbb8kqVBr6rFFxWDsGWWGcumzcBtBJaglVuRKj+dIGjpGrXc0eIYttRhGMP4fMzM6LzAlKvS+6Y0+C2ihT5ecWGw2yMtttjcngmFsutYs7clLLhd+Ggj2fNa2+kVOOzaY9ipTeY30o7jnHg3QdPxAaJaiDpTxjRbD7VTmyR5uDuvyT1w77O6a08S408k0iqVDJYnYmrWxeY3Lf2keyTaLAMbm8Lbw+Z6gQ3LwN7sdq0V3kXlTlGMwzC5RZMxdcckskPtOaaXvF8DY+K8k+arHpW23tExTa6WLEsQK6aYBkDdtG8nNURy9KEO7yTSABnMN2zZdafw3LxqW3+kNGJZ9EqXDvW6/CtvJYz4jmU/N4NKHLqaRFpMI3PE46DU9KD0M9DZHjaOiGJcUJE+Sxp//AIV43i+AsY3syQ4hIuzBS56o2TJiN2/XQUtWteHGNvNbE4JiWwGG4thbjfvB6bKVelsrdaUB7V/euSqqkVWIbc4pJ4KxsvhFspgbUzec70dKvu8Mwl8k4B8PnGH4jzHK0/sb400iebr/AHLDYP2FY/i2zOJYlhr8piT1hSjzLMuTga0Vd5VHeTkooseM7Y7Pns1ij2H4jJTTbgKth3pYXppG+L2n7SYezN4fJTz8tnbjzrRk3n0Xd80SMjiuJjM4ll4lNzOISbhjm10Ja8SGq9pNaLzprHqchcd7yebz7zpFoMm+csrLQMsEDg1zDU63fLlEAfprFtiGGAWJPlh7UyzhucYsPTyWLamqISpu3U8Ir+kF0M5bdsI0KmWKr/i4/KOc1+SAluWsPC8LXg5fOnrEYpWEUAHIIYdbauqyDtzahv8AdVe8npDXGiZcJt9txs07pJRfnWOOCQlaQ2KkFrgRxPKy7ky5lsje53QTiXkic18oarLiNZlu7dZ8+PCHyDbjs422y6Lbilump26+vKFM6BEajV1EWxu/FXhdE7+HTbTBv5anLgaNk8KLZcqVtqqcfKGsIKAbt0xmtr3E5eKry1gpx5HZc5hx3PV4uuQ1JTEvi/1+UKZLiIKu6O1r5wZPhIJY5JvOHWqGDgbw0514a/lAKUhwROhyDpFjMkp57+6bH6qaJ/nAMENayzn4iFP1hNsUm5CS17tIbEj1uatrdifDdX84jiiCURHducpvU56J4xI4bZMtti02JBdc5VanXxr4QOMOcUb1tG1PCACVo3hZJsScynFS9ORU4QZKm6wDgy14XVbe8wVU4/OnzgOXfJlUpyNCtXUap4ovGJ5N90njW624VRfReXpAM0kzg02bMyw7kTPQnkA+jvIq3Fog+irz1ovGKuTddlZF2WEeHWu8uyWgr84stlW0mXCccaV+Z1H5DS5V+VKxpfbXgM3LYNsptIKSTkhi0jZmsJa5ntraYv8ALMT4uaRzN3QsnSnbLR4N5sg/heO7M++8mzD5plzDcZYvzXAHt3+O72wX8NseNzeB4xJ7ZTuDCzmzUsLudkmI5jSAqkYqulqhveaLFtsZir+Csv4QxiHU4xLAdjLv7USq2B+dUoqfigv2ly+F4hgODbTSbl250KcEO02SDc1/03B/BHPRp8p59SdFapzFhvMGBwuyYxRpJnOc+EQ3iMk7I/NaJFtPzk7gm0fTZTECdy3CsmJe8A13iAbkRdCLw46wBJow3JEYt/aEC/MMrab3AU5rSI8WIDZaq2Wdcead/a4U08vHnHX3N8HJ2r8jsWyVNH2zcecfqSmfer3q+PinJYr2zyzEh4/SiwRLq5LsDMdWQ3pRtzvedOacoT0m4AMTFiZL1VDfTktFTyXyi10M211HpNPzT5vzLhOvLWrhnvKpc1XjXziRDefluhMKjsu319coUcTdoWvGieFac4Bb3D+unOLYzm8QxU51y3pDxivVtIKctUFNIqwrksg5hT8yrsyy4/149Ue6hNomu+mokvosEBh0hiHS5eRlplqwjfZLRxWmUXeRxdKoKUW5E8dKRJNZpYxiD+KTYtTS3vXkz9+fdRBFKDd46IkLZrGZfCcbYnXAb6k8zmquDaqE1+6YkSRE9uha93UZ3EJN6Qm3ZSZby3Q+f0VOKL4wyzKmESWfv+EwqPFNeOvlF1juHDguNOSs+wRyb7AvypA5XqnBuaNF56cU9UgKaw4pWUk515FclXzNBIF7QiqV9F14LDhhSu/wVlRs/FE7StGdXuHepx/e/wBIkxmU6FiL8vcJiBbiiVd1dU/KIlbRtlp9HRKpLUEXeGnj6xcSQWjSvy+W9LPsTzIfsj3v+ldfpB21E8uPYTIYg3LFfIspKzJ04DcuVcv7tRRfwxnhHMW5tsvRO7/pHoew2OYR7jxnZ6dZWTnMWkEk2n8pDZdNDvDNHiJ3Duujw5pSMqvTZrG1Pq6b2uebg64FbTVK8fOLvAsSwSWISxDC5h+l12TM2XVpTimlPzikmEIXjEkt14RGvGNlm2xjPqSUZh9GssX3BD4b1p9IhhQ4VISQhWipzhCFF5sJhjGM7YYXh04RBKvTIdIIQUrWkWprRNeyixSbxL484udmkfZ6XibTrrCSjP3rRkBXluiKKK89U9KxLdslJ3F7t8wj+NTmNz9rDk2+SyeH33m2z3L9d0UG1EHivkkVEoJsyGJYo5kXWJLh2e25xtTyBF1ThWAJjNnOvK304aJ4J5eMWe0qNyGEYRhP2Zw8jpjxDS5Dd4ASp4AgLTkpLEY2iFNMspljNxe4lKHgciMs6lMRmmhcdHmw0SVEV8CJNVTkNPFYiw9DYlumGzXjkN29sh1uX8I/msDgw/OvK866puOVcJT3iI119VqsVv8AYmOnbeSvIYlfRBQBuu3a8Oa8ljWOSknNzeDyc3LymF33zMxNuXpmiSqW95Cg2panOMnNGTzzj6981gVsgdMTjLZO3WtkVm8VOQpxh7wOmz0km3MtTsE+Widn5JSGMG61U2yId1dU89IeBWNA426uYh9i3RPBYoghW2iePOCptoWkBkWusbTrj14ry8qcPWJcBaUsRF4mSdblqvuCiom6OvOC8Un2xw3o0lMTBFN0dxHMbAUJ1CVUQaa2pXy15cImZ1sXC6XkDxeY6ZMuTgtNsg4f3TWgCv4U8ICpuev8oNlXmVkXpJZRjNdNskmTVbmrbq/Jbkr+6kBlbb2u9T5Q4Jn2SSB5U224XBP8okkXnZOfA+w41WmnBaQMFo0JO2hcImmnBztxmz4xJbt6GIOVwVZ6x+zKCrKfH4j/ADSPe5DE5TZD2dt7LOYZIdNnpEHpuctucaed3yL1Fq1sfhuJY8L2MZDEdrcNanRzZdHhN4f+UG8SfRFjT7XbV4kGOTOISp5b8znJ2EJBByqKKV/CVE5pESmTx8amivin30KPGZiZ2mxgDZ+7eey2qlqFPi/h5+UWJG00eXvOWfcndw4JVfiqnDwrBOA7Py2EzLjk3jOF5jjTdjuYpNs3tI4Qkooq3pXLt+KsA4/OTRsYZ0SWl5Gx1y2Y/bvl8R+QpuiiacY6UbJstzmdMVxCto5bD5TZYX1xBs8TmyIAkw7bQoVLj9RupGIbGwbvlSLXFslHpbqst5iXHpC3rc46Sqty150UeHhEsnIONSH9IpuU6Thrb2QY51ik5ZVB01Txrw0pFf7mDbpgGHEHP6OdB94TS/a87oh7zJLZbmeRU09Ip4erhZeXXdrX5xxwCArTG1YyNSOFChRIiQewcSTmhj5tj+kRJ90XyiSa4j+4P6RPkv6SCHQTM9E6JLZAnnWlnqpaVuWlEpppSBUpXWKvcnY6K0i42ZLJnesG8HwJmz40VPP9YDwqWbmXnBcdy7GycHcuuVOVItenYfI46/imDOzkoUq4LsgDtrh3IXeVKIlOPCM3m+hrTjHqPRndlNjsC2T95YlipTE5MSzrTso12sPmtMovB0VH01r4R5K+zn4l0eQR9xFK1sXKXf5RPO43iOIzxzOIzbkyTpVdI141Wq/mqxpMRY2dZktpZrCZKdmqvNN4e5MbuQyeqmtO0S0tTlS5YwpI1Lu1udFWotXt0sZNxJaXaojhOvr2kHQB8q8/0gOESKMP6sXuySh4eMdVjimbhcyrE2pzWY0y6Vxm1l2B5IFP00iGabMQbdeIlJxKpX4U0T9IHrvRZYu6j8wDjJtEGQCClgjYiJ2V808ecA99QOTeyHsyunBdxC09F0gqbblJfD5RyTxEnXploulsZRBkkhaDWtDRUtKvy5RXUjqjw84ZJ0k3l3roddd2W4ZB0s90aUmWXGQ+0NjYZNopDQrktXu1pxTlDsBdbHzRMq/JZdzMyKBMBbyQqprxGi80j0fa7YXD8I2MwjaJvaCUmelMufZvvCYtPsFThWPHXXJqXezHD6x0UcuuroWsHpjaqzkPE4Ql26flHVFSNPgxw3+QzOzN50fvDoEwZLaNO1oiUX/ekT7L437t2hbxQHeib/Wq0FuaPeG1NBRU0onKM81iDgSRyytidxoQHrVqnG3WmvPTkkTYlLuy2U3MCrUwfbA13taKJKnKqKixzM0Poxst0tKnrDk4/h/s6nsSkfemWeMHJmH/AINsXGLh5/eqNR/djyaaxF8p83S03vlE72LPlJzMk6+6d0wDg2H1e6iipU8ac4Cm2BYN0ZnMR6iWD586xNLpUus2ckkuU3OTgdFaJ15TuFkAu4JXh4afSOEhuyj0x2WhMU4cy18fBIBbccDsEQ+kJw7zu9OCUjTMywgMemuqJgXScb7vFPnT+UBV/KJpJnPmBbUrBLtnS60ea0SByiZYdh0dbTv3cI4Fu9UeP5QXKSD03M5DBMkdimNTQbqJWiKvPyiRjZ9+Zn5x+bfemJtw1vcedJTNfMlWOSRZkwLZOtN3d93sp6w1tWshwTJwXNLKdnzrDFb6rMu71tnOHDYha4Zjc3Kzk4rklKLKsogi01ddaKJ481VarAksjauijnZ+kIFQ1AH3HMofDWiV1pDjln2wzSacRlVoh26eMTYd/IS9O2zbhS17Uu4NhtoVLg+EqceWsDKFmoOCtxKNvP5wVLyOIpiXQkk3ulOD9ybe8qKl3BfLWsBTDua+blghcVbRSiJ6QrFTN9Q3EJLoksxmsOCT6I6Dpio7mqKnguvNPCK2kEPzEw+2yLzzjgtDY2JHW1ONETkmsMeczDRbBCgom4ngkOBNbwRxYktuzzQ/HNEv0Ef84rYNCXVcJKd0tB8W/PVFX+UJvA08gZJQlSGw9wrjUqUrD5dpHnm28xtu5aXHoKeqxRJDErLuXeloLeKjvCi0r4eC+cRQoBDoJk5g5aYF9v738aXIqKlFrAqrEzYvNA3NjVEvoBV7yUX+cAzeSr8rguM4biGFszLALJMzjd/E3gG17+Et+N2zLjiuyW1+x2a07ZMy+M4ZMH+JLePmhCix5Vim0L85L4a123JBtEC0B0Gi3CtO1pzWNX0gr2iYcby2sPGR8M1LagReK1/9McjU8pj2da1Yi/oxTT7DoOsu9JanmqdGsttvRdUKq1TTgqc+Ua3AQHGNnn8Ld++flzWTa/vHEXMH/qRxP4op9scDc99sTqsdBYxGw1zK0aNdCVedK73osXhYnLbP4xJMNvyU9MYJiIp0iXK5p9tDQrxXva1hvPolVneTE43iy4m7e7LS7LhFvG0KpuoKII0rRERE5QyQVkDVueTuk1bwtuHQ/ktIvdrcN2fkffX21z3m1iTjLEsCbit31zOHZt0pWtfKMcily5xqtmXQye6tdtSww6ZcDMkCcQWZmjTq5KOFbei7iLwWqclSsRSDjjBHutG3Tfbd4F8vH01hja0Vp64myAkuUO0ngqRG3991jlqfHSsWTkX7MthuKzgDI5rF1Oqe3yFfwkna9FSvrHofs09nuKYwfVyEy45hrqP9UF2YzxW390v/AFR5Phrkuj3Wymf/APkIPzSPoH2Te0TFPZ9hRzuEYiziUvNS6GbW8WR8TRKSIuYP0XjHJxWcR0nXw2DTdjy7aLB3MKemfeXWPOduW+8yq66kvZKMw4kk6wDgyjzdNx1zNuuNaqKolEtSnrG89oGPe8sYmXZvIdJ/fzbLLhLUS3fFIwWKBKdX0ZziCXfhL4eCcI1o5SkZGVbFXnHYs8Tb954O85LWUwi0R6y4+jmWngq2n/64opKfmJTOy0bIHmiaMXAQkovrzTx4pF/s5MSMlizUyrPTpXeCZacH9mQ2mVqc0RbqpVKokUeKynQJ+aknHLspygH8Q8iT1SixaeiH/qDZTDWcbxGXl8NctN7LZyni31dUabtOKKWnjrr4xXTDJtuOy7rBNPM7hjzuFd6vnAzZutmjjakJCuhJpRYtcMxZoJwXsVlFnrnRM3b1F2ld7e51T4kWK6oJ6Z+CuZRy9rJc6w6jb4cvzgqREWX2H3CcyEMVM2hqTevnpXTTxi1YwGWxAcSxTCp2VKRkpgaS0y8Dc0bRFoQt136cCtrTjSkV2Iys/hk27KTUu823fQ2jqKFb/NK/KHEw2gpWV1DvaLKNym2OJC1OMTrLjue2+yNouC4iGhW93taj3V0jNxodsSubwXr2nS92NdgAGzeKgko6qSJzLX5UjPaw10Wwnm7Xg5ChQoZJ3WNPgDs7iOzz+zrDEs3LrNjOPTZ1uCwCSir8NFVaeMZiN4WAz8nsxIzUk6YYXMNiU9PpVGc4/wDw9e+YimoJrVdYipO0GtON5KuYxWXk8IdwbCsxtmYAOmG4QVfMFVU5VENezX114U0rJZryXEIMDvOuIt1g/wC+HisQGH2jqhIt/crxX5RZYmL0vhgSzaLlK79od7pvInZ/hRfzWHsLu1nwFy2GzeMys7iQM5eHYaDd3/LbI7B9d5dfOL32fSOK+48X2klBlm5PA3GHHnXbb8125toR+LvLTyrDJCVw8Nip1mZxno850dhyVZZAjB641U2zVNAVN09eYwpaQ94yc9hMo/iAzk1MS54dh7LJH0wtR3qcFRNR0XtFHI1TK6+DqWljZvJV41tTPYlhWRiD783NA0ElLOme6xKgqllD/Ev09YzrTOa0514ArdSsMrdPKq6r5RPPyZSkyTDu+TaqFe6pJ2tedF0iFxiYVnPs6lCsvTs140rHUuMdpytlPccQybkFbT9sevoPD9YlwmX6VNox1ly9mwLqrD5iVzJ7osq9nttJ973Kd4teCVrEsjlpNpLtPuNy7i2OO8FIefypyhNsNO6Lm69qmx+E7J7P4Q9g+0EvixYpLjMTmQiWy5/3XyWPOs0Ul2N7MsNatn2f15xpsVn3GcYZlcUZvlHwBwpe/sAY7nDmg2xlXWrJgm77rSVLh4aeEZ8PDQvUacQys3ST5uVJum25Y5Mqom2KcG6ovH1/SIiFnojZItjlxV46py/yiET3/wAvlD1ccKXFvuAS+uv/AGjYwucYHfraRCiVWmkPeAmZhLnBNdFuBULin6wfjDEpJSEnLi1NN4laRTmYo2UKitoKJr2dVrzWKiCNdRtGOhuvZUEtn49OzMzKSjLOFmHXGtxq4YBa3+NUUqfOCtpjfwzbOYxTCJLJl3nnvdauy625SkoCYXc05LrRdYy+Ctj7lnnO/e2CfQlX9I1uyeJY7tBKYfhc3O+8JfCW3fd7DuuSTpCAiJcaXaonBKRlPS0t4NVsywvkrphx0Cw+Qzsxlp07ma8hpcZepcF8ogwizGMSaGfmSYkwM1ddyicyW0qXBPGlPUoImpLKxXEhd/ZNGzeJ9kkWl37sBYhib2Ak9LbPTxdHezGDnG9xZoVGxzT+7WqoiR2NU6eneTkWn1dW0FJNzLr847iO6jjzpFbSvHl8oi6Q4cl0Oxu3MzFOm8ulE18E8POJppGjlmiYzeraTOvtpcvw05L4LrA0ybHV5TZCSD1q31uKq8PBKUgltCsSRpiWXC3ZgnJlJgXREARrq1FUWtTrovlSGSotPpkOOMMdos4717ug6V5pppxXjA9hDUS0hpJSMhnIUKJXsmjeVdWzfr8VV4eVKQAIU+zueo/zjjq7/wDCn6Rz9j84fNOI6+TgjYK8ETlCKnYnZlJl2TfmW0QmWlDO3xRda00rWnnygMo6N3diTKc6Nn29XfZd+Lj+kAiMYVN6JG2TcDq6nSqkKckTnGjwDDZA8Em52ZxRuSmgp0eXNtSKZBaodq8Bt049qunCJZ8YuaU0ymwzbGXkGego03OhieQrmKo6AC2DpFUUbQOA2W1rzWLn2U7RYPhe00n/AEkw1MXwV3qp6RMrUcHVBJF8Uur8oz+FyuKOsvuSjhAydEd3tCt395OdKV10ibA0w56bYkJlth8J14Lza3Hmql2RIqAnz09Ixa0rbexul4e+1wnbzKbmXWZTD2GpIJgm2JiXusdEeXgReKrvRlSTXcqSJ5Rd46km5iIyGHlMGyLiijhhvub1EqIkokqcKjxisCTfVSXKJRTSsbK1l1MHXqmwOaHuiXy+cEgWTKiYuN5pO9mypDamnlrX8o3GD7N9I2emcQ919LlnAC9/erJ2FUh/jTRIyuMtz81iLs7Py/RycLs2I35IiD6RNOpFRsYLq0ZpLlPkqWWyddFsKXL4rRIspfDHJrBcQxQUQklDaE+tEVS9VRFt4klUppw0rxiZuUw2XwcpmbamHZhx6xkAdERQUSpXcV4xWg+TKG0291btuZRPBa8/ONmixzraSDLcQ1bUVQkrVF0hCZAhIK9pKLEjxiTzttSEz7bva486c/GB4QEhIVl3c4JDSt7tYkF10GTaFxbHKXJ404RDAMcNtd6JDbfYMb2yBaIaVSmi8F9IUwy4w9luUQkRO8i8UiwwWT974vKsTk70SXdebZenHkIwYFdLyprRE1pCmbahEX0D8AwLaDEdm8QxCTlALB5d5kJx81ARacOot1rvcVXh84psXbnGp95ufvSZArXL+1VNNfpFschKO+9Rln5l2VkrcpwQ3T37bi+GvFPWDJzDEn8Nkpma/q+YmBIJaYf3WJwQW0t/kYroqrovlzXb1eC+7p8wZiXaFwyQnW2qCS79eSVponFeETOJIpJGiK8c1mJYWiN2WrXTjWtPKkT4thuJsPXzclZdVEJsEsW3RaKO6vygEWHzA3EZcIQ7aoK0H18Id4nyTaY0IYMymBk25huZ66+htkHDzRa6/SBYkFslaNy4dynfRF18E5wCJRk3DbzGaO6VIR7Q+qQNWFGh2bw3CMTwvEkmsSWVxJkWykGMqqTZEYiQXd1URbk8dYUzjrJSrlNoKZ481lvq97Xe8Ynw1ZRyYRmd3GzRGye3up3k37U7VE5Q3EJeZw6ffw6ZTrJd42zC+5EJN0tU0+cGbQyktLPNFLTUm91DVyy91tytopVu7yLx8+ENmiRKsrf4KybbFqZcbBzNASW0+FyclgjCzlkV0ZplXxVtUAM1Qoa8D+Xhzi1ZlpZvASmZ+VnSezRZbPK6rLtu7Xx6pRPCBG2cPLEmyczZGQdrQzTMOiJxp5r4REVDSaW3yWu1klMymGYHiruJNzL2ISRXkk3mvNiJZdhjxb0TRF4pGWcy1abIV3uBD/OLJspJZ9zp8687LW7qy6akSDupQuXKvKA0C6b3WxYacO0czURRfPy8YakucmnBeBhQZbbQAQN3iSpzX1iF3cVRHT4k/lGy2FwvZea2oPCdo8dTDJFWnQdnW21fAXBTcILdSqqaesZGZAc0gb3rK8qcOcJWvNimp2XIgRYJadcXDnmeIXga+VKp/wC6BhtrrBUjME0zMtDb1zduqV4Ehaf4YtiE3BVWOLFliMs1Ky7bTovBiF1zg1FW8shFQpTnrqnpFdBE3JaLSNhQokZ++C0b1qm6vPyhiGFHRS6FHBgA0eDshiG0OHyzU23I5zXRze7oFaorcvgvNfBaxqSmJbGdnHJxqXl5d7D5VqTy5QVsdJrRHSrzMa1/drGUkm0lMPmZ2dbmEmpkPsiK1aBCVb3K8NE0SnNfKCticRm5ZvGWJT7xyRVwP4NS/wChTjBva+DpW3a3m5s9uHZvaOTwZ3pee87h4tXOn32gqA+W7p/DGCZJXcUTD8NOZeScbbA27EQjJURVD0QuEb7DWsLmvZSM3IdILEpPEBfavMerEP2f4q10WMljDMjh+3j83I7+Hg81NMgRcWjodn0JUiU8/mU+tp+wLt5ITP8ASGaeyi/s0vMHp3SbDe9Kr+cVEnITb7zKy5sZh3F96I5dvxVWg/ONV7TcQytsc1hxwmehMtUVf2Kt6B/htT5RmcIbkunt+8s/od/WrLoJOWqmlqLp4cYtG6IM3WM5HSr0hkZbsgpPWGhuZ5b1eyVKd36LAuJSjkhOOyjytu2dk2zuBa6oQrzSCuhZYA+UzL9um47vj/DxpHoGPbEYZ/8ACzDNrnMcazVmSYdlRDrxY7jlirqNapX0iWqwjR8lrRl1n4POJSYViUcQWG8w6ddrcA61ROVF8eMWWzsw6wbk31bkvKWGbBnuu1JEstrUq8FprSKEhJF3brS0TzieVKWBk81sjcLs79tuqa+elY2OeNzZdIlMTsmpmUb6LLvGvQZcyA+iq5crYEtaZaroq1WhVjOzLEtkzbnScuzsMu3ERIpclRLainGtK8ogw/FZyRxQZ9lxTUDvtdK65F0US8apovlF+7J4TPncw5MsNuNZgWhm0H8Scd1dFp684lFxLec+ozzSTeHLLzgO5Lly2E2e+Cp+n80g3HJIncJlMdBy5HjKXmU/u3hSqfIhVFT0LwgQZZ8D33bm2+w6G8KJ/lGn2CwCb2kxmW2XtyvfB5Es9+zz0FVb14drd9Chtp1CT+kxLzhOW3U3BQdEROEMJRtHd9V8YfMNK06bbm6YFaqfrEMWQKDgxXEgkOgjOvpK5udlX7t9KXU8aaQIKIp9pB9YZABNfmmbjzhXcfGqxDDhRSWiRI4KgVii4L4kqHX/AC8eMAiGFChQASNhe4I3INVpVdEjabUvVVnB0xPp6SAK3WWvPMO1LjFNBFOCXUqqDrGY2dkfeeOyOH732l8G90arqVNEi3xliZDE5mRnHspb1WZ4XafH6J3eS+cRPfHwar2T8lWbXRZcZnLICcrkn4+K18uHrERs/wBWZ/WDR3L8RIqVX8rYdOzjk7NitFywTLYb5AKcE/nBwybWITXabkZIDHPfOpC1X01LyRIr5kj4U6ufPSzrzDW9ePVB2RGz9PWCJLE55qRfnm5lwOjZbTTzZqB30VBQV40FLl84p5udQ5dqWYaBoGxtMwrc7r2i/knKNELUjh8u1hOJyRZ5ywm2XS7G23nd4XHNFqiBbu6eaxk0fBsnxJTFi+Jv4czIPPk9KywE2yDm9lCRXFbXs1LVaQzArinOsmejsgV5kQXilOG73lrwSLN0paRkMSwvo0hPPPEANTokpZdpVXKXRKFzVU4JAsk27JvSE7lE7IJN9tP2hhapfRFh+J8Exe8Xm5PIzEtNSc1hAG82rrzZMrYNTK7ezF40Qa0HhWAJRW1w992ZI+rozL004qql+X6wzC5ltnFzmXJRubFRd6p7hvASIXqirX1SLd6WkwwgJaYm2mXJWXz94VXOcP8AZjanGlupLRKLEt0/mUvV1eijwx82JxHrWiFOOZqNIsJG+XwqbnZmUmDk5i6Xzm921224QUlTxtVU4qicYq3XVfMbvu2/pEskqO9JRxq+rdR6y1BOqULz5pTzjSYM1kGabKzNtLLQ0QjSLDAWWVn23JmUcnG60yQOxSVa015a6wXsxIFiUvNSjIqry2uXVoDQDVScJeSIn+9Y2EhiWDDhTEixhslnTjzVj2SWZKtNlbW9V1zFuItPBIyqVrXixtSoXs0yYbawcNbxp2XwnpBSjFGwWYRMwiRN6tNO1dFe4Fok2404EwJ610RE8KeNYkngAnnXRfHUyWmte1p9eMMcBywWy7R7+q8uUarpEGLazJudjJPBH9hMQfxF/o7z2Jy8oEwqrZLibZ3OkiakiU4JGt2a2exCWlJjG8ADpeGyeY41PMju2Sw5ecVdRFScItYxmyjeILsDiDjctWRcxBtt12zvo0SiFfHnG9wfaXG9hMFxCTGVlst3AOqbnN5u0nN4rO8WYeleNvlHPVy1+500sdI+Dy/FH23XnpCroCZ5lO858CeSU18VWKjElUpmgD1cu0gfu/7VYhdmXZmccmX3DOYcNXDc8ear6xNgytO4ijMzMpKtvVq8o1sWi0XRK0r4R2y3T8nDbJiGVdNhSQnXG2nhUDs5j6c0rHJiRmZaWlpl9shZmgUmD5HRaL9FiJ9hxgqODbXVPNOS+ixJJzPR3sy0dBW3cQkqvksTPuCo9SNmXGnbVbbcEtblM7q+HKIXDM6XFWiInyThHIbDEPC2u8VNF5V15QyJEOjRAnOldEiOEBOy2b7zTDaVMyQU9VWGzA2zDg+Cqn0h7eZduVvDhT84HhQVIofbuXQyJRMLwUm6inFOFYYoD8IxIZEJgDk5aYR8EFVdCpBQq7i92vCqcon2gxL3i4E50aUlnDTsSwZY+HZSFh2CuT+CzE3Jui+9L1I5UAXNy0SqueYpzpw/OApaSm50T6JKuO5LKuO2JdaCcSXwjOy5XNbvjj7NLLbSYjiWykpsyNolLl0dnJlxE3mXDuVsyRLi37aesZg5Z6XnylphvLcFbT0rTxWLPEZB7ZvEGm3nmXyclhcuYNerUw7Nadsa8OSxZSMvhs/OZk5iTcg2EsWS9kk4Lpim43aOo3cK8E5xS4YTKimHl4VihmJwAxM5mRacaabL7MJOqSs66LXx5w8MQeU2OkPDa2REFrYko3LVf3teSrE20szhj+NPHhkk7IyioCZOdmbyIly1XxKq05RC7NMJJtSrOHNI6ril0jNInDBdEBUran0rEbxGhW0zqer4Z7SsT2d2IxXZOTn5ebk8ReaJ+Zl2LD1SqZfC3Tiipx4R5Zijsy8/MuFOk5v0JT73h+UDsPTMhPGxaIqDyXA5QhuFdLk4L4RCQ9nMX7zsWU8V/wB0iaVFabZF1a7VVxOzpsnlZQAFA3qXby/EteaxFNypy6MqX7VpHE9Fr/lEToWOENa0h9CBSbcUm/iT9NI6Jk5TjbllRtAhXxSOi04YOOiO4FLtfH9Ya0tHEX+VYNxtnD2cVmWsJmnJuSFzqXnWssjHxUa6ekKNZH4AkBSXd1jXbMbG47tbMNSuESUgxksLmvvTIstaVW5wzK0VXspwrFZg0lNz0tPLLZJNycssxMFmA3a2ioneVLlqSaJVV5QxnFptgHWGn7Jc6IQdxaapVOC0XXyjdUT2ZSz+iyLCsWlsSKdOUwpXf7mwCb1GnZ7P+sVwsOJbh8zimVKo8P3aEbeqUVymlVRNPGI3sQmWv2rzjNVyFXdTzWkTe8PeOJCT7DdzxjcMuCB5bo8KxzshsrFszIO4TK4qxlNPZkuO/qo23it4+qc15RVziS3QMtxp/pRGJoG7Rtu3x43KuvpHuHs8Z9nf9DcalNpcWVZyTZvkLFu49xV4WocePY9MjIYq641mNTAO5lxa7/Kn+6Ry8PxLVGwY7OI4aKa5QVmGdc02yT7rBBVOpDx118Y0OJYcmC4FLTeDbaHMuYm1bPSrIGGTQ6o06XA172lUjIdIVTJxHKXgVydn/vEPSXP9OUel+Fa1jzfxL3iRTKuI71ioaxZbVN4UGNkGFutFLZTe+zfZfYl1L6LS6vGKpT6y635R25x0LVLdDXX+X+UYusZXU1VpxtI8pdxGkc7aKN1QWtvr4Q6abl2LQYfzjTtmOg+VKpWBrl8YIlGmnZwGXDRptwxFSIuxXmvpEDBVg1hHp2aSVZoKOHuBfQUX1Xh6rE20DTEriT0hKYkmJSssagzMi2raOD4oK6oir4wLLtKaOuWOEDYXHb3daJXyqqQ76Ba02k0hY9ikts2zs3PvTa4Gr5zaMtnuvvIOWhoSou6ltNPOMs4RKPxecJ55x1RzHCK1KDXknh6QzSEq2G75CpB+JuyT5p0JpZZpf2RmpqFERK3c6rrwSJGppZKWo0kurju+h21NqlUpXzReHpAgB0hG22ZfrAAiNbu1TWvlRIYhuU6KtWLeR7yWar/3hjh5jpuOcV/WHtgITAjM5gDpdam9+cROW37sAhkPArTrxhkKGIImiqYrlAG4PZ56cfnA8Gy/SHazC3m2wKIa/CK6QHCgpvZyFChQyRRO4DaGItu31QdaW0Xn9PGIIIdecOXaYVG7WrqUBELXXVeK/wAoADmsQmZmXYkZ+feKUk23ejNGZELSlqqCnK4uMSbLvScnPy+ITredLtviDzXxNkJIsVJbimN1YcJlk5Y/FE4lZbHrXsswaWxvGHNl5LF5Jr3paDKTb2XlOjvDvUoQqmlU18ozu30oUnJyglaMxLPTMhMerZ1H8iKKXDlmZaaazmyazA+fhX1QvmkbXbfBZv3btHKTuU/OYe7K4gbjXwuCjTv0K2vnHNf8SNTpheidDM7XS0ziOKS7u8/OOyEs4YNMUQeq8vAUFfrFOzJ2M/eZUxYrrOvatWij6809Kc41+MYE+xts/gzb4tOLLtKNh7tyy6ELeneXs+pRgyB08UFplszeJxEsHVVKvBPnFU2zFUXGbyFSuIvNXC5vtn8YCa/JVSoxoNosWwLEZdp/C2PcjjMi02cpmuTHSneDh3F2a8bV05RVG22n/wBSbcZNu5lwGwEXG3B5EK8fXjxSKyal20eEpZ/Pb8bbCTyVF5/lFYQ0k8xki25BMN6Zjd2Uvj480hSjOe8DNWm7u+Z2j81WCMODNmDlrMwSQlsrroi6p5+XOJcVlcQwpSknqto6AOL4Oiu8BIvNFrVFjW/0mVvqIHmZduTd6wukI/ZalFC1EWq19YdLC6DY7ydaa2b+8hD+aV4ecckpl1jdFtg9w+22hdoaV9fDwiFtvfEbu1bw5V/yh2FcuMLnJk7mN4m3RVp4w0dsXtIqd5I0UrNYlhGyXuYpL7DOTvTGpm0g6Tl7lorzSvNNRWsZR4M0G38vyP4kP/VNfrGsc2lm3cEZwvq5nD2TvsC7JzLaK4grq04qcVHQqcITLlGw1bGdzObeYMGDY7lyzmbJzLLc3KO/Gy4Nw/NNRXzFYoKDr+UbLbZJKZwHDpyVnWyFmYflW5Z1ftLTO64F1EtUamaIqfRIyDjzhqVypvUrp4QknQdTuIYmRxOjE3lN1U0W9e0lK6emv5Q+TbbdetemQlxtJbzQlSqIqomiKuq6fOBosgmcbVok3hLRC0WIzIiK4iqqw2FAIUKFCgAv/Z+jZ7a4O27iT+GA5ONgU2yVps3FS4V5UrxgnH9m8Wk8efwdtjpLgTLkvmsmjjBmCrcIu9k6eNYzHPSCnZ6ddlGpR2cfcl2VXLZJwlAK8aJwSvlCKvFrSWEuuH4fJuZjgzk08224zk9lparcB1Tjw7NfWKg3CNaksRw6Cwrk0k2Ls222dbSXWkXhZTstNvzs9lPN78uyLOYJkulpEi0Gg+sC4HP9AkMStlmHimWUl73dbEUkJbU8VQaV5VgQ3Lh6Q7/AFtBr6eCQrXHsEHLFKyjpTJEy6Q9XuVv1S4UXhonH6RabM4jM4e5hnRnGnP7QWW8COCN4Za7vjakV07NvzuGycsT7z8tKARIFfu3HCqS+iqgwY9LpgisTD4CDj0qy+wz2s5C7y+CacOcZttY2TSbxsD4PIZptv69YaNS4V3nnF0RP3U5r8ot/apPJie3s48yKO2E3LrlMCy3eAoCiAhog1Fac14xVbOTTh7RhiRMuUllKZpLjTLt1GnIRQqRrm9kcWx7Cn8flJ1515kwbZZma5028urmQIotyNpvEvKsZtpUvJarlTtBhMQaRt4JZr7xV634L/hHyThDpLcSa6vd3AKvLeTw80gIsxXUZ3zou6P8ApBcvPTMizNSzK0SaGx1CSvBap6Ei/SNpjQwidblhgz5gnutq22ZMM404l4B6JWtPH0SPTPbhIYXgHtFdwvZ6W6H7pkGg7V2+DVxF87vrHlmAoTGJS1m+SPB2fiuTT66RtfbDtVPbZe0rEHHZnPFoHJdns9kQ7NU7W8nFY5KiTNaPVjtpPahP3PPFlHAnOjOJvaVtMS0pXii04QxkGpieQXHejNGXbtUrU9EiRph4JQn8sus3AX9YLawp4JuYFDZe6PapKyd4qK+C+UddzixPUNh5PFA9leHj95hr20L0060O99xLjUj+FEQucZHbTHncaw7EsQm8rpk5Ptnom9ko2VofupQY9BLNa9jmEYexLZTisvmZtdp/pDtd7yQGqR5Li7Ce7na/fNW3+GpLwjGjPNmfiTorZUrfJUPsEyBEY29m3guha8U8o5hJEOIy+X2lNET56Q+el+igAo+y+DtHBUDrpqmqcl8lgOOneDk2kLv6Q6ITs25RoFADKp2iKLaCJ4V0gZkL3RFSEK8z4RZHKykwxMvMzTDbjYAQNdnM5F2l7SeCVryirhQNosdIiKlSrTRIcACoGWaIqNKCtalry0/WIoUUSKHtgRmIiNxLwTxhkSXl2rt7RIAOtuE1dTmKjDgysp3MIkOiWaVrrz8ITlFJBG61E9fWISSkIZ0luhRI01fvEtraEiGfhXyiOGBIy660VzbhAWqVTTRUov5RJJzD0q8DzLlC1/yiXDlYsdWZlTda3bzDQg/7wOyuVMb3cr9U4fnE7lRpaT0DanE5fG28NlJ1J3oOEy7cpkMON7p2peY7qdoviqvnGabbxPBEYxAOl4ezONuty7w6ZgdhwfoWvrEuxuHPYptA3hr+KyWGy+ICYHOYg6TbCaKSES0rxTRacYs/aJMPq+y0/NXvSuU26y3vsXC0AXgSaFdZEU6WHSa1KufVYzOJySsvOWD1Ya73at5L4a+UBC0eST6L92qV8decaDGHpLoEtL5JZ7PamBdvCi6oIjTRErrrx4QHNYY8GDhiAz8oecat9GB3rbU1vUadn80VOEVD37jNktPSV4zE2Eg6wJEku8YkenaIeGvlWB20vW3+dI7c4oZd27dw84kDNlpjspmNn2VSqVSLIDMRedQ3pSZGVcebdtKYDVVsS2iKmij5018YgKVcKXzWmXHEAMx403hBFWienhrziXErhngHdeILP2Vt/PVPnTzgzG2Vw9lkWpvrJxgXX22S6sQKhCHHepzReCpAsA25WKDLmRk9XoiOk6Wl1eOicKU/OHT7SyU69LBNMTINOEKPM7zZ07wqqItF9EgS6Gw9hDxX6/lHChsGz78s83K5Db4uAygvK47dcaKuo6bqW2pTyguAFBGS4EvnXimvYu3v3qeHnA8ETMw6+jWY44eW2gDed1ETgieCeUICxw8526cZlEvslTzf3U1IoJwkp3EzdFuWbnVlpV0sp7k0g1JU1RajxSkAtPSzc2+kyJTg5CtgrbmXQrKCvDVBXlzpEOFOyzU4nSxXJLdMg7Qp4p5xnibZbARQ4BFToRWj48YlmHQNGrWG2ssLVIELf1XeWqrry0omkRW0tIuysaGJLKutto7mBde2ojw0XTxT9NYhJN7xhziNoZoJEQ91aU/KG147v+kADYdD3MqwEbuut36rpWvKIoAJha3M1RKzhdTS7wiabmDmOtcNTeItSLtURERNflE2JC9KtN4e5nN5e+80dKIa80p+G2GBPvJhT+H9XlPPA6vVBWooSdqlU48Eid9S9tAKD5EJlpl2fbbcyA6onrK2kSLuoviqViOYeY6AxLsZ3MnkO2l9VpbpVEtp84asw6YBLASg18F+7cuirDkmLA6UuTveUalvCsQfzWJN7DmBmmAnBlM4QvG+gBUu9zsVa01jOTksUtMOMk605atL2zuEvRU4w9syC3MHlfT4vD84NJHrBFOCYzB5n3lVv8i5pEPCEsEOSznRkmkHqlKyqklbqVXSAW4NChRLqAd3WsMRzufrE0+rBTH2YWxbsHsX0rale0qrx/0gcVhQDGwoUO/2kAhsOjpASAJd0q0+UIBI1W0VKiV+UADh6zMNxze4695YjFaR2Fu084ALyQxBFlMubd/szRdFDK7REaKqKv51WvCPR8IdxDaT2kY5Kyv3c4y7Iut+IvDu/R1BWPMGZV1HJMStPOASChcrl09dI2Hs4xqdkJzE51gv7b1bvd4GhiSL4iQisclVN2U66T6wrEO0k65hm3L7ssTg5OQ5UfjAAUvzugRcOfLbZt9+c6MT08270gLQy7zRcxK7o0rXwjbe1gH3faK/jr/QpnOZamHQyhabyzaREQR8kWnjVKxnMcCWLYzCplqUczgdelZuZV27OVKE2lvdtD6xlRft/Q1rL3fqZrFglmMUcSWm+lg+nWOmCja5XtItd6i63c6xYYXmYhM2zOHuTr2+cxZunu9ohJE008UVItdjyb9242XvmWwv+q3gLNZzVmxMwTID4SXjdxoKxBsvMT+VOSeETcu29MgkhME5ui62pdWSEXYqoiNdOVeMbM17/BmqbfJncUl2JTHSew19/JQ72TmBy3PnTRVTxTjBTpsT9kjOzBNM5X2B410aqVcsv+Xdd+6uvCsRdJm5bMlnXXGLTILLbhuFdfLj4QftLtC9tHhUj0iQw6UPChJr7IyjWYBlciqnDRfD4ovq0M4x1KQpZzDTtfbHOB2w2jGvLnyosMwqfXDukn0OWfOYliZA3hUsm7RTDWl1KpVUWldNaLFxhk9h89hTmH4tnNuNInu+ZTUWlT9m6nFW15Kmor4pVIDx3Z3EsIl2HMQZVpJlFyBLvgnfHxHXReCxavfpYiUmIyUEZfv+96tswQC9O6XyX8oJl2Ss3RcIuHUlvj/D3kgCTAtz0/nBTMyIfsLhHsb+8g+SpzTxjoUwk0eLYzhOPSOLvT2GS0viCSzWS5ItZTbrwGKE4TfAFJtVuppcKLRIwu7f5Rrtlxwt/Ff6wzHWZmXfavutJHSbLLIviodsZBYxwxaYNWbNYk5SJBdcFgm0LcNUUk804frEddKQVNLaxLNfZ1tC65rjvLWhL4p+UUSCQoUKAQoUKFAAonIxRpWbGl365utfT0iCHQAcJKRI0CHdVwQoKrrz8vWGnTW3s10rxhkAGjksPdb2clp1/dl35h2w/wBwRQv/AFQHOo/iLwONS2TKhYwC8G2q9lFLhVeKqvOsPDaPFR2Yb2Zz0PC2p0p4JcgTR4m0BSrx7KJpAD89NvsowbxZKUo2mg6cNE05wDDWpiVkExBg2UmZjdCWeB7q21EtSpSh1TRPrFW4446d7hkZeK6xyxbVLkkN5wrBkbT2X4limHzGJtYM7LMTk/KdDzXWhIgAyS+0l7G6i1LwrB01tZin9Xy0piD7cvhEu7L4ect1TgtqSkR1TW414qvKiRk8Ext/CpXEJZhtkhn2EYdMh30C5FVBLu1pRfFIhmXJ0hQ1DLbfBexpeKLr+fjFYpH3keTT9oHzDrUmXUu3zaOIeeya2hpwHxWvPygOWbvJS7oJUuFflXjEEHsSb6ssPt/tDK0rk3bafTVYmwrh2B5jU00/uDYe4juqXLpUvJK1+UPlxlpHaEXupnW5WbH/AMt4RP8A9Kp+UE4uLmB4V7pcRlZybBuaee7RgPEWfw/GvjuxRG4c3Mm++aBcu+VPHwT0iXTqktX6YtqavHGGOkuD0bIe6W44dBtAG17IAPJE1X6RdbD4PIu4w1mz3Rm3TsEnRuuEtOynGsAbWTDvTLnJv3k4GvvA6oU2mmWVq9hBFESn1jS+xlRxfaRzEsQ7UoCvC7lXAswWjd3Ie8f8McVb+SdtL+drB9B+3zBNj9n9hsLwuTn+j5Ur1WU1fm2hl2qVd1E3vrHx/iDrBhPMAQjVlf8ApJFpG+222r969NlhaJ+VJomZEzPeHL1Q/Vd5VT8UeUyTzB4u2s24SSzhiLy0qqBXWDgaLU7y3nwHG1Ve0LrbyBiYoBWt9yhXa8+KeEQRO6nXPi32ar9EWIo9A88LcnHXcPYkrGstkzMVFpL1upWpcVTTh6wJD2XnWgdECtFwbD80qi0+qJDBS7dgAbCjpRyAR2NVgOFSR7IYzjs5PSorKWMysoZ9Y8653hTwFOMZcAuAi8IsTmZboknJuMGGUZK+Sdoqry8NIzqXnSDSnaLzJXJ3onaYNWVfJtzK3kvs0upwr80ix2flXsV2gpKnISpIjj49KeFtobRUqVLTlonNdIEmpbEJaQZmZht5tieuJou68glRV86F+cVfwKF0uAw2J5VvNUm+8SbnrCyfs2dcnGlutfL5L/KKIOS33opBmISMzLOgr/3jw3D5itKF6KiwE0o5gbsbfa7a8dpBwhl+VaBzDsNYl84ZcBJwmk0up2kt0jJ2ZWi0G9NVZZvJnpyXnMOmGGXJ9txx4G31Rl6/L+FCVOBJ4Jwr8osZkn8SzVmMsXrKPaUuS7Q9OaFxX8UFY/hb7eIOTTMjlyUz9slt3/w5ktqivw3VRfBYtMDlnJ7G25lrD22N/wC6ECNrhQgWutq/+6FUqYLkOlSl2xM5MSDgyzbj7f74fu/5/wA4qZUpiWN51ttCb4OblRSv6eSx9a4/7FRlvZwuNAy3kzBgYMk51jYU+7Ul07XPwRI+cdpMDck5lxubm5Rr8DR30Tw00jjocYtXpOytwU0+qJ/+yDaLDcMnZGRndnMNdYb6H9q+0ZmY6C9YaDTc0tWyq+KaRmpIVR1SJq5MsqJTThSDZDEzwyZF2UmnkIDuGzdT/dKpFps/h39IcWnHJFmWbyJV2a6O89Y3QBroq8PJK6rpHVkyRN9jllVeYx3IcUlGpzClxR3GpIp7LF05W1Rc7eXbXhciCJU8FignHnnniWYW5zmsSiDrjVtl1++K+acYgmGXWjtc8K/KOk5pOEamICVqW6f94JZkiN2YZcfaZeZBVtMu2qLSwaItVWunKA45whSI6SKJKJcUiRMxqwlD8Q1Stf8ASI4bABOItuzICp2ASpVfDxhPNgkwYNOI4AqtDpbcic6LwiCJEuN4e8S0gGWWFhKTU6Iz7Cgy2wt2S6DRLRNCqeir5cVgYG8xerbzMsCvT8Kd6GzbRy0w5KuCOa2ZCaoV2vDikPdcOedHq2xdRuhLWl9qcdedPr6xMeyp9EUq7ZwFvMvFQU6KiU8a6UgcocKD3rkjlYogldayrFIgK8Ltw0WlfHwXyhtzhtZfdCpekRQ+lDt/1gGMhQ9V3U3YQW372v5QCF2zSDXW5UDbbqRN6qRhqX+XL84EbZdc+7bIuP5JVfyixOfn5eWalXHloDBtABj92BFctPXx84mfg0X5KsyuWOFE8qLBPUmTcBui6tghFwWmlU5+cNZEe0X8KeKxUGZaPSWRgjk7LTjZsOmLRsXpm1QUK5Q42V0RfGJ5/DJhvCpWbbmpeZbVkXnHgP7ktaNKq99EStqeMBM4cR4DMYn0uUDKeBpWSfo+dyKtRDiopTVeWkBrMP8ARklldPJQ1Oyul3BV9aRG+xpGm4xw77d2nivxeaw9+ZedaYaccUgYFRb8kUlX9VWLvaaYw5JDD5fC3ZZxt1vpLwAwonLuFuq0RrqdEFCrw3oz6+lIazfWwnjGbRJK4aqhE8FTcoaFw8f1jTYniSuYLJ4ETGEs3yzH2ppNbUVw99UStyq5r+6kZqUDNdy10r31Xs01WE8bbttrYtUu8d7mn+USy5TBSPjE/IOSUjsTtuNqLmdmGdlG9eHr5UgaNDMUTyptA5c8xnDaSW3KmqpounhxiCFAInsvRMnMIrVU9P8AelIig/BsVnMJmOkyD6y0xYYZwdq0hUSH0UVVPnAr7JtGKEib4oSUVF0XhwgGPdfSwmmUUGCNCsLVa08aQmilxl673SLlSiolllv1rWJcSm2JkwViSZlABpsFEFJbiEaKa1XiS6rygnBJWVnfsxC6U7MPtty/WgIa9q6uvw0WqJxiZm0FRF5sNxq5o5RnIySblG6+d29d/wBUbL2X7QzLGCz2zLNv2x3pTJmAkrbrYFQQ+EnOyq80tjGOOq1MOpOs5rx03795u1eX058o9D2A2Ym9ocOm9ocPm8Lk56RMZgPtANnoWtrHFVRdUt89IxqdhtTi73gu/apKYTNS2zM303M6NLhKT2TvE2NiOt/NBMg/hih2Tw7ENrNoXMNm2HJ37C6d94tWC01uOa6bqW15qkbzEdgsUlOm7Ozsv0eexaXCYk8zsuP9tskL8S3h/EMVGDyMzJ+zTpLGINSM8zmuA10XrXiM0EWszlQBJafvJHn8zpt5PQan1ZeNzH/aZGTnZToks283KHKGOSi1qe+S+J/i5JFLgzRszRziS2ezeLExL6VdA61RE/h+S2xtscmWMaNxrD2JbD5rJz9x0vtiKKLYHISHe3eaecYYP7G7u714HL2h+04W15aax1Ue2ctzlrd3TsCYg0WGT7+Ht9ayh/HuuIvZ8uEaLZnZrA8QYN/EMWlZHpLD6Ng+6WZLPANwEYoO82fYRU5+kTuysnN4O/KYflOzGFdey89LDe8ytM5u1a/dktyc6XRmpXpMnvO9Y20W66Hd9f8AWN4619WMNEb2VrjzYxft7QPjgLWB4yfT8NHrJRLrnJO7+7Lu15trur5LrGWnFTpjtre7ctB8IklyYR5ekbzYgqjxS4qafnFylyFfE2cphBvYLOuYanvGXlJc0m3pYCsZAiQ2zKqVTe0Xw8YyBBbM7vgi/Pw/lBeyW1GN7K4p7ywSeclZiwmyUaEJgXaAxWqEK80VFSHy85hLsnMOzbcw1iC/dZSDk8eY8RonCmnlBSyptOWsSVVxqLGOkwHbLS8himMycjisz0SVeEw6V2cqgFbd40JERfKMrXdUbR9Y1GATbODPN4sE/KXI07lt5aOqjitkNptlTQq8daRlF5xq3cYR2khHeY9kKDTRP96wwk/FWFDxdW0Wy1bQq2whkUSjmZR29jS7+Ucs6rM3bbqcdfpDYBDYUKFAAoeC0X/axyOcIAHBbeN3DnDnLBfXJIiFF3FVKL5aRFCgAcSqRXFzjhQhSsOJd7s2+UAHCS0uN0OQ9wrhqWlCrwhiJEg5dy3XClNOesAyKOpx4VjkdGAQ91auEQjYNeHh5Rq8KkayjTz7QjIybIHNvBTvkqiK/ES8E8qxkltjcbYHhkth8jh+H4hKPMOyktNzbsunF9WkTKp+DmviRRSTaRNEzBSPg7OYr0mZIWs082p9lB/y5QBMvMuozLMt2Mt3b3M1XvL8qacqRJiOIrMNJKMXDKAoqAFStUGlVX+UVwLaUZzrqXHT0wertTP/AMqufY8JbnpOYaxJk5vV11tARCZEOBiu6dF+UWXSf6M7Ht4e3MttTWKum/iIAFqtOEn3Qj+AF+pEkRbJSUnOYPhm2T7Th+6mMg8wKNzE6J9QP4rW7TL90UgfHm2Bmfem1fScw98JZq0H3ELvFX7sVXnSq+Ec1JPf6HXUefH6lDLSsk4GKTfvhtjowCcm080ouTbhFbaIpW3duVVrTSnGMsEt/WMmUywDEuZhvuiSAQIVFLTVU8bY2/tBxx7B5OQwvA8NfwSWnJZuddzpKx9xS4WvnVw26JoVUQvCMzt7Ovz83ITT87MTKvSLZ9a0jYt8UsAUVUtSmnDnpFKzy+2kkstOE3vME+JTOH/0vUNkZWbkpaabGVNg5lHr7htcFDolRJeFeSxT7UYHP4BjEzh8/LOy7jJ0tOnBUqmqLRaovJaRXMEbTwOCm8ioQ/KLid94Ym4eY3MPtybCKImv3LKainol3CNNVmDPR1koIlqKNaakvHTh4UWJmWs2eAGZdx249GRWpL5VRIjcC908lkhG7s9q3wSsaXMLEEKOqlI5DAs8DdalcRCZecNro/Wh1QudYOo1FV1S7j5Q1czEn56dmJllHbSePMO1XSUk0FOa1WtPBFgRy1GhH9pVb/5RHWJx8l5aWOtjcdsdcMlt17OiRLL2ru9XVzd3+751iN8LHab3z0h+ReBrZEBiYraQrVF84MKYzRcLJuI6+mvH89fKAYt9n8QlpR11uelQmJd8LPxNH3TH0XlwVKpDvbUURfQrph1x13Oc7S04JThpBWFE+eJ5yNq6QXOHpyRNVXyiyxnC5drCmZtjEJd3MvXJHtskhaiXkqKhCvNK80ikZMmCu+MFTj4xM9UDjpk9G9n8rgky85IYpMzL7fVAyyB/eNuHaTV3ACQiE0XgqiqLFPLuTez+0Mzh+JFa5JvE0bQO1qQr8QrSnpxivwCaxbAJ0ZlJZ1opyUUG80N023ajdryWi0XxSsBTxy8x1zZZcxaO5b2yqt1fCmnrHNy5yn1J18yMYmNJg9qnPa3ixbOFhTswk3hzOXfLH2CEhoVPTkseZ7WTDvRrmrXJN4zRozDXTW1V8aKnrxihfmWVxG3Ocalzt3qXKKenPnE8tiks0zMSU010tg/u1rZ46+Spy8NU1RYzo8ItHtg1rcY1WLTJVNtOTE421KSzhOOUQGxG9SXyTnETRk073k+JOEGYjJTuETbWaDjDhAD7J9molqJiqL+kCgybpF1jfYVzePj/AK+Ud55xfYniDbOPs41LNMMqtjzQs6DeNN+3glVTUfGvKJmJEtrMbdm1nWWCfV999MleqoKuaNhVbV4JamkUcu4b8mWGts3mbwm2verRUt+dfyhjzLSTC5Dtg23jee8n4dE4xmq2NXbICjpQWgMKyyi5gHvXkqVHyokDF3t6NDE62F6rvCmirrHAA3CtbEiLwTWHtN6XEm5wu84tGincDmQfYdQVmJX7xoxPqnBUVTnatKpRaKkXCexTJVuG2rLYiygkNancu9/2jrLRuDu8qrpEd1pVGCik5hkJY36NNzI3gSr3a0u+tYzkqBP9G6cXRm1Bjkhndy8aJ+kREIqwlqbw/n5xpdjpjZvC8dzMdw4sck+tbOVaeJkSqC2OofHdLWipEmHLsyvUYk/OyP2Zz7QzLg71qdgKVS0V5rxictNi8L+TO4VmpiMurLHSXs0MtlWswXCu0BR518OcWQTss3K441P4DLlNTFqMlcTXQjQ6laHpu0XhAE1K4hhL0q7NSj0uTzITLGaCje2XZMfJaaKnhApk7NTJKpEbzx81rcqr4r5xrKpJEMy6DRyVUrrgSmnPWCehTsuEnMin9oqbGWaKWhU4ItU18YimJObYV3OYcDKcyjW3RDTu18dIgrcfwxH2D7nVCx2124acfGGpx3o0uHstzGz+KzLkrLTWRlK487MWTLREqj1aV6wfHT6RQi23f/eV7Nq0+vhBkVK+jjLgo91n3aV3f5fOOz829OPZjxdkUAB5CKaIKeSJDWmydFwkUERsblqqJzRNPFdeET4pITeEYg/h2IyysTTS2OAfEF0XlBpcWtgJY3+yOGbGTHs+2ixLEsYclNo5M5b3Yz2hevuzKjTlprXTwjFSUnMzzysyjDjzlhHaA13RSqr6IiVjjj49FZZbbssqplzIl/yiXjLSB02hZvIZN4a7LsNTzguuyZnbm2EKEaamAqqbyjXVfOCBGQxTFFkMPZlsOlFecNp2emN9Bt0A3KIK9nTdTVYrFmKs5a7/ABpeqrbXiqQTibEgxIyBSU24+46zfMoTNiMu3LuIve3UFa+cAwB8LHLYafHRaxNPPjMzJvAy2yKr2A4JB+zWBzeO4gzIyit5zzqNpevBKKpGvgIiikq8kSHfGLyTjk1lK5RMWUJR3XOHy4wXhsp0iaGXcVttXEuA3K0/LjXhE2PzPSZtHElW2pUGsmXRu5AtDS5K66rUlrzKBMKlJqexKWlJJtTmXnRBkK0qSrpqvnC3grSG9iclgYxJJd50cu9EVwOFvxJ8tYieBsJsgr1de0OunikFYjJuSUyTTy0vCqWa/wAPyWqfKBpYAcVUcVy1AJUtG7WmmnhXnDib6iaLaEjksV5y7cs4ToVLTe3aeHhzrAcHM25WaDhNuDunautq97+SpApivbrf4wQKYIomcfdNltkjqDdbE8K8Y4ytjlxNofksaDBtnumsLnTUvLXsG6zfxdMP2d3AFVLqXUTSnGkDNC7jVJbYpspg5wGG3upvSr1nAVpVVTyiRFalHpjL62tzbLlKaV7VPT9YNwuYw1iTnpSdw9t9x1scqYvIDYISru8luTdW5IrGso16x21deVU0TT84ncrHEUwy80qXI5Uk1qKpw4p8o1eyhyTkpK5Ds370YeK3fBtu2m7YXburxThSMuT826TcsU0ZCFyBvraiFqVPWNvsVg78zLS3RJlpzpRldLtGl42r30VN1F4pypFxEW6iYmYnpPYcM26k8YwTA8P2qS/oOY2zNZv2iX1S1fMELWmug6QF7UJbEGp+Wmx/+mvvZjsv+yamNFd9RNFzBX4T8o0X/wAK5aelpMsJxcZ6Y6FfO9DlzmbX0Xu2og0VLeemsW+wUsZyz+x22uDT/Q3mVbl5zoRl0Qxqo3adkVXReSEQ8FjxX5aP0yexGdRLNH6Hz9txKe7/AHW/LE42TzJPX5JNWqjpW211JE5FETbktiOFOPy2Q1NM2TM9LvGIZxo5QVYHiWhVUeVV5Rf+1rDMQk5yRwmeY+1Ya0bLr19wv3GpAQ/htVKRh2c+TmWJ1h/KmGXRNr4kJNUJNKaR005zU5qn4bWJiulZlzdf6Z0jqvhprdd414ekRzS/3BW7igG4t1veRS4acNfJYuprEf6R4k7iD/RJTEidJ+xoEaB0lTet5AVUrTgtdIl2wwmd2Zx48Em+pcelAP8AiUa/9QrasddGprCTvJzVaVll42gzW2mR0mWm0bvcfw9rMOyxCdRLSMU+Q+q1WMnG99oEtgS4Psw/g+ITRzU0w57wkXRr0N0Tt3acQJNU5xhXRES3SuSNU0MXGR1F6un8omynXms6143FNd6lU4V4+MQtheVtwj6xRJwu3vaRK72BG4VFNfPXzpHHHXHU6w7+K151XxWIqQAchQUT4FJoy431jf3ZjRNF4oWmvl4QONt+9wgEdAyCtOYqn1hzzinaKVER5Iqqlea6+MTYdOOYfiUriEsgq7LOC6GYCENwlVKouippwifaTF5nH8fnsZnQlwmJ18n3Bl2habQiWq2imgp5JABWwoUKABQoUOgASEQ8C4w9sW1QrnLaDpu1qvh5esRQoAHtoS9nlrxpDxPrxccHM3tU+KGiIr5aLWv8o4RCoju6818YBnIQW13oRJb5woBDY6nHjSHtKKKtwiui8a/yhlIAO2w2FDoAHsgrp2xpNlNl39ocYalGXAlpdOsm5l0qNyzSdpwiXkn5rpEWwezGI7U7QS+GSGW2i770w8VjUu0nadcLuin5romqx9GTknsXsVIFszg0j0vrQcensRC5+ZIfhY4CPhd9Iyd5yhV3k2RYtkxlNodopSUlJTZvYnC5t+Xwwfssy5LEQ66q4DapvES65hceSIlIocP2PxDafaTD8P8AegzOLYl18x0kzafE1H7skdpeSadmqLdpHreFyuN7X7Tt4hiTc65060GTsSpCmgjalNKcKaJHou1ElshgeyU9gW1GBS2IT0rY4yzNhe4jZpukLqbwUJKbq6RrTo1KfVFv+zKpWp1Ombnxht+GIHOCzOtvtuSwBKm07cuRl7tu92f3eCQLPgLeyDDrcqmZMGMu6+aUy7FLcHxrxVeVKR6ViEt0yWxv3RJe8nD637TKdLm5UeZtu/u6KhVLmmseX4w+0OEJgvRH+mS80b2bfuZRiO6qeKF3vBYwdsnxtax0U1wSWve5QTAGxMmyrgEraqNwFcOngvhBwYuRyT8tOtLMqTSAyd6irJIXb07W7UdeS+UVzKFnD1ebRez4/SLhpcITEJVx2UctOazHWqrlZK0oKU31pr8o0axkl/BX4g03Lk0LaTDTyNpmo58XiKpyhOTFkiko2DK7+YryBQ+FLbvh8vGDp+Xw3p02371ffl2WlSUdyV6xUpQVFVqA8fGlIp3EEToi1/KCJuDricESM6ClVidxhxlosxnv2X10RU1VPWFKEwIO59/Y3LFpvVTj8qw1hHXnhZaG5VqgD6xRNiIzIyuJarBEjKlNvZYm23QSJTMqCiIlYGprB2JSM5hU2jMyGW4gA5S6qUJEVOH+0WCfUBEeZAjXf4UhzjjjpjcVd1BT0TRIafbXlE8jL9LnG5fPYZv77x2inPVYBb6AyLRYcRXGRcK+HCG0jkMRY4Y4RnlceNB+JOYxH0dCNBb7SmXpbpT+cC7wH8JJGlkpyQncF93+7vtxzN/Sr+yKgoqCDzRStLyVITSUkFLMzbu/LNOudGzLgBSrw0T8o0+zFMVVhhyQ6ZLgbj7rIUbI3Eb3hRzu3CN1PEVpGNJCBYIkpgmiy7urc0P+S/KIdLroXTqYtqFYmyWHzMq8y6mYbAPXg6Jal6dn0XVIClxEnCVwXDFAVVotF/3WDX5EuiZ61RQ3XdzdSvYWqeP8oAbOwC6sSLSh/DFLsQ24QzMvPy3QS64f2KEvYXnb6+HOBXGyDjHU33usKlV3lg+UWWyJoZv7zL3AK5Kl8SU5p56LD2FGpWxfOuFjJHMNSyMDJy4ZbDQaZY6GXnqtVXziqk2imp4GwcbYIz7SraIxdbETbcrj0jMTMy43Kg7lTHOjRdqiLp4rSE3xuWnqdpCcFkJTaNua+3YXhrmHyJP5Uy9ldLIV7LWi3OFWtulaaRRYsSzU+b4sSzRPH9zLDaA+SJy9IJ2iLCWccnBwTpPu9T6nPtzETzppx8IBJ1t4SOaJxXt20hpw5184r/cRt0g34oe4dtwtuFlr8q/KJJtZQzDojboaJdmGha/SI3swOpcp1arpp+vOHmKwROvsuS0rLsNoOUC3krYoRGq67yaqnCleEDOOunahuEVg2jVeCeCeUcQTszLN1NK00jrrZBb2dRQtFrCGPZdsdUteCpp5pSJJUZmcfblmW80yNLQ8SJUT81pEr7Kyc50R4pWYRuu8B3AtU+JPD9YFYaecc6lsjUEUt1K0RNVX0hfYdtdR+IBMsTbkpOIQvS5K0QEtbLVVFH5LA8d3ju3fOGQxSENmXRjaq4qdqy7d/ep4xAKVjkKARZYU2w7e246xLOJcea8ZINEFdzRFWqrwgZTCw+rbW+n7w+kFyknR1rMelQv30ddO5vQK2rSq15esVsIYfNMdBmZiXbmZZ9MsetDUSFbS3apovL6pACrdE8uw+/fliRWNqZU13U/lBksktItjMuOA86bV7IBrYd1N/wBE1p6Qr2Ktc6s1M4dKlKA2jD7gKLrg1RywuIF6pygCc6P0guiZuT3c2l3zppEZERmREtVXisGy0vJHIOuOz6tTSGiNtZKqJDRakpV05aUWteUGwtwzCsDm57A8QxhhpxyXw1WukWtlaKGqoikXBNdKcVgZJydOSKRzi6I2Rv5fdvUbVL1VKJDGcSmmsNmMPamXwlZhQNxkXFQCIeBEnBVTWnhWOmgNYUCjMVdeJcxuzgKUtWvnrp5ROvk0W3gbIMTMyhtSznWOkDSMou+6pFoiJz1jTzkjN7G4XPSc1VjFp2+VUPhlxKji/wARDZ6CXjFDgLL3Sbm2+sMFyjXSzxc/hSq15RY7VbVT+0O1fvbMIXGspiTqv3TTQoDY/RPrENkz28FpZFvO8mYWNHhWAzYYngPS8OOebxTrWJaVeFXXwzFC3dVVFVIS0WixT4tKTElPvy0xTNadITsNCG5F5Emi/KE6bTT9ZI3FFAHeXRUKiVp841nWNDJbROoa0z0qUnmHMxtyTucYZXupdvj6px+SwLgosLPCUy4QMt1I7CoZCnER81SLHB9oMRk5GVk5OUlCKWn+mA90YTdI7bbCXvNqidnhxisfOs8TgE31la2BaI3cRpypWkTrqVppI6RzmXjn5dtHG5YkvE0uS1VpvJ4Lw+cE4xLSyuOz+ChM+7t1FzKXNEQ6iVF4VqiLzTziDBJRyemDlxQrctScPetaFP2hURd0eKxF10hMusEpW9lxALQh/mnOH5FHb8ErT8gbJ9IZcB1A3MrRFLzicp5pmcGZwll6WRkRpmO5hXp3uCJx5cotsKwbCtpZsWJOflsIes/8YdrBn+9rl1/Fu15x2UlmMLCZkpnBOkznYF4zUwb/ABCIbpac1VU5xhLr+fo3ik35ezPEJu3Tk2TpZhEqkQ9svX1+kRvNUynMxsswVWg93XgvhBzrrs2ycrkZmWd4nrc2CVqKcqa1XTjEcszfNy7Tg1aupvnYiXc68tdY1yM8AsJVzFUdnSyWsptpD4Amul//AE6x6f7MXpGVw1xvoklOUNM0XjLMcXl1fwR5a8y409u9bkGgV4iVv8lp9I9V9keIjKg/iDjEjKTEvKzM1LBMdiabJKKx4+YV+GkZPPT7+C07vU+z7d2HxOS2m9mxSuHrKMTcrLZZtsjliG7ponZqn0jwvFsTakcjEpSd6zNMDadzW7aaauAXjp5cV0WMPs7tjiWHyzclKTeW9PF11x2I4KL2VL8S/WLbayW2pwGclp2bkeguT981L4eB3m2TfxCvNU4IvaHReUPiODVlysTw/FMjWubPHsNkPah7Mpttp1kMcwzrGQdtzaf3RH3my7pci0XjHy9jWHFLG62+LjBNXIYmC1Qk7qpy1+kemSOPTLuKuY7KMMMOPGebLM7jevaC2vYVI13tiDAMZ9kc7jeEyTU7i+Uwc5M1vLo91Mz/AMwStA19FXjHDy2oW9Hdkta8yfLU0Y2E33l713LwiX+kuJO4SxhE7lzcqw8b7RGKZoEQWr1nat0TdVVSqQK85lndb/D4wB22QHqh319fnzpHpKp5ssHbSYu5ik21M2ZStMttbq8bRpd6rArTKPi9ltIpg2h6HbbTtLReMJx1WWX5QMh8TITzcqqpT4SXVE11gFfzjVpuZxERoITIeyVIJ+w+70/tHTMxbuGXZTTzrX5QNDsvqcz8VIAGx3uekOeuHqyt3a/7rzhkADYdCKOU/KARyFChQAKFCidh42HcxtBuQSTeFCTVFRdF8lgAghQoUADhWi3eEPZDNdtvAa8zWiRFBEu+4yDqCjdHQyyuBC0qi6V4LpxTWAYPD27Lusut8oZDqbt3/eAQ2JDtru+XHx5/KEKXraNPrT9YjgAUdVYmYWgl93XdpclV48ojJbnbvFYBnIu9jtnMT2ox2WwjC2cx97vFug0Cak4Zd0RTVVipZYcdcy0Ero+hNnpDCdifZv7rYf8A/mDFi/rZ3tE2I7ySg/hHifxHucomf6YHEeZOtt4bsvgnuLBN5vOBXcTyt+ZdHvCHOn7MV0TtLrE+zMq/M49MtMSMzLOHaDoZqm6VdavGu8RLzpSkVjOINzeGu4XLYl0TJOpj0cr3jIqDc6neXkKUFKRcbN4RPYZjfVdbkvEyRMneNw9pbh8+fOOighhxD42PqD2b4Vhuz2DuY24250hlmhkYW0X4B5r/ACjw32oY45jG2zjjrj0zmtEE2K9gZctLru6glavlG02i2/xBjCsCwKUlGxmCIn5iYmR+z0HRCIedvaJI8G9rW1tr2KSzDWf7yGyanpgN7tV6sE0Dh605JEV626Jq0/sVw9DZ30X+5hdoMYmWpl/D5l19hyWd+6l3coGnBKirROaeOqw/b2cV/FJlprC8OYm5uQGVnAlxuHOZJLnGiRab6CJLTTVYoMWl3XQksUG5zpwFf3utArS+u6vzjQbK4LKTmKyshi84WGS8vOMZ7ttxstu7h0ROaLbpHDU6bMehTu10MDKK6xNgoOZREKjeeiUJKfSixaYPNsjNyzM4w5NYfLuZrjQGgOfjyz/OL32kbNSMttNONbOJO+65VtaHiKiD1A4kQ925eA8eUU+zLxMWtZXVvmAERonxd0uIxrfNLmVuW+JWzLbszMuJJNzTjbrxEAElxeVacVp4QpbDrimc4xAmAvy68fnypG+e2xksGnn29knBwZJOWmpUZ6hOP4gJl2S4iJKnfSmkecTHSO2Y7i66cPn/AKxNNnb4KqKi7anRBhwUbRVR8nKXkSI3b/vnEFFaf7q2r6pFrstJe8MVBkilksAnqTDyNC5ZvWXLpUqUTzWBbEnpmcmBymaXOI1XxLQR8aV+iRrlrYxx0uRNS59GKccAsm7LQvx0rSE5NvvtNtPOKbbZESV5XUrA0H4HJuz+KS0oxL9JcdO0Wr7MxfhqvjDn3Io9QQTq5s4+40KWKaruVVKV89aesSSsr9u6PN1lioV2YBaLRaJTjVVhrVqzbv7FveKyq8E1Qf8AvHXXJmenSmZlx551wqm4q3Eq+NYA+RiLmMqLilVsOr4U461gdO14RZYvLSwy0pOShijcwG+1mIRNuDoVU4oi8UryWK4rbBt7XOHGpLaSJztlvXa8fGLDZxS96NNjxPs/vJqn5pFckWDM83KzEjMyTBMTEsaOE4p3XmhVRaUoNPDWCRr7HY24jmIzL7Et0Zh+pg1cp2CpVtqvgsQ4W44xM9JFlt1ATfzGrwFF0qSfP60jXuz7DTxzMzhOa4yjh2H9zNXvg4N48hRCXhx3YoZiSfCQ6t9sOku2FLAe+VN4dz4eSeekZq+Ro9PEvcH2mw2S2ExTAnsLYm3J+YbezzKwmEBaWJ8VyLx7q6xm8Rwm1RmJEjmJNxKtmQWr5gvK4edOWsV8s85LzIPDxBdLkr9UjbYftLJP7AN7Jo6/KuO4p017NsWVuttAw0uaJE0XiJJSvCFjh2lZ8zRvBiZOWfm5luXlmjdecWgAHEobS55f2XHjXSNpheyk5jmOy03NvuNYe7iDcpMz7LQllEuvYSmtiKqcEKnGMfiDLTM682w4TrIuELZqlFIa6LTzSNIaGMpSVi8hMqrlmYwI79rbqqiLSq6Frwr4/wCcTHKNys5Ny032mTcDcoe8mmi8KV5+EGbHz+B4ZnTeL4K7ipoYZbJvE3LmNCvFy2hV7JCqLxGIZuX94Ya7NyjDYHK06QDXwL2XKfkvyXnEw2LF45KVBJV3rur+VV4aRG44R23cqJFjtHjeJY/PjPYtNFNTIMNS95CI7jQI2CaeAiiV5xXUt/eSNDIjhwFasPtUHutaX91d2GQCJSIVcJptwgZJa7/86Rxhk3nMsSAV/GVsRUghiWcdElbbU0HivdT5wp0HEXHvMOyqh0lvtohChabteKeS0VIexn9FmXJQnAbT70ULuLolfHwjhudFVWxVt749Lh1SmnpX6wpVXHTHKuU9LwDiQpr8+EIryDhlZZrmEjmlqU4+NViGJ5xwnZlx0rlvNV3+MRRRJI22hMOOZgCoU3C4lVaaRHDYkEtwhtHWmvhAA1FieUVsHgdeZzWQJLwutu8qpwgfyiwlpUpphRl27nGwN1240RLBSuny+sJpGi3ImkzL1y90t0N7s8/nRIkROmzAstuMsA02ViunbwqvH4l/WGuZkqxloaVcTeH4f8l0gQdDTnCgptNDrahv3jXTTXnDShzx3ukVtteXhDwC9kRGxSU/4v8AtFEFtsfhEtjGL5M9NlKyTLRvzLgChHlilVQBVd4l4IkQzjIzUyjjROLmolgEiJbvWiOmnBE8IOknZRjAehAIuzk0e+Ry/wBwIrwA+K3c+VIPLCJh/CMDflWG8x3OZ6oN4iE+KrzXeokcz1LTrJ1pTuumpZsy7myuwmLum027M4s97rlpm7dywocxZ88sFLhxjDT7Es0jXRnydVWxJy4LbSXuprr6xs/agf8AW7OBg/8AY8Alhkg/E72nVT1cI/pGWxCTV5ksUlJYmMPzhY3nL7Tsrx86KsKjtf2Ff+n0AOuiTQijABRE8daV1/P8oYTe6LiFfVKlTu6846DgpLmGSJEajQ9ajSvD1/lE+FjIk48M6Tg1aLJUeCOd27y8Y6NjljUttmJ0sAnc+ZlmbZuW6l127q97tjbrXdIfmsV0s0WKYsTEtLAHSnuqbQuzVaoAqv01h8y1Le5JW2ZR2bN472sumSOlu/WhXa6cqecMOcnJeVDDWZhzoqPJMCFtvW20u+XCIx3nya5bRO0B2EPTOC4nON1mmmXmCYmEHcI2iVN1fJVtrASPZqn0xrMbbGlU0Ly15/PlGjxqSZkXemsK7JyuISbU3Ko4Ha6wcwRXnaQl9IBm8PmsbxudzJ2SSaXMfddvtafPUt1US2pck0SsZ5xvJtjNrKLA28HEjel8Y6NMJuZM2wVjwqlCS4a0+aRqx2JaPZhzGpDabDnG5bK6TLE8QPNZlUREBPvFSmqitKUjz3DJF56YG/qGu86YrQf8/RI0GzE3OYc8XRH3AEyThx3V0Knj5c00jKvH9LGnDtH1QW7OIsYDi2KSWCdJbkcRk1k3ukWZrrJ2qWqaDUhrpy0jYYpsDIy3stnNrJF9t/DmcRCTE3UHpLzvkPcboq6cV0XhFDjUtMuzLbvumUZe6t0+jgVvihIPZRDTWiaeCRpMFw6ZlJmemcZamZbIwx+eAN0gIyCxrxHUj9UpHK09MHUsdUmL2SxToYYvKky69hM6IhMy+78XVFVe+K6iSenCLqX2ebwyfYdlpuUxmTdAJgTZuG4a6tuJxA/EdacYppeTdlsKKWtcyb73fMkGg/TX6x6F7KxlJOWL33PWyIF/Ybcx1+vFWx7n7/CLqVcFyIp0c5hZBJzDZljEhalht30eDN7LLSa3mS6IKJT6ecRDjGIYk84+5tM++3KzwONNZRpmoR7z4kvZt3dFjf8AtV2i2anNm5eQweXclZiWBtuZeK0gmKClpF/Dr4fSPKycmWMS69/P6SyrJuvO5gWFpXd8Py8I7uEr8+n1HDxdGKNSJU9c20wr3RsS7ijEtKNvPTfXdHBM+iDXdJarbXeolPWkUmwO2soxtDKTbksx0Ux6LicnZuuA4lpuKnAkJNV/dgRvFffWxk3LPk2GKSct9nmAO7NFvTteaafxeEY7A5R3DzYf6SMtPOCRhL20cFvS0irpaYrVPGixx0VXBkfeDpq5ZQybSUHti2cY2e2tnpaSYcaw9101lBd1Jsa6tqXNR8eaKKx5q8RX9rhH0r7R3y2x9lAyfusncawc8wpgA+8bENLvNW7kXxsFY+cJpuzdH1jr4Z8l13g5eITFr+yFu0j6xwh468Y44tf2dsSPDlmrIvA6Ne0PD84Y5cPU5lwgq8C3fVI6DnGR1tBU6FpEjjpEGX2G01sqtLqIir6rEKpAImmWxamXWxczLDVENOBUXjEV0NjqpSADkKFDiWq3cIAGwoIJJboYWk50i8r0tSy2iW0Wta9r8oiIhtHd3tar4wAMhQoUAChQoldZcaBsnBURcG8PNKqlfyWACKFChQAOKOIsdjthWZndrSABwmNh1bqq8F+GIokI9d0aDpp6Q6XbzXkbqPPtlRNE8YBkkuMqss+TrrgPjbkiIVEtdarXSiRB3ez5xwU/FSLDCpJzEH2pRhL5h4xbZHxIloifWFM2GsXPXP8Ah82JcnJCe22m1Yal8PPo+HdI7JzajXM/daHfXztg3ax7DemNSWCPuSjctKK0cy6CuuTTtVVeHYvVeP1i5x8J7ZQMD2XlMPz2cMZF7Ke7D9VudcP8LhIX8IjHneJTEtObTldNtuZ7t/2ILQqS1sCvhw8Ix4Xr/Fvp4NuI6fw7amj2TFyTkJZx2WzftbzgebggAN3fhQjrHqnsRdw3D8bIvejks20BGc2LXV2j2lH4vBPFVgjZ/Y1Md9k85jOa20koYiec8JFkFavd8VprzThFHIvDs5M9BmXZRy+12btG7KaHUREuG9X/AKhSNaXF/htNjOpwf4ixc1O0m0bUtis7I7SC263i3XvcFdkAL7r+JEtJU5p5x4/tts7ij8gTktKdLw2Zm1l5ebZ1bfdD4SXgv0iLbrEOl425iEyTxTEwZnM8hQruXO23lyjabUbYy39D9ncExKZY6OctmTssLW+2SaS82PiStcU7yeccjq1Kz+Z3OtWStMpO0bHiXSZljB/dd32dh4pgg+IrbCKvG5B+VIjwVxp2Zm5YX8usoeVu/eEJIVvlw4+UW89JyzeJZRMW01vZO9twF5h4oqcP84bheFO4LtbKNTP3bjJH1X7RlxtbCr5jEu0YyOmrZR8G9wfF8AxjYZ3+mzuZNYfVjDx1zXTd3if01W22q1qhcEpHmkngjD+KuNjMtvs2u5ToO5Q32Ko1v7Pp3l0SPTExhnbTYnBsCmcAlGP6PSAMe9AdXpBDfuhbwO6tqAvPWPI9scRnJydTCpRHpbDpZ4kYk/hXmRfEa0184tq3MfD43FFLFIeTOPmLVmS3qJLvrz+XKJGcQxL3VM4Y3NOpJumL7zKLukY6IXyrGkBQx2RtxBECYadRgJ5tscw7hW1HU0uTd7XFE8Yr52Qm8AeclHGGekB949uujQh7vEaUWtycY0iou3kyak3d4KFp3LB0MtsswaVVOzrXSHSMwcqZvNjqoEKL8NyU/SD9octoZKUaO7Ll0NxLaWuHqo/LSBFQmGmcxsuOatU5co1hrx9zGVtNvRJgTMu9PKMw0rqICqLd9lxJyr4QFrepN7tNfSDcOmGpeYmZjJv6pxG/wkWiL8q1hSjJTIMMSQvOzBmuYFEp5U+VYPIeLD8LblnGMQefn+jOBLKrYk0p55qSJl1TsrS5ar8MWuzU1hASzks5h7jswbY/aLyUmiv1sBNFqOi1rFjszIzM3s4/gmEzEjMPYw1mPS5/eMlLKRpvLoNw3evCMzgbz8tNdJkXHGJ5jrAdE7bBQVqvrGbWeGg2W9OVn2MlUE3nJAyl2hcP755OxbXmnCsAKo7u7w/OJGph5ubGZA1R0DzEL8Va1h868U085NOOXPOnedRpUl1VdNKVjWDnmbg8cTjHYQpVaRRJ7tg2Cf0yl8Kk8H+2Yx9ldsstZyGpRM0zNfAgFI8lxFW3nr2Jv7Z0gvw0WtUMS8/y0jYyeL+6sNfcFybbmiJqXyuw0cuIUc4alcoWqnBUVecZHbKWNjHJonZIZB5ZhzMk0BQyFrW1BXURoukcVFbMd1dsluUB3X73GHChU3S46Ui0KVxaffRzJcN05VXa6JcyA0u+grFbWwxtLw4R2RNzjmLHsPsBwp+c2jk5OZnWMPl5wSa6TMmiN8K2mla/ul3VjH7ZYNLYDjEyxKZc8TLphnGY5emm6ld75xmzxJ0G8tjq/jLvF5V8PKNYxgr+0TLVJdnpgS4/thFXxXVvXs5ipuomlypTjHNy8KmV9JOrmK9PC2sGNalph161Cb1X40RP8o9V9m5y2BYJM4pJYN71xmYRqXkXcoiBmaS7MZt7Ll7RapGL2fmSkgmcGbkGJxycIMp02auyzgl2h59m5CHgqeaRbyMwz7tmpMcbypWTFx+xm+yaf7G6PdW0tTWm6kLiepbFcL0tcoVfwjFcSmXZ/CX5NxarZh6CLYU47p8PrFTNug2sy3IiQSjh7mdaTlqcNU/lB7LzMjjDAzUo3NyrZibksTqiLw0qiEQapVPDhADoN5LlJnsDUAKu9VdUT9Y6EX9DmqN+pBJTLktONTQoLjjRiaI4lwrRa6ovFIIB16cxHPWYblieeuUuyIKRcdOCJFcsTS7rjDguNqiEnlX8o0iIMrzaxPiL0wc47mzPSavEd/FHCrqXziRHWJiYUXlSTbpWwBJQuRPCtdYr4LbJt57ea3fEN2n8ohoLVg+eY/rNxyQRHW3m1MAyaW1HeFEX4d5K/hrEOLo2eW40sv8AdipkAE3vW9mi808U0WPYfZbsXsjjuzOLuYztOzJ9AlSmJPq9XviDXtDdTh5x5ZtPJMNzn/1Bt38TQLZb5Ujnp1s3w9HVVoYJn7KyRfcFWx6OzNb/AN27/wB0pAkwy4w8TbzdhJyiwlXRkcRYmmxYcbadFUzWsxs7dd4F4ovwrAjzvSJki3RvLh2E1/JEjtwVThymSNpGLCzCIS3bNKp51iQ5Us9xtlxt+yu+K9pE5pWIzAcoOsbUlru61H15RbYVIjMCjbrF+9obe8X5dr04xm2mpaxfQqTBsHhS/NHThp8oOzXBlmxtTK1NttPi4XF+saPaXY6ewSWYfxSUclmiC9ncJOleBB+HzjNuOZ8p3s69UPzTl/lGMVFqduptNJqc2bQPwnApnFtn8Zx9J6U/qxWifbmJi157NO1MsV7aovHy1ijmDutTLELdNOfrFnjOCzuGDLGaIWfLjNDlkh2trohFTs68lh2Hy8tiM+10uYvv33yRwWy/dS/RVilb6vAnX6fJSQZJLkuXq3Xw9P8AWLbD8AemZd2ZafkujS4LMTF5pc2AnbRfFVXujWsVU1MZs1Wzqx+7DwSsPKG0gXLlNZLxmccndo3JudkmPtKr1QM5bbNfgFOzTlH1DsN7O5PCNij2l/8AqWGYPMuz8vMWWZ3U1EaL/wAy1F9I+b9kemt4k6OU+44yyblBKuVTvF+FI+mJT2mHhnskxXZlqYz35bCgmXnF797oCtvhoUeF/qMszwuv5fse1wOiTMfv68nybtIzM+8nymSzXjdIzL8SrVfzinM3EuZ3rapuxrdsJtx2cJ3NzBd7Jev84zD5Zk9MFM5ld7h8XBI9jh5up5XEWymw9oW3JRFcl+StAYlb1la1Lx0WkcxGQGTxGYlQnZaZRhfvW1Ww/wB2qJD9n5RqfxBtiYmMhm4VdKy8kC5LiEe8qDVac6RbbQymF4jj9NnG0al3HRbal80joGg5hOF2bi1VF7N0aS1msZwmS5AWNtWScrMPPXzEwF24NByhRBH56Enyh7s8OMFLlO9GZck5PLvtKsxZ2BWneppXwTWIJ2Uk5TaM8PemXOhszJNK8NHNxCpciItC+S0WAHhszFZuNm9RFy2lf+6coIjQbtqHnMuLhbHad6Kpt61oImn5a1+cAMZigosI5d37fh0jRbNyTT+ze04Ou9Y1JtTDPwkovBX/AKTWKnA8RTDwnKykvMo8yrdjwXIi/F6px9aQR5sK21y8axwp95r3k25N5TLbHW9oRBKCgqnZRE9a840+zeDYfOTjXu+ZbzlMcpmYdQakv4+zp50jMbNYcU9hcy424n2Zkn3QM0G4BpW3xXXhxi/2baIZnMblm5lsLb9+0RVfFfFPCPOrRvjpY76MzplqfRuA7GC1j0zhMtJTLd8kDEuk1vJN26lUuzqW8Nq7sD//AA9xLDNm8Sw1+5hx6bbcmNLWm2W0Ur18KmvBONsaX2E4y3haNOTM3KOSbdt5NXEgqvZHXtEvkkbH2x7U4TOyaykv0bOQAzOkdkb+zWi6a6V5KsePm+DdWvo9bGOYq43i258q7UFhsj9mw+7MadzDmXh3t34Q7ID61VYye0RYlKYk/LTLT7Uw0S5w9+vFbi9FjQ7UTAymKuy0zJOMPAa32GpW047q+X5axlcYmZScO4XH7b13dyv+Fecevw/g83iZ3LzZlZvGsMCW+zPLuSe+e9epEUufpW9r+JPKKVxOudlGmCdeP9kyH+Lz0/KCfZ3K4XN490Kdx3onSuqtCWNX9ezb3UVFota92LDbuVbPEnZpx51mf/8A5FmX3M3/APyWviac7VO6dUXSO3h3xqShxV0lqcP6DPZ3i/vXb+WanchvpjpShhNfdZbgZdpUpSm784qMemRLGG5QbielpkmL2g6whQrLR+KlKonnSKtu1g3CY63rRb3dHdeyVqeenrpE23AMdRiTF32xpl+8Ttyz1Q7k49oa1ThDqU8a9/cEI+VG3o9i9je0Luye1U9hfV4p0lo5cQmGlAHDHULh7Q9oh8UUqR88+0rDG8H2qnpFgfs4OqUv/wCUWofRNPlHsns52gYlAwTGcSwZvo8hMtNzszf1s27cRi4NfwDQqaKqJXWA/wDis2ZwUJ3+kWzyp0bpmVucDaeDOaL5LmB8hjnovhWxbyb1kh6WS+D59pBEmyM1ONs5jUteSJed1o+eiKscMBBttxHBK+7c5jTx9YibvvTLrdypHonnj8sssnN20Vpx1+kNuLKtu3VWtPOJZYhl5lHHGkOxewY1RfJYHKACaWBtwlFxzL3Vt0rUuSeXrHJgnCdLOK8k3a1rw0iGJWwE3RHe18q/lAA9uVeOWdmRbLJbpcdNKrwSB4dHKQAchQ6GwCFChQoAFChQoAFChwjcaJ4+McVKQAciW3Nd7QiniukRQ67dtgAkZADvzHbKCqjoq3L4REqUjkPEqGhcaeOsAyTNc6IrO7l3oXKtafWN57HZTFJbFD2tlmEJjByHrXEqIuloPrRLl8o8+j1jZnFpzCPZ85hCyzZszUo88ndUXHiC1zzoDWn7yxhxHbaPJvw/dlPgJ9pm0OIY5tDiWIOPudIePJd39EbtRMofwoiU+UZrDXH8PypnPy2XD60SGlwpyEuOvDThFjiEyxgctLTspk4o3OAWVMOs9ULiW5toF2yEitQ107VEjPzUy/isyOe6Vx0AjKp0T/8AVPKkdKfy+mNIMHnr1nU9Y2L2kx2eweblsL6tmdmeivS7O8JCe+0KD5WlRfKBttJaZ2ez8Pm3y6Y8YXhzbbTUR1+Jd791Biv9jO0kts5jDnQsxyeIMzD7+Uw0V7df3t4f44dt3t5jGP4JPY+5N57c7iwhNylg2uiTVd5aXJTglOHrHnLkr4xFoPQbGUyltbFQMy1iMyTbpEN4qpPOuq5qic/wrwis28k53CsYbwuZmWHXpMKHku3i0a6k3fwK3hppyifZ2WYfmemYXiBOy4avMk8DU2yP7pbrnqPHwSGzjE2eJZ7uH5HZ3DZVEr+Kvj4R1Va0ZHLSpTCk2y82+TP2b+1ABpZYh7hJv2ivPn+aaxutiWpHE8bwRqelM7or2SV71OoLW1NK7tSWv4ooNmcIlHXnJnNclJoDFwcoN31Eq7ip4cKc4989n2xjE/JzmKTMo2LzUg4W5uA+4SWtmC8qqvDxjx+Kq+D2OGpaZSeJ7VOSUz0bDdlJGZw+Ta6wxedvcdmNd+5OKCNqD84xm02ED0lvEhFz7Y1n9r9pwPXj2v8A1R9L7QbBk7LSMzKYe1JTkvLi7M5ugEoc09RpX1WPNMY2efmcHcaYaf6O28Rkbo6NEX4u6KonDxSM6fElVOFk8Zw0CYk55/I+BsD/ALslr+o1SOZouyKsvk22rAFkmfh/d/5eCxsMWwR+RwGRcy8uVfm3XHXrK9gUTdTtEKXelSjAbRTF8yTMo243LiXf7Rfvf5R30m5snDUjlQS7WsyJ7TiuGy001JPg0bLc0VXLCFO0qfr4Rd4ni/8ASPo+BTr0hheFypTByaAyPUko1FtXO2Q1GiXLpdBuDyuDzm0yTWJTrD0vIYX0rfusmDANxnTVKkSJXyig27wzC5HE2lwHEJmekXmRdadmGcpwS74EnBVEk4poqUjZGytHoyqLjdvZnBQ0YRsN7MKqpTwi6NjD0cadwgZ3eMEazyG+/wCJLdOPCOtK3hx5W90xFK8+7YQdkeet3H6RFjGLNzWG4ZJdBYYKTliYJ0K1fqZEhEnilaacUjbVjniyh8/tM/O7Zyu02NttTbhzDbs2yyyLCOiBIhDQN1LhHVUTisR4jNYRKHjrkthY5GIVHDQcO4pVtTvQkXvKg7n1io2j6F72dHDUmhlQtRtJil47qXItNONYDemph9tpt15wwZG1sSXspWtEhrT2G1S14B4kZy8wc67L528YbEwzLiSZSm7lmaGu4laoiomtK8+EamBCS1iy2blukYu18LVzp+gJd/KKzWNj7O5NXOkzKsr222wd7o8SL8hSJdsVuXTXJrQc2kZdlMvNmc0iBvNt1opBeQ+GlyfOI8exWXnWXMRnW3JjF5sGLJgnbw3BtMirreqiPlSDsexFufamJCWJw2WmzyQbauvNXB3vmg8fAaRlZht0LGHWyHLPsObq73H5VSMUjI3qTjsQumTwfxqo8kSvFKRJKShPzjcqzYWeYChudWiKvmuiJ5rB2DMtHOOSM/M9ElblzV7VpDWlvivKNDg+y8ziMtlsWu9SahZr52r847qVHmaKcVSrhrJmJiXYYxc5adzil2Lm7mSA10rTeRbVS7nXhD8PxJwJF2QBRYbNkhds/b0K8bvRU0iXEsIm8KPrxyi/9Xyild7deEQ9CU7ilqw/aaeSffdwucxZqbpPNp/Goluk5+GnCv4o5sLMtOTvQpv7no8xZ++rS8fHspFfKTzay5yTrOa5cAyp9IsBkVO40pzurzXSLDDJQAxpl2TC2XffNoBzROw7F3K8+1ovOOaqt1k6aTWZbFcpyDUnQ5QjmCMHUfR6iCNuoWU1qWtap4QPOuSqpmS7hIJGnUGngKVKqcrq0Twh4y7pYF03KuBt/LM7V3ajUbuVFoVPnFfeN5kY8a8NKLHTGxzeQl5xh10phwU625ctpVSxeXGun8ofJzqA+0r7YmwFqGCAmo/5+cV0TMvk0DgdoXBoqL+S+qQI2OwNGW5NinROnPFh4zHQ1NcnpFL7fxU0r6RG2hmyW9uIXY8ViGJxmSA7parNW8srV46UX6xDTcqCwbxCdZaokyoVZHnwFCRUEfD0gqZlcycq+/LyITUsUyF5bhbqqiaVtUlGiJyWKcklDHdJ0CEPC6pfySID7v6xMQU0k9rHu/N6R9ozbMmzuW9q710pDHJp9z7wrtBTVE4DwhGo9FBSAsy9d+/uoiaU/nEBLWKJJRcsmEc3XKFXeHRfVIvNnMQdlVKYzMgQKtQSkUCce1SC3H23GGJfo7LZt6Zg9/Xvf5xLxfQpJxm56ht/7VMY2wwTB5Kfey/d8sbEtlacLe38VU5+MeYC++QPdeu9StV46whTpEuSNtfdmThl+GJnZcekZLjuRls5vWIqXFbW1PNeXKMadJaeim9Sq1TqkMx3EBxGWbctbYeYl22FFpqzNBO8VOJV4qvHSKV1lyXO1zcc5hzSNLhbOJYtNt4X0ZmZJtpJRjs3jvXJbTtarzrpFptlsvPbLzfQcWw52UxBoOuB4N/MLVC9EHhFLUVLITNNql3Ml0tySRplnq3GjRwzHtX8tfL9YWLqs7PzM6wr7jbrhHe9S9a6rdTSsBzINA9Rt3NHTett9Yudl2JCdn8ibdcaZoihLge9MO8BBF4CqqvFdESsW3T1Ga9XSW2GlLSMpILheJOPzTrGZPtIKiIb26Cr3h7NU+KNmE70tnanLz5tx7CFlxMAoAi1lHdbxQd0o85lxXD25iUICbm0msp7fubVtFpTTRaGnGPdPZPg7ec3gjGNsTLe1UjOS8wANbzTgA4jdpc2z8efCPN4ronI9PhepbHg89M3gTZfHfd3vT0gLGZdqVmSbl5luZbX9oAkifmkKeuA/wB2iH6xBMTM1NIwzMPkQsDltXroAqSrTySqqsd1NdDgqNpMEfSHM3MErCpTc3eVOUWkyw/IzR9Gbebl32AdsU7qsrRd+nJfCKUoJbmCycknHErRFWvdTgNPWNZgxhh2ItKxOOAqsmvHqjuHXXRYgaFTW1StSD8Vl22cjozizLbksBqStWqC95PkulYAHn2oI2KmOo9B9nuJyMntCzLzuHo9JHhsxhrwIaFe+805YX+Oz/DGck8GcmsIB9pnrc0sx03BABBKJz814xBgzj0tiEnMqNggbb/raXH8o3XtSwj+jR4fhL92YDJOzctZTLUnCUN7vXASLXlHHUqYPC+zrprmstPgqdmZiSwWcncOn8NlsUmBpk16xtHBWvJUQgUaovjpSB5dyZfnB6wd493ujrFHiU2w63JvtkXSN8XetrujRA9NPrGxwNt3+jxYh0R9zNByXamLerZtoTuvxWkKIn4ol1w6vZStn0x4PSsJnZ3D9nmCm2H2pWeaD3e6W71V2+8nmSoiV5IMW/tCxl/B9s3S/wDqEu010ed7wutEAgVvjTkviMeM+9cuZa7TcuzS+25z5/PhTSNHiWNv4viss0+xKYfK9G6OVp3q6RAq1LzuppwGOarwfVkdVLjOnGQHayYmcPxKZEZ3P4gE2NftTJJuki/CQxmZd1jrRmczMNn7ONmlykmqqvKl3DnGm2VxB3a+WltksUxKWlHpOXd9zuvB3u2Utd+Ja214F6xRY10aWlmpbrH3skrQICvYOvZL58o3pRj0HPV6usqsWfm2mcp91+2W6sAIfuxJa2p6xYtpKSZuYhKTf2iTmGjlGr81HWS1W4k0qmlR07RRTzDzk1MzPTptwys/8zMMUS0C8PCvKkOKalugCLLHWJVHOtuzNdKJTd05a1j0qP2PPq6eTTY1O4bj2fimGtSmATQO/wBiZmDtHncFd4U89aLx5RbzAYa3sfLS2KN5s0eHnlTIFf1yTF9wkmhbhEi+seaTotZ1rMzmOA7uHaoIQci17K1jTbIT8y84mFzmRMS4db0J08vOPnYadhxU4LwLnGFek0Wa+kG1Gquq21kfhs4T5+7RffNveCX4oiKRch7txcY9T9qGzs3L7De6yfmW55tlvpjTw9l4QuJn5E3ov4o80wLAxdxlufzJljAyM3OlvNW7jepBppmJwp468I9Y2EnWNrcSlJTaLG35b3qE4vTHgzavNvhljbzVU3Y5eIbrXHxudPDrZGz8nzK8G/8A75wzeB7taivEfLwg3HZfoOMTcj/9tMONa6dklT+UA3FZZy4x6J50jeMECDRS7huu2OAg5YWdvXXXlSIssiPLb318oe4rpZaOEtEDd50GACJU86wobErzLjSjmNEF4oY1RUqK8FSvJfGARFE7Ew+wLotOEAvBYdOY1RafVEjjJi27cTQOjqlCrTVKcvCI4BjYJnWpZomujTXSEJkCPq1Cw1TeDXjRefOBoUAhQoUKABQodDYAHQ2FCgAUKHQ2ABQoUOgAstmm5d3HpFqblSmpc5gBdZB3LJwVJKihUW1VTnTSPf8A20lsZiGAzczsZhczJ9AlmZWYBZi8afdjb5IgUu5qUeJ+zrDZnEto2ujffMgTobinUk0FKJrVSVETzj1ycwmZdZwbCH+ocdwR5iZuNA61p1y8SJeaL+ZR5/FN+JGux6HCpdJ03PJWW338HYtbbtZzGvxcb7teGlUgZl7KAya7Lm4O9rTjqkarE8LwvA5DEpJzaGQdc3HJdoBNxy9O4VqWiWuutKxh2QYIN1+565N2iCNvqq1rXlThrHpUaysuh59WkyTqHvTJMPNOy3VkzbvCfeTvf74RtJ6Uv2bkcSYc/wDqrxTDsuIfdkAWkVvgSlcnkUZpl3C8P+8lBxKe7t5fZ2y+WrlPDQfWG4vi03iQNuvZkzOBd0h3jmVVLNOVqbunlGdRZqNErpEGlNoprMTvJY4PsxM4xPjLYfmTcxvWy8uyTruiVWgJrokXOz827Jz7WbjM222bw515lS2tCUuPBIx+C4riUtOBMy0y9JTEtXKeZMm3G/4koUaTZ9nPBuZdcbIieVvKLt9lCQ/Ra0r4pHNXXfLY6aE6xjuez7GvYF7yJiZwtjFN9QB5q5onRRdC3dNU8Uj3uTLBZHCMMwWUamJVvEHM4miBHFAQXQV/ij5zwHHCkZOUHDRclpjJyJh4BvJw1Nd4dN1aaaeEb/FcbwvZ7F5RjZybLErJFpvpz5VAT1vJoeZXLz4LHz1emzXse7TdZtB9LY1g+HzmEUmBTcb7dv6okfPu12E4bNzk8xMzbk3h8rIzMx0GTaIBvENDUvir6xdrt3PyuEyYMzZOPKy40h372cBa/WsYHHsZ6dsxjL8o0+xiUy0MvOEH9nJtw0s8wMySijwVBKNpXnNDY2iNzGlDUFZJa99jyXaLFZS/D35TBGCmpIHQ62YNxLeNqj5by+ax5BiU1mTLn2Rkbv3vyqsbd6cmZWcfulrcq8N8OzeKjr5+EZTFHWCmH+jNNDmEAC3bdYKfCS81XTxj0+GTA4OIqZhTLJBhXTs0QZeMJZPj3RvLd+HglfGB8Wl32JBonbt8lyvBfiIfyT1i1wnGsQ2XxuSfaatmJO4HWphq5FvSjgEJeIlSkZzaKeF/EyblpqYfkWKtymclqi3WtLarT0jppxMnJVxsKacbdk23f2wBlncfgulE57ukaKTY9/4RIYG+7guF+75SYnAnJhcs3h3jyjLvEqpupGe2fmlzXMKcnGJOSxE225p5xu/LFDRULhVKLrpyiz2plsIw7B5JmUxRvEMQcQ+l2BuS6CaoAiXfuTfry0Txi28KSnlv1MqRFfdXXjCG3vVhkKNznHN9qOFHIUAHY9r9mmP4bgHshx7CX5AXZzaGUdFuYzh6qxwdUGnkv5R4pHrnsxZw3FcOkdmZlzLmpx1tyXMwHLSmZdcS6poXpHPxWiXOnhe+xhJecbDCrZRuYZnHJhEJ0HVRFTVfkqLT84DlCcmM1jdJxythnqtadj5/rSC9o5Xoa9Cbd3geNDZtXQh3UKvBaxXsIyjTrbpWPBTL46rVKj+GiVWvikapGS/cyecW+w2UcpMgLm5ZpoCfovOPb/YX7RWNh8TexPoUvNi4OXkvAO+PPhwpHiUy/Mz0w5Ou1deePrnDTvrzrwSsSy045Lg5v26KKc614p/Osd/DVcY1OOvSynQ3XtYxiWxjaGZm2JSUluk1dta3RUS13fCnhHnz82pyYSyNt7hmX3Q3b1OfHlw5QTOvjMyOt2Y3w8Lef5/rBDWKyiYH0BJJtCADVczfzHTWmYnCy0eCcF4xPF1cp2K4anjG5REtyD5JFhs3MsSeOyczNtZrDTwk4C+CLFdDmwJ15Gw1IlokcsxeLHQrWm5b7YI01tPircojbUqc2ZtA0u4gKSqKJ5Ii0inb7Q8Pnwi3n3ixFmSfmBl22wDIM2WrSqKaKXxEqU15xT2wl7QfuE52yjtd23/vBs6spdLOsOTEy4bV8znJTrKrVEVFVVSlNdF4wEt3aXnDgmRwH+zL7u6J84klDl+ptvQvut4v4qVp5Vhr3RzRpWiczVHrL6IN1eXlSGCwZI6o06vj9aQhwSspJftHH+CdkU+acfCCn5SWyjSVcddK+5DTsZX4uaFXjygrB8BxPENmcWxOVkldlZKxZh3K+749/gPpxWAmJcm5POGcRp54SHJESuIPklKL/KIy+TXGbawV0Ni0blZUcCcnHOmpOZ4Cza0mTZRblUq1urbRKeOsVldaxoZHIdCr8UFPI2Mi2pZmcvYSwbFDWq141u8uEIBzVAkDInLXLky27V3q8S8NKU+cQhce8rnAF4/SkctvTtb91qB5RPKHSTmm8por0DeId5KF3V5V5wit9C72JeWTmveDczkTEuYmzTtX1qlPSlVWCtutr8W2inUn8SnX5macre6ZqpODXmv+9KRUY5NykwDD+GysxLADItO3ncN+tUHypTjrxiuaJt25Jh5wUECVuiV3vDyRYjCGnKYNOZKdKycbBHnjt08BWHz8k/KTCsvBY4g3GHeDyJOS+UFYa6shLrNrl1eXLbOvWtUVFUxSummlViGfelXp91UKYNlXiLOdWrxCvC7WlYq+pMxFi2wB6TdliwmZaC07nZaZs6zNtoIL4tqvLx1rHqPsIeYT2lYHgmKMOS0wzMnJGpnYTB3qQl+8hafOPGGH30MZm3saAVPDgnyj0vYjChm8f2gxgcWcNnDpF3FOmW3ZprbYJeFzhUXnpHFxlO6ydfCvrFjG+0bDiwf2gY3h7m/0XEXg9aGv8oosQ3pjO7zxKeXzGq6RsfbWRubZniDv3mJSktOF+8bQ3fmkYYrlFD3vD/KOmhN0Vvg5+I0doOPWq8VoWDXs8aQRNmwbTOU2ouWdYviVeXlSI2nG6PZzeaRhuLfS0qpvefPTzjhKLszvFliq/Dw+SRsYCH7pCQ+dLeVOMPFtHXt0+3/CiF4RYbJ4b75xxjBeny0ik6aNI/MlY0Jcri7qV5wPJDLSuKG1PoTrTamJZJJ2kqiKnjrEzO8Fqu0+AxH7CCXmd3Ibyuzd4qqfVeMe04wGAba7Btv4jN9G2kawaUOWecd/tbY9TliPxjbr4jHhLf2mZtJ1sL+0Z9lI0mdmbMYPMjmE5JvPyZ/uql7f/qOOXiKWWMxpMHXw1XHK/kzTkhMhiSSJtuNvI7lWGlqotaaovCPWfZnjEp7q2gwJ/FrG8QwwpSRkTaIge367q8AdVRqiqmvCPPZw8Sx/HpNGcyaxSbBsbxO85h0honHvL2fWFjjRYX7uNqSfk3G2UQzM65zwlvEPhTdSn4YdZObELO4qLcq7RsWGGS83MzMyzKZ+W21fONnuWiJolTTmiEv1iAXsrFX33LvvS7IoS1RdE/LjBWz2KyqYg5P4il782Tma/wBrcMCEtzgtVWteKU0gPaCdfnsVJx374hBNwBG9EFEEhppqicefrG1LypjV0iGgH2gV3DNoXMorMo8xvkuu8Pz1jQ4xj8ptXJtO5XQ8ZGXtedarSYIfi8EUefdKtdF0xeKCSg31dMsNSv7aKS0VE8E4QGy4bSi42ptuV3TRaQuTt7gOda/qS3xDDp7B5w5TEpJ9iaBvNyy00IaifmNNdOMRYpiGITuHSLUw8DrMjL5TKNtCmSCmRWkqIiqtxKtSqvnF2xibuK7G9BxIUmZfDERuXdT76VRwl7PxN3cQXgpVGkZlelyzbjDb5ZD6JdYe46iLVPWi/RY2X9zFgh7o27MsXZe6BXnU6omq05IvziNxx9ubJ3LcaE623fD4RDIvuS8wLjeVmIhJ1giQ6pTgukSS5uTM+BTL33xb7rtT46KXjFkHpAYir02cjMzjsvJv5JTQ5touu20SaQOF1va8Ui12qwyZ2a9ySXTm3XkZfesZO/LvdqJCSdq9BqnOMfs6A/0haffZ6bIyh3zG+oC8A/s0Lu3ImkHze0JYi1hOJS0oOdhswQACdjKQ8xkfHTUPSOB0xqxjt5O9GvSnLcz3tRl8ja+ZczRc6SDUyVvxOAJEnrWMtHqHt/wnom0MlOZds5Py+bO2jQc+6pW+VCGPMbd8hLSlfPWOii+aRJzVlxeYI4UO4/KGxqZDxQe8VNIJxDEJ7ETYKfm3pkmGQYaJ01KxsUoIJXgiJygOHWwDGwRJzT0nMjMS5ILgVtJRQuKUXRUpwWB46SUgEchQ6GwAKFChQAd5wkjkaHYzZyf2nxyTwXDmVKanHhZZroKmq6VVeHrEu8LF5Lp05qNjBn1jtEt7XyjT+0LZOf2O2jnMCxMR6bKuWPWHcIr4IvOMvAjw8XgdSnNObSchQodFGY2HFb3YbCgA9C9mE/M7OyE5tDKTPRpgDEZdxON4ipfkqjG69nmy+Nbby09Nqc3PdAum7O1vKfWF+hKvNYxeC4W7/RmVkX7W232elm5/dtkdVP1tFE9aR6d7FNvS2Yz2JJMqYxBl1loO7LBaosp5kp6rHncajYS6eT0uDaM4Vp2PLsSZHA9ocyba6dYR9Ia/eFU48K6xknmBywm84HHtbwyt1KURPIqprG42seHaF4ZuW/8AqBb70k01bb8RD8SV5cR9IyU5LvzV37aYUuyIeHkkdnB9kZ7nJxcfiThsAtmR7rV38MSEwDs21dMZa2LfVFHLIeVfNE+qxcbItYM1Pi5ijDk3JmFp2PZLjdf2gLwuHki6Lzi4LYmdm/62m328GwN4y6PPYn1ZPgnwNDU3V/cRRrzjV667ToZJQneNSlckn5Ocdlica62087OFy4S1HfTT1jTbLyGKSN2JYg77tw1wClzmJgfv217jYdo+HdpT4khsjjGy+Cyc3h+G4a3N4gduTik8FzjdONjPYCviVyxW4xOOYhONvuzszOzTjNZg3jvW7wHnbbTTx5RyZTU08HVFqep6DL7UdGwTF28NYncLkbG2zeM8uZnXD+7D8DfaNUHVfii+2R9yO7ON4liW0k2xNYeFkmz0YXWcsaqIaLcO8XhHmm1AdGlpPZ13LYmpVlZjEDeP9uQ1y/4AtCnjdAuIYv0HB5bBmnS63LmJm9pBtNK2IJVraoldrTWOb+F/c6v4rGftB6XNYo7KYDiEo4510u8zNZouoW64NFVKfwr5RiMW25mZmc6thoZMGsl1lolo7pvGSrxNV1qvBeGkQbI7Sl0bEMGnZluUwnE2sqZe6MJ2mgqTW9S4d/jaqecZjBTw90HJaZdynnNekG7aDIilxJbTfNeCJprGkU4jJZgzl2nFok32yp4BPYJivvDFsSazO4PWdPUdZeXHmL19yqq6WppHl01lvznV9UQaup8NOP5wTic1mzU90ZnoMm02lsspkW9oKV8XNaqvrFWguNy+ebJJ0jscd5E7Sp89IunRteSK1a6wtti4wycCZensSxl+bcmGwJyXO0XFKYru5ly9jjVdV4RmXzUjg6anbuzvcLi+KnjAkwbDluWFhc/COlIOR2uQ3RwocoENvnqkcjQgQkqV8+MNjtIcaiRbo2/nAIZDobCgA6kasWJLo8nlzDrbxSmoH2SW013V81REpGTjWyqSSYRgWIOfbEl3jbmZeihwNCELvxDdryiX10NKc21NF7RsEdlMSw/GZbEmZzp8u1NtOy5atlYh0KnZMaEi86jXnHnbom5OHUvvC7Zr4rxWPa/Z9s7h+1uKJhODWy8nPPnYsyf9lVN5CP0HdX4kosefe0HB39nsbntn5m5rosyQFZ2cwdPVd3hrrHPw9b/9fmDor0ZtzPEmXl5h6SeMBscFd1wO0B/5+sES7MlMMywJNoDzrtjgOpaDaLwO/XTx0iTGZqWmp8p9jCW5aXNsWsu8iTMRtEU6/Eq7/hVYqI6lORvRbsyQtT69IB2akWHbHnZfRKKtEJCVKJXlWB8bFpqd6M3KtyxMAjLiA7mI4Y6Kda0146aeEdlysDoTkxlNuWuX3kQ8KpcKf5VSAnzJ11XC7RQS2UhtBziBfKOFbu2/OHjaDvWDdwiMktKkVIi42eTpPSMMGUbmHZlosvMey0aMd69F4KtoklF43RUvHmOkXjDpZRR4MytvlRf1iSZba6UeTdk9obqKVv8AnEj8Go2L2awrGsNxV7Esdk8NWTlFmZbMr9oMVSrKfiVOHmkZR+y8rF3a7qeUSyEwbL4+YqH1hs0rJo2TQ5blKOB5+KevhErlEzqaOyssWjYiZBDdtzBD8S8IKlJx5t5js2M1/ZCWi8a+PzgRpUv3uyvGDMT6EJixJbwtBab2vWlzKnJOSJFb6Ge2pYsSWIN4VPo65OSsoDrSuS1p76qhKK/DonNfiSkQyU3jOGybsxLK/LS02HRjcp2w42Iq6/SkRrj2MJIzMh7xeOXmMtXRU61y62ar4VWH4tic3PzEvOYhOuzsw1Lg0mcV24KUEE8EFOUSqf1FvUj6QCZcPozTF3V6mnz/AO0DgVh1oi+sNieX3cwyl80UHz3a8F0i2kziBjatj2guLlrp84lZRnLynBczlMaFXRB56fSOq2zmADpC2Nlb29/zSuvyiOcmXpqZN99y9w+0USPYfPKz0ijIqIpRO1dVU4r9YOkVYealZZ1hmWG5wnJneq6NEW3mmltEone1io5wRNDZY3mIdATslVErr/vzhTHgpZ1uDqsdt7PnEkwDrTtrw2nx189YklUZE82YqQD3E73lXkkUSPn5lZxzMyxaEAQQAEoIokDOfF8UPN9x1oGzMrArYPdGusGuyrrcq6y80TbjNrg3BaW8iVrz4UWJ7R9wxiYVqXynKutfsxvW0TWlSp400jXv4aUlsxIzvS7m8SZRsOjGQg0aHvA7XtEiUWiabyaxkGG5RmcZdmEddk70ut3DNOdONItMNem5iWcc6wpWWBP3W7nEt+pRjVXKxvSbHcufbTKPyGNYRJvuI7k4Qw0jiV6xBU0QtYw7RJqJXWqn58o13tUxt/HJ/CXZlsBdl8NbZUg/ab5ld/1RjIuj/Li5FafxJsGTzJy5ALksrJ5abpXa172vj9IDpFhjeMYpjUw1MYpOvzjrLDcu2bq3KLYDaA+iJokAJvKgxovyZNa+ghizemZEpJW25Lr3TuJyugJzEU815rw4RWlUKj3uCxzvwWCJsTFu9qNTsdLuTTM3hZOstZzQTjCmelzZf9NRI4z2JOSj08SyDcy2xaNgvOoZ6JrqiJz8odJToys+3MtpuifY47vNPmkS65KXTbBrl6uEuSLuJzZIy0yy4Uk2Z7oZ1tS+iIqoviowM1iK4thUlhU+5SXlJgnL22bjEDpmfvdlF8o7tcbj0pIzanXNVwS/EQWiheqhZAjRTWCjKTbKtqr7JuLu3bh3N2F6pX/FGWPnybZePBDNOvi871fR7HuxSltEpT6RYFjcziMi3h/Q2V6OSnJ0+8Z5kIrxIapW1dE5Ugh0ZbEm8MYR9om03LjCzKuquWZ96lNC8Ip8HxNqRxpqfmcKksSbbVfskzflFoqa2EK6cdF4pFr1EPdJOTs90yfcfcZbbF6tRCto140+esA5RCRoXc46c/CLSfN9oMh2XuFi4AA1uQEPeqlOetaxXvnULWyc5XoXin+UWuxm+9yw2YbdmJ88ME7enNK0nhd2g/6hGJ8OmJTD2XZadk0fJxN7rKjrwoqagY+OvgqRTyb0xJTbE2w4rTzZo42acRIV0X6xebZE3N42/PNfczlJneKlCPUk/wAV3yhfX9x36L+jk9gjbGHDioO9NkXQUQclyRFZd+B4V1D9CTVFgGUZFXmmxacdcI0Sz4vLx14R6J7Hdl8QxPp+LYPMykq5h7N59OIeiOjxJp6/doqJw5rwir2pfZeedxHBcGk8MZbcQ5uUYuI2C+K5dcq7h8K6LyrMV+qU3Lmj0w5UbXpISjzsthnS2pd+ppLvO3Kxbu0KmhLW5K/DF37MMHnMblH5DD2xdcMhB2/dsAySjiL4oX/qpGb2gd94TjczmE/dLNIRHotyDvfRY9O/4fWSCTxmdF1ljKlHgmHplOpaAgsAtNbryGn4teUYcT+HQ+Tbh7VK/wAFT7e9p3NpmZHNYYD3dPTkuDgJvONllqF3og/nHkUekbaYe+7sUuMEP2hvEkkp4PheFtUu/iT8xWPNvCNeF/lmXFd8kjuXu5d3ZS6vxc/lEUSsgJnaTgt8d4q04eSRJMk2TTGWzl0ChrmXXlVd6nLSiU8o3MBjjxG022Spa3Wm6nNa8ecJ7Jo3kZnY376drWtKcuEQwoBCieVNoHkN5jObou5eo8lRNU8F1+UQQoAFCh6W2Fxu0p/OGQAKHhb3rqeX5QyFAB2CpGdmZN4X5dwm3A7JitFH0gWEvhBMROklK0rN4DMTn5nEZk5mbeceeNd4zK4l9V5wHyhQlhRFtIEzS03k5ChQoYhRY7O4VOY5jUnhGHhfNTj4MNDWlSJaJrySK6PQ/YNg0xi+3bAyzYm4AE20p6CjrvVt1+ZKvyiXbFZkumuTRBodrHm5mc9yYJLMNsycs1J5oH/askVTM14XKhFT8KRlW3MUamZl2WlnNwE//EjdDu8qJ/lFzihDJ4xMy26+5eTYiFCF0xK0d74d2tYrHTnZqTmcClHR6Ld0qYe/vTHvGXHLHknjrxgqaLCAmrZSMnpxielmsQYbFiYvM+pFRLeK5bi/CvDhul5RsPZgmxm0uNS0ttm1jCLvXz0gA5g04X/EniVKpHnOCu5E46w+N0up0MR8u8Pn4eMbnFcExKR2PckcI69uYdB/Fp2WuNtoF+5ZcJE3V7RqK87fCM61rQu0mtG95bwWeL7W4JsptFP4NsTsrs9jLjvVyM9NShTLzJeKXbhH/DakYPEMXnsTxtzENosWm5ucNor3r8w+zuhcugp5JokR4oIy0sxlNdW1+1ttv3q3EveX9EivdckHZZ9w5t05zOS0G2URsxXtLWtRovBKfSLThkpr7kipxDPOmkFfLNu52YP3y0tC0iVyvhGr2VIcPZLatxu/3ZMN5IH+0mFqoJT8NL1/dpGfwIcWfxiRbwLNDFOkD0Y2TLOzK7tq8qeUa1cAKYyjnJp1jCUmHG5iccQizX0S50kTvFyROXFYxrVFXpNqNJm6oKmaxJhxlrEH5tyZmpm5yYvD7x4jXvc/iVflETLOHuyE3PYpNuBOPdZKF3HLS37uK1LgnLmsTbW4qzjeMSck61LYNh8o0LDLnRusyh7BO2ds6aVRP84oX5nDvdfRm2ninM776+g5VvZt8bta14aRURlBPbMncWxN6beV+6hOOq6bbbSNtCXK0U04Q/OlpQlNl/7SZ8SbXqU0ITEkXtLw4aRV5amdjfJK6xx/ufuDF4wZ8ySxww8xes68jduNve3kTVa+S/WC9tMRYnsbd6E42skx1UojTKtALfHdBVVRqqquqqsDPyy4ZhYOPo4E3Nghspwoytd5f3uXl6pFNxgVerIbNZcTpJb5w2HIqiukNjQxHbscrHIUADoUNiZttzuwTNhxFyLWORosM2dmZ0BebbuE930KBpzCnWHujfD24yisszY0mi0Rcp40Ozrc27hM8yMo++xuOZgAqiyaV4rwSo3fJICewp8QuFtwh+IQVY3uzk9N7N4dh8sw3KTOZmTDjUw1mN57jSthcPAlAS0rwIlialXTp1LpUrz1aGKk57EsFxd4ZSZPfubuZVbTHxTxSJsdxeZxNkPeiOOvBaHSK6uIOiXV4qiaIvGmixFLz06+4bj0wCtzBmToZY0FeNUFKW8e7SASfN1gwJwbU1yzr9Ri8fMxqTLTEYxOhJjSShzRe60fKTbFBudC0vUkRVRK+sBSZttzAG4lwitaENyLTkqVTSE09Yu8N+lOMdyCbd6wex2w50jTHQyvrcgJaxYYRMNtm424006Jgo76b1F42ryLw84BctzCs0GunOJZVlx+ZBuWQjc4onDglV/SC1wvYsMQk5RjGTlfeTDzDbe5MtCSie5VPPjp5LALxZkuBIn3e6S148aaekKaAhsf/vhu/kv5x1t99uUVivUOEhKlE1VPPikL0GwOQkC2lpEjttoW2/r9fpX5xGWp8b4ZDEOh4umD2YPa+sRR2kAEkwauuk4S3EWtaU/KG2FZdburzjkTE6CPBlt7g03DK5K01gGQVjsKHIBZZOd1FRPrX/KARHEplbcLZFlrSE1k2OZl91NynCvnDIBjYdD2AE1W5yz+axxzceXs6Ly4QASyptAZK4xnJYSW1VNaLQtPDjExTQ3GywpMS7giB11VRTXWnnrEWH5HSxWZacdZSqmILRaesRKI2iqFva1TwhD2gkbl0dmGmm3hK+lSou7419ITqt2dW4XbXc8vi9YIF+QSU/sXXo0rdVNVQiVV6zjuqiUSmqLxjuFSxLNyrhC3lmel43oVOKU5r5c4AsBy+Wkw2rgqbaKlyJ4c42Xs29zT+1soO0xToYab32uYZ3jFtePHjppSM7ich0bE51uT6Rkyrqje8FhpQqbyd1a8omwlwfeMqz0nIyzJx43ndy4arpT/AGqxnWXJTSi2LQW+3DGCS+MTvuhyb6CDqhh+aG8raFRLuSLTjTnAGDyr8z0SSlGy+2TANDvKmat+6i8tFVICdnlmJdZZxBW4xITNewXP68/SN5shXA9pMPnceBrF8EwOZcsyXvsz9m+QtuUoVVtrzWMdaaezbSo9zG7eSjmH7TTWGvg429J2sOgaUUTFN5KeSxn4MxmfexPFpvEZhetmXiePiupKq8/WA1jpWLLByvN2mTkKFDitruxRI9ls3brUTcG5dUTRIZduWwkEt7y4xI2gj2teCinjrz10gGOmBYRGkZVy6zrb0pQvLyiEYe46RumfC+I0SsAFoirNYL94v2ZxKj+FeBfLh9IFnCb6Q42w+44z2QJRtuROFUrpCkZjosxd2x1A08RXRYfOShMjnA4JtEVBLn4pp6fziSr6FkbDUjhjryT5NunlgMobe84JBcp14IKLSi8VrFeqy80YNi1lPG5267qovCqcqeUMmM9wEJws1GxEUPjQaUQf9IdI4nNSlmQ5lk2tzZDQSEvGvGIx/UuWi/wW8nIzcuhTM23kSj2ZKDM8RuTQlFE1OieHjFfiMy2E/wBJkmOicsm9T0pRaqvarrX1iaSmHcTdy52dXNbaLJvXt63KCl4rrSvOBnUl5h4rS/cv3C/LSHHzuJtunYjnVYWXllZlsrQrnb1XNWvhwSiaaQas47NYJLNK02Xu4y7XeAyTRfJC/wDVFjg+EZ8vO4HOszATzrCTOG0C693jZ/GFafiEYB2ZnQlSmJJzdanbWXXPBvWv52r/AAwsv2KhdbT5G4dik8yyUpLOZYumNQD9oXJPlXSCDexLDMYzHHH5OYZNW5jNa3m+RCQFx8xXjDWpHJxToq9GcecPo9HTtyzu7deHHmumsWmJDlScliTGINOzUzmZttyuMGhUITUkopKmtUrGk4/qZ9X6EM282OJS8v7salbWhDqam07dqjiVXdqnL9I9abxLZLCtj8XwvCOnm3iLUuwznWCeYPWOOOimnkIj8SRh/ZriszhwYhJMZeZOM9h5rNbfpqrJivI04ElCEuHGIsZZJ1eqyJZ5z7f0TNVCAXqIDIV1NQG3zpHLUTmNCt4Oqk/LWXXycx1x09j8Uot++10j94C3HP4hKnqkeaUj3LDNnZLG9isTxB6e+1dGmJc2bf2ghnMnd+LLIKeNseHfuxrS8x6Ma19J9nInYNgWnxcZUyMEylupaVyfVKVSICW6GxsYjwtvS7QedNYaUch0AiRpsSZdInwAgpQFrU9aaaU046xDDitu3eENgAKw6cmMPnmJ2TdVqYYNHGzTiJJqixC64TrhOGVSJaqvnDOcLnBYd/ByFChQCFChQoAFDobCgAUKFCgA7HsvskafwzApaWNmXL33Mo6GYVlllzTREXIbjIv4a8I8y2Twr31j0hhvSRlhmZgGiePssiS7zheQpVflH0njWE7KbL7ABPZ/vCemLpfC2rKfZh3AcIPNN9fxEKeMZVJiZxk2pRMdR5DtJh2IOTjUkxkTN8w6zLtS5ieYSFQjuTiiqOninDSGYK+/hmKtzctmXS9bezz0Ko0VCSmlI1u00g3i+z2FYhgWFzLQysj9uMaKGajlN1U7KIlqUXegjYXZi3Ept/GcUHDW5aUN+dBp4c/JTtCtK2enHyhRXVKcy2/orkM1WFXb2ZrYnZDEnMbcnpbDZnELHlDD5QAvKdmE1Qf3R7RrySic4qSkdq5PEpvGenTclMXn0h4HlaK9O0hUVOfL5Ui6ntp8SfxIiYJySlbMiWZE1HIl1/Z+nMvFYo9p25ySZbfm3G3ZWcJwJea+8uyzS8m+Y62pWmqLGlOn9dXefBnUf6ae0eSsxDaF2efnxx9tvE3JsURZk/vJckX7wLaJXkqKlC/OK2WwR1cXfkCnJRsmxvAnHbBdGlUtLhqi1gbEp0555vqG2h3RRpoLU00+a+K81jXSGBz0jJf0lnZTNl8JcblrH9M6Y1VtuziqImq+Q05xFVuXt5LopzO7wEt4dNbL4o0r7GTP9HbmVNriyyqaEnwkfj8P70W+0+2kztttpMYhijrclLMMOzHR5QLWG3EbQUtHhUituLnGPx1x9enYtjGIsz2Kzbom7e8Wa2S7yrbTtd3wHhHdlsXcwPCpzHFlJCdNx4JcWZyWzQLdI1XilLVsWnOORqWfVvJ2JVhJhdoKLHmJtidd6XmdIT72vnzX18IGZmm0ABcZQxACsThvr3l8fSOPzJzDxOTLzrmYV5/iKIGxJ40bFRH1KifVY7VWy6nCzdUzBHdv3RdtdOmcMGZmJdXMNkHdUGgihuaoNeO9Z56IsC4dhM5PYfPYg0IdGkAE5gyMRpcVBREVakqrySB3Z2ZckQkieLo4OE4jdd28qIpetERPlDnXYUdOsnJ6bfnZs5iYO5w/y5IieCJwpAsKFFRoRM3HQo4S1jkAhQ4UugvCcPm8VxFjD8PlnpmamDQGmWguMyXgiIkeoYL7LdnVwd1/F9u2ZbGgeyQwyUkDmrj+HMQkElrpu1SulYh6ipuaJTZ9jz/ZrZjGdo8YYwrBZB6enH1o2yylSL/fjGzmNhZvYtqXm9v8JxbDW5m7okoAALsxb2luWqAKeOqryTnGsGUZ9m8zjeG+/wCQfycvsNdfOvJ+wIa1BsCrma8R58rrENrsY222QlpDZl6b6dLZhzGHbgSwAP8A9peqrWnab1XmkcFTiWmdI0O+lwy213Lz2W7dbHbP7D4q/LezcHhcUW735gniJO9cSju0TmNKRlW/dO0mMe8vZxsE47NNy7jj3TZkZiXlS/vUE6Jup/eVSvKMvtIuM4RIZG0200yGKD//ABzpOkbAEneTsIqp3OaRBI+0eSPZZ7Yt9ialsBSZJ2WNtsOlt3cbnNLkrxHhSOaKTTd1Olqi6LOhtcN229qEnk9P2vZ6DhX38vLTzLjxiRaNkgIqUUtPJIyeJ7US20c5J4VPy0hh8nh0vly7zPVCBqd5OFRFUyJdERYyuHO9FkGZNi5x6dNHXf0bH/3R3GLZaWw19gpS6xxy1oFzEW/dNxeBKtKjTRBGOxaK/mcb1p/KCmxST6HjE9u5Yg6dgeq7qfKsU7Zja4jjd1efNFSNVtCzOv4Qxiz/AF703fc7fcZGh7xH63aRlJh0nXDNwREiXugg/kkddFs1OSqmDDpdw5dc4EbWtUoQoX6wkccdMe0Tn+XCJehzbuGdNSXXorRZZO8rl1p6xCQALQONvITnMLdU/wA40v6M7T5CsewufwXEjwvEm8mYCwjC9CpcKKmqacC5QE+0TDxNkYEo8wK5PqkGYg9082VbYFokEWzT8Xj5IsBCtiluiXLWARO0LZyLtxDmNkij5oui0/KDcFZdBuaxNvIJZIBcseUFQrit7JdrjyrFSkGvrlsNS+W425rfelKouorEzHgqJ8gbZqCxyJAubseS3t6cF4eUQxRI67ju8YbDt2FAA2O0jsdbTiV1tIAGQU+3k9U8PWWJ5W1118dIPnHcCPZySSXZxBMcz3VnHTMVYNpbcu1KXISLdWq0XSKltKnapIHmsESOYsMgiWcbbOrrea3cNwVpVEVFVK8q8KpEaJaNxDulWkN7UAi2nG8NSWamgZmG1fcdXJvG0ATsIJcS14qqJwiniYhU7ibbK0ePOkRiVK+cKCmJGAveAKily03lonziSdednJ033LSceOq2BalV8ESB0WDcLmppuflVY6x1sqMifBCXh+a19YJFHoGbHW462V1i6mMO6LLSuNyrefh7kwQDvrVs0WotuKiJaVNdOKcIEmMNdalnX5h3LcByyw+/yJRLgqovFOOtYIn8WmFwCWwOXqEiy90h4LvvHySly+NB3U8NfGJnqtY0XpvkWO2m0j2Psyzc3L4a7PNmbkzPsytj8yZ/3hovWU8aJ84o55+2Tbw5ZJplxl0lN21UdOtN0teCU09YAu1S3SCm5pwFcdcJXHD/ALzerXjWvjBjYWVxYdKuT021Lina00T/AHrFvjE6MrI+6ZSZcfZsp1v7Leqoh4VLjTjSIJTEsRSQdYkmRaAysJxsOstL9mhcURfBIttoMPJv2fYLNe78pQmX2nJjvPKSCafwonBfWMWbrjI3Veicf1MZChxJbDY6TkJHbL+rutona41prw5Vr8ojhQ6ABsSNG40d7ZEBeKRHD7uzypAB1tBQ+sut8uMMrDyJw1MlPj2teMPMBzrXOr8ab36QDIqLFvgSSD/SZefcdRejn0P4c3u1/wB8YqCW6FCmLwNZtNycnXBaFglc3Kpaq6JXy5ax02Dl5gW5oFCqIq1+FUqi6eKRYdLbm2npmZRSnxAcsw3VUk73mtOPjx8aizc45MSDDbhXZW6NQ3qa97w14Qh6AQd70i5dlG5pgHZJHysyxzjGgXKPYIuCFVFp4pFMMStE4TRso6Qgu9ZXRVTy+sEwChTU6/JzLbks4/LvMneNDUVAk1RU8FjX7R4XhrktNY7gXSZuQCVFuZcdbQbJh3VOC89/5gUZBJuZm2ZTDXneoaOjdG0IhuXWnNfSNNs8klMZmH4YxNu6OZzZHvzDXxCPAXG6XInOM6n9RtS1upnXXOns9J/aNiIPefIT/kvnTxjU7E4QU9IPuT2Y1h7R/wBot3b6fdp+JdPLxpD9g8PYmNowan5eWn5VHlAst7JJ5q1SLlbbaPPgtIfsy1KTWMNOSWKSzbd1Lph0WiaFfiQtLU5qlYUvn+Gv6jWnj1t+hbYOzhs5thhvRGPdbJzLTDoNXukzTtva68BUqcoZ7VJtjF9qpvabD8/o8zMd8LCat7GngQDcnzjVbaS2zOz8tNymzuIMYtiU+GQ1MSx9Uw1+1ISpvEZbieVy84zGypTOOS3uR/LzmWbGbytImkL7uv4F3k8EryjJP/k8RoaPth5nU0mxPS5afcYxCRy5PEXWc5kNB6xUUbeXBdPnHiWPyRYdjc9h7iEBSsw4wteO6Spr9I+hfZThXvzFXNjMXt6c1LuymHdbaDcw2eYO9wKu8P8AEkea+23CHGNvp6dJy/3gITx6UtNwesBfMTQoKdT8WfkVRPwo+DzThDqhlW271e1Xl6Q+YAr4jNI6zjJHwFs1ESbPRNQqqcK8/pEEKJSacABMmyQT7KqmhenjDENbKxa2iXrDVWsKsSy7zjDwut23JwuFC/JYAIyW6GwoUAChQoUAChQoUAChQoUAHV4xLJpdMDES8YOwSVfnMSYlZYbnnjQA9VhNsNdz6U/4ZPY4m0EhObYzRt+7WAVpv47uLunjbup+95QNtZIvz2NliGJSjcjh9/bm7kARTQRER3ytHRET5x6LsPMuYF7IzWZnXMN2e3AzgDfPK4IA983DUip9dI8S2mn5vaDEuodfKXe0l2T7S/xd7z5V+UebQ5larNj063Lo0+oOl9sH8FDI2UYb3D/tMwAK4pcLhHst6c9S/FAmPY1jOMslh+IdXLuTAm8clKstfZx4ApAOu/rUl1jhbK4l7tz28h+TlHjYzRasdJ0hQyuTtKApzXRPnD/ZuG3E3tnO/wBByyrJfrukEAy3RR066/ct9Y9P+GpJ421PN/iaj3tO+hQbePYRIm17tmeluZI/fBqNPiThVPosYmalZlyyZxSZyyO5LLN/RN3d8FXSNvt8GD/0n6bLP4Ph7JgGaCvZwi6nbIWhqoipdkVrRIp5ucwXHcTl1xLGJtxkABg5tZWlraaeKrp/iWFX4jPqXYKXDynS25Hsdg8t/b5tu4W6PZpF1bLYlvuF8XwinxLEO0WJ4hj2JTOMuD0HD2bW2Qp90H7MBTmXOvqtY1s5iGDy2Cf0dwtGX8DF1uaxHE8lQmHeOW3ReyCcRHiV1V8vLMWn352bInnXCFN1LyrSiUT6JRI4aV6jy0nfVtSSFB5119+YVyYdNw14qZXLBg4jOs4K9g529FecCYoYaoSItFHwqi/OiQFMysxLPqzMsOMOJxBwVFU+S6xZbQyZyqSKOSsrL50sDo5ExmKQr3j3ltJfh0p4R2TbSDii+slNEyNqiirhWCX6ekXk01KSchh061h+UYXNuuk9mi67xQqUoNEVN3XzgPHMafxaWw9l6WkmehS+SjjDKAb2+RXurxM9aVXkiJBDZbBKYbgM08J0ab+5brZXj6r6wOkPACM7fXjpwSsRxZEzcUSDbYV112lPDzrEcEPvI6DQ5DTeUFtQRUv1Var56008IBA8KFCgA9k9jJYbhTTTDL8//SLFGi6P7uavmRqtrTA+CObyl4pakD+zwMWkPaLMz+E7PYji+OSDUwWHymVcctMJUc0x/wCVvFT4rYymAzGNzkv7ylAnl92Cz0mYlGlQmmgXqyzETcpwqv4Y9x9oftDwn3jg23WyY+48be/+o2OXu54UtceVBQSvHtU4844uIqWaF9nZw9PJZn0YL2TMYJtlt8xhe0kky1nG0w1LtVaKYdI0Hec7V28RKSxd7X7Y4TsB7SXU2EwD3fJYNOG2rM6fSs19Ktmu94j5/OOTGMbM7R7ftbROSzGzeMTokzPAdwsNPGP9tbtSvnb/ABJFFt5sLtIxtO9O4p/XOFu3ue8cLdR9hd3dUiTsa21vRFjOaV2+DXndOk6h3Q9m9vT6Xi+KT8pjWc39zY41OsH93vGYoyY9je3aUiXa/ZTbLCJGWbb2BwmSwPpAtMusSjU87MOeb+8Tji+A0HyjE+0nAsBwdmRdwyaeczpJgk7yOu29eVe6KFoiawLhu0GO4iOFSknMzLMxhpqUqbD5NZZfHxtBU+NKecUkXXKNgdsWlW3LzaPaWRm8bmJnFsLYkHd5gHZGU6M8zu29Y0m4um6tLSTlFFiDJBjPRMQ+wuAiZodsGhtqNlO6o2/4o1E8mGz0n07abEve+MTMy4468zeZzW7Sw33NwqFrVEVeVYqZDZCTw4z/AKTPYxJOTUiT0pZhxjvciJHEG5rkpBwjXRDDVjT4Lth07ZbENjJKUkMNwmdaFw3XWcxzOHVu0u7vbiU5FrHj880XSXN3s9vy/wB8I0TeE4lKy1zFsy2ev2c7vTd4xV4629MTmc2jhuPgBvNgC7pqmqL511pDo0uU33CrU5i3nwWeOTWz81sThzck663ikk6bTjZs0z2i30cuTS4V3PS2MuKAgXZi5nJP9YkySlpgOly7gjzAktWnziadkjk3WSmGnG2n281laoqkC9nhp6xuq4aGDvnqBotx7xcecKw1O22pQstUXe0ixw33T7vmumJNlOLYkvlUEATvEXxckppx4xWROJXKg2jQq14+UTi0/NChDc64m746IlU+VEX6Qx5qyYtuG1eBcotGsXcwqdYPB/sxyzZsm8C1J+9FQ6r4KhKieUDXgFtO5TOfF4wyDcQlsh4MuqsvCjjXov8ANOECdkoBC4xcYxispPYPhMlL4PKSb0k0YPzLN102qlchHVeKJppyipVdy3lXw1+sMhTFxw0wcgiZezaCO60HYH/fOIYbDEOprbxhsTONk0dpi4DicUVLaQhETdKii0OtL/0gGMG0T3t5PJaQyH1Gylvz/lDIBEtTbuEXNFpWi8Y6CNWb1113yt/zrCJ0+jCxu2oanw1rw4/KGElqkMAxIBEhF4cYVvG3spHKRfyx4fM4S3hEjhhLiD7wG5NPOJWiJTLHggiqrVVXXRIUzYarcZK45NyWzL+FyuIzFs5c3MSxNiraN1At1V1RVIUrRE7KarFHDy3z/KIyghbDZr/kd/diVWXRZCYNskbOqAfJVSGNtmd1o9lKr6Qq1at8Pxfyhkl1gsyEkfTXJVt2htuA2fBaHr+lPnHvTWA7L7bbGbS4RhL037ywmW6Xg2b+3lGanlF/zBFwk80pHhGzzYT4zgTdroy0g4bYZuWtR4U+JUVa05x7F/wxTn/z2GLPzslLy8sA9JB52zMZPqiQa8fSPK47pXP0epwk5dHs8PmpPfgRyXIY979rrOKMbWY50vYzA8nCZgZADl8JJtl0a9WtQVEzFEh84xRzuCYf0SW2k9nDjGdMI/nBMTMs44zzAEOo0/FRVjejxMvBjV4XE80NKQlTXQqx6l7SfZ01JzLGO7KjNubKYgF8rM4hayUuffl3lKiZgL4doaKkZzDtgcYxd5qVwV+QxGddVcqTZmeucoNd1CREXTki1XkkdK1knyczUWjwY2FD3AJtwm3BUSTRUXkscVaxqYjYUO4/KOU/OADsNh4mSAQ90qVhX9Xbu8a8NfrAB1Cov468Y1Gz0oG0Eo9hJOMy8yzLuTcurlVzSHVQDzJOX4fGMsKVXUkT1jrZkBoY6EnCJZblK1i+wnDph/CpmZJjNYkDbfe3v2ZrYv52xSkOXN2iXYPT6xatY5PkwjDLyoOWYuhxRy5KEVPipz8qwLNS7Z4azNtL1l5tu+dN5C+aV+kSsTeS5aLQX+0GzM7gjeH4s8x0aVnDMmOtEiAmlo4BU4Ei2rTmhIsUAszMkrU2jxNzOjg2LvB4EvhFrs5iLzsy4zNgzMNnLK2fSAvom6qEPgSUTVNaRVzkyM1iU1MZCNG444dgKqiNe6larRPOJp5drF1cdHU372IzuI7GYa/Pz/8AVOHG82eHS7NhXupW69NSBzxXs0p4Ri8BN+RxJiclGmXpqX61sHgFwDt4oQroSU5Ro9m55g9n3ML6JmZ118xev9ntqbdv4StdReKWrFQOFYoxOOsWtzMvJmoOnLdYmveW3eovjCpRjko6rS2LG0w0MA6TNsONTeWVTkngdysqqd4FqhCJXJxReEcZ2emRlvfcpMtzLbZBnBYW6ZkqC2tdCVU13a6RrMFwTC8alhlsEbfmymGkfvmAQDF+zrWUHvCWiovikXOJbI4vhGCS0k5JTMlv9Kdde6oL+7T90YzWsrWpX1vY2ag0XqTta4V7P8P/AKUPMOy29jEk0Nv7Jx4Q/VwPFO0KeMT/APErsPNqcnjItllv1K+ncd6y1f3TzU/iiDZOfkcIMcUzJ2fxCXmAM5gTy2Ll1S4+JEtPKse7+0/aOQ2s9l7Uv0VtZ2bl+kMt8d4OQ+tCpHmcT+BV322O+j+LTWLXvufn1jEn0Yyau/hiqQTeTeeEcsFpeVOHdTz8o1m1wtdJcyxbjIObx90Y9ai2UHkVVxmYIhRSK0ecTTDkzusPm4uRUBAirZrqieGsceZsBosxs7xrQCqo+vnE+JPC8+2W5ajIDuMo3wGnBOPrzjcxsBDD8o7MzLLL8Yjiao9Gpc5fdw7tPrxhgQwokW3uj3dfWI4BChQoUAChQoUAChQoUAHY3/swlmsOJzaDEpFXZe0m5fet14FT/wBNf3ozWyezuJbS43JYRhjWZMzjqNh4J4kvgiJVVXwSPccbwljB2pHAsPlmsQl8JZ++stbeK9VzHK6EiV4cIxeouUIbU6cysuTYftQ5OYJi8htE442zue7pYzyW5Z1ynWULu0T1X0ifY/Y3FGtpMLlsbHoOcYBLdNdFttQJd23XsrxqnGK2TmsUxzG2ncSm351x0hB1m1HCe/5dtKa8K8kibaTZhv8Aol/SL+yTUhiKNykwDtoutjrlgNd3J43Jpy4xVJHo3bzPgVSolayztHk9O9te0ns6wF7DcLl8Ud6VhzbjEzLyjNHZglKq3V0HX4+XBI+f/aNt2/jkm1heCSjeEYX23ZSVIuuXkTp8XCp40RPCM97Qmyc2kcymJtpxyw3ekHcbjhJUj9CurxXTnBrOHSMnLD0knCczUC/xWmqDXvLyXhpGiZ1UhnM3xpvKoUuH7OYhjTzUph8o444990Hx05D8S+SaxaNsP4dJu4NPM/ZZR0jmZfcuNxNN4h8V3U40S6NJtNiROyGG4bJNOYRLtE7MSN9bxZcQbt/Qt4wqnDvRk9oJN+U6DhosPZ0402+DVLVJD+6/xJU/4hjjapzJOynT5cXKraDE0USkEAap1jxtnoT3/wCojuokZ5Kr5rB7Uq+BmhNCLallG64FRbqtK15L+caLDkwCT2e+xOdNx+eedYNXmrWpOXS2jofjLf49lPONrwkGOLO2pUsOqUvMzcznTk/M9W2J1OqJ2jL4qaIn15Q7D1ZwSydnsNZn89twWmnlWxNKX6LqqL8oftOykhOTMlMy0zJTkuYA2wVu42g13l43LWtPOKAiI1uJaw1XIGfGdPAZjeIe8sQcm+iSsmJW0Ylm7GwoiJupVeNKr4qqrFfHaawuUaxFjGZvqGYfiM1I9J6OQJ0mXKXdvbE6gVK8UWi6JqmqeMDstOuqWU2R2iprRK0ROK+kRQ4e9vU/nAA2FChQCOpFrsthJY5tBJYT0liUGZeEDmHltbYDvOEvwiNVX0iqSDsLeflZ4HG93iBfuklFT6Qp2HG56ttPP4fLz72y+B/1XhUtJrIff5Tc69cq9JeIfvBXdpdVEjmM4bs7slgTee29iuLSu4+ziR5EtmlwJhlN99sfiIkFeNKaRln2Jl7ZuRlplUeeVSTD5atrot0uNxV7remiFx1JNIz20Ey48Ms2c2UzktCFTdIlpTQaLwRE8NI58FbQ6M2XqLJrFHMVfWXfl0mmmWyduI7DCmpWL3U8A4eUa/YrbXG9m1amwyp1uaDLlgmZgmJkKfA4FKpy3qovhGGxN+RDCJFqWlLXskc1/vE4tVL5UIU+UWm2Urm4VhCsSkyPUFY660jbbggKJRpa7+tyrzrFfy2hY8hpUSWnc1WK7X7EbVTZSW2ey83IzV6A1iMg62y6z/5g0y3B86CvnD5fBdh9mcYmfdvtDlt5l6UMJ/DHeyY23i41eBJzQkjEbEMsTruIjO1dYlcMfmUA6KmYA7vyrSKOamkJdJRtu/XcI0H5JWLtDdNiNU6ok1AYkzs0EtM4FPvzs81MOZzzzIFJmPAcsDSpKqVqqonhSBNs9pcQx05NMWnZt7o0sLUtbOK82y0uuWAr2U/DXSM0R527Te7gpBUrKOzauUbcN0F39RGnLnzrC5SZZW1Dmtjj4J5RvIcDJxPIzP70CDd/NOXjG1ltvZnG25mQ2kbCblAlkbZxGUkAYfkbUtbuy0S9tVtQhKvGqLXjiMElW3cVKWmG8xERdy/tUXeovCtt1OVY1+3ATGBz0+7srItsbPTWYzLTTYkZlLl+yeJVWjid4SRFrw5Rr1Wygzut7SAS7ON9Mm7mJDcopSROtuD/AAtEqqqUWumsEbQf0NxaSw5qUl5vZzEmgUJ5HVJ+VcL4wH7xrzGipGTzm5qbltyiNtgB1XtW+n09I0OJMMYhM2y0z0ZhpnOd6S7nW7yJRorblrXQV+sEczfeA6O2NyLaDYTHcGwdjH3klsQwN0hH3hh0wEw02q8AO1atkvwmgrGWFRClqlqm/pG/2MmpbAsTmHHk2knMKnL5efk5RwGymmfgc7XPy9FgGSk8AnJHFpv3cUnKyDgX5k3dMWuOWgItKo3qneounGK0b4J1gzE+ksjQdEccc4Zt4DoX4VTlAKx6Jg+yezuKuzHunafDXm3WdyWmD6K+25y3Xdw/RDhu0Psr2hwzCG8WZY6TJEX3thN6/Dvbv0JYvltYnOLmKadZKUcbmMwyBEyLeW9rXyVK/OkRT0u/KzCtTMu4w5QSscBRKipVFoviioscmmn5SbIXpcmXBX7twKU+SwbMTk7iJLNzc4s281Li2nSDUyyxS0RGvwpSngnpGOxp3FXDYeQkPzjlvw6wyRRM+SIy2zltoQ1VTTtLXkvpA8OgGOsLd8/OI46UTuNiLIONuXV7elLS8OOvrABCWsKOtkQGhCtpJqi+EHzjyzEhKXOSt7eZW0LXO1dUypvKt2nHRKQAACBFW3lD2GnHzsbbMy1W0ErpxWGNkQrulSunygsyWTfNJaYc3tMwbgvBUovyWAIA1/DHUMtd7tcYsMNw0p3OUplpppiWJ4zNa0pwD94l0RPOADbcb7QkMAHXSbIurCxKJ3q8tfrHWd55BtvrupVfHhEMKAQ7eSD8Hw+ZxWeCQlGsyaO6wL0S6gqtqV56aJzgNsyyTbzKDotvjD2yIJnNlrxsJFBeaeEKRxudbP7aJOdXvpWg0p8o1+zkzJSeBTU3MtE7Nq823LTF1osWdobeBXBwXRUUYCd2bn35McYFlsGZgkFvf/aKVqp+FUXWi8tYIwVkhcGSm8t+Xamyfe/FaND18FSOSs6Op20Uem0HsX/EbtBtBh7GxW1mG4k9LOT2Fo1M5Lu4Uwzpeo8KqBjHj2KbT7WbQ4a27i54nisrJDlyjrxmYSiVqQovCi+fCPVcc2Ux/av2L4a6sk63a90qWemzSXas+7LfcUR4WU8bYyK4Ttj7PcE6Jjaf1PNFe05LutzTDTxD4VULlHRRXVR9I5OHlEp7RlsddVWmpv0huwcnKbWYDtI5tPi2JyOHykuEwDvSzfGXmqWtuuNFqQl93VNRuGKvFpbaYNicIlJXGpSY2eenkf6WA2jITa7tjrlt4UTe+HmkBTeCf/LbmPv4hKYf0qvQZEGTum7SoZCiboAi8yXVeEPwvaSZwHZ2TwvEMEsw2decmJg98QxJjsI2qdnqyErDTsrGi73X9DN2/q/UicwDBcdx43sT2pwXBkJ9WXlk2HpkNA+/07pl51qtbYxWLyBYfNk0rrT7VxZTza1B0UWlyevgusavEjcewf8Ao9IMYdPXzAvSzoSydP3hWjalxJKcU114QsV2eZwz2a4Hir04Tj2NHNODKZI3skwaAJ3cbCQiRfMI66T/ACcdVPgwkF4b0Pp7HvIpgZNTTOWXQScs52oSolaeKwJCjoOYkdsvLLusqtteNOVYbwosKGwASuHmmbji7yw+Tlnpp1WmBvJAI6VRNBGq8fJIYyF7wt3CFV4noiesTyjks2470lgXbwUBqSijZL39ONPCEMgaK068+XrGm2QlMKxSebl8Sn3ZNg1LpZgzfkAn7URrv04qOi04RnW2HX5kZaVbJ9wjtbFsFUj8KJxiaVyQR43H3JWYZDqUAO2d1FQlqlulYUjXfU00xhcts/tpMyvS5TEsPCrfSZZzMbIHBVAcQvCpJx1TgusUWG4c4+1iEw44230MUvE61IiK2g+fP5QRgLLc3i7ctJTLUsk0CtfazsC5R7ClwRF5EvDStOMSzOJTbOJzLmIfePigGVvYdb3ROiaKqW/msZ6wbaNHxBDJTjUs/LfZs3I+93yo9qvapqmmmkX2FyswMt70dmcqRkplrOdlztmd9vqwHnaqiqV4IsZiVZvnBJp5Xbz/AGKdYql3UHx/KLrC3gmZ8ZKdYLr2cuWsK3LNOx+9wt9VrFOQh6tsD7RZTDJxjEMUw0Z3EgtypjNUDaUdUKiaGqfi4x6R7bvaBP7R4Thc/MYR9jNBoVVsdr3wLw8uS8Y+YJ5oZWcLo0zntmz1Vva04IQ90k5pFxszttiGG/YZlr3hhJ1zZF50hC5e+JdxxF7yfOscq8IqVeZ4OqeLZ6eFtTaz0zmYO5MsZ8pIzMyMu7e9dvgN4lYnat+PzpG92HxKZ/o9KYbiHWWXyMpMgf8AZHnSRyXc/E3dcK+RRisbnsC2g2cw0MEwtrDpzDZdOkt9Iq4f97mgtFEq6oY1FR8In2HmmGnnNncWm2sNl5pk2xeera5wJptfgG7VD5a8ljPiI5qzpsaUG5TRF9zH+3DZuZ2c2tJt+WyGZ1oZtoP7u6qON/wuCY/SPMJgCA926PpD2ySWN41sT0vHRc98YM6Dm+Gr0o9QM6ve3xCvmVY8EmgygLqx3xpvDX6eC+cVwlTpI4unZyjcbIKF3VrT5Q1xar2q04RO+2KKu9TwiXB3ZKXxFp7EZHpsqGpsZqt5mnC5NU+Ud5wAQrEj5CbxKLeUCloHG3y1ghhpG8qdcy8rOtsoq8KL9PnEM48sxNuvq021mGpWNBaI11oKckhgQksdNPh7MIQIrrRrTj5Q9p1wGjEOBUronKAQ6YlpiXfJl9h1p0NCAwUST1RYitLwj7I2axL2bTpuYX7QJSSnVncl9h2aZz8pt0NLHe2JIXaFV4cOEXmNewfD9mjP3FhGAzLM6qrLLMgDv4rb3FuFKfCvDhHmr/qK/Usnot/p8w2MMfDNIcIqsfUmJbNYzKsse6MP6dKzjJv9HakgmCZsK10HBtXsl3uCpRYI2TlcNlsBnp7IwWZsaF8JSYlmbHgQ7HRFq3QhqhctKx2tV6M01g5Yo2fB9JPmKRwqcnHsliWddctUqAldE4r6J4xsdmpTZDBsDxCb2kwqbxmeNsehS7M50dtortSOiXklvNKJH0fs1sr7PNosJmZnD5KUwSamiRiYakSLeoVyNk0e4SLxtFRrFDtX7MQ2Ony2lmdjP6V4eYFmzbb1su1clKZAIhAKJ8VUSOOOO6sJi33Or+B6cr3MP7LscwDZ1yZxZjZDHBHEg3O8Mux3m2jNOsu5ktumkejTgdExWZlJSZlJ+YmmmJhkJiXFhzIebqLjbRbpEg7mnZ5JHdl9qvZ8HUP4sWFzXRgAGsYaNxgbRoIXN8RQeVqJ4rFJ7QMLHb+f/pa5i8pLNs4c1lMmOWE0DW4oscq17vGBX1yeI/uUy6YpJu9j9i/ccg/t1iDjuFy+DNE4Fg75OKNEbFF5rdTyujwjHmdpNqAnJmUw2Z6HK76sy4EQSzalT814rxUtY9Dw/wBqmISeFNYF7txLaTB5Ks0GH4j9/K5Y7y5g/eCKa0JIlx7bCe2qwqUx3BMS6NhbjJ9LNloWnmsnfFg7d3jbaqcYriOIfOWpxuRQ4ZGjF52PFMBkJ6cxgnZKUGd6E05NOtPDcOW2m/cPP0gLGsSvkAflOksTDt6zBHYLStiY2Cz3lVF7S/JNItMHncSwqTKekn3JaaPOvmA/uyCxxPmhEkVErOYJh2CPzLbD7mNA9lywOhc0yzZvOf8AmV0RF4dqOyq0xaDkpKrXkO2VlJbaXaFhuef6JLsM5uITDswRrlt6uOJd3rdECKDagMRnJUMdem0OSOYOWlBcmRV4RHVEsrcgolErSldEgyXnOjYIWFNMZa4m2yBzRjvWCZE4g/hut/wRSYBgmJY5POsYbLZ+Qy5Mu3EgoLQJUiVV8EjBIjKW8G7zdYXeRmKzeJTuS3MvGTYNDYHZERRKItE04c+KxHOzMt0ZhmWF5LEW++na8Up+i8IusQfw6QweZl5iWnx2lKa6xHQEWWWbeFq72ZXx0QfOMpGqa+DGp0+R7gloRd7zrEcKFGpiKOitI7DYAHQ2FCgAUKFCgAvti8Efx7HGZFswab7bzznYZbTtOF5J4c1okfRPtOwn2V7HYC1szsC1KY9iy5ZYji0yHSCa4WgHdC4uKJy0VY8U2VxA8G2XecksPYnnpwHAmL7lya7jXDgqLcSV50ivktrsUw6WYw+Rm3JSWlJhJoAD9pMJ+1L4iTgleynCMKy57HTSmF7j1n2i+znbjZvB5vaDHZTPLGEACnpa02m211yqhuhXdGmiWjRI8MalCnsXalGlqTjuXd89Sj2UvaxjYSc3MzbnRpfFZZJaew5n7h+4O2oLVAWm/VNezFNgGymCdOaxrZnar3pNDJG8WHNmEnONOqNMu53dPS6tm94JWFR7ZbyOta8L4MMuGNPYniQnOso1JSpPhbvIS6Ub/e1ov7qxHP4y4E2wUg9cPRAB0HQQwvUd/dKqcecXGDbSYdIyjWHTGz0tMt3r90Nk0JKv95xL0JFTyjTSuzeHbUSeKYg41KYfiOCynS2mMnLdxJtDorZsB2DDvGmlOKc41VctZMmnGMVM5s9hLeNYWjWFsOyuMIDiOCExYM6yg3K3av7Wg1RK2mmibya5KZYlK3NzdR/EK1+lI2+B7R7Ivo1JTmBuYW/nAoYlhzzmY1vdrKJVAqeGi+CxzHvZ5ic9iky5sniUltTKOGTjZSRZbpf/AIDod3kN3rGsoZ3vBjZA27xZlW3OkESdfdRQRONETy5wRPzM6xMuTcsLkszvMNGOm4o0Ua+aceesOPDJrC2pnp8tMyk4DiMZLoK2Y6KpXCuqaafOBcTT7nLcNW3+s393e1Thw+cTb6hzNun2XGzGwm1WNyz+JYdhRFJSrJTD02+4LLAgP4zVEr+FN5eSQdKbZY6s6w/IYy4xNBLhKgrlrZWDwqaaGvKpoq0ioxB6fw/BUwtcTecYfUX3ZYXVykcpRNOCmgcV5XUijZszRzOwvGJXJhtZdDZTeOCc4X9KNmZZ9T4zMv8AZXfW5vcL/DBsxhWyzWHSjzG27mGs4qwXSJR6TJ0m2xc3UMmtFqQ1pQV8Yw/S3mXT6OZNNqS9XdUfovH5x1+dF8N6Rlbk74Aofkion5Rrm3mDPGPEmm2yDY6VkcHb2KexiZnZVgyxTEHwygecUt1WwqqgIppVeMUuMY/P4lYr808/1IC9mrdeQ1RCWvFaLSvGK5ybeNrKQrG6dgNEX1px+cQjbEFbBDSibgfZ68+r/wAtY0khtBi2Dyye4sfxDDycu6RKmRC25X8PYJKfEiQ7ZI9lsMwLFMTxyVPEcSK2WwuUIiFgCISUph22ilYltoIupFrpxyzbjyoUs24VjpDcnj4VipvBMWnctzmpzFeqxNxVRsxtWxLmQItbE0qP4eHhTWLFzBNm3JbpMhjOJNWHT7VKBy8gcUk+kQ41sdjmFbL4ZtBM9Gdwydecl2nmZgTVl0F3mzHtAXNKpRU1SKCecvnn3BdJ8SNd8+0XnD/5QH2LvF8AeYCXGSxDCcSGbA3/ALKe+zb2kNCRFD0iqnMIxWRaB+ZkJhps+w6oLavovCJhxWzDXcNAfs7jwuZqgOboNLa/Dzp4okH4QrklJnNsbTjJdQbrcu0Z5hkh25ZCmgqvHXSkHSE5GbhsaR/H3Z0wbnpKQxDMpvvNCDqf/kC1frCKX2T6Ew65Oz4TLxnfLstIYMAnZ31VL1VeSJonNVhYhcpWZV95sXMu1rVMwtB01XXx8oHJYPHo5tGznvK2FTDeonnurz9IGSWmXDERZIiPs0TjEFfYnmiWalinHG3M6+hmgpYunPzgVltx54WmxuM1oiecNLTdtghmWmyB0m5ZwkBEU1y62p/KDYNzjZMs3ibeadu6t1LS/nA6qpcYsTwfEfc7eK9CcGTV3KzviPjonHhAbYEDw5rfPVD0hgJXiRnJbIrS1PzWGEpGvjGgZ2bSckmJuSxbDH3nWn35iUbMhOUbb1VSvRBWqcEEiVYikpDCRUHnsRfRu+zMABG0vRSup50icoKhJ2KGFF3hkrgs1OKxPT8xKA5dZNK1cCL3bh40VeKpw8FiLGMEnsNlpWbcbvkZtC6NMiPVvW6Hav4V08frDhovYJSYi4JKSsw8hOMM5uVvGPHT040iWVw+ZmT6vL+Ky9E/VYK2SkpmcxZspd9uVSWq+5MuKqCyI63LT6InNVRIt9sm8OmpYMUlVZWYB5W5rJSwHq7wOoPdVU3SROBJXnGbP1YmiU+nILwF/GJnDG9l5bB5h1k8RbxA8kMw0QQy1tp43V9aRr8IwrGvZ5OT20mP7JTrXR5c/dwYnJk22685o2Soeh29u38MeXyhTsvMtSk70rJCljOdaO9qmq6Ii8apGsmtsNopPZ5uQc2omXZR69PdqzZzDdqadYB1HXlT8o5atO7HXSqdN5C87arbWWcYnpufm3skpu510nnJlu7w1tQV4IiJHqOy3szkU2dnsU9rG1bez8rOMjSXdeunnyHsOZXJUpRKpXWMh7MNqXsK9nc8zsrPOhi2IdJl8Qw6UlOuBlbct8H7VIBruqNaRmZTaLCZTaeRe/o6Myyw8KzwTzpTL03b221XuV1TdSqeMYMrZz8GsMqpE+zXFjuzjmHdJbwYXBZe6Fg2I4tMCMs0wx3DYH7xzerRd3eikk5XG/a3tY1gErikvNON9JnHZubtZAd1FdJLeAIgjQUSMGU7OYQ+7kMsSgTyK6yO47ltlcNKlWm7pyXgsbPZyak/Z4mNYnlTMzK43gb0tgcw+zZnKZCDlbC3VHfTj+sXyMO3fwTz8+7byZSZdlMAxeWOWN+cZFgHG3rVaQnkRd4eagJ6V52xe7aYay/sfhs/7zvdw9huXdaIh7TjedupW7ieqrpWKuTwb3jhb3vOWnZTFnWRmcMzerZmJdO022KjqvaUVrRbVTjFjh+FSO3DUhg+z7svJYozhKlMlOPWJOzAFutN8hVRtRK0uWOpY/U5pa+njwebw8Lbxu4c4nm5OZlZx2Ufl3Wn2SIHGzC0hIeKKi8FTwgWOk4yZ5u2hj92dVCqoq0rTWkQwoUABDrRA0waq31gqqWmirxVNURdPnEabi93h6wVh7jbKvOPSLU23lEFDIkyyJKCe6qaovjp5QHThAMlYfdlzRxklbcRUITHQhXyXlERLdDgAlAitqI8fKG13bf+8ADmzt/d5xq9sZ7D8RwfCpuWlsmaJmk8fJx8d28fIgEFVPiu8YyQpVaJGk2UnMPVl3CcUlMxt9dHgC51uuioNfkSeY05rEPG0+i6c7r7A9l5eUPEs/EelDJsARPLLpvjuqgL6X2ovksWQSMz7i97pa30N5tO3v3FqiiPGlU4+MAS8463K4hgmXKO55B15s1dHKuoIFxFCrqnOg+EH7PuTOISH9HmOtcmnm3GQ0uVwUXdqvinLmqDEP7/AMsaJbt/y5NieIOY6D+KFJWTHSFzjYQQbS7sbqU1/FHcBmZaUeLpeGuzrdwm8067YJW8RGnkvFfpFj7O2mpbar3TOvyzbc+CsdI+8SWMh0Lwr3F/e8osMawSUw17Pczfd5yjRuutD2XtURoVXQiW386xcMrdBDK0dZdbF7JYftxiU8/h+0TmH49LtdIlOm/+PEdLMzuOolqU1Qovce2Jx3oci0/huMNzzDO5eyoI3vKuVv6IIrqhItKFFVsGbE1IT44TstizM0cuTAT2HvZjksZdk3COgAPJbbV8FiucbkpUJ1jG5mbncSbuQT+9qXOpmVEpyVK1ie6yr4K7by3k+lvZKmF7VbEy2FbWPSUunRnGpJx6bbzDA6g63bdWxV3krwJI+XdvNj8SwaZxBroMy5KycwbHTRaImNCom+m7r6xc4f8A/R1wZqVc6L/aWn8RtBxgS7SNEFByyXkvOLHFtocPw/7Jslj+MS0jNtdHxCUxOy12o7xkIVA2180uHjVY81Y5dSTvmOYkHiU0z+GIV6SZtFmF1IpZd3UTVESPaf6A4aOG4tKTstPy20EtY9L9cDks61VLk4XLoVwmiqhJFT/8MdpHWekymBYk+2PeCWMk/JI614qmc08LU3g8nmSJRtW7tKXlVedIGjXbQbOYhh7xDN4fMsf+bLmH6pFN0Eu1HQtSDmmnMblXvh5XJ+UMg5ySKGNSE067lMsuOmuqAAqpL8ki7kWLiSx6ddlpXDQbFSErENO2VV0H5LHou1/tKxSZ2Sk8CmZ5JtuRmCaZ3iUxbEBH0suuRPSPLMPYFr7Q84jVK6nx/hHiS/l5xGbk3iuIC2y3c46otNMtp8hFEjlfhkdr+jsTiXVfmT07Z/aHavEcEkcNwRyZ6YzMTDrPRnbXbVAL7SqmnOkPwc8UwGcdnsUliacUHGbHtHbzD4eKVu58UjFY0LeEMrhE6k1Lz8ludHTTrF1JXF/JESBcex45xllpt51wvvZh4+LjqpT6CmifNY1pxdMfBnUmz5TOv/Zt2ceflcrIm3Gr+sCx7S5N2+ndLlVY+hfYz7X5STmHpTGph5ZKZ+7zN9weCKngviqcNI+NpaeLpQzcw3c3fviBIFVp+UafZ3GJmWeYxDqHWWXgDKdL7ziVqjxtVB1WI4qhzNfRXDV8eltpPpvbfZccY2S2gxTYjA5JyRzrp2RVm+23UXpdztBpxBF08I8v9l+O+6mXNl9odl3sSbnpjpTOHuhlE2Nm89LupqJ7uoroqDF77I/bXjEnjfuZUak8Jn5krQb/APDXjQLa90Vt+VYo/a3i8lg21U5/Qzcl9oZZt+dl+1kzCGWY0BcRS7wpoVOEeXSzpvhJ6L41FyNFtkxheK4VLTOwDnvaVb+9t3cQkxt1AuRtU7/1gaa2o9n+xuz4YRjOyr8zijZgzP8AuybbblXkUai82QVHMQfGPMZ6Rdw2flsQ2Wm51+XmZb7QzaWdKkujrLlOKefBRWNXsjKbJT2FP4u1LC3iWEywuTmBze8zikuJda4wS9lxB4t/xJHYqr3r+hzZt2N+ovaVjGy+K4PI4hsk050M2WpR3OoDg2cAME0Ei4qXArdI89w9RTGJKZxLL6GzMX9butr3jupvW8K0qvdSNxheGYW0eO7TSXRmpdp7OPAJj9thxFvG2Sd5qo8Oz2kjIe0+UmJLHfdcyl0mwGbLm3aoTDZ6tmCpooKnNOOvOKR8/wAyHTDq9GQdxGYm8WKbTxOwO6Akq7qf4otsXMMGw6Q6Lktz3WZn9+0aW7y/CPIU/Cq80iLBUkpKQnZ+ffdZmcq7DrGblN4STmuiDxquvCkZtwycMnDK4lWqr4x0QuTfEGGeC/MnXnXHniddcI3DWpGS1VV8VVYihQ65bbeUbnMNhQoUAHRSschRI0ZBdoO8lFqlf+0AEcdFKxI9bnFl9mtURK6eWvhwiKABQodDYANrsljuLSuzMzgWEtZo4jNy/SGrN4jbO5q1eVVuRYlmMA2ZkWJjE8UxqZPNlSckZaXkT3pq5UVlwzoKIBcVFSqnCM9suc77yVqSy+taJHs1Khl0qRF6UrXyg12cdmZBhnEJk32wsZlgec3AC64iH4U5aeMThuXlpBCBPHKljs682QHNiPRz4zHeP+FEon8SJGn2e2Z2a2jm8VcncYb2cenOuwfqiOS1JasmepBTgi605xh5sGHpwWZF1w2zPcExpbVfWLDD5l6XxNJeUlOksuH1LLtaFyvFaoqFpxSFtI941CHMG2i2Xxxh5zDnFeZO6Wea61oyTsmBjUTouqUWBHJyZkHgVZt05h1tek0UhcGpLUVLjVU4+KLSLbaDazaKdJGCdYw1yVZKXcCTZyCer2r7NCJea6VjOuStjQPS7wTFw79BXcXw14r6Rp0+NzPq87FtNy8nISsjieCOTrsyw3mTxm0gtsOka5aASKqkltNV5xLhWOszEwDc7mSd3bek2kJC8yaqiV8xUVigB/cyXh0SNrgWyYrI+9cN2jw2SngmLGWpsib3LUJHBety6quiCtFqkRh+ppD6fBtcTncEm9lXZbanaZzaJzDZcrGHWsudYJfu8p1yjlid8Cupyii2O2Y2B2rxRZEtsWcAmmWh6I5iZXyj5/3dbUUPnpFLLYXsphmHzU3tZinvfGJxsglpKRmbujkv7Z97Ubk5NpdXmqRmpN9ybAZE1kshm6xx8Rbon76a18tYpej5Jbr+DS+0v2fbVbJ4gqY30J8CbF8H5SbF1txo13XRVO6S96lIzTMi7OuJIyWXNEXWdX3fmtPpEizUxNyidFcfJGQsy3HL8sfhT8C+HJYp3mqOqLa3ppw8400jtM9Z3CsSk3ZbEXZJ52VvY6tTadEwKngQ6F6w6ZZlJds1bmbphCsybEMaKmpXppx8or94ajBL01mtICsMgqU3gCmiDT/X1jIvQHbAjXdgnCpfpeJS8p3XXRRfTn+UF4rIO4fMhktzLfVg4mb2tU7SU5eEC4YhZrro8WmTX66f+6NMbE3LLFXZJ3C0FgPtHSHXXd8qNt7othTh519Ir8KOQCZb6e04beYKlavdTiip5+SpEs60stMuSkx1VDQVUCQ90fTRU5wATRDxt+sLLUPBrNop+SdmV/o9i8yMie+EtOfeNF8F3AvJVpVOOsWbW2jDuybOF7Q7NYHimQ91b3QsiZUCRa/aGlRdF5EhR57HWzIFqJEPpCyb2Oy+jYDK7A4svVz+K7Ou/wD+S10yX/xhQx/wlEWOymCMYGOGyQy8/ijEyRliktOLkvS6ilreUYioqi3Kpc60jPlNuKH2llp3TRTChfVNfrDZVZXIdbmMwCO2xRBC4V8V/SDP4Hj8ilJmZkXHMrcV1sm1uBOyWi8eEHN4HiK4E5i1GW5doxvEyQXbS7Llq6qCqlKpVKxHhc07KvC+xPshknUBeav+dqoqQ7FcSKclmmTemJp0N3OdLgCVVAEe6NVVf8onTwGvkqlKsWgTjhh0Z94RFxoaO01qNbVXz7vpBW1Wy2LbOs4bMYjKOMM4nKBOSl/FxohRUKBcLxF3CM52TdYNyYYOXfA2hNMs0StFXgvmlFTxgmBwA5LxS3S7b2QcRtV/EqKqJ80RYKww75zUnjFN7K7SuEnZGnPX8qx0G8Om3mAzkw+9xAdUxI2wT49Kr8qLB8ps807OGy3tHgYp3XXXiAePmOkViTlYCYxaZCbdmymprPfbNt4xJNRLu6pwgJd94WyWytN4yrTzjQSMvheGTrf20ZxwDIXnAaE2BbVKKQXakVOFURKxRTnRDnXOjK4EtcuXm6nZXStNK08NInzYrxcimhy3TazEcsJUuHsr5pB2G4PPYhITM3JALqSyje0Lo5uqEVwh2iREFaqiac4UmWDtDdOhOzRa0BsxbGnLXVePkkQ4nOtTM5nyco3ItoAgIMqXIaKVVWtV4r6w5gWhDNqwVmQswu7rm0/KnKDUnGMjopsuuywOk4Ik+WlaJonCvjpHFxJnoMswmG4dc00bau5ZXncVbi3qXJwRUThFYfGARpNkJ/AWsbYbx+VxI8CN0SnGZN8QcME8FVKacY02NbU7NYZNf/LuxGzhybtXGTnnXJ1+y5aZtTQRKnFLY81rGhkJiSn5OVlcT+zSsrNVdmJaXE3stziiJVEKijpVe9xjJ6Xk3p1PpCp+SxPGMHk5qQlHHZOSBWkJAVN8iI1bH4rbvpDcAxHZuWBssdwSfxeebMhynZ5WWLOVbRvqi3VRF1iTE8Y2lkMJ/o1KY5PlgLrqzEuyL1jLte/bWl3inJYzIG9LOEVSB3h9eMJIkHaPBtsQ2zxB2VDB5RGNmMDdXMdlsLaIM+nC4lVTcXwvWiRVYxOn0vNamGwGZbGYowNo7yVIfVCuT1ipxFTpJzrUm3KNk2ggrZVuMNFLVdFVdYtZl6Vn8DaeZZBs5WYW/wCIQNE/6L0LXlfSIZNi1feCnflhTPUnOsS1W9O2i/6RrMJmzksNlsWxEcQlmWetwj7Mjks/OCYI4tT3URB1WiLrSNzNYJs1sz7O8D94Zn9OcYADls63o0lJGW6ble+o6+Ip+eL2r2gxaVk8GwmYfZmcOwUHWsLANWXKmV7yfEirwXnD7uloH29SgGP4i1tNPYhOzmKIEwDea1c0ZI+d33Y07OlVTS3TlFfLsS6ziSuHT7jfTG0yVv3r/wC7cp4rwX0X0qXiWXmercbJND6vs6pWmvhwi7lsMwyfwadmpLppYi0WeEs0F4tsCK5hFzShW0XhStYapy4i2xMvnvuN2znnsXNqfnhf96D1E865+0Md0SL8dEov7tYzoARruCq6KvySNFJtdKwadmX8RYazwcvaKpmRNWkJeVylbX96M3G2XowaJ3kbEogZ3E22VATeprTzWGCJF2RrDhMhqgrSvGnNIZI2GxZY4WDuYlMHgrU6xJVHIbmTFxxEt1uIUROPgnCK8be9AAobEjit39WJCPmVV+tIbbAA9XOuzG+q/d5R2XIm3hcByww3hXzTWIyKtPKJJUL3hHMFqvePhAOC/KXU2ZbHGwzDzN8O6pjqQL6pveaKvhEreGPf0tdXDbmpeWcWaR0LjyWhoddPhRUi22McwuT2SxB+Zn5Z+emZgQlsLdac37BUs+4dNFWxA71xJA0ztPtIxOSmMt4o5KTEtpIhLojQs/hEES1B5UWtecYQ3VqbsvTFiRdpZLDMVcdkZaUn5jNPLedZvAKr2hAu0q8q9nzjY7TN7TbV4DITOP45s/h7eGnls4YkxbMETvadVgEURVd1F7MZGVwNlHXHPeGHSdk3luz0w9cSuWXqLbYpXTx4KqolYOwGQm/fDn9HXHs6bZOR6Jar8zMi4NCNREVEEVaaVqP5w2tjvYS6za1zb7N4Tikyyxh+IN4W1szLGd7MzigSsuTlvauErjJPiosbvYyU9n2ByDstjUtLbW4lKMqZnhgWA2PdueNRFfkkeRY5sZO7K4JLTeOuyDUxMO2Fh5GJzLYj3yFNARfNa+UWGbg20E+42xLdEl91w8RnXcyY7PZtTc15CieVY4HfD+Xc9Baef8yIn4Pa3MAxsJaTxbYfZnAD6a323ftpSYfCbrvVh/CmkZx5ZKZ2kaHFJGQx3EJmkvMNYZJAxLPfvFTeVPjER9YN2u9ps1sxsJJ7CsMWzKyzdnAspgkq3w4mSa/xR5CO0GL++2sPlMSbaz3RbmLiq3cte0qaqI+XOMeHpPV7i6tVKc6H0Dsxtns7suzkYbhuFtTzLuWfRJcV3f8AzTuL6R6DN+2JF2ExLFZKRab93WhMG7NbwXdmicSJfCPidnGMUwWcfkZ2ZcYILmJlr8v8SLrp/OCRdkGME/rTGJRJiy8AzTLPbcFctwV4XAXEeKR6UcLTS2u557cQ1S822Pd2PalO4tMMT+0OLNN4O/KOTErh7jhkL2/YOdTeO6hKgaV5rSL0PalsRNbLTTU5snIzrMm31jU+bDIOmv7JhpBXe8uXMo+Q8Sxh3D8VYbzM1kJKWAf/AOmil+ZFD9ttrExOZcawmS924c8bb/Rc3OscAVTdcLeprX/tGacLTxjS9zR67a+LH0NheD+x3HnMNnsb2KTCH5t4nDbZnnWZYGrur3eJqXOlqRXe0vbLAvZ5jDsh7L5TBcJJ4AzcTw+Wq4gp3AI6kqKvFflHz+O1sy9PSx4gsy7KtUCwHLSy0SlBXlyikxF9x8WX8w1UwodV7yLr/KH/AA3VHr0T/EdM4xqDzbeU7xqJagvlFhgU7h8oTnS2ZxbmnBrLvCC6pu8RXSvHxTTSKxxxTLe8axJKPJKzIuKy28idxwaisdTLeLHMj2a5EZ3mpOVIlhka3G8T2WxTCMPlZTZ9MInJVmx6YZfJzpJcVMxL/wBvLxjMnLkKqrfWh8Q/70hI194sN0ttNyI0FOyV0Gq/1INsK8IgF737+qV8koqJEEu24Lt1o1DW0/8ALnDCArzFveH6RRMXg02Av5czKdCuznkEP/LVSoVKeSesevezXZvAMVPaDEtq593JAHHZeUZ1mHXFd/Zj423a8EjE+zzCMOwU25/GpyUHEHG1PoMxeHR2S/aKv96SdgOKJvLyj04fap7jzcP2ZwTB8GbDcA5eWvNzzJ06kvrHLg1R+iLnZDRTp9c2MzgchtjsdN/082Qm8uRadNvNvQnBRe64CpQt3iiVSMpiGM4/tH7RG5lhjDpGYnJ4JhmX3W5Vt/xG7QRKmqcFrSPoN32gOSOD4bKTfu7GcMxmVCbmZN6UtRp0lobfK0kVOKcU1ih9oGx+ym1ewM3M7KMMtTGFXzkw125jJ74XftQReC9oeekcb8yg34kaSdS8uuvRvBivaDg83MYpsptFgjHu/Z3G2C+0su7rJlUZmVu7qDvoiL3V8oppbZfEsXwfFJJiUmZnDdmp527E2rnMmVKvVW/vDcnJKlXSKbZ/ajEsP2efwKZfz8Dnnss5Kbuy2XDHdmgTumPJR+dYHkdq8X2ZTFsAlMSdbvlphibdlphUQ1XREuHQh0+d0b4T9Bll/WYnGZ56dmBVxVRtoMthu6qNgnAU/wB8axX1h7xq4VYbHfEWPNactZFDYUKGIUKFCgAUKLCRnWpeRn5Y8PlZgppsQB51CvYVDQrgoqJVaUWtdFWK+ABQoUKABQo75xq9kpSWwopfaXGMNksTkWiKyRmHyBHiTskaBvK3d4dqlOFaFxxFx+zk4OD4Znyj5dKmQPpbja9hj+5r4mvH8MU8pPTaT4TuagOAe6RNoYBdxS1UVKUVdI2G120u1G1Ozkp0mWkJDCW3TmGpXD5JqWlWdLELcSt3JLqr4Rh2dxpXQIOqVN0+JEvgnlE/YrWNZI5tRanHUYIVRFVEMEUUVOGiLqnz1i+TEyGRkcUHM6dLAku0a71iN6oQ8uBCn18YqcSwydlmhmXWHMs6db2xWv4k0/nB+JzfR8FDC2fgC/8Ad7S/UiT/AADFKvn0TLb/ACVTjxLLIiESvOGTji/7+a/OI5Z4gXKzVBo6X80+kclmTd+7ZJynHwSOzcq9K5ean3g3h5pVUr+UEKEzcczMCDtXBBz99Lk/zix6S0zPPvS7L7uHdhywzEd5OPl5ItYrHW2gl2lFxSdKt400Hw9ViwSXmxwtqTdaca6R9pltPvk1H+S0+cFwxIBTCbWP7XfVzP0Glvct86ca6RFe/iM51zu8fO1E/JIkNlhMKF9ubc6UrhNuS+UvY4oV3DjyiPC5kpSZzstlwbVuB3skn+fpCA9Hm/ZhN4ZJsbSyLq7S7LTLBi5N4e2WZKuKC0bfa7TZIXjurTRY89fZclpv7S25lLS+zdrG+9ne1e0X9M/eWCbXOYPiDm+pzcyjQOn8FaWEi+BIiR6Dt9t2x7x6N7UfZDg7+aCfbpJDkX3Pxi4FWjrxhq6Z+pHg2O2h4/ISWBYls3peOLtuEGUu4GUg7riL3iroSfOM9iOGTEibTbqXqbKP7mtAXgv01rG52nwbYKYaexLZPajEpCxsnDkcWlusDTsg61unXglUGMxiUrimH5c67IuyMvOylZe9VMSZIaJQl8aRs/VYyi8FMzNPMqNF4cPL0XlFhguIMYdMy065LNTLiTOYbUyCOsuAndINLtfNI1DXswm1w6WxCb2n2Vw1iZlgfa6ZigIe8nZUAuUV9UjPBhmIsSr021h7TzEo3171MwCEyURPw9F0jJtC4i5onti8IxDZU9osE2qZnDaeEJuTOUJkpIS4OHvL1VaDcNaLxpGDNBH/AMy75Rf4zIyWHFhY4fOm8s7IMuvrRRynDreH4uCRnHFqarDkBsKFE8m0T8y0wPaM0SJALdlpl1uamglXDl5exszotrVdBqvnRaQMyyDoH14g4lLQLvfPgnzjSY5jWH4jhMhheH4S3hsww2jc47LullzuXda8Yr2XKcaaLxoixk6xTW8CX5CJ2VKUdsV1l1NaG0aEKxC2dhiQ8oZCiRmmxbHcQxjD8LwnEJyYeZwuWclpRDOqNtqV4inlWM3B0pNIzMszRM5tBstuVKqg0Th8oGnGejzLjNbrCpXxgH4JXZpz7m8XWw0C8EXSGMviDt5S7LnHdKtPyWOyIMmTme4rYo2RJ+IuSfWH4kIkYTDbdjbwVp+JNF/NPzhfA49kWe50cmM1RbVbrB4KvnEK236dmJ5boygYvA5eVLCDl8udYY8yQGScUQqVhiuMJN/dK6Ou9vsoPDhHcp3Jzcssu62+mlfCsRlAI5DobBuG25+qUW4VQ+1ZTnbzhSODgS4WMudIbqd62d4bfH1jsxnNZ2e2TThmm4oW+fD5pGsxLYLFhwHE9rpF+SxXAZWYySm2HUAiu7+SVHEFCVEVbdFjJOOBMLU3neylb95VLh+kPwG0lphzExjKyuGYLI5c222ZvKsyiA7bUr6GqCNBTx1iGelccakGuky73RcpXw3N1AJaXacKr4wBIK6M630ZvOcUqAChdcq6cOcE41ieKTs8+eIPuK8VAdHs9nSlE00pGfVl8Gl1xvO5JgLHvDNwmWw2YnsTmzAZFGT1Q66pZTeuTTyi/ldn5nZnEJKbx0pdmaVxUPCna54hYq3OBTdThouq+EVEmYqDHRiHDW2Q66ZuW8iTtfPwFPrED85KzM02yy2bQKe9MOre8arpcS/yT84G30BdtTQY1Nv44cttNNirreUzINtG9QnnGmRQv4P/ANqRTyE9OTW0BLNONi45chg8yhN7orQLV4JpTyiGVlkfmsOwyfnxYlOkEjpgCuFLCpIhmopqvCtPKNBi7g4BjIdDdwzErG3JcJ5xuoPZbu6+FdRVUQaVgbXX2NdItHgCwfZmY2lxKXcYZlsHlZoxbbJ520HD4WtXLUlVfOiLxVI0XtDwnBcClpGRlJBJLEpNzok0IP3ER94jWq3l4oFAHs73GMnjWNY5iavz2KYo/NZ9rSr3CQdUDwGnGlIvcRwXC8b9mjG0uGOOS+IYY8EliMmZkaOIdct1uvDwUeHNIxq9666G1HsbTqKKcn2JPBZrDBlW+lPOUzh7jV1yh5qpW6+CUjORv9n57CdpZf8Ao1iySki8/wD2DELLciYpS1wubTnP4SoXCtcLMMuMTDjDo2uNGoGngqLRfzjan+5hVIwWhottfLxhzpIbhFaIVWtE4J5RHDipXd4RoZDYnbN3Kdbb7BIinw5f6xBDiKtPKABsFSM0/KuqrTzjV4qB2aKorxSBYUADyQalb2eVeMchRysAGs2llsNkcK2fnsN6Srjsr9ozVQgzE7VvNNV/nF7t5suzIScnjAz8s/hLkrKuAbT1xirgX5KiW9mIt13LgsZvZqbk0YH3iCPy0iSzHRnlJW3i7obuqXLouvCHpKYlj6+9JiUJ5J2Z6HJ5ToiLb26uWLfG1BJERNE4axjjbWfB0Z5dK+Rs9ifTMElcMkJRJaUlXier2npl4u8q+AiNERNE9SgrZba7GMLB+Uw2ZOTl5kxzrDLepzLxh2zeDXbQdGnGHG20cOWseLK65aoIEXc11LwRI0+yGyODSWLZM3M++3LrCalTymFp/wA1UuX1REiHmKnTa5SLy7Nsa72VYPg+0O3b+H7WbTSzjbPYm2yzG5pEpujWnH014Rf+27ZKV9ncrhEkmQ50h9t5t63eId4y/wDaMB4PgrGJ4k1hsjKS2BS+cOTlH1XgpOuGl/8AFyiH297PYkGJYJ/XX9Ivs4XzYO3iVXFb3a9lEVBCPMq0OXWjPQ9KnxGdKcNTyHH9q5mb2onMSxLLnd9wmmnR3PAR0ponGn4UgDDD6dibUs2647mbgWIt+o00Tx/WG4/g+RiWLMTbnQ5qVMupdTtKhUIK8iT84opVwpd/NbfNtxveAw0W5OFF5R69K2PSeTVyy6ixx1Z5mZ+29JbnA6uYCYuvExSmtddUpFcs1MGQ5riuU5HqlI7NzcxNzKvzDrr7x9s3TUiL1VYeMmR5ZD2Xexaly3fDRI0/5GfnpDnnBelGJ11nPBsOjut1tsp2deP/AGhY4uHLLyqS3RyeMUddOXQ0QLuLaoXMacU0W6I2v6sMm5rLdR1KOsodd3zpwXmnhDJ5uSZb+xTDjtS7w93l8/FNUiDXeAtjZ3EXcFdxhltt2UAhbU0MF4/hrcn0h+BdBC6VxuXnnMPc375YUzG3E+G7Ra8F/wBIZg0oXQ53G5krG5LLAA7KuunWwfREEiXyGKdZh7Vc5zX8UKzT5DJV1sMpcqZYl+usHzWEzUtKBMPhl5jQvgHxtFohp5VSiwK662MwvRCeBtCq3eW8n05w1t9wXc1C3uPzjSbmMWLOaHBywsG2XLJlge3YX2lSWtFqtBs4ecV0s+LKGuWhEvZL4YthwiVelhnfeMu224GYjIbziLdQht8uOvdWsDvt4e3uy0s87vonWuar/CKfziYNJ/QIl8SYJAX3c5Mv5l5hmLlGCclFNfzieaM5aZ6aaM9KR/q2WQHICnhyKi8tU8YeGKTOEsPyQ9X0gLHZVjcRU+F1U3i/cr6wVhCSDk706ay9+zJRPuZQyr2k7SoPG1PnWM4WN5jQ1zv0xOpbYXs1jOIdJm+vmXmXQcxB4tbCMu8vPz+caWRk8NlHikveTE7Y91U6B9Rlp8Iql2q61XgnKMQ9ib7ky+104nd8r5je3q96nn9YL2byn5xuWucIlNLDvQR+df15R2cOktPx6OSu6rGm/k9J20mdmZGQYcwn3pijnRh6Q7PHlti9zERHUhTlVdY57FPaI5s7tNLNN4eLrhu0HcoBAQ0Nsk8Kd7lGN2omJSWAZYe03uOlfeLhXbp+G75VSC9i/s047jYtSHQQe6CDrztvWK2R3CvonH0SJ/1WPwv83K/0y/M3/wDoqtr25mc2yxLCZiUyH5M5vOzHkBttoN9unhby8bqRnsGxPDHdksew3EZBl+cfsfkphLWzlzFd7e7wEOmX42qnCLv2241J457QcRm8HeVZedZlHCEg3jdyQRU+sYDEJZ2SnXpR37xk1AvVOMcfDr+HHg6uJf8AEnyDQoUKOk5BQoUKABR2ulI5Di/erAA2FChQAKFChQAW2zGHsYnjctKzkystKkXXOoF6gCcaInNeCeapFptmrXvJ6TlnWXWZT71xotxS4IALzEU0Tx3lgzYmSZm9mMaelX2GcUlg6TdMPg2JMgOohXtOVWqDzpFPg2Dv4tjLODtzUlKLvOPPTTyNst2jcSkXkicE1roiQstzTHSAfB10mczMy8tUAE7JOroH0rX5RLgktMOpiDzYm4MjJm4Si7ZZVUC7z1LhzjS4JtMuz+MTeHuyuHY2y9c260+KTMo7UbUMB0oSDoJpRUiWbe2TkcHxZhvDNpZCcdBvKZ06O9vVo5cl6CnFKLrE29BfxJSbHnibUpiJS7/2AG23ZyVN6wZq00sbs7+9TRNaXRV4rMOYtPPzQykuwQgTjwy42B2qqtOXGlE8Ehk1NzMzKCiMi0y2vEB0SvJIIlGMNc2UxB0ycTEm5ljJ30QSZJHL9OJLcgekVexNrg0lik9K4dMSDE281LzBJmND2T0pr46aU84Nwmaw85y7GZB+al23c1xmWdRnd1uFFottapy0osdwbAulSczMTD7DGUznWOu5ZuChb2Wi9srbtIrpEnWZo3pb7sbkJT4WKipQvVI07SNwyXlmZqTm0bzCe0dYpwonbr6J+ixBj0+5OTw9oW5doGGQr2AFOXzqvzi3ZncDlZXpGH9JanmjbyWyS7M+MiWtPK1E1RYzTwOb5H4w3sJLhpYtNZyO3Zb1lCcZ3CPzLxXziuVRhzQ5jlveLh6wnQsO26v5RmX8jRjX4NthtHs4y05hOIZcjMNqJyLxJMsFRaLe0dR148IydW8rvZlflSLQp+QSTlkbw5rODMR7ja4i9muvFPFKQpiG0kcTMbBW0eOSOKy6r/R3DsOnVdQiekr2wtt7OXVRSq61SLDCdrcYwaQKRwqdlJvD3gE5uTmJQLHCQab4r2qJwVFjLTGWQA4J81SnP1h2IzXTJx5/oktLZx3WMhYAeQpySKhce2RS2W5flO7IYhJsJO4NOYVOIvWzEk7e27/+I+z8lhmOYiLrEswxjCPYewyMvlss5BkAqpJeHAlqvaqsUcorl+TmdXqpd5NIknpdUmAfPKyJjrEyOyic0ROSp4LDEWM0udMYK/Y2/wDZxuaA/gNUovhpFK4oulUGxaoHjxpz9ViyxQsNdnmhwkJpqXZZp9qNCNw0qqrREolV4Dr6xTQMKBw296C8HX+sWl+CpfRFWAoNkxFGnJjOtcDshbqSLWq15U/nCjcYTjOHTOFYh0aZlxbeyAcILxKl4IScOdFTTinOAW22zZdcJ4QIKWhzKv8AlGlx/Z7ET2QltuvsHu/EJ5yRypY96XdAUW0wpu3DqnjqsU8mruFz8tPrJNvZKi5kzLeY05+8nBU8opo1FBVrCSLRoZSbZnnX5nIfAcyWaQNwtd4fw0ThFbatt3KJmLBcKlrmssyZzN+5sTHcOmiwVjFHZORmEbbacRrIcHxUeB/NFTXyiCce6YZu9SwDLQIDYKtNKDp5r2l86xG3NutSbrAtt0d3TO3eVK1pX1hSVARNvMMvMP4W0bGT3zeEyIvGlEp6axeYjLSM9sC1ioDLsTzM4QOAB/eAQjUrO7QreHG5YyMbUX+i7MsYTNsS0o4zMuS8y3Z1kxmDe24X7nJfBYloGu5iaQ4v8MF4hiE7OTDbk68rrjLaNBciaCOiD8ogcdO8MzfspFkkrxTMu2ksTzgtra7ZrS5U0WnjTnGjlpvZ9/B3ZjHvfGIY+UyGU0y422wrFut50Ur620olKRl33HHVq52o0U00UjtOEk03IdLNptmjwK03LOkKfGtKiveLSusRp+ZpF586BGD7U4Pgr2fKbF4LOuf/APUzJpP8Nwiv0iwxD2i4hN4biEqE37vSZGwZbC5FiUlrF7QqgjdT5xj8TlpvDMWfl8RZpNNmqOAa11XnVOPGqKi+cTmLTosSUy3LSvUiTb3qld5edfygkS6A3S3+gHLC9VtdbPh+fn4QNMCK9Y23YHDjXXnD5qVmpKZOVm2XGHR7YGlF8ecaLD9lsWxsf6jwOfeZmZkGJRzuG4gKpBctEqqIpeiRRO5mWXDB0TbOw0WqEmlIaRERXFqqxfS+E4bJzzbeP4jY2JpmsydHXKc97sov1i5HanC8Fn239k8ElJbJr9onPtLq+GppaK/ujEO0xtFy0W+82CfZZgs3OY1PtTE7heGybUtmTwYmxmmUsRJebTS7xmKb26qFRKosCTuweJYnigDsXJT+Pyk08YSvRpUzPQqDeKVsVU3qLyiv2u2wxbabFG8TxZxuYnArWYWqmXhVV+HknBIDwzHcYwsXxwvG52Vbmm1CYFmYNrMH4TtVLvSEsTvtI2/p3LfFMCawJwJDpfTMazcubalzE2Gi/ub07ble1TdThVYrZ91iYZmgVL+hsA22V3ev3i86qS/KHriKSUkbGGsdGVWxzHnjRXSu5B8I+mqpxWKZHcpJhtBrmCiV+HVFgnqGvR+ZJLYlOysq5JNzLgyrjguG0i7qmKKiFReaVWN97J+iGrklJsuYjMTUjMN4jIPEDYuN90mV4kY9unHd0jzQUjV2subKyeOyUyjWKyEzkust6Fk8W3fkVRVf3YivF1t7KoaNkWuB4Dj8ohYtM7HM4hhche8+9iDJNS7g8xzKjdXkKKpV4RmNoppcRysTSS6MJ3NHb2VIeCfIFBKrqtI1G2mNzEx7txvD225SU3b5Fgy6MzMiP3gtqqiKuJvr53RFtVJsYhs0xjmBSgy2HzUzSYlB16JNWbwovHLJN4f4k5Qle0QU1O9zAwommGHGCo4MQx0HKKFChQAKFElBybszeu7H84jgAdX6Q2OjHIALOXbbDBHZocRbB/pAB0S0lIxtVb/hoi0TXWq+UFykwOEjhU/KTpJMoazBZaJVkxPc9eyi0WKIeMX0thoTeLYbJDlhLvzIsC98QqaJcXhxiGNEv4N1L4g4xPu4ljv2vFJ4+lzDroX9ve3vAnF7X4dEjbYezs6HRsSwt0n3HgvdZesaynl7ghWpCnJYzvtt2altnNoG/dOIu4hhb1UCY7pugStlb4iKjRFXzjLlizTkyT7Us3KZQ35QVMNKJQbtdV/WI4dM7MsmnEPjdZg+q8F2z2DltjwwublJv3wol7wOeklF0fhUKaZaeXLWPG9rJjCJnB52SYYmXZ7pF8laXVq2WjjJeqW0pzGHs7W7N45s9Iym0nTW5yW/s2Is/wB18BjXWnBCHeThEmD7KYs70vFNicU994W31bzohnnLifaIml3w8lpHbWRWSVY5KLsrxKnj+2k0ZS0lnNNuLl9VOB+3D4HE+MOyvP8AWKKWw85l4UblHCzE3Ms7v9Y3W2zruD49NPjIyjshid4Tso4N4JMjuuW94Crviui73hpGYfwGVm0Yc2anXZyYy73pN5qx5ok+Hk4nOo6+UcFOcDtqRzJuGYVsjMzEgT7s3LS2U7uhMdXpbcpkS9kUT1quiawI5iuGSku1JSzWWbWZnT0vUXX7uAJVaCCeNKrFdMS2P9qZbm9RpV2vZ9VjuC4fh7uIyvvmf6LIm9bMEyOa62HMkCuv1io6t5uLt0WLfcp6xebEPSEttLJzeKSEriEjLkrszLzJGjbgImorYqF9Fiz2hc2Tl8Kps30vpJha+k6AmXaLebIdBqNLkVOPBaRlXGnWbM4HAzBQh5XCvBY03gx2k3UnIzuL+yTHp1uey5bC8RlZtyT030dzGUMe9u0EfDe8Y8/j1b2GYDiG1MzjWD4ZkOOTOEvh0Q3LTeb/AOX8ZAaAdONLo8tebdadJpwCFwFVCFeKLzhJ6G/iS9/oriDeHszszlNtvgZsoDguEdvGqCqqHqVIs9hsB99zMzg5XK4cu69KI0AkbjoDXL+YoXzSOYnKzeyWPTchLPE7JnvsmYW57S6gf0i5weTw88Hfm/tspMTbR9CdAxtzWyTUaLdTiirp5VjR8K1P8OdfAJlRq9cGSmZJmQtdYm7HLkUan/vVIvJvChmNlm8dkJ2TX7RkPNMzI9LEvjJtaLYvJRWnjE2H7Hv4kzOzbkzLC3Is5hjfcRdYLYj+GqlWq8hjr0i4xlSkoxbla7vaVU73yiWp5baWEr4azF7gOz2FYBLz8k1j85iMij71jzqyGYjDa98aFvr5Rb4t0bCsSfw+UxuQfwsKgX2fKuaEqjcBChXr9UgyyWalvdszg0s5jTT1+d0gxS1RrYQ1tSnG+ObTNYI5tD0v3o+/OOZRnNu7wsvJ2u1crgouiKvFOUZors/uP2NHlFX1P7lJL4tLO4lmZDD7P7Fp0ULKTkJU7f8AONrswOxjftHwp/a7G8jBplrOxFxhkhVkrV6mgp427wpTWMhO7L9M2hf6dtCww4e9nBL3gqrw+60+iQ7ajY7FdkcCSYxHEsOnG50BKVOVUJnd+Ei7bJc0RU1jsheVZrWOWW5ml7g/tJncCc2ixJNm3Jn3SDxdEOZ1cdC7dXlbVOUZyWc6XMyLWVa12C53lzX51RIFdDpEs7MZ7Yq1amWpbxVrqnpzjX7NHheDbONY3Ofa8YaeLo2HutUaGXUKpMX/ABX7qDzpGHEVLmvDpEFFt5OtzO1OIFKIoMXi2g/uCg/yjPw90ydMnDW4iVVX1WI4lYxWIB2yaZFChQookelu9Xjy+sMhw2373DyhsAChQoUAChQoedtUtGmnjXWABkKFCgAMw5tXpltje3zTs8V9PPw840E9huDtYqJuvzvVI47Pyz0tkm2qFutitVrclNdKa6Q3YOQwR2f94bR5zmFsEN7DJ2m+XGyvdRBqqrx5JqsFe0MsEd2imx2S96ng804PRPeG+/ljp623XW11px1giNcvBV+nHzJXYRMbPzWOLNbQS77WH1RFlsOtE7aL2VKqaaLrxiLHsNm8Nby51XkfvpafwW1FfRRVFSAp6SWSN3rL0vJsCpbdTitF18ofi2KTc8zJS82V/Q2UYAl7VicEX0qqJ5Rn3TeJL7YtMF7tKw5h2w2AykzMm5MzgFOZRN/2dhSVGkQvxqhmqfuxR4BLuvz4t9GJ1twFv07I8L68qLTWObQzqYhiazAS6yzVgA21epWgIoKar5JF3hMvNzeHTMhIZbBZCBMHnWCrQdYd3il1K/ujEdq/cvvf7Ck8KLEHZ1sZmSlJiTl2/s+o9KJCFshHlfvXLVURdYyriK0ZtxocEmsOKUmQxTPcrLmyGUdqi5xacKvaFFqipxpFVOy1suDqFePBD8fLyVPDwjs7lOTtYl2aYl3sUEpubclWWQJzNbG4hJE3aJ+9bAEydx8E00XWty8y+cWuzshNz7E41JSzj7ll5CA1tbCpGa+CIicYpV7UZ2LOQfIMSTrMw7NzyME3ZY0jZET1VoVF4IqcdeMAaR0VhWuA2JO56x1wBEE3t7wiKHsAXMywtNCoPC7pv2joJfDXnprA0FMvstyzrZM3mabqqS9WtU1ROelU1gWCALHBMLnsVeNqQC97TcRaKVVpRP19EWBnHrLBZHKIBoaiarevjEkq7lyLtsxlOXituu/xT8qrAzh327tKaQhh85Ol04HxtJ0A1dWpK4qp21rz1/KIJ3rVCZpbmjvfvJx+vH5xbTfRJPA1wybwr7cbwuhPb1SaGo5Ya20VVWpUXUUSKueF7payQyzjWUZCDJJU0qvBfOAPiQVwOzvcoLn2m2LZbJczt3f5EijyT1XjDZCScmpzo2jViEbhOaIAilSVfpDJGfmZGfYn5NxWJhghNow7pJz15xQiyx3DMc2eV3BcVaflFXKfdljPskTdwXDyK0uC6pWI9oFwuXmgbwGdm35ZWBuJ4LCuVN8dOKVgXFsSm8TmHJidfcfedMnXXXTUzdcLiZEvFVgKIsO+g6xVAnKjpTnrHeICO7/NaxFHR7UWIMRB6PNOtiqN1EUrrxWv8ollZ8ySTl5nLOWlDJxoDbqO8qKqFTVUWmsCuATea2W7vJ/OOkjLZqNc1Rc7XdIU/PWIsO4+Wlpmfm1ZkpZx01vMWm0UtESq/JET8otknsNcdmmWnHpZh6WC7M6wjeBK/KpQHM4j050FalZPDlbAqLLAQXacFWqrGgDCtmHPZ170fx+X9/C8DgYcy0V5MXqDl5LuofZMad1SirCMrigh7wdyiuA1vFfJdYdiEkslNtsuTMs/cDZ3y7iOIlwotKpzStFTksXQ4vs6zjUw43s77wkbxSUanps0NptO6St2oVfGAVxKb92+7QCQl2c1TuyhzP8AHS6nzgXYbbg+H4XiU8f2PD5iYE6oJCC2/XhpF3tHgWLJJsY/jM1hjSzQJRsJsDmCt3ak2iqSKtK608YpX5i6TBtzE5l1Kr1KXWj9ViFX5ZtujMtVz+8cK78uH6wun0Gu1wrEnW5lJdx7qK3crrA7oonhxgJ08/KGvYHLqvlwiJ50njVxwyM14qsNBbfnAElzihu4pLrN9ZNTjSXzkyrpuE7XskV3C3QdPKGS7mIT2GzF+KiDMsIFkuTNl1N0bA7ypXlygXB597DJ8ZgN4ew81WiOtroQF5KmixNOPSTGIzfusnOgu7raPAKnlrrRfNKUqkIdwJMsxERFALWpmcR9z84Vd67d1rpCv7XOAQzjFhg0m7PTgyrAIbh1Lkm6Iqq8dOCQNKk40ecBWWd7/LzghJlh2UmukIvSjNCbMAGmvaRfBKcKc4UlLbyNnXpd25BFzMvSw66WU4U8a6wTPPIWHBm7z5KA3DaI5YBREpStdeMVgKl296xdY5iK4nPAoyEnJBlqqMS4WNjdvaVrEzpYtdblK1241Hs/xKUlZqbwzFGJmZkZ9vLOXl3RaJ5zg3U6KqChLcqJxpGeBJZqeazrn5dCHMs3FIeaJVNFpziV3r8RJ2QYdRtCImw7ZCA66rzonOCpGS2Ck2DX9GvwXCn3MWmtiJ3LamJiZSSvNaAD93VOV5b26q+Bx6Hs/tB7Otl8Il8JxfYyZnXm2hl8WZdxMuvmWz7YiPZtVCTzjzbHR/q2Q2l+z2TyFL5Tb/WtPNUoajxpRRovOFj7+KYhKTWLMiUz09kZydeal7so7qFcSdjeT/qjkleYsf5qdefLaf8ANDW+1TC9h9q557FPZexOyjQSXSHcLmuO797kLVbrOKgutNR8I8ajXYZjkw1LBjMq6rGNYc8Dman7YO6a/iEqIq94S186jaoZdcZOZlG8qXmkGYALLUG7VRFPhQrkTySOqnGPSclXq6isaZcdFwmxUkbC8/JKolfzSOOWpbaRKtN6qUovlDKxyNTEUKFCgAkQLh3e1rp5QysObFTMRHnp4RIWSgW2lmW+OiFdy+UAx7DJI10s26siVKkK2kXG2vpFvsXiKS202E9LdLobc+08aICHwLjRePpFDUrLbt3jHWXFbeBweIkiwmi41aVm8HpRbUO4rIMbN4gTOTLzDzku67u5SHvGNfBVG719Yy+7nC0+T7c1mrmiQjagKKKK+NddfKAdoJaZl8QFmYYyr6GH4hPeEvoUMwzDpmbm30ZXq5dFN57ugCLS5Ymnanr4LqNNTpnc0OKE/KSzWXnk3ZvXjuoa+HJUXjWObOnigmL8k++xnbmaDpN6d64kXspzi1lJvZfCcEmpSdF7F8UlnmX5cDeXoZUJL21BO1u84u8U2zm8ee94NbOlLN2C2MtLsqLDYpwsoO7Gq1kq+bfcyai9O3n7EvS2MRk38Gx3Zvpsq7/ZMRw6XJZpqn4uDyV5HvfijFT+xW0TQOzcphs262wAvZrQF2C7J07VNF1ppGpw3aabww82ZlMSalc292XZubEv4uVfGNthvtvx0cVkp4WM/ofYdnZcJg2pddCazKIVtOCKvGMqy/8AxzBtTbfmRJ4tjWJ43iMjJv7Syj00iN5EtNOgQOGAaW303rfOqxWj0DJq3nBZ8bIn+ce0+0zZ3HcXCSxKRxKbcwnEKzEk1PTDYmIr3ssFXL/JYwz2zE3h/wBw6248Gud2f8Nf/UuvhGE1OWbzSmptr9yswbZuUPCZvG8Tm2WAZdBpuU76uFwuHujSvmsBbTiz005Zht922n9oao+lO6vhTw4RqNucDY2ZkPdM37sxDFJsGpsJuTnFebl2yGtvgrhc68E4RTbKs4D0lyWxuZfkmzRT6Sy1mOEfIKKqCI87lh0cqrZXJr2pLhYq9kX8QkNoZFZbGGsGeF5DCbU1TIPkSqFSGLn2yYHO4btK3is1KNMs4y10sHGTRxkzXRywx0VLtdOFyRU7TYAWFTikL7UzLn9060fd5XjxBVTksbrYjGcF2uww9ktu8U92YVuOyk83L16G82NNAT+8BKF4rasVWhqTw/6k0caiSl9fBrfaQy7j/tLlPZ/guGJPYlJ4GzhmJPTA5YMvs75OiXdEB0u5w3ZX2USM5OdClsbfmZxwkD7JLDYS/hI1qX5R5vsrtrjuwk83M4euVi5ui/OTEwN529xpbuVNVReNaco9H2J9rmFyk5PTM7LZU4YXy03JUEGHV7xML3U5Wrp4RnQTk7bG1apzvv8AJY7Qezvar2ZOMbUSk41iWFMTGU480H9nc7OU80XDw5jGd9o0/hcjLNbV7Ny3QpWa6qXlzeEyZmBHrXBDiLSaWXc/KN1gHtAxYMF2gwmZmem4bieHPPZ33m+AXi6NeOqUWv6pHgWOSz2Jz4Py06+4T4fa82XtFsl7o213fDhEU67NVlb/APsurRVKeVvsS4ftDMsdJJuZzekD9pzRQszWq3V8+Kwe8ezL84+4QuS2/eDUt1rVKdnXWlYosT2T2jwhiXm3cNc6LMsK4LoEhiTVab1NR/iose+bJezvD9isMLEtpmsHnpqck2nMPdRzMlpUDGud+I+QpHVW4vk+NZOSjwnO3nY8VGcLDN5qUfel79116Xy2/RO7+cST20DZSb4vyTD4ufH3f9+fCPfsHcxR/Z6ZxtqdbmcLkpgWDlJshIFqNd5pd1RXh5RgPbP7P8JB73lsqw5LN4hhzeJtYey0RtWF96IlWo2EnZpReUVU4ypRtn5EvCU6t5TweKYhJy4SDE/KPiaTDrrWR3mraU9aoUC4jmtuDLuO3k0CCvl+H5ReyeKYZhWES7aYWL+KMzmfe9vNK3l2oCh431KvkkZc1IzIi1JdVhL1Ev0jIUKFFmYoUKFAAolcNx47iW4v9P8ASOOBbTeEt1F080rT5RxsybO5siAk5otFgAZChR1OPGkAHIUKFAB35xyJGwJwkABUiLRETVVWPTvZ3hHs5w4Dc9o/TX8x0WSCUfy+jiolvhRFzDRRRF7qXc4PsBkAw2ae92yFrjTf7VwtBQiS9foFqxVPPGM8cxLE5YB7hcKDy4cIugmMqQxOby784uiSgG9cTN+ql+LcSy78URMjJYfLNS8/0pvpiXvZNq9V3N1fEt7jwpCecYxKSJacgEUncbn73EVwt1tFFNKroKfNf5xe7WYfIT+1c9JYP0SUSTacvcdmaNvZDe8QqetxKJUHx0SAcEetxjo8pMOdCaNZhtCXdvQdCX0WKedZeGbmRLfVoiQzThoVK/NYzjc0vprrcmwLOdxSXaZlulvEuWy0qXVMtB056rWkNxVpyWmnWCWlhq3T0XWvzi49npTLGN+8JIxampFl2aZeMqCJAC8a+HH1okUB5j2bMuFfvbxKeqkVV+fOKjuFPYQrcC2xabN4oxhU/wBJmcIlMVFE3WJu7Lu8VQVS70WIcFxOZwib6XKCxm5TjXWsi4iIYECrQkVK0JaLy4wzCZR2en2pZlbDJVVS4WiiVUvkiKsXexna5ZTM9LBLl7tb6MLkvbMBmLqZHVUHyREFKeWsUHOD5lJXo7zjN331A3e5Tx8fKBGGjePLbEiLXhFN0wLeSKFDzFRNRrWnhqkciQND0SZxGR6FJJ05nD5cptTl2N5sCorl/O0V5rVE+cZ9RtVRLtJFlg2KYlgs2U1hs49KvOsGwZNFS5pwbSBfFFFVRUgWal3AUyUaWFYaeEaN7JgEh0NgzCglXcSl251zKlSdHOPmIV1p50jMo7OyrzBtsOjRywVt/e1T8ljR+5MCkdl8PxSZxrOxh7Esr3Y212JcaXOkXKpbqJz1WA5qaw1zHnX2Oly2Gk6oCbtrswjfLwS6nhwitxSbF/Ec1jq2wVFDeUqcOa6xXj5F5LD2giw3tfiUtItzISLEwbUsExqYAhcICx1l6Vnm3t4OkMg+C+IkP/eJNpZ0pvaKbmXXc+98nLk0QrtVX5w9G0xSRkZaWbEZmWZdvvOmbQrkt8VoXDnEWLve8kU9kNYLLlnOHPTZm5MXd1tKIGvO5b1X0GKxnLzBzbrOdvGD22Z/Fpga2pY0IZh0BtsBHSq8E0SK9xBQ1QSuHx4VipJOR11bjhkKEAokZSrwb1uqarEcKAA3FFNJ95tybGayyUM0CqJUXu15QKC2n9fOJGAF2YEHHMoTXtry81iykpTCpZX3MVfdfbBTbZCTJOtNOBVJNA4a0qsAFSCVXjSDZSXbMzdzHAlwNBcW2pC2Wl1ICIrv90jiKo8IoDQO4E1J4jMo/imHPyUtvC829ckynFEBO1UvlTnFPiBNk6OXbSld3gldbflWkQCZCVwrRYZABPKto9Mttq621eaJeegjXmvlCmBbbO1veppdxQvNIgjtfyiQOQoUKACxl5SWewp+bPEG2phokQZcgXfGnFC4VryjmFznu+cbm1YbfIbkynhuBRIVT+ccww5LOycQzujH2lZpeK8lRF0X0hk83KtNyvRprPU2kN1Mu3LOq7vny184QyGjdRXrMvn6wfhMuTsjOKbjbLG6hOHwrWtE86IukAyraOPiJKoh3ytraPNaQ+eBpqYdbYdzWUMsty228a0QqcqpyhT6GumpE+5mH5Q6Vy0dEntW04j4+Xl6xDB08JSoDIV3h33v3/D5J+dYfwL5IZhsulGOTkLd938NeCa+sNfNSmCLwXT5cIIwromaZTZuCINmQWJXfpup/ipVYY0DPQzeLfPsoN1LeFC804pSFcrHQjfQV6xvx9YNkCbYl2phzLdFJmhsqXaGmtacojlZYX5d7JUagxmOZpoPAu78WnLjxgMUM1omtIW+g9tS9nTGQRZOYZ6Qwe+yq16okLW3xRU0WvGND7NdqZjA1mZGZ63CZgFTEJPOVvpkse640lOK98fBRign5bpWzXvBN5xk27v3TFR/Ig/6oqZZ0VVrpLjiNt1tsRFJPryryjLHJTZnxc3E/sWuF4vtHhOHzfvGbkleEJSzrOipQuk+BblCtGq8+CRlNpXE6NhLCm4TjMml15VsuMiQU8qEi/xRay860sxgWNrPPyyyp9HmHmwuNtQ1bK2vMdP4VgPb1lssZXFpZjIk8WRZyXar93cRIQeVpISU8KRa7wQ20mbhQoUamAoJkXm5eYF5yVamRSvVu1tXTyVF0iEU+IqcYZBuPYeAGfZGvOGR2scgEKFDoUAFw6+5NSMtNuuC7kWy5gZr2RrZ8kTT5R2Vw59llibnmHglHwzBRN3OFDVK+lU4+WkV0koq9luOKDbmhL+i/WNHtoDMu5IykpiDk6yMo1x3cug7weiLXXnWI84mm8ZGm2Dx1nA5np2Ey0tLTA/tckXbPmdf9Y93x3267X4TLy+Fk7hzEwwyHWyDLdr1w3Ca3J4fDHzns3s9tBib2Xg2FvNszW+AGdqKPLeKl3rGoc9mG2jmMSctjLHutl4a+8J12yVAB4rm8Fp4JveCQmr0E3jUfIrVI0nQ9J/+Pm1r9ko3/Wkw6e+y9LtuA5XgAhbFTjm1mFzmMYS5juE4LJN9IJJ6WwmqdoFRu4a2KQnvaekaLY3CthdmMSkpmUnhxCckN/pzrJjn+PV8MvwrqXOPRZnZ72Y7X4l0L3lLNSJyJO3zeS1192gCqIlqJ/2jJparGaraDdIWj0S2p5p7Ep/Y5jaPIxiWnX1rR6XcYDtJzJeVItvbquybsw1M7Jyko1JgF7rrR3Ev7wrqHl4xkfaPsLN7DYauLS2LM4hJ4jLlZMt/3ml7Rfipz5pHk+IbWTvUP/eZI5f7wpyL1SORf/yGyOzLkLEbkwy2L7R4qWJTLF7k+XUm9RoCt5Iq0FURBp66RmMeFmVmXmEJ3MA1TrBs/wCnx8otZh/aSZ2fF7oWJ+7byMAyiJhuvMPh8+SwFhOFMPNtYpjR1l3nDYZl2pgAeM0HtLXgCaVXnwSOxH5d/RxOnNtERqU8iE1MTOXn5DZ117tPTwiwak28LmbJhyaN23fRk8pP8S6r6wdNtdE2elpnILpU28fWlwy2qCID/FWvoMNxTEp/GWJBo0SYKWaVliqVUW61y/GgrdRF4co3p/i6zJz1PwpxiNSjxGbcxecmJ59XHMRmZknTXkV2unzgSVave6wrGx7ZeH+sQ/iiSXEnZgGy5r9YBeT2jZKaZa9mknhYyn27aLFilWXQ33mpIbFftThvFan8JRvHfZ+MztY3gmyc7KOyDrg9Dzn7Xna953St/wCkeW4pjGz+C7I4fP7O43M+/GJdzCnZaz7pS3nJhk+FhIVnxItVgv2Z+1DaLZnEpafwvG5bpTbS7k83uj+G4u1pz0jjoU8Gl723O6tU5iwlrnsUj7INsJzbJJL3SxmSjw9JmDtyuHZJU7aKnKMpsE9ik5sNislMtdOmsPxlGutdtBhltskuUvhHkkFezT/iAn/6ePz2Mo4wzOmozHQT+8cKtu6unHmnKMWW2kzhXs6cw3CX5L+vMUmjnrwvK0LcqvhUiJUjn4jN6vvY6OGwSn6PRMU9keMTnsyc2owvaSSycz7qgi3qtu8aFVNV5+MV2xMizK47sT/8R+rZkH5vDG5YzLOEvvWC0/Z3H2uEeHObX497t92jiUy01m3dGDd305qic4tNrMVx/FdkpObm5tXpjDXjQ9d+XacQRQS9SEt3u1/FGtenNS0XM6NRUym36GU26mJCa2vxd/CGcjDznHVlW61savW1PpFJCVVVYXKO9VxiIPNdsmmTo296GwoUMkUKFCgAUKFCgAUKFCgAeBoN26JVSmvLzhkKFABd7NPnhhuYz0bM6NusEY1FHl7Kr40RFWkLEJx/HdoOnu9GlnJp7QGwtbb/AHRTgPlFtiUjhstgEnKyeIPzsxNNtu5OXlC28Q73HtIKUGunNeEZdH1amwea/Zqlvyib+i7W3L2WWSxGawxibabwqTOnSZpBM7qLvuef7o6JFrtzsLtFhvRMYmmGehYm7ZLUfDMa3agDoVq2VlFoqcOcZc5xtHmyls5sRruqtyNV42x69K7TSm0Ps6wbYnEsL95T3TWmZHFf2ssw7/4c+8VC3g1VPDSF/uGv9MGJwSUwdtwJJhpt6YlWXZyZxAzKnVARI22HC261KrqS+CRlSmnxR8keVekhRz8Vd5a/ON1hmzM7s8ztI9i0t/YXxw54XWl7JXKa04joI08LoyuBYemJT8qxK9dlArzyHu1Wuo/75VjKHjKfg3am0LEey/2iPD9ntimdnpdiXmMSxJpiZnJoh35cUqSMB4VUhUl52okYdAZWUMlcNHkMbQs0UdarWvpy5xNMTRHPG8ZIdq7nhpwpCk2pRyXmzmJtWXQbQmAyrs0rkqNa7ulVr5UjZFxUwqPkxC2wWT0hxFFqtE/EvgkWWDMupIYhOMlqEvZZahXCZWkuvCic+VUiKbFl6aRiVfcelmR3DJu1ac9KrTWB8xwiBu34tzyWNsIMcpJZtmWaweWMZu+accPMYy1TKFKWrdwW6pacrfOK8Ye2F6kimIUFV3vLl6xHSJablRoPJtxAzFArFWlaaVhhRITimNCKGQAE0E5BSuLMaKlOVi/6/rFxNTczjvu9px9tvo8j0YCfMQBECpUVac+VecULNqna4SiK8YLkXHBZdFndcAb68a0JF08KQ11EBujY4QoSHReKcFi0wtpwJN9y23pIK21uIt2u9SvDwqkAGy4R9nf3dPWLrD22QzG3XbWWR7f6/UtIIS82FL2i8HdrMJw+So/guK+8sODLbU3AynAeJtCMcutbUK5EPgtsZ3uxZY++xMzaPtqSvODe/wBUIBevwInLhrzgJhknngab4nSJ3K2NDs5inRMTlZtJPC53KBXDl59nMaI2wKikKarpy4KvGKF59yYmnZlcsHDMnNwbNVXgiJonpERKrTpZTnilU00iOsOQHXnZZctvhyhkOhsSBI2BF2fBV404Q2CZOcflM/IK3PaVo+GorSqa+kCQDFChRLLo30hvPuy7kvpxpzgEGTygkvIt9DyKNXE5rc9Ul3uNKJwT0gElr6coscdmmJvFn3JbM6Ki5ctfoQtjoFaeUQYqwMtOEwP7MRQ/3rUu/OCbRoPWYuD5ZIzmEhJf2PPxiKOlDhTdLe4cvGAQyFCh1u5dABM84Jo1awLOWFFUK761XeWq8eXygeHQ2ABQ4e3DYdbv28IAJZpsWnbW3Lx5FbSqclhriju2jbprrxWCJViYdlZmbFlXWmAFHT/u7loMQyr3R5pt4e4Vf91hQOSSUdyFcFxuqOAo80pXnpxp4QNHCWsPoSdpOPD/AEhgPUSZMVqPBFSiovGGW3BciFpxXlCFR1uG4onk1fUuiNv5bcwoo5ru6LXX04wgJ3mEl8LuUgveNE3Sruolf5jEcg8DOejl9rrJBuUXXlx5VSCMbF9zFOh3NuuM9Tc0KUJU9OPr5QDJurLTgO0usXxp+cT9Jc6MEYWDZOVcIhDsFaNVoQr/ADiXA5BqdnyYem2JYcg3EcdO0d0FW31XhDMGcclcUbdEfuzQ9fEd5P0g3GDlBxcJmQma9IHMctSlimq1D5ViWnWxSRpefATs9mvYPNyDDWa5MsPaKdtBbtcu9UUeEV5y6NyGGuAUoRP5iLTeMN6lCReFOKKnjEeG4cb2Nhhr/VuKZNeh60T6xZ7LEy4oMPN3zDU4zl390CUkP/qUINr/AKj7rX+wOc43NjPSTDYttONCQeJG3XeXzVLomcecxDY1GHhq9h7mayfMmSoJD8is/wASxQ0JiZ/E2f6RbSTAycyZvtMHfmN9Hfqi2k2qifjpVFTzSHjBOcyUUOhsKNDI7SFX8oW7DgS46XIPrABz+GLXCcWewpjE5ZliSfGelVlTN5lHFAVMSubVewW72k1oqpziqhsLccTYUSNmrZiYoNUWuqVT6LDRtvS7QfrHStvW3UeXKGI6i1j0r2M4D7/2tYmXMN95M4VKOzkyyf3ZC0PV5n4Lra+NKR5wAE2jbxDulWnyj17/AIb5adntpMUlJSb6I29hD3SXj+7FtDBd/wDDWOfiZtTmTo4aLvEG62Fn2sR2/kvfLtrj022sxNzAZXFe14CPlpalEjUbb7ZMbW7SYhgI5Mths69ly4NjuMuDutvCnxeK95CjW+ybY72XLJ4hN4/MSU+Tf/iJkyC+vEh1p/OKRnZvBtjsYc2vmZmXfw2WzJuR75PE1qLBckKtioXMaxy8TWXlYY29HZw9JuZLXueIi9N4YzPZ/WvHcwIeFF3i9E4eawXsrgm0WNY9LOSz7kjJ2Iouk1mh4btdD9eUR7Lbb4htZtNh+xmOjLOYTOYi47Y1LiDgOGhdk6XUUuUeueynBpScxuUHaraZvCsq0OitcWadkCJd1v01iuGzZsanrwKvisZIZ72iYCeByczs3KbTN4vI3ieIA9LG1kkP7ceOg11VNacqR5xK7D4hs+zN43jWHibLbn2G8gcZe/5o0Wjgpu07qlx4Uj6D2nwnZvENvpxnZ7bOWnMQel3mD6R2nldaIdw+yceI+wWQZ2h2jndgMUmm8P8AeACGe5rknLuK4QD5lvJ6xzws0na2x0ZcxYZg7Z/AMQ2twRqWwvBJmbxTOczpsTMlmbuyJKu6Nqckij9rWwO1Q7GNY9ieDPtTGCGknMnoSlLfszKnwFuKq/EMb3/4xSfs/wASbl8HKnRag0wyNwNBXs68VLmvFeOkZTbn28bTYzjczjbGQ3LuO2e75i0xcbIaEBB3m1HRf847ZV2hamkfBx9C5JOvz8mG9ns3h+OYauyuO4kkk41e7hD8wvUC6XbZdXui5TQ+6XHRVjuzuGN4LtoreKME0otmmU6PZL8Xy589Fi42Uc2DwvZnHdoHZZqYxZ+0MJkJneZl2XBLMMl76iW4nPslGDk8fPq2p1XDyAsl3e0TYfBrxHw8OUU9NsZx8kLUW8Q/gz0G4U+LE6Lzihz1MbqacaePh5wK4Ipq25cP0X6RPNOyhy7DbEsTbgj1rhOXXl5JRLUTw1jobXQ5V0m4TjSygZUvJC8jYgJOZhifWKKXUUdLa8OcCq82Y726VNedYMxpnBmGZH3XOPzhnLg5Nk41lZTqpvNomtyCve5+CRWFl926FC6FM2psfZhgUztbtbJ4FIu9FvzDE9K3oK28VRKqtBThSsVBy8260xg0tLvPT+cbRsAN5KaFwFE4rFOy840dwkQw6UmHZWZbfaKhgaEmqpqnmmsRy5ymS+bGMQH++8YaWzpCg4CWXq2KOJ/FS784aOMz44M/hOeXR3nBcMFFOI1WteNarAs7NLNPuzDgdc4akS8tfKBuMVCr6IZ28SNjtIeoijYleKqtdNap/wB4jizMUKO1jkAEgna2QWjvU1UdUp4LyiOFHRWkAHIUKJTbIEC7vjdx5f7SACKFChQAKJGAzHgb+IkT6xHDoAN3iOyWI/8Aw3b24y23MNDEHcKPf323+2O74W8/GMHGlwDavGcLdmsh8X2J0Muck5htHGnx/EC6V00VKEi8Fi8Zn/ZxNYUUp/RLEJTFnrQF/wB5mbLRKSdkLa8LtCVePGH8j+DIMSdhsNzd0tnBm3OAqJYvZLzRdeESsYm/KT77uHOvD2cozXfGxUUS9Utg3ElmcfnemuD0Vl2YRgHnCVGGRFNA4aIKU9EiebwH+jRvOY0/LuO2fZGZdc1ubAxXrRcHdsRfOtdKJGOX6mtvX6moxr2h7R4rsPOdPxZZqbxIzPEXiRMx660BEl8LW4zOFTp4TsTNTEh0huanjOVmnd2zIIdG053KtVVfCBNqmxAsMl2JPo18hL//AJlUVVXPmq/lAe0CBLTfu2XnBmmJbS9uthFzJEX6RmlNf1m5rUqT+kWKret9IkbaJ14W2d8liaXcZametq6yY74hu+f5LBJi5IydxN2zE4G7+Bpf/wBv09Y6zkHMvsSUu1lCL5Gi5wuJuc0RNFrpx9aQAS5QW/tF4+UHGEtLSLUz0m6eV3+z5O4LduhVXnXlSKslqtYMhWHNW3peVE+sEzjLYADjZM0uVtUA7lW2m/ReCLWA0i22ck5Wfn0lMQxdnC5REVw33GyOlE0tFNSVfCJ2KjXQrUQ7V/3wgqUlG3ZCamnZpprKFLAJFVXTVeylOGlVqumkPdVBZLJleKb7vp8Pgn1iRmSEME96pOyOY3M5XRsxekUtrfbSihyrxrBIQVgqogXnpB8rOizhU1KdGZNyZJtReUesatuqgr4FXX0SK2JRBxWSct6tFRFX1/7RSzYRbYKEve5Nvt3ZDXfJUq4ug8PDj/DDFelgXmJDcW/vi4vd0T61WLXDhlJDZ9t2b6T1wG51dvbXRtNeWlV50jPTLdjIG4VzrvWfupy+v+UPL9xW2+BnXTJuzBvXOdpVMt4o5LuoDlXG80VrULlGumi6eHGGA4oi4O7v6Lonjy8IZEFBkybLgg3LtiCICX7u8pJxr/pAccjkATNx3chQ2HdyKEENTIhLOtdGYMj/AGh1Uh9NYFjpJSOjb3okY2D8OkJnEZluXkpZx9500baaaFSIjWtBROcARMy860ok24QEK3CorSixS6Tcklfl8iYFu8XFtQisLs81H1SIXVUjzFO4i18/nE81POTMtLSxNMCMuJIJA0gkVVqqkveXzXlAo727ElDYUOUd1ChQCFEjwW2lurfru8E8ojjlYoDsNjtdKRMMu6Q3W8AvX92JAhjkENuNhLON5Yk4dN8u6ieHmsPw3o4zKOTTaushVSC6l3glfWCZHYGiQAEh7XWeC8KU8Y6guzMwgNtq464VEEEqpKvgiRESKK0WACaXBkq5zliJ4aqvlDHHXHEFHHCKwbR8k8IYX4eEKADplcvZEfSLPAWxdOaFZYX/ALKa3GtEapqp+qIlKeKxVrxi/wAGayZZpudyZeVxQxb6QepA2B75JT6edIh9i6fdcoUXWt1IZBEwOY688HYv9F14aRCtu7+cWQHYI483ijDrYZhguiL6QXLYWk1iUrJdKEMx02kd4jVOH10+sD4HMPYfiLEy3l3EJDvJdukiiunjRVizmMOn5DDie3cuVnys+K4aIv8A7YyebSaot4FgrSze10lkWsOibbh5xWJcGpfovzhNPSjbxty25OJOOCCoHabKluvihJwp3o1MrMtv+2fDMUbXoUrmS8y0cyzcGgjbeid0j0VfAozO2z7n9PcVnlYblJp6edfOXDsMESqVorzoq/lGSNlNvg2eMY09mgc2rnsNwjDJZ7CcBl5GelOuZ6ID3Sbbw6Q7XfzbrlTeRN1NIxkiEt0Gam5tCOgEDXm4tET6Jcv0gzakGjn3q2tuy4Mt5Ab42i2KEt6ef6wts8JXCH5AW52Wm5Sck251gpatg5ibwa94SEgXzGNU/uZtpfzYzsPUyIRFeXCGQo1OcleFsT6ty9LU7tNVTVPlDBWGwoAO/uxyFCgAUTzLeUVvGtCFbVSqL6xFHCWsACjebC7XlgeyuL4Q01k+9H5cJubb1dGXCq5Yp4Kdqr40jDkoq2A5dFStVr2oNwgJZ0JwJl9xpxJdSYQBre4hJQV8NLtfKJdco1NKbYtobT3/AI7I4a50bGfsb1dxmYWjnqH+esXuE7YY3OezHG9nWsyeyHmJ9zvZDY3Cfy1GseczOMz7smFcle5m5Q3fNfHzgvYPaE9ncdZnKZrJ3BMtX23tkKiQ/wCEijmemzr1622OmnURG6dLnoeyGHu4fiOGe0zBsImBl8IeE3grmjm2LYX4d/kunD0jHzM3is1KN40/jbLgThmZjeuYjl28hD+deC3RSyuOYlhnSMLksUf6C88Gc2BkIPIBbtyc/GAuluy/SGHGupJxdxapaXkvJaRcK67SSzo25fFtPMzTOVmZbjJI4EwKWOJalES5OXOnjG5wWQx6b26HbjBZdZqWalgxPETaIbmLurfOnErTqS28K1jxwSVxctvcFfP9VjRSuNYgmyM1h7cy5lm52WyWoUFBKtO6QkiLyW1KwqlL9x0q28HMdmnnJyZE3B6YDpdbp1u94+PPzikNmbb+0TAuAK949LvSvGJHZgZpphC++Qcs1Xgvwr68oHeKYdsF55Sy90bjrb5JGtNLaGNR4NDsgxhOLrL4NjM27Jsm44LMw2F5NukHV3J8Cnai01StYzc3Lvyky7LTLRNPMmoOAaUUSRaKip4osMFbTTLg3HZ97FMQcn5l03Zh+hvOGtVI6ar9Ysz3groUKFDJFDwIh7PPSGQoAJZh5x91XXTI3C4kvOIoUKABQoUKABQoUKACeVmXpZ7NYKwrSGvkSKi/ksMEbgIrh0ppzX0iOHt2966mvDx5QAMh0NhyW2rXjygAUNhQoAFCgnEJpZybOZyGGL+4yCACaU0ROEDQASEFAEt3XzhpLXu0h16ZOXlj2q3619IjgAUTtTDzfYcLii/ThEUcpAMvGBxJ+SmMEZbB6h9KsEUIkoOqiv7vFE408osJ3A5NnAZdV2qlp2evbpISyEYsi5x31ol/igoXmsZnPcsBu7Rutvz46xotk8Ke/pNhpPW5JslNgfK0QJfyUaesZt03NV6rQH4fNjNbRNYk1KsouCtfDuukBLlVT1tr6RkJ956ZnX5iYWrrrhG4tKbyrVdPWNSE+7hGwBSbZtq9j8wj0xVvfFpkty0uVxqdf3YpWJeUYbcmsSRx3MAujAB2qR8jKqdj6KvLxhU4CrN9PzCdkZYfeHvKYw33gxJD0k5awiBxBVPvKdluvFflEON4qeJYjO4m7lpNzLxOGot29pe6iaCicEROUAvTT2YeXMl1oUOyopT4fRIhel3WhDMEhvG8aoqbq8F9FjXYy3ghJax2Gw9tN+AQ2Cc8zl25clFAC63d118V8NIPdb95K9O2zDbYB9omSbUxJ1a07Kbt3CK8sm7sl/vzhxqOdC4fwfFZSY6HOdQ5L9115LW7ku01VNUVF04xXoCNbrc1L5mYnj+vCkWWGhLTknlzc3ZloTcu0ibwKutxaUsrouteaJHHsDnEYuGXW1w0C2m9mJxH84nnW0kvlS2qlQ/KPNvZVLvxd36+HnDgaVZxJRl+9t0xC/VEKq8aLB2IOvyMk7hKP33mJPCh7gkPCicK+K/KJdhpqVw/aNnEp2S6dLyYG5kX23FaqB9CUVpzpBM+SYi2he7ZrhrRrs90GWYmpabBDmmZpSHLEEDLGq2fjurzXlGMxEyOecuK6hWpw4JonDT6RdbW4NimEEDs8DTjcxpnsvC6BElFIbh0QkuGqcqxnOcF8tQ1XSRUWLZHZGXlG/suZNMmaKRmhNmi0pu05a89flAjpTM46U0+d6qu84qpxRNP0iN1xopdkRZUXBrmHfW+q6acqcINwvYjNB7q8fy8o6ydl1WxPTnyiOsSNNG7eop2BUl8khiGQoUcRIBBDpipndvWgghr4USIImm2sl3Jto4FUPeu1+URN23pd2efKCBz8jIJmBJtphCbtuC7s0qir+fCIIOmAMZhnp6OZaMjYlUrao1H0h2FcBVFHjHBiaYAhtudE93ktacqREIqRWwhne52vlBEtLZoOOKQoDdLkvRCWvgnFYTVsu86Ewz1gd0x4EnJUiz6LhKbN+8SxK7FTmib6DkqNjVtUdv4LrpbxTjFKssS02BpvEielnmehyYXoCXgwgkiDXsqnCvNecVraVNLit844qlzjgwDHGlv8vNI7WgQh+IuzDSW4oAOuWX9XW3zgrMbHDQYC3MccvM+aImiD+q/SBCGlPOLORlcLmMQVmYxXoMqjJrnmwR1MW6oNo/EW7XlWqxAwSSm5iUmWpmUcJl5g8wHQ0IS5LXyWOzeXY0uZmvHVx06rxVeC15/5wNDYYDwW0oRamtE/nBDs7Muy6S5GmSioViAiJVEpXTnSBIAkeJKlfPSDJqZ6SLLbpWty7GW3uear+aqusNw9ps81x47QZaUk8y7qfWFhcos/NhK58sxfVcyYOwEoirqv5esKbFRfb2NnW5tuadam23EmNFO/tJp/rAkElaObni7n6W68PGvOIake6pcIZIVhbiNTgkTTbo0Won4U/WNlimJOSeL4hh06OZh85c+2HwE62lHR/6fpGMwyZKUmRdbEVP8YIaaoqcF48Y9AxN1jEdlpuTJ5uZmZXC5KYY+Jm0VRxuv7qxz1o6oOih2yZycxCcy23Mxxo22mpI/FEQlVR8tUgr2jBLyftGnE60smZHPv+IaVp5UgfaAJJ17BpuUm5mZLEGW3ZzMbttmENQcEfi4ItfxRfbYFLYhtltueJzYy4LMuZCK198625QQQqLYtly68eEREYtH2/8ABc9UT+X/AGZUsqaZxzFMy2rgg0PxXmq/kgwZtJLzf9EMBmX7skDflWeqtDdsMt7vEhOFX5QM+ykrgMvLN2vDOTuYB9m4Wxt5+Zl9IHxyfmzw+Rwl90suTzHBar92bhVL50EY1jxYzbS+Xr/spoPlcQycGm8O6FJOdJNs+kG1V5qyugFXdRa6pzokAcoXKNrXMImxyJKDlXX71ez/ADhgrSOwCOtmQGhD2hWsIivIiLtLDIUABrJyQYc8LjZOzTlEAq2ozRUWv4qpVKcoChxfFdxhsADhWkJFVF0hbq+UJFUYALPGZ9nEZ7pjcpKSO4AZMs3YG6KJdz1WlV81gWZVsZhXGzvrqnl66fpAkSNW5g5l1nOnGnlCxsO+txmsXMzPvzLbs2Lzh5oAM2jro1cP4kTw048opqx1CosExcIaYJTfLJyBMsm66zzjjbrjQHY4Q37pIi0qnnHWX3Gl3bezTsIv+184jMicNSIriXVVhgIDt/nBk2gGoNytXG7fz56cv0gCOotIAJVbs7X+/SIYUKAQoncFgWWibdInCrmAoUQNdKLXWvHlSIIUAChQoUAChQoUABU7NuzWVmi0OS0LQWNCG6PCtES5deK1VfGBYUKC1gC8NkZzEp5mSkGHZmaeKxpoEqRL4JA/Ctw+UcFVRY5zgA5ChQoACZSZKWzbW2XEdbVtcxsToi01GqbpacU1SBoUSsOusPNvNEQONkhAScUVFqi/WACKFEjzhOvG64VxmSkS+KrqsOeZcapmW614Ki/pABDChQoAFHRSscgqSNlsX85hp1SbUQvUktJe8lOaeekAETgOMPEDlQcBaKnNIYSqverSGw5UVF1gGcjbbK4oa7PFJsS1MQZcJiWmdFHKmNw2yRfPUVThvRio2/s6YwxoSxLGXsmWlL5tsP8A7p5tOqZT9411/CJRnVW6mlGbMXPtnwJ/ZfaprDcXlkbXDpRqVlJa23NbEdHiRO6a3L4ksebTM09MGROndVbuUWm2WM4lj+PzWK4tiB4hPPnfMTBFW4/LyTgkUkOmuK67hVfJtBU1pDnDIt0uUNGGxZkOC5VoPOLGeSS6JLNywqDg6PEX7QuN34UTgieSrA0m2pvdmtoqXZUuGvLl5xKs6PS0faYbYsCgoA3a+O9WAYpPEZ2Qbfak5txoHxseEC3XB8FTgsGNFhLOAiQz86WJHMJmy2QORlomi3XVJa8qUpFLVeETvtgFFbebdTyqn5LEtFylawbghynvJvPYeduPuHb/ACj6cZxn2e//AAo9zlJ244DiWOg9v6h93f400/nHzdKNTOCBnTMqTT7zQm1mjQrC4KP73j4REziz/Rn8wv2oH+sc3EcLzbTfY6+G4vk3iY3O42cp0xzokuLrf47hIfVKxLJMuMbPLN9H6uZmcuvDQA1/MxgF5Dn1N4jrMp2vx/6/rFrN7QTn9B5bZpyTkujtGswDxS/XjeVVtPkK0HTnSOhNog5n3mQTE8YfxfpJz8yF75Z9jbNgI4KWpQR0So+UByWHlNSbsyLssKNkIne7aQ171OactIA5QTNuMpNk5JATLSruAZ3kKLyVaJX6RRF7g0TTDGUDRZzJ5gX0A628d0vBfKHuyk2MrLzLjJDLvXIya9krV3tfJYGhiEltq148ocJW/mnrWI4UAhRIKbl3nHBO1eF3rHG1tKKA7T84LxCWWXNpuiIRAJVRxCurwXy9Iiem33WW2SdLJbUlbbrugpcaJyrRIfINjMTiI+8jY8VNdfygQUjm27QL4raf9Udnc4gJxWMsTNalbRFXwSLPA5j3ZiktPFM2nLXPy9rQPWuBq2hgWlql48uUV048/iM4czMLeRGTh20FN6pLROCekN7+AXG2u5XRI2ZAfZEv3krDR7fxQY5h85LzLTMyw+w45aaIQLdavepExqMjZZz+y5veHP8A7Q2YIMzq7qIne8YucKZwho8RlZtJl55xqzDZgDRltHUNN87+7bdpxrGfXjFzpFhDitrp5Rf7EbMzO1eLnh0tPSEkrcs5ME7Ovo0FrY1Ubl5rySKEgsO0v1gphHAZP5Kvp/rDprHkTSOxDqwBu7TigfBX/OK9YkcNTMiLnCNB7teCVr4xDzeRxBHFlKz7DOET0keHsOuzJNE3MkpXsWXXINFpvV1r8KQAKcd2sSzSMI79nccNu0dTG3WmvPxrBAyAo6SRPLzLzLL7Ta0bfCw0tRaoi1T01SBxiQOjxhyqNtLd7XWJ8QlSlJjKVwT0QqjXn5KiKnzhsjLlNTjUsK0VwxBFXlWCG0uO03sMFaS9oktxrqnknD/flEraWyzn+6+EccbbAnxRxCyyoBB2S14/SLSQcwRMInW5tqcCe6tZR4DGzTtiQ0qteSoukTLWKhblM8eY4rltkOmGxbNEF0HUtFaj5pw15pDHTvOv6x1ntj1eZ+HxiiR94i+uUhNiulK1i3kkYxXG2GXZ9rDmjZEM56toqDfOnio0/iivlmW3XXG3CteSgtp4lcn8qwUwI+8FmplM5sCpllu3r8NeXrEvHotJLKYFtNm5bEGVX7LiNfNBMUL/ANQFB+I4u3K7W47O4nhrOMt4ms3YEw4Q5bjn3b4qOt4qSKnjwWKbDJ9Twuekppxej5JONN00zKpvfKCsYOWcYwvG8OmhemGZdtJtnKJMh0N0VquhXWounzjDyb+NCPaiXaYmZZJeWm5ViWlhGkwSEucn3nD8a8OScYzjhkZkZLcS6qsaR5XT2Xfbm8MLpB5c21MvXIWXeYqo/EJKuq+IxmI1pGVbuv7OQoeA3EI3W15rwjkaGI2FDi/erHKQAdNKH2rvPxhsKFAB0aV1iWYRoXzySM2blsIxtJU5VSq0X5xDCgAUKHQ2ABQoUKACQlGwfi1qvlpSI4UKACRvLscvuupuU4VqnH5ViOFD7ysQeSQAMjq8eNY5CgAUPEVJCXd08YkfZJqxSG28ENN5Fqi89OHpEEAChQoUAChQoUACh0NhQASOAQOKJUqmmiov5pEcKHV4acIAGwoLealBkGHG5sjmDI81nKojaJS1UKu9XXSiUpzrAkAChQoUAChQoUACiVxu0GzzBW+vDimvOJcQYmWJmk0wTDhgLlhBbukKEKongqKi/OByWAAibZYaBhWpoX1Nq40QCHKKq7q1TXktU01hjL5NoYU3HBtNNOFUXRV4apDL+qy7Q41ut1+vhEcACjvGOw2ABQY5acpnuPXzCuU1OpW040p+dflAyJvCil/pHIAOUj0naxx7ZfYrCtmXurnb3JuZbyvu3CGgb3eoK/JSjP8Ass2NxPb7bnDtlsJyxmJs133Ow2ApcRFTWiIkD7fIDO1mISTa5jMk8UoBVrdYtqlXzWqxnM3eI9GkaJM+ygEiBUIdIc0F113+1XhHVQSMEZFyq0/xeUFDY+w3LqyLRNkt7nj5U5rFyREAdnWqPag5ZNhvCm53p0uTpOkBS28jgolKEulKLXkvJeGkcnmRk3rRJvVpOySOcfiXkvknCACWsAEgPugpZThBUVFaLSo+EQwodDEcg3DklxInJpV3U6sbLri8/JOMQMiLsxruJ5fyiy2jPDDxM/dTTzEnQUEHe0K27yaLrvV1g3mxUaaj9psUexTFGxZnJ2blZUBlpHP7Ysj2RonD0irfZJm1HEIXe8BAqU8Ia0TjRg8nJdPlCfcJ54nbRFTXsgNETyRIWwpm+owTIeytIv8AGJWengmZ/ohE3JMshMG2O41XcFSTlWn1ijbH7QIuCva1TnFjJ4q9LYv0lskISevUHt5sqFUbx4EicaQ52vG413tOxVUXXygwUllkXWzPrgtJtfFF7Q/L/OB5gSCZMXN4kNa+cRUhbi2DJGZFrqZgM2WPtB4L8SeaRHNs5ZrlqrrKFaDtqohfWJpiU6tp9n7p0FX0JOI/78Yhl3su8XAzAMfovJU84B/EkIjcVtyJDIkdCxR3hWqIukRwyR9Ny67nwhpLWJiKsoA5taGW5TROGtfP+UQQAd9YOkLQ3uJ8OEGSRS01h7Ui3hojMNG5MTEznFV5tBqgWLupTXVNVrHMv7GRONk24DhIFnBxxf0tSKSeoGXpuRTLN0i5Ntl1IZbHY7yopL9KfOHSfQWpJ8p3PucZPIRo0Tf4CpV7vHzWBc2ZVjoSPdTnK5l8rqUu+kQzDlx9m3+XlDnz8i9HUaeBGn6EAGq2H6cfpBUuRuzgda78LZ7xF5U/yiM3ydkmpcWmxAOKiGpFrxX0jkuipLE/mDuGiWX7xVrwTw04w46QJsZfzZnLysjK6uz4beVPHx84rh7SQTKSzk2/ls2q6tVQVJErRFVdV04J84HALokfyKm/aWmsPeXfIR7P6xMLA5IvPuEAuEvL8/OB3svNLKus5XcYL20A5aVt/d4VhkdGHUHO7W7XjEgWeHsyDQZ2Km+bLzLuUEq8F+YPYvReA3ceapwipgmfCWanXW5R9ZhgTXLdILLx5LSunpEY3HXdv4J5/wC9Icigih1PrDYe4d5kXjCGIiItSWsWMiFkq7P5TgttjlAfFFdKtPTSq/KIcPlWZkJknJtphWWVcBDRVzFqiWJTnrBeKzcouESGHSQOJkoTk0ZLo48q8vJBQU8eMROukGi6dUhOCYquFyudIy0ok00YuJMutC4VU+FCqKInoqrFNOzLk1NuzTi1cdNTJfElWqrEH4YdUbKUW+vGKxi9yc5tY5xqsXWz8/JSUtiqzMo26+9LZcq4t3UGpItw050SmvJVijpB0+wsmaSzokDgJ1jf4vOHMROkgrW1g4RCDLWUJC8G8Z17yrp9Ejozs0EiTGf1ZndYWq1+JPCInD6oAOvif8odPyjkvYS3E2YpQ7VRK0RVTXwrCDULlHMPbkEUG5k50jMHE0sJsholOdUL6pBeATuL7MPM4wzKMOS7xGyTU2yLrL9iopNuAv8ADotF8IrMGRDnhZJ3KzEUUPwLiP8A1IkTYsbzmIOzpZnX0eUvxFx/OsR5sX4uaSUJcfmXp53EsOwxqdcck+jmTmTJNKQkPxKLKKulK0tgX2h7BY3sRNSnvFzD52TnW8yUnsPmRmJd8fwmnPyWiwHg0u2/IzItIy8ay7rioa2m1YN27D9nphhR6NNk8/h9RzmU7QgRUK3lciqhIvj6rELONzR+vEzYrRawXISRzqTCi7LtZDJPFnPCFyJTdGvaLXRE1WO4xh01heKzOHTrLjExLuk2424FpCqLzTlAXCN94vBz7TaTsNjtI5AIfWp72g15Q0o5CgAUKJSUVAERpBVK1Kq73/aIoAFChQoAFB+IzUtMtyYy+HtSZMy6NPEBkWeaESq4VV0VaolE03U84AhQAKFChQAKJRacJknkbLLBUEjpoirWiKvjov0iKHXFZbdp4QAK3cuhsKFAAoUKFAAoUKFAAoUKFAAoUEuyxtSzEwRNEL11oo4iklq01RNR+fGBoAFChQoAFCieYYflpk5eZacZebJRMHBUSFU4oqLwVPCIIAFChRI2Iqh3HbQdN2tV8PL1gAjh5gQLveCL9Y5DYAOktYe6KifaFdEXRa8Ur9YjiUTFGjHKElKlD1qNPCACKFChQAKFChQASqQ5Ajlpcirv668P0/nDIRiQmokNqpxSODABs/Z/i85skv8ASaUN1iYuJuXNN3gK3UX1IUjMMMzeIOkIITqgBulryTUli52pDo0vLYW2ite75cG5gTPVX3N89PLh/DFfsw3Kni7CYh0noF49K6PRHMqu9bXS6nCukZ+2NZ8KAy1mdc4RgHNQizw/HJ3D0mm2HGcmYlylDbWXAqtEqKttybq7qbyb3nD9s5jCHNoZtvAM33S08QyWYlCyk7N34l5rzWKOL7o1I7Z0ES3QofZ2ritVE4a6xFDEd5x2kcFIu5ZjobMpNorL8y/cuSY3CI8EuTxrqieSQfAfIBvyzyD90aJ+v6afSISdopWcxt+UG4xLyjD6NyWIJNjlATi2K3Rxe0GvatXnziDD5B+cCZdbAsuWazXjpWwaomvzVEis7QK15Imxbsq9ma9iifWIbuz5QiUuz4RYSkp9jfeeYmStoImI9WBL8RenKJAZLAjpm+87c920u5+q+MCmC23IO74xYbPy6YhjsrJLNyksL7uWsxOOWNBXS415IkAv7p5eZfYq6p2ePFIrKNhWncfOPTE445OzLiuuOHvmS6qtOcDQVKzRy7b7djbgvBYSGNfRU808YHs7O8Ov5REFSaf2ft4G/POs7TTr8phStkuYy1mEj9pZe74KWi05Rm3kJozZ8C1hziNipiLl1vZUU0Lz14QwRJ15B7xfKJWOqZ9ls/TC+jjdqkKOLaPjSsSTTKsPEy4okQ8wNCH5KkMaMmjFwVGv7qF+SxIw3LFLPm5MkDwW5IZVyHrvVWu7RNeC18osgGhRPluC2LjjJZd1K0pVeNK+kPFA6GXV7603q+cOBDJZxxp4HGysJCS0/CkWOMzT5NyoEb2WDa7xUqpqtSXT8XjrArDBPnlMM9YP4vDiuvj4RNjTzbk9wc0+9bOiWud5Bpyrwh7B4A/2N3+9Ya8gbuXcu7v1+LnCNKj6UrrEd2/dCkUDgEju3uylYnbtaEG5hvq3LTU0Tft14ViPtsgNo8V9YdNneY9YRUFO1DGD89I9J9lOy2BYy1ih7R4szgoysicw0rvamSTstindVV5r8o88Ycyq7gkVF7etPTzgvp5BhbktrmPmJOH+EeCRk6M8dM2NKbKk3aLjMbezZ8vhDcEOQonJIAjpRyLIkUEsmyksbbjHWEY2u1XcRK1SnOv8ojbMmjEh7QLXx1hrhk4ZOFqSrVYYhODYVt1YaK0jkOsL4eMIBQVMtsttDaDm/vgZEnY4cE51rAwhW1B3iXlBkoyKqqzmaksFULLpddatBSvnx8oPkfwDjaCiXbpqv+UdnJg5qZN9xBQjKq2pSJBmbMOclejt1cdFzN7yUQktTyWv5QLAAlT5x0kt3SG0o4qRb4LguI4nJ4jiMnLg5L4bL58244YiDYKSAnHtKqloiVVflBM23CIvsDYW3V7PK0Rb1vPsj4eq+CRJiZS5TQzLAvlLVS1HjRXCHncqeK3RGjkpKoOR9oc7+aG4K+SV19V+kBFvQxEk27nzTr1ll5qtPDygmWa6W0tXLBaBeOqXck+fCGrJPBKhMqNRXW3nb4r4IsC3Fr3RXlE2KhjrZWV+Ll5LGqKUlpnBm5gXZg5vsyjTYVHxO9VXdpvKnGsZ/KaPDAVq9Xb1zKglqcLaF9dItpVZP+jL7LiTL85uutDZ1bYgVFWtd6okVfCkZ1IuaUtJBMLw2YV5tUfbazWXlDf42gtwLTgqp+sHN4k1JbMBgTUhLG9PGD0zMmFzga7gB8OmqrzuitwM83FJRrr9+ab/ALO3e5RdFtHvF4JzWDJ+clpLHp96TTpLaI4xJG41ZudgXLeRIPLkXpBOs6lLNlupV4xN9OxSYm9etcItVrpygFI7zhc41iLGEzebnIcqUXxh45WSd12ZpZqlPOsRQCFChQoACJGZck5tuZaFojbWqI60Lgr6iSUVIHhQoAFChQoAFChQoAFChQoAFCiRpw2XgdbK0wVCFU5KmqLHDUjNTLeVdVgAZChQoAFChQoAFChQoAFCiRsyAxIaXIqLwr+UdccJ10nC7RqqrRKJr5JABFChQoAFChQoAJHDceMnHTIzNaqRLVVXxVYjhQoAFHRiVxs2kbJbd8apQkL604L5LEMAChwjcaD4w2FAA4ktWkNhRKFthFmWmlLUpWvjrypABJWT6B2X+mZvG5MvLp4UrdXnWlIGhQXIvSjWf0qT6TeyQN9YoZZrwPTjTwXRYABIe0dhiVolQkWi8F8l8oZCgAkecveI7RG4lW0eCeSeUW+x7JnjTUyFn2O6Z3wvC4EuESTwIkEfnFKsafZ3Pl8LtaccZcxGYAUt77YLw86mo/MYltikjUlYwTFsfcYVlu+YxCZdcN11aJupU3CXuilxKq8oF2lm5JpsMKwnWXl912Z/+6P40TujTgnzXVY9V2x2g2Wwj2VS+y8kOZtCDxBOTYJ1aAu9kJ/Fx8x8I8Ld1O6lKxz8O7VLzMWiDq4hFpWiJvM7jY6NtyXJDIUdRxiiRvt/hXjpXSI4ka48aV0igDsKlRmZ5EuCwVqKOV6wuQacyXSJcefsnXWkYFh28s4A7IlXsj5JwgvGhkGsFw5qRZbzQDOmXt6+8+y3XgqCI1SiJ2l4xQF+9WISfJTR9JLKy7s3MtS7KXuumgiPmvCLN6anXcLHAJdlAZYdN6YsW7NcTS8l8ETRNafWJcCwLpUm5ik6+LMmyaAo5oi64S8BEV11+JEVE5wXMp0gejMFJYbJICnQDJeHxlS4lXgnKsUiZz9hM2MAmG4bfLkvRr3B6w3XjsaBtPz1XT9IAeeOYOYbYcyJa5XsnNVAqnwoq6qlaJzpEc7PE+ItiNjY925SqvitYHFtw7bWyWv5w3xjtEt53E0044vVjcukN/hg5hcoc2SceSYbtO4dKFXlTXTxi32e2exPaZXUwfDX5qZalzN5tltV3R7/APnGTPC6tsapTl5xXczEWkrjEzJ4POYXKEgS+IC30q4BUisJSS0qVFK8kXWmsD4hLOSbjksXdXVfFfLyiFkGyMUcesHXWirSHeGgi0rNiCJcssnN7l1v84jKJiYcC/N6shATtPRVRaUp8lrFCISjkKFAIlzXcnKzCy63WV0r40i3YKdHBOjZrLkt982ypa5hKoXJ5pasUkGYdMuS84w6lDJtahXet86eS6wpgpZ9k0k9KNyzrb7JOOdwvhpX9VtgFm03d7zh77hEbq5l1xr6r5xxlu961twU0XU1t5RTEkRJChQqfnCA0GxOJYbgmPe8MXwhnGZVppxFlHHCAHDIVQaqmuirXTwiimDIz3iuhi8YklyG+xwrWyohlbVUSvKFjrcrLSwwY4Xb3o6UMiyRQ6Gw5V7PlEgKGw4VtW7jDYAFDoQJVYKmXym7EXLAGG7A3UHdRVXlxXXjxgGLC2TmJ5hgX2WM1wW73TsEa6VVeSeKw2cBWpkpfjlkorvoqVTjRU5QOtK7sTg2HRjeUlQh3U81X/SEEeiJwyO1C7qUiSXedazMs7BcHLP91eUdkWCmpxqXbJsCcNBQjK0dfFeUTuSb7MvnTG6zmk32k7Y8dK1+cP4FruPcw/LlJVxHUempmpCw3vKA8lLzXw8IiN59qXKTcfcyzo4rYnu3U0qnki/KH4piRTpS1JaWl+jsAwmQ3Zfb3y8TXmvOAyVXF7xOKq1rCj5HNvBGMKsTq2OVUC/714J8qL84cwAZnWCXD8/nyixE7KTM4rTBZjvAG+8XkKf5RqNn9jcd2jw6cnMLwKYmZPDATpz0uFaJ8RVXjy08K0jJuTNo0b7Xx14f78Yt8H2qxjAWH2cIxibbbnpYmJwAJQFwC7QL4+sZ1b/QXSx+sFmJbMnMovszYl2S4Np6cV8YO2Hm5kcf6E05cMzLTEmKWXoouASURPNYqGp2fYcObYcNhVQmlINO0lCT5pE+xzysbVYW8ldybaXT99IlouslpMQ8EeDPTUvMhMyLuROybozDBh95eJJSi+VKxrZ3Zed2gkJ+bwBkcVmGhLFpgJdxHn2ZY1ot4prUS3lRK2oVVjKdHFjaNxhwiYBubJsz/u96lflBWzM7O4TtFdhGJvykxvNMzTJk0Ve75pVUT6wT8CibRqUMcj0PGsDltoNlm9o5BLMWaAjn2R+7m0TtOh8Do99rw3w3a088ikbIl0xHBah7w3D9IZChRRA6m7+sNhRILbhMk4IkrYKiEXJFWtP0X6QARxMw+6yjmWVuYCgfmK0qn5RDCgAUKFCgALk5xyVZmWhbZIZhrKPMaE1FLkWoqqVEqjxTWlU4LAkKFAAoUKFAAoUKFAAoUKFABI4QkdwiIcNEr4ecRwoUAChQoUAChRPOTL83Mk/MOKbhUqS+SIifkiRBAAoIlHkZfF0mGn7a7jqKorVFTWipw4wPCgAUKFCgAUP7na18Ic6YmoqLYBQUTSuvmtV4xFAAoUTNNk4B0EysG7Qa6V1VfBNeMQwAd4RyFHawASPAIHaLouaJvDWnDzTlEUKCZYJYxeV94mlRpVbo3dcdUoPFKJx18uEAA0KFCgAUPJB0tKvjpwjm7bWusNgAckekYpMymBYFh85LMWTgYcMtJ5vduIlcmR/EREYh4IN3wxj9kGpYtoJR3EJQpuTYdFx9hFtzRRfu68rloPzgna2dm8YnH8SfmWzBt3KAMzRPwtj/AHY8E8qRm8ZTEeDVJwjLyUjjtQIS50X5/wDaGy2Rnh0i5Gbt+zUqeUMRd1d2HMOk0dw2/MUL9Y0M9zjx3nujaPJI7emTl5Y1urfz9IWaXWdnf46eddPCGtgRnaPaWADojXhx8ILmuhEzLdEz8wWvtKuqNt9y9lE5Ut484kwmVmHptsmWmys4q5oA/iJV0ROesaWXk5CRnDxE0YxqzfOYfDLlb/witFc/JPKJlur2OF0vsZ2TwrEp9nObaMZa+maWgV8vFfSNDJYJhzLTbcz1Ot7s466Kk2OvZaqiFVacVVYKxH2jYl1XQuhMF0N2SmDaltHWXO03au6g6D2USMbOYlMzJVLLHnuAiRslt3M39IbzAcKlDxVqbxcLm5fKtIGc6WcqfbeKugeNOPCKP2gvYizis5JTMhLSbSTJ70rL5QOfu/h5okUMp055mZcamMsWQvPrrK60oic18kgR0lJd4iP+KsW9VZ7SVpt5C8IPCwnv6yZmHpa1d1o7Cu5cl0ry/OIX5mvVs3A1w/Eqef8AlAycYtJGTbdkHXM9lt3tWHxsT4fFVXl4JHPbU2y0AGXXGXKtEolGt2I24x7ZM5mZwifclpl+WNsz/wCWqUt+cZWYcWgt3aBrTz9ecQEdxqRc4VSmr6MVSqsmqhM/NdKeV23j3fD5xwElCk3SJXBmBUMsBGoqmtyqtdOVIGTjBM6MoKNJKuPOLYmYRpRLvw+XLWDG2hOWWsgkSCXau1qkRwWso64kw5KtvPy8vRXHRbWg1WiKXw1XTWKFAJCh5kRmpF2ljkAhzK0eDcv1Td8fKLVvPR0saYcak75kkbBstQqlVonG1EWlYBkBG50i7SNrZ+8un86/KCSuCQP/AJdEReHFfzilXIJbEr3Le7DpfLo5mU7G76xHDYmdQgUOhdyGwAKHQ2FABYYpPpPlLfZJSWyJYGOoaszLU7ZeJrzWAV4w1IKw+ZSVn2ZgmgfFsxMmz7Joi1tXyXhCtbYq951B4cu9vbqUp84sdop9jGMcnsUYkJLC233VcCTlhJGmq9wEWtETzWKtYIFO+glWJWWXXitZbJwqKVBSuiJVV+SREMSsvutXo24QZg2nTSory9IYHFESPq7rfOH3tkY5g9WKdzSvnrDBdIGibHsnSvyhkV8CFBuLB0d4ZPmym/zqa6r/AJfKO4VLi6b0w59zLtq4frwFPmVIUpIuv3PONu5YDmnaCqtnMvJPNdIj6vsVspCBiybRtkQONrW8fHilPSGvzDjpmuu/2q6qvqsRGvdieSUxeuRsTrVN8EJNUpz0r4L4xf2I+5JhDjTGJMzD8o1NsslebLpkImKclUVRfprEBEOYfVW3dkfhg53EEDCfdbUtLUQ1I3xDrD/Cq+CQBbVonFLeqkT8lfBKTWS+43cLuWtLgPd9UiF1wnF7RFDIRLXuxQiUUEmPvLSRUoFva8VrHZZrNcFviRlTzrCl5cn7QZ33jOiBBINyI4eVzjxzxPIANCO6Ic7vNVpSnnEDgIxuVfkUYkumMPibQTJAyd6NkY6oX4kTj4QBJuiEzLLb2HUVV4V1SCpon2ZigO2u5Ktnyp4jACNktq/HX8ole0tu7QuNqTaa2mxcWQtZcmDUN+5RqVU3ucOmGpedxKSmZJzIbfy0eN3stO8D+Wl3jRYj2tZbTaN9tlzNQ0AhpzUgFafVaROzgpf0YcxFHftCmpNNNvgqiALa5e32xWpBRV4pdC+mCseuYHbO467s7tWmISiMTjDUwp5RhRt8UL4eWnDwi59pWz+F3/0k2VFz3LM2mcuab8kZ6oJfgXulw5RhWu3Hq/sNxVpraTIxZrpcu5JPS8uzM78u8ttcg/iEk4JxRaKkRU/D648FUuvok8mhRrNsdnVlpiYn8NkX2sPU/ujqRStf2Zr5cEJe0nnGUJCGNUeHi8GTpKTaRsKFCiiB5qOlo0011rVYbwjkKABQolZMQeAybFwUJFUCrRfJaRJPPNPzj7zMs3KtuGRAy2pKLaKtUFFVVWicNVrAANChQoALHFsIxDCmZF2el8kZ+WGalt8SzGlIhQtF01EtF18orocn70NgA7SOQoUAChQ9barbd5QyABQoUKABQoUKABQoUKABQoeNlq9q7lDIAFChQoAFChQoAJG3XW7kbcIbxtWi0qngvlEcKFAAoUKFAB1UpHIcREXaWOgBEhW8hqvpAAyFCh9pWXd2tIAJ2pl1ll9ltRsfFBOoIq0QkVKKqaaonCBqwliaUZV95A5cV9ILDvc0bDwYTsvMybx5c1M5cw1YG8taoKEXdoCkVPEhjNuHcADlolv5wfjrrPvBOjKrmXS8y3sxzvL6V0RPBIFYesUMxx1Mu5W7eRcuPnCtYeVwa6ODHSKp3RPIysxOzTUtKNE9MOmgNthqRF5QxDZUmAmBKZaJ1rvAJ2qvzpG82D2PaexJG9oZ1jDc+TcfbZfeFoiERuS4i+7u5d4uSc4oTZY2dcJp5lubxEvFLm2v3fiXz4eFYqp6emZlzMfNwntb79f15+fGIdc16ZsWkwjdUXD8YnW3nsiUJmWlQ7ADXT/Xz4wLKYTiOIk50GSdmckMxxQ13a0qvhATDGaDpZrYq2N1pFS708V8oJGUfkzHp/SZNt5tHAq2SK6C9khRaVReS8I2W21jFvZFiUm/h8+/JzbDktMMnYbR8RXmixAZJu9WI0T/ABecWzWNqxgE9hbUtLOJPOtm887LiboWcLHF3hrXWnGKwGXHG3XBRLW0RT3k5rT56xFy7EKfSGx1FpHIBE0uIm7vdjvekaF7EAZ2fewaekHCMrZiRcbcQcojtrclFuFQHRNKLrEOGngjLMs3iUtMaXuTBtHq9puNppu+a+cBOkhtNMTDbaKdXUdDeO1Uog0r4p66xJdv3K+g/wC/GOXblsG4jLtyroSlwE4H3rgrVKry+X61gXeDNttUex+ddPpDibkytiGFEjYoor8XKCJEmmTznSHMZtcabJu8XFqm6WvCkMB4yuSEtMzSJ0d2pCguJcSCVFTStvzSOM4jOSrM3KSs2+1LTdBfaE1QXRErhQk50XXWBXTU3CJbUqqrolE+kRwrBf0TMNq4RChCO6q75U4JX6xDE8qoo7aRWie6RUrRF50iNwFA7f8AawxGg2Qx1MDn5F+bw+WxOQanW5t6Qf8Au5jLrQC8luKBdoZxzFJmZxTIGWbmJkyFlkFFpq7esHlRK0RPBIFk5F+amSl5ZsniACNbOSCNSX5QpqbQ5CXlG0tbb3jTXfNVXeVK04UTTwissVsvnceN9/BADJXt5m6Jjdy7Kf8AaIYcKjXf8Ibpb5xIDYUKJWzJBcFEHfTWqeGunhwgERQoIay7TUrt3sknjyiPdRUVNdNa+MK47DBjkOhsMR1YKRnNlDmasALVg2X0Iq11ROK8NVgSFAAokp1eZ8o4SXHuxxbYqPYHOEPDd3obFjgGGTGNY3KYVLmy27MuC2JulaA15kvJEgvjF5C2U2gKxSQn8Gw6QCbR1j3nLjOoG7Rxm5UbLTXVULRfKB3sbxN119xZs6v6O0/aeqc004cIUyDRuznTZ0s5gRBgLFLNoqIiV7qIOsCSgdc3c7lVOl/w/i+UQsZFtOJxoQNnLFkifI0tK7l6fzhxm2G62P8Aj/3+cHK03hkzabrT5NmvYo43pw8ir9ICdsBsx3kdU+zRNB9fGvKNtjI7PsdGnMm37tBu3hLki8U0iAyU7W/D9YVvU3V4L9YaAEV3lqsQUccAmzIS5aRJNOZrpFlttcN0BtTh4RxUbqOXd518YdMuZh1yxD04fnBiI40pZXajjhDfdb/1c/GGtdvtW+sTAzct1pZe7f8AhrAMfJg7NZrQhmOfeeenH8ogUiA6cLapE5EMriJdCdcJsT6ozBBJRrotNaLDWRacmjz3ssd5bqV1pp9VjMvwWO2Ky3vxVlEcQOjsVv5Hkhd+cRbPy0ziOJMSUtmLMTLmUlnaJT0T11h21rYs4/MNDOS84IoHXS9bC3B4V104eqQ7CMWHDnsMnZWUAJqQmc43b167eFRRfClFTTxifo0KmfxNfZMk3hs3KMS84x0abaVRcmVqV+9pVE4IiaKmqrxjXbM+zParFJSdxDZxZbE2ZOx4egTSOZmvaHmJjxoSCsYDHXgmcanH22OjNvPm4DXGwSKqD8kWJdnscxbZ7FAxDB8Sm5Cab7L0s6oF9U4p5LCeGlekFlYbU9dxTaXHsF2jl9rcWa/rmaAZbF8Nmmb25gMumZXULTolQXVC8lgza/2YYJtNs+ztbsA7KNOP/wBpwEpgc1s/+SNblT/lrqnJVjISvtWx08RdmseZZnHn5cftEv8AZ3FNOy6ViWmvJapr6x6Nsr7ZMCk5xjEg6FKTTTRZvTcPo+e72AmGUoVV/vA9VjhdayWxg7kak98pPnSelXJZ0gPlA0fSmEYDs77YZ/oGITDErtXMdYzicnYPSB/58utt377a3eseWe0j2W7TbEY25h+LSXV3qjU2zUmXf4u76FRY6afEr2tuctTh2jVdYPPoXODsQkJmTW10fOBENcrLoOpItaa/X5x0w0NF4MJWV0kjhQoUMkUOiWXBo0czXsq0FUNxSuLSg+VddfKIIAFChQoAFDobBkriM7KyE3IsTBhLzggkw2nBxBK4a+i6wACw2FCgAUKFCgAUKFCgAUKFCgAcKqJXDyiSamHpuZcmX3FcdcJSMl5qvFYhhQAKFChQAKFDruHlDYAC3GJYcOaeGbEpgnDE5ewkVsURKEpUotVVdE1S3zSBIlbacduy2ycsRSKiKtETiq05ecRQQORQ6GwoBChQodAA2HQ2FAB1It5WVeYwh2f7N3C8FS4bqVFee9x9IqRRSW1OKxb48E/I/wBTzmcDknuG0dUsXjSi+aksHkfgqIleIctoMttLU7ScSr4+kOkmXHnbG8u6wi36JwFVXj5RyTlnZx7KbTlUl5CKcVXySAQ1lp19clltTLyizefZwlDlZI23ZrvzYLw/CH+fOI5l0pKXWWk6i0+G89wJ0a09UGqcOcVzAtkdHHLB8baw7gTTMzNPkyT0w46TQCDdx3WiPAU8KeEQkt/jdz1rWCpjDp2VAnJmWdYQbdHRtXVKpRF1XTWOs4g6zh0xJNg1bMKOYatopqiaoKLySvhxiR/cNwLEsNwl9157CZbF82UNlGpu5AacIaZg2kiqo8UrpXlFZNTczNEBTMw8+QALYK4alQBSiCleSckgeCp+UOTeRonWHagJXMneOqVpVOaV1SKlhWBIcnP/AChQ9l1xq7LJRvFQLzReKQhjImlJc3y3acuPDVaJ+cQDF87KTEhhspeyYdKucHcrmUW3TyRdPWsOBHNrpMMPxuaw/wDaytrZ2TIzAKaJvkhju0rwpAEqotAc26Tman3Fvx+PokcZR/Jdab+7Mb3eW6P+v5wPMmLjxE23YHIeNEhN6KX2OaAphxAzRFNaXrSNBjuyGM4VsthW0k7J5GF4rf0SYvHrFb3TRErXQoo5EBRxX3vum+KfF4D84sZrGpudwxiTmFV2VliMhbrut3KnZ+GMmyvFjVMcZy3KpqYdYW6XImlsICUV4oui/VIHiaZEUcq3dlL2L+NIRKLpmRWhxXRNPSNTEhhR1VrHfDnAI5F3hEss6y0EsjfS5fMmFuTRGgG7Xx4aJ5xTuAoLaWhJyiSRN0JtomCseQ0sKtKLCmLwUs4zqNJ2795SVVP1hgjcaDw9Y7uoYVG7xThDd27yhkjnkQHiFCErVpcHBfNIjhQoAFDobHRSsAFrjkhKYe1IDK4o1PFMSoPzAABD0dxVXqlrxVEotU01iqWJXEcaJxsqoXA0X1iKFA21k6CVK2OLBEpLnMGQDaNoEaqa0SiJX/T5xAdvdhhYUKGwoBEyN9STmYNaolnNf9IipHU1g2RlH3/u2/K/kkaU0l5JZrESAIS+aVCvqgjXUeGsGtKzISHWywnNvWuAp13G/T8XH0TzgOYT7Rl9oG+fkkcnplyadJ15bnCXj/vkkTV1bHwXTm0ZEBqRHUuKwWwCqbTO6OYabx7vlqvJIFIbbS8Y6n4t6sUpDBsxMTLCTOGtTLZS96ZmUVQcsrateaeEAd+F/wCmHuuXKVo2IvKEUOmnymXsxz4UFPREokRtm40e7ulHWMtXgzCtCu8tK0T0jrtozBZBLahbi8F8liAJXW3GDFl3nQt2i8fBYjJ0hRxttbRLtedIjHtXfnCt3borwAmwU1iaacI3U/AKBxu4QwHnAaNkSoB0vTxpEfe3YACWnrXmM4M1tru3W6VrxhkyP2jtCdfgWsET7ks5KSwsSzbJNhR0xIlV0lqty10TwommkDuqz1WXdcnbXlx0p8ogr4O4ktZ95fxrHJlGleLo4uZS9i/VfyhjuvWfEqwwd0kggUyWWLKUxLS070hx8ssWnKt2o2opQRr3t1OMBONiI7rl/pyi4w+aUwk8Ofm2mZJ8FbM3mrhZUj1Oia1Sia8YpHgVt0my5LEqU3sjguXJjo7+aTl1nVWInauTj4JSvDnETdq9Xu1Km+WlscVpwN63drS/u/XhFE7GklcSYZlMPymX5Wclg++zlXN3rgMfgVOGnrxj1DYz2sbTbM7VEGM4p7+w87GJtmZIZpp5pPhJfJdFjxBuZUGcvLHWuvl6RebNS7E4IyzkyxKFvmRzJ2tKIjW2qJVFWlE8VVI5a1GJ1k6qVabxY9t9rmG+zXbx12d9nWItYPP32DhE6mS1N/jZPsgte4Wi+UfPWMYbP4TiT+HYlKPSk0wdrrLwWkK+aLFtLSM+DbOIMPN5LjzjbbWbU0tFCVCHjRU58F1jRzOPYPjmA9Gx/OmZhssmTyd5+VG2twkvbarplFqPdVOEOl+HpuFXr30k85rHIMnpGYlLM5skbcqrTlFtcRFpVIDjqOWYsKFCh4gRIVvJKrAIZChQ40HulWABsKFCgAUO8qaxwo6iqi6QAOcAmzUSEhIVoqLoqLEcSvOuTDxvPOG46aqRma1UlXiqqvFYigAUKFCgAUKFCgAUKFCgAUKFCgAUKFCgAssExjEsFmHZjC5tyVdel3Jdwg7zZjaQr4oqLAZMOCy2+QKjZqqCvjSlf1iJEjsFvI7+BsKFCgEKFCiRs7HBIbVp4pVPosADCSkchQoADsKlzmZtaN5oNATriVpuDquvKCtosTDFJpiYGS6M4jIi4ucbuaSaXb6qqelaRNhco2Oz85PuzLjTxnkMAP7Sm8d2qKidnXWLeT2cfxDFGmpBj7K3JNq+841fqY8k5mq9lOMZ5Rkaws4mbwrDZifepL9lsbnnS0BofEl/3WCcUOXlbZKRccbbMEzyXtFzS6n1pFrtK+xhcv7kkFp/fa1ovmveLxXgiaJAGIhJrLYcQ4d0CjFrz15OdJJFWrgoXqiUTd0i2nEhVyAcQm3MVmmsuUZasaBlttkKaCn5rzVViSYlJOSl69NbfnUPVlsL20GnM+CrXklU84bOzrCs9GkGEZH9o6S1cd/kKeSfnFZxhWHeILDGsYxTGpluaxaeenHm2QYA3SuJGwGgj6ImkV4rSH0bUCVSVC5JTjHUaJWVdEStRaGVNErwiiQosPcHBgxTOllaN8mMrOHNRUFCqocUFa8eFUWIxmagjJDRrnb8XxesDQu9CsGVtjpBQ7e16Qme2n+dIscNlMSxyfl8Pw+WV+bNMtlpkUQj8vPSBFbK9G3urs4/9ouFkUzAdgzUo9P503mMSYn2hS+z/OifVaQsRxBycn7xfcBsNxr/AJYJwTy08INQTXZl3NbyJNo+qK3eddLukvpr5JFKwDlh2jxH6c1hroKR6zRJKHLt0tcVLtNaJwSvhzgREUlokKCZEWCcseJAv0EyraC+K01iCtwctN36xy7ctjgpVYQpWACwYSUSUVp7KJ56hA9eXU0rUVGlFr+UBOrcarbZ5Q0lrrEwsq5vVEQrbeuicIQbkApFlgOKPYHjEnikoLJzMnMA+1mgjgVFa0IV0JKxXIu7SkKHMXHE22LDHpxcSxOaxJxRz5qYcdcAG7BRSK7RE4Jrw5QCI7l3hHXhQXe1dE0k5LszwuvMdIZBfulKl3giqkKNgbVtSzw12RxrFsMlscnUw6TZZyXpsGlcKwblTdTitKCnyipey1eqKWB4eH+sdJLBIUt0iAorHEnK51wyM1ItVWGQoncaEWWnM1slO6oJxGnj6wgIax2JphWDmPs7ZA3RN0yrrTXWGNghCa5gjaNaLz14JBfQdtRkSvC2DvUuq6O7qoW601SnkunnEEKAQU6BONOTfVhe4qWDp5rRPBNIFiQjuARtFKV15r6xHAAoUP7B9nhHXUo6qIQl5pwgAaiRtdkdtsQ2ZwDGsAkG2Fl8bYGXm72UM6Ivcr2V84xYaLB0n9lycRebbdHN0ZJe1TivpyjVavLjTcWGek7Dpuwky5e0nL6mfxEq0QR8kiN6VWSmjYnbm3m1oYJqSEn5RA8+4ZvEv7Vbl+tYhjKCp+CxmW0JGB94i+GQhr2uqVaqrevP00WsBOhYCb3a1p/n5xO0EzLyzc8LfVZlAP8AGNF/KIH3XH5hx94r3DJSJfFVgiAmbiLcs3d7j/lWI+0e9zhRIy3mcF+XFV8aQ5ERonGFHStv3ezDVWH4AlNh4Gm3ibIW3a2F8VONI6GX1a9v4w4fnDCU9BK7d5eEMRYUAdJYmlukdtm7qusWidmnOCm2JBnKWbcdcUwIiBhR3dNze1TjxSmkRMvPZPQmt4XSRbaa3cPnE3Haw8ZfMkSfVxrvcTS7TVdPOsRhLOtE0T7JALjauN36IQ66p80iB5pxpw2nEtICVCTzSLOURjoDxuP3vJLEmU4HZqaUtX0VVhDiLlcQl0feHsqi/X/tD5+aenJlX36XEiJolERESiIieiRCWrfpCAKgZVpbDF8HbHMrNsXLrStNK+EFYrMjOZMx+3ULXvNU4F80p9I7LiwWFv5s6QPXjlsWaFxqSrwSkA8IXke0DYs8KxJyUbfZypR4H2lb69kXLK94a9kvxJrFfXtcqw1YoV7Gq2TXYvos3KbSy+LBOOEKSkzKviLbPjmCoqpfKNBNbKYJLYq+1hu1+B4ph8s63eYTfRnHQWhFl5qUKnCvinCPO0JvJ7PWePKn+cR0LtRnKX8mkNEeD6qx32Vezqe2JDF9hdrJ3EMqabbm+kOs9Rd8Y7q3caU4xl//AIBuPqWIyW0TDeFOP9HlJ6ZlnGRedTi2XHLpyNd1fGPCWJ+ZalHGM3qHVS9uvGnDTy8YvME2txvDsOSWwjEJ+SeZMncxmbMEt8La0/KOTkVV7WOqK1Ju6D0Pan2We0RuZ9zOSjuNyanmN+73gmKclcAUW6tOOm9+ceW7Y7OzmzONvYbN79moO2EKGPjRURUXkqLqi6Rrdnvazj+G45LYxiUtJYpNNHmA8Qqy/Xh941RfqiwBtNj5bb47M4pjGLvE/MnefTDqQ0TS00SmiaUWlfWNaXNXv2M6vKmOjcwsKCJyWclXlad+RciTkqL4QPHUcg6GwoUAChQoUAHU48KwijkKABQoUKABQoUKABQoUKABQoUKABQoUKABwrou7X+UNhQoAFChQoAJMxzJyLuruvt5VpSsRwoUAChQoUACjsSy8u9MnlstkZeUbLB9npKSwd7E8WcYBxHQbDOLcG7jRvturT0FPFYdr7AOkNlXXHJNcQ6RLSuSG5l9a+Rby2V5ajvcPCsfQ8xjfs32Z9jjsh0BP6RMEUvbJPbwKY63Ofu7qrxrHz9im3Qug7JZcxiEujGW0887Y4p90i4qQD3QqiRmZV6exKcy27uZmXG0R1Ul8kTWOXiKOf5HVw9XDWPIaZYSOLhMzco63I37zTLtztE8FLRPVU+UVeO4pM4tPFMzJLwtHWtBTgNfKJMexFqbftkmMiUaAWgHvHTvl+JVqv8A2iqjWmnljOpU+lRsOhsOG27ejQxGw6CsSclHZ992RacYl1OrYOEhEKeaoiJ+UDAuvZvhwBKyzcrSvXNMkdquWVp4+tPCGuD3rr9aef0iWcfOZU3AbFiXzFIWQLdBV8EVa8oH9PnDAmlh+0h1mWnxLpGnLEpbE8KkpaelpZr3aGRLvMyyIT1zimRv946cEjNy4NuoIiTl/f8AC3T/AFieZclwDqHHBLK1CzvV8fTWsafSR5HJM5+ItZgkbIHdleK/6/pAUyd518awUZuPos08n3lrYLoPBKcvKAXlqXppEz2j8jYc4dwhuiNBppz15xwVIUWnPRYmdbDo7LzauUWondTteXlSkZlkETtApO3y93VihGXGnBFX0qsD92OQATZTi1tS6hW6eMFTEyT+Hy0oTjNssJqPUoJVItUUkSpfPhCZwuddw9yfFrqGwUyOqcEIRX8yGAIW49jkKFChkhSy7gySTRW5Zmrab6VqlFXTjTXjHWmrD64bbxRU9FgcYsJiaGZlDJ9rNm3nkM5sjLT8FOHnWKXQJ1B33xzj/aN3Lx/KBeEIo6KXQmm4RArS8I7eVmXXStfnHIbCGdSLLD5yWYwnEpV6QYfemQbyXzUr2FE0VVGmm8mi15RXoooJXIteXlHOEKYuETYbBclIzc7ndFYN3IZJ921OyA8SXySBIlB0gbMRXtpRfSHPwEW8kUPD9OXjDxRtW9Coe9ddwpyp58YhgEKJ3EPOyytqm7uU/lHGGxcO1XLdF5V15J84a20448jIjvqtKecAE6Sroqzntky24NyGqcRrRV+qRC7ary5dbO7d4Q58i0bc1IN2tawwFHeuGunprCGNiRp1xpHRFaXhaXp4Q5plck5i8RFtRTtby18PGkQwwFDrrezBb0ogTL7klfOScuaddlkKWqulU7tYEeO86w76CsRxPLvPyrwPS7ptOd0wWi/lEEOggCWYmHpjLziUstsWw8hTgkRQoJZaljkXjV5zpQmNjaN7qhRbiUq6U3dKc4JkIgFpBYSc1TRm5VIm7OJVRKru8dEgTWJimpk5hZgn3SeX9pet31haj0IiX6QRL9WJOOS+aJAQhxShePyhxSjnR83LIaBmLfQd1VoipXVdfCI3HHbG26WUT0rXnCDYJV6SbwvLBrNm3l3zMfuqLpaqLrcnGqekRVJqT3f2+i/wr/2hrDKk048jzYZVFopUVarTd8V5xotppfAmsFwR7D35t2cdkVdxFDpaD5OnRB8rLV9YhptY1RcomSrfxFmZ2dlMICQlmnpeYcdKZAesfQ0HdJfAbdP3iiniQQVal3UpX5x2ZRsZgxaKraEtq+UXGhlOo5VvyxbbpYP15qsNfaJk7SgnCHnZaebmG22HCDuvAhjrpqi6LxiCcecfmCdeK5wu16wx+BpNOC2LhNkgnW1eS04w2lq2lElj3RMy08m+le7dT9aRES3QCO1VEtrxpE7bxXq5dc4Vb7+ySQMSUiVssveoJ1qlFThCkIDcQlpVJZiZkpgVB7tsqW+yacl8UXkv1it0iy2cw9rFcXakXsUk8MBxDrMzZELQUFV3lRFXWlE04qkAkra2btKdrzggc66hDoG3hrVzjNDcLcr1gUROKcURa/OkOYm3GMKmJZp54OkmOaHcMR1SvmhRBOKHSCy3nHR7pmlFpyhmY5kZGYWXdfbyrwrBYMjqq4bSc6RDDhWCZNyWbzOky2b1RIFDtoa8CXxp4QyQSFCh1PxJAA2CZqXJhtglcZPOazEsNCUUqqUJE4LpwXy8YGhQAKFChQAKFEzzD7QNOOtGAvDe2pDRCSqpVPFKoqfKIYAFChQoAFChQoAFChQoAFChQoAFChQoAFChQoAFChQoAO8oucPwYnMO96TrnRJFDREIu29rRcse9TmvBPyhmBYb0uZAnERGq6XLbd8/BOaxe7b42s1JyGArN9IlZGuUdn3IF+zBNFQe9Reaw8GnWNhZLGk7ke0O0GGMPnKbLyLctL3/ANpUN891E0Ra28K+NVVdOEZV51x95XXnCMi4mW8sPebFpTVmYFxutvgqp6LEEMY7rEDnQ/zpBErNTMqD6S0yrWa2rblq0vEuI+kQIC+m9SsNPtrziNx6wdvLLy7lsrWnnEcKFDEKCi/sYfcqqmq87+CceVIhFLvw0SJpU2G1JX5bNqC2b9tFpx4a+kFgBx5x1y0T3SvH6Qmyp3aw82XEDMt6utL4oCMlI1g8QLcdm2nsgwVsCboKKSDolaU0W2vOArbuz+cFyxv5Gu+w3duuKtiKvFU146coMRXIEdVtrLHn2o5MtONvZbreW5zC2ipDp3ovSS6FnZOlubRC4a8NIYPbuc9YfcGw58+yHIE/OIBSsOP4YaiRMzcY6tB058YkbVxzLZaDrCP/ABKuif784gh4ETZCQ7pJqiwhnTEkpu8f84jiaYPNMnMu25fXXnEcAFpgEi3iU0zKOzrUm2blhvO9kUtVf/b+aRVLxg2SQc50R392o/wqi/okDPBY8Y8aKsTG5U9sEkk207Mg28+DDZcXDFSQdPBNYiZtv3uUJsLkPrBGg19fKCZiU6PKtOOON5jlat98P3k801SKJB2xv+UFYi7mWX1V5BRD4Ig00QUp4JClHJdiWcfXemV0aCm6PiS+fgkBF+9WHe4WsNiRsrFutEuPGG13KW/OGwhHaR2GwoAFD93d8ecOLKsC267W/wAPKkRQAKJFBUaRzd1JU466U5fOI4dAA2JxRno37TOvSnC23n860iCC1lf6uGbz5bVxQyr+s4dpU8POAcEV9iONjaV1N6n6eEPeNb1NX1N3xTwp4xxGbpQnRAtwkvK5KJXhpx5LEJLdAAhS6O0IvxRMwreS4JdruW8VLTj5UrDMyyXyw73a/wAoQDjJk3w7Yt6XacPGiViAo5BbbzAyDjKy1XyMVF7MXdHWo28F9fKGIiZecaBzLeIL90kTvJ5xDElo5tolu+KxHAB3jCrC+UHYU9IMzKuYhJOTbOUaI2D+VvqKoJVouiFRac6U0hxrIEuCDJK66uIOWNgyRgNqqpn3RTTxWq10VBXWKysOIyLtb0MhyBIo0EKiSXfmnlDmAQzp9eCafPnDkf3Ghym+rVV4dryXy/zgicyHM2bBrKF81yW0NCt8a8/SIGDP5wGOZfoKWX/DxTjy1ghhvDTWVRyZfBSuz1y6o38NNar5+HnEU0q99zOO0VvvuolvZ+X5UgeANiSYQRfMRICGq6hWnyrBc2TjWUqpQgs/6RRf5wHLhmvg38RIkWWOh9vmW29+113+EUKn6JEzvBa7TJDjbnSJ7pfVoswKOmgDREJeOnrABdtYcThEAj4Rx37xYqCJ1GxaTuGTYYNLY0ssgScy6bAOXpvuAgqWla95NeEVdNIOweSmcVn2MNl7VeeKxoVWlSXgnzWHI110BQEjqN3iuq0jjZ2KW6K1RU3k/wB6w8EJiYscb3xqlD0osMFSJMu7Tj84BEhy77TLUwbBi07dlmoradNFovOnlEIpcdvjBBzJHJtS5E8SNqVqK7URr8I8tefOBYBDobExG4QN5lbUFUCGuAQ29nVK6QAEJNr0Z9pxhlw3LOtNN8LfhWvPnAcKJGTseErROi8C4L6wANhsFvzbrkmzKko5TJGraWJVLqV1pVeHOBIUDkUKFChiJBt3rruGlPHziOFCgAUKHCNTt/XSGwAdr+UchQoAFChQoAFChQoAFChQoAFChQoAFChQoAFChQoAOxYYNJ9LmesRzo7VCds7Sp8I+a8E/wBIBEVM0EeekarB8zCmXG3t1l6xy8wpcHO2vIuFfD1WHCy2kBeI1kulxbCJTBcQCewRv7QyLkgbQ7zR8ACqr9zTVeZEiLGElMo5nMmycylVcyzU/lWDcSn5ecxEDmc82b6vWGlxfu1SiRUopcotv6SVvPVI5lRra52VgjKzpYnurYaZG3zMvDzX9EgW/hujpBDaTk2Tcq2jjtt1gcfNf84zkuCzxDHGZnZPDsAYwTDpY5R1x96eBuszMkXIzXuinAU058YpBXcKGR0YVguSOgIdk7x5F/pyhrZ2EhUQvJeEcKCCaY6KrwvIJIaAjPEuzqXpWGBCIVDd3i1qlOCeMTSLLb840y86LTalQjJaInziAab29T+cFq0wb7jbL1rCXKBuBvFRNEoNeP0gAKYlcIXBekFPO+8L1DoyhaKjyMXNU05otPJYBmZZ2XUW3gdaK1DtMaaLwVPWEh1k1BZhRsOoN6rWvFfBKUSEUyptELyZpWCLZmS9WickihSEThyotWyzVgGA9o7yuTitaJRF8IryMiglw3p2ZEnTbQioNaIKaJTkkDDAAWxLleqvDY2IZu8naTl9YYSHZmW7x6/KH26NS1Le+58/8kiN96678UC6RMinWbA6rWEKVjsTONtdGExcq4hKhBavDkVeGv8AKJGDwoleQUPdczOGuqfrEZJSACYlI77i3uNKREJEnZiSXecYdFxsrSGJJhsmQRtxpwHDoa3p3VSo09UWAZzD3ujzjTi9lF19F0WI1K1Dbpx8U1/0iNIuMdal87PZQl6U226FNEqqUcTz3vCJnuKjVSrbAiRXLagFLvnD23BvJ50b+NNef+kFPuMjIjKClpBU3FTXMP8AkiJ+dYr1iidhsOHVUHRPOGwoBDo4S1jt27bDYAJSNTAAtDTmiUVfVecRQoe2oiYkQ3D4eMADmnMtS3RKoqm8laV5p5+cRjHIUAE0uw69dlCRWCpHaKraKcVXyhgGYVtKlyUX0jrZkF1pkNyUWnNPCJnUllBjJcK6zrr+CFcvZ8qUgGQglVQfFeekSPg5LTTjV43Nko3AaEnhoqaKnnEbhL2brhHhHFUjIi+sAHKLSsNiZDcQMi4rLrreVfH6RpsK2MxqY2bm9qRkHlwiVo2UyobmcvZD15xDVFTuLSkz9pn5B+ZkJlrEJZTbcaO5lwe6aa1+URuOC6quOEZOFVV4cYY/unl3VQYbVaKnjFE3tocuh273oYPGEUWSTimVY8YtOCd25d8taLVIHhQokBQbhpyzUwefJ9MHKNEC8h3lFaFprurrTygKCGmSNl1xDBMunE6KtVponOACAYkIFDetuCqoha0WIoNlQlHJRwXHHAmrxyeGXbRbrl4ovZpSAZa7JYngWHyWNtYzgXvN6bkSYkXc6zobykio9+KiJSnnFAoL2u74wrhspbveMPbG4DuLsJXjz0SANxOZjKmyVvHXgv5xHD2xaIDvcsUR3N2ty14eURQAF4SjhYlLZfazRp9YmxGacKYePdueDf3fiW5fSG4I5kYiD/8AdIR/QVpA82Vz37oiP0FE/lE26ir2Ugh0Nh1FX5RRBykW2y8sExjTWbMZDLPXvGLiAWWG8Vle/RNE8aRU0iaXYcfU7E7AKa+icYUjjcudu3cKmtrcWnMC6aeEuzbhypzX3tiru300u8YoxQb0r2dKwQ3OTISL0o28SMukCuhyK2ttfSqwMUATqSPMGAA5aWW52CVONNFjgvOCybKFuOEimnpWn6rEqufZ6OCdxlW+uipz/OIm3FbB0fjSkMDrj5kyLNxZIEpACrWirx/SIobHaQATEwYZd1nWDcO+nDXjrpw5xBDolEGTmbM6xpe+Q8PkkAEUdctQ1QVu84dlkt5W7odry1pEUAhQolecN07nNStROyiaIlE/JIRINglmCpLWo0XSkAEUKHgBn2RJdFXTXROMT4dLdMn2JXPYYzTQcyYOxsK8yXknnAALCh7oWGQ3CVFVLhWqL6LDIAO0jkKOqkAHIUKFAAoUKFAAoUKFAAolZbJ14GxtuNURKkgpr4qvCIoUAChQoUAChQomlW1N1EtuSAC12WGWCezZuUSdSwsuWrS8uA/Kv84l2kn3ZxazeJOzMwIi3Z2hAR7IiVaWonBE0gPFZqWJ77EyjO5aap3i5qngPJE8OMVkNfY29eB4m2P7O71hlYn6Q90TommUh5ltqVupTjx+UQwxDYml33GFJWytvAgX0XRYhhRIChRKzlZqZ11nlxhrhXd4lpoNfCABkSBmotRu3PyhorbEzivMOOtudtdDrrzgARJLpLASE5nXLeNu7TSmtfWJJhRyWhWYE7ASywOFVVVEl41T5wyXC+YabbcbuPTrKCKV01Vf1hoMOG8TbTZOqNV3Eromqr6UgGRgBGtoiRemsJvL/aXfKJhMW3gKWcea0S466ovOlOUKaP8A8OD+bLtGWWtKcedPOkAD5Qn3FGWazHW76iCePj5R6SXssxYPZ5/T7o/9XOOZLLWl5PfDb3RTjX5R5q284TqdcQitL+7+kXv9K55/CiwaZmZksJH7mVzVsaL+8QeF3nA0PphNikZIvlFylnWJlh9c371z4Vrx9IFMr1TySJJgCB4sz19a8PrEQraV1t3rFMZqMh9Pz5Q1EixZYa+1yjbBzkz+xdYPdRBrctKbyKnpSJvYqIuAjvGg7o6wysPo5Zmb1vCsJsL1pcI6KuvkkAjgpWpeETTs0/OPZ0y6TrlohcXwiKIKfJEpDpnowdSz1uqFm0US1Ts0rTRYHBOO9bC+R/A95lxrQh0XgvJfRecGvYkTuDyciTe9KOOE27ztKi208iqtfOB2hmVr1ZOix3FqqDXyiBul34YNx7bCJRX/AHziOHulc8RecchiGwocXxcKw2AQoUKFABKjf+fyiKHRwoAOQoUSsnYh7o74268q84AJ1blPdeZmF0rOpZbu5dvGvjXlAwrbXRFqkJxKGtpXJ4wyAcihQQ2TXRzE6oafd0TjXjVYhgCwkjZt7cY3JbFhsexiLzeEOPpMTDId9zx+X8oxkKIemr2v4NKVVqd8fI+YXrj6y/8AF4xxrLr1laeUEyDRzP2GXw8pucfMRZy7iOvwiKca+nKBbd+0ouDOdRxIIsj8S/pEUdJaxyAQo7XSkchQAKJKjZ2YSWWlddd3dP1h+Y5eTnx1Th+kAyIiu7UcGOQQ823YBMuk5uIrm5S0tdPP1gEDx0kpDhS676xIy2Bg6RPgCgNUFa7+vBP1gAiLy4Q2FCgAmlzEMxS+BUH1XT9KxES1jo296GwDFErLpt3IJkgmlDRCpcngvlEUKARIjTmWTlq2DSq8teESSbmU7mWC53bCStaoqRES8LRthkABF4OTKE8lo1S+xETTnRIlmDyX3RZcctS4AvDVQXx+UQZbqs59hZd9t/4uNI6442QB1e8g0LXj4LAM404AL1jQu/xKn6RHCiS1jo9byza8KafWARDDokdast3hJCFFqkRl24BnBizk38LHB5yWmMPI55xxpZab6QoiyKVvRQpvXaa8qRWDEuZaNiDbVKH584cSIYPwl/nCbMwraRJVFTTw5w2sSC04TZOC2SgFLlpoleFVhARQoUKAB4GQdkyTlpppzhkKFAAoUdRI7AAoUNh0ADYUKFAAoUKFAAoUKFAAoUKFAAoUKFAA8BJwrR1VYMdelhkWm2QdCaE1vdQ90x5aclSOYf8A2ef/APJ/9yQGUAzqIRLQdYtsKwmZekH8YcPIkZJ1sHXbqFcS6AHidKrTkiVWAZL7uZ/8v+cDQTGgRvqHnPAErNSkuw3lPu3Zrg3O2pWg3cE8VpSq+UV0dXjHIUBM3FDobE8uqo29Rabn84Yhrzrj7pOumRuFxVYZDYUAEgqgmmgrb+cGTTn2urvV5v3zYBbZr2Ur5UiviUfvoBjVRQO0hXTkukStTD7SkbbzgEQKG4Spuroo+nlEuIOOTE7NPPuG66TpKRmtxKtearAUACh9+5bDIUAh0OK3KG1Su7/h5RHCigCc8hlsjLHU0cut1WiUT5cYGhx8fpDYkJHXcu74Q2J1/si/+Z/KIIoC0EHZCU6Sy6rTphYYGNCsMV4IuhCqc4GmUaaFoGZgXrgEz3KWl8NV40+kdxAzNZe8yKjIolVrAcRBTeixxyXFjEiZblpiWoI3NPdoCUUVflzTyiNxh55tyZJzMcQlzB1uGlN5dKUqtIgeVSPeVV9YjgAkR5wfu3FDSm6tIbf1VtsRw4oYhUVflDYUKARPLCwcy0L7hNMqaXmIXKI11VErrTwjsw20ky6MsRPNIai2ahapJXRaclVOUDxLLKqPN0WmsAyKOjHIe124BHFX8obChQAKCJLonS2+m56S9d/Jop08q6QPCgAdChsOHtJAAobCh0AHb4V5WWXbta0844XKGwDLDBcWxHA8XYxbBp2YkZ6WO9mYaO0wLxRU4QK8446ZOuqpOOEpES86xHCihDYUKFEgSi4Qsk2K0Q+1501SGbtv4obCgA7SJzNsrBTMEBT47t7mqeFdIHh3cgA4Mcghj+xzH8P6wPAAokbyu/dwXh48o432vksMgA6S1jkKFAAQ8zZLMO5glmXbicRotNfWB4MX7tf/ACE/9SQIkKBzFjkKFChiFDobCgA6MFsvKMw1blll9nc866wHDoBwPmDzXnHEbQKrWweCQzeX5RMz/Y3/AN4P5wPAIdDyMjsEu7pwieS+5mv/AC4HmPvigGRwoUKAQ5Ldfyh+aQtK2LhWnS8eWnD1iKHFygAmFlTaM20vsSpoldE+L05QPErSql1FVN2IoBihQoUAhQ6GwoAHQ2FCgA//2Q==" style={{width:"100%",height:"100%",objectFit:"cover",objectPosition:"center 10%",filter:"url(#goldToViolet) brightness(0.95)"}}/></div>

      <div style={{position:"relative",zIndex:20,display:"flex",flexDirection:"column",alignItems:"center",textAlign:"center",padding:"0 24px",marginTop:220}}>

        <div style={{fontFamily:"'Syne',sans-serif",fontSize:10,fontWeight:700,letterSpacing:".22em",textTransform:"uppercase",color:"#4a4470",marginBottom:12}}>

          VOR<span style={{color:"#9d5cff",textShadow:"0 0 12px rgba(123,47,255,.8)"}}>TEX</span> · AI Creator Studio

        </div>

        <div style={{fontFamily:"'Syne',sans-serif",fontSize:"clamp(22px,4vw,32px)",fontWeight:800,color:"#f0eeff",letterSpacing:"-.04em",lineHeight:1.18,minHeight:78,maxWidth:340}}>

          <span style={{whiteSpace:"pre-line"}}>{twText}</span>

          <span style={{display:"inline-block",width:2,height:".85em",background:"#9d5cff",verticalAlign:"middle",marginLeft:3,animation:"bhBlink .65s steps(1) infinite"}}/>

        </div>

        <div style={{fontSize:13,color:"#9b8fcc",lineHeight:1.65,maxWidth:260,marginTop:10,minHeight:38,opacity:showSub?1:0,transition:"opacity .6s"}}>{twSub}</div>

        <div style={{width:36,height:1,background:"linear-gradient(90deg,transparent,rgba(123,47,255,.6),transparent)",margin:"14px 0"}}/>

        <button onClick={onEnter} style={{padding:"12px 36px",borderRadius:99,border:"none",background:"linear-gradient(135deg,#7b2fff,#9d5cff)",color:"#fff",fontFamily:"'Syne',sans-serif",fontSize:13,fontWeight:700,cursor:"pointer",boxShadow:"0 0 32px rgba(123,47,255,.6)",opacity:ready?1:0,transform:ready?"translateY(0)":"translateY(8px)",transition:"opacity .5s, transform .5s"}}>

          Entrar no Vortex ?

        </button>

      </div>

      </div>

      <style>{"@keyframes bhBlink{0%,100%{opacity:1}50%{opacity:0}}"}</style>

    </div>

  );

}



function Onboarding({ onConcluir }) {

  const [step,setStep]=useState(0);

  const [dados,setDados]=useState({nome_canal:"",nicho:"",plataformas:[],dias_postagem:[],tom_de_voz:"",objetivo:"",publico_alvo:""});

  const [loading,setLoading]=useState(false);

  const [exemploHook,setExemploHook]=useState("");

  const [boasVindas,setBoasVindas]=useState("");

  const toggle=(campo,val)=>setDados(d=>({...d,[campo]:d[campo].includes(val)?d[campo].filter(x=>x!==val):[...d[campo],val]}));

  const set=(campo,val)=>setDados(d=>({...d,[campo]:val}));



  async function concluir(){

    setLoading(true);

    try {

      localStorage.setItem("vortex_profile",JSON.stringify(dados));

      localStorage.setItem("vortex_memory",JSON.stringify({nicho:dados.nicho,plataformas:dados.plataformas,tom:dados.tom_de_voz}));

      try {

        const r=await fetch(`${BACKEND}/onboarding`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({nicho:dados.nicho,plataformas:dados.plataformas,tom_de_voz:dados.tom_de_voz,publico_alvo:dados.publico_alvo,objetivo:dados.objetivo,nome_canal:dados.nome_canal})});

        if(r.ok){const d=await r.json();if(d.boas_vindas)setBoasVindas(d.boas_vindas);if(d.roteiro_exemplo)setExemploHook(d.roteiro_exemplo);}

      } catch {}

      if(!boasVindas)setBoasVindas("Vortex configurado para "+dados.nicho+"! ??");

    } catch { setBoasVindas("Pronto! Vamos criar conteúdo viral! ??"); }

    finally { setLoading(false); setStep(3); }

  }



  const dots=[0,1,2].map(i=><div key={i} className={`ob-dot ${i===step?"active":i<step?"done":""}`} style={{flex:i===step?2:1}}/>);

  return(

    <div className="ob-overlay"><div className="ob-box">

      {step<3&&<div className="ob-dots">{dots}</div>}

      {step===0&&<><div className="ob-title">Qual é o seu<br/><em>nicho?</em></div><p className="ob-sub">O Vortex vai personalizar tudo para você.</p><div className="field"><label className="label">Nome do canal (opcional)</label><input className="input" placeholder="Ex: Canal do Crispinho" value={dados.nome_canal} onChange={e=>set("nome_canal",e.target.value)}/></div><div className="field"><label className="label">Nicho</label><div className="ob-chips">{NICHOS_OB.map(n=><button key={n} className={`ob-chip ${dados.nicho===n?"active":""}`} onClick={()=>set("nicho",n)}>{n}</button>)}</div></div><div className="ob-nav"><button className="btn btn-full" onClick={()=>setStep(1)} disabled={!dados.nicho}>Continuar ?</button></div></>}

      {step===1&&<><div className="ob-title">Onde você<br/><em>posta?</em></div><p className="ob-sub">Selecione plataformas e dias.</p><div className="field"><label className="label">Plataformas</label><div className="ob-chips">{PLATS_OB.map(p=><button key={p} className={`ob-chip ${dados.plataformas.includes(p)?"active":""}`} onClick={()=>toggle("plataformas",p)}>{p}</button>)}</div></div><div className="field"><label className="label">Dias de postagem</label><div className="ob-dias">{DIAS_OB.map(d=><button key={d} className={`ob-dia ${dados.dias_postagem.includes(d)?"active":""}`} onClick={()=>toggle("dias_postagem",d)}>{d}</button>)}</div></div><div className="ob-nav"><button className="btn btn-ghost" style={{minWidth:90}} onClick={()=>setStep(0)}>? Voltar</button><button className="btn btn-full" onClick={()=>setStep(2)} disabled={dados.plataformas.length===0}>Continuar ?</button></div></>}

      {step===2&&<><div className="ob-title">Como você<br/><em>fala?</em></div><p className="ob-sub">Define como o Vortex escreve para você.</p><div className="field"><label className="label">Tom de voz</label><div className="ob-chips">{TONS_OB.map(t=><button key={t} className={`ob-chip ${dados.tom_de_voz===t?"active":""}`} onClick={()=>set("tom_de_voz",t)}>{t}</button>)}</div></div><div className="field"><label className="label">Objetivo</label><div className="ob-chips">{OBJS_OB.map(o=><button key={o} className={`ob-chip ${dados.objetivo===o?"active":""}`} onClick={()=>set("objetivo",o)}>{o}</button>)}</div></div><div className="ob-nav"><button className="btn btn-ghost" style={{minWidth:90}} onClick={()=>setStep(1)}>? Voltar</button><button className="btn btn-full" onClick={concluir} disabled={loading||!dados.tom_de_voz}>{loading?<><div className="spinner"/>Configurando...</>:"?? Concluir"}</button></div></>}

      {step===3&&<div className="ob-fim">

        <div className="ob-fim-icon">??</div>

        <div className="ob-title" style={{textAlign:"center"}}>Tudo <em>pronto!</em></div>

        {boasVindas&&<div className="ob-bv">{boasVindas}</div>}

        {exemploHook&&<div style={{background:"rgba(123,47,255,.1)",border:".5px solid rgba(123,47,255,.3)",borderRadius:12,padding:"12px 14px",margin:"12px 0",textAlign:"left"}}><div style={{fontSize:10,color:"var(--accent)",fontWeight:700,marginBottom:6,letterSpacing:1}}>? PREVIEW — HOOK VIRAL</div><div style={{fontSize:14,fontWeight:700,color:"var(--text)",lineHeight:1.5,fontStyle:"italic"}}>"{exemploHook}"</div></div>}

        <div style={{fontSize:12,color:"var(--text3)",margin:".5rem 0 1.25rem"}}>{dados.nicho&&<span>Nicho: <strong style={{color:"var(--purple2)"}}>{dados.nicho}</strong></span>}{dados.plataformas.length>0&&<span> · {dados.plataformas.join(", ")}</span>}</div>

        <button className="btn btn-full" onClick={onConcluir}>Entrar no Vortex ?</button>

      </div>}

    </div></div>

  );

}



export default function App() {

  const [aba,setAba]=useState("chat");

  const [sidebarOpen,setSidebarOpen]=useState(false);

  const [screen,setScreen]=useState("welcome");

  const [saldo,setSaldo]=useState(0);

  const [usuario,setUsuario]=useState(null);

  const [loadingAuth,setLoadingAuth]=useState(true);



  const meta=PAGE_META[aba]||{};

  const isChat=aba==="chat";

  const navTo=(id)=>{setAba(id);setSidebarOpen(false);};



  useEffect(()=>{

    const buscar=async()=>{

      try{const r=await fetch(`${BACKEND}/creditos/saldo`);if(r.ok){const d=await r.json();setSaldo(d.saldo||0);}}catch{}

    };

    const verificarAuth=async()=>{

      try{

        const params=new URLSearchParams(window.location.search);

        if(params.get("login")==="ok")window.history.replaceState({},"",window.location.pathname);

        if(params.get("pagamento")==="ok"){window.history.replaceState({},"",window.location.pathname);setTimeout(()=>alert("? Pagamento confirmado! Créditos adicionados."),1000);}

        const r=await fetch(`${BACKEND}/auth/me`).catch(()=>null);

        if(r&&r.ok){

          const d=await r.json();

          setUsuario(d.usuario);

          setSaldo(d.usuario.creditos||0);

          setScreen("app"); // já logado ? pular welcome

        }

      }catch{}

      setLoadingAuth(false);

    };

    verificarAuth();buscar();

    const t=setInterval(buscar,300000); // 5 minutos

    const navHandler=(e)=>setAba(e.detail);

    window.addEventListener("navegarVortex",navHandler);

    return()=>{clearInterval(t);window.removeEventListener("navegarVortex",navHandler);};

  },[]);



  const PAGES={

    chat:<VortexChat/>,dashboard:<Dashboard setAba={setAba}/>,analise:<AnalisePerfil setAba={setAba}/>,

    roteiro:<Roteiro/>,tendencias:<Tendencias/>,

    imagens:<GeradorImagens/>,

    editor_thumb:<EditorThumbnail imagemUrl="" tituloInicial="" onClose={()=>{}}/>,

    videos:<GeradorVideos/>,voz:<ClonadorVoz/>,

    video_faceless:<VideoFaceless/>,analisar_video:<AnalisarVideo/>,

    musica:<GeradorMusica/>,

    memoria:<MemoriaVortex/>,projetos:<MeusProjetos/>,

    score_viral:<ScoreViral/>,creditos:<Creditos/>,config:<Configuracoes/>,

  };



  // Modal de login — aparece quando usuário tenta usar feature paga

  const [showLogin, setShowLogin] = useState(false);

  const [loginMsg, setLoginMsg] = useState("");



  // Função global para pedir login

  window.__vortexPedirLogin = (msg="Faça login para continuar") => {

    setLoginMsg(msg);

    setShowLogin(true);

  };



  return(

    <>

      <style>{STYLE}</style>



      {/* Modal de Login — aparece sobre qualquer tela */}

      {showLogin && (

        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.85)",zIndex:9999,

          display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>

          <div style={{background:"#111118",border:"1px solid #1e1e2e",borderRadius:16,

            padding:"2rem",maxWidth:380,width:"100%",textAlign:"center"}}>

            <div style={{fontSize:32,marginBottom:12}}>?</div>

            <div style={{fontFamily:"var(--fh)",fontSize:20,fontWeight:800,marginBottom:8}}>

              Acesse o Vortex

            </div>

            <div style={{fontSize:13,color:"var(--text3)",marginBottom:24,lineHeight:1.6}}>

              {loginMsg}

            </div>



            {/* Google */}

            <a href={BACKEND+"/auth/google"}

              style={{display:"flex",alignItems:"center",justifyContent:"center",gap:10,

                padding:"12px 20px",background:"#fff",color:"#111",borderRadius:10,

                textDecoration:"none",fontWeight:700,fontSize:14,marginBottom:10,width:"100%"}}>

              <span>??</span> Entrar com Google

            </a>



            {/* Email */}

            <button onClick={()=>{

              const email = prompt("Seu email:");

              if(email) window.location.href = BACKEND+"/auth/email?email="+encodeURIComponent(email);

            }}

              style={{display:"flex",alignItems:"center",justifyContent:"center",gap:10,

                padding:"12px 20px",background:"rgba(255,255,255,.08)",color:"var(--text)",

                border:"1px solid var(--border)",borderRadius:10,fontWeight:700,fontSize:14,

                marginBottom:10,width:"100%",cursor:"pointer"}}>

              <span>??</span> Entrar com Email

            </button>



            {/* Continuar sem conta */}

            <button onClick={()=>setShowLogin(false)}

              style={{fontSize:12,color:"var(--text3)",background:"none",border:"none",

                cursor:"pointer",textDecoration:"underline",marginTop:8}}>

              Continuar sem conta (plano Free)

            </button>



            <div style={{fontSize:10,color:"#444",marginTop:16}}>

              Ao entrar você concorda com nossos termos de uso

            </div>

          </div>

        </div>

      )}



      {screen==="welcome"&&<WelcomeScreen onEnter={()=>setScreen("app")}/>}

      {screen==="app"&&<>

        <div className="ambient"><div className="amb1"/><div className="amb2"/></div>

        <div className="shell">

          {sidebarOpen&&<div className="sidebar-overlay" onClick={()=>setSidebarOpen(false)}/>}

          <aside className={`sidebar ${sidebarOpen?"open":""}`}>

            <div className="sidebar-scroll">

              <div className="logo-wrap"><div className="logo">VOR<em>TEX</em></div><div className="logo-sub">AI Creator Studio</div></div>

              {GRUPOS.map((grupo,gi)=>(

                <div key={grupo.label}>

                  <div className="nav-section">

                    <span className="nav-label">{grupo.label}</span>

                    {grupo.itens.map(item=>(

                      <button key={item.id} className={`nav-item ${aba===item.id?"active":""}`} onClick={()=>navTo(item.id)}>

                        <span className="nav-icon">{item.icon}</span>{item.label}

                        {item.badge&&<span className="nav-badge">novo</span>}

                      </button>

                    ))}

                  </div>

                  {gi<GRUPOS.length-1&&<hr className="nav-divider"/>}

                </div>

              ))}

              <div className="sidebar-footer">

                <span className="nav-label" style={{display:"block",paddingBottom:4}}>Conta</span>

                {CONTA.map(item=><button key={item.id} className={`nav-item ${aba===item.id?"active":""}`} onClick={()=>navTo(item.id)}><span className="nav-icon">{item.icon}</span>{item.label}</button>)}

              </div>

            </div>

          </aside>

          <main className="main">

            <header className="topbar">

              <div className="topbar-left">

                <button className="hamburger" onClick={()=>setSidebarOpen(o=>!o)}>?</button>

                <div><div className="topbar-title">{meta.title}</div><div className="topbar-sub">{meta.sub}</div></div>

              </div>

              <div className="topbar-right">

                <span className="pill pill-green"><span className="pill-dot" style={{background:"var(--green)"}}/>online</span>

                <span className="pill pill-purple" style={{cursor:"pointer"}} onClick={()=>setAba("creditos")}>? {saldo} créditos</span>

                {usuario?(

                  <div style={{display:"flex",alignItems:"center",gap:6,cursor:"pointer"}} onClick={()=>setAba("config")}>

                    {usuario.foto?<img src={usuario.foto} style={{width:28,height:28,borderRadius:"50%",border:".5px solid rgba(123,47,255,.5)"}} alt=""/>:<div style={{width:28,height:28,borderRadius:"50%",background:"rgba(123,47,255,.3)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:700,color:"var(--purple2)"}}>{(usuario.nome||"U")[0]}</div>}

                  </div>

                ):(

                  <button onClick={()=>window.open(`${BACKEND}/auth/google`,"_self")}

                    style={{display:"flex",alignItems:"center",gap:5,padding:"5px 12px",borderRadius:99,border:".5px solid rgba(123,47,255,.4)",background:"rgba(123,47,255,.1)",color:"var(--purple2)",fontSize:12,fontWeight:600,cursor:"pointer"}}>

                    <svg width="14" height="14" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>

                    Entrar

                  </button>

                )}

              </div>

            </header>

            {isChat?PAGES["chat"]:<div className="scroll">{PAGES[aba]}</div>}

            <nav className="bottom-nav">

              {BOTTOM_NAV.map(item=><button key={item.id} className={`bn-item ${aba===item.id?"active":""}`} onClick={()=>navTo(item.id)}><span className="bn-icon">{item.icon}</span><span className="bn-label">{item.label}</span></button>)}

            </nav>

          </main>

        </div>

      </>}

    </>

  );

}
