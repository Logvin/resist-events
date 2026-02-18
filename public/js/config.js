// ======= CONFIG & DEMO SESSION =======
const AppConfig = {
  siteName: 'Resist Events',
  siteRegion: '',
  domain: '',
  archiveRetentionMonths: 12,
  flyerAutoDeleteDays: 30,
  purposeText: '',
  eventOrganizerPermission: 'own_org_only',
  heroLine1: 'Together We',
  heroLine2: 'Show Up.',
  heroSubtitle: 'One calendar for every rally, march, meeting, and action. Find your people. Make your voice heard.',
  showEventCount: 'yes',
  showOrgCount: 'yes',
  showMobilizedCount: 'yes',
  privacyPolicy: '',
  termsOfService: '',
  showGithubLink: 'yes',
  copyrightText: '2026 Resist Events · Open source and community-driven',
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
    if (data.event_organizer_permission) AppConfig.eventOrganizerPermission = data.event_organizer_permission;
    if (data.hero_line_1) AppConfig.heroLine1 = data.hero_line_1;
    if (data.hero_line_2) AppConfig.heroLine2 = data.hero_line_2;
    if (data.hero_subtitle) AppConfig.heroSubtitle = data.hero_subtitle;
    if (data.show_event_count) AppConfig.showEventCount = data.show_event_count;
    if (data.show_org_count) AppConfig.showOrgCount = data.show_org_count;
    if (data.show_people_mobilized) AppConfig.showMobilizedCount = data.show_people_mobilized;
    if (data.privacy_policy) AppConfig.privacyPolicy = data.privacy_policy;
    if (data.terms_of_service) AppConfig.termsOfService = data.terms_of_service;
    if (data.show_github_link) AppConfig.showGithubLink = data.show_github_link;
    if (data.copyright_text) AppConfig.copyrightText = data.copyright_text;
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

  // Hero section
  const heroTitle = document.getElementById('heroTitle');
  if (heroTitle) {
    heroTitle.innerHTML = `${AppConfig.heroLine1}<br><span class="accent">${AppConfig.heroLine2}</span>`;
  }
  const heroSubtitle = document.getElementById('heroSubtitle');
  if (heroSubtitle) {
    heroSubtitle.textContent = AppConfig.heroSubtitle;
  }

  // Hero stats visibility
  const statEventsWrap = document.getElementById('statEventsWrap');
  if (statEventsWrap) statEventsWrap.style.display = AppConfig.showEventCount === 'yes' ? '' : 'none';
  const statOrgsWrap = document.getElementById('statOrgsWrap');
  if (statOrgsWrap) statOrgsWrap.style.display = AppConfig.showOrgCount === 'yes' ? '' : 'none';
  const statMobilizedWrap = document.getElementById('statMobilizedWrap');
  if (statMobilizedWrap) statMobilizedWrap.style.display = AppConfig.showMobilizedCount === 'yes' ? '' : 'none';

  // Privacy & Terms modals
  const privacyContent = document.getElementById('privacyContent');
  if (privacyContent && AppConfig.privacyPolicy) {
    privacyContent.innerHTML = AppConfig.privacyPolicy;
  }
  const termsContent = document.getElementById('termsContent');
  if (termsContent && AppConfig.termsOfService) {
    termsContent.innerHTML = AppConfig.termsOfService;
  }

  // Footer
  const copyrightText = document.getElementById('copyrightText');
  if (copyrightText) {
    copyrightText.innerHTML = '&copy; ' + AppConfig.copyrightText;
  }
  const githubLink = document.getElementById('githubLink');
  const githubSep = document.getElementById('githubSep');
  if (githubLink) githubLink.style.display = AppConfig.showGithubLink === 'yes' ? '' : 'none';
  if (githubSep) githubSep.style.display = AppConfig.showGithubLink === 'yes' ? '' : 'none';

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

  // Make user badge clickable for organizer/admin
  const userBadge = document.getElementById('userBadge');
  if (DemoSession.role === 'organizer' || DemoSession.role === 'admin') {
    userBadge.classList.add('clickable');
    userBadge.onclick = function() { openOrgProfile(); };
  } else {
    userBadge.classList.remove('clickable');
    userBadge.onclick = null;
  }

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

  // Update My Events badge if organizer or admin
  if (isOrganizer && typeof updateMyEventsBadge === 'function') {
    updateMyEventsBadge();
  }

  // Update admin messages badge if admin
  if (isAdmin && typeof updateAdminMessagesBadge === 'function') {
    updateAdminMessagesBadge();
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
