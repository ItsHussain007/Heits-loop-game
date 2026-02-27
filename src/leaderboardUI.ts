/**
 * Leaderboard DOM + submit. Never blocks gameplay. Exposes window.leaderboard for HTML.
 */

import { submitScore, getLeaderboard, type LeaderboardEntry } from './services/leaderboard';
import { LEADERBOARD_PAGE_SIZE } from './config';

const HANDLE_KEY = 'leaderboard_handle';

function getHandle(): string {
  try {
    const h = localStorage.getItem(HANDLE_KEY);
    return (h && h.trim()) ? h.trim().slice(0, 64) : 'Player';
  } catch {
    return 'Player';
  }
}

function setHandle(value: string): void {
  try {
    localStorage.setItem(HANDLE_KEY, String(value).trim().slice(0, 64));
  } catch {}
}

function formatTime(ms: number): string {
  const s = (ms / 1000).toFixed(1);
  return `${s}s`;
}

function renderList(list: LeaderboardEntry[], container: HTMLElement, unavailableEl: HTMLElement): void {
  unavailableEl.style.display = 'none';
  container.innerHTML = '';
  if (list.length === 0) {
    container.innerHTML = '<p style="color:#888;margin:0;">No entries yet.</p>';
    return;
  }
  list.forEach((e) => {
    const row = document.createElement('div');
    row.className = 'leaderboard-row';
    row.style.cssText = 'display:flex;justify-content:space-between;padding:6px 8px;border-bottom:1px solid #333;';
    row.innerHTML = `<span>#${e.rank}</span><span>${escapeHtml(e.userHandle)}</span><span>${formatTime(e.bestTimeMs)}</span>`;
    container.appendChild(row);
  });
}

function escapeHtml(s: string): string {
  const div = document.createElement('div');
  div.textContent = s;
  return div.innerHTML;
}

function showUnavailable(container: HTMLElement, unavailableEl: HTMLElement, errorReason?: string): void {
  container.innerHTML = '';
  unavailableEl.style.display = 'block';
  const detail = document.getElementById('leaderboard-error-detail');
  if (detail) detail.textContent = errorReason ?? '';
}

export function initLeaderboard(): void {
  const panel = document.getElementById('leaderboard-panel');
  const listEl = document.getElementById('leaderboard-list');
  const unavailableEl = document.getElementById('leaderboard-unavailable');
  const handleInput = document.getElementById('leaderboard-handle') as HTMLInputElement | null;
  const refreshBtn = document.getElementById('btn-leaderboard-refresh');

  if (!panel || !listEl || !unavailableEl) return;

  const load = async (page = 0) => {
    const r = await getLeaderboard(page, LEADERBOARD_PAGE_SIZE);
    if (r.ok) renderList(r.list, listEl, unavailableEl);
    else showUnavailable(listEl, unavailableEl, r.error);
  };

  refreshBtn?.addEventListener('click', () => load(0));

  if (handleInput) {
    handleInput.value = getHandle();
    handleInput.addEventListener('change', () => setHandle(handleInput.value));
    handleInput.addEventListener('blur', () => setHandle(handleInput.value));
    // Keep key events in the input so the game doesn't capture WASD, E, R, Space, Ctrl+C/V, etc.
    ['keydown', 'keyup', 'keypress'].forEach((ev) => {
      handleInput.addEventListener(ev, (e) => e.stopPropagation(), false);
    });
  }

  (window as any).leaderboard = {
    submitRun(timeSec: number, levelsCompleted: number): void {
      const runTimeMs = Math.round(timeSec * 1000);
      const handle = handleInput?.value?.trim() || getHandle();
      setHandle(handle);
      submitScore(runTimeMs, levelsCompleted, handle).then((r) => {
        if (!r.ok) return;
        load(0);
      });
    },
    refreshLeaderboard(): void {
      load(0);
    },
  };

  load(0);
}
