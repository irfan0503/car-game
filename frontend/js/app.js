import { clearToken, getToken, request, saveToken } from './api.js';
import { RaceAudio } from './audio.js';
import { createRacer, drawPreview } from './game.js';

const byId = (id) => document.getElementById(id);
const views = [...document.querySelectorAll('.view')];
const audio = new RaceAudio();
const racer = createRacer({
  canvas: byId('gameCanvas'),
  onScore: (score) => { byId('liveScore').textContent = String(score).padStart(6, '0'); },
  onSpeed: (speed) => { byId('speedReadout').innerHTML = `${String(speed).padStart(2, '0')} <small>KM/H</small>`; },
  onPass: () => audio.pass(),
  onStateChange: updateGameState,
  onGameOver: finishRun,
});

let user = null;
let currentRunId = null;
let authMode = 'login';
let toastTimer = 0;

drawPreview(byId('previewCanvas'));
byId('soundButton').setAttribute('aria-pressed', String(audio.getMuted()));

function showView(id) {
  for (const view of views) view.hidden = view.id !== id;
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function showToast(message) {
  const toast = byId('toast');
  toast.textContent = message;
  toast.hidden = false;
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => { toast.hidden = true; }, 4200);
}

function updateAccount() {
  byId('accountButton').innerHTML = user
    ? `${escapeText(user.username)} <span aria-hidden="true">↗</span>`
    : 'Sign in <span aria-hidden="true">↗</span>';
  byId('profileNav').hidden = !user;
  byId('gamePlayer').textContent = user ? user.username.toUpperCase() : 'GUEST DRIVER';
  byId('homeRank').textContent = user ? '—' : 'GUEST';
}

function escapeText(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[character]);
}

function updateGameState(state) {
  byId('runState').textContent = ({ running: 'ON THE ROAD', paused: 'PAUSED', over: 'FINISH', ready: 'READY' })[state];
  byId('pauseButton').disabled = state !== 'running';
  byId('pauseButton').setAttribute('aria-label', state === 'running' ? 'Pause game' : 'Game is not running');
  if (state === 'running') {
    byId('gameOverlay').hidden = true;
    audio.startEngine();
  } else {
    audio.stopEngine();
  }
  if (state === 'paused') {
    byId('overlayKicker').textContent = 'RUN PAUSED';
    byId('overlayTitle').textContent = 'TAKE A BREATH.';
    byId('overlayMessage').textContent = 'Your run is right where you left it.';
    byId('pauseActions').hidden = false;
    byId('overActions').hidden = true;
    byId('gameOverlay').hidden = false;
  }
}

async function startRun() {
  const playButton = byId('playButton');
  playButton.disabled = true;
  try {
    currentRunId = user ? (await request('/games/start', { method: 'POST', body: {} })).runId : null;
    byId('sidebarBest').textContent = byId('homeBest').textContent;
    byId('liveScore').textContent = '000000';
    byId('gameOverlay').hidden = true;
    showView('gameView');
    racer.start();
  } catch (error) {
    showToast(error.message);
  } finally {
    playButton.disabled = false;
  }
}

async function finishRun(result) {
  audio.stopEngine();
  audio.crash();
  byId('overlayKicker').textContent = 'RUN COMPLETE';
  byId('overlayTitle').textContent = 'NICE RUN.';
  byId('overlayMessage').textContent = user ? 'Saving your score to the board...' : 'Sign in to save your run and chase the global board.';
  byId('pauseActions').hidden = true;
  byId('overActions').hidden = false;
  byId('gameOverlay').hidden = false;

  const guestBest = Math.max(Number(localStorage.getItem('apexShiftGuestBest')) || 0, result.score);
  localStorage.setItem('apexShiftGuestBest', String(guestBest));
  byId('homeBest').textContent = String(Math.max(Number(byId('homeBest').textContent.replace(/,/g, '')) || 0, result.score)).padStart(6, '0');
  byId('sidebarBest').textContent = byId('homeBest').textContent;

  if (!user || !currentRunId) {
    byId('overlayMessage').textContent = 'Run complete. Sign in to save scores to the global board.';
    return;
  }

  try {
    await request('/scores', {
      method: 'POST',
      body: { runId: currentRunId, score: result.score, durationMs: result.durationMs },
    });
    byId('overlayMessage').textContent = `Score saved: ${result.score.toLocaleString()} points. Ready for another?`;
    byId('homeBest').textContent = String(Math.max(Number(byId('homeBest').textContent.replace(/,/g, '')) || 0, result.score)).padStart(6, '0');
    showToast('Your run is on the leaderboard.');
  } catch (error) {
    byId('overlayMessage').textContent = `${error.message} This run could not be saved.`;
  }
}

function setAuthMode(mode) {
  authMode = mode;
  const registering = mode === 'register';
  byId('usernameField').hidden = !registering;
  byId('usernameInput').required = registering;
  byId('passwordInput').autocomplete = registering ? 'new-password' : 'current-password';
  byId('authHeading').innerHTML = registering ? 'CLAIM YOUR<br>DRIVER NAME.' : 'GET IN THE<br>DRIVER\'S SEAT.';
  byId('authSubmit').innerHTML = `${registering ? 'Create account' : 'Sign in'} <span class="button-arrow" aria-hidden="true">↗</span>`;
  byId('loginTab').classList.toggle('is-active', !registering);
  byId('registerTab').classList.toggle('is-active', registering);
  byId('loginTab').setAttribute('aria-selected', String(!registering));
  byId('registerTab').setAttribute('aria-selected', String(registering));
  byId('authError').hidden = true;
}

function openAuth(mode = 'login') {
  setAuthMode(mode);
  byId('authDialog').showModal();
  byId('emailInput').focus();
}

async function loadHomeStats() {
  const localBest = Number(localStorage.getItem('apexShiftGuestBest')) || 0;
  byId('homeBest').textContent = user ? '—' : localBest ? String(localBest).padStart(6, '0') : '—';
  byId('sidebarBest').textContent = byId('homeBest').textContent;
  try {
    const { leaderboard } = await request('/leaderboard');
    if (leaderboard[0]) byId('worldBest').textContent = leaderboard[0].bestScore.toLocaleString();
  } catch {
    byId('worldBest').textContent = '—';
  }
  if (!user) return;
  try {
    const { scores, bestScore } = await request('/scores/me');
    byId('homeBest').textContent = bestScore ? String(bestScore).padStart(6, '0') : '—';
    byId('sidebarBest').textContent = byId('homeBest').textContent;
    const rank = (await request('/leaderboard')).leaderboard.findIndex((driver) => driver.username === user.username);
    byId('homeRank').textContent = rank < 0 ? '—' : `#${rank + 1}`;
    if (scores.length && rank < 0) byId('homeRank').textContent = '—';
  } catch {
    clearToken();
    user = null;
    updateAccount();
  }
}

async function showLeaderboard() {
  showView('leaderboardView');
  const rows = byId('leaderboardRows');
  rows.innerHTML = '<p class="empty-state">Loading the grid...</p>';
  try {
    const { leaderboard } = await request('/leaderboard');
    rows.innerHTML = leaderboard.length ? leaderboard.map((driver, index) => `
      <div class="table-row${index === 0 ? ' is-top' : ''}">
        <span class="rank-cell">${String(index + 1).padStart(2, '0')}</span>
        <span class="driver-cell">${escapeText(driver.username)}</span>
        <span class="score-cell">${driver.bestScore.toLocaleString()}</span>
        <span class="games-cell">${driver.gamesPlayed}</span>
      </div>`).join('') : '<p class="empty-state">No drivers on the board yet. Take the first spot.</p>';
  } catch (error) {
    rows.innerHTML = `<p class="empty-state">${escapeText(error.message)} Start MongoDB to load the leaderboard.</p>`;
  }
}

async function showProfile() {
  if (!user) return openAuth();
  showView('profileView');
  byId('profileCaption').textContent = `${user.username} / last 50 recorded runs`;
  const rows = byId('profileRows');
  rows.innerHTML = '<p class="empty-state">Loading your runs...</p>';
  try {
    const { scores } = await request('/scores/me');
    rows.innerHTML = scores.length ? scores.map((run) => `
      <div class="table-row">
        <span>${new Date(run.playedAt).toLocaleString()}</span>
        <span class="score-cell">${run.score.toLocaleString()}</span>
        <span class="games-cell">${Math.floor(run.durationMs / 1_000)} SEC</span>
      </div>`).join('') : '<p class="empty-state">No runs yet. The road is waiting.</p>';
  } catch (error) {
    rows.innerHTML = `<p class="empty-state">${escapeText(error.message)}</p>`;
  }
}

byId('playButton').addEventListener('click', startRun);
byId('pauseButton').addEventListener('click', () => racer.pause());
byId('resumeButton').addEventListener('click', () => racer.resume());
byId('quitButton').addEventListener('click', () => {
  racer.pause();
  byId('overlayKicker').textContent = 'RUN ENDED';
  byId('overlayTitle').textContent = 'CALLED IT.';
  byId('overlayMessage').textContent = 'Head back out when you are ready.';
  byId('pauseActions').hidden = true;
  byId('overActions').hidden = false;
  byId('gameOverlay').hidden = false;
  audio.stopEngine();
});
byId('restartButton').addEventListener('click', startRun);
byId('resultsButton').addEventListener('click', showLeaderboard);
byId('homeFromGame').addEventListener('click', () => {
  if (racer.state === 'running') racer.pause();
  showView('homeView');
});
byId('leaderboardNav').addEventListener('click', showLeaderboard);
byId('homeFromBoard').addEventListener('click', () => showView('homeView'));
byId('homeFromProfile').addEventListener('click', () => showView('homeView'));
byId('profileNav').addEventListener('click', showProfile);
byId('accountButton').addEventListener('click', () => user ? showProfile() : openAuth());
byId('logoutButton').addEventListener('click', () => {
  clearToken();
  user = null;
  updateAccount();
  loadHomeStats();
  showView('homeView');
  showToast('You have signed out.');
});
byId('soundButton').addEventListener('click', () => {
  const muted = audio.toggle();
  byId('soundButton').setAttribute('aria-pressed', String(muted));
  byId('soundButton').setAttribute('aria-label', muted ? 'Unmute sound' : 'Mute sound');
});
byId('closeAuthButton').addEventListener('click', () => byId('authDialog').close());
byId('authDialog').addEventListener('click', (event) => {
  if (event.target === byId('authDialog')) byId('authDialog').close();
});
document.querySelectorAll('[data-auth-mode]').forEach((button) => {
  button.addEventListener('click', () => setAuthMode(button.dataset.authMode));
});

byId('authForm').addEventListener('submit', async (event) => {
  event.preventDefault();
  const submit = byId('authSubmit');
  const errorMessage = byId('authError');
  submit.disabled = true;
  errorMessage.hidden = true;
  try {
    const body = {
      email: byId('emailInput').value.trim(),
      password: byId('passwordInput').value,
    };
    if (authMode === 'register') body.username = byId('usernameInput').value.trim();
    const result = await request(`/auth/${authMode}`, { method: 'POST', body });
    saveToken(result.token);
    user = result.user;
    updateAccount();
    byId('authDialog').close();
    byId('authForm').reset();
    await loadHomeStats();
    showToast(`Welcome to the grid, ${user.username}.`);
  } catch (error) {
    errorMessage.textContent = error.message;
    errorMessage.hidden = false;
  } finally {
    submit.disabled = false;
  }
});

async function initialize() {
  const token = getToken();
  if (token) {
    try {
      user = (await request('/auth/me')).user;
    } catch {
      clearToken();
    }
  }
  updateAccount();
  await loadHomeStats();
}

initialize();