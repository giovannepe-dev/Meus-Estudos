const BEEP_KEY = 'scan_beep_enabled';

export function isBeepEnabled(): boolean {
  return localStorage.getItem(BEEP_KEY) !== 'false';
}

export function setBeepEnabled(enabled: boolean) {
  localStorage.setItem(BEEP_KEY, String(enabled));
}

let audioCtx: AudioContext | null = null;

export function playBeep() {
  if (!isBeepEnabled()) return;
  try {
    if (!audioCtx) audioCtx = new AudioContext();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.frequency.value = 1200;
    gain.gain.value = 0.3;
    osc.start();
    osc.stop(audioCtx.currentTime + 0.15);
  } catch {}
}
