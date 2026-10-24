/**
 * ============================================================================
 * TASKORA — PREMIUM ANIMATED TO-DO EXPERIENCE
 * ============================================================================
 * Core JavaScript Application File
 * 
 * Features:
 * 1. Personalization & User Onboarding with Uploaded Interactive Avatars:
 *    - Boy (Leo): assets/boy-avatar.png
 *    - Girl (Aria): assets/girl.avatar.png
 * 2. Interactive Avatar with 3D Tilt, Click Reactions, and Motivational Speech.
 * 3. Sequential Task Queue Pipeline (Tasks added one after another in queue form).
 * 4. Queue Progression (Current Focus #01, Up Next #02, Waiting In Queue).
 * 5. Signature Launch Animation (Avatar visibly guides & pushes board into place).
 * 6. Task Management (Add to Queue, Inline Edit, Strike-through complete, Reorder, Delete).
 * 7. Automatic 24-Hour Expiration Engine (Original creation timestamp strictly preserved).
 * 8. Web Audio Synthesizer Chimes (No external MP3 files needed).
 * 9. Particle Celebration Canvas (Sparkle burst on completion).
 * 10. Accessible Toast Notification System.
 * 
 * Written in clean, maintainable Vanilla JavaScript with beginner-friendly explanations.
 */

'use strict';

/* ============================================================================
   1. CONSTANTS & APPLICATION CONFIGURATION
   ============================================================================ */

const STORAGE_KEYS = {
  USER: 'taskora_user_profile',
  TASKS: 'taskora_task_list',
  INTRO_SEEN: 'taskora_intro_session_seen'
};

const EXPIRY_DURATIONS = {
  STANDARD: 24 * 60 * 60 * 1000, // 24 hours (86,400,000 ms)
  TEST_1M: 60 * 1000              // 1 minute for fast testing (60,000 ms)
};

const DEFAULT_USER_STATE = {
  name: 'Maanesha',
  avatar: 'boy',       // 'boy' (Leo) or 'girl' (Aria)
  soundEnabled: true,
  expiryMode: 'standard' // 'standard' or 'test_1m'
};

// Uploaded Avatar Assets
const AVATAR_IMAGES = {
  boy: 'assets/boy-avatar.png',
  girl: 'assets/girl.avatar.png'
};

// Interactive avatar speech quotes
const AVATAR_QUOTES = [
  "I'm right here with you! Let's conquer the next task in your queue.",
  "Tip: Focus on Queue #01 first before moving down the line!",
  "Your productivity is on fire today! Keep the queue moving.",
  "One mission at a time, you're building unstoppable momentum.",
  "Queue moving steadily! What shall we tackle next?",
  "Great rhythm! Check off the current focus to advance the pipeline."
];
let avatarQuoteIndex = 0;

/* ============================================================================
   2. DOM ELEMENT SELECTORS
   ============================================================================ */

// Onboarding Modal Elements
const onboardingModal = document.getElementById('onboardingModal');
const onboardingForm = document.getElementById('onboardingForm');
const userNameInput = document.getElementById('userNameInput');
const nameError = document.getElementById('nameError');
const previewBoyAvatar = document.getElementById('previewBoyAvatar');
const previewGirlAvatar = document.getElementById('previewGirlAvatar');

// Launch Intro Stage Elements
const launchStage = document.getElementById('launchStage');
const pusherCharacter = document.getElementById('pusherCharacter');
const pusherSpeechText = document.getElementById('pusherSpeechText');
const skipIntroBtn = document.getElementById('skipIntroBtn');

// Dashboard & Header Elements
const appContainer = document.getElementById('appContainer');
const personalizedHeading = document.getElementById('personalizedHeading');
const mainAvatarWrap = document.getElementById('mainAvatarWrap');
const mainAvatarSvg = document.getElementById('mainAvatarSvg');
const companionMessage = document.getElementById('companionMessage');
const soundToggleBtn = document.getElementById('soundToggleBtn');
const soundIconOn = document.getElementById('soundIconOn');
const soundIconOff = document.getElementById('soundIconOff');
const settingsBtn = document.getElementById('settingsBtn');

// Stats Elements
const statTotal = document.getElementById('statTotal');
const statActive = document.getElementById('statActive');
const statCompleted = document.getElementById('statCompleted');
const statPercentage = document.getElementById('statPercentage');
const progressBarFill = document.getElementById('progressBarFill');

// Filter Tab Elements
const filterTabs = document.querySelectorAll('.filter-tab');
const filterCountAll = document.getElementById('filterCountAll');
const filterCountActive = document.getElementById('filterCountActive');
const filterCountCompleted = document.getElementById('filterCountCompleted');

// Queue Pipeline Header
const queueFlowBar = document.getElementById('queueFlowBar');
const queueSummaryText = document.getElementById('queueSummaryText');
const queueMetaNote = document.getElementById('queueMetaNote');

// Task Input & Form Elements
const addTaskForm = document.getElementById('addTaskForm');
const taskTextInput = document.getElementById('taskTextInput');
const inputValidationError = document.getElementById('inputValidationError');
const taskList = document.getElementById('taskList');
const emptyState = document.getElementById('emptyState');
const emptyAvatarWrap = document.getElementById('emptyAvatarWrap');

// Settings Modal Elements
const settingsModal = document.getElementById('settingsModal');
const settingsForm = document.getElementById('settingsForm');
const closeSettingsBtn = document.getElementById('closeSettingsBtn');
const cancelSettingsBtn = document.getElementById('cancelSettingsBtn');
const editNameInput = document.getElementById('editNameInput');
const settingsAvatarBoy = document.getElementById('settingsAvatarBoy');
const settingsAvatarGirl = document.getElementById('settingsAvatarGirl');
const expiryModeSelect = document.getElementById('expiryModeSelect');
const soundSettingToggle = document.getElementById('soundSettingToggle');
const replayIntroBtn = document.getElementById('replayIntroBtn');

// Toast Notification Container
const toastContainer = document.getElementById('toastContainer');

// Celebration Canvas
const celebrationCanvas = document.getElementById('celebrationCanvas');
const celebrationCtx = celebrationCanvas ? celebrationCanvas.getContext('2d') : null;

/* ============================================================================
   3. APPLICATION STATE MANAGEMENT
   ============================================================================ */

let currentUser = loadUserProfile();
let taskItems = loadTasks();
let currentFilter = 'all'; // 'all' | 'active' | 'completed'
let celebrationTimeoutId = null;
let expiryCheckIntervalId = null;

/* ============================================================================
   4. INTERACTIVE AVATAR RENDERER (Uploaded Character Assets)
   ============================================================================
   Displays the high-resolution character images uploaded to the assets folder:
     - assets/boy-avatar.png (Leo)
     - assets/girl.avatar.png (Aria)
   Enriches them with interactive 3D perspective tilt, floating idle animation,
   celebration glow, and click speech reactions.
   ============================================================================ */

function renderInteractiveAvatar(characterType = 'boy', pose = 'idle', context = 'hero') {
  const src = AVATAR_IMAGES[characterType] || AVATAR_IMAGES.boy;
  const altText = characterType === 'girl' ? 'Aria (Girl Avatar)' : 'Leo (Boy Avatar)';
  const imgClass = characterType === 'girl' ? 'girl-img' : 'boy-img';

  if (context === 'hero') {
    return `
      <div class="interactive-avatar-frame ${imgClass} ${pose === 'celebrate' ? 'celebrating' : ''}" id="interactiveAvatarFrame">
        <img src="${src}" alt="${altText}" class="avatar-portrait-img ${imgClass}">
        <div class="avatar-sheen" aria-hidden="true"></div>
      </div>
    `;
  } else if (context === 'pusher') {
    return `
      <div class="pusher-avatar-frame ${imgClass}">
        <img src="${src}" alt="${altText}" class="pusher-portrait-img ${imgClass}">
        <div class="pusher-energy-glow" aria-hidden="true"></div>
      </div>
    `;
  } else if (context === 'empty') {
    return `
      <div class="empty-avatar-frame ${imgClass}">
        <img src="${src}" alt="${altText}" class="empty-avatar-img ${imgClass}">
      </div>
    `;
  }
  return `<img src="${src}" alt="${altText}" class="avatar-preview-img ${imgClass}">`;
}

/**
 * Attaches interactive mouse tilt and click listeners to the companion avatar.
 */
function setupAvatarInteractions() {
  if (!mainAvatarWrap) return;

  // 3D cursor tilt on mouse movement
  mainAvatarWrap.addEventListener('mousemove', (e) => {
    const rect = mainAvatarWrap.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    const tiltX = (y / (rect.height / 2)) * -14;
    const tiltY = (x / (rect.width / 2)) * 14;

    const frame = document.getElementById('interactiveAvatarFrame');
    if (frame) {
      frame.style.transform = `perspective(500px) rotateX(${tiltX.toFixed(1)}deg) rotateY(${tiltY.toFixed(1)}deg) scale3d(1.06, 1.06, 1.06)`;
    }
  });

  // Reset tilt on mouseleave
  mainAvatarWrap.addEventListener('mouseleave', () => {
    const frame = document.getElementById('interactiveAvatarFrame');
    if (frame) {
      frame.style.transform = '';
    }
  });

  // Click interaction: bounce, sound, motivational queue quote
  mainAvatarWrap.addEventListener('click', () => {
    playChime('add');
    triggerAvatarClickReaction();
  });
}

function triggerAvatarClickReaction() {
  const frame = document.getElementById('interactiveAvatarFrame');
  if (frame) {
    frame.classList.remove('avatar-bounce');
    void frame.offsetWidth; // Force CSS reflow to re-trigger animation
    frame.classList.add('avatar-bounce');
  }

  const quote = AVATAR_QUOTES[avatarQuoteIndex % AVATAR_QUOTES.length];
  avatarQuoteIndex++;
  updateCompanionMessage(quote);
}

/* ============================================================================
   5. SOUND EFFECTS (Web Audio API Synthesizer)
   ============================================================================ */

let audioContext = null;

function getAudioContext() {
  if (!audioContext) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      audioContext = new AudioContextClass();
    }
  }
  if (audioContext && audioContext.state === 'suspended') {
    audioContext.resume();
  }
  return audioContext;
}

function playChime(soundType = 'complete') {
  if (!currentUser.soundEnabled) return;

  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    if (soundType === 'complete') {
      // Warm celebratory chime
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(659.25, now); // E5
      osc.frequency.exponentialRampToValueAtTime(830.61, now + 0.12); // G#5

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

      osc.start(now);
      osc.stop(now + 0.45);
    } else if (soundType === 'add') {
      // Tactile pleasant pop
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(587.33, now + 0.08); // D5

      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

      osc.start(now);
      osc.stop(now + 0.2);
    } else if (soundType === 'delete') {
      // Low gentle dismissal note
      osc.type = 'sine';
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.exponentialRampToValueAtTime(220, now + 0.15);

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

      osc.start(now);
      osc.stop(now + 0.22);
    }
  } catch (err) {
    console.debug('Audio playback note:', err);
  }
}

/* ============================================================================
   6. CELEBRATION SPARKLES (Lightweight Canvas Particle System)
   ============================================================================ */

class SparkleParticle {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.size = Math.random() * 5 + 3;
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 4 + 2;
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed - 1;
    this.alpha = 1;
    this.decay = Math.random() * 0.03 + 0.02;
    const colors = ['#C65D32', '#FFF3DF', '#8F351F', '#EAA078', '#FCD5B5', '#ecc94b'];
    this.color = colors[Math.floor(Math.random() * colors.length)];
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.vy += 0.12;
    this.alpha -= this.decay;
  }

  draw(ctx) {
    ctx.save();
    ctx.globalAlpha = Math.max(0, this.alpha);
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

let sparkles = [];
let isAnimatingSparkles = false;

function triggerSparkles(originX, originY) {
  if (!celebrationCanvas || !celebrationCtx) return;

  celebrationCanvas.width = window.innerWidth;
  celebrationCanvas.height = window.innerHeight;

  const count = 35;
  for (let i = 0; i < count; i++) {
    sparkles.push(new SparkleParticle(originX, originY));
  }

  if (!isAnimatingSparkles) {
    isAnimatingSparkles = true;
    requestAnimationFrame(renderSparklesLoop);
  }
}

function renderSparklesLoop() {
  if (!celebrationCtx) return;

  celebrationCtx.clearRect(0, 0, celebrationCanvas.width, celebrationCanvas.height);

  for (let i = sparkles.length - 1; i >= 0; i--) {
    const p = sparkles[i];
    p.update();
    p.draw(celebrationCtx);

    if (p.alpha <= 0) {
      sparkles.splice(i, 1);
    }
  }

  if (sparkles.length > 0) {
    requestAnimationFrame(renderSparklesLoop);
  } else {
    isAnimatingSparkles = false;
    celebrationCtx.clearRect(0, 0, celebrationCanvas.width, celebrationCanvas.height);
  }
}

/* ============================================================================
   7. TOAST NOTIFICATION MANAGER
   ============================================================================ */

function showToast(message, type = 'info', duration = 3200) {
  if (!toastContainer) return;

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.setAttribute('role', 'status');

  let iconSvg = `
    <svg class="toast-icon" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
      <circle cx="12" cy="12" r="10"></circle>
      <line x1="12" y1="16" x2="12" y2="12"></line>
      <line x1="12" y1="8" x2="12.01" y2="8"></line>
    </svg>
  `;

  if (type === 'success') {
    iconSvg = `
      <svg class="toast-icon" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
        <polyline points="22 4 12 14.01 9 11.01"></polyline>
      </svg>
    `;
  } else if (type === 'warning') {
    iconSvg = `
      <svg class="toast-icon" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
        <line x1="12" y1="9" x2="12" y2="13"></line>
        <line x1="12" y1="17" x2="12.01" y2="17"></line>
      </svg>
    `;
  }

  toast.innerHTML = `
    ${iconSvg}
    <span class="toast-text">${escapeHtml(message)}</span>
  `;

  toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('toast-fadeout');
    toast.addEventListener('animationend', () => {
      toast.remove();
    });
  }, duration);
}

/* ============================================================================
   8. LOCAL STORAGE REPOSITORY
   ============================================================================ */

function loadUserProfile() {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.USER);
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        name: typeof parsed.name === 'string' && parsed.name.trim() ? parsed.name.trim() : DEFAULT_USER_STATE.name,
        avatar: parsed.avatar === 'girl' ? 'girl' : 'boy',
        soundEnabled: parsed.soundEnabled !== false,
        expiryMode: parsed.expiryMode === 'test_1m' ? 'test_1m' : 'standard'
      };
    }
  } catch (e) {
    console.warn('Could not load user profile from localStorage:', e);
  }
  return null;
}

function saveUserProfile(user) {
  try {
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
  } catch (e) {
    console.error('Failed to save user profile to localStorage:', e);
  }
}

function loadTasks() {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.TASKS);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        return parsed.filter(task => {
          return task && typeof task.id === 'string' && typeof task.text === 'string' && typeof task.createdAt === 'number';
        });
      }
    }
  } catch (e) {
    console.warn('Could not load tasks from localStorage:', e);
  }
  return [];
}

function saveTasks(tasks) {
  try {
    localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
  } catch (e) {
    console.error('Failed to save tasks to localStorage:', e);
  }
}

/* ============================================================================
   9. SIGNATURE LAUNCH ANIMATION CONTROLLER
   ============================================================================ */

function playSignatureLaunchAnimation(onCompleteCallback) {
  if (!launchStage) {
    if (onCompleteCallback) onCompleteCallback();
    return;
  }

  if (pusherCharacter) {
    pusherCharacter.innerHTML = renderInteractiveAvatar(currentUser.avatar, 'push', 'pusher');
  }

  if (pusherSpeechText) {
    pusherSpeechText.textContent = `Queue board ready for ${currentUser.name}! 🚀`;
  }

  launchStage.classList.remove('hidden');

  let finished = false;
  const finishLaunch = () => {
    if (finished) return;
    finished = true;

    launchStage.classList.add('hidden');
    sessionStorage.setItem(STORAGE_KEYS.INTRO_SEEN, 'true');

    updateCompanionAvatar('idle');
    updateCompanionMessage(`Ready when you are, ${currentUser.name}! Your task queue is active.`);

    if (onCompleteCallback) onCompleteCallback();
  };

  if (skipIntroBtn) {
    skipIntroBtn.onclick = () => {
      finishLaunch();
    };
  }

  setTimeout(() => {
    finishLaunch();
  }, 2200);
}

/* ============================================================================
   10. COMPANION AVATAR & MESSAGE DISPLAY
   ============================================================================ */

function updateCompanionAvatar(pose = 'idle') {
  if (mainAvatarSvg) {
    mainAvatarSvg.innerHTML = renderInteractiveAvatar(currentUser.avatar, pose, 'hero');
  }
  if (emptyAvatarWrap) {
    emptyAvatarWrap.innerHTML = renderInteractiveAvatar(currentUser.avatar, 'idle', 'empty');
  }
}

function updateCompanionMessage(text) {
  if (!companionMessage) return;
  companionMessage.textContent = text;
}

function updatePersonalizedHeaders() {
  if (personalizedHeading) {
    personalizedHeading.innerHTML = `<span class="user-name-highlight">${escapeHtml(currentUser.name)}'s</span> To-Do List`;
  }
  document.title = `${currentUser.name}'s To-Do List — TASKORA`;
}

/* ============================================================================
   11. AUTOMATIC 24-HOUR TASK EXPIRATION ENGINE
   ============================================================================ */

function getActiveExpiryDuration() {
  return currentUser.expiryMode === 'test_1m' ? EXPIRY_DURATIONS.TEST_1M : EXPIRY_DURATIONS.STANDARD;
}

function checkTaskExpiration() {
  const now = Date.now();
  const maxLifetime = getActiveExpiryDuration();

  const validTasks = [];
  let expiredCount = 0;

  for (const task of taskItems) {
    const elapsed = now - task.createdAt;
    if (elapsed >= maxLifetime) {
      expiredCount++;
    } else {
      validTasks.push(task);
    }
  }

  if (expiredCount > 0) {
    taskItems = validTasks;
    saveTasks(taskItems);
    renderTaskList();
    updateStats();

    const ruleLabel = currentUser.expiryMode === 'test_1m' ? '1-minute test' : '24-hour';
    showToast(
      `${expiredCount} task${expiredCount > 1 ? 's' : ''} reached ${ruleLabel} expiry and left the queue.`,
      'info',
      4000
    );
  } else {
    updateExpiryBadges();
  }
}

function formatTimeRemaining(createdAt) {
  const maxLifetime = getActiveExpiryDuration();
  const expiresAt = createdAt + maxLifetime;
  const diffMs = expiresAt - Date.now();

  if (diffMs <= 0) return 'Expired';

  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHours = Math.floor(diffMin / 60);

  if (diffHours >= 1) {
    const remainingMins = diffMin % 60;
    return `${diffHours}h ${remainingMins}m left`;
  } else if (diffMin >= 1) {
    const remainingSecs = diffSec % 60;
    return `${diffMin}m ${remainingSecs}s left`;
  } else {
    return `${diffSec}s left`;
  }
}

function updateExpiryBadges() {
  const badgeElements = document.querySelectorAll('.task-expiry-badge[data-created]');
  const maxLifetime = getActiveExpiryDuration();

  badgeElements.forEach(badge => {
    const createdAt = parseInt(badge.getAttribute('data-created'), 10);
    if (!isNaN(createdAt)) {
      const remainingMs = (createdAt + maxLifetime) - Date.now();
      badge.textContent = `⏳ ${formatTimeRemaining(createdAt)}`;

      const warningThreshold = currentUser.expiryMode === 'test_1m' ? 15000 : 60 * 60 * 1000;
      if (remainingMs < warningThreshold) {
        badge.classList.add('critical');
      } else {
        badge.classList.remove('critical');
      }
    }
  });
}

/* ============================================================================
   12. SEQUENTIAL TASK QUEUE MANAGEMENT
   ============================================================================
   Queue Architecture:
   - Tasks are entered sequentially in FIFO (First-In, First-Out) queue form.
   - The first active (uncompleted) task is designated "CURRENT FOCUS (#01)".
   - Subsequent active tasks line up as "UP NEXT (#02)" and "IN QUEUE (#03+)".
   - When a task is completed, the queue automatically advances to the next task.
   - Users can also rearrange queue order using the ▲ and ▼ controls.
   ============================================================================ */

/**
 * Adds a new task to the end of the queue.
 */
function addTask(text) {
  const trimmed = text.trim();

  if (!trimmed) {
    if (taskTextInput) {
      taskTextInput.classList.remove('shake');
      void taskTextInput.offsetWidth;
      taskTextInput.classList.add('shake');
      taskTextInput.focus();
    }
    if (inputValidationError) {
      inputValidationError.textContent = 'Please enter a task description before adding to queue.';
    }
    showToast('Task description cannot be empty.', 'warning');
    return;
  }

  if (inputValidationError) inputValidationError.textContent = '';

  const newTask = {
    id: `task_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    text: trimmed,
    completed: false,
    createdAt: Date.now() // Original creation timestamp preserved for 24h rule
  };

  // Add to end of queue (FIFO queue order: one after another)
  taskItems.push(newTask);
  saveTasks(taskItems);

  if (taskTextInput) {
    taskTextInput.value = '';
    taskTextInput.focus();
  }

  renderTaskList();
  updateStats();
  playChime('add');
  showToast(`Task queued at position #${taskItems.length}.`, 'success');

  updateCompanionAvatar('idle');
  updateCompanionMessage(`Queued at Position #${taskItems.length}! Ready when you are, ${currentUser.name}.`);
}

/**
 * Moves a task up or down within the queue pipeline.
 */
function moveTaskInQueue(taskId, direction) {
  const index = taskItems.findIndex(t => t.id === taskId);
  if (index === -1) return;

  const targetIndex = direction === 'up' ? index - 1 : index + 1;
  if (targetIndex < 0 || targetIndex >= taskItems.length) return;

  // Swap positions in queue
  const temp = taskItems[index];
  taskItems[index] = taskItems[targetIndex];
  taskItems[targetIndex] = temp;

  saveTasks(taskItems);
  renderTaskList();
  updateStats();
  playChime('add');
  showToast(`Task queue order updated.`, 'info');
}

/**
 * Toggles task completion.
 * Advances the queue pipeline and triggers celebration.
 */
function toggleTaskCompletion(taskId, cardElement) {
  const task = taskItems.find(t => t.id === taskId);
  if (!task) return;

  task.completed = !task.completed;
  saveTasks(taskItems);

  if (task.completed) {
    playChime('complete');

    if (cardElement) {
      const rect = cardElement.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      triggerSparkles(centerX, centerY);
    }

    updateCompanionAvatar('celebrate');

    // Find next pending task in queue
    const nextPending = taskItems.find(t => !t.completed);
    if (nextPending) {
      updateCompanionMessage(`Done! Great work! 🎉 Advanced queue to: "${nextPending.text}"`);
    } else {
      updateCompanionMessage(`Done! Great work! 🎉 Entire queue is cleared, ${currentUser.name}! 🚀`);
    }

    if (celebrationTimeoutId) clearTimeout(celebrationTimeoutId);
    celebrationTimeoutId = setTimeout(() => {
      updateCompanionAvatar('idle');
    }, 2800);

    showToast('Done! Task marked as completed.', 'success');
  } else {
    showToast('Task returned to active queue.', 'info');
  }

  renderTaskList();
  updateStats();
}

function saveTaskEdit(taskId, newText) {
  const trimmed = newText.trim();
  if (!trimmed) {
    showToast('Task description cannot be empty.', 'warning');
    return false;
  }

  const task = taskItems.find(t => t.id === taskId);
  if (!task) return false;

  task.text = trimmed;
  // NOTE: task.createdAt is intentionally untouched so 24-hr expiry rule holds!
  saveTasks(taskItems);

  renderTaskList();
  updateStats();
  showToast('Task updated in queue.', 'info');

  updateCompanionMessage('Task updated and refreshed in queue!');
  setTimeout(() => {
    updateCompanionMessage(`Queue organized and ready, ${currentUser.name}.`);
  }, 2000);

  return true;
}

function deleteTask(taskId) {
  const index = taskItems.findIndex(t => t.id === taskId);
  if (index === -1) return;

  taskItems.splice(index, 1);
  saveTasks(taskItems);

  renderTaskList();
  updateStats();
  playChime('delete');
  showToast('Task removed from queue.', 'info');
}

/**
 * Renders the sequential queue list and status pipeline.
 */
function renderTaskList() {
  if (!taskList) return;

  taskList.innerHTML = '';

  let filtered = taskItems;
  if (currentFilter === 'active') {
    filtered = taskItems.filter(t => !t.completed);
  } else if (currentFilter === 'completed') {
    filtered = taskItems.filter(t => t.completed);
  }

  // Update Queue Pipeline Header
  const activeQueue = taskItems.filter(t => !t.completed);
  if (queueSummaryText) {
    if (activeQueue.length > 0) {
      queueSummaryText.innerHTML = `Active Queue: <strong>${activeQueue.length}</strong> in line • Current Focus: <em>"${escapeHtml(activeQueue[0].text)}"</em>`;
    } else {
      queueSummaryText.textContent = `Queue Clear! All tasks processed. Add a mission above to start your queue.`;
    }
  }

  if (filtered.length === 0) {
    if (emptyState) emptyState.classList.remove('hidden');
    return;
  } else {
    if (emptyState) emptyState.classList.add('hidden');
  }

  let activeQueueCounter = 0;

  filtered.forEach((task, index) => {
    const naturalIndex = index + 1;
    const isCompleted = task.completed;
    let badgeHtml = '';
    let isCurrentFocus = false;

    if (!isCompleted) {
      activeQueueCounter++;
      if (activeQueueCounter === 1) {
        isCurrentFocus = true;
        badgeHtml = `
          <div class="queue-station-badge current">
            <span class="queue-pulse-dot"></span>
            <span class="queue-station-num">#${String(activeQueueCounter).padStart(2, '0')}</span>
            <span class="queue-station-state">CURRENT FOCUS</span>
          </div>
        `;
      } else if (activeQueueCounter === 2) {
        badgeHtml = `
          <div class="queue-station-badge up-next">
            <span class="queue-station-num">#${String(activeQueueCounter).padStart(2, '0')}</span>
            <span class="queue-station-state">UP NEXT</span>
          </div>
        `;
      } else {
        badgeHtml = `
          <div class="queue-station-badge in-line">
            <span class="queue-station-num">#${String(activeQueueCounter).padStart(2, '0')}</span>
            <span class="queue-station-state">IN QUEUE</span>
          </div>
        `;
      }
    } else {
      badgeHtml = `
        <div class="queue-station-badge processed">
          <span class="queue-station-num">#${String(naturalIndex).padStart(2, '0')}</span>
          <span class="queue-station-state">PROCESSED</span>
        </div>
      `;
    }

    const li = document.createElement('li');
    li.className = `task-card ${isCompleted ? 'completed' : ''} ${isCurrentFocus ? 'queue-current' : ''}`;
    li.id = `card_${task.id}`;

    // Sequential number badge for test/reference
    const seqNum = String(naturalIndex).padStart(2, '0');

    li.innerHTML = `
      <!-- Queue Station Badge -->
      ${badgeHtml}
      <span class="task-seq-badge hidden">#${seqNum}</span>

      <!-- Custom Checkbox -->
      <label class="task-checkbox-wrap" aria-label="Mark task complete">
        <input 
          type="checkbox" 
          class="task-checkbox-input" 
          ${isCompleted ? 'checked' : ''}
          data-id="${task.id}"
        >
        <span class="task-checkbox-custom">
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="3">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        </span>
      </label>

      <!-- Task Main Content -->
      <div class="task-main" id="taskMain_${task.id}">
        <span class="task-text">${escapeHtml(task.text)}</span>
        <div class="task-meta-row">
          <span class="task-expiry-badge" data-created="${task.createdAt}">
            ⏳ ${formatTimeRemaining(task.createdAt)}
          </span>
        </div>
      </div>

      <!-- Queue Reordering & Actions -->
      <div class="task-actions" id="taskActions_${task.id}">
        <!-- Reorder in Queue -->
        <div class="queue-reorder-group" title="Adjust position in queue">
          <button 
            class="queue-reorder-btn btn-queue-up" 
            type="button" 
            title="Move earlier in queue" 
            aria-label="Move earlier in queue"
            ${index === 0 ? 'disabled' : ''}
            data-id="${task.id}"
          >▲</button>
          <button 
            class="queue-reorder-btn btn-queue-down" 
            type="button" 
            title="Move later in queue" 
            aria-label="Move later in queue"
            ${index === filtered.length - 1 ? 'disabled' : ''}
            data-id="${task.id}"
          >▼</button>
        </div>

        <button 
          class="task-action-btn edit-btn" 
          type="button" 
          title="Edit task" 
          aria-label="Edit task"
          data-id="${task.id}"
        >
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 20h9"></path>
            <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
          </svg>
        </button>

        <button 
          class="task-action-btn delete-btn" 
          type="button" 
          title="Delete task" 
          aria-label="Delete task"
          data-id="${task.id}"
        >
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="3 6 5 6 21 6"></polyline>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
          </svg>
        </button>
      </div>
    `;

    // Listeners
    const checkbox = li.querySelector('.task-checkbox-input');
    checkbox.addEventListener('change', () => {
      toggleTaskCompletion(task.id, li);
    });

    const editBtn = li.querySelector('.edit-btn');
    editBtn.addEventListener('click', () => {
      enterTaskEditMode(task, li);
    });

    const deleteBtn = li.querySelector('.delete-btn');
    deleteBtn.addEventListener('click', () => {
      deleteTask(task.id);
    });

    const btnUp = li.querySelector('.btn-queue-up');
    if (btnUp) {
      btnUp.addEventListener('click', () => moveTaskInQueue(task.id, 'up'));
    }

    const btnDown = li.querySelector('.btn-queue-down');
    if (btnDown) {
      btnDown.addEventListener('click', () => moveTaskInQueue(task.id, 'down'));
    }

    taskList.appendChild(li);
  });
}

function enterTaskEditMode(task, cardElement) {
  const taskMain = cardElement.querySelector(`#taskMain_${task.id}`);
  const taskActions = cardElement.querySelector(`#taskActions_${task.id}`);

  if (!taskMain || !taskActions) return;

  const previousMainHtml = taskMain.innerHTML;
  const previousActionsHtml = taskActions.innerHTML;

  taskMain.innerHTML = `
    <div class="task-edit-row">
      <input 
        type="text" 
        class="task-edit-input" 
        id="inputEdit_${task.id}" 
        value="${escapeHtml(task.text)}"
        maxlength="150"
      >
    </div>
  `;

  taskActions.innerHTML = `
    <button class="btn-edit-save" id="btnSave_${task.id}" title="Save changes" aria-label="Save changes">
      ✓
    </button>
    <button class="btn-edit-cancel" id="btnCancel_${task.id}" title="Cancel editing" aria-label="Cancel editing">
      ✕
    </button>
  `;

  const editInput = cardElement.querySelector(`#inputEdit_${task.id}`);
  const saveBtn = cardElement.querySelector(`#btnSave_${task.id}`);
  const cancelBtn = cardElement.querySelector(`#btnCancel_${task.id}`);

  editInput.focus();
  editInput.select();

  const handleSave = () => {
    const success = saveTaskEdit(task.id, editInput.value);
    if (!success) {
      editInput.focus();
    }
  };

  const handleCancel = () => {
    taskMain.innerHTML = previousMainHtml;
    taskActions.innerHTML = previousActionsHtml;
    renderTaskList();
  };

  saveBtn.addEventListener('click', handleSave);
  cancelBtn.addEventListener('click', handleCancel);

  editInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleCancel();
    }
  });
}

/* ============================================================================
   13. DASHBOARD METRICS & PROGRESS UPDATER
   ============================================================================ */

function updateStats() {
  const total = taskItems.length;
  const completed = taskItems.filter(t => t.completed).length;
  const active = total - completed;
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

  if (statTotal) statTotal.textContent = total;
  if (statActive) statActive.textContent = active;
  if (statCompleted) statCompleted.textContent = completed;
  if (statPercentage) statPercentage.textContent = `${percentage}%`;

  if (progressBarFill) {
    progressBarFill.style.width = `${percentage}%`;
    progressBarFill.setAttribute('aria-valuenow', percentage);
  }

  if (filterCountAll) filterCountAll.textContent = total;
  if (filterCountActive) filterCountActive.textContent = active;
  if (filterCountCompleted) filterCountCompleted.textContent = completed;
}

/* ============================================================================
   14. MODAL MANAGEMENT (Onboarding & Settings)
   ============================================================================ */

function initOnboarding() {
  if (!onboardingModal) return;

  const avatarOptions = onboardingModal.querySelectorAll('.avatar-option');
  avatarOptions.forEach(opt => {
    opt.addEventListener('click', () => {
      avatarOptions.forEach(o => o.classList.remove('selected'));
      opt.classList.add('selected');
    });
  });

  onboardingForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const enteredName = userNameInput.value.trim();

    if (!enteredName) {
      if (nameError) nameError.textContent = 'Please enter your name to personalize Taskora.';
      userNameInput.focus();
      return;
    }

    const selectedAvatar = onboardingForm.elements['avatarChoice'].value || 'boy';

    currentUser = {
      name: enteredName,
      avatar: selectedAvatar,
      soundEnabled: true,
      expiryMode: 'standard'
    };
    saveUserProfile(currentUser);

    onboardingModal.classList.add('hidden');

    updatePersonalizedHeaders();
    updateCompanionAvatar('idle');

    playSignatureLaunchAnimation();
  });
}

function openSettingsModal() {
  if (!settingsModal) return;

  if (editNameInput) editNameInput.value = currentUser.name;
  if (currentUser.avatar === 'girl') {
    if (settingsAvatarGirl) settingsAvatarGirl.checked = true;
  } else {
    if (settingsAvatarBoy) settingsAvatarBoy.checked = true;
  }

  if (expiryModeSelect) expiryModeSelect.value = currentUser.expiryMode;
  if (soundSettingToggle) soundSettingToggle.checked = currentUser.soundEnabled;

  settingsModal.classList.remove('hidden');
}

function closeSettingsModal() {
  if (settingsModal) settingsModal.classList.add('hidden');
}

/* ============================================================================
   15. INITIALIZATION & EVENT LISTENERS
   ============================================================================ */

function setupEventListeners() {
  setupAvatarInteractions();

  if (addTaskForm) {
    addTaskForm.addEventListener('submit', (e) => {
      e.preventDefault();
      addTask(taskTextInput.value);
    });
  }

  filterTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      filterTabs.forEach(t => {
        t.classList.remove('active');
        t.setAttribute('aria-selected', 'false');
      });
      tab.classList.add('active');
      tab.setAttribute('aria-selected', 'true');
      currentFilter = tab.getAttribute('data-filter') || 'all';
      renderTaskList();
    });
  });

  if (soundToggleBtn) {
    soundToggleBtn.addEventListener('click', () => {
      currentUser.soundEnabled = !currentUser.soundEnabled;
      saveUserProfile(currentUser);
      updateSoundIcons();
      showToast(currentUser.soundEnabled ? 'Chime sound effects enabled.' : 'Sound effects muted.', 'info');
    });
  }

  if (settingsBtn) {
    settingsBtn.addEventListener('click', openSettingsModal);
  }

  if (closeSettingsBtn) closeSettingsBtn.addEventListener('click', closeSettingsModal);
  if (cancelSettingsBtn) cancelSettingsBtn.addEventListener('click', closeSettingsModal);

  if (replayIntroBtn) {
    replayIntroBtn.addEventListener('click', () => {
      closeSettingsModal();
      playSignatureLaunchAnimation();
    });
  }

  const resetProfileBtn = document.getElementById('resetProfileBtn');
  if (resetProfileBtn) {
    resetProfileBtn.addEventListener('click', () => {
      // Clear saved profile and intro flag from storage
      localStorage.removeItem(STORAGE_KEYS.USER);
      sessionStorage.removeItem(STORAGE_KEYS.INTRO_SEEN);
      currentUser = null;

      closeSettingsModal();

      // Reset onboarding input and re-open onboarding screen
      if (userNameInput) {
        userNameInput.value = '';
        userNameInput.focus();
      }
      if (nameError) nameError.textContent = '';
      if (onboardingModal) {
        onboardingModal.classList.remove('hidden');
      }

      showToast('Profile reset. Enter your preferred name to get started!', 'info');
    });
  }

  if (settingsForm) {
    settingsForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const updatedName = editNameInput.value.trim();

      if (!updatedName) {
        showToast('Name cannot be empty.', 'warning');
        return;
      }

      const selectedAvatar = settingsForm.elements['settingsAvatar'].value || 'boy';
      const selectedExpiry = expiryModeSelect ? expiryModeSelect.value : 'standard';
      const soundEnabled = soundSettingToggle ? soundSettingToggle.checked : true;

      currentUser.name = updatedName;
      currentUser.avatar = selectedAvatar;
      currentUser.expiryMode = selectedExpiry;
      currentUser.soundEnabled = soundEnabled;

      saveUserProfile(currentUser);
      closeSettingsModal();

      updatePersonalizedHeaders();
      updateCompanionAvatar('idle');
      updateSoundIcons();
      renderTaskList();
      updateStats();

      showToast('Settings saved successfully.', 'success');
      updateCompanionMessage(`Updated! Looking sharp, ${currentUser.name}.`);
    });
  }

  window.addEventListener('click', (e) => {
    if (e.target === settingsModal) {
      closeSettingsModal();
    }
  });

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && settingsModal && !settingsModal.classList.contains('hidden')) {
      closeSettingsModal();
    }
  });
}

function updateSoundIcons() {
  if (!soundIconOn || !soundIconOff) return;
  if (currentUser.soundEnabled) {
    soundIconOn.classList.remove('hidden');
    soundIconOff.classList.add('hidden');
  } else {
    soundIconOn.classList.add('hidden');
    soundIconOff.classList.remove('hidden');
  }
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/* ============================================================================
   16. APPLICATION BOOTSTRAP
   ============================================================================ */

document.addEventListener('DOMContentLoaded', () => {
  setupEventListeners();

  if (!currentUser) {
    initOnboarding();
  } else {
    if (onboardingModal) onboardingModal.classList.add('hidden');
    updatePersonalizedHeaders();
    updateCompanionAvatar('idle');
    updateSoundIcons();
    renderTaskList();
    updateStats();

    const introPlayedThisSession = sessionStorage.getItem(STORAGE_KEYS.INTRO_SEEN);
    if (!introPlayedThisSession) {
      playSignatureLaunchAnimation();
    }
  }

  checkTaskExpiration();

  expiryCheckIntervalId = setInterval(() => {
    checkTaskExpiration();
  }, 15000);
});
