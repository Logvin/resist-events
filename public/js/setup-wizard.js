// ======= SETUP WIZARD =======
// Full-screen overlay wizard for first-run setup.
// Called from config.js before the normal app boots.

let _wizardMode = null; // 'demo' or 'live'
let _wizardUserId = null; // user_id returned from live setup

function buildStepIndicator(currentStep) {
  const steps = [
    { num: 1, label: 'Setup' },
    { num: 2, label: 'Authentication' },
  ];
  let html = '<div class="wizard-steps">';
  steps.forEach((s, i) => {
    const cls = s.num === currentStep ? 'active' : (s.num < currentStep ? 'completed' : '');
    html += `<div class="wizard-step ${cls}"><span class="wizard-step-num">${s.num}</span><span class="wizard-step-label">${s.label}</span></div>`;
    if (i < steps.length - 1) {
      const lineCls = s.num < currentStep ? 'completed' : '';
      html += `<div class="wizard-step-line ${lineCls}"></div>`;
    }
  });
  html += '</div>';
  return html;
}

function showSetupWizard() {
  // Remove any existing wizard
  const existing = document.getElementById('setupWizardOverlay');
  if (existing) existing.remove();

  const overlay = document.createElement('div');
  overlay.id = 'setupWizardOverlay';
  overlay.innerHTML = buildStep1();
  document.body.appendChild(overlay);
}

function buildStep1() {
  return `
  <div class="wizard-container">
    ${buildStepIndicator(1)}
    <div class="wizard-header">
      <div class="wizard-logo">
        <div class="logo-icon" style="width:48px;height:48px;font-size:24px;line-height:48px;">R</div>
      </div>
      <h1 class="wizard-title">Welcome to Resist Events</h1>
      <p class="wizard-subtitle">Let's get your platform set up. First — what mode would you like to start in?</p>
    </div>

    <div class="wizard-options">
      <button class="wizard-option" onclick="wizardSelectMode('demo')">
        <div class="wizard-option-icon">&#x1F3AD;</div>
        <h3>Demo Mode</h3>
        <p>Start in Demo Mode. Great for testing, development, and exploring the platform. Comes pre-loaded with sample organizations and events. Can be wiped and reset at any time.</p>
        <span class="wizard-option-tag">Recommended for evaluation</span>
      </button>

      <button class="wizard-option" onclick="wizardSelectMode('live')">
        <div class="wizard-option-icon">&#x1F680;</div>
        <h3>Live Mode</h3>
        <p>Start in Live Mode. You're ready to go live. Real organizations, real events. This is for production deployments.</p>
        <span class="wizard-option-tag">For production use</span>
      </button>
    </div>

    <p class="wizard-warning">Demo Mode is intended for development and testing. If you're ready to serve real users, choose Live Mode.</p>
  </div>`;
}

function wizardSelectMode(mode) {
  _wizardMode = mode;
  const overlay = document.getElementById('setupWizardOverlay');
  if (mode === 'demo') {
    overlay.innerHTML = buildStep2Demo();
  } else {
    overlay.innerHTML = buildStep2Live();
  }
}

function buildStep2Demo() {
  return `
  <div class="wizard-container">
    ${buildStepIndicator(1)}
    <div class="wizard-header">
      <h1 class="wizard-title">Demo Mode — Set Recovery Email</h1>
      <p class="wizard-subtitle">Enter the email address of the one person who will be able to disable Demo Mode later. This email will be used to verify identity before wiping the demo database.</p>
    </div>

    <div class="wizard-form">
      <div class="form-group">
        <label class="form-label">Recovery Email</label>
        <input type="email" class="form-input" id="wizardEmail" placeholder="admin@example.com" autocomplete="email">
      </div>
      <div class="form-group">
        <label class="form-label">Confirm Email</label>
        <input type="email" class="form-input" id="wizardEmailConfirm" placeholder="admin@example.com" autocomplete="email">
      </div>
      <div id="wizardError" class="wizard-error" style="display:none;"></div>
      <div class="wizard-actions">
        <button class="btn btn-ghost" onclick="wizardGoBack()">Back</button>
        <button class="btn btn-primary" id="wizardSubmitBtn" onclick="wizardSubmitDemo()">Start in Demo Mode</button>
      </div>
    </div>
  </div>`;
}

function buildStep2Live() {
  return `
  <div class="wizard-container">
    ${buildStepIndicator(1)}
    <div class="wizard-header">
      <h1 class="wizard-title">Live Mode — Site Setup</h1>
      <p class="wizard-subtitle">Configure the basics for your platform. You can change these later in Site Settings.</p>
    </div>

    <div class="wizard-form">
      <div class="form-group">
        <label class="form-label">Site Name *</label>
        <input type="text" class="form-input" id="wizardSiteName" placeholder="e.g. Camelot Resist Events">
        <p class="form-hint">Displayed in the browser tab title, site header, and copyright text.</p>
      </div>
      <div class="form-group">
        <label class="form-label">Admin Email *</label>
        <input type="email" class="form-input" id="wizardEmail" placeholder="admin@example.com" autocomplete="email">
        <p class="form-hint">This will be the site admin email. It is important that you use an email you can log into — once authentication is enabled, this email will be used to sign in.</p>
      </div>
      <div class="form-group">
        <label class="form-label">City / Region</label>
        <input type="text" class="form-input" id="wizardCity" placeholder="e.g. Camelot">
        <p class="form-hint">Highlighted prefix in the site header (e.g. "Camelot Resist Events").</p>
      </div>
      <div class="form-group">
        <label class="form-label">Admin Group Name</label>
        <input type="text" class="form-input" id="wizardAdminGroupName" placeholder="e.g. Camelot Resist Admins" value="Site Admins">
        <p class="form-hint">The name for your admin organization. We recommend something friendly like "Cityname Resist Admins".</p>
      </div>
      <div id="wizardError" class="wizard-error" style="display:none;"></div>
      <div class="wizard-actions">
        <button class="btn btn-ghost" onclick="wizardGoBack()">Back</button>
        <button class="btn btn-primary" id="wizardSubmitBtn" onclick="wizardSubmitLive()">Launch in Live Mode</button>
      </div>
    </div>
  </div>`;
}

function buildStep2Auth() {
  return `
  <div class="wizard-container">
    ${buildStepIndicator(2)}
    <div class="wizard-header">
      <h1 class="wizard-title">Setup Complete</h1>
      <p class="wizard-subtitle">Your site is ready. You'll need to log in with Cloudflare Access using the admin email you provided.</p>
    </div>

    <div class="wizard-form" style="text-align:center;">
      <div style="background:var(--bg-card);border:1px solid var(--border);border-radius:var(--radius);padding:24px;margin-bottom:20px;">
        <p style="color:var(--text-muted);font-size:14px;line-height:1.7;margin:0;">
          Click the button below to go to your site. Use the <strong>Log In</strong> button in the header to authenticate via Cloudflare Access with the admin email you just configured.
        </p>
      </div>
      <div class="wizard-actions" style="justify-content:center;">
        <button class="btn btn-primary" onclick="wizardFinish()">Go to Your Site</button>
      </div>
    </div>
  </div>`;
}

function wizardGoBack() {
  const overlay = document.getElementById('setupWizardOverlay');
  overlay.innerHTML = buildStep1();
}

function wizardShowError(msg) {
  const el = document.getElementById('wizardError');
  el.textContent = msg;
  el.style.display = 'block';
}

async function wizardSubmitDemo() {
  const email = document.getElementById('wizardEmail').value.trim();
  const confirm = document.getElementById('wizardEmailConfirm').value.trim();
  const errorEl = document.getElementById('wizardError');
  errorEl.style.display = 'none';

  if (!email) { wizardShowError('Please enter an email address.'); return; }
  if (email !== confirm) { wizardShowError('Email addresses do not match.'); return; }
  if (!email.includes('@')) { wizardShowError('Please enter a valid email address.'); return; }

  const btn = document.getElementById('wizardSubmitBtn');
  btn.disabled = true;
  btn.textContent = 'Setting up...';

  try {
    const res = await fetch('/api/setup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode: 'demo', admin_email: email }),
    });
    const data = await res.json();
    if (!res.ok || !data.ok) {
      wizardShowError(data.error || 'Setup failed');
      btn.disabled = false;
      btn.textContent = 'Start in Demo Mode';
      return;
    }
    // Success — reload
    window.location.reload();
  } catch (e) {
    wizardShowError('Network error. Please try again.');
    btn.disabled = false;
    btn.textContent = 'Start in Demo Mode';
  }
}

async function wizardSubmitLive() {
  const siteName = document.getElementById('wizardSiteName').value.trim();
  const email = document.getElementById('wizardEmail').value.trim();
  const city = document.getElementById('wizardCity').value.trim();
  const adminGroupName = document.getElementById('wizardAdminGroupName').value.trim();
  const errorEl = document.getElementById('wizardError');
  errorEl.style.display = 'none';

  if (!siteName) { wizardShowError('Please enter a site name.'); return; }
  if (!email) { wizardShowError('Please enter an admin email.'); return; }
  if (!email.includes('@')) { wizardShowError('Please enter a valid email address.'); return; }

  const btn = document.getElementById('wizardSubmitBtn');
  btn.disabled = true;
  btn.textContent = 'Setting up...';

  try {
    const res = await fetch('/api/setup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode: 'live', admin_email: email, site_name: siteName, city, admin_group_name: adminGroupName }),
    });
    const data = await res.json();
    if (!res.ok || !data.ok) {
      wizardShowError(data.error || 'Setup failed');
      btn.disabled = false;
      btn.textContent = 'Launch in Live Mode';
      return;
    }
    _wizardUserId = data.user_id || null;
    // Show auth step placeholder
    const overlay = document.getElementById('setupWizardOverlay');
    overlay.innerHTML = buildStep2Auth();
  } catch (e) {
    wizardShowError('Network error. Please try again.');
    btn.disabled = false;
    btn.textContent = 'Launch in Live Mode';
  }
}

function wizardFinish() {
  if (_wizardMode === 'live') {
    // Live mode: redirect to root without setting cookies — force admin to log in via CF Access
    window.location.href = '/';
    return;
  }
  // Demo mode: set admin cookie so middleware grants access
  document.cookie = 'demo_role=; Max-Age=0; path=/';
  document.cookie = 'demo_user_id=; Max-Age=0; path=/';
  document.cookie = 'demo_role=admin; path=/; max-age=31536000';
  if (_wizardUserId) {
    document.cookie = 'demo_user_id=' + _wizardUserId + '; path=/; max-age=31536000';
  }
  window.location.reload();
}

// ======= DEMO MODE DISABLE FLOW =======
// Called from admin settings panel

function showDemoDisableModal() {
  const html = `
    <div class="wizard-header" style="margin-bottom:16px;">
      <h2 style="color:var(--danger,#e53e3e);margin:0;">Disable Demo Mode</h2>
    </div>
    <div style="background:rgba(229,62,62,0.1);border:1px solid var(--danger,#e53e3e);border-radius:var(--radius-sm);padding:14px;margin-bottom:16px;">
      <p style="color:var(--text);font-size:13px;line-height:1.6;margin:0;">
        Disabling Demo Mode will <strong>permanently wipe all data</strong> in this database, including all organizations, events, users, and configuration. The app will reset to a fresh install state. <strong>This cannot be undone.</strong>
      </p>
    </div>
    <p style="color:var(--text-muted);font-size:13px;margin-bottom:12px;">To continue, enter the recovery email address set during setup.</p>
    <div class="form-group">
      <input type="email" class="form-input" id="demoDisableEmail" placeholder="Recovery email address" autocomplete="email">
    </div>
    <div id="demoDisableError" class="wizard-error" style="display:none;"></div>
    <div style="display:flex;justify-content:flex-end;gap:8px;margin-top:16px;">
      <button class="btn btn-ghost btn-sm" onclick="closeConfirm()">Cancel</button>
      <button class="btn btn-danger btn-sm" id="demoDisableContinueBtn" onclick="demoDisableVerifyEmail()">Continue</button>
    </div>`;

  document.getElementById('confirmTitle').textContent = '';
  document.getElementById('confirmMessage').innerHTML = html;
  document.querySelector('.confirm-actions').style.display = 'none';
  document.getElementById('confirmDialog').classList.add('open');
}

async function demoDisableVerifyEmail() {
  const email = document.getElementById('demoDisableEmail').value.trim();
  const errorEl = document.getElementById('demoDisableError');
  errorEl.style.display = 'none';

  if (!email) {
    errorEl.textContent = 'Please enter the recovery email.';
    errorEl.style.display = 'block';
    return;
  }

  const btn = document.getElementById('demoDisableContinueBtn');
  btn.disabled = true;
  btn.textContent = 'Verifying...';

  try {
    const res = await fetch('/api/demo/disable', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    const data = await res.json();

    if (!data.ok) {
      errorEl.textContent = data.error || 'Verification failed';
      errorEl.style.display = 'block';
      btn.disabled = false;
      btn.textContent = 'Continue';
      return;
    }

    // Show final confirmation
    showDemoWipeConfirm(email);
  } catch (e) {
    errorEl.textContent = 'Network error. Please try again.';
    errorEl.style.display = 'block';
    btn.disabled = false;
    btn.textContent = 'Continue';
  }
}

function showDemoWipeConfirm(email) {
  const html = `
    <div class="wizard-header" style="margin-bottom:16px;">
      <h2 style="color:var(--danger,#e53e3e);margin:0;">Final Confirmation</h2>
    </div>
    <p style="color:var(--text);font-size:14px;margin-bottom:16px;">Are you absolutely sure? Type <strong>WIPE</strong> to confirm.</p>
    <div class="form-group">
      <input type="text" class="form-input" id="demoWipeConfirmInput" placeholder="Type WIPE to confirm" autocomplete="off" style="text-transform:uppercase;">
    </div>
    <div id="demoWipeError" class="wizard-error" style="display:none;"></div>
    <div style="display:flex;justify-content:flex-end;gap:8px;margin-top:16px;">
      <button class="btn btn-ghost btn-sm" onclick="closeConfirm()">Cancel</button>
      <button class="btn btn-danger btn-sm" id="demoWipeBtn" onclick="demoExecuteWipe('${email.replace(/'/g, "\\'")}')">Wipe Database & Reset</button>
    </div>`;

  document.getElementById('confirmTitle').textContent = '';
  document.getElementById('confirmMessage').innerHTML = html;
}

async function demoExecuteWipe(email) {
  const confirmVal = document.getElementById('demoWipeConfirmInput').value.trim().toUpperCase();
  const errorEl = document.getElementById('demoWipeError');
  errorEl.style.display = 'none';

  if (confirmVal !== 'WIPE') {
    errorEl.textContent = 'Please type WIPE to confirm.';
    errorEl.style.display = 'block';
    return;
  }

  const btn = document.getElementById('demoWipeBtn');
  btn.disabled = true;
  btn.textContent = 'Wiping...';

  try {
    const res = await fetch('/api/demo/wipe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, confirm: 'WIPE' }),
    });
    const data = await res.json();

    if (!res.ok || !data.ok) {
      errorEl.textContent = data.error || 'Wipe failed';
      errorEl.style.display = 'block';
      btn.disabled = false;
      btn.textContent = 'Wipe Database & Reset';
      return;
    }

    // Clear cookies and reload
    document.cookie = 'demo_role=; Max-Age=0; path=/';
    document.cookie = 'demo_user_id=; Max-Age=0; path=/';
    window.location.reload();
  } catch (e) {
    errorEl.textContent = 'Network error. Please try again.';
    errorEl.style.display = 'block';
    btn.disabled = false;
    btn.textContent = 'Wipe Database & Reset';
  }
}
