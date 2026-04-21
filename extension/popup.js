// PromptSEONest Popup Script

const PLATFORM_RULES = {
  adobe_stock: {
    name: 'Adobe Stock',
    badge: 'adobe',
    titleMax: 70,
    kwMax: 49,
    kwSingleOnly: true,
    descMin: 200,
    descMax: 500,
    specialChars: /[:\-;\/\\,|[\]{}()&@#$%^*!?"'<>~`+=]/,
    checklist: [
      'Title max 70 characters',
      'No special characters in title',
      'Keywords: single words only',
      'Exactly 49 keywords',
      'No duplicate keywords',
      'Description 200-500 characters',
      'White/transparent background preferred',
      'AI Generated label if applicable',
      'Minimum 4MP resolution'
    ]
  },
  shutterstock: {
    name: 'Shutterstock',
    badge: 'shutterstock',
    titleMax: 200,
    kwMax: 50,
    kwSingleOnly: false,
    kwMaxWords: 3,
    descMin: 1,
    descMax: 2000,
    specialChars: /[;|[\]{}()@#$%^*!<>~`+=]/,
    checklist: [
      'Title max 200 characters',
      'Max 50 keywords',
      'Keywords: max 2-3 words each',
      'No duplicate keywords',
      'Description present',
      'No trademark/brand names'
    ]
  },
  freepik: {
    name: 'Freepik',
    badge: 'freepik',
    titleMax: 100,
    kwMax: 30,
    kwSingleOnly: false,
    kwMaxWords: 2,
    descMin: 100,
    descMax: 2000,
    specialChars: /[;|[\]{}()@#$%^*!<>~`+=]/,
    checklist: [
      'Title max 100 characters',
      'Max 30 keywords',
      'Keywords: single or two-word phrases',
      'Description min 100 characters',
      'No duplicate keywords'
    ]
  }
};

let currentPlatform = 'adobe_stock';
let fixResult = null;

// ── Init ──
document.addEventListener('DOMContentLoaded', () => {
  // Load saved settings
  chrome.storage.local.get(['platform', 'darkMode'], (data) => {
    if (data.platform) {
      currentPlatform = data.platform;
      document.getElementById('platformSelect').value = currentPlatform;
    }
    if (data.darkMode) document.body.classList.add('dark');
    updatePlatformUI();
    updateChecklist();
  });

  // Detect platform from active tab
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (!tabs[0]) return;
    const url = tabs[0].url || '';
    if (url.includes('stock.adobe.com') || url.includes('upload.stock.adobe.com')) {
      currentPlatform = 'adobe_stock';
    } else if (url.includes('contributor.shutterstock.com')) {
      currentPlatform = 'shutterstock';
    } else if (url.includes('contributor.freepik.com')) {
      currentPlatform = 'freepik';
    }
    document.getElementById('platformSelect').value = currentPlatform;
    updatePlatformUI();
    updateChecklist();
  });

  // Event listeners
  document.getElementById('platformSelect').addEventListener('change', (e) => {
    currentPlatform = e.target.value;
    chrome.storage.local.set({ platform: currentPlatform });
    updatePlatformUI();
    updateChecklist();
    liveValidate();
  });

  document.getElementById('titleInput').addEventListener('input', liveValidate);
  document.getElementById('kwInput').addEventListener('input', liveValidate);
  document.getElementById('descInput').addEventListener('input', liveValidate);

  document.getElementById('btnAnalyze').addEventListener('click', analyzeAndFix);
  document.getElementById('btnAutoFill').addEventListener('click', autoFillFromPage);
  document.getElementById('btnAutoFillBack').addEventListener('click', autoFillToPage);
  document.getElementById('btnCopyAll').addEventListener('click', copyAll);
  document.getElementById('btnSettings').addEventListener('click', () => {
    chrome.runtime.openOptionsPage ? chrome.runtime.openOptionsPage() : window.open('settings.html');
  });

  // Tabs
  document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
      tab.classList.add('active');
      document.getElementById('tab-' + tab.dataset.tab).classList.add('active');
    });
  });

  // Copy buttons
  document.querySelectorAll('.btn-copy').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.copy;
      const el = document.getElementById(id);
      if (el) {
        navigator.clipboard.writeText(el.textContent);
        btn.textContent = '✅ Copied';
        btn.classList.add('copied');
        setTimeout(() => { btn.textContent = '📋 Copy'; btn.classList.remove('copied'); }, 1500);
      }
    });
  });
});

function updatePlatformUI() {
  const rules = PLATFORM_RULES[currentPlatform];
  const badge = document.getElementById('platformBadge');
  badge.textContent = rules.name;
  badge.className = 'platform-badge ' + rules.badge;

  // Update counters
  const titleCounter = document.getElementById('titleCounter');
  titleCounter.textContent = `0/${rules.titleMax}`;
  const kwCounter = document.getElementById('kwCounter');
  kwCounter.textContent = `0/${rules.kwMax}`;
}

// ── Live Validation ──
function liveValidate() {
  const rules = PLATFORM_RULES[currentPlatform];
  const title = document.getElementById('titleInput').value;
  const kw = document.getElementById('kwInput').value;
  const desc = document.getElementById('descInput').value;

  // Title
  const titleLen = title.length;
  const titleCounter = document.getElementById('titleCounter');
  titleCounter.textContent = `${titleLen}/${rules.titleMax}`;
  titleCounter.className = 'field-counter ' + (titleLen > 0 && titleLen <= rules.titleMax ? 'ok' : 'bad');

  const titleIssues = [];
  if (rules.specialChars.test(title)) titleIssues.push({ text: 'Special characters', type: 'error' });
  if (titleLen > rules.titleMax) titleIssues.push({ text: 'Too long', type: 'error' });
  document.getElementById('titleInput').className = 'field-input' + (titleIssues.some(i => i.type === 'error') ? ' error' : '');
  renderIssues('titleIssues', titleIssues);

  // Keywords
  const kwList = kw.split(',').map(k => k.trim()).filter(Boolean);
  const kwCount = kwList.length;
  const kwCounter = document.getElementById('kwCounter');
  kwCounter.textContent = `${kwCount}/${rules.kwMax}`;
  kwCounter.className = 'field-counter ' + (kwCount === rules.kwMax ? 'ok' : 'bad');

  const kwIssues = [];
  const multiWord = kwList.filter(k => k.includes(' '));
  const hyphenated = kwList.filter(k => k.includes('-'));
  const lower = kwList.map(k => k.toLowerCase());
  const dupes = lower.filter((k, i) => lower.indexOf(k) !== i);

  if (rules.kwSingleOnly && multiWord.length) kwIssues.push({ text: `${multiWord.length} multi-word`, type: 'error' });
  if (!rules.kwSingleOnly && rules.kwMaxWords) {
    const tooLong = kwList.filter(k => k.split(' ').length > rules.kwMaxWords);
    if (tooLong.length) kwIssues.push({ text: `${tooLong.length} too many words`, type: 'error' });
  }
  if (hyphenated.length) kwIssues.push({ text: `${hyphenated.length} hyphenated`, type: 'error' });
  if (dupes.length) kwIssues.push({ text: `${new Set(dupes).size} duplicates`, type: 'warning' });
  if (kwCount !== rules.kwMax && kwCount > 0) kwIssues.push({ text: `Need ${rules.kwMax}`, type: kwCount > rules.kwMax ? 'error' : 'warning' });

  document.getElementById('kwInput').className = 'field-textarea' + (kwIssues.some(i => i.type === 'error') ? ' error' : '');
  renderIssues('kwIssues', kwIssues);

  // Keyword badges
  const badgesEl = document.getElementById('kwBadges');
  if (kwList.length > 0 && kwList.length <= 60) {
    badgesEl.innerHTML = kwList.map(k => {
      const bad = (rules.kwSingleOnly && k.includes(' ')) || k.includes('-') || (lower.filter(l => l === k.toLowerCase()).length > 1);
      return `<span class="kw-badge${bad ? ' bad' : ''}">${escHtml(k)}${bad ? ' ⚠' : ''}</span>`;
    }).join('');
  } else {
    badgesEl.innerHTML = '';
  }

  // Description
  const descLen = desc.length;
  const descCounter = document.getElementById('descCounter');
  descCounter.textContent = `${descLen} chars`;
  descCounter.className = 'field-counter ' + (descLen >= rules.descMin && descLen <= rules.descMax ? 'ok' : 'bad');

  const descIssues = [];
  if (descLen > 0 && descLen < rules.descMin) descIssues.push({ text: `Min ${rules.descMin} chars`, type: 'error' });
  if (descLen > rules.descMax) descIssues.push({ text: `Max ${rules.descMax} chars`, type: 'error' });
  document.getElementById('descInput').className = 'field-textarea' + (descIssues.some(i => i.type === 'error') ? ' error' : '');
  renderIssues('descIssues', descIssues);

  updateChecklist();
}

function renderIssues(containerId, issues) {
  const el = document.getElementById(containerId);
  el.innerHTML = issues.map(i =>
    `<span class="issue-tag ${i.type}">❌ ${escHtml(i.text)}</span>`
  ).join('');
}

// ── Analyze & Fix ──
async function analyzeAndFix() {
  const title = document.getElementById('titleInput').value;
  const kw = document.getElementById('kwInput').value;
  const desc = document.getElementById('descInput').value;
  const prompt = document.getElementById('promptInput').value;

  if (!title && !kw && !desc && !prompt) {
    alert('Please fill at least one field');
    return;
  }

  document.getElementById('btnAnalyze').classList.add('hidden');
  document.getElementById('loadingBtn').classList.remove('hidden');

  try {
    // Get API key from storage
    const settings = await getStorage(['apiKey', 'apiEndpoint']);
    const apiKey = settings.apiKey;

    if (!apiKey) {
      alert('Please set your API key in Settings first.');
      document.getElementById('btnSettings').click();
      return;
    }

    const rules = PLATFORM_RULES[currentPlatform];
    const endpoint = settings.apiEndpoint || 'https://api.anthropic.com/v1/messages';

    const systemPrompt = buildSystemPrompt(rules);

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2000,
        system: systemPrompt,
        messages: [{
          role: 'user',
          content: `Fix this metadata for ${rules.name}:\n\nTITLE: ${title || '(empty)'}\n\nKEYWORDS: ${kw || '(empty)'}\n\nDESCRIPTION: ${desc || '(empty)'}\n\nPROMPT: ${prompt || '(empty)'}`
        }]
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`API Error ${response.status}: ${errText.substring(0, 200)}`);
    }

    const data = await response.json();
    let content = data.content?.[0]?.text || '';

    // Extract JSON
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) content = jsonMatch[1].trim();

    let result;
    try {
      result = JSON.parse(content);
    } catch {
      const objMatch = content.match(/\{[\s\S]*\}/);
      if (objMatch) result = JSON.parse(objMatch[0]);
      else throw new Error('Failed to parse AI response');
    }

    fixResult = result;
    displayResults(result);

  } catch (err) {
    alert('Error: ' + err.message);
    console.error(err);
  } finally {
    document.getElementById('btnAnalyze').classList.remove('hidden');
    document.getElementById('loadingBtn').classList.add('hidden');
  }
}

function buildSystemPrompt(rules) {
  return `You are a ${rules.name} metadata optimizer. Fix metadata following these STRICT rules:

TITLE:
- Remove ALL special characters except periods
- Max ${rules.titleMax} characters
- Remove all color names
- Must end with background type ("on White Background" or "on Transparent Background")
- If grey/gray background mentioned, change to white
- Format: [Subject] + [Action/Style] + on [Background]
- Generate 3 alternative titles

KEYWORDS:
${rules.kwSingleOnly ? '- Every keyword MUST be single word only — no spaces, no hyphens' : `- Max ${rules.kwMaxWords || 3} words per keyword`}
- Remove hyphens: "close-up" → "closeup"
- Remove ALL exact duplicates
- Final count MUST be EXACTLY ${rules.kwMax}
- Sort by search relevance
- All lowercase

DESCRIPTION:
- Min ${rules.descMin}, max ${rules.descMax} characters
- Mention at least 2 use cases
- Natural reading flow
- Last sentence about commercial/editorial use

PROMPT VALIDATION:
- Check: white_background, lighting, camera_angle, color_palette, mood

Return ONLY valid JSON:
{
  "title": "fixed title",
  "alt_titles": ["alt1", "alt2", "alt3"],
  "keywords": "word1, word2, word3...",
  "description": "fixed description",
  "prompt_checks": {"white_background":true,"lighting":true,"camera_angle":true,"color_palette":true,"mood":true},
  "errors": [{"field":"title","type":"error","original":"...","fixed":"...","reason":"..."}],
  "compliance_score": 95
}`;
}

function displayResults(result) {
  // Switch to output tab
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
  document.querySelectorAll('.tab')[1].classList.add('active');
  document.getElementById('tab-output').classList.add('active');

  document.getElementById('outputEmpty').classList.add('hidden');
  document.getElementById('outputContent').classList.remove('hidden');

  // Score
  const score = result.compliance_score || 0;
  const scoreSection = document.getElementById('scoreSection');
  scoreSection.style.display = '';
  const cls = score >= 80 ? 'high' : score >= 50 ? 'mid' : 'low';
  document.getElementById('scoreValue').textContent = score + '%';
  document.getElementById('scoreValue').className = 'score-value ' + cls;
  document.getElementById('scoreFill').style.width = score + '%';
  document.getElementById('scoreFill').className = 'score-fill ' + cls;

  const readyBadge = document.getElementById('readyBadge');
  if (score === 100) {
    readyBadge.classList.remove('hidden');
    readyBadge.textContent = '✅ ' + PLATFORM_RULES[currentPlatform].name + ' Ready';
  } else {
    readyBadge.classList.add('hidden');
  }

  const errors = result.errors || [];
  document.getElementById('errorSummary').textContent = errors.length ? `${errors.length} issues found → ${errors.length} fixed` : 'No issues found';

  // Fixed title
  document.getElementById('fixedTitle').textContent = result.title || '';
  const ftc = document.getElementById('fixedTitleCounter');
  const tLen = (result.title || '').length;
  ftc.textContent = `${tLen}/${PLATFORM_RULES[currentPlatform].titleMax}`;
  ftc.className = 'field-counter ' + (tLen <= PLATFORM_RULES[currentPlatform].titleMax ? 'ok' : 'bad');

  // Alt titles (CSP-safe: no inline handlers)
  const altSection = document.getElementById('altTitlesSection');
  if (result.alt_titles?.length) {
    altSection.innerHTML = '<div style="font-size:11px;font-weight:600;margin-bottom:4px;color:var(--pn-text-muted)">Alternative Titles</div>' +
      result.alt_titles.map(t => `<div class="alt-title-item"><span>${escHtml(t)}</span><button class="btn-copy alt-copy-btn" data-text="${escHtml(t)}">📋</button></div>`).join('');
    // Attach event listeners (MV3 CSP forbids inline onclick)
    altSection.querySelectorAll('.alt-copy-btn').forEach(btn => {
      btn.addEventListener('click', () => copyText(btn.dataset.text || '', btn));
    });
  } else {
    altSection.innerHTML = '';
  }

  // Fixed keywords
  const kwStr = result.keywords || '';
  document.getElementById('fixedKw').textContent = kwStr;
  const kwArr = kwStr.split(',').map(k => k.trim()).filter(Boolean);
  const fkc = document.getElementById('fixedKwCounter');
  fkc.textContent = `${kwArr.length}/${PLATFORM_RULES[currentPlatform].kwMax}`;
  fkc.className = 'field-counter ' + (kwArr.length === PLATFORM_RULES[currentPlatform].kwMax ? 'ok' : 'bad');

  // Fixed description
  document.getElementById('fixedDesc').textContent = result.description || '';
  const fdc = document.getElementById('fixedDescCounter');
  const dLen = (result.description || '').length;
  fdc.textContent = `${dLen} chars`;
  fdc.className = 'field-counter ' + (dLen >= PLATFORM_RULES[currentPlatform].descMin && dLen <= PLATFORM_RULES[currentPlatform].descMax ? 'ok' : 'bad');

  // Prompt checks
  if (result.prompt_checks) {
    document.getElementById('promptChecksSection').classList.remove('hidden');
    const pc = result.prompt_checks;
    document.getElementById('promptChecks').innerHTML = [
      ['White Background', pc.white_background],
      ['Lighting', pc.lighting],
      ['Camera Angle', pc.camera_angle],
      ['Color Palette', pc.color_palette],
      ['Mood/Atmosphere', pc.mood]
    ].map(([label, ok]) => `<div class="check-item ${ok ? 'ok' : 'fail'}">${ok ? '✅' : '❌'} ${label}</div>`).join('');
  }

  // Error list
  if (errors.length) {
    document.getElementById('errorListSection').classList.remove('hidden');
    document.getElementById('errorCount').textContent = errors.length;
    document.getElementById('errorList').innerHTML = errors.map(e =>
      `<div class="error-item">
        <span class="icon">${e.type === 'error' ? '❌' : '⚠️'}</span>
        <div>
          <div><span class="error-original">${escHtml(e.original || '')}</span> <span class="error-arrow">→</span> <span class="error-fixed">${escHtml(e.fixed || '')}</span></div>
          <div class="error-reason">${escHtml(e.reason || '')}</div>
        </div>
      </div>`
    ).join('');
  } else {
    document.getElementById('errorListSection').classList.add('hidden');
  }

  updateChecklist();
}

// ── Checklist ──
function updateChecklist() {
  const rules = PLATFORM_RULES[currentPlatform];
  const title = fixResult?.title || document.getElementById('titleInput').value;
  const kw = fixResult?.keywords || document.getElementById('kwInput').value;
  const desc = fixResult?.description || document.getElementById('descInput').value;
  const kwList = kw.split(',').map(k => k.trim()).filter(Boolean);

  const checks = {
    adobe_stock: [
      { label: 'Title max 70 characters', ok: title.length > 0 && title.length <= 70 },
      { label: 'No special characters in title', ok: !rules.specialChars.test(title) },
      { label: 'Keywords: single words only', ok: !kwList.some(k => k.includes(' ')) },
      { label: 'Exactly 49 keywords', ok: kwList.length === 49 },
      { label: 'No duplicate keywords', ok: new Set(kwList.map(k => k.toLowerCase())).size === kwList.length },
      { label: 'Description 200-500 characters', ok: desc.length >= 200 && desc.length <= 500 },
      { label: 'White/transparent background', ok: /background/i.test(title) },
      { label: 'AI Generated label', ok: null },
      { label: 'Minimum 4MP resolution', ok: null }
    ],
    shutterstock: [
      { label: 'Title max 200 characters', ok: title.length > 0 && title.length <= 200 },
      { label: 'Max 50 keywords', ok: kwList.length <= 50 },
      { label: 'Keywords max 2-3 words', ok: !kwList.some(k => k.split(' ').length > 3) },
      { label: 'No duplicate keywords', ok: new Set(kwList.map(k => k.toLowerCase())).size === kwList.length },
      { label: 'Description present', ok: desc.length > 0 }
    ],
    freepik: [
      { label: 'Title max 100 characters', ok: title.length > 0 && title.length <= 100 },
      { label: 'Max 30 keywords', ok: kwList.length <= 30 },
      { label: 'Keywords max 2 words', ok: !kwList.some(k => k.split(' ').length > 2) },
      { label: 'Description min 100 chars', ok: desc.length >= 100 },
      { label: 'No duplicate keywords', ok: new Set(kwList.map(k => k.toLowerCase())).size === kwList.length }
    ]
  };

  const checkItems = checks[currentPlatform] || [];
  document.getElementById('checklistContent').innerHTML =
    `<div class="checklist-title">${rules.name} Guidelines</div>` +
    checkItems.map(c => {
      const icon = c.ok === null ? '⚪' : c.ok ? '✅' : '❌';
      return `<div class="checklist-item"><span class="icon">${icon}</span> ${escHtml(c.label)}</div>`;
    }).join('');
}

// ── Auto-fill from page ──
function autoFillFromPage() {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (!tabs[0]?.id) return;
    chrome.scripting.executeScript({
      target: { tabId: tabs[0].id },
      func: readPageMetadata
    }, (results) => {
      if (results?.[0]?.result) {
        const d = results[0].result;
        if (d.title) document.getElementById('titleInput').value = d.title;
        if (d.keywords) document.getElementById('kwInput').value = d.keywords;
        if (d.description) document.getElementById('descInput').value = d.description;
        liveValidate();
      }
    });
  });
}

function readPageMetadata() {
  // Try Adobe Stock
  const titleEl = document.querySelector('[name="title"], [data-testid="title-input"], input[placeholder*="title" i]');
  const kwEl = document.querySelector('[name="keywords"], textarea[placeholder*="keyword" i], [data-testid="keywords-input"]');
  const descEl = document.querySelector('[name="description"], textarea[placeholder*="description" i], [data-testid="description-input"]');
  return {
    title: titleEl?.value || '',
    keywords: kwEl?.value || '',
    description: descEl?.value || ''
  };
}

// ── Auto-fill to page ──
function autoFillToPage() {
  if (!fixResult) return;
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (!tabs[0]?.id) return;
    chrome.scripting.executeScript({
      target: { tabId: tabs[0].id },
      func: writePageMetadata,
      args: [{ title: fixResult.title, keywords: fixResult.keywords, description: fixResult.description }]
    });
  });
}

function writePageMetadata(data) {
  function setVal(el, val) {
    if (!el) return;
    const nativeSet = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set ||
                      Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value')?.set;
    if (nativeSet) nativeSet.call(el, val);
    else el.value = val;
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
  }
  const titleEl = document.querySelector('[name="title"], [data-testid="title-input"], input[placeholder*="title" i]');
  const kwEl = document.querySelector('[name="keywords"], textarea[placeholder*="keyword" i], [data-testid="keywords-input"]');
  const descEl = document.querySelector('[name="description"], textarea[placeholder*="description" i], [data-testid="description-input"]');
  if (data.title) setVal(titleEl, data.title);
  if (data.keywords) setVal(kwEl, data.keywords);
  if (data.description) setVal(descEl, data.description);
}

// ── Copy ──
function copyAll() {
  if (!fixResult) return;
  const text = `Title: ${fixResult.title}\n\nKeywords: ${fixResult.keywords}\n\nDescription: ${fixResult.description}`;
  navigator.clipboard.writeText(text);
  const btn = document.getElementById('btnCopyAll');
  btn.textContent = '✅ Copied All!';
  setTimeout(() => { btn.innerHTML = '📋 Copy All Fixed Metadata'; }, 1500);
}

function copyText(text, btn) {
  navigator.clipboard.writeText(text);
  btn.textContent = '✅';
  setTimeout(() => { btn.textContent = '📋'; }, 1500);
}

// ── Storage helper ──
function getStorage(keys) {
  return new Promise(resolve => chrome.storage.local.get(keys, resolve));
}

// ── Escape ──
function escHtml(s) { return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
function escAttr(s) { return s.replace(/'/g,"\\'").replace(/"/g,'\\"'); }
