// ======= CONFIG & DEMO SESSION =======
const AppConfig = {
  siteName: 'Resist Events',
  siteRegion: '',
  domain: '',
  archiveRetentionMonths: 12,
  flyerAutoDeleteDays: 30,
  purposeText: '',
  loaded: false,
};

const DemoSession = {
  role: null, // 'guest', 'organizer', 'admin'
  userId: null,
  orgId: null,
  orgName: '',
  displayName: '',
};

async function loadConfig() {
  try {
    const res = await fetch('/api/config');
    if (!res.ok) throw new Error('Config fetch failed');
    const data = await res.json();
    if (data.site_name) AppConfig.siteName = data.site_name;
    if (data.site_region) AppConfig.siteRegion = data.site_region;
    if (data.domain) AppConfig.domain = data.domain;
    if (data.archive_retention_months) AppConfig.archiveRetentionMonths = parseInt(data.archive_retention_months);
    if (data.flyer_auto_delete_days) AppConfig.flyerAutoDeleteDays = parseInt(data.flyer_auto_delete_days);
    if (data.purpose_text) AppConfig.purposeText = data.purpose_text;
    AppConfig.loaded = true;
  } catch (e) {
    console.warn('Could not load config from API, using defaults:', e.message);
  }
  applyConfig();
}

function applyConfig() {
  document.title = AppConfig.siteName;
  const logoText = document.querySelector('.logo-text');
  if (logoText) {
    if (AppConfig.siteRegion) {
      logoText.innerHTML = `<span class="highlight">${AppConfig.siteRegion}</span> Resist Events`;
    } else {
      logoText.textContent = AppConfig.siteName;
    }
  }

  const purposeEl = document.getElementById('purposeContent');
  if (purposeEl && AppConfig.purposeText) {
    purposeEl.innerHTML = AppConfig.purposeText;
  }

  const syncUrl = document.getElementById('syncCalUrl');
  if (syncUrl && AppConfig.domain) {
    syncUrl.textContent = `webcal://${AppConfig.domain}/cal/subscribe.ics`;
  }
}

async function checkDemoSession() {
  try {
    const res = await fetch('/api/auth/demo');
    if (!res.ok) throw new Error('No session');
    const data = await res.json();
    if (data.role) {
      DemoSession.role = data.role;
      DemoSession.userId = data.user_id || null;
      DemoSession.orgId = data.org_id;
      DemoSession.orgName = data.org_name || '';
      DemoSession.displayName = data.display_name || '';
      applyDemoRole();
      return true;
    }
  } catch (e) {
    // No session yet
  }
  return false;
}

function showDemoRoleModal() {
  document.getElementById('demoRoleModal').style.display = 'flex';
}

async function setDemoRole(role) {
  try {
    const res = await fetch('/api/auth/demo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role }),
    });
    if (!res.ok) throw new Error('Failed to set role');
    const data = await res.json();
    DemoSession.role = data.role;
    DemoSession.userId = data.user_id || null;
    DemoSession.orgId = data.org_id;
    DemoSession.orgName = data.org_name || '';
    DemoSession.displayName = data.display_name || '';
  } catch (e) {
    // Fallback for local testing
    DemoSession.role = role;
    DemoSession.orgName = role === 'guest' ? 'Guest' : 'Demo Org';
    DemoSession.displayName = role === 'guest' ? 'Guest Visitor' : 'Demo User';
  }

  document.getElementById('demoRoleModal').style.display = 'none';
  applyDemoRole();
  showSection('home');
}

function applyDemoRole() {
  const banner = document.getElementById('demoBanner');
  const bannerRole = document.getElementById('demoBannerRole');
  const userBadgeName = document.getElementById('userBadgeName');

  banner.style.display = 'block';
  bannerRole.textContent = DemoSession.role.charAt(0).toUpperCase() + DemoSession.role.slice(1);

  if (DemoSession.role === 'guest') {
    userBadgeName.textContent = 'Guest';
  } else {
    userBadgeName.textContent = DemoSession.orgName || DemoSession.displayName;
  }

  // Sponsor org field
  const sponsorOrg = document.getElementById('sponsorOrg');
  if (sponsorOrg) sponsorOrg.value = DemoSession.orgName || '';

  // Show/hide organizer-only elements
  const isOrganizer = DemoSession.role === 'organizer' || DemoSession.role === 'admin';
  document.querySelectorAll('.organizer-only').forEach(el => {
    el.style.display = isOrganizer ? '' : 'none';
  });

  // Show/hide admin-only elements
  const isAdmin = DemoSession.role === 'admin';
  document.querySelectorAll('.admin-only').forEach(el => {
    el.style.display = isAdmin ? '' : 'none';
  });

  // Update review queue badge if admin
  if (isAdmin && typeof updateReviewBadge === 'function') {
    updateReviewBadge();
  }

  // Update messages badge if organizer or admin
  if (isOrganizer && typeof updateMessagesBadge === 'function') {
    updateMessagesBadge();
  }
}

// ======= INIT =======
async function initApp() {
  await loadConfig();
  const hasSession = await checkDemoSession();
  if (!hasSession) {
    showDemoRoleModal();
  }
  // app.js will call renderHomeEvents after this
  if (typeof onAppReady === 'function') onAppReady();
}

initApp();
