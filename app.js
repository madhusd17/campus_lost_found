/**
 * Campus Lost-and-Found AI Matcher - Core Application Logic
 * Features:
 *  1. LocalStorage Persistence (CRUD + Seed Data)
 *  2. Authentication & Student Profile Management
 *  3. Search & Multi-criteria Filtering
 *  4. Intelligent AI Multi-factor Compatibility Scoring Engine
 *  5. Dynamic UI Rendering & Modals
 */

// ============================================================================
// 1. CONSTANTS & INITIAL STATE
// ============================================================================

const STORAGE_KEY_ITEMS = 'campusFindItems';
const STORAGE_KEY_USER = 'campusFindUser';

// Backend API URL: relative if served via Flask on :5000, or absolute if opened from file://
const API_BASE = window.location.origin.includes(':5000') 
  ? '/api' 
  : 'http://127.0.0.1:5000/api';

let isBackendOnline = false;

// Seed demo items so beginners can test the AI matcher immediately
const INITIAL_DEMO_ITEMS = [
  {
    id: 'item_101',
    type: 'lost',
    title: 'Midnight Blue Apple MacBook Air M2',
    category: 'Electronics',
    color: 'Blue',
    location: 'Main Library',
    date: '2026-10-18',
    description: 'Apple MacBook Air 13-inch in dark blue cover. Has a GitHub octocat sticker and NASA logo sticker on the lid.',
    contactName: 'Sarah Jenkins',
    contactInfo: 's.jenkins@campus.edu',
    imageUrl: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=600&q=80',
    isReunited: false,
    createdAt: '2026-10-18T14:30:00.000Z'
  },
  {
    id: 'item_102',
    type: 'found',
    title: 'Apple Laptop in Dark Blue Case',
    category: 'Electronics',
    color: 'Blue',
    location: 'Main Library',
    date: '2026-10-19',
    description: 'Found left behind on 2nd-floor quiet study table 14. Midnight blue Apple laptop with developer stickers.',
    contactName: 'Library Security Desk',
    contactInfo: 'library-help@campus.edu',
    imageUrl: 'https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?auto=format&fit=crop&w=600&q=80',
    isReunited: false,
    createdAt: '2026-10-19T09:15:00.000Z'
  },
  {
    id: 'item_103',
    type: 'lost',
    title: 'Student ID Card & Bus Pass',
    category: 'Cards & IDs',
    color: 'White',
    location: 'Student Cafeteria',
    date: '2026-10-20',
    description: 'Stanford student ID card in clear plastic pouch attached to a blue lanyard with student name Alex M.',
    contactName: 'Alex Morgan',
    contactInfo: 'alex.m@campus.edu',
    imageUrl: '',
    isReunited: false,
    createdAt: '2026-10-20T12:00:00.000Z'
  },
  {
    id: 'item_104',
    type: 'found',
    title: 'University ID Card with Blue Lanyard',
    category: 'Cards & IDs',
    color: 'White',
    location: 'Student Cafeteria',
    date: '2026-10-20',
    description: 'Student ID card picked up near the south beverage station. Clear holder with blue lanyard.',
    contactName: 'Cafeteria Manager',
    contactInfo: 'dining-services@campus.edu',
    imageUrl: '',
    isReunited: false,
    createdAt: '2026-10-20T13:45:00.000Z'
  },
  {
    id: 'item_105',
    type: 'lost',
    title: 'Black North Face Gym Duffel Bag',
    category: 'Bags & Backpacks',
    color: 'Black',
    location: 'Sports Complex & Gym',
    date: '2026-10-16',
    description: 'Black medium-size duffel bag containing gym gloves, Nike trainers (size 10), and a stainless water bottle.',
    contactName: 'Marcus Cole',
    contactInfo: '555-019-3829',
    imageUrl: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=600&q=80',
    isReunited: false,
    createdAt: '2026-10-16T18:00:00.000Z'
  },
  {
    id: 'item_106',
    type: 'found',
    title: 'Black Sports Duffel Bag',
    category: 'Bags & Backpacks',
    color: 'Black',
    location: 'Sports Complex & Gym',
    date: '2026-10-17',
    description: 'Found inside men locker room bench after basketball practice. Contains footwear and workout gear.',
    contactName: 'Gym Front Desk',
    contactInfo: 'gym-desk@campus.edu',
    imageUrl: '',
    isReunited: false,
    createdAt: '2026-10-17T08:30:00.000Z'
  },
  {
    id: 'item_107',
    type: 'lost',
    title: 'Gold Rim Reading Glasses in Case',
    category: 'Other',
    color: 'Gold / Yellow',
    location: 'Auditorium / Lecture Halls',
    date: '2026-10-15',
    description: 'Round wireframe prescription glasses kept in a brown leather clip case. Ray-Ban model.',
    contactName: 'Prof. Vance',
    contactInfo: 'vance@campus.edu',
    imageUrl: '',
    isReunited: false,
    createdAt: '2026-10-15T16:20:00.000Z'
  }
];

// Active State
let allItems = [];
let activeStatusFilter = 'all'; // 'all' | 'lost' | 'found' | 'resolved'
let activeCategoryFilter = 'all';
let activeLocationFilter = 'all';
let activeSearchQuery = '';

// Category Icon Mapping for Cards
const CATEGORY_ICONS = {
  'Electronics': 'fa-solid fa-laptop',
  'Cards & IDs': 'fa-solid fa-id-card',
  'Bags & Backpacks': 'fa-solid fa-bag-shopping',
  'Books & Stationery': 'fa-solid fa-book',
  'Keys & Accessories': 'fa-solid fa-key',
  'Clothing & Wearables': 'fa-solid fa-shirt',
  'Bottles & Tumblers': 'fa-solid fa-bottle-water',
  'Other': 'fa-solid fa-box'
};

// Common English words to ignore when comparing text similarity
const STOP_WORDS = new Set([
  'a', 'about', 'above', 'after', 'again', 'against', 'all', 'am', 'an', 'and',
  'any', 'are', 'aren\'t', 'as', 'at', 'be', 'because', 'been', 'before', 'being',
  'below', 'between', 'both', 'but', 'by', 'can', 'can\'t', 'cannot', 'could',
  'did', 'do', 'does', 'doing', 'down', 'during', 'each', 'few', 'for', 'from',
  'further', 'had', 'has', 'have', 'having', 'he', 'her', 'here', 'hers', 'herself',
  'him', 'himself', 'his', 'how', 'i', 'if', 'in', 'into', 'is', 'it', 'its',
  'itself', 'just', 'left', 'lost', 'found', 'me', 'more', 'most', 'my', 'myself',
  'no', 'nor', 'not', 'of', 'off', 'on', 'once', 'only', 'or', 'other', 'ought',
  'our', 'ours', 'ourselves', 'out', 'over', 'own', 'same', 'she', 'should',
  'so', 'some', 'such', 'than', 'that', 'the', 'their', 'theirs', 'them',
  'themselves', 'then', 'there', 'these', 'they', 'this', 'those', 'through',
  'to', 'too', 'under', 'until', 'up', 'very', 'was', 'we', 'were', 'what',
  'when', 'where', 'which', 'while', 'who', 'whom', 'why', 'with', 'would',
  'you', 'your', 'yours', 'yourself', 'yourselves'
]);

// ============================================================================
// 2. INITIALIZATION
// ============================================================================

document.addEventListener('DOMContentLoaded', async () => {
  initUserSession();
  initLocalStorage();
  initEventListeners();
  renderApp();
  // Synchronize with Python Flask SQLite Backend if online
  await syncWithBackend();
});

async function syncWithBackend() {
  try {
    const res = await fetch(`${API_BASE}/items`);
    if (res.ok) {
      const serverItems = await res.json();
      if (Array.isArray(serverItems) && serverItems.length > 0) {
        allItems = serverItems;
        isBackendOnline = true;
        saveItemsToStorage();
        renderApp();
        showToast('Connected to Python Flask SQLite backend!', 'success');
      }
    }
  } catch (err) {
    // Backend offline; works smoothly with local storage
    isBackendOnline = false;
  }
}

// Check if user is logged in
function initUserSession() {
  const userJson = localStorage.getItem(STORAGE_KEY_USER);
  const userBadge = document.getElementById('userProfileBadge');
  const navUserName = document.getElementById('navUserName');
  const navCollegeName = document.getElementById('navCollegeName');
  const logoutBtn = document.getElementById('logoutBtn');

  if (!userJson) {
    // If not logged in, redirect to login page
    window.location.href = 'login.html';
    return;
  }

  try {
    const user = JSON.parse(userJson);
    if (!user || !user.isLoggedIn) {
      window.location.href = 'login.html';
      return;
    }

    // Populate user profile info in navigation bar
    if (userBadge && navUserName && navCollegeName) {
      navUserName.textContent = user.username || 'Student';
      navCollegeName.textContent = user.college || 'Campus';
      userBadge.style.display = 'flex';
    }

    // Pre-fill contact name on report modal if empty
    const contactNameInput = document.getElementById('contactName');
    if (contactNameInput && !contactNameInput.value) {
      contactNameInput.value = user.username || '';
    }

  } catch (err) {
    localStorage.removeItem(STORAGE_KEY_USER);
    window.location.href = 'login.html';
    return;
  }

  // Logout button handler
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      if (confirm('Are you sure you want to log out of your campus account?')) {
        localStorage.removeItem(STORAGE_KEY_USER);
        window.location.href = 'login.html';
      }
    });
  }
}

// Load items from localStorage or seed initial data
function initLocalStorage() {
  const stored = localStorage.getItem(STORAGE_KEY_ITEMS);
  if (!stored) {
    allItems = [...INITIAL_DEMO_ITEMS];
    saveItemsToStorage();
  } else {
    try {
      allItems = JSON.parse(stored);
    } catch (e) {
      console.error('Failed to parse localStorage items, resetting to demo items:', e);
      allItems = [...INITIAL_DEMO_ITEMS];
      saveItemsToStorage();
    }
  }
}

function saveItemsToStorage() {
  localStorage.setItem(STORAGE_KEY_ITEMS, JSON.stringify(allItems));
}

// ============================================================================
// 3. EVENT LISTENERS
// ============================================================================

function initEventListeners() {
  // Search bar
  const searchInput = document.getElementById('searchInput');
  const clearSearchBtn = document.getElementById('clearSearchBtn');

  searchInput.addEventListener('input', (e) => {
    activeSearchQuery = e.target.value.trim().toLowerCase();
    clearSearchBtn.style.display = activeSearchQuery ? 'block' : 'none';
    renderItemsFeed();
  });

  clearSearchBtn.addEventListener('click', () => {
    searchInput.value = '';
    activeSearchQuery = '';
    clearSearchBtn.style.display = 'none';
    searchInput.focus();
    renderItemsFeed();
  });

  // Status Filter Tabs
  const statusTabs = document.getElementById('statusFilterTabs');
  statusTabs.addEventListener('click', (e) => {
    const tabBtn = e.target.closest('.tab-btn');
    if (!tabBtn) return;

    statusTabs.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    tabBtn.classList.add('active');

    activeStatusFilter = tabBtn.dataset.filter;
    renderItemsFeed();
  });

  // Category and Location Dropdown Filters
  const categoryFilter = document.getElementById('categoryFilter');
  categoryFilter.addEventListener('change', (e) => {
    activeCategoryFilter = e.target.value;
    renderItemsFeed();
  });

  const locationFilter = document.getElementById('locationFilter');
  locationFilter.addEventListener('change', (e) => {
    activeLocationFilter = e.target.value;
    renderItemsFeed();
  });

  // Reset Filters Button
  const resetFiltersBtn = document.getElementById('resetFiltersBtn');
  resetFiltersBtn.addEventListener('click', () => {
    resetAllFilters();
  });

  // "Other" Option Dropdown Handlers (reveals custom text input fields)
  setupOtherToggle('itemCategory', 'itemCategoryOther', 'Other');
  setupOtherToggle('itemColor', 'itemColorOther', 'Other');
  setupOtherToggle('itemLocation', 'itemLocationOther', 'Other');

  // Report Modal Open / Close
  const reportModal = document.getElementById('reportModal');
  const openReportModalBtn = document.getElementById('openReportModalBtn');
  const closeReportModalBtn = document.getElementById('closeReportModalBtn');
  const cancelReportBtn = document.getElementById('cancelReportBtn');
  const emptyReportBtn = document.getElementById('emptyReportBtn');

  const openReportModal = () => {
    // Set default date to today
    const dateInput = document.getElementById('itemDate');
    if (!dateInput.value) {
      dateInput.value = new Date().toISOString().split('T')[0];
    }
    reportModal.classList.add('active');
    reportModal.setAttribute('aria-hidden', 'false');
    document.getElementById('itemTitle').focus();
  };

  const closeReportModal = () => {
    reportModal.classList.remove('active');
    reportModal.setAttribute('aria-hidden', 'true');
  };

  openReportModalBtn.addEventListener('click', openReportModal);
  if (emptyReportBtn) emptyReportBtn.addEventListener('click', openReportModal);
  closeReportModalBtn.addEventListener('click', closeReportModal);
  cancelReportBtn.addEventListener('click', closeReportModal);

  // Close modal when clicking on the blurred background overlay
  reportModal.addEventListener('click', (e) => {
    if (e.target === reportModal) closeReportModal();
  });

  // Report Form Submit
  const reportForm = document.getElementById('reportForm');
  reportForm.addEventListener('submit', handleReportSubmit);

  // Match Modal Close Handlers
  const matchModal = document.getElementById('matchModal');
  const closeMatchModalBtn = document.getElementById('closeMatchModalBtn');
  const closeMatchModalFooterBtn = document.getElementById('closeMatchModalFooterBtn');

  const closeMatchModal = () => {
    matchModal.classList.remove('active');
    matchModal.setAttribute('aria-hidden', 'true');
  };

  closeMatchModalBtn.addEventListener('click', closeMatchModal);
  closeMatchModalFooterBtn.addEventListener('click', closeMatchModal);
  matchModal.addEventListener('click', (e) => {
    if (e.target === matchModal) closeMatchModal();
  });

  // Reset Demo Data Button (in footer)
  const resetSampleDataBtn = document.getElementById('resetSampleDataBtn');
  if (resetSampleDataBtn) {
    resetSampleDataBtn.addEventListener('click', async () => {
      if (confirm('Reset all items back to initial campus demo records? This will overwrite recent local changes.')) {
        if (isBackendOnline) {
          try {
            await fetch(`${API_BASE}/reset-demo`, { method: 'POST' });
            const res = await fetch(`${API_BASE}/items`);
            if (res.ok) {
              allItems = await res.json();
            }
          } catch (err) {
            allItems = [...INITIAL_DEMO_ITEMS];
          }
        } else {
          allItems = [...INITIAL_DEMO_ITEMS];
        }
        saveItemsToStorage();
        renderApp();
        showToast('Sample campus data restored!', 'success');
      }
    });
  }

  // Keyboard shortcut: close modals with ESC
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeReportModal();
      closeMatchModal();
    }
  });
}

/**
 * Connects a <select> element to a custom <input> field revealed when "Other" is chosen
 */
function setupOtherToggle(selectId, inputId, triggerValue) {
  const selectEl = document.getElementById(selectId);
  const inputEl = document.getElementById(inputId);

  if (!selectEl || !inputEl) return;

  selectEl.addEventListener('change', () => {
    if (selectEl.value === triggerValue) {
      inputEl.style.display = 'block';
      inputEl.required = true;
      inputEl.focus();
    } else {
      inputEl.style.display = 'none';
      inputEl.required = false;
      inputEl.value = '';
    }
  });
}

function resetAllFilters() {
  activeStatusFilter = 'all';
  activeCategoryFilter = 'all';
  activeLocationFilter = 'all';
  activeSearchQuery = '';

  document.getElementById('searchInput').value = '';
  document.getElementById('clearSearchBtn').style.display = 'none';
  document.getElementById('categoryFilter').value = 'all';
  document.getElementById('locationFilter').value = 'all';

  const statusTabs = document.getElementById('statusFilterTabs');
  statusTabs.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.filter === 'all');
  });

  renderItemsFeed();
  showToast('Filters reset to default view.');
}

// ============================================================================
// 4. REPORT FORM SUBMISSION
// ============================================================================

async function handleReportSubmit(e) {
  e.preventDefault();

  const form = document.getElementById('reportForm');
  const reportType = form.querySelector('input[name="itemType"]:checked').value;
  const title = document.getElementById('itemTitle').value.trim();

  // Handle Category (custom "Other" check)
  const categorySelect = document.getElementById('itemCategory');
  const categoryOtherInput = document.getElementById('itemCategoryOther');
  let category = categorySelect.value;
  if (category === 'Other' && categoryOtherInput.value.trim()) {
    category = categoryOtherInput.value.trim();
  }

  // Handle Color (custom "Other" check)
  const colorSelect = document.getElementById('itemColor');
  const colorOtherInput = document.getElementById('itemColorOther');
  let color = colorSelect.value;
  if (color === 'Other' && colorOtherInput.value.trim()) {
    color = colorOtherInput.value.trim();
  }

  // Handle Location (custom "Other" check)
  const locationSelect = document.getElementById('itemLocation');
  const locationOtherInput = document.getElementById('itemLocationOther');
  let location = locationSelect.value;
  if (location === 'Other' && locationOtherInput.value.trim()) {
    location = locationOtherInput.value.trim();
  }

  const date = document.getElementById('itemDate').value;
  const description = document.getElementById('itemDescription').value.trim();
  const contactName = document.getElementById('contactName').value.trim();
  const contactInfo = document.getElementById('contactInfo').value.trim();
  const imageUrl = document.getElementById('itemImage').value.trim();

  // Basic Validation
  if (!title || !category || !color || !location || !date || !description || !contactName || !contactInfo) {
    showToast('Please fill in all required fields.', 'error');
    return;
  }

  // Create new item object
  const newItem = {
    id: 'item_' + Date.now(),
    type: reportType,
    title,
    category,
    color,
    location,
    date,
    description,
    contactName,
    contactInfo,
    imageUrl: imageUrl || '',
    isReunited: false,
    createdAt: new Date().toISOString()
  };

  // Add to beginning of items list locally
  allItems.unshift(newItem);
  saveItemsToStorage();

  // If backend is online, persist to SQLite database
  if (isBackendOnline) {
    try {
      await fetch(`${API_BASE}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newItem)
      });
    } catch (err) {
      console.warn('Backend item sync failed, saved locally:', err);
    }
  }

  // Reset form and close modal
  form.reset();
  categoryOtherInput.style.display = 'none';
  colorOtherInput.style.display = 'none';
  locationOtherInput.style.display = 'none';
  document.getElementById('reportModal').classList.remove('active');

  // Re-render dashboard & list
  renderApp();
  showToast(`${reportType === 'lost' ? 'Lost' : 'Found'} item reported successfully!`, 'success');

  // Smart proactive check: if reported a lost item, check if high match already exists
  if (reportType === 'lost') {
    const candidateMatches = calculateMatchesForItem(newItem);
    if (candidateMatches.length > 0 && candidateMatches[0].score >= 70) {
      setTimeout(() => {
        showToast(`AI Matcher Alert: Found a high-probability match (${candidateMatches[0].score}%)!`, 'info');
      }, 1200);
    }
  }
}

// ============================================================================
// 5. AI MATCHING & SCORING ENGINE
// ============================================================================

/**
 * Calculates compatibility score between a source item and all candidates of the opposite type.
 * Multi-factor Scoring Weights:
 *  - Category Match: 30%
 *  - Keyword NLP Overlap (Title + Description): 30%
 *  - Campus Location Match: 15%
 *  - Primary Color Match: 15%
 *  - Date Timeline Consistency: 10%
 *
 * Total Score: 0% to 100%
 */
function calculateMatchesForItem(sourceItem) {
  // Candidate items must be of opposite type (lost vs found)
  const targetOppositeType = sourceItem.type === 'lost' ? 'found' : 'lost';

  const candidates = allItems.filter(item => {
    return item.id !== sourceItem.id && item.type === targetOppositeType;
  });

  const scoredMatches = candidates.map(candidate => {
    let score = 0;
    const reasons = [];

    // --- Factor 1: Category Match (Max 30 pts) ---
    if (sourceItem.category && candidate.category) {
      if (sourceItem.category.toLowerCase() === candidate.category.toLowerCase()) {
        score += 30;
        reasons.push({ text: `Same category: ${sourceItem.category}`, pts: '+30' });
      } else if (
        sourceItem.category.toLowerCase().includes(candidate.category.toLowerCase()) ||
        candidate.category.toLowerCase().includes(sourceItem.category.toLowerCase())
      ) {
        score += 15;
        reasons.push({ text: 'Related category type', pts: '+15' });
      }
    }

    // --- Factor 2: Keyword NLP Overlap on Title & Description (Max 30 pts) ---
    const sourceTokens = extractSignificantWords(sourceItem.title + ' ' + sourceItem.description);
    const candidateTokens = extractSignificantWords(candidate.title + ' ' + candidate.description);

    const commonWords = [];
    sourceTokens.forEach(word => {
      if (candidateTokens.has(word)) {
        commonWords.push(word);
      }
    });

    if (commonWords.length > 0) {
      // Jaccard similarity & overlap calculation
      const minTokens = Math.min(sourceTokens.size, candidateTokens.size);
      const overlapRatio = commonWords.length / (minTokens || 1);
      const keywordPts = Math.min(30, Math.round(overlapRatio * 30));

      score += keywordPts;
      const previewWords = commonWords.slice(0, 3).map(w => `"${w}"`).join(', ');
      reasons.push({ 
        text: `Matching keywords (${commonWords.length}): ${previewWords}`, 
        pts: `+${keywordPts}` 
      });
    }

    // --- Factor 3: Campus Location Proximity (Max 15 pts) ---
    if (sourceItem.location && candidate.location) {
      const locA = sourceItem.location.toLowerCase();
      const locB = candidate.location.toLowerCase();

      if (locA === locB) {
        score += 15;
        reasons.push({ text: `Exact campus location: ${sourceItem.location}`, pts: '+15' });
      } else if (locA.includes(locB) || locB.includes(locA)) {
        score += 10;
        reasons.push({ text: 'Nearby campus zone', pts: '+10' });
      }
    }

    // --- Factor 4: Primary Color Match (Max 15 pts) ---
    if (sourceItem.color && candidate.color) {
      const colorA = sourceItem.color.toLowerCase();
      const colorB = candidate.color.toLowerCase();

      if (colorA === colorB) {
        score += 15;
        reasons.push({ text: `Matching color: ${sourceItem.color}`, pts: '+15' });
      } else if (
        candidate.description.toLowerCase().includes(colorA) ||
        sourceItem.description.toLowerCase().includes(colorB)
      ) {
        score += 10;
        reasons.push({ text: 'Color reference in description', pts: '+10' });
      }
    }

    // --- Factor 5: Date Timeline Plausibility (Max 10 pts) ---
    if (sourceItem.date && candidate.date) {
      const lostDateStr = sourceItem.type === 'lost' ? sourceItem.date : candidate.date;
      const foundDateStr = sourceItem.type === 'found' ? sourceItem.date : candidate.date;

      const dateLost = new Date(lostDateStr);
      const dateFound = new Date(foundDateStr);

      const diffDays = Math.round((dateFound - dateLost) / (1000 * 60 * 60 * 24));

      // Items found on or slightly after being lost is plausible
      if (diffDays >= 0 && diffDays <= 3) {
        score += 10;
        reasons.push({ text: `Timeline match (found within ${diffDays === 0 ? 'same day' : diffDays + ' days'})`, pts: '+10' });
      } else if (diffDays > 3 && diffDays <= 14) {
        score += 7;
        reasons.push({ text: `Timeline plausible (found within ${diffDays} days)`, pts: '+7' });
      } else if (diffDays === -1) {
        // 1-day margin for reporting lag
        score += 4;
        reasons.push({ text: 'Close date range (reporting margin)', pts: '+4' });
      }
    }

    // Cap total score between 0% and 100%
    const finalScore = Math.min(100, Math.max(0, score));

    return {
      candidate,
      score: finalScore,
      reasons
    };
  });

  // Sort descending by highest score
  return scoredMatches.sort((a, b) => b.score - a.score);
}

/**
 * Tokenizes text, strips punctuation, eliminates stop words, and returns a Set of lowercase tokens
 */
function extractSignificantWords(text) {
  if (!text) return new Set();

  const words = text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ') // Remove punctuation
    .split(/\s+/)
    .filter(word => word.length >= 3 && !STOP_WORDS.has(word));

  return new Set(words);
}

// ============================================================================
// 6. MODAL: AI MATCH VIEWER DISPLAY
// ============================================================================

function openMatchModal(itemId) {
  const sourceItem = allItems.find(item => item.id === itemId);
  if (!sourceItem) return;

  const matches = calculateMatchesForItem(sourceItem);

  // Render Target Item Summary Banner
  const summaryContainer = document.getElementById('targetItemSummary');
  summaryContainer.innerHTML = `
    <div class="target-header">
      <span class="target-label">Target Item to Match</span>
      <span class="badge ${sourceItem.type === 'lost' ? 'badge-lost' : 'badge-found'}">
        ${sourceItem.type.toUpperCase()}
      </span>
    </div>
    <h3 class="target-title">${escapeHtml(sourceItem.title)}</h3>
    <div class="target-meta-row">
      <span><i class="${CATEGORY_ICONS[sourceItem.category] || 'fa-solid fa-tag'}"></i> ${escapeHtml(sourceItem.category)}</span>
      <span><i class="fa-solid fa-palette"></i> ${escapeHtml(sourceItem.color)}</span>
      <span><i class="fa-solid fa-location-dot"></i> ${escapeHtml(sourceItem.location)}</span>
      <span><i class="fa-solid fa-calendar"></i> ${sourceItem.date}</span>
    </div>
  `;

  // Render Candidate Matches
  const matchesContainer = document.getElementById('matchesContainer');
  const matchCountBadge = document.getElementById('matchCandidateCount');
  matchCountBadge.textContent = matches.length;

  if (matches.length === 0) {
    matchesContainer.innerHTML = `
      <div class="empty-state" style="padding: 2rem; margin: 1rem 0;">
        <i class="fa-solid fa-magnifying-glass-chart empty-icon" style="font-size: 1.5rem; width: 48px; height: 48px;"></i>
        <h4>No opposite items reported yet</h4>
        <p style="font-size: 0.85rem;">As new ${sourceItem.type === 'lost' ? 'found' : 'lost'} items are reported, the AI engine will automatically score them here.</p>
      </div>
    `;
  } else {
    matchesContainer.innerHTML = matches.map(match => {
      const item = match.candidate;
      const score = match.score;

      // Color coding based on score threshold
      let scoreClass = 'score-low';
      let scoreLabel = 'Low Match';
      if (score >= 75) {
        scoreClass = 'score-high';
        scoreLabel = 'High Probability';
      } else if (score >= 50) {
        scoreClass = 'score-medium';
        scoreLabel = 'Possible Match';
      }

      return `
        <div class="match-card">
          <div class="match-card-top">
            <div class="match-card-info">
              <span class="badge ${item.type === 'lost' ? 'badge-lost' : 'badge-found'}">
                ${item.type.toUpperCase()} ITEM
              </span>
              <h4 class="match-card-title">${escapeHtml(item.title)}</h4>
              <div class="card-meta-chips" style="margin-top: 0.25rem;">
                <span class="meta-chip"><i class="fa-solid fa-location-dot"></i> ${escapeHtml(item.location)}</span>
                <span class="meta-chip"><i class="fa-solid fa-palette"></i> ${escapeHtml(item.color)}</span>
                <span class="meta-chip"><i class="fa-solid fa-calendar"></i> ${item.date}</span>
              </div>
            </div>

            <!-- Score Pill -->
            <div class="match-score-badge ${scoreClass}">
              <i class="fa-solid fa-wand-magic-sparkles"></i>
              <span>${score}%</span>
            </div>
          </div>

          <p class="card-desc" style="-webkit-line-clamp: 3;">${escapeHtml(item.description)}</p>

          <!-- Match Reasons Explanations -->
          <div class="match-reasons-box">
            <span class="match-reasons-title">AI Compatibility Analysis:</span>
            <div class="match-reason-tags">
              ${match.reasons.length > 0 
                ? match.reasons.map(r => `
                    <span class="reason-tag tag-match">
                      <i class="fa-solid fa-check"></i> ${escapeHtml(r.text)} <strong>(${r.pts})</strong>
                    </span>
                  `).join('')
                : '<span class="reason-tag">Low token overlap between records</span>'
              }
            </div>
          </div>

          <!-- Contact box -->
          <div class="card-contact" style="margin-top: 0;">
            <span>Reported by: <strong>${escapeHtml(item.contactName)}</strong> &bull; Contact: <strong>${escapeHtml(item.contactInfo)}</strong></span>
          </div>

          <!-- Dual Reunite Action Row -->
          <div class="match-card-actions">
            ${sourceItem.type === 'lost'
              ? (item.isReunited && sourceItem.isReunited && sourceItem.matchedWithId === item.id)
                ? `
                  <span class="paired-with-badge"><i class="fa-solid fa-circle-check"></i> Already Paired &amp; Reunited</span>
                  <button class="btn btn-secondary btn-sm" onclick="unreuniteItemsPair('${sourceItem.id}', '${item.id}')">
                    <i class="fa-solid fa-rotate-left"></i> Undo Reunite
                  </button>
                `
                : `
                  <button class="btn btn-reunite-pair btn-sm" onclick="reuniteItemsPair('${sourceItem.id}', '${item.id}')">
                    <i class="fa-solid fa-circle-check"></i> This is My Item! (Reunite Both)
                  </button>
                  <span class="form-hint" style="margin: 0;">Marks both lost &amp; found items as reunited</span>
                `
              : `
                <span class="reunite-notice-tag">
                  <i class="fa-solid fa-shield-halved"></i> To confirm reunion, the person who lost this item must verify this match.
                </span>
              `
            }
          </div>
        </div>
      `;
    }).join('');
  }

  // Open the modal
  const matchModal = document.getElementById('matchModal');
  matchModal.classList.add('active');
  matchModal.setAttribute('aria-hidden', 'false');
}

// ============================================================================
// 7. RENDERING & UI UPDATES
// ============================================================================

function renderApp() {
  updateStatsDashboard();
  renderItemsFeed();
}

function updateStatsDashboard() {
  const lostCount = allItems.filter(i => i.type === 'lost' && !i.isReunited).length;
  const foundCount = allItems.filter(i => i.type === 'found' && !i.isReunited).length;
  const reunitedCount = allItems.filter(i => i.isReunited).length;

  document.getElementById('statLostCount').textContent = lostCount;
  document.getElementById('statFoundCount').textContent = foundCount;
  document.getElementById('statReunitedCount').textContent = reunitedCount;
}

function renderItemsFeed() {
  const itemsGrid = document.getElementById('itemsGrid');
  const emptyState = document.getElementById('emptyState');
  const resultsBadge = document.getElementById('resultsCountBadge');

  // Filter items based on active controls
  const filtered = allItems.filter(item => {
    // 1. Status Filter Tab
    if (activeStatusFilter === 'lost' && (item.type !== 'lost' || item.isReunited)) return false;
    if (activeStatusFilter === 'found' && (item.type !== 'found' || item.isReunited)) return false;
    if (activeStatusFilter === 'resolved' && !item.isReunited) return false;

    // 2. Category Filter
    if (activeCategoryFilter !== 'all' && item.category !== activeCategoryFilter) return false;

    // 3. Location Filter
    if (activeLocationFilter !== 'all' && item.location !== activeLocationFilter) return false;

    // 4. Keyword Search Query
    if (activeSearchQuery) {
      const searchTarget = `${item.title} ${item.description} ${item.location} ${item.category} ${item.color} ${item.contactName}`.toLowerCase();
      if (!searchTarget.includes(activeSearchQuery)) return false;
    }

    return true;
  });

  resultsBadge.textContent = `Showing ${filtered.length} item${filtered.length === 1 ? '' : 's'}`;

  if (filtered.length === 0) {
    itemsGrid.innerHTML = '';
    emptyState.style.display = 'flex';
    return;
  }

  emptyState.style.display = 'none';

  itemsGrid.innerHTML = filtered.map(item => {
    const isLost = item.type === 'lost';
    const statusBadge = item.isReunited
      ? '<span class="badge badge-reunited"><i class="fa-solid fa-circle-check"></i> Reunited</span>'
      : isLost
        ? '<span class="badge badge-lost"><i class="fa-solid fa-circle-exclamation"></i> Lost</span>'
        : '<span class="badge badge-found"><i class="fa-solid fa-hand-holding-heart"></i> Found</span>';

    const categoryIcon = CATEGORY_ICONS[item.category] || 'fa-solid fa-tag';

    // Optional image or category fallback illustration
    const mediaHtml = item.imageUrl
      ? `<div class="card-media"><img src="${escapeHtml(item.imageUrl)}" alt="${escapeHtml(item.title)}" loading="lazy" onerror="this.parentElement.innerHTML='<i class=\\'${categoryIcon} card-placeholder-icon\\'></i>';" /></div>`
      : `<div class="card-media"><i class="${categoryIcon} card-placeholder-icon"></i></div>`;

    return `
      <article class="item-card ${item.isReunited ? 'is-reunited' : ''}" data-id="${item.id}">
        <div class="card-top-bar">
          ${statusBadge}
          <span class="badge badge-category">
            <i class="${categoryIcon}"></i> ${escapeHtml(item.category)}
          </span>
        </div>

        ${mediaHtml}

        <div class="card-body">
          <h3 class="card-title">${escapeHtml(item.title)}</h3>

          <div class="card-meta-chips">
            <span class="meta-chip" title="Location"><i class="fa-solid fa-location-dot"></i> ${escapeHtml(item.location)}</span>
            <span class="meta-chip" title="Color"><i class="fa-solid fa-palette"></i> ${escapeHtml(item.color)}</span>
            <span class="meta-chip" title="Date Reported"><i class="fa-solid fa-calendar"></i> ${item.date}</span>
          </div>

          <p class="card-desc">${escapeHtml(item.description)}</p>

          ${item.reunitedWithTitle 
            ? `<div class="paired-with-badge"><i class="fa-solid fa-link"></i> Reunited with: <strong>${escapeHtml(item.reunitedWithTitle)}</strong></div>`
            : ''
          }

          <div class="card-contact">
            <span>Reported by: <strong>${escapeHtml(item.contactName)}</strong></span>
            <span>Reach at: <strong>${escapeHtml(item.contactInfo)}</strong></span>
          </div>
        </div>

        <div class="card-actions">
          <button class="btn btn-ai btn-sm" onclick="openMatchModal('${item.id}')" title="Run AI match analysis">
            <i class="fa-solid fa-wand-magic-sparkles"></i>
            <span>AI Matches</span>
          </button>

          <div class="card-actions-right">
            ${isLost 
              ? `
                <button 
                  class="action-icon-btn btn-resolve" 
                  onclick="handleLostItemReunite('${item.id}')" 
                  title="${item.isReunited ? 'Re-open item' : 'Confirm match & reunite with found item'}"
                  aria-label="Reunite lost item"
                >
                  <i class="fa-solid ${item.isReunited ? 'fa-rotate-left' : 'fa-circle-check'}"></i>
                </button>
              `
              : item.isReunited
                ? `
                  <span class="paired-with-badge" title="Reunited with matched lost item">
                    <i class="fa-solid fa-circle-check"></i> Reunited
                  </span>
                `
                : `
                  <button 
                    class="action-icon-btn" 
                    onclick="showFoundReuniteNotice()" 
                    title="Awaiting verification by the person who lost the item"
                    aria-label="Awaiting owner verification"
                  >
                    <i class="fa-solid fa-clock" style="color: #d97706;"></i>
                  </button>
                `
            }
            <button 
              class="action-icon-btn btn-delete" 
              onclick="deleteItem('${item.id}')" 
              title="Delete item report"
              aria-label="Delete report"
            >
              <i class="fa-solid fa-trash-can"></i>
            </button>
          </div>
        </div>
      </article>
    `;
  }).join('');
}

// ============================================================================
// 8. ITEM ACTIONS (DUAL REUNITED, DELETE, VERIFICATION)
// ============================================================================

window.handleLostItemReunite = function(itemId) {
  const lostItem = allItems.find(i => i.id === itemId);
  if (!lostItem) return;

  // If already reunited, prompt to re-open both
  if (lostItem.isReunited) {
    if (confirm(`Do you want to re-open "${lostItem.title}" and move both items back to active listings?`)) {
      lostItem.isReunited = false;
      if (lostItem.matchedWithId) {
        const pairedFound = allItems.find(i => i.id === lostItem.matchedWithId);
        if (pairedFound) {
          pairedFound.isReunited = false;
          delete pairedFound.matchedWithId;
          delete pairedFound.reunitedWithTitle;
        }
      }
      delete lostItem.matchedWithId;
      delete lostItem.reunitedWithTitle;
      saveItemsToStorage();
      renderApp();
      showToast('Item moved back to active listings.');
    }
    return;
  }

  // Open the AI Matches modal so the lost person can select their matching found item
  openMatchModal(itemId);
  showToast('Review candidate matches below and click "This is My Item! (Reunite Both)" to verify.', 'info');
};

window.showFoundReuniteNotice = function() {
  showToast('Notice: Only the person who lost the item can confirm the match and mark both items as Reunited.', 'info');
};

window.reuniteItemsPair = async function(lostItemId, foundItemId) {
  const lostItem = allItems.find(i => i.id === lostItemId);
  const foundItem = allItems.find(i => i.id === foundItemId);

  if (!lostItem || !foundItem) return;

  // Link and mark BOTH items as reunited locally
  lostItem.isReunited = true;
  lostItem.matchedWithId = foundItem.id;
  lostItem.reunitedWithTitle = foundItem.title;

  foundItem.isReunited = true;
  foundItem.matchedWithId = lostItem.id;
  foundItem.reunitedWithTitle = lostItem.title;

  saveItemsToStorage();

  // If backend is online, persist dual-reunite to SQLite
  if (isBackendOnline) {
    try {
      await fetch(`${API_BASE}/items/${lostItemId}/reunite`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ matchedWithId: foundItemId, action: 'reunite' })
      });
    } catch (err) {
      console.warn('Backend reunite sync failed:', err);
    }
  }

  // Close match modal
  const matchModal = document.getElementById('matchModal');
  matchModal.classList.remove('active');
  matchModal.setAttribute('aria-hidden', 'true');

  renderApp();
  showToast(`Reunited! Both "${lostItem.title}" and "${foundItem.title}" are now marked as Reunited!`, 'success');
};

window.unreuniteItemsPair = async function(lostItemId, foundItemId) {
  const lostItem = allItems.find(i => i.id === lostItemId);
  const foundItem = allItems.find(i => i.id === foundItemId);

  if (lostItem) {
    lostItem.isReunited = false;
    delete lostItem.matchedWithId;
    delete lostItem.reunitedWithTitle;
  }
  if (foundItem) {
    foundItem.isReunited = false;
    delete foundItem.matchedWithId;
    delete foundItem.reunitedWithTitle;
  }

  saveItemsToStorage();

  // If backend is online, un-reunite in SQLite
  if (isBackendOnline) {
    try {
      await fetch(`${API_BASE}/items/${lostItemId}/reunite`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ matchedWithId: foundItemId, action: 'unreunite' })
      });
    } catch (err) {
      console.warn('Backend unreunite sync failed:', err);
    }
  }

  const matchModal = document.getElementById('matchModal');
  matchModal.classList.remove('active');
  matchModal.setAttribute('aria-hidden', 'true');

  renderApp();
  showToast('Items unlinked and moved back to active listings.');
};

window.toggleReunitedStatus = window.handleLostItemReunite;

window.deleteItem = async function(itemId) {
  const item = allItems.find(i => i.id === itemId);
  if (!item) return;

  if (confirm(`Are you sure you want to delete the report for "${item.title}"?`)) {
    // If paired with another item, clear link locally
    if (item.matchedWithId) {
      const paired = allItems.find(i => i.id === item.matchedWithId);
      if (paired) {
        delete paired.matchedWithId;
        delete paired.reunitedWithTitle;
      }
    }
    allItems = allItems.filter(i => i.id !== itemId);
    saveItemsToStorage();

    // If backend is online, delete from SQLite
    if (isBackendOnline) {
      try {
        await fetch(`${API_BASE}/items/${itemId}`, { method: 'DELETE' });
      } catch (err) {
        console.warn('Backend delete sync failed:', err);
      }
    }

    renderApp();
    showToast('Report removed successfully.');
  }
};

window.openMatchModal = openMatchModal;

// ============================================================================
// 9. HELPER UTILITIES
// ============================================================================

function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast ${type === 'success' ? 'toast-success' : type === 'error' ? 'toast-error' : ''}`;
  
  const icon = type === 'success' 
    ? 'fa-solid fa-circle-check' 
    : type === 'error' 
      ? 'fa-solid fa-triangle-exclamation' 
      : 'fa-solid fa-circle-info';

  toast.innerHTML = `<i class="${icon}"></i> <span>${escapeHtml(message)}</span>`;
  container.appendChild(toast);

  // Automatically remove toast after 3 seconds
  setTimeout(() => {
    toast.remove();
  }, 3000);
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

