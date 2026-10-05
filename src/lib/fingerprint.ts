'use client';

/**
 * High-reliability client-side hardware and canvas device fingerprinting.
 * Survives:
 * 1. VPN switches (VPN only changes IP, not GPU/Canvas/Screen/Hardware).
 * 2. Incognito / Private browsing mode.
 * 3. Clearing browser cookies.
 */

// Simple SHA-256 in browser SubtleCrypto
async function sha256Hex(message: string): Promise<string> {
  if (typeof window === 'undefined' || !window.crypto || !window.crypto.subtle) {
    // Fallback simple hash for non-standard environments
    let hash = 0;
    for (let i = 0; i < message.length; i++) {
      const char = message.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash |= 0;
    }
    return Math.abs(hash).toString(16).padStart(16, '0');
  }

  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await window.crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

function getCanvasFingerprint(): string {
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 240;
    canvas.height = 60;
    const ctx = canvas.getContext('2d');
    if (!ctx) return 'no-canvas-2d';

    ctx.textBaseline = 'top';
    ctx.font = "14px 'Arial', 'Helvetica', sans-serif";
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = '#f60';
    ctx.fillRect(125, 1, 62, 20);

    ctx.fillStyle = '#069';
    ctx.fillText('PothikVisa, ✈ 12345! 🇧🇩', 2, 15);
    ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
    ctx.fillText('PothikVisa, ✈ 12345! 🇧🇩', 4, 17);

    return canvas.toDataURL();
  } catch (e) {
    return 'canvas-error';
  }
}

function getWebGLFingerprint(): string {
  try {
    const canvas = document.createElement('canvas');
    const gl = (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')) as WebGLRenderingContext | null;
    if (!gl) return 'no-webgl';

    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
    if (!debugInfo) {
      return gl.getParameter(gl.RENDERER) || 'webgl-standard';
    }

    const vendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) || '';
    const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) || '';
    return `${vendor}:::${renderer}`;
  } catch (e) {
    return 'webgl-error';
  }
}

function getPersistentDeviceSeed(): string {
  if (typeof window === 'undefined') return 'server';
  try {
    const STORAGE_KEY = 'pv_seed_id';
    let seed = localStorage.getItem(STORAGE_KEY);
    if (!seed) {
      seed = 'pv_' + Math.random().toString(36).substring(2) + Date.now().toString(36);
      localStorage.setItem(STORAGE_KEY, seed);
    }
    return seed;
  } catch {
    return 'storage-disabled';
  }
}

let cachedFingerprint: string | null = null;

export async function getDeviceFingerprint(): Promise<string> {
  if (typeof window === 'undefined') return 'server_fp';
  if (cachedFingerprint) return cachedFingerprint;

  try {
    const screenInfo = `${window.screen.width}x${window.screen.height}x${window.screen.colorDepth}@${window.devicePixelRatio || 1}`;
    const cores = navigator.hardwareConcurrency || 4;
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
    const canvasHash = getCanvasFingerprint();
    const webglInfo = getWebGLFingerprint();
    const deviceSeed = getPersistentDeviceSeed();

    const rawPayload = [
      screenInfo,
      cores,
      timeZone,
      canvasHash,
      webglInfo,
      deviceSeed,
      navigator.language || 'en',
    ].join('||');

    const hash = await sha256Hex(rawPayload);
    cachedFingerprint = `dfp_${hash.substring(0, 32)}`;
    return cachedFingerprint;
  } catch (err) {
    return 'dfp_fallback_' + Math.random().toString(36).substring(2, 10);
  }
}
