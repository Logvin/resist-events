// ======= STATE =======
let currentSection = 'home';
let calMonth = new Date().getMonth();
let calYear = new Date().getFullYear();
let calView = 'agenda';
let agendaWeekStart = null;
let showArchived = false;
let showArchivedTopics = false;
let eventsPage = 1;
let viewingThread = null;

// Cached data from API
let cachedEvents = [];
let cachedOrgs = [];
let cachedMessages = [];
let cachedUsers = [];
let editingEventId = null;
let cloningEvent = false;
let pendingMessageOrgId = null;
let pendingMessageEventId = null;
let _currentDetailEvent = null;

// Admin messages state
let cachedAdminMessages = [];
let showAdminArchivedMessages = false;
let adminViewingThread = null;
let adminMsgRecipientType = 'org';

// ======= SOCIAL ICON SVGS =======
const socialSvgs = {
  fb: '<svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>',
  ig: '<svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>',
  sc: '<svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M12.206.793c.99 0 4.347.276 5.93 3.821.529 1.193.403 3.219.299 4.847l-.003.06c-.012.18-.022.345-.03.51.075.045.203.09.401.09.3-.016.659-.12 1.033-.301a.602.602 0 01.257-.058c.21 0 .42.089.554.239.18.18.244.458.164.694-.135.449-.61.795-1.411 1.024a5.39 5.39 0 01-.534.12c-.164.03-.296.057-.404.09-.372.12-.433.36-.433.584 0 .135.03.27.09.42.57 1.199 1.425 2.175 2.46 2.805.36.21.72.36 1.08.449.18.045.33.12.42.24.12.135.165.33.12.51-.135.6-1.11.899-1.62 1.05-.12.03-.21.06-.27.084l-.015.03c-.12.255-.24.54-.615.66a1.126 1.126 0 01-.36.06c-.27 0-.6-.105-1.005-.225-.48-.135-.93-.254-1.32-.254-.18 0-.33.015-.45.06a6.502 6.502 0 01-2.58.51c-.06 0-.12 0-.195-.016h-.18a6.607 6.607 0 01-2.58-.51c-.12-.045-.27-.06-.45-.06-.39 0-.84.12-1.32.255-.405.12-.735.225-1.005.225a1.126 1.126 0 01-.36-.06c-.375-.12-.495-.405-.615-.66l-.015-.03a2.656 2.656 0 00-.27-.084c-.51-.15-1.485-.45-1.62-1.05-.045-.18 0-.375.12-.51.09-.12.24-.195.42-.24.36-.084.72-.24 1.08-.449 1.035-.63 1.89-1.606 2.46-2.805.06-.135.09-.27.09-.42 0-.224-.06-.464-.434-.584a4.79 4.79 0 01-.403-.09 5.39 5.39 0 01-.534-.12c-.801-.229-1.276-.575-1.411-1.024a.657.657 0 01.164-.694.564.564 0 01.554-.24c.105 0 .18.015.256.06.374.18.734.3 1.035.3.199 0 .324-.046.399-.09l-.03-.509-.003-.061c-.104-1.628-.23-3.654.3-4.846C7.648 1.07 11.015.793 12.006.793h.2z"/></svg>',
  sg: '<svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm0 3.6c2.34 0 4.242 1.902 4.242 4.242V9.6h.558a.6.6 0 01.6.6v7.2a.6.6 0 01-.6.6H7.2a.6.6 0 01-.6-.6v-7.2a.6.6 0 01.6-.6h.558V7.842C7.758 5.502 9.66 3.6 12 3.6zm0 1.8c-1.35 0-2.442 1.092-2.442 2.442V9.6h4.884V7.842C14.442 6.492 13.35 5.4 12 5.4z"/></svg>',
  rd: '<svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M12 0A12 12 0 000 12a12 12 0 0012 12 12 12 0 0012-12A12 12 0 0012 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 01-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 01.042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 014.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 01.14-.197.35.35 0 01.238-.042l2.906.617a1.214 1.214 0 011.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 00-.231.094.33.33 0 000 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 000-.462.342.342 0 00-.461 0c-.545.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 00-.206-.095z"/></svg>',
  x: '<svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>',
};

const socialTitles = { fb: 'Facebook', ig: 'Instagram', sc: 'Snapchat', sg: 'Signal', rd: 'Reddit', x: 'X / Twitter' };

// ======= API HELPERS =======
async function api(path, options = {}) {
  const res = await fetch('/api' + path, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
  if (!res.ok) {
    const err = await res.text().catch(() => 'Unknown error');
    throw new Error(err);
  }
  return res.json();
}

// ======= DATA LOADING =======
async function loadEvents() {
  try {
    cachedEvents = await api('/events');
  } catch (e) {
    console.warn('Failed to load events:', e.message);
    cachedEvents = [];
  }
}

async function loadOrgs() {
  try {
    cachedOrgs = await api('/orgs');
  } catch (e) {
    console.warn('Failed to load orgs:', e.message);
    cachedOrgs = [];
  }
}

async function loadMessages() {
  try {
    cachedMessages = await api('/messages');
  } catch (e) {
    console.warn('Failed to load messages:', e.message);
    cachedMessages = [];
  }
}

// ======= SECTION NAV =======
function showSection(section) {
  currentSection = section;
  document.querySelectorAll('.section-panel').forEach(p => p.classList.remove('active'));
  const el = document.getElementById('section-' + section);
  if (el) {
    el.classList.add('active');
    el.classList.add('fade-in');
  }

  document.querySelectorAll('.nav-btn[data-section]').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.section === section);
  });

  if (section === 'today') renderTodayEvents();
  if (section === 'calendar') {
    if (calView === 'agenda') renderAgenda();
    else renderCalendar();
  }
  if (section === 'orgs') renderOrgs();
  if (section === 'myEvents') { eventsPage = 1; renderMyEvents(); }
  if (section === 'contact') { viewingThread = null; renderContact(); }
  if (section === 'home') renderHomeEvents();
  if (section === 'newEvent' && !editingEventId && !cloningEvent) resetEventForm();
  if (section === 'newEvent') cloningEvent = false;
  if (section === 'adminMessages') { adminViewingThread = null; renderAdminMessages(); }
  if (section === 'reviewQueue') renderReviewQueue();
  if (section === 'manageOrgs') renderAdminOrgs();
  if (section === 'manageUsers') renderAdminUsers();
  if (section === 'eventSettings') renderEventSettings();
  if (section === 'siteSettings') renderHomepageSettings();
  if (section === 'dbSettings') applyDbSettingsDemoState();
}

// ======= MODAL =======
function openModal(id) {
  document.getElementById(id).classList.add('open');
  document.body.style.overflow = 'hidden';
  if (id === 'purposeModal') loadPurpose();
  if (id === 'newMessageModal') populateSendAsDropdown();
}

function closeModal(id) {
  document.getElementById(id).classList.remove('open');
  document.body.style.overflow = '';
}

document.querySelectorAll('.modal-overlay').forEach(overlay => {
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      overlay.classList.remove('open');
      document.body.style.overflow = '';
    }
  });
});

// ======= TOAST =======
function showToast(msg) {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2500);
}

// ======= CONFIRM DIALOG =======
function showConfirm(title, message, btnText, onConfirm) {
  document.getElementById('confirmTitle').textContent = title;
  document.getElementById('confirmMessage').textContent = message;
  const btn = document.getElementById('confirmBtn');
  btn.textContent = btnText;
  btn.onclick = () => { closeConfirm(); onConfirm(); };
  document.getElementById('confirmDialog').classList.add('open');
}

function closeConfirm() {
  document.getElementById('confirmDialog').classList.remove('open');
  document.getElementById('confirmBtn').style.display = '';
  document.querySelector('.confirm-actions').style.display = '';
}

// ======= PURPOSE =======
function loadPurpose() {
  const el = document.getElementById('purposeContent');
  if (AppConfig.purposeText) {
    el.innerHTML = AppConfig.purposeText;
  }
}

// ======= EVENT CARDS =======
function createEventCard(event) {
  const isHostOrg = event.org_is_host;
  const startTime = event.start_time || '';
  const endTime = event.end_time || '';
  const orgName = event.org_name || (AppConfig.siteName + ' Admin');
  const showVerified = isHostOrg && event.org_name;
  const desc = event.description || '';

  return `
    <div class="event-card" onclick="openEventDetail(${event.id})">
      <div class="event-card-date">${formatDate(event.date)} · ${startTime} – ${endTime}</div>
      <div class="event-card-title">${escHtml(event.title)}</div>
      <div class="event-card-org">
        ${escHtml(orgName)}
        ${showVerified ? '<span class="verified-badge" title="Event added by hosting organization">&#x2713;</span>' : ''}
      </div>
      <div class="event-card-desc">${escHtml(desc)}</div>
      <div class="event-card-footer">
        ${event.event_type ? `<span class="event-tag">${escHtml(formatEventType(event.event_type))}</span>` : ''}
        ${event.reg_required ? '<span class="event-tag reg-required">Registration Required</span>' : ''}
        ${event.address ? '<span class="event-tag">In Person</span>' : '<span class="event-tag virtual-tag">Virtual</span>'}
      </div>
    </div>
  `;
}

async function openEventDetail(id, footerHtml) {
  let event;
  try {
    event = await api('/events/' + id);
  } catch (e) {
    event = cachedEvents.find(e => e.id === id);
  }
  if (!event) return;
  _currentDetailEvent = event;

  const bringItems = event.bring_items || [];
  const noBringItems = event.no_bring_items || [];

  const bringHtml = bringItems.length > 0
    ? `<div style="margin-top:16px;"><strong style="font-family:var(--font-display);font-size:12px;text-transform:uppercase;letter-spacing:0.06em;color:var(--text-dim);">What to Bring</strong><div class="chip-group" style="margin-top:6px;">${bringItems.map(b => `<span class="chip selected" style="cursor:default;">${escHtml(b)}</span>`).join('')}</div></div>`
    : '';

  const noBringHtml = noBringItems.length > 0
    ? `<div style="margin-top:16px;"><strong style="font-family:var(--font-display);font-size:12px;text-transform:uppercase;letter-spacing:0.06em;color:var(--text-dim);">What NOT to Bring</strong><div class="chip-group" style="margin-top:6px;">${noBringItems.map(b => `<span class="chip selected" style="cursor:default;background:rgba(224,85,85,0.08);border-color:rgba(224,85,85,0.2);color:#E05555;">${escHtml(b)}</span>`).join('')}</div></div>`
    : '';

  // Show edit button only if no custom footer is provided (avoid duplicates)
  const canEdit = DemoSession.role === 'admin' || (DemoSession.role === 'organizer' && event.org_id === DemoSession.orgId);
  const editBtnHtml = (canEdit && !footerHtml) ? `<button class="btn btn-ghost btn-xs" style="margin-right:8px;" onclick="closeEventDetailModal(); editEvent(${event.id})">Edit</button>` : '';

  let finalFooterHtml = footerHtml || '';
  if (canEdit && !footerHtml) {
    finalFooterHtml = `<button class="btn btn-secondary btn-sm" onclick="closeEventDetailModal(); editEvent(${event.id})">Edit Event</button>`;
  }
  // Add "Message Organizer" button for admin (when not already in custom footer with messaging)
  if (DemoSession.role === 'admin' && !footerHtml) {
    finalFooterHtml += `<button class="btn btn-ghost btn-sm" onclick="toggleEventMessages(${event.id})">Message Organizer</button>`;
  }
  const footerSection = finalFooterHtml ? `<div class="modal-footer">${finalFooterHtml}</div>` : '';

  const displayOrgName = event.org_name || (AppConfig.siteName + ' Admin');
  const showVerifiedDetail = event.org_is_host && event.org_name;

  const detailHTML = `
    <div class="modal-overlay open" id="eventDetailModal" onclick="if(event.target===this){this.remove();document.body.style.overflow='';}">
      <div class="modal-box" style="max-width:640px;">
        <div class="modal-header">
          <h2>${escHtml(event.title)}</h2>
          <div style="display:flex;align-items:center;">
            ${editBtnHtml}
            <button class="modal-close" onclick="document.getElementById('eventDetailModal').remove();document.body.style.overflow='';">&#x2715;</button>
          </div>
        </div>
        <div class="modal-body">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:16px;">
            <span style="font-family:var(--font-display);font-size:13px;font-weight:600;color:var(--text-muted);">${escHtml(displayOrgName)}</span>
            ${showVerifiedDetail ? '<span class="verified-badge" title="Event added by hosting organization">&#x2713;</span>' : ''}
            ${event.reg_required ? '<span class="event-tag reg-required" style="margin-left:auto;">Registration Required</span>' : ''}
          </div>
          <div style="display:grid;grid-template-columns:auto 1fr;gap:8px 16px;margin-bottom:16px;font-size:14px;">
            <span style="color:var(--text-dim);font-family:var(--font-display);font-size:12px;font-weight:600;">DATE</span>
            <span>${formatDate(event.date)}</span>
            <span style="color:var(--text-dim);font-family:var(--font-display);font-size:12px;font-weight:600;">TIME</span>
            <span>${event.start_time || ''} – ${event.end_time || ''}</span>
            ${event.address ? `<span style="color:var(--text-dim);font-family:var(--font-display);font-size:12px;font-weight:600;">LOCATION</span><span>${escHtml(event.address)}</span>` : `<span style="color:var(--text-dim);font-family:var(--font-display);font-size:12px;font-weight:600;">LOCATION</span><span style="color:var(--sky-light);">Virtual / Online</span>`}
          </div>
          <p style="line-height:1.7;color:var(--text-muted);">${escHtml(event.description || '')}</p>
          ${bringHtml}
          ${noBringHtml}
          ${event.notes ? `<div style="margin-top:20px;padding:14px;background:var(--bg);border-radius:var(--radius-sm);border:1px solid var(--border);"><strong style="font-family:var(--font-display);font-size:12px;text-transform:uppercase;letter-spacing:0.06em;color:var(--text-dim);display:block;margin-bottom:6px;">Notes from the Organizer</strong><p style="font-size:14px;color:var(--text-muted);line-height:1.6;">${escHtml(event.notes)}</p></div>` : ''}
        </div>
        <div class="share-actions" id="shareActionsBar">
        </div>
        <div id="eventMsgPanel"></div>
        ${footerSection}
      </div>
    </div>
  `;
  document.body.insertAdjacentHTML('beforeend', detailHTML);
  document.body.style.overflow = 'hidden';

  // For organizers: check for unread messages on this event and auto-expand
  if (DemoSession.role === 'organizer' || (DemoSession.role === 'admin' && !footerHtml)) {
    checkEventUnreadMessages(event.id).then(hasUnread => {
      if (hasUnread && DemoSession.role === 'organizer') {
        toggleEventMessages(event.id);
      }
    });
  }

  // Populate share-actions with role-based buttons
  const hasExternalFlyer = !!event.flyer_url;
  const hasGeneratedFlyer = !!event.generated_flyer_url;
  const hasAnyFlyer = hasExternalFlyer || hasGeneratedFlyer;
  const isOwner = DemoSession.role === 'admin' ||
    (DemoSession.role === 'organizer' && event.org_id === DemoSession.orgId);

  const shareBar = document.getElementById('shareActionsBar');
  if (shareBar) {
    let btns = '';
    if (hasAnyFlyer) {
      const flyerHref = hasExternalFlyer ? escAttr(event.flyer_url) : escAttr(event.generated_flyer_url);
      btns += `<a class="btn btn-ghost btn-sm" href="${flyerHref}" target="_blank" rel="noopener" style="text-decoration:none;">&#x1F4E5; Download Flyer</a>`;
    }
    if (isOwner && !hasAnyFlyer) {
      btns += `<button class="btn btn-ghost btn-sm" onclick="generateFlyer(_currentDetailEvent)">&#x1F5BC; Generate Flyer</button>`;
    }
    if (isOwner && hasGeneratedFlyer && !hasExternalFlyer) {
      btns += `<button class="btn btn-ghost btn-sm" style="color:#E05555;" onclick="deleteGeneratedFlyer(${event.id})">&#x1F5D1; Delete Flyer</button>`;
    }
    btns += `<button class="btn btn-ghost btn-sm" onclick="copyEventDetails(_currentDetailEvent)">&#x1F4CB; Copy Details</button>`;
    btns += `<button class="btn btn-ghost btn-sm" onclick="copyEventMarkdown(_currentDetailEvent)">&#x1F4DD; Copy Markdown</button>`;
    if (isOwner && hasGeneratedFlyer) {
      btns += `<p class="auto-delete-notice">Generated flyer auto-deletes ${AppConfig.flyerAutoDeleteDays} days after event ends.</p>`;
    }
    shareBar.innerHTML = btns;
  }
}

function closeEventDetailModal() {
  const modal = document.getElementById('eventDetailModal');
  if (modal) { modal.remove(); document.body.style.overflow = ''; }
}

async function openReviewEventDetail(id) {
  const event = cachedEvents.find(e => e.id === id);
  const footerHtml = `
    <button class="btn btn-success btn-sm" onclick="closeEventDetailModal(); approveEvent(${id})">Approve</button>
    <button class="btn btn-danger btn-sm" onclick="closeEventDetailModal(); rejectEvent(${id})">Reject</button>
    <button class="btn btn-ghost btn-sm" style="margin-left:auto;" onclick="toggleEventMessages(${id})">Message Organizer</button>
  `;
  await openEventDetail(id, footerHtml);
}

// ======= HOME =======
async function renderHomeEvents() {
  showLoading('homeEventsGrid');
  await loadEvents();
  const published = cachedEvents.filter(e => e.status === 'published').sort((a, b) => new Date(a.date) - new Date(b.date));
  const el = document.getElementById('homeEventsGrid');
  el.innerHTML = published.map(createEventCard).join('');

  // Update stats
  document.getElementById('statEvents').textContent = published.length;
  await loadOrgs();
  document.getElementById('statOrgs').textContent = cachedOrgs.length;
  document.getElementById('statMobilized').textContent = published.length > 0 ? (published.length * 50).toLocaleString() : '--';
}

// ======= TODAY'S EVENTS =======
async function renderTodayEvents() {
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  document.getElementById('todayDateLabel').textContent = today.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  await loadEvents();
  const todayEvents = cachedEvents.filter(e => e.date === todayStr && e.status === 'published');
  if (todayEvents.length === 0) {
    document.getElementById('todayEventsGrid').innerHTML = '';
    document.getElementById('todayEmpty').style.display = 'block';
  } else {
    document.getElementById('todayEmpty').style.display = 'none';
    document.getElementById('todayEventsGrid').innerHTML = todayEvents.map(createEventCard).join('');
  }
}

// ======= CALENDAR =======
async function renderCalendar() {
  await loadEvents();
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  document.getElementById('calMonthLabel').textContent = `${monthNames[calMonth]} ${calYear}`;

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const firstDay = new Date(calYear, calMonth, 1).getDay();
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const daysInPrev = new Date(calYear, calMonth, 0).getDate();

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  let html = dayNames.map(d => `<div class="cal-header">${d}</div>`).join('');

  for (let i = firstDay - 1; i >= 0; i--) {
    html += `<div class="cal-day other-month"><div class="cal-day-num">${daysInPrev - i}</div></div>`;
  }

  const publishedEvents = cachedEvents.filter(e => e.status === 'published');

  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const isToday = dateStr === todayStr;
    const dayEvents = publishedEvents.filter(e => e.date === dateStr);
    const hasEvents = dayEvents.length > 0;

    html += `<div class="cal-day ${isToday ? 'today' : ''} ${hasEvents ? 'has-events' : ''}"${hasEvents && dayEvents.length === 1 ? ` onclick="openEventDetail(${dayEvents[0].id})"` : ''}>
      <div class="cal-day-num">${d}</div>
      ${dayEvents.slice(0, 2).map(e => `<div class="cal-event-dot" onclick="event.stopPropagation(); openEventDetail(${e.id})">${escHtml(e.title)}</div>`).join('')}
      ${dayEvents.length > 2 ? `<div class="cal-event-dot">+${dayEvents.length - 2} more</div>` : ''}
    </div>`;
  }

  const totalCells = firstDay + daysInMonth;
  const remaining = (7 - (totalCells % 7)) % 7;
  for (let i = 1; i <= remaining; i++) {
    html += `<div class="cal-day other-month"><div class="cal-day-num">${i}</div></div>`;
  }

  document.getElementById('calendarGrid').innerHTML = html;
}

function changeMonth(delta) {
  calMonth += delta;
  if (calMonth > 11) { calMonth = 0; calYear++; }
  if (calMonth < 0) { calMonth = 11; calYear--; }
  renderCalendar();
}

// ======= AGENDA VIEW =======
function getMonday(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function switchCalView(view) {
  calView = view;
  document.getElementById('toggleAgenda').classList.toggle('active', view === 'agenda');
  document.getElementById('toggleMonth').classList.toggle('active', view === 'month');
  document.getElementById('agendaView').style.display = view === 'agenda' ? '' : 'none';
  document.getElementById('monthView').style.display = view === 'month' ? '' : 'none';
  if (view === 'agenda') renderAgenda();
  else renderCalendar();
}

function changeWeek(delta) {
  if (!agendaWeekStart) agendaWeekStart = getMonday(new Date());
  agendaWeekStart.setDate(agendaWeekStart.getDate() + delta * 7);
  renderAgenda();
}

function getEventTypeColor(type) {
  const map = {
    march: 'var(--type-march)',
    protest_gathering: 'var(--type-protest)',
    community_event: 'var(--type-community)',
    virtual: 'var(--type-virtual)',
    signature_gathering: 'var(--type-signature)',
  };
  return map[type] || 'var(--text-dim)';
}

async function renderAgenda() {
  await loadEvents();
  if (!agendaWeekStart) agendaWeekStart = getMonday(new Date());

  const weekDates = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(agendaWeekStart);
    d.setDate(d.getDate() + i);
    weekDates.push(d);
  }

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const mon = weekDates[0];
  const sun = weekDates[6];
  let label;
  if (mon.getMonth() === sun.getMonth()) {
    label = `${monthNames[mon.getMonth()]} ${mon.getDate()} – ${sun.getDate()}, ${mon.getFullYear()}`;
  } else if (mon.getFullYear() === sun.getFullYear()) {
    label = `${monthNames[mon.getMonth()]} ${mon.getDate()} – ${monthNames[sun.getMonth()]} ${sun.getDate()}, ${mon.getFullYear()}`;
  } else {
    label = `${monthNames[mon.getMonth()]} ${mon.getDate()}, ${mon.getFullYear()} – ${monthNames[sun.getMonth()]} ${sun.getDate()}, ${sun.getFullYear()}`;
  }
  document.getElementById('agendaWeekLabel').textContent = label;

  const today = new Date();
  const currentMonday = getMonday(today);
  const isThisWeek = agendaWeekStart.getTime() === currentMonday.getTime();
  document.getElementById('agendaThisWeek').textContent = isThisWeek ? 'This Week' : '';

  // Render legend
  const legendTypes = [
    { type: 'march', label: 'March' },
    { type: 'protest_gathering', label: 'Protest' },
    { type: 'community_event', label: 'Community' },
    { type: 'virtual', label: 'Virtual' },
    { type: 'signature_gathering', label: 'Signature Gathering' },
  ];
  document.getElementById('agendaLegend').innerHTML = legendTypes.map(t =>
    `<div class="agenda-legend-item"><span class="agenda-legend-dot" style="background:${getEventTypeColor(t.type)}"></span>${t.label}</div>`
  ).join('');

  const publishedEvents = cachedEvents.filter(e => e.status === 'published');
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  let html = '';
  let todayBlockId = null;

  for (const date of weekDates) {
    const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    const isToday = dateStr === todayStr;
    const dayEvents = publishedEvents.filter(e => e.date === dateStr).sort((a, b) => {
      const ta = a.start_time || '00:00';
      const tb = b.start_time || '00:00';
      return ta.localeCompare(tb);
    });

    const blockId = 'agenda-day-' + dateStr;
    if (isToday) todayBlockId = blockId;

    html += `<div class="agenda-day-block" id="${blockId}">`;
    html += `<div class="agenda-day-header ${isToday ? 'is-today' : ''}">
      <span class="agenda-day-name">${dayNames[date.getDay()]}</span>
      <span class="agenda-day-date">${monthNames[date.getMonth()]} ${date.getDate()}</span>
      <span class="agenda-count-badge">${dayEvents.length} event${dayEvents.length !== 1 ? 's' : ''}</span>
    </div>`;

    if (dayEvents.length === 0) {
      html += `<div class="agenda-empty-day">No events scheduled</div>`;
    } else {
      for (const event of dayEvents) {
        html += renderAgendaEventCard(event);
      }
    }
    html += `</div>`;
  }

  document.getElementById('agendaDays').innerHTML = html;

  if (todayBlockId && isThisWeek) {
    setTimeout(() => {
      const el = document.getElementById(todayBlockId);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  }
}

function renderAgendaEventCard(event) {
  const orgName = event.org_name || (AppConfig.siteName + ' Admin');
  const showVerified = event.org_is_host && event.org_name;
  const startTime = event.start_time || '';
  const endTime = event.end_time || '';
  const typeColor = getEventTypeColor(event.event_type);
  const location = event.address || (event.is_virtual ? 'Virtual / Online' : '');

  return `<div class="agenda-event-card" onclick="openEventDetail(${event.id})">
    <div class="agenda-time-block">
      <div class="agenda-time-start">${escHtml(startTime)}</div>
      ${endTime ? `<div class="agenda-time-end">${escHtml(endTime)}</div>` : ''}
    </div>
    <div class="agenda-event-details">
      <div class="agenda-event-title">${escHtml(event.title)}</div>
      <div class="agenda-event-org">
        <span>${escHtml(orgName)}</span>
        ${showVerified ? '<span class="verified-badge" title="Verified org">&#x2713;</span>' : ''}
      </div>
      ${location ? `<div class="agenda-event-location">${escHtml(location)}</div>` : ''}
      <div class="agenda-event-tags">
        ${event.event_type ? `<span class="agenda-type-dot" style="background:${typeColor}"></span><span class="event-tag">${escHtml(formatEventType(event.event_type))}</span>` : ''}
        ${event.registration_required ? '<span class="event-tag reg-required">Reg. Required</span>' : ''}
        ${event.is_virtual ? '<span class="event-tag virtual-tag">Virtual</span>' : ''}
      </div>
    </div>
  </div>`;
}

// ======= ORGANIZATIONS =======
async function renderOrgs() {
  await loadOrgs();
  // Populate city dropdown from distinct cities
  const cities = [...new Set(cachedOrgs.map(o => o.city).filter(Boolean))].sort();
  const citySelect = document.getElementById('orgsCityFilter');
  citySelect.innerHTML = '<option value="">All Cities</option>' + cities.map(c => `<option value="${escAttr(c)}">${escHtml(c)}</option>`).join('');
  // Clear search
  document.getElementById('orgsSearch').value = '';
  filterOrgs();
}

function filterOrgs() {
  const search = (document.getElementById('orgsSearch').value || '').toLowerCase().trim();
  const cityVal = document.getElementById('orgsCityFilter').value;

  let filtered = cachedOrgs;
  if (search) {
    filtered = filtered.filter(o => o.name.toLowerCase().includes(search));
  }
  if (cityVal) {
    filtered = filtered.filter(o => o.city === cityVal);
  }

  // Stats bar
  const distinctCities = [...new Set(filtered.map(o => o.city).filter(Boolean))].length;
  const totalEvents = filtered.reduce((sum, o) => sum + (o.event_count || 0), 0);
  document.getElementById('orgsStats').innerHTML = `
    <div class="orgs-stat-block"><span class="orgs-stat-value">${filtered.length}</span><span class="orgs-stat-label">Organizations</span></div>
    <div class="orgs-stat-block"><span class="orgs-stat-value">${distinctCities}</span><span class="orgs-stat-label">Cities</span></div>
    <div class="orgs-stat-block"><span class="orgs-stat-value">${totalEvents}</span><span class="orgs-stat-label">Events Hosted</span></div>
  `;

  // Render cards
  document.getElementById('orgsList').innerHTML = filtered.map(org => {
    const socials = org.socials || {};
    const initials = (org.abbreviation || org.name.split(' ').map(w => w[0]).join('')).slice(0, 3);
    const websiteDisplay = org.website
      ? `<a href="${escAttr(org.website)}" class="org-website-link" target="_blank" rel="noopener" onclick="event.stopPropagation()">${escHtml(org.website.replace(/^https?:\/\//, ''))}</a>`
      : '<span class="org-website-none">No website listed</span>';
    const eventCount = org.event_count || 0;

    return `
      <div class="org-card">
        ${org.logo_url
          ? `<img src="${escAttr(org.logo_url)}" class="org-avatar" style="object-fit:cover;" onerror="this.outerHTML='<div class=\\'org-avatar\\'>${escHtml(initials)}</div>'">`
          : `<div class="org-avatar">${escHtml(initials)}</div>`
        }
        <div class="org-info">
          <div class="org-name-row">
            <span class="org-name">${escHtml(org.name)}</span>
            ${org.verified ? '<span class="org-verified-badge" title="Verified organization">&#x2713;</span>' : ''}
            <span class="org-event-pill">${eventCount} event${eventCount !== 1 ? 's' : ''}</span>
          </div>
          <div class="org-mission">${org.mission_statement ? escHtml(org.mission_statement) : ''}</div>
          <div class="org-website">${websiteDisplay}</div>
        </div>
        <div class="org-links">
          ${['fb','ig','sc','sg','rd','x'].filter(k => socials[k]).map(k =>
            `<a href="${escAttr(socials[k])}" class="org-link-icon social-${k}" title="${socialTitles[k]}" target="_blank" rel="noopener" onclick="event.stopPropagation()">${socialSvgs[k]}</a>`
          ).join('')}
        </div>
      </div>
    `;
  }).join('');
}

// ======= MY EVENTS =======
async function renderMyEvents() {
  showLoading('myEventsList');
  await loadEvents();
  await loadMessages();
  const myOrgId = DemoSession.orgId;
  let events = cachedEvents.filter(e => {
    if (DemoSession.role === 'admin') return true;
    return e.org_id === myOrgId;
  });

  if (!showArchived) {
    events = events.filter(e => e.status !== 'archived');
  }

  events.sort((a, b) => {
    const now = new Date().toISOString().split('T')[0];
    const aFuture = a.date >= now;
    const bFuture = b.date >= now;
    if (aFuture && !bFuture) return -1;
    if (!aFuture && bFuture) return 1;
    if (aFuture) return new Date(a.date) - new Date(b.date);
    return new Date(b.date) - new Date(a.date);
  });

  const pageEvents = events.slice(0, eventsPage * 20);

  document.getElementById('myEventsList').innerHTML = pageEvents.map(e => {
    const statusClass = e.status === 'published' ? 'status-published' : e.status === 'review' ? 'status-review' : e.status === 'pending_org' ? 'status-pending-org' : e.status === 'draft' ? 'status-draft' : 'status-archived';
    const statusLabel = e.status === 'published' ? 'Published' : e.status === 'review' ? 'In Review' : e.status === 'pending_org' ? 'Pending Response' : e.status === 'draft' ? 'Draft' : 'Archived';

    // Message badge: count unread messages for this event
    const eventMsgCount = cachedMessages.filter(m => m.event_id === e.id && m.has_unread).length;
    const msgBadgeHtml = eventMsgCount > 0 ? `<span class="event-msg-badge" title="${eventMsgCount} unread message(s)">${eventMsgCount}</span>` : '';

    // Approved badge: if published and not yet seen
    const approvedBadgeHtml = (e.status === 'published' && !e.published_seen && DemoSession.role !== 'admin') ? '<span class="approved-badge">Approved</span>' : '';

    return `
      <div class="event-list-item${e.status === 'archived' ? ' archived-row' : ''}" style="cursor:pointer;" onclick="openMyEventDetail(${e.id})">
        <div class="event-list-date">${formatDate(e.date)}</div>
        <div class="event-list-name">${escHtml(e.title)}</div>
        ${msgBadgeHtml}
        ${approvedBadgeHtml}
        ${e.status === 'pending_org'
          ? `<span class="event-list-status ${statusClass}" style="cursor:pointer;text-decoration:underline;" onclick="event.stopPropagation(); goToEventMessage(${e.id})" title="View conversation">${statusLabel}</span>`
          : `<span class="event-list-status ${statusClass}">${statusLabel}</span>`
        }
        <div class="event-list-actions">
          ${e.status !== 'archived' ? `
            <button class="btn btn-ghost btn-xs" onclick="event.stopPropagation(); editEvent(${e.id})" title="Edit">Edit</button>
            <button class="btn btn-ghost btn-xs" onclick="event.stopPropagation(); cloneEvent(${e.id})" title="Clone">Clone</button>
            <button class="btn btn-ghost btn-xs" onclick="event.stopPropagation(); archiveEvent(${e.id})" title="Archive">Archive</button>
          ` : `
            <button class="btn btn-ghost btn-xs" onclick="event.stopPropagation(); cloneEvent(${e.id})" title="Clone">Clone</button>
            <button class="btn btn-ghost btn-xs" onclick="event.stopPropagation(); unarchiveEvent(${e.id})" title="Unarchive">Unarchive</button>
          `}
        </div>
      </div>
    `;
  }).join('');

  document.getElementById('loadMoreEvents').style.display = events.length > pageEvents.length ? 'block' : 'none';
  document.getElementById('archiveToggle').textContent = showArchived ? 'Hide Archived' : 'Show Archived';

  // Mark published events as seen
  if (DemoSession.role !== 'admin') {
    const publishedUnseen = pageEvents.filter(e => e.status === 'published' && !e.published_seen).map(e => e.id);
    if (publishedUnseen.length > 0) {
      try {
        await api('/events/published-seen', { method: 'POST', body: JSON.stringify({ event_ids: publishedUnseen }) });
        publishedUnseen.forEach(id => {
          const ev = cachedEvents.find(e => e.id === id);
          if (ev) ev.published_seen = true;
        });
      } catch (e) {
        // Non-critical
      }
    }
  }
}

function toggleArchivedEvents() {
  showArchived = !showArchived;
  renderMyEvents();
}

function loadMoreEvents() {
  eventsPage++;
  renderMyEvents();
}

async function editEvent(id) {
  let event;
  try {
    event = await api('/events/' + id);
  } catch (e) {
    event = cachedEvents.find(ev => ev.id === id);
  }
  if (!event) return;

  editingEventId = id;
  document.getElementById('eventFormTitle').textContent = 'Edit Event: ' + event.title;
  document.getElementById('eventTitle').value = event.title || '';

  // Parse dates
  if (event.date && event.start_time) {
    const startDT = parseDateTimeToLocal(event.date, event.start_time);
    if (startDT) document.getElementById('eventStart').value = startDT;
  }
  if (event.date && event.end_time) {
    const endDT = parseDateTimeToLocal(event.date, event.end_time);
    if (endDT) document.getElementById('eventEnd').value = endDT;
  }

  document.getElementById('eventDesc').value = event.description || '';

  // Virtual event check
  const isVirtual = !event.address && !event.parking;
  document.getElementById('virtualEventCheck').checked = !!event.is_virtual || isVirtual;
  toggleVirtualEvent();

  document.getElementById('addressInput').value = event.address || '';
  document.getElementById('eventParking').value = event.parking || '';
  document.getElementById('eventFlyer').value = event.flyer_url || '';
  document.getElementById('eventWebsite').value = event.website_url || '';
  document.getElementById('regLink').value = event.reg_link || '';
  document.getElementById('regRequiredCheck').checked = !!event.reg_required;
  document.getElementById('eventNotes').value = event.notes || '';

  // Set event type
  setEventTypeValue(event.event_type || '');

  // Set bring chips
  setChipSelections('bringChips', event.bring_items || []);
  setChipSelections('noBringChips', event.no_bring_items || []);

  // Populate sponsor org dropdown with event's current org pre-selected
  populateSponsorOrg(event.org_id);

  showSection('newEvent');
}

function resetEventForm() {
  editingEventId = null;
  document.getElementById('eventFormTitle').textContent = 'Register a New Event';
  document.getElementById('eventForm').reset();
  // Populate sponsor org dropdown
  populateSponsorOrg();
  // Reset event type
  setEventTypeValue('');
  // Reset virtual event
  document.getElementById('virtualEventCheck').checked = false;
  toggleVirtualEvent();
  // Reset recurring
  document.getElementById('recurringCheck').checked = false;
  toggleRecurring();
  // Reset chips
  document.querySelectorAll('#bringChips .chip, #noBringChips .chip').forEach(c => c.classList.remove('selected'));
  // Remove custom chips
  document.querySelectorAll('#bringChips .chip.custom, #noBringChips .chip.custom').forEach(c => c.remove());
}

async function cloneEvent(id) {
  let event;
  try {
    event = await api('/events/' + id);
  } catch (e) {
    event = cachedEvents.find(ev => ev.id === id);
  }
  if (!event) return;

  editingEventId = null; // Not editing — creating new
  document.getElementById('eventFormTitle').textContent = 'Clone Event: ' + event.title;
  document.getElementById('eventTitle').value = event.title || '';

  // Copy dates from original event
  if (event.date && event.start_time) {
    const startDT = parseDateTimeToLocal(event.date, event.start_time);
    if (startDT) document.getElementById('eventStart').value = startDT;
  }
  if (event.date && event.end_time) {
    const endDT = parseDateTimeToLocal(event.date, event.end_time);
    if (endDT) document.getElementById('eventEnd').value = endDT;
  }

  document.getElementById('eventDesc').value = event.description || '';

  // Virtual event check
  const isVirtual = !event.address && !event.parking;
  document.getElementById('virtualEventCheck').checked = isVirtual;
  toggleVirtualEvent();

  document.getElementById('addressInput').value = event.address || '';
  document.getElementById('eventParking').value = event.parking || '';
  document.getElementById('eventFlyer').value = event.flyer_url || '';
  document.getElementById('eventWebsite').value = event.website_url || '';
  document.getElementById('regLink').value = event.reg_link || '';
  document.getElementById('regRequiredCheck').checked = !!event.reg_required;
  document.getElementById('eventNotes').value = event.notes || '';

  // Set event type
  setEventTypeValue(event.event_type || '');

  // Reset recurring for clone
  document.getElementById('recurringCheck').checked = false;
  toggleRecurring();

  setChipSelections('bringChips', event.bring_items || []);
  setChipSelections('noBringChips', event.no_bring_items || []);

  cloningEvent = true;
  showSection('newEvent');
}

async function archiveEvent(id) {
  showConfirm(
    'Archive Event?',
    `This action is permanent. Archived events will be automatically deleted after ${AppConfig.archiveRetentionMonths} months and cannot be recovered.`,
    'Archive Event',
    async () => {
      try {
        await api('/events/' + id, {
          method: 'PUT',
          body: JSON.stringify({ status: 'archived' }),
        });
        showToast('Event archived');
        renderMyEvents();
      } catch (e) {
        showToast('Error archiving event');
      }
    }
  );
}

async function unarchiveEvent(id) {
  try {
    await api('/events/' + id, {
      method: 'PUT',
      body: JSON.stringify({ status: 'draft' }),
    });
    showToast('Event restored to draft');
    renderMyEvents();
  } catch (e) {
    showToast('Error restoring event');
  }
}

// ======= NAVIGATE TO EVENT MESSAGE =======
async function goToEventMessage(eventId) {
  // Open the event detail modal and auto-expand messages
  await openMyEventDetail(eventId);
  // Small delay to ensure modal is rendered, then expand messages
  setTimeout(() => toggleEventMessages(eventId), 200);
}

// ======= MY EVENT DETAIL (organizer view) =======
async function openMyEventDetail(id) {
  const event = cachedEvents.find(e => e.id === id);
  const statusClass = event ? (event.status === 'published' ? 'status-published' : event.status === 'review' ? 'status-review' : event.status === 'pending_org' ? 'status-pending-org' : event.status === 'draft' ? 'status-draft' : 'status-archived') : '';
  const statusLabel = event ? (event.status === 'published' ? 'Published' : event.status === 'review' ? 'In Review' : event.status === 'pending_org' ? 'Pending Response' : event.status === 'draft' ? 'Draft' : 'Archived') : '';

  const footerHtml = `
    <span class="event-list-status ${statusClass}" style="margin-right:auto;">${statusLabel}</span>
    ${event && event.status !== 'archived' ? `
      <button class="btn btn-secondary btn-sm" onclick="closeEventDetailModal(); editEvent(${id})">Edit</button>
      <button class="btn btn-ghost btn-sm" onclick="closeEventDetailModal(); cloneEvent(${id})">Clone</button>
      <button class="btn btn-ghost btn-sm" onclick="closeEventDetailModal(); archiveEvent(${id})">Archive</button>
    ` : `
      <button class="btn btn-ghost btn-sm" onclick="closeEventDetailModal(); cloneEvent(${id})">Clone</button>
      <button class="btn btn-ghost btn-sm" onclick="closeEventDetailModal(); unarchiveEvent(${id})">Unarchive</button>
    `}
    <button class="btn btn-ghost btn-sm" onclick="toggleEventMessages(${id})">Messages</button>
  `;
  await openEventDetail(id, footerHtml);
}

// ======= CONTACT =======
async function renderContact() {
  const container = document.getElementById('contactList');
  const threadContainer = document.getElementById('contactThread');

  if (viewingThread !== null) {
    container.style.display = 'none';
    threadContainer.style.display = 'block';
    await renderThread(viewingThread);
    return;
  }

  container.style.display = 'block';
  threadContainer.style.display = 'none';

  await loadMessages();
  let topics = cachedMessages;
  if (!showArchivedTopics) {
    topics = topics.filter(m => !m.archived);
  }

  container.innerHTML = topics.map(m => `
    <div class="msg-list-item${m.has_unread ? ' msg-unread' : ''}${m.archived ? ' archived-row' : ''}" onclick="viewThread(${m.id})">
      ${m.has_unread ? '<span class="new-indicator">New</span>' : ''}
      ${m.archived ? '<span class="event-list-status status-archived">Archived</span>' : ''}
      <div class="msg-topic">${escHtml(m.topic)}</div>
      <div class="msg-meta">
        <div style="font-weight:600;">${escHtml(m.org_name || 'Unknown')}</div>
        <div>${formatTimestamp(m.created_at)}</div>
      </div>
      ${m.archived
        ? `<button class="btn btn-ghost btn-xs" onclick="event.stopPropagation(); unarchiveTopic(${m.id})" title="Unarchive">Unarchive</button>`
        : `<button class="btn btn-ghost btn-xs" onclick="event.stopPropagation(); archiveTopic(${m.id})" title="Archive">Archive</button>`
      }
    </div>
  `).join('');

  if (topics.length === 0) {
    container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">&#x1F4AC;</div><h3>No messages yet</h3><p>Start a conversation with the site admin.</p></div>';
  }

  document.getElementById('contactArchiveToggle').textContent = showArchivedTopics ? 'Hide Archived' : 'Show Archived';
}

async function viewThread(id) {
  viewingThread = id;
  await renderContact();
  // After viewing a thread, the API marks it as read, so refresh badges
  cachedMessages = []; // Force reload on next badge update
  updateMessagesBadge();
  updateMyEventsBadge();
}

async function renderThread(id) {
  let thread;
  try {
    thread = await api('/messages/' + id);
  } catch (e) {
    thread = cachedMessages.find(m => m.id === id);
  }
  if (!thread) return;

  const replies = thread.replies || [];
  const orgName = thread.org_name || 'Unknown';

  const threadContainer = document.getElementById('contactThread');
  threadContainer.innerHTML = `
    <div style="margin-bottom: 20px;">
      <button class="btn btn-ghost btn-sm" onclick="viewingThread=null; renderContact();">&larr; Back to Messages</button>
      <h3 style="font-size: 18px; font-weight: 700; margin-top: 12px;">${escHtml(thread.topic)}</h3>
      <div style="font-size:13px;color:var(--text-dim);margin-top:4px;">${escHtml(orgName)}</div>
    </div>
    <div style="display:flex;gap:8px;margin-bottom:20px;">
      <textarea class="form-textarea" id="replyText" rows="2" placeholder="Type your reply..." style="min-height:60px;flex:1;"></textarea>
      <div style="display:flex;flex-direction:column;gap:4px;">
        <button class="btn btn-primary btn-sm" onclick="sendReply(${id})">Send</button>
        <button class="btn btn-ghost btn-sm" onclick="viewingThread=null; renderContact();">Cancel</button>
      </div>
    </div>
    <div>
      ${replies.slice().reverse().map(msg => {
        let senderLabel = '';
        if (msg.from_type === 'admin') {
          senderLabel = 'Site Admin';
        } else {
          senderLabel = escHtml(orgName);
        }
        // Admin sees user email in parentheses
        if (DemoSession.role === 'admin' && msg.user_email) {
          senderLabel += ` (${escHtml(msg.user_email)})`;
        }
        const timestamp = formatTimestamp(msg.created_at);
        return `
          <div class="msg-bubble ${msg.from_type === 'org' ? 'from-org' : 'from-admin'}">
            ${escHtml(msg.text)}
            <div class="msg-bubble-meta">${senderLabel} · ${timestamp}</div>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

async function sendReply(messageId) {
  const text = document.getElementById('replyText').value.trim();
  if (!text) return;

  try {
    await api('/messages/' + messageId, {
      method: 'POST',
      body: JSON.stringify({ text }),
    });
    showToast('Reply sent!');
    await renderThread(messageId);
    // Refresh badge (sender's reply is auto-marked as read)
    cachedMessages = [];
    updateMessagesBadge();
  } catch (e) {
    showToast('Error sending reply');
  }
}

function archiveTopic(id) {
  showConfirm(
    'Archive Topic?',
    `This will hide the topic from your message list. Archived topics will be deleted after ${AppConfig.archiveRetentionMonths} months.`,
    'Archive Topic',
    async () => {
      try {
        await api('/messages/' + id, {
          method: 'PUT',
          body: JSON.stringify({ archived: true }),
        });
        showToast('Topic archived');
        renderContact();
      } catch (e) {
        showToast('Error archiving topic');
      }
    }
  );
}

async function unarchiveTopic(id) {
  try {
    await api('/messages/' + id, {
      method: 'PUT',
      body: JSON.stringify({ archived: false }),
    });
    showToast('Topic restored');
    cachedMessages = [];
    renderContact();
  } catch (e) {
    showToast('Error restoring topic');
  }
}

function toggleArchivedTopics() {
  showArchivedTopics = !showArchivedTopics;
  renderContact();
}

// ======= NEW MESSAGE =======
function openMessageOrgModal(orgId, eventTitle, eventId) {
  pendingMessageOrgId = orgId;
  pendingMessageEventId = eventId || null;
  document.getElementById('newMsgTopic').value = eventTitle ? `Re: ${eventTitle}` : '';
  document.getElementById('newMsgText').value = '';
  openModal('newMessageModal');
}

async function submitNewMessage() {
  const topic = document.getElementById('newMsgTopic').value.trim();
  const text = document.getElementById('newMsgText').value.trim();
  if (!topic || !text) {
    showToast('Please fill in topic and message');
    return;
  }

  try {
    const payload = { topic, text };
    if (pendingMessageOrgId) {
      payload.org_id = pendingMessageOrgId;
    } else {
      // Read Send As dropdown
      const sendAs = document.getElementById('msgSendAs');
      if (sendAs && sendAs.value) {
        if (sendAs.value === 'personal') {
          payload.message_type = 'direct';
          payload.user_id = DemoSession.userId;
        } else {
          payload.org_id = parseInt(sendAs.value);
        }
      }
    }
    if (pendingMessageEventId) payload.event_id = pendingMessageEventId;
    await api('/messages', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    closeModal('newMessageModal');
    document.getElementById('newMsgTopic').value = '';
    document.getElementById('newMsgText').value = '';
    pendingMessageOrgId = null;
    pendingMessageEventId = null;
    showToast('Message sent!');
    // Refresh caches since message may have changed event status
    cachedMessages = [];
    cachedEvents = [];
    cachedAdminMessages = [];
    if (currentSection === 'contact') renderContact();
    if (currentSection === 'adminMessages') renderAdminMessages();
    if (currentSection === 'reviewQueue') renderReviewQueue();
    updateMessagesBadge();
    if (DemoSession.role === 'admin') {
      updateReviewBadge();
      updateAdminMessagesBadge();
    }
  } catch (e) {
    showToast('Error sending message');
  }
}

// ======= INLINE EVENT MESSAGING =======
function toggleEventMessages(eventId) {
  const panel = document.getElementById('eventMsgPanel');
  if (!panel) return;
  if (panel.innerHTML && panel.dataset.eventId == eventId) {
    // Toggle off
    panel.innerHTML = '';
    panel.dataset.eventId = '';
    return;
  }
  panel.dataset.eventId = eventId;
  renderEventMessages(eventId);
}

async function hideEventMessages(eventId) {
  // Mark messages as read before hiding
  try {
    const messages = await api('/messages?event_id=' + eventId);
    if (messages.length > 0) {
      // Reading the thread auto-marks as read on the server
      await api('/messages/' + messages[0].id);
    }
  } catch (e) {
    // ignore
  }
  // Clear cached messages to force reload on next badge check
  cachedMessages = [];
  // Close the panel
  const panel = document.getElementById('eventMsgPanel');
  if (panel) {
    panel.innerHTML = '';
    panel.dataset.eventId = '';
  }
  // Recalculate badges
  updateMessagesBadge();
  updateMyEventsBadge();
}

async function renderEventMessages(eventId) {
  const panel = document.getElementById('eventMsgPanel');
  if (!panel) return;

  panel.innerHTML = '<div class="event-msg-panel"><div class="section-loading"><div class="spinner"></div> Loading...</div></div>';

  let messages = [];
  try {
    messages = await api('/messages?event_id=' + eventId);
  } catch (e) {
    // ignore
  }

  // Get the event title for new thread topic
  const event = cachedEvents.find(e => e.id === eventId) || _currentDetailEvent;
  const eventTitle = event ? event.title : '';

  // Load replies for existing threads
  let allReplies = [];
  let threadId = null;
  if (messages.length > 0) {
    threadId = messages[0].id;
    try {
      const thread = await api('/messages/' + threadId);
      allReplies = thread.replies || [];
    } catch (e) {
      // ignore
    }
  }

  let html = '<div class="event-msg-panel">';
  html += '<div class="msg-panel-note">This conversation is visible only to admins and the organizer for this event.</div>';

  if (allReplies.length > 0) {
    html += '<div class="msg-panel-thread">';
    allReplies.forEach(msg => {
      let senderLabel = msg.from_type === 'admin' ? 'Site Admin' : 'Organizer';
      if (DemoSession.role === 'admin' && msg.user_email) {
        senderLabel += ` (${escHtml(msg.user_email)})`;
      }
      html += `
        <div class="msg-bubble ${msg.from_type === 'org' ? 'from-org' : 'from-admin'}">
          ${escHtml(msg.text)}
          <div class="msg-bubble-meta">${senderLabel} · ${formatTimestamp(msg.created_at)}</div>
        </div>
      `;
    });
    html += '</div>';
  } else {
    html += '<div class="msg-panel-empty">No messages yet. Start a conversation below.</div>';
  }

  html += `
    <div class="msg-panel-reply">
      <textarea id="eventMsgText" placeholder="Type a message..."></textarea>
    </div>
    <div class="msg-panel-actions">
      <button class="btn btn-ghost btn-sm" onclick="hideEventMessages(${eventId})">Hide Conversation</button>
      <button class="btn btn-primary btn-sm" onclick="sendEventMessage(${eventId})">Send</button>
    </div>
  `;
  html += '</div>';
  panel.innerHTML = html;

  // Mark thread as read
  if (threadId) {
    try {
      // Reading the thread via API auto-marks as read
      cachedMessages = [];
      updateMessagesBadge();
      updateMyEventsBadge();
    } catch (e) {
      // ignore
    }
  }
}

async function sendEventMessage(eventId) {
  const textEl = document.getElementById('eventMsgText');
  if (!textEl) return;
  const text = textEl.value.trim();
  if (!text) return;

  const event = cachedEvents.find(e => e.id === eventId) || _currentDetailEvent;
  const eventTitle = event ? event.title : '';

  // Check if a thread already exists for this event
  let messages = [];
  try {
    messages = await api('/messages?event_id=' + eventId);
  } catch (e) {
    // ignore
  }

  try {
    if (messages.length > 0) {
      // Reply to existing thread
      await api('/messages/' + messages[0].id, {
        method: 'POST',
        body: JSON.stringify({ text }),
      });
    } else {
      // Create new thread
      const payload = {
        topic: 'Re: ' + eventTitle,
        text,
        event_id: eventId,
      };
      // Set org_id from the event
      if (event && event.org_id) {
        payload.org_id = event.org_id;
      }
      await api('/messages', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    }
    showToast('Message sent!');
    cachedMessages = [];
    cachedAdminMessages = [];
    cachedEvents = [];
    await renderEventMessages(eventId);
    updateMessagesBadge();
    if (DemoSession.role === 'admin') {
      updateAdminMessagesBadge();
    }
  } catch (e) {
    showToast('Error sending message');
  }
}

async function checkEventUnreadMessages(eventId) {
  try {
    const messages = await api('/messages?event_id=' + eventId);
    return messages.some(m => m.has_unread);
  } catch (e) {
    return false;
  }
}

// ======= SAVE EVENT =======
async function saveEvent(status) {
  const title = document.getElementById('eventTitle').value.trim();
  const startVal = document.getElementById('eventStart').value;
  const endVal = document.getElementById('eventEnd').value;
  const desc = document.getElementById('eventDesc').value.trim();
  const address = document.getElementById('addressInput').value.trim();

  if (!title || !startVal) {
    showToast('Please fill in required fields');
    return;
  }

  // Parse datetime-local values
  const startDate = new Date(startVal);
  const endDate = endVal ? new Date(endVal) : startDate;

  const dateStr = startDate.toISOString().split('T')[0];
  const startTime = startDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  const endTime = endDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

  const bringItems = getSelectedChips('bringChips');
  const noBringItems = getSelectedChips('noBringChips');

  // Get selected org from sponsor org dropdown
  const selectedOrgId = getSelectedOrgId();

  const body = {
    title,
    date: dateStr,
    start_time: startTime,
    end_time: endTime,
    description: desc,
    address,
    parking: document.getElementById('eventParking').value.trim(),
    flyer_url: document.getElementById('eventFlyer').value.trim(),
    website_url: document.getElementById('eventWebsite').value.trim(),
    reg_link: document.getElementById('regLink').value.trim(),
    reg_required: document.getElementById('regRequiredCheck').checked,
    notes: document.getElementById('eventNotes').value.trim(),
    bring_items: bringItems,
    no_bring_items: noBringItems,
    event_type: getEventTypeValue(),
    status,
    org_id: selectedOrgId,
  };

  try {
    if (editingEventId) {
      const editResult = await api('/events/' + editingEventId, { method: 'PUT', body: JSON.stringify(body) });
      showToast(status === 'draft' ? 'Draft saved!' : 'Event submitted for review!');
    } else {
      // Check for recurring
      const isRecurring = document.getElementById('recurringCheck').checked;
      if (isRecurring && startVal) {
        const freq = document.getElementById('recurringFrequency').value;
        const count = Math.min(Math.max(parseInt(document.getElementById('recurringCount').value) || 2, 2), 52);
        const daysToAdd = freq === 'weekly' ? 7 : freq === 'biweekly' ? 14 : 0;

        for (let i = 0; i < count; i++) {
          const occStart = new Date(startVal);
          const occEnd = endVal ? new Date(endVal) : new Date(startVal);

          if (freq === 'monthly') {
            occStart.setMonth(occStart.getMonth() + i);
            occEnd.setMonth(occEnd.getMonth() + i);
          } else {
            occStart.setDate(occStart.getDate() + (daysToAdd * i));
            occEnd.setDate(occEnd.getDate() + (daysToAdd * i));
          }

          const occBody = {
            ...body,
            date: occStart.toISOString().split('T')[0],
            start_time: occStart.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
            end_time: occEnd.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
          };
          const occResult = await api('/events', { method: 'POST', body: JSON.stringify(occBody) });
        }
        showToast(`${count} recurring events created!`);
      } else {
        const result = await api('/events', { method: 'POST', body: JSON.stringify(body) });
        if (result.status === 'published' && status === 'review') {
          showToast(DemoSession.role === 'admin' ? 'Event published!' : 'Event published! (Auto-approved for your organization)');
        } else {
          showToast(status === 'draft' ? 'Draft saved!' : 'Event submitted for review!');
        }
      }
    }
    editingEventId = null;
    setTimeout(() => showSection('myEvents'), 800);
  } catch (e) {
    showToast('Error saving event');
  }
}

// ======= ORG PROFILE =======
let profileOrgId = null;

async function openOrgProfile() {
  await loadOrgs();

  const select = document.getElementById('profileOrgSelect');

  // For admins, show all orgs. For organizers, show their active memberships.
  let orgOptions = [];
  if (DemoSession.role === 'admin') {
    orgOptions = cachedOrgs;
  } else {
    try {
      const myOrgs = await api('/users/my-orgs');
      const myOrgIds = new Set(myOrgs.map(o => o.id));
      if (DemoSession.orgId) myOrgIds.add(DemoSession.orgId);
      orgOptions = cachedOrgs.filter(o => myOrgIds.has(o.id));
    } catch (e) {
      // Fallback to primary org
      orgOptions = cachedOrgs.filter(o => o.id === DemoSession.orgId);
    }
  }

  select.innerHTML = orgOptions.map(o =>
    `<option value="${o.id}">${escHtml(o.name)}</option>`
  ).join('');

  // Select first org
  if (orgOptions.length > 0) {
    select.value = orgOptions[0].id;
  }

  openModal('profileModal');
  await onProfileOrgChange();
}

async function onProfileOrgChange() {
  const orgId = parseInt(document.getElementById('profileOrgSelect').value);
  if (!orgId) return;
  profileOrgId = orgId;

  const org = cachedOrgs.find(o => o.id === orgId);
  if (!org) return;

  document.getElementById('profileOrgName').value = org.name || '';
  document.getElementById('profileMission').value = org.mission_statement || '';
  document.getElementById('profileOrgWebsite').value = org.website || '';
  document.getElementById('profileCity').value = org.city || '';
  document.getElementById('profileLogoUrl').value = org.logo_url || '';
  updateMissionCounter();
  document.getElementById('profileQrUrl').value = org.qr_url || '';

  // Preview images
  updateImagePreview('profileLogoUrl', 'profileLogoPreview');
  updateImagePreview('profileQrUrl', 'profileQrPreview');

  const socials = org.socials || {};
  document.getElementById('profileFB').value = socials.fb || '';
  document.getElementById('profileIG').value = socials.ig || '';
  document.getElementById('profileSC').value = socials.sc || '';
  document.getElementById('profileSG').value = socials.sg || '';
  document.getElementById('profileRD').value = socials.rd || '';
  document.getElementById('profileX').value = socials.x || '';

  // Load members
  await loadProfileMembers(orgId);
}

function updateImagePreview(inputId, previewId) {
  const url = document.getElementById(inputId).value.trim();
  const preview = document.getElementById(previewId);
  if (url) {
    preview.innerHTML = `<img src="${escAttr(url)}" style="max-width:80px;max-height:80px;border-radius:var(--radius-sm);border:1px solid var(--border);" onerror="this.style.display='none'">`;
  } else {
    preview.innerHTML = '';
  }
}

function updateMissionCounter() {
  const len = (document.getElementById('profileMission').value || '').length;
  document.getElementById('missionCounter').textContent = len + ' / 140';
}

function updateOrgEditMissionCounter() {
  const len = (document.getElementById('orgEditMission').value || '').length;
  document.getElementById('orgEditMissionCounter').textContent = len + ' / 140';
}

async function loadProfileMembers(orgId) {
  const container = document.getElementById('profileOrgMembers');
  try {
    const members = await api('/orgs/members?org_id=' + orgId);
    if (members.length === 0) {
      container.innerHTML = '<div style="color:var(--text-dim);font-style:italic;padding:8px 0;">No organizers assigned</div>';
      return;
    }
    container.innerHTML = members.map(m => {
      const isArchived = m.membership_status === 'archived';
      return `<div style="display:flex;align-items:center;gap:8px;padding:8px 0;border-bottom:1px solid var(--border);${isArchived ? 'opacity:0.5;' : ''}">
        <div style="flex:1;">
          <div style="font-weight:600;font-size:13px;">${escHtml(m.display_name)}</div>
          <div style="font-family:var(--font-mono);font-size:11px;color:var(--text-dim);">${escHtml(m.email || '')}</div>
        </div>
        ${isArchived
          ? `<span class="event-list-status status-archived" style="font-size:10px;">Archived</span>
             <button class="btn btn-ghost btn-xs" onclick="orgMemberAction('unarchive', ${orgId}, ${m.id})">Restore</button>`
          : `<button class="btn btn-ghost btn-xs" style="color:#E05555;" onclick="orgMemberAction('archive', ${orgId}, ${m.id})">Archive</button>`
        }
      </div>`;
    }).join('');
  } catch (e) {
    container.innerHTML = '<div style="color:var(--text-dim);">Could not load members</div>';
  }
}

async function orgMemberAction(action, orgId, userId) {
  try {
    await api('/orgs/members', {
      method: 'POST',
      body: JSON.stringify({ action, org_id: orgId, user_id: userId }),
    });
    showToast(action === 'archive' ? 'Member archived' : 'Member restored');
    await loadProfileMembers(orgId);
  } catch (e) {
    showToast('Error: ' + (e.message || 'Unknown error'));
  }
}

async function addOrgMember() {
  const email = document.getElementById('profileAddMemberEmail').value.trim();
  if (!email || !profileOrgId) {
    showToast('Please enter an email address');
    return;
  }
  try {
    await api('/orgs/members', {
      method: 'POST',
      body: JSON.stringify({ action: 'add', org_id: profileOrgId, email }),
    });
    document.getElementById('profileAddMemberEmail').value = '';
    showToast('Member added!');
    await loadProfileMembers(profileOrgId);
  } catch (e) {
    showToast('Error: ' + (e.message || 'User not found'));
  }
}

async function saveProfile() {
  if (!profileOrgId) {
    showToast('No organization selected');
    return;
  }
  const name = document.getElementById('profileOrgName').value.trim();
  const mission_statement = document.getElementById('profileMission').value.trim();
  const website = document.getElementById('profileOrgWebsite').value.trim();
  const city = document.getElementById('profileCity').value.trim();
  const logo_url = document.getElementById('profileLogoUrl').value.trim();
  const qr_url = document.getElementById('profileQrUrl').value.trim();
  const socials = {
    fb: document.getElementById('profileFB').value.trim() || undefined,
    ig: document.getElementById('profileIG').value.trim() || undefined,
    sc: document.getElementById('profileSC').value.trim() || undefined,
    sg: document.getElementById('profileSG').value.trim() || undefined,
    rd: document.getElementById('profileRD').value.trim() || undefined,
    x: document.getElementById('profileX').value.trim() || undefined,
  };

  try {
    await api('/orgs', {
      method: 'PUT',
      body: JSON.stringify({ org_id: profileOrgId, name, website, socials, logo_url, qr_url, city, mission_statement }),
    });
    closeModal('profileModal');
    showToast('Profile updated!');
    cachedOrgs = [];
    if (profileOrgId === DemoSession.orgId) {
      DemoSession.orgName = name;
      applyDemoRole();
    }
  } catch (e) {
    showToast('Error updating profile');
  }
}

// ======= FORM HELPERS =======
function formatEventType(type) {
  const labels = {
    march: 'March',
    protest_gathering: 'Protest Gathering',
    signature_gathering: 'Signature Gathering',
    community_event: 'Community Event',
    virtual: 'Virtual',
  };
  return labels[type] || type;
}

function onEventTypeChange() {
  const sel = document.getElementById('eventType');
  const custom = document.getElementById('eventTypeCustom');
  custom.style.display = sel.value === 'other' ? '' : 'none';
  if (sel.value !== 'other') custom.value = '';
}

function getEventTypeValue() {
  const sel = document.getElementById('eventType');
  if (sel.value === 'other') return document.getElementById('eventTypeCustom').value.trim();
  return sel.value;
}

function setEventTypeValue(val) {
  const sel = document.getElementById('eventType');
  const custom = document.getElementById('eventTypeCustom');
  const knownTypes = ['march', 'protest_gathering', 'signature_gathering', 'community_event', 'virtual'];
  if (!val) {
    sel.value = '';
    custom.style.display = 'none';
    custom.value = '';
  } else if (knownTypes.includes(val)) {
    sel.value = val;
    custom.style.display = 'none';
    custom.value = '';
  } else {
    sel.value = 'other';
    custom.style.display = '';
    custom.value = val;
  }
}

function toggleRecurring() {
  const checked = document.getElementById('recurringCheck').checked;
  document.getElementById('recurringFields').style.display = checked ? '' : 'none';
}

function toggleVirtualEvent() {
  const checked = document.getElementById('virtualEventCheck').checked;
  const locationFields = document.getElementById('locationFields');
  if (checked) {
    locationFields.style.display = 'none';
    document.getElementById('addressInput').value = '';
    document.getElementById('addressInput').required = false;
    document.getElementById('eventParking').value = '';
  } else {
    locationFields.style.display = '';
    document.getElementById('addressInput').required = true;
  }
}

function toggleAddressVisibility() {
  const checked = document.getElementById('hideAddressCheck').checked;
  const input = document.getElementById('addressInput');
  const group = document.getElementById('addressGroup');
  if (checked) {
    input.value = '';
    input.disabled = true;
    input.required = false;
    group.style.opacity = '0.4';
  } else {
    input.disabled = false;
    input.required = true;
    group.style.opacity = '1';
  }
}

function toggleChip(el) {
  el.classList.toggle('selected');
}

function addCustomChip(containerId) {
  const text = prompt('Enter item:');
  if (!text || !text.trim()) return;
  const container = document.getElementById(containerId);
  const addBtn = container.querySelector('.add-chip-btn');
  const chip = document.createElement('button');
  chip.type = 'button';
  chip.className = 'chip selected custom';
  chip.innerHTML = `${escHtml(text.trim())} <span class="chip-x" style="display:inline;">&#x2715;</span>`;
  chip.onclick = () => toggleChip(chip);
  container.insertBefore(chip, addBtn);
}

function getSelectedChips(containerId) {
  const chips = document.querySelectorAll(`#${containerId} .chip.selected`);
  return Array.from(chips).map(c => {
    // Get text without the X button
    const clone = c.cloneNode(true);
    const x = clone.querySelector('.chip-x');
    if (x) x.remove();
    return clone.textContent.trim();
  });
}

function setChipSelections(containerId, items) {
  const container = document.getElementById(containerId);
  // Remove previously-injected custom chips to prevent duplication on re-edit
  container.querySelectorAll('.chip.custom').forEach(c => c.remove());

  // Track which items are matched by default chips
  const matched = new Set();
  const defaultChips = container.querySelectorAll('.chip');
  defaultChips.forEach(c => {
    const clone = c.cloneNode(true);
    const x = clone.querySelector('.chip-x');
    if (x) x.remove();
    const text = clone.textContent.trim();
    const isSelected = items.includes(text);
    c.classList.toggle('selected', isSelected);
    if (isSelected) matched.add(text);
  });

  // Create custom chips for items not matched by defaults
  const addBtn = container.querySelector('.add-chip-btn');
  items.forEach(item => {
    if (!matched.has(item)) {
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'chip selected custom';
      chip.innerHTML = `${escHtml(item)} <span class="chip-x" style="display:inline;">&#x2715;</span>`;
      chip.onclick = () => toggleChip(chip);
      container.insertBefore(chip, addBtn);
    }
  });
}

function copyCalUrl(type) {
  const url = document.getElementById('syncCalUrl').textContent;
  navigator.clipboard.writeText(url).then(() => {
    showToast('Calendar URL copied!');
  }).catch(() => {
    showToast('Calendar URL copied!');
  });
}

// ======= UTILITIES =======
function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
}

function formatTimestamp(dateStr) {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr + (dateStr.includes('Z') || dateStr.includes('+') ? '' : 'Z'));
    if (isNaN(d)) return dateStr;
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const tzAbbr = d.toLocaleTimeString('en-US', { timeZoneName: 'short' }).split(' ').pop();
    const time = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: true });
    return `${time} (${tzAbbr})`;
  } catch (e) {
    return dateStr;
  }
}

function escHtml(str) {
  if (!str) return '';
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function escAttr(str) {
  return escHtml(str);
}

function parseDateTimeToLocal(dateStr, timeStr) {
  // Convert "2026-02-14" + "10:00 AM" to datetime-local format
  try {
    const dt = new Date(`${dateStr} ${timeStr}`);
    if (isNaN(dt)) return '';
    const y = dt.getFullYear();
    const m = String(dt.getMonth() + 1).padStart(2, '0');
    const d = String(dt.getDate()).padStart(2, '0');
    const h = String(dt.getHours()).padStart(2, '0');
    const min = String(dt.getMinutes()).padStart(2, '0');
    return `${y}-${m}-${d}T${h}:${min}`;
  } catch (e) {
    return '';
  }
}

// ======= LOADING HELPER =======
function showLoading(containerId) {
  const el = document.getElementById(containerId);
  if (el) el.innerHTML = '<div class="section-loading"><div class="spinner"></div> Loading...</div>';
}

// ======= MESSAGES BADGE =======
async function updateMessagesBadge() {
  await loadMessages();
  const count = cachedMessages.filter(m => !m.archived && m.has_unread).length;
  const badge = document.getElementById('messagesBadge');
  if (badge) {
    badge.textContent = count;
    badge.style.display = count > 0 ? '' : 'none';
  }
}

// ======= MY EVENTS BADGE =======
async function updateMyEventsBadge() {
  await loadEvents();
  await loadMessages();

  // Count newly-approved events (published but not yet seen by organizer, own org only)
  let approvedCount = 0;
  if (DemoSession.role !== 'admin') {
    approvedCount = cachedEvents.filter(e => e.status === 'published' && !e.published_seen && e.org_is_host).length;
  }

  // Count events with unread messages
  const eventsWithUnread = cachedMessages.filter(m => !m.archived && m.has_unread && m.event_id).length;

  const count = approvedCount + eventsWithUnread;
  const badge = document.getElementById('myEventsBadge');
  if (badge) {
    badge.textContent = count;
    badge.style.display = count > 0 ? '' : 'none';
  }
}

// ======= ADMIN: REVIEW QUEUE =======
async function updateReviewBadge() {
  await loadEvents();
  const count = cachedEvents.filter(e => (e.status === 'review' || e.status === 'pending_org') && !e.is_seen).length;
  const badge = document.getElementById('reviewBadge');
  if (badge) {
    badge.textContent = count;
    badge.style.display = count > 0 ? '' : 'none';
  }
}

async function renderReviewQueue() {
  showLoading('reviewQueueList');
  await loadEvents();
  const reviewEvents = cachedEvents.filter(e => e.status === 'review' || e.status === 'pending_org');

  const listEl = document.getElementById('reviewQueueList');
  const emptyEl = document.getElementById('reviewQueueEmpty');

  if (reviewEvents.length === 0) {
    listEl.innerHTML = '';
    emptyEl.style.display = 'block';
    return;
  }

  emptyEl.style.display = 'none';
  listEl.innerHTML = reviewEvents.map(e => {
    const isPending = e.status === 'pending_org';
    return `
    <div class="event-list-item${!e.is_seen ? ' review-unseen' : ''}" style="cursor:pointer;" onclick="openReviewEventDetail(${e.id})">
      ${!e.is_seen ? '<span class="new-indicator">New</span>' : ''}
      <div class="event-list-date">${formatDate(e.date)}</div>
      <div class="event-list-name">${escHtml(e.title)}</div>
      ${isPending ? '<span class="event-list-status status-pending-org">Pending Response</span>' : ''}
      <div style="font-size:12px;color:var(--text-dim);white-space:nowrap;">${escHtml(e.org_name || (AppConfig.siteName + ' Admin'))}</div>
      <div class="event-list-actions">
        <button class="btn btn-success btn-xs" onclick="event.stopPropagation(); approveEvent(${e.id})">Approve</button>
        <button class="btn btn-danger btn-xs" onclick="event.stopPropagation(); rejectEvent(${e.id})">Reject</button>
      </div>
    </div>
  `;}).join('');

  // Mark all review events as seen
  const unseenIds = reviewEvents.filter(e => !e.is_seen).map(e => e.id);
  if (unseenIds.length > 0) {
    try {
      await api('/events/seen', { method: 'POST', body: JSON.stringify({ event_ids: unseenIds }) });
      // Update local cache
      unseenIds.forEach(id => {
        const ev = cachedEvents.find(e => e.id === id);
        if (ev) ev.is_seen = true;
      });
      updateReviewBadge();
    } catch (e) {
      // Non-critical, ignore
    }
  }
}

async function approveEvent(id) {
  try {
    await api('/events/' + id, { method: 'PUT', body: JSON.stringify({ status: 'published' }) });
    showToast('Event approved!');
    await loadEvents();
    renderReviewQueue();
    updateReviewBadge();
  } catch (e) {
    showToast('Error approving event');
  }
}

function rejectEvent(id) {
  showConfirm(
    'Reject Event?',
    'This will move the event back to draft status. The organizer can edit and resubmit.',
    'Reject',
    async () => {
      try {
        await api('/events/' + id, { method: 'PUT', body: JSON.stringify({ status: 'draft' }) });
        showToast('Event rejected');
        await loadEvents();
        renderReviewQueue();
        updateReviewBadge();
      } catch (e) {
        showToast('Error rejecting event');
      }
    }
  );
}

// ======= ADMIN: ORG MANAGEMENT =======
async function renderAdminOrgs() {
  showLoading('adminOrgsList');
  await loadOrgs();

  document.getElementById('adminOrgsList').innerHTML = cachedOrgs.map(org => `
    <div class="event-list-item">
      <div class="org-avatar" style="width:36px;height:36px;font-size:13px;">${escHtml(org.abbreviation || '')}</div>
      <div class="event-list-name">${escHtml(org.name)}</div>
      <div style="font-size:12px;color:var(--text-dim);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:200px;">${org.website ? escHtml(org.website) : ''}</div>
      <div class="event-list-actions">
        <button class="btn btn-ghost btn-xs" onclick="editOrgById(${org.id})">Edit</button>
        <button class="btn btn-danger btn-xs" onclick="deleteOrgById(${org.id})">Delete</button>
      </div>
    </div>
  `).join('');

  if (cachedOrgs.length === 0) {
    document.getElementById('adminOrgsList').innerHTML = '<div class="empty-state"><div class="empty-state-icon">&#x1F3E2;</div><h3>No organizations</h3><p>Add your first organization above.</p></div>';
  }
}

async function openOrgEditModal(org) {
  document.getElementById('orgEditId').value = org ? org.id : '';
  document.getElementById('orgEditModalTitle').textContent = org ? 'Edit Organization' : 'Add Organization';
  document.getElementById('orgEditName').value = org ? org.name : '';
  document.getElementById('orgEditAbbr').value = org ? org.abbreviation : '';
  document.getElementById('orgEditMission').value = org ? (org.mission_statement || '') : '';
  document.getElementById('orgEditWebsite').value = org ? (org.website || '') : '';
  document.getElementById('orgEditCity').value = org ? (org.city || '') : '';
  document.getElementById('orgEditLogoUrl').value = org ? (org.logo_url || '') : '';
  document.getElementById('orgEditQrUrl').value = org ? (org.qr_url || '') : '';
  updateOrgEditMissionCounter();
  updateImagePreview('orgEditLogoUrl', 'orgEditLogoPreview');
  updateImagePreview('orgEditQrUrl', 'orgEditQrPreview');
  const socials = org ? (org.socials || {}) : {};
  document.getElementById('orgEditFB').value = socials.fb || '';
  document.getElementById('orgEditIG').value = socials.ig || '';
  document.getElementById('orgEditSC').value = socials.sc || '';
  document.getElementById('orgEditSG').value = socials.sg || '';
  document.getElementById('orgEditX').value = socials.x || '';
  document.getElementById('orgEditRD').value = socials.rd || '';

  // Publishing permissions (admin only)
  const publishPermsSection = document.getElementById('orgEditPublishPerms');
  if (DemoSession.role === 'admin') {
    publishPermsSection.style.display = '';
    document.getElementById('orgEditSelfPublish').checked = org ? !!org.can_self_publish : false;
    document.getElementById('orgEditCrossPublish').checked = org ? !!org.can_cross_publish : false;
  } else {
    publishPermsSection.style.display = 'none';
  }

  // Show organizers for existing orgs
  const organizersSection = document.getElementById('orgEditOrganizers');
  const organizersList = document.getElementById('orgEditOrganizersList');
  if (org && org.id) {
    await loadUsers();
    const orgUsers = cachedUsers.filter(u => u.org_id === org.id && (u.role === 'organizer' || u.role === 'admin'));
    if (orgUsers.length > 0) {
      organizersList.innerHTML = orgUsers.map(u => {
        const roleClass = u.role === 'admin' ? 'role-admin' : 'role-organizer';
        const roleLabel = u.role.charAt(0).toUpperCase() + u.role.slice(1);
        return `<div style="display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid var(--border);">
          <span style="flex:1;font-weight:600;">${escHtml(u.display_name)}</span>
          <span style="font-family:var(--font-mono);font-size:11px;color:var(--text-dim);">${escHtml(u.email || '')}</span>
          <span class="role-badge ${roleClass}" style="font-size:10px;padding:2px 8px;">${roleLabel}</span>
        </div>`;
      }).join('');
    } else {
      organizersList.innerHTML = '<div style="color:var(--text-dim);font-style:italic;padding:6px 0;">No organizers assigned</div>';
    }
    organizersSection.style.display = '';
  } else {
    organizersSection.style.display = 'none';
  }

  openModal('orgEditModal');
}

function editOrgById(id) {
  const org = cachedOrgs.find(o => o.id === id);
  if (org) openOrgEditModal(org);
}

function deleteOrgById(id) {
  const org = cachedOrgs.find(o => o.id === id);
  if (!org) return;
  showConfirm(
    'Delete Organization?',
    `This will permanently delete "${org.name}". Events and users linked to this organization may be affected.`,
    'Delete',
    async () => {
      try {
        await api('/orgs/' + id, { method: 'DELETE' });
        showToast('Organization deleted');
        cachedOrgs = [];
        renderAdminOrgs();
      } catch (e) {
        showToast('Error deleting organization');
      }
    }
  );
}

async function saveOrgEdit() {
  const id = document.getElementById('orgEditId').value;
  const name = document.getElementById('orgEditName').value.trim();
  const abbreviation = document.getElementById('orgEditAbbr').value.trim();
  const mission_statement = document.getElementById('orgEditMission').value.trim();
  const website = document.getElementById('orgEditWebsite').value.trim();
  const city = document.getElementById('orgEditCity').value.trim();
  const logo_url = document.getElementById('orgEditLogoUrl').value.trim();
  const qr_url = document.getElementById('orgEditQrUrl').value.trim();
  const socials = {
    fb: document.getElementById('orgEditFB').value.trim() || undefined,
    ig: document.getElementById('orgEditIG').value.trim() || undefined,
    sc: document.getElementById('orgEditSC').value.trim() || undefined,
    sg: document.getElementById('orgEditSG').value.trim() || undefined,
    x: document.getElementById('orgEditX').value.trim() || undefined,
    rd: document.getElementById('orgEditRD').value.trim() || undefined,
  };

  if (!name || !abbreviation) {
    showToast('Name and abbreviation are required');
    return;
  }

  // Publishing permissions
  const can_self_publish = document.getElementById('orgEditSelfPublish').checked;
  const can_cross_publish = document.getElementById('orgEditCrossPublish').checked;

  try {
    const payload = { name, abbreviation, website, socials, logo_url, qr_url, city, mission_statement };
    if (DemoSession.role === 'admin') {
      payload.can_self_publish = can_self_publish;
      payload.can_cross_publish = can_cross_publish;
    }
    if (id) {
      await api('/orgs/' + id, { method: 'PUT', body: JSON.stringify(payload) });
    } else {
      await api('/orgs', { method: 'POST', body: JSON.stringify(payload) });
    }
    closeModal('orgEditModal');
    showToast(id ? 'Organization updated!' : 'Organization created!');
    cachedOrgs = [];
    renderAdminOrgs();
  } catch (e) {
    showToast('Error saving organization');
  }
}

// ======= ADMIN: USER MANAGEMENT =======
async function loadUsers() {
  try {
    cachedUsers = await api('/users');
  } catch (e) {
    console.warn('Failed to load users:', e.message);
    cachedUsers = [];
  }
}

async function renderAdminUsers() {
  showLoading('adminUsersList');
  await loadUsers();
  await loadOrgs();

  // Populate org filter dropdown (preserve current selection)
  const filterEl = document.getElementById('userOrgFilter');
  const currentFilter = filterEl.value;
  filterEl.innerHTML = '<option value="">All Organizations</option>' +
    '<option value="none">No Organization</option>' +
    cachedOrgs.map(o => `<option value="${o.id}">${escHtml(o.name)}</option>`).join('');
  filterEl.value = currentFilter;

  // Apply filter
  let users = cachedUsers;
  if (currentFilter === 'none') {
    users = users.filter(u => !u.org_id);
  } else if (currentFilter) {
    users = users.filter(u => u.org_id === parseInt(currentFilter));
  }

  document.getElementById('adminUsersList').innerHTML = users.map(u => {
    const roleClass = u.role === 'admin' ? 'role-admin' : u.role === 'organizer' ? 'role-organizer' : 'role-guest';
    const roleLabel = u.role.charAt(0).toUpperCase() + u.role.slice(1);
    return `
      <div class="event-list-item">
        <div class="event-list-name">${escHtml(u.display_name)}</div>
        <div style="font-family:var(--font-mono);font-size:12px;color:var(--text-dim);min-width:160px;">${escHtml(u.email || '')}</div>
        <span class="role-badge ${roleClass}">${roleLabel}</span>
        <div class="event-list-actions">
          <button class="btn btn-ghost btn-xs" onclick="editUserById(${u.id})">Edit</button>
          <button class="btn btn-danger btn-xs" onclick="deleteUserById(${u.id})">Delete</button>
        </div>
      </div>
    `;
  }).join('');

  if (users.length === 0) {
    document.getElementById('adminUsersList').innerHTML = '<div class="empty-state"><div class="empty-state-icon">&#x1F465;</div><h3>No users</h3><p>' + (currentFilter ? 'No users match this filter.' : 'Add your first user above.') + '</p></div>';
  }
}

function openUserEditModal(user) {
  document.getElementById('userEditId').value = user ? user.id : '';
  document.getElementById('userEditModalTitle').textContent = user ? 'Edit User' : 'Add User';
  document.getElementById('userEditName').value = user ? user.display_name : '';
  document.getElementById('userEditEmail').value = user ? (user.email || '') : '';
  document.getElementById('userEditRole').value = user ? user.role : 'guest';

  // Populate org select from cache
  const orgSelect = document.getElementById('userEditOrg');
  orgSelect.innerHTML = '<option value="">None</option>' +
    cachedOrgs.map(o => `<option value="${o.id}">${escHtml(o.name)}</option>`).join('');
  orgSelect.value = user && user.org_id ? user.org_id : '';

  onUserRoleChange();
  openModal('userEditModal');
}

function editUserById(id) {
  const user = cachedUsers.find(u => u.id === id);
  if (user) openUserEditModal(user);
}

function deleteUserById(id) {
  const user = cachedUsers.find(u => u.id === id);
  if (!user) return;
  showConfirm(
    'Delete User?',
    `This will permanently delete "${user.display_name}".`,
    'Delete',
    async () => {
      try {
        await api('/users/' + id, { method: 'DELETE' });
        showToast('User deleted');
        renderAdminUsers();
      } catch (e) {
        showToast('Error deleting user');
      }
    }
  );
}

function onUserRoleChange() {
  const role = document.getElementById('userEditRole').value;
  const hint = document.getElementById('userEditOrgHint');
  hint.style.display = role === 'organizer' ? '' : 'none';
}

async function saveUserEdit() {
  const id = document.getElementById('userEditId').value;
  const display_name = document.getElementById('userEditName').value.trim();
  const email = document.getElementById('userEditEmail').value.trim();
  const role = document.getElementById('userEditRole').value;
  const org_id = document.getElementById('userEditOrg').value ? parseInt(document.getElementById('userEditOrg').value) : null;

  if (!display_name || !email) {
    showToast('Name and email are required');
    return;
  }

  if (role === 'organizer' && !org_id) {
    showToast('Organizer role requires an organization');
    return;
  }

  try {
    if (id) {
      await api('/users/' + id, { method: 'PUT', body: JSON.stringify({ display_name, email, role, org_id }) });
    } else {
      await api('/users', { method: 'POST', body: JSON.stringify({ display_name, email, role, org_id }) });
    }
    closeModal('userEditModal');
    showToast(id ? 'User updated!' : 'User created!');
    renderAdminUsers();
  } catch (e) {
    showToast('Error saving user');
  }
}

// ======= SHARE / FLYER TOOLS =======
function slugify(str) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function copyEventDetails(event) {
  if (!event) return;
  const locationLine = event.hide_address
    ? 'Register for location details'
    : (event.address || 'Virtual / Online');
  const d = new Date(event.date + 'T12:00:00');
  const dayName = d.toLocaleDateString('en-US', { weekday: 'long' });
  const dateFormatted = d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

  // Find org website
  const org = cachedOrgs.find(o => o.id === event.org_id);
  const orgWebsite = event.website_url || (org && org.website) || '';
  const domain = AppConfig.domain || 'resist.events';

  const lines = [
    event.title,
    `${dayName}, ${dateFormatted}`,
    `${event.start_time || ''} – ${event.end_time || ''}`,
    locationLine,
    `Hosted by: ${event.org_name || (AppConfig.siteName + ' Admin')}`,
  ];
  if (orgWebsite) lines.push(orgWebsite);
  lines.push('', event.description || '');
  lines.push('', `More info: https://${domain}/events/${event.id}`);

  navigator.clipboard.writeText(lines.join('\n')).then(() => {
    showToast('Copied to clipboard!');
  });
}

function copyEventMarkdown(event) {
  if (!event) return;
  const locationLine = event.hide_address
    ? 'Register for location details'
    : (event.address || 'Virtual / Online');
  const d = new Date(event.date + 'T12:00:00');
  const dayName = d.toLocaleDateString('en-US', { weekday: 'long' });
  const dateFormatted = d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

  const org = cachedOrgs.find(o => o.id === event.org_id);
  const orgWebsite = event.website_url || (org && org.website) || '';
  const domain = AppConfig.domain || 'resist.events';

  const orgPart = orgWebsite
    ? `**Hosted by:** ${event.org_name || (AppConfig.siteName + ' Admin')} · ${orgWebsite}`
    : `**Hosted by:** ${event.org_name || (AppConfig.siteName + ' Admin')}`;

  const lines = [
    `## ${event.title}`,
    `**When:** ${dayName}, ${dateFormatted} · ${event.start_time || ''} – ${event.end_time || ''}`,
    `**Where:** ${locationLine}`,
    orgPart,
    '',
    event.description || '',
    '',
    `\uD83D\uDD17 [More info](https://${domain}/events/${event.id})`,
  ];

  navigator.clipboard.writeText(lines.join('\n')).then(() => {
    showToast('Copied as Markdown!');
  });
}

// ======= FLYER EVENT TYPE COLOR VARIANTS =======
const flyerEventTypeColors = {
  virtual:              { accent: '#4A9BD9', accentLight: '#6BB5E8', dark: '#1A2F42', label: 'Virtual Event' },
  signature_gathering:  { accent: '#D4A033', accentLight: '#E8B84D', dark: '#3D2E10', label: 'Signature Gathering' },
  march:                { accent: '#C2452D', accentLight: '#D4634E', dark: '#3A1A14', label: 'March' },
  protest_gathering:    { accent: '#D42B2B', accentLight: '#E04545', dark: '#2A0F0F', label: 'Protest Gathering' },
  community_event:      { accent: '#7B5EA7', accentLight: '#9B7EC7', dark: '#2A1F3A', label: 'Community Event' },
};

function getEventTypeColors(eventType) {
  return flyerEventTypeColors[eventType] || flyerEventTypeColors.march;
}

// Rally Bold color overrides per event type
const rallyColors = {
  virtual:             { bg: '#1A0A0A', sash: '#D42B2B', typeColor: '#FF6B6B', urlColor: '#FF6B6B' },
  signature_gathering: { bg: '#1A0A0A', sash: '#D42B2B', typeColor: '#FF6B6B', urlColor: '#FF6B6B' },
  march:               { bg: '#1A0A0A', sash: '#D42B2B', typeColor: '#FF6B6B', urlColor: '#FF6B6B' },
  protest_gathering:   { bg: '#1A0A0A', sash: '#D42B2B', typeColor: '#FF6B6B', urlColor: '#FF6B6B' },
  community_event:     { bg: '#0A0A1A', sash: '#7B5EA7', typeColor: '#B89AE0', urlColor: '#B89AE0' },
};

// Modern Clean color overrides per event type
const modernColors = {
  virtual:             { accent: '#2D5A3D', visBg: ['#E0E8F5','#C4D4EF','#A8BFE8'] },
  signature_gathering: { accent: '#2D5A3D', visBg: ['#F5EDE0','#EFE0C4','#E8D4A8'] },
  march:               { accent: '#2D5A3D', visBg: ['#F5E0E0','#EFC4C4','#E8A8A8'] },
  protest_gathering:   { accent: '#8B2E2E', visBg: ['#F5E8E0','#EFD0B8','#E8B89A'] },
  community_event:     { accent: '#2D5A3D', visBg: ['#E8F0E4','#D4E5D0','#C0D9B8'] },
};

// People's Voice illustration BG per event type
const pvIllusBg = {
  virtual:             ['#6BA3D6','#4A8FBF','#88C4E8','#EAF2FB'],
  signature_gathering: ['#E8C860','#D4A030','#C09028','#FFF5DC'],
  march:               ['#E86060','#D43030','#F09090','#FFEAEA'],
  protest_gathering:   ['#F0A050','#E07020','#F0C090','#FFF3E6'],
  community_event:     ['#FFD166','#06D6A0','#118AB2','#FFF0D0'],
};

// People's Voice footer notes per event type
const pvFootNotes = {
  virtual: 'all voices welcome \u2728',
  signature_gathering: 'your name matters \u270D\uFE0F',
  march: 'walk with us \u270A',
  protest_gathering: 'be heard \u270A',
  community_event: 'all are welcome \u2728',
};

// People's Voice type labels
const pvTypeLabels = {
  virtual: '~ virtual event ~',
  signature_gathering: '~ signature drive ~',
  march: '~ march ~',
  protest_gathering: '~ protest rally ~',
  community_event: '~ community gathering ~',
};

// Broadside decree subtitles per event type
const bsDecrees = {
  virtual: 'A Virtual Assembly',
  signature_gathering: 'A Petition Most Urgent',
  march: 'A Grand Procession',
  protest_gathering: 'A Gathering of Discontent',
  community_event: 'A Gathering of Mirth',
};

const flyerTemplates = [
  { key: 'broadside',     name: 'The Broadside',  desc: 'Newspaper / poster aesthetic' },
  { key: 'rally_bold',    name: 'Rally Bold',     desc: 'High-energy protest style' },
  { key: 'modern_clean',  name: 'Modern Clean',   desc: 'Minimal, contemporary' },
  { key: 'peoples_voice', name: "People's Voice",  desc: 'Grassroots community feel' },
];

async function generateFlyer(event) {
  if (!event) return;

  const pickerHTML = `
    <div class="modal-overlay open" id="flyerPickerModal" onclick="if(event.target===this){this.remove();document.body.style.overflow='hidden';}">
      <div class="modal-box" style="max-width:720px;">
        <div class="modal-header">
          <h2>Choose Flyer Template</h2>
          <button class="modal-close" onclick="document.getElementById('flyerPickerModal').remove();">&#x2715;</button>
        </div>
        <div class="modal-body">
          <p style="text-align:center;color:var(--text-muted);margin-bottom:12px;font-size:13px;">Loading fonts...</p>
          <div class="flyer-template-grid">
            ${flyerTemplates.map((t, i) => `
              <div class="flyer-template-thumb" onclick="showFlyerPreview(_currentDetailEvent, ${i})">
                <canvas id="flyerPreview${i}" width="216" height="288"></canvas>
                <div class="flyer-template-label"><strong>${t.name}</strong><span>${t.desc}</span></div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    </div>
  `;
  document.body.insertAdjacentHTML('beforeend', pickerHTML);

  // Wait for all Google Fonts to load before drawing on canvas
  await document.fonts.ready;

  // Remove loading message
  const loadMsg = document.querySelector('#flyerPickerModal .modal-body > p');
  if (loadMsg) loadMsg.remove();

  // Draw small previews
  flyerTemplates.forEach((_, i) => {
    const canvas = document.getElementById('flyerPreview' + i);
    if (canvas) drawFlyerTemplate(canvas, event, i, true);
  });
}

// ======= CANVAS DRAWING HELPERS (global for use by illustration functions) =======
function flyerRoundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function flyerDrawPerson(ctx, cx, cy, headR, bodyW, bodyH, color) {
  ctx.fillStyle = color;
  ctx.beginPath(); ctx.arc(cx, cy, headR, 0, Math.PI * 2); ctx.fill();
  flyerRoundRect(ctx, cx - bodyW/2, cy + headR, bodyW, bodyH, bodyW * 0.3);
  ctx.fill();
}

function drawFlyerTemplate(canvas, event, templateIndex, isPreview) {
  const W = isPreview ? 216 : 1080;
  const H = isPreview ? 288 : 1440;
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  const s = W / 360;

  const evType = event.event_type || 'march';
  const colors = getEventTypeColors(evType);
  const locationText = event.hide_address
    ? 'Register for location details'
    : (event.address || 'Virtual / Online');
  const dateStr = formatDate(event.date);
  const timeStr = (event.start_time || '') + ' \u2013 ' + (event.end_time || '');
  const orgWebsite = event.website_url || '';
  const orgName = event.org_name || (AppConfig.siteName + ' Admin');
  const genText = 'Generated by https://' + (AppConfig.domain || 'resist.events');

  // Parse date parts for Modern Clean date box
  let dateMo = '', dateD = '', dateWd = '';
  try {
    const d = new Date(event.date + 'T00:00:00');
    dateMo = d.toLocaleDateString('en-US', { month: 'short' });
    dateD = String(d.getDate());
    dateWd = d.toLocaleDateString('en-US', { weekday: 'long' });
  } catch(e) {}

  function wrapText(text, maxWidth, maxLines) {
    const words = (text || '').split(' ');
    const lines = [];
    let cur = '';
    for (const word of words) {
      const test = cur ? cur + ' ' + word : word;
      if (ctx.measureText(test).width > maxWidth && cur) {
        lines.push(cur);
        cur = word;
        if (lines.length >= maxLines) { lines[lines.length - 1] += '\u2026'; return lines; }
      } else { cur = test; }
    }
    if (cur) {
      if (lines.length >= maxLines) { lines[lines.length - 1] += '\u2026'; }
      else lines.push(cur);
    }
    return lines;
  }

  // Local aliases for the global helpers (ctx is captured from this scope)
  function roundRect(x, y, w, h, r) { flyerRoundRect(ctx, x, y, w, h, r); }
  function drawPerson(cx, cy, headR, bodyW, bodyH, color) { flyerDrawPerson(ctx, cx, cy, headR, bodyW, bodyH, color); }

  // ============================================
  // TEMPLATE 0: THE BROADSIDE
  // ============================================
  if (templateIndex === 0) {
    ctx.fillStyle = '#2C2416';
    ctx.fillRect(0, 0, W, H);

    // Parchment texture
    ctx.fillStyle = 'rgba(139,115,72,0.03)';
    for (let ty = 0; ty < H; ty += 4 * s) {
      ctx.fillRect(0, ty, W, 1 * s);
    }

    // Triple border
    ctx.strokeStyle = '#5C4A2E';
    ctx.lineWidth = 3 * s;
    ctx.strokeRect(0, 0, W, H);
    ctx.lineWidth = 2 * s;
    ctx.strokeRect(8 * s, 8 * s, W - 16 * s, H - 16 * s);
    ctx.globalAlpha = 0.4;
    ctx.lineWidth = 1 * s;
    ctx.strokeRect(12 * s, 12 * s, W - 24 * s, H - 24 * s);
    ctx.globalAlpha = 1;

    const pad = 22 * s;
    let y = 22 * s;

    // Ornament
    ctx.textAlign = 'center';
    ctx.fillStyle = '#8B7348';
    ctx.font = `${16 * s}px serif`;
    ctx.fillText('\u2767  \u2726  \u2767', W / 2, y + 16 * s);
    y += 20 * s;

    // Decree
    ctx.font = `700 ${14 * s}px 'UnifrakturCook', cursive`;
    ctx.fillStyle = '#8B7348';
    ctx.fillText((bsDecrees[evType] || 'A Grand Procession').toUpperCase(), W / 2, y + 14 * s);
    y += 18 * s;

    // Rule
    const grad1 = ctx.createLinearGradient(pad, y, W - pad, y);
    grad1.addColorStop(0, 'transparent');
    grad1.addColorStop(0.5, '#5C4A2E');
    grad1.addColorStop(1, 'transparent');
    ctx.fillStyle = grad1;
    ctx.fillRect(pad, y, W - 2 * pad, 1 * s);
    y += 6 * s;

    // Title
    ctx.fillStyle = '#F0E0C0';
    ctx.font = `700 ${36 * s}px 'UnifrakturCook', cursive`;
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowOffsetX = 1 * s; ctx.shadowOffsetY = 1 * s; ctx.shadowBlur = 0;
    const bsTitleLines = wrapText(event.title, W - 2 * pad, 2);
    bsTitleLines.forEach(line => { ctx.fillText(line, W / 2, y + 36 * s); y += 40 * s; });
    ctx.shadowColor = 'transparent'; ctx.shadowOffsetX = 0; ctx.shadowOffsetY = 0;
    y += 4 * s;

    // Subtitle / description
    ctx.font = `italic ${13 * s}px 'IM Fell English', serif`;
    ctx.fillStyle = '#B8A67E';
    const subLines = wrapText(event.description || '', W - 2 * pad - 20 * s, 4);
    subLines.forEach(line => { ctx.fillText(line, W / 2, y + 13 * s); y += 16 * s; });
    y += 4 * s;

    const topEndY = y;

    // --- FOOTER (anchored from bottom) ---
    // QR code in bottom-right
    const bsQrSize = 50 * s;
    const footUrlY = H - 22 * s;
    const footOrgY = footUrlY - 16 * s;
    const footRuleY = footOrgY - 10 * s;

    // --- DETAILS (above footer) ---
    const detH = 16 * s * 3;
    const detStartY = footRuleY - 8 * s - detH;

    // --- ILLUSTRATION (fills remaining space) ---
    const illusGap = 6 * s;
    const illusW = Math.min(260 * s, W - 2 * pad);
    const illusX = W / 2 - illusW / 2;
    const illusY = topEndY + illusGap;
    const illusH = Math.max(30 * s, detStartY - illusGap - illusY);

    ctx.strokeStyle = '#5C4A2E';
    ctx.lineWidth = 2 * s;
    ctx.fillStyle = '#231D12';
    ctx.fillRect(illusX, illusY, illusW, illusH);
    ctx.strokeRect(illusX, illusY, illusW, illusH);
    ctx.globalAlpha = 0.3;
    ctx.lineWidth = 1 * s;
    ctx.strokeRect(illusX + 3*s, illusY + 3*s, illusW - 6*s, illusH - 6*s);
    ctx.globalAlpha = 1;
    drawBroadsideIllus(ctx, illusX, illusY, illusW, illusH, s, evType);

    // Render details
    ctx.textAlign = 'center';
    let dy = detStartY;
    ctx.fillStyle = '#F0E0C0';
    ctx.font = `bold ${14 * s}px 'IM Fell English', serif`;
    ctx.fillText(dateStr, W / 2, dy + 14 * s);
    dy += 16 * s;
    ctx.fillStyle = '#D4C4A0';
    ctx.font = `${13 * s}px 'IM Fell English', serif`;
    ctx.fillText(timeStr, W / 2, dy + 13 * s);
    dy += 16 * s;
    ctx.font = `${12 * s}px 'IM Fell English', serif`;
    ctx.fillText(locationText, W / 2, dy + 12 * s);

    // Render footer (left-justified to avoid QR overlap)
    ctx.globalAlpha = 0.3;
    ctx.fillStyle = '#5C4A2E';
    ctx.fillRect(pad, footRuleY, W - 2 * pad, 1 * s);
    ctx.globalAlpha = 1;

    ctx.textAlign = 'left';
    ctx.fillStyle = '#B8A67E';
    ctx.font = `700 ${16 * s}px 'UnifrakturCook', cursive`;
    ctx.fillText(orgName, pad, footOrgY);
    ctx.fillStyle = '#8B7348';
    ctx.font = `italic ${11 * s}px 'IM Fell English', serif`;
    ctx.fillText(orgWebsite, pad, footUrlY);

    // QR code
    const eventUrl = 'https://' + (AppConfig.domain || 'resist.events') + '/events/' + event.id;
    try {
      const qr = qrcode(0, 'M'); qr.addData(eventUrl); qr.make();
      const qrMods = qr.getModuleCount();
      const qrX = W - pad - bsQrSize, qrY2 = footRuleY + 4 * s;
      ctx.fillStyle = '#E8D5B0';
      ctx.fillRect(qrX - 3*s, qrY2 - 3*s, bsQrSize + 6*s, bsQrSize + 6*s);
      const qrCell = bsQrSize / qrMods;
      ctx.fillStyle = '#2C2416';
      for (let r = 0; r < qrMods; r++) for (let c = 0; c < qrMods; c++) {
        if (qr.isDark(r, c)) ctx.fillRect(qrX + c * qrCell, qrY2 + r * qrCell, qrCell + 0.5, qrCell + 0.5);
      }
    } catch(e) {}

    // Generated by
    ctx.textAlign = 'left';
    ctx.fillStyle = 'rgba(92,74,46,0.5)';
    ctx.font = `${7 * s}px 'IM Fell English', serif`;
    ctx.fillText(genText, pad, H - 6 * s);

  // ============================================
  // TEMPLATE 1: RALLY BOLD
  // ============================================
  } else if (templateIndex === 1) {
    const rc = rallyColors[evType] || rallyColors.march;

    // Dark background
    ctx.fillStyle = rc.bg;
    ctx.fillRect(0, 0, W, H);

    // Top-left angled sash
    ctx.save();
    ctx.translate(-100 * s, -60 * s);
    ctx.rotate(-15 * Math.PI / 180);
    ctx.fillStyle = rc.sash;
    ctx.fillRect(0, 0, 350 * s, 200 * s);
    ctx.restore();

    // Bottom-right angled sash
    ctx.save();
    ctx.translate(W - 280 * s, H - 120 * s);
    ctx.rotate(-15 * Math.PI / 180);
    ctx.fillStyle = rc.sash;
    ctx.fillRect(0, 0, 400 * s, 200 * s);
    ctx.restore();

    // Radial gradient overlay
    const radGrad = ctx.createRadialGradient(W/2, H/2, 0, W/2, H/2, W * 0.7);
    radGrad.addColorStop(0, 'transparent');
    radGrad.addColorStop(1, 'rgba(0,0,0,0.3)');
    ctx.fillStyle = radGrad;
    ctx.fillRect(0, 0, W, H);

    const rlPad = 20 * s;
    let y = 20 * s;

    // Event type label
    ctx.textAlign = 'left';
    ctx.fillStyle = rc.typeColor;
    ctx.font = `600 ${12 * s}px 'Oswald', sans-serif`;
    ctx.fillText((colors.label || 'MARCH').toUpperCase(), rlPad, y + 12 * s);
    y += 16 * s;

    // Title in Bebas Neue
    ctx.fillStyle = '#FFFFFF';
    ctx.font = `400 ${34 * s}px 'Bebas Neue', sans-serif`;
    ctx.shadowColor = `rgba(${rc.sash === '#7B5EA7' ? '123,94,167' : '212,43,43'},0.6)`;
    ctx.shadowOffsetX = 3 * s; ctx.shadowOffsetY = 3 * s; ctx.shadowBlur = 0;
    const rlTitleLines = wrapText(event.title.toUpperCase(), W - 2 * rlPad, 3);
    rlTitleLines.forEach(line => { ctx.fillText(line, rlPad, y + 30 * s); y += 32 * s; });
    ctx.shadowColor = 'transparent'; ctx.shadowOffsetX = 0; ctx.shadowOffsetY = 0;
    y += 4 * s;

    // Description
    ctx.fillStyle = '#ccc';
    ctx.font = `400 ${12 * s}px 'DM Sans', sans-serif`;
    const rlDescLines = wrapText(event.description || '', W - 2 * rlPad, 3);
    rlDescLines.forEach(line => { ctx.fillText(line, rlPad, y + 12 * s); y += 15 * s; });
    y += 6 * s;

    const rlTopEndY = y;

    // --- BOTTOM SECTION (anchored from bottom) ---
    // Generated by
    const rlGenY = H - 5 * s;
    // Footer
    const rlFootY = H - 18 * s;
    // Info bar
    const rlInfoH = 84 * s;
    const rlInfoY = rlFootY - 12 * s - rlInfoH;

    // --- GFX illustration (fills remaining space) ---
    const gfxY = rlTopEndY;
    const gfxH = rlInfoY - gfxY;
    if (gfxH > 40 * s) {
      const gfxCx = W / 2, gfxCy = gfxY + gfxH / 2;
      drawRallyIllus(ctx, gfxCx, gfxCy, s, evType, rc);
    }

    // Render info bar
    ctx.fillStyle = rc.sash;
    ctx.fillRect(0, rlInfoY, W, rlInfoH);

    const infoCol = W / 2;
    ctx.textAlign = 'left';

    // Date
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.font = `600 ${8 * s}px 'Oswald', sans-serif`;
    ctx.fillText('DATE', rlPad, rlInfoY + 18 * s);
    ctx.fillStyle = '#fff';
    ctx.font = `400 ${18 * s}px 'Bebas Neue', sans-serif`;
    ctx.fillText(dateStr, rlPad, rlInfoY + 36 * s);

    // Time
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.font = `600 ${8 * s}px 'Oswald', sans-serif`;
    ctx.fillText('TIME', infoCol, rlInfoY + 18 * s);
    ctx.fillStyle = '#fff';
    ctx.font = `400 ${18 * s}px 'Bebas Neue', sans-serif`;
    ctx.fillText(timeStr, infoCol, rlInfoY + 36 * s);

    // Location
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.font = `600 ${8 * s}px 'Oswald', sans-serif`;
    ctx.fillText(evType === 'virtual' ? 'PLATFORM' : 'LOCATION', rlPad, rlInfoY + 54 * s);
    ctx.fillStyle = '#fff';
    ctx.font = `500 ${12 * s}px 'Oswald', sans-serif`;
    ctx.fillText(locationText, rlPad, rlInfoY + 70 * s);

    // Render footer
    ctx.fillStyle = '#fff';
    ctx.font = `700 ${12 * s}px 'Oswald', sans-serif`;
    ctx.fillText(orgName.toUpperCase(), rlPad, rlFootY);
    ctx.textAlign = 'right';
    ctx.fillStyle = rc.urlColor;
    ctx.font = `500 ${10 * s}px 'Oswald', sans-serif`;
    ctx.fillText(orgWebsite, W - rlPad, rlFootY);

    // QR code
    const rlEventUrl = 'https://' + (AppConfig.domain || 'resist.events') + '/events/' + event.id;
    try {
      const qr = qrcode(0, 'M'); qr.addData(rlEventUrl); qr.make();
      const qrMods = qr.getModuleCount();
      const qrSize = 50 * s;
      const qrX = W - rlPad - qrSize, qrY2 = H - rlPad - qrSize;
      ctx.fillStyle = '#fff';
      ctx.fillRect(qrX - 3*s, qrY2 - 3*s, qrSize + 6*s, qrSize + 6*s);
      const qrCell = qrSize / qrMods;
      ctx.fillStyle = rc.bg;
      for (let r = 0; r < qrMods; r++) for (let c = 0; c < qrMods; c++) {
        if (qr.isDark(r, c)) ctx.fillRect(qrX + c * qrCell, qrY2 + r * qrCell, qrCell + 0.5, qrCell + 0.5);
      }
    } catch(e) {}
    // Generated by
    ctx.textAlign = 'right';
    ctx.fillStyle = 'rgba(255,255,255,0.2)';
    ctx.font = `${7 * s}px 'Oswald', sans-serif`;
    ctx.fillText(genText, W - 10 * s, rlGenY);

  // ============================================
  // TEMPLATE 2: MODERN CLEAN
  // ============================================
  } else if (templateIndex === 2) {
    const mc = modernColors[evType] || modernColors.march;

    // Cream background
    ctx.fillStyle = '#F8F5F0';
    ctx.fillRect(0, 0, W, H);

    // Left accent bar
    const acGrad = ctx.createLinearGradient(0, 0, 0, H);
    acGrad.addColorStop(0, mc.accent);
    acGrad.addColorStop(0.5, mc.accent === '#8B2E2E' ? '#C04040' : '#4A9B6A');
    acGrad.addColorStop(1, mc.accent);
    ctx.fillStyle = acGrad;
    ctx.fillRect(0, 0, 6 * s, H);

    const mcPad = 24 * s;
    let y = 24 * s;

    // Date box
    const dbW = 64 * s, dbH = 72 * s;
    roundRect(mcPad, y, dbW, dbH, 8 * s);
    ctx.fillStyle = mc.accent;
    ctx.fill();
    ctx.textAlign = 'center';
    ctx.fillStyle = '#fff';
    ctx.globalAlpha = 0.8;
    ctx.font = `700 ${10 * s}px 'DM Sans', sans-serif`;
    ctx.fillText(dateMo.toUpperCase(), mcPad + dbW/2, y + 18 * s);
    ctx.globalAlpha = 1;
    ctx.font = `900 ${32 * s}px 'Fraunces', serif`;
    ctx.fillText(dateD, mcPad + dbW/2, y + 50 * s);
    ctx.globalAlpha = 0.7;
    ctx.font = `600 ${9 * s}px 'DM Sans', sans-serif`;
    ctx.fillText(dateWd.toUpperCase(), mcPad + dbW/2, y + 64 * s);
    ctx.globalAlpha = 1;

    // Event type tag (top right)
    const tagText = (colors.label || 'Event').toUpperCase();
    ctx.font = `700 ${9 * s}px 'DM Sans', sans-serif`;
    const tagW = ctx.measureText(tagText).width + 20 * s;
    const tagX = W - mcPad - tagW;
    const tagY = y + 6 * s;
    ctx.strokeStyle = mc.accent;
    ctx.lineWidth = 2 * s;
    roundRect(tagX, tagY, tagW, 24 * s, 12 * s);
    ctx.stroke();
    ctx.fillStyle = mc.accent;
    ctx.textAlign = 'center';
    ctx.fillText(tagText, tagX + tagW/2, tagY + 16 * s);

    y += dbH + 14 * s;

    // Title
    ctx.textAlign = 'left';
    ctx.fillStyle = '#1A1A1A';
    ctx.font = `900 ${26 * s}px 'Fraunces', serif`;
    const mcTitleLines = wrapText(event.title, W - 2 * mcPad, 3);
    mcTitleLines.forEach(line => { ctx.fillText(line, mcPad, y + 26 * s); y += 28 * s; });
    y += 4 * s;

    // Description
    ctx.fillStyle = '#555';
    ctx.font = `400 ${11 * s}px 'DM Sans', sans-serif`;
    const mcDescLines = wrapText(event.description || '', W - 2 * mcPad, 5);
    mcDescLines.forEach(line => { ctx.fillText(line, mcPad, y + 11 * s); y += 14 * s; });
    y += 6 * s;

    const mcTopEndY = y;

    // --- BOTTOM SECTION (anchored from bottom) ---
    const mcGenY = H - 5 * s;
    const mcFootY = H - 20 * s;
    const mcFootRuleY = mcFootY - 12 * s;

    // Detail cards
    const gridGap = 8 * s;
    const cardW = (W - 2 * mcPad - gridGap) / 2;
    const cardH = 44 * s;
    const cardsH = cardH + gridGap + cardH; // 2 rows
    const cardsY = mcFootRuleY - 10 * s - cardsH;

    // --- ILLUSTRATION (fills remaining space) ---
    const visGap = 8 * s;
    const visY = mcTopEndY + visGap;
    const visH = Math.max(30 * s, cardsY - visGap - visY);

    if (visH > 30 * s) {
      const visGrad2 = ctx.createLinearGradient(mcPad, visY, W - mcPad, visY + visH);
      visGrad2.addColorStop(0, mc.visBg[0]);
      visGrad2.addColorStop(0.5, mc.visBg[1]);
      visGrad2.addColorStop(1, mc.visBg[2]);
      ctx.fillStyle = visGrad2;
      roundRect(mcPad, visY, W - 2 * mcPad, visH, 12 * s);
      ctx.fill();
      const ovGrad = ctx.createLinearGradient(0, visY, 0, visY + visH);
      ovGrad.addColorStop(0, 'transparent');
      ovGrad.addColorStop(1, `rgba(${mc.accent === '#8B2E2E' ? '139,46,46' : '45,90,61'},0.08)`);
      ctx.fillStyle = ovGrad;
      roundRect(mcPad, visY, W - 2 * mcPad, visH, 12 * s);
      ctx.fill();
      drawModernIllus(ctx, mcPad, visY, W - 2 * mcPad, visH, s, evType, mc);
    }

    // Render detail cards
    const detailCards = [
      { label: 'TIME', value: timeStr },
      { label: evType === 'virtual' ? 'PLATFORM' : 'LOCATION', value: evType === 'virtual' ? 'Virtual Event' : (event.address || '').split(',')[0] || locationText },
    ];
    detailCards.forEach((card, i) => {
      const cx2 = mcPad + (i % 2) * (cardW + gridGap);
      roundRect(cx2, cardsY, cardW, cardH, 8 * s);
      ctx.fillStyle = '#F0EDE6';
      ctx.fill();
      ctx.fillStyle = '#999';
      ctx.font = `700 ${8 * s}px 'DM Sans', sans-serif`;
      ctx.textAlign = 'left';
      ctx.fillText(card.label, cx2 + 10 * s, cardsY + 16 * s);
      ctx.fillStyle = '#333';
      ctx.font = `600 ${12 * s}px 'DM Sans', sans-serif`;
      ctx.fillText(card.value, cx2 + 10 * s, cardsY + 32 * s);
    });

    // Full-width address card
    const addrY = cardsY + cardH + gridGap;
    roundRect(mcPad, addrY, W - 2 * mcPad, cardH, 8 * s);
    ctx.fillStyle = '#F0EDE6';
    ctx.fill();
    ctx.fillStyle = '#999';
    ctx.font = `700 ${8 * s}px 'DM Sans', sans-serif`;
    ctx.textAlign = 'left';
    ctx.fillText('ADDRESS', mcPad + 10 * s, addrY + 16 * s);
    ctx.fillStyle = '#333';
    ctx.font = `600 ${12 * s}px 'DM Sans', sans-serif`;
    ctx.fillText(locationText, mcPad + 10 * s, addrY + 32 * s);

    // Footer
    ctx.fillStyle = '#E0DDD6';
    ctx.fillRect(mcPad, mcFootRuleY, W - 2 * mcPad, 1 * s);
    ctx.textAlign = 'left';
    ctx.fillStyle = mc.accent;
    ctx.font = `700 ${11 * s}px 'DM Sans', sans-serif`;
    ctx.fillText(orgName, mcPad, mcFootY);
    ctx.textAlign = 'right';
    ctx.globalAlpha = 0.7;
    ctx.font = `400 ${10 * s}px 'DM Sans', sans-serif`;
    ctx.fillText(orgWebsite, W - mcPad, mcFootY);
    ctx.globalAlpha = 1;

    // QR code
    const mcEventUrl = 'https://' + (AppConfig.domain || 'resist.events') + '/events/' + event.id;
    try {
      const qr = qrcode(0, 'M'); qr.addData(mcEventUrl); qr.make();
      const qrMods = qr.getModuleCount();
      const qrSize = 50 * s;
      const qrX = W - mcPad - qrSize, qrY2 = H - mcPad - qrSize;
      ctx.fillStyle = '#fff';
      ctx.fillRect(qrX - 3*s, qrY2 - 3*s, qrSize + 6*s, qrSize + 6*s);
      const qrCell = qrSize / qrMods;
      ctx.fillStyle = mc.accent;
      for (let r = 0; r < qrMods; r++) for (let c = 0; c < qrMods; c++) {
        if (qr.isDark(r, c)) ctx.fillRect(qrX + c * qrCell, qrY2 + r * qrCell, qrCell + 0.5, qrCell + 0.5);
      }
    } catch(e) {}
    // Generated by
    ctx.textAlign = 'right';
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.font = `${7 * s}px 'DM Sans', sans-serif`;
    ctx.fillText(genText, W - 10 * s, mcGenY);

  // ============================================
  // TEMPLATE 3: PEOPLE'S VOICE
  // ============================================
  } else {
    ctx.fillStyle = '#FFF8E7';
    ctx.fillRect(0, 0, W, H);

    // Subtle texture
    ctx.globalAlpha = 0.02;
    ctx.fillStyle = '#C8AA64';
    ctx.fillRect(0, 0, W, H);
    ctx.globalAlpha = 1;

    // Radial gradients
    const rg1 = ctx.createRadialGradient(W * 0.2, H * 0.8, 0, W * 0.2, H * 0.8, W * 0.5);
    rg1.addColorStop(0, 'rgba(230,140,60,0.06)');
    rg1.addColorStop(1, 'transparent');
    ctx.fillStyle = rg1;
    ctx.fillRect(0, 0, W, H);
    const rg2 = ctx.createRadialGradient(W * 0.8, H * 0.2, 0, W * 0.8, H * 0.2, W * 0.5);
    rg2.addColorStop(0, 'rgba(100,60,180,0.04)');
    rg2.addColorStop(1, 'transparent');
    ctx.fillStyle = rg2;
    ctx.fillRect(0, 0, W, H);

    const pvPad = 20 * s;
    let y = 20 * s;

    // Type label (right-justified)
    ctx.textAlign = 'right';
    ctx.fillStyle = '#8B6F47';
    ctx.font = `400 ${15 * s}px 'Caveat', cursive`;
    const pvTypeText = pvTypeLabels[evType] || '~ event ~';
    ctx.save();
    ctx.translate(W - pvPad, y + 14 * s);
    ctx.rotate(-2 * Math.PI / 180);
    ctx.fillText(pvTypeText, 0, 0);
    ctx.restore();
    ctx.textAlign = 'left';
    y += 18 * s;

    // Title
    ctx.fillStyle = '#2A1F14';
    ctx.font = `400 ${32 * s}px 'Permanent Marker', cursive`;
    ctx.save();
    ctx.rotate(-0.5 * Math.PI / 180);
    const pvTitleLines = wrapText(event.title, W - 2 * pvPad, 2);
    pvTitleLines.forEach(line => { ctx.fillText(line, pvPad, y + 32 * s); y += 34 * s; });
    ctx.restore();
    y += 2 * s;

    // Description
    ctx.fillStyle = '#6B5840';
    ctx.font = `400 ${17 * s}px 'Caveat', cursive`;
    const pvDescLines = wrapText(event.description || '', W - 2 * pvPad, 3);
    pvDescLines.forEach(line => { ctx.fillText(line, pvPad, y + 17 * s); y += 20 * s; });
    y += 2 * s;

    // URL
    ctx.fillStyle = '#B8906A';
    ctx.font = `400 ${10 * s}px 'DM Sans', sans-serif`;
    ctx.fillText(orgWebsite, pvPad, y + 10 * s);
    y += 14 * s;

    const pvTopEndY = y;

    // --- ILLUSTRATION (half of remaining space) ---
    const pvVisGap = 8 * s;
    const pvVisY = pvTopEndY + pvVisGap;
    const pvAvailSpace = H - pvTopEndY - 80 * s; // leave room for pills + footer + QR
    const pvVisH = Math.max(30 * s, pvAvailSpace / 2);

    if (pvVisH > 30 * s) {
      const bgColors = pvIllusBg[evType] || pvIllusBg.march;
      roundRect(pvPad, pvVisY, W - 2 * pvPad, pvVisH, 16 * s);
      ctx.save();
      ctx.clip();
      ctx.fillStyle = bgColors[3];
      ctx.fillRect(pvPad, pvVisY, W - 2 * pvPad, pvVisH);
      const rc1 = ctx.createRadialGradient(W * 0.3, pvVisY + pvVisH * 0.4, 0, W * 0.3, pvVisY + pvVisH * 0.4, pvVisH * 0.6);
      rc1.addColorStop(0, bgColors[0]); rc1.addColorStop(1, 'transparent');
      ctx.fillStyle = rc1; ctx.fillRect(0, pvVisY, W, pvVisH);
      const rc2 = ctx.createRadialGradient(W * 0.7, pvVisY + pvVisH * 0.6, 0, W * 0.7, pvVisY + pvVisH * 0.6, pvVisH * 0.5);
      rc2.addColorStop(0, bgColors[1]); rc2.addColorStop(1, 'transparent');
      ctx.fillStyle = rc2; ctx.fillRect(0, pvVisY, W, pvVisH);
      const rc3 = ctx.createRadialGradient(W * 0.5, pvVisY + pvVisH * 0.8, 0, W * 0.5, pvVisY + pvVisH * 0.8, pvVisH * 0.5);
      rc3.addColorStop(0, bgColors[2]); rc3.addColorStop(1, 'transparent');
      ctx.fillStyle = rc3; ctx.fillRect(0, pvVisY, W, pvVisH);
      drawPeoplesIllus(ctx, pvPad, pvVisY, W - 2 * pvPad, pvVisH, s, evType);
      ctx.restore();
    }

    // Render pills (flow from below illustration)
    const pillH = 28 * s;
    const pillsStartY = pvVisY + pvVisH + pvVisGap;
    const pills = [
      { icon: '\uD83D\uDCC5', text: dateStr },
      { icon: '\uD83D\uDD56', text: timeStr },
      { icon: evType === 'virtual' ? '\uD83D\uDCBB' : '\uD83D\uDCCD', text: evType === 'virtual' ? 'Virtual' : (event.address || '').split(',')[0] || locationText },
    ];
    let px = pvPad;
    let pillY = pillsStartY;
    ctx.textAlign = 'left';
    pills.forEach(pill => {
      const pillText = pill.icon + ' ' + pill.text;
      ctx.font = `600 ${11 * s}px 'DM Sans', sans-serif`;
      const tw = ctx.measureText(pillText).width;
      const pillW = tw + 24 * s;
      if (px + pillW > W - pvPad && px > pvPad) {
        px = pvPad;
        pillY += pillH + 6 * s;
      }
      roundRect(px, pillY, pillW, pillH, 24 * s);
      ctx.fillStyle = '#FFF';
      ctx.fill();
      ctx.strokeStyle = '#E8D8B8';
      ctx.lineWidth = 2 * s;
      roundRect(px, pillY, pillW, pillH, 24 * s);
      ctx.stroke();
      ctx.fillStyle = '#4A3D2C';
      ctx.fillText(pillText, px + 12 * s, pillY + 18 * s);
      px += pillW + 6 * s;
    });

    // Footer (below pills)
    const pvFootY = pillY + pillH + 12 * s;
    ctx.textAlign = 'left';
    ctx.fillStyle = '#D45B2B';
    ctx.font = `400 ${11 * s}px 'Permanent Marker', cursive`;
    ctx.fillText(orgName, pvPad, pvFootY);

    ctx.textAlign = 'right';
    ctx.fillStyle = '#8B6F47';
    ctx.font = `400 ${13 * s}px 'Caveat', cursive`;
    ctx.save();
    ctx.translate(W - pvPad - 55 * s, pvFootY); // offset to avoid QR code
    ctx.rotate(1 * Math.PI / 180);
    ctx.fillText(pvFootNotes[evType] || 'all are welcome \u2728', 0, 0);
    ctx.restore();

    // QR code
    const pvEventUrl = 'https://' + (AppConfig.domain || 'resist.events') + '/events/' + event.id;
    try {
      const qr = qrcode(0, 'M'); qr.addData(pvEventUrl); qr.make();
      const qrMods = qr.getModuleCount();
      const qrSize = 50 * s;
      const qrX = W - pvPad - qrSize, qrY2 = H - pvPad - qrSize;
      ctx.fillStyle = '#FFF';
      ctx.fillRect(qrX - 3*s, qrY2 - 3*s, qrSize + 6*s, qrSize + 6*s);
      const qrCell = qrSize / qrMods;
      ctx.fillStyle = '#2A1F14';
      for (let r = 0; r < qrMods; r++) for (let c = 0; c < qrMods; c++) {
        if (qr.isDark(r, c)) ctx.fillRect(qrX + c * qrCell, qrY2 + r * qrCell, qrCell + 0.5, qrCell + 0.5);
      }
    } catch(e) {}
    // Generated by (bottom-left to avoid QR)
    ctx.textAlign = 'left';
    ctx.fillStyle = 'rgba(0,0,0,0.15)';
    ctx.font = `${7 * s}px 'DM Sans', sans-serif`;
    ctx.fillText(genText, pvPad, H - 5 * s);
  }
}

// ======= BROADSIDE SVG ILLUSTRATIONS (canvas) =======
function drawBroadsideIllus(ctx, x, y, w, h, s, evType) {
  const cx = x + w/2, cy = y + h/2;
  ctx.fillStyle = '#3D321F';
  ctx.strokeStyle = '#5C4A2E';

  if (evType === 'virtual') {
    // Monitor with play button and viewers
    ctx.fillStyle = '#3D321F';
    flyerRoundRect(ctx, cx - 65*s, cy - 18*s, 130*s, 55*s, 6*s); ctx.fill();
    ctx.fillStyle = '#2C2416';
    ctx.fillRect(cx - 57*s, cy - 12*s, 114*s, 40*s);
    ctx.strokeStyle = '#5C4A2E'; ctx.lineWidth = 1.5*s;
    ctx.beginPath(); ctx.arc(cx, cy + 8*s, 12*s, 0, Math.PI*2); ctx.stroke();
    ctx.fillStyle = '#5C4A2E';
    ctx.beginPath(); ctx.moveTo(cx - 4*s, cy + 2*s); ctx.lineTo(cx + 7*s, cy + 8*s); ctx.lineTo(cx - 4*s, cy + 14*s); ctx.closePath(); ctx.fill();
    // Stand
    ctx.fillStyle = '#3D321F';
    flyerRoundRect(ctx, cx - 35*s, cy + 38*s, 70*s, 4*s, 2*s); ctx.fill();
    // Viewers
    flyerDrawPerson(ctx, cx - 55*s, cy + 18*s, 5*s, 8*s, 10*s, '#3D321F');
    flyerDrawPerson(ctx, cx + 55*s, cy + 18*s, 5*s, 8*s, 10*s, '#3D321F');
  } else if (evType === 'signature_gathering') {
    // Document with lines and quills
    ctx.fillStyle = '#3D321F';
    flyerRoundRect(ctx, cx - 55*s, cy - 30*s, 110*s, 70*s, 2*s); ctx.fill();
    ctx.fillStyle = '#2C2416';
    ctx.fillRect(cx - 49*s, cy - 24*s, 98*s, 58*s);
    ctx.strokeStyle = '#5C4A2E'; ctx.lineWidth = 1*s;
    for (let i = 0; i < 4; i++) {
      ctx.beginPath(); ctx.moveTo(cx - 38*s, cy - 12*s + i*10*s); ctx.lineTo(cx + 38*s, cy - 12*s + i*10*s); ctx.stroke();
    }
    // Wax seal
    ctx.globalAlpha = 0.4; ctx.fillStyle = '#5C4A2E';
    ctx.beginPath(); ctx.arc(cx + 20*s, cy + 24*s, 8*s, 0, Math.PI*2); ctx.fill();
    ctx.globalAlpha = 1;
    // Quills
    ctx.globalAlpha = 0.6; ctx.fillStyle = '#5C4A2E';
    ctx.save(); ctx.translate(cx - 75*s, cy + 16*s); ctx.rotate(-0.3);
    ctx.fillRect(0, -35*s, 3*s, 35*s); ctx.restore();
    ctx.save(); ctx.translate(cx + 75*s, cy + 12*s); ctx.rotate(0.3);
    ctx.fillRect(0, -35*s, 3*s, 35*s); ctx.restore();
    ctx.globalAlpha = 1;
  } else if (evType === 'march') {
    // Row of marching people with signs
    const people = [
      { cx: -80, cy: 2, r: 8, bw: 12, bh: 16 },
      { cx: -45, cy: -3, r: 9, bw: 14, bh: 18 },
      { cx: -10, cy: 0, r: 8, bw: 12, bh: 16 },
      { cx: 20, cy: -5, r: 10, bw: 14, bh: 20 },
      { cx: 50, cy: -1, r: 8, bw: 12, bh: 16 },
      { cx: 75, cy: -3, r: 9, bw: 14, bh: 18 },
      { cx: 102, cy: 2, r: 8, bw: 12, bh: 16 },
    ];
    people.forEach(p => {
      const col = p.r > 9 ? '#4A3D2A' : '#3D321F';
      flyerDrawPerson(ctx, cx + p.cx*s, cy + p.cy*s, p.r*s, p.bw*s, p.bh*s, col);
    });
    // Signs
    ctx.strokeStyle = '#3D321F'; ctx.lineWidth = 3*s;
    ctx.beginPath(); ctx.moveTo(cx - 80*s, cy + 10*s); ctx.lineTo(cx - 92*s, cy - 18*s); ctx.stroke();
    ctx.strokeStyle = '#4A3D2A';
    ctx.beginPath(); ctx.moveTo(cx + 20*s, cy + 5*s); ctx.lineTo(cx + 8*s, cy - 25*s); ctx.stroke();
    ctx.globalAlpha = 0.6; ctx.fillStyle = '#5C4A2E';
    ctx.fillRect(cx + 1*s, cy - 37*s, 14*s, 14*s);
    ctx.globalAlpha = 1;
    ctx.beginPath(); ctx.moveTo(cx + 75*s, cy + 6*s); ctx.lineTo(cx + 87*s, cy - 16*s); ctx.stroke();
    // Ground line
    ctx.globalAlpha = 0.3; ctx.strokeStyle = '#5C4A2E'; ctx.lineWidth = 1*s;
    ctx.beginPath(); ctx.moveTo(x, cy + 35*s);
    ctx.quadraticCurveTo(cx, cy + 28*s, x + w, cy + 32*s); ctx.stroke();
    ctx.globalAlpha = 1;
  } else if (evType === 'protest_gathering') {
    // Protesters with raised fists and signs
    const people = [
      { cx: -55, cy: -5, r: 10 },
      { cx: -20, cy: -10, r: 12 },
      { cx: 20, cy: -7, r: 11 },
      { cx: 55, cy: -3, r: 10 },
    ];
    people.forEach((p, i) => {
      const col = i % 2 === 0 ? '#4A3D2A' : '#3D321F';
      flyerDrawPerson(ctx, cx + p.cx*s, cy + p.cy*s, p.r*s, (p.r*1.5)*s, (p.r*2)*s, col);
      // Raised arm with sign
      ctx.strokeStyle = col; ctx.lineWidth = 3*s;
      const dir = i % 2 === 0 ? -1 : 1;
      ctx.beginPath();
      ctx.moveTo(cx + p.cx*s, cy + p.cy*s + p.r*s);
      ctx.lineTo(cx + (p.cx + dir*15)*s, cy + (p.cy - 20)*s);
      ctx.stroke();
    });
    // Big sign
    ctx.globalAlpha = 0.5; ctx.fillStyle = '#5C4A2E';
    ctx.fillRect(cx - 10*s, cy - 35*s, 14*s, 12*s);
    ctx.globalAlpha = 1;
    ctx.strokeStyle = '#3D321F'; ctx.lineWidth = 3*s;
    ctx.beginPath(); ctx.moveTo(cx - 20*s, cy); ctx.lineTo(cx - 3*s, cy - 35*s); ctx.stroke();
    // Ground
    ctx.globalAlpha = 0.3; ctx.strokeStyle = '#5C4A2E'; ctx.lineWidth = 1*s;
    ctx.beginPath(); ctx.moveTo(x, cy + 35*s);
    ctx.quadraticCurveTo(cx, cy + 30*s, x + w, cy + 33*s); ctx.stroke();
    ctx.globalAlpha = 1;
  } else {
    // Community: stage/microphone
    ctx.fillStyle = '#3D321F';
    flyerRoundRect(ctx, cx - 45*s, cy - 8*s, 90*s, 50*s, 3*s); ctx.fill();
    flyerRoundRect(ctx, cx - 30*s, cy - 28*s, 60*s, 24*s, 8*s); ctx.fill();
    flyerRoundRect(ctx, cx - 20*s, cy - 36*s, 40*s, 12*s, 4*s); ctx.fill();
    // Mic stand
    ctx.strokeStyle = '#5C4A2E'; ctx.lineWidth = 2*s;
    ctx.beginPath(); ctx.moveTo(cx, cy - 8*s); ctx.lineTo(cx, cy - 28*s); ctx.stroke();
    ctx.beginPath(); ctx.arc(cx, cy - 30*s, 3*s, 0, Math.PI*2); ctx.fillStyle = '#5C4A2E'; ctx.fill();
    // Viewers
    flyerDrawPerson(ctx, cx - 65*s, cy + 20*s, 5*s, 8*s, 10*s, '#3D321F');
    flyerDrawPerson(ctx, cx + 65*s, cy + 20*s, 5*s, 8*s, 10*s, '#3D321F');
    // Music notes
    ctx.fillStyle = '#5C4A2E'; ctx.globalAlpha = 0.5;
    ctx.font = `${14*s}px serif`;
    ctx.textAlign = 'center';
    ctx.fillText('\u266A', cx - 50*s, cy - 2*s);
    ctx.fillText('\u266B', cx + 52*s, cy - 5*s);
    ctx.globalAlpha = 1;
  }
}

// ======= RALLY BOLD SVG ILLUSTRATIONS (canvas) =======
function drawRallyIllus(ctx, cx, cy, s, evType, rc) {
  if (evType === 'virtual') {
    // Monitor with play button
    ctx.fillStyle = rc.sash;
    flyerRoundRect(ctx, cx - 50*s, cy - 35*s, 100*s, 70*s, 6*s); ctx.fill();
    ctx.fillStyle = rc.bg;
    flyerRoundRect(ctx, cx - 42*s, cy - 27*s, 84*s, 54*s, 2*s); ctx.fill();
    ctx.strokeStyle = rc.typeColor; ctx.lineWidth = 2*s;
    ctx.beginPath(); ctx.arc(cx, cy, 16*s, 0, Math.PI*2); ctx.stroke();
    ctx.fillStyle = rc.typeColor;
    ctx.beginPath(); ctx.moveTo(cx - 6*s, cy - 9*s); ctx.lineTo(cx + 10*s, cy); ctx.lineTo(cx - 6*s, cy + 9*s); ctx.closePath(); ctx.fill();
    // Stand
    ctx.fillStyle = rc.sash;
    flyerRoundRect(ctx, cx - 25*s, cy + 36*s, 50*s, 4*s, 2*s); ctx.fill();
    // Audience dots
    ctx.globalAlpha = 0.3; ctx.fillStyle = rc.typeColor;
    ctx.beginPath(); ctx.arc(cx - 45*s, cy + 60*s, 6*s, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(cx - 25*s, cy + 65*s, 5*s, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(cx + 25*s, cy + 65*s, 5*s, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(cx + 45*s, cy + 60*s, 6*s, 0, Math.PI*2); ctx.fill();
    ctx.globalAlpha = 1;
  } else if (evType === 'signature_gathering') {
    // Document with pen
    ctx.fillStyle = rc.sash;
    flyerRoundRect(ctx, cx - 45*s, cy - 55*s, 90*s, 110*s, 3*s); ctx.fill();
    ctx.fillStyle = rc.bg;
    ctx.fillRect(cx - 38*s, cy - 47*s, 76*s, 90*s);
    ctx.globalAlpha = 0.5; ctx.strokeStyle = rc.typeColor; ctx.lineWidth = 1.5*s;
    for (let i = 0; i < 4; i++) {
      ctx.beginPath(); ctx.moveTo(cx - 28*s, cy - 32*s + i*14*s); ctx.lineTo(cx + 28*s, cy - 32*s + i*14*s); ctx.stroke();
    }
    ctx.globalAlpha = 0.6;
    // Quill/pen
    ctx.fillStyle = rc.typeColor;
    ctx.beginPath();
    ctx.moveTo(cx + 5*s, cy + 20*s);
    ctx.quadraticCurveTo(cx + 12*s, cy + 10*s, cx + 20*s, cy + 25*s);
    ctx.quadraticCurveTo(cx + 25*s, cy + 30*s, cx + 15*s, cy + 32*s);
    ctx.quadraticCurveTo(cx + 8*s, cy + 33*s, cx + 5*s, cy + 26*s);
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle = rc.typeColor; ctx.lineWidth = 2*s;
    ctx.beginPath(); ctx.moveTo(cx + 5*s, cy + 26*s); ctx.lineTo(cx - 10*s, cy + 45*s); ctx.stroke();
    ctx.globalAlpha = 1;
  } else if (evType === 'march') {
    // Fist silhouette shape (raised hand)
    ctx.fillStyle = rc.sash;
    // Simplified raised fist
    flyerRoundRect(ctx, cx - 22*s, cy - 30*s, 45*s, 80*s, 4*s); ctx.fill();
    // Fingers
    ctx.fillStyle = rc.sash;
    const fingers = [
      { x: -18, y: -35, w: 11, h: 30, r: 5 },
      { x: -5, y: -42, w: 11, h: 30, r: 5 },
      { x: 8, y: -38, w: 11, h: 28, r: 5 },
      { x: 20, y: -30, w: 10, h: 24, r: 5 },
    ];
    fingers.forEach(f => {
      flyerRoundRect(ctx, cx + f.x*s, cy + f.y*s, f.w*s, f.h*s, f.r*s);
      ctx.fill();
    });
    // Wrist
    ctx.fillStyle = rc.sash;
    ctx.fillRect(cx - 15*s, cy + 50*s, 30*s, 20*s);
    // Arm lines
    ctx.strokeStyle = 'rgba(255,255,255,0.2)'; ctx.lineWidth = 2*s;
    ctx.beginPath(); ctx.moveTo(cx - 22*s, cy + 50*s); ctx.lineTo(cx - 22*s, cy + 80*s); ctx.stroke();
  } else if (evType === 'protest_gathering') {
    // Crowd with big "!!!" behind
    ctx.globalAlpha = 0.15; ctx.fillStyle = rc.sash;
    ctx.font = `400 ${72*s}px 'Bebas Neue', sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('!!!', cx, cy + 20*s);
    ctx.globalAlpha = 1;
    // People
    const ppl = [
      { cx: -30, cy: -5, r: 12, color: `rgba(${rc.typeColor === '#B89AE0' ? '184,154,224' : '255,107,107'},0.3)` },
      { cx: 0, cy: -15, r: 15, color: `rgba(${rc.sash === '#7B5EA7' ? '123,94,167' : '212,43,43'},0.4)` },
      { cx: 32, cy: -8, r: 12, color: `rgba(${rc.typeColor === '#B89AE0' ? '184,154,224' : '255,107,107'},0.3)` },
    ];
    ppl.forEach(p => {
      flyerDrawPerson(ctx, cx + p.cx*s, cy + p.cy*s, p.r*s, p.r*1.3*s, p.r*2*s, p.color);
      // Arm up
      ctx.strokeStyle = p.color; ctx.lineWidth = 3*s;
      ctx.beginPath();
      ctx.moveTo(cx + p.cx*s, cy + (p.cy + p.r)*s);
      ctx.lineTo(cx + (p.cx - 12)*s, cy + (p.cy - 22)*s);
      ctx.stroke();
    });
    // Central sign
    ctx.globalAlpha = 0.5; ctx.fillStyle = rc.sash;
    ctx.fillRect(cx - 7*s, cy - 52*s, 14*s, 16*s);
    ctx.globalAlpha = 1;
    ctx.strokeStyle = `rgba(${rc.sash === '#7B5EA7' ? '123,94,167' : '212,43,43'},0.5)`;
    ctx.lineWidth = 4*s;
    ctx.beginPath(); ctx.moveTo(cx, cy - 5*s); ctx.lineTo(cx - 12*s, cy - 38*s); ctx.stroke();
  } else {
    // Community: Microphone
    ctx.fillStyle = rc.sash;
    ctx.fillRect(cx - 12*s, cy - 35*s, 24*s, 70*s);
    ctx.beginPath(); ctx.arc(cx, cy - 39*s, 14*s, 0, Math.PI*2);
    ctx.fillStyle = rc.sash; ctx.fill();
    ctx.fillStyle = rc.bg;
    ctx.beginPath(); ctx.arc(cx, cy - 39*s, 8*s, 0, Math.PI*2); ctx.fill();
    // Mic stand legs
    ctx.strokeStyle = rc.sash; ctx.lineWidth = 3*s;
    ctx.beginPath(); ctx.moveTo(cx - 15*s, cy + 35*s); ctx.lineTo(cx - 30*s, cy + 60*s); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx + 15*s, cy + 35*s); ctx.lineTo(cx + 30*s, cy + 60*s); ctx.stroke();
    // Music notes
    ctx.globalAlpha = 0.3; ctx.fillStyle = rc.typeColor;
    ctx.font = `${20*s}px serif`; ctx.textAlign = 'center';
    ctx.fillText('\u266A', cx - 35*s, cy - 10*s);
    ctx.font = `${24*s}px serif`;
    ctx.fillText('\u266B', cx + 30*s, cy - 15*s);
    ctx.font = `${16*s}px serif`;
    ctx.fillText('\u266A', cx - 30*s, cy + 20*s);
    ctx.fillText('\u266A', cx + 25*s, cy + 18*s);
    ctx.globalAlpha = 1;
  }
  ctx.textAlign = 'left';
}

// ======= MODERN CLEAN SVG ILLUSTRATIONS (canvas) =======
function drawModernIllus(ctx, x, y, w, h, s, evType, mc) {
  const cx = x + w/2, cy = y + h/2;
  const ac = mc.accent;
  const aRgb = ac === '#8B2E2E' ? '139,46,46' : '45,90,61';

  if (evType === 'virtual') {
    // Monitor + people
    ctx.fillStyle = `rgba(${aRgb},0.2)`;
    flyerRoundRect(ctx, cx - 60*s, cy - 30*s, 120*s, 70*s, 6*s); ctx.fill();
    ctx.fillStyle = `rgba(${aRgb},0.08)`;
    ctx.fillRect(cx - 52*s, cy - 23*s, 104*s, 54*s);
    ctx.strokeStyle = ac; ctx.lineWidth = 2*s;
    ctx.beginPath(); ctx.arc(cx, cy, 14*s, 0, Math.PI*2); ctx.stroke();
    ctx.fillStyle = ac; ctx.globalAlpha = 0.5;
    ctx.beginPath(); ctx.moveTo(cx - 5*s, cy - 8*s); ctx.lineTo(cx + 8*s, cy); ctx.lineTo(cx - 5*s, cy + 8*s); ctx.closePath(); ctx.fill();
    ctx.globalAlpha = 1;
    ctx.fillStyle = `rgba(${aRgb},0.2)`;
    flyerRoundRect(ctx, cx - 30*s, cy + 42*s, 60*s, 4*s, 2*s); ctx.fill();
    // Viewers
    ctx.fillStyle = `rgba(${aRgb},0.15)`;
    flyerDrawPerson(ctx, cx - 50*s, cy + 52*s, 6*s, 8*s, 10*s, `rgba(${aRgb},0.15)`);
    flyerDrawPerson(ctx, cx, cy + 54*s, 5*s, 7*s, 9*s, `rgba(${aRgb},0.12)`);
    flyerDrawPerson(ctx, cx + 50*s, cy + 52*s, 6*s, 8*s, 10*s, `rgba(${aRgb},0.15)`);
  } else if (evType === 'signature_gathering') {
    // Document
    ctx.fillStyle = `rgba(${aRgb},0.15)`;
    flyerRoundRect(ctx, cx - 50*s, cy - 40*s, 100*s, 90*s, 3*s); ctx.fill();
    ctx.strokeStyle = ac; ctx.lineWidth = 1.5*s; ctx.globalAlpha = 0.3;
    for (let i = 0; i < 4; i++) {
      ctx.beginPath(); ctx.moveTo(cx - 35*s, cy - 22*s + i*12*s); ctx.lineTo(cx + 35*s, cy - 22*s + i*12*s); ctx.stroke();
    }
    // Pen signature
    ctx.globalAlpha = 0.4; ctx.fillStyle = ac;
    ctx.beginPath();
    ctx.moveTo(cx + 10*s, cy + 20*s);
    ctx.quadraticCurveTo(cx + 17*s, cy + 12*s, cx + 24*s, cy + 24*s);
    ctx.quadraticCurveTo(cx + 28*s, cy + 30*s, cx + 20*s, cy + 32*s);
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle = ac; ctx.lineWidth = 2*s;
    ctx.beginPath(); ctx.moveTo(cx + 10*s, cy + 27*s); ctx.lineTo(cx - 2*s, cy + 42*s); ctx.stroke();
    ctx.globalAlpha = 1;
    // Checkmark counter
    ctx.fillStyle = ac; ctx.globalAlpha = 0.3;
    ctx.font = `400 ${10*s}px 'DM Sans', sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('\u2713 signed', cx - 20*s, cy + 35*s);
    ctx.globalAlpha = 1;
  } else if (evType === 'march') {
    // Row of marching people
    const people = [
      { cx: -60, cy: 10, r: 10 },
      { cx: -30, cy: 5, r: 12 },
      { cx: 0, cy: 0, r: 14 },
      { cx: 30, cy: 5, r: 12 },
      { cx: 60, cy: 10, r: 10 },
    ];
    people.forEach((p, i) => {
      const alpha = 0.25 + (2 - Math.abs(i - 2)) * 0.05;
      const col = `rgba(${aRgb},${alpha})`;
      flyerDrawPerson(ctx, cx + p.cx*s, cy + p.cy*s, p.r*s, p.r*1.3*s, p.r*2*s, col);
    });
    // Central sign
    ctx.strokeStyle = `rgba(${aRgb},0.4)`; ctx.lineWidth = 3*s;
    ctx.beginPath(); ctx.moveTo(cx, cy + 14*s); ctx.lineTo(cx - 12*s, cy - 15*s); ctx.stroke();
    ctx.fillStyle = `rgba(${aRgb},0.3)`;
    ctx.fillRect(cx - 19*s, cy - 30*s, 14*s, 16*s);
    // Ground path
    ctx.strokeStyle = `rgba(${aRgb},0.15)`; ctx.lineWidth = 2*s;
    ctx.beginPath(); ctx.moveTo(x + 10*s, cy + 40*s);
    ctx.quadraticCurveTo(cx, cy + 34*s, x + w - 10*s, cy + 38*s); ctx.stroke();
  } else if (evType === 'protest_gathering') {
    // Protesters
    const people = [
      { cx: -40, cy: 0, r: 12 },
      { cx: 0, cy: -8, r: 16 },
      { cx: 40, cy: 0, r: 12 },
    ];
    people.forEach((p, i) => {
      const alpha = i === 1 ? 0.3 : 0.25;
      flyerDrawPerson(ctx, cx + p.cx*s, cy + p.cy*s, p.r*s, p.r*1.5*s, p.r*2*s, `rgba(${aRgb},${alpha})`);
    });
    // Sign
    ctx.strokeStyle = `rgba(${aRgb},0.35)`; ctx.lineWidth = 4*s;
    ctx.beginPath(); ctx.moveTo(cx, cy + 8*s); ctx.lineTo(cx - 12*s, cy - 22*s); ctx.stroke();
    ctx.fillStyle = `rgba(${aRgb},0.25)`;
    ctx.fillRect(cx - 19*s, cy - 36*s, 14*s, 16*s);
  } else {
    // Community: microphone + audience
    ctx.fillStyle = `rgba(${aRgb},0.25)`;
    ctx.fillRect(cx - 12*s, cy - 30*s, 24*s, 55*s);
    ctx.beginPath(); ctx.arc(cx, cy - 34*s, 10*s, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = `rgba(${aRgb},0.1)`;
    ctx.beginPath(); ctx.arc(cx, cy - 34*s, 5*s, 0, Math.PI*2); ctx.fill();
    // Legs
    ctx.strokeStyle = `rgba(${aRgb},0.2)`; ctx.lineWidth = 3*s;
    ctx.beginPath(); ctx.moveTo(cx - 15*s, cy + 25*s); ctx.lineTo(cx - 30*s, cy + 42*s); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx + 15*s, cy + 25*s); ctx.lineTo(cx + 30*s, cy + 42*s); ctx.stroke();
    // Audience
    flyerDrawPerson(ctx, cx - 50*s, cy + 30*s, 8*s, 12*s, 16*s, `rgba(${aRgb},0.15)`);
    flyerDrawPerson(ctx, cx + 50*s, cy + 30*s, 8*s, 12*s, 16*s, `rgba(${aRgb},0.15)`);
    // Notes
    ctx.fillStyle = ac; ctx.globalAlpha = 0.2;
    ctx.font = `${14*s}px serif`; ctx.textAlign = 'center';
    ctx.fillText('\u266A', cx - 35*s, cy - 5*s);
    ctx.font = `${16*s}px serif`;
    ctx.fillText('\u266B', cx + 32*s, cy - 10*s);
    ctx.globalAlpha = 1;
  }
  ctx.textAlign = 'left';
}

// ======= PEOPLE'S VOICE SVG ILLUSTRATIONS (canvas) =======
function drawPeoplesIllus(ctx, x, y, w, h, s, evType) {
  const cx = x + w/2, cy = y + h/2;
  const pColors = ['#E76F51', '#264653', '#2A9D8F', '#E9C46A', '#F4A261'];

  if (evType === 'virtual') {
    // Screen with people inside
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    flyerRoundRect(ctx, cx - 70*s, cy - 32*s, 140*s, 80*s, 8*s); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.fillRect(cx - 60*s, cy - 25*s, 120*s, 62*s);
    // People in video call
    flyerDrawPerson(ctx, cx - 30*s, cy - 8*s, 10*s, 12*s, 16*s, '#264653');
    flyerDrawPerson(ctx, cx, cy - 12*s, 10*s, 12*s, 18*s, '#2A9D8F');
    flyerDrawPerson(ctx, cx + 30*s, cy - 8*s, 10*s, 12*s, 16*s, '#E76F51');
  } else if (evType === 'signature_gathering') {
    // Document with person signing
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    flyerRoundRect(ctx, cx - 55*s, cy - 40*s, 110*s, 90*s, 4*s); ctx.fill();
    ctx.strokeStyle = '#8B6F47'; ctx.lineWidth = 1.5*s; ctx.globalAlpha = 0.4;
    for (let i = 0; i < 4; i++) {
      ctx.beginPath(); ctx.moveTo(cx - 40*s, cy - 20*s + i*12*s); ctx.lineTo(cx + 40*s, cy - 20*s + i*12*s); ctx.stroke();
    }
    ctx.globalAlpha = 1;
    // Person signing
    flyerDrawPerson(ctx, cx - 60*s, cy + 20*s, 12*s, 14*s, 20*s, '#E76F51');
    ctx.strokeStyle = '#E76F51'; ctx.lineWidth = 3*s;
    ctx.beginPath(); ctx.moveTo(cx - 48*s, cy + 22*s); ctx.lineTo(cx - 38*s, cy + 6*s); ctx.stroke();
    // "sign here" text
    ctx.fillStyle = '#8B6F47'; ctx.globalAlpha = 0.5;
    ctx.font = `400 ${11*s}px 'Permanent Marker', cursive`;
    ctx.textAlign = 'center';
    ctx.fillText('sign here \u2192', cx - 10*s, cy + 38*s);
    ctx.globalAlpha = 1;
  } else if (evType === 'march') {
    // Colorful marching people
    const marchers = [
      { cx: -65, cy: 5, r: 12, c: 0 },
      { cx: -30, cy: -2, r: 14, c: 1 },
      { cx: 10, cy: -6, r: 16, c: 2 },
      { cx: 50, cy: -2, r: 14, c: 3 },
      { cx: 85, cy: 5, r: 12, c: 4 },
    ];
    marchers.forEach(m => {
      flyerDrawPerson(ctx, cx + m.cx*s, cy + m.cy*s, m.r*s, m.r*1.3*s, m.r*2.2*s, pColors[m.c]);
    });
    // Signs
    ctx.strokeStyle = '#2A9D8F'; ctx.lineWidth = 4*s;
    ctx.beginPath(); ctx.moveTo(cx + 10*s, cy + 10*s); ctx.lineTo(cx - 2*s, cy - 22*s); ctx.stroke();
    ctx.fillStyle = '#2A9D8F'; ctx.globalAlpha = 0.8;
    ctx.fillRect(cx - 9*s, cy - 36*s, 14*s, 16*s);
    ctx.globalAlpha = 1;
    ctx.strokeStyle = '#E76F51'; ctx.lineWidth = 3*s;
    ctx.beginPath(); ctx.moveTo(cx - 65*s, cy + 17*s); ctx.lineTo(cx - 77*s, cy - 8*s); ctx.stroke();
  } else if (evType === 'protest_gathering') {
    // Protesters with signs
    const ppl = [
      { cx: -55, cy: -2, r: 14, c: 0 },
      { cx: -15, cy: -10, r: 16, c: 1 },
      { cx: 30, cy: -6, r: 15, c: 2 },
      { cx: 72, cy: 0, r: 13, c: 4 },
    ];
    ppl.forEach(p => {
      flyerDrawPerson(ctx, cx + p.cx*s, cy + p.cy*s, p.r*s, p.r*1.3*s, p.r*2.2*s, pColors[p.c]);
      ctx.strokeStyle = pColors[p.c]; ctx.lineWidth = 4*s;
      ctx.beginPath();
      ctx.moveTo(cx + p.cx*s, cy + (p.cy + p.r)*s);
      ctx.lineTo(cx + (p.cx - 13)*s, cy + (p.cy - 18)*s);
      ctx.stroke();
    });
    // Central sign
    ctx.fillStyle = '#264653'; ctx.globalAlpha = 0.7;
    ctx.fillRect(cx - 22*s, cy - 42*s, 14*s, 16*s);
    ctx.globalAlpha = 1;
    // "ENOUGH!" text
    ctx.fillStyle = '#E76F51'; ctx.globalAlpha = 0.4;
    ctx.font = `400 ${10*s}px 'Permanent Marker', cursive`;
    ctx.textAlign = 'center';
    ctx.fillText('ENOUGH!', cx - 10*s, cy + 45*s);
    ctx.globalAlpha = 1;
  } else {
    // Community gathering with music/art
    const community = [
      { cx: -60, cy: 0, r: 14, c: 0 },
      { cx: -20, cy: -8, r: 16, c: 1 },
      { cx: 20, cy: -4, r: 15, c: 2 },
      { cx: 60, cy: -2, r: 14, c: 3 },
      { cx: 95, cy: 4, r: 12, c: 4 },
    ];
    community.forEach(p => {
      flyerDrawPerson(ctx, cx + p.cx*s, cy + p.cy*s, p.r*s, p.r*1.3*s, p.r*2.2*s, pColors[p.c]);
    });
    // Arms up (music)
    ctx.strokeStyle = '#E76F51'; ctx.lineWidth = 4*s;
    ctx.beginPath(); ctx.moveTo(cx - 60*s, cy + 14*s); ctx.lineTo(cx - 72*s, cy - 12*s); ctx.stroke();
    ctx.strokeStyle = '#2A9D8F'; ctx.lineWidth = 4*s;
    ctx.beginPath(); ctx.moveTo(cx + 20*s, cy + 11*s); ctx.lineTo(cx + 32*s, cy - 18*s); ctx.stroke();
    ctx.strokeStyle = '#F4A261'; ctx.lineWidth = 3*s;
    ctx.beginPath(); ctx.moveTo(cx + 95*s, cy + 16*s); ctx.lineTo(cx + 105*s, cy - 8*s); ctx.stroke();
    // Music notes
    ctx.fillStyle = '#E76F51'; ctx.globalAlpha = 0.6;
    ctx.font = `${16*s}px serif`; ctx.textAlign = 'center';
    ctx.fillText('\u266A', cx - 68*s, cy - 20*s);
    ctx.fillStyle = '#2A9D8F'; ctx.globalAlpha = 0.5;
    ctx.font = `${20*s}px serif`;
    ctx.fillText('\u266B', cx + 30*s, cy - 26*s);
    ctx.fillStyle = '#F4A261'; ctx.globalAlpha = 0.6;
    ctx.font = `${14*s}px serif`;
    ctx.fillText('\u266A', cx + 90*s, cy - 16*s);
    ctx.globalAlpha = 1;
  }
  ctx.textAlign = 'left';
}

// ======= FLYER PREVIEW & UPLOAD FLOW =======
async function showFlyerPreview(event, templateIndex) {
  if (!event) return;
  const templateKey = flyerTemplates[templateIndex].key;

  // Ensure fonts are ready
  await document.fonts.ready;

  // Render full-size canvas
  const canvas = document.createElement('canvas');
  drawFlyerTemplate(canvas, event, templateIndex, false);
  const dataUrl = canvas.toDataURL('image/png');

  const isOwner = DemoSession.role === 'admin' ||
    (DemoSession.role === 'organizer' && event.org_id === DemoSession.orgId);

  const previewHTML = `
    <div class="modal-overlay open" id="flyerPreviewModal" onclick="if(event.target===this){this.remove();document.body.style.overflow='hidden';}">
      <div class="modal-box" style="max-width:560px;">
        <div class="modal-header">
          <h2>Flyer Preview</h2>
          <button class="modal-close" onclick="document.getElementById('flyerPreviewModal').remove();">&#x2715;</button>
        </div>
        <div class="modal-body" style="text-align:center;">
          <img src="${dataUrl}" style="max-width:100%;border-radius:var(--radius-sm);border:1px solid var(--border);" id="flyerPreviewImg">
          <div class="flyer-actions" style="margin-top:16px;">
            ${isOwner ? `<button class="btn btn-primary btn-sm" onclick="uploadFlyer(${event.id}, '${templateKey}')">Upload &amp; Save</button>` : ''}
            <button class="btn btn-secondary btn-sm" onclick="downloadFlyerFromPreview()">Download to Device</button>
          </div>
          ${isOwner ? `<p class="auto-delete-notice">This flyer will be automatically deleted ${AppConfig.flyerAutoDeleteDays} days after your event ends.</p>` : ''}
        </div>
      </div>
    </div>
  `;
  document.body.insertAdjacentHTML('beforeend', previewHTML);
}

function downloadFlyerFromPreview() {
  const img = document.getElementById('flyerPreviewImg');
  if (!img) return;
  const a = document.createElement('a');
  a.href = img.src;
  a.download = (_currentDetailEvent ? slugify(_currentDetailEvent.title) : 'flyer') + '-flyer.png';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  showToast('Flyer downloaded!');
}

async function uploadFlyer(eventId, templateName) {
  const img = document.getElementById('flyerPreviewImg');
  if (!img) return;

  try {
    // Convert data URL to blob
    const res = await fetch(img.src);
    const blob = await res.blob();

    const formData = new FormData();
    formData.append('flyer', blob, 'flyer.png');
    formData.append('template_name', templateName);

    const uploadRes = await fetch(`/api/events/${eventId}/flyer`, {
      method: 'POST',
      body: formData,
    });
    if (!uploadRes.ok) {
      const err = await uploadRes.json().catch(() => ({}));
      throw new Error(err.error || 'Upload failed');
    }

    showToast('Flyer saved!');

    // Close modals
    const previewModal = document.getElementById('flyerPreviewModal');
    if (previewModal) previewModal.remove();
    const pickerModal = document.getElementById('flyerPickerModal');
    if (pickerModal) pickerModal.remove();

    // Refresh event detail
    closeEventDetailModal();
    cachedEvents = [];
    await openEventDetail(eventId);
  } catch (e) {
    showToast('Error uploading flyer: ' + e.message);
  }
}

async function deleteGeneratedFlyer(eventId) {
  showConfirm(
    'Delete Flyer?',
    'This will permanently remove the generated flyer for this event.',
    'Delete Flyer',
    async () => {
      try {
        const res = await fetch(`/api/events/${eventId}/flyer`, { method: 'DELETE' });
        if (!res.ok) throw new Error('Delete failed');
        showToast('Flyer deleted');
        closeEventDetailModal();
        cachedEvents = [];
        await openEventDetail(eventId);
      } catch (e) {
        showToast('Error deleting flyer');
      }
    }
  );
}

// ======= ADMIN MESSAGES =======
async function loadAdminMessages() {
  try {
    cachedAdminMessages = await api('/messages?view=admin');
  } catch (e) {
    console.warn('Failed to load admin messages:', e.message);
    cachedAdminMessages = [];
  }
}

async function renderAdminMessages() {
  const listContainer = document.getElementById('adminMessagesList');
  const threadContainer = document.getElementById('adminMessagesThread');

  if (adminViewingThread !== null) {
    listContainer.style.display = 'none';
    threadContainer.style.display = 'block';
    await renderAdminThread(adminViewingThread);
    return;
  }

  listContainer.style.display = 'block';
  threadContainer.style.display = 'none';

  await loadAdminMessages();
  let topics = cachedAdminMessages;
  if (!showAdminArchivedMessages) {
    topics = topics.filter(m => !m.archived);
  }

  listContainer.innerHTML = topics.map(m => {
    const tag = (m.message_type === 'direct')
      ? `<span class="msg-tag msg-tag-direct">Direct: ${escHtml(m.target_user_name || 'Unknown')}</span>`
      : `<span class="msg-tag msg-tag-org">Org: ${escHtml(m.org_name || 'Unknown')}</span>`;
    return `
      <div class="msg-list-item${m.has_unread ? ' msg-unread' : ''}${m.archived ? ' archived-row' : ''}" onclick="viewAdminThread(${m.id})">
        ${m.has_unread ? '<span class="new-indicator">New</span>' : ''}
        ${m.archived ? '<span class="event-list-status status-archived">Archived</span>' : ''}
        ${tag}
        <div class="msg-topic">${escHtml(m.topic)}</div>
        <div class="msg-meta">
          <div>${formatTimestamp(m.created_at)}</div>
        </div>
        ${m.archived
          ? `<button class="btn btn-ghost btn-xs" onclick="event.stopPropagation(); unarchiveAdminTopic(${m.id})" title="Unarchive">Unarchive</button>`
          : `<button class="btn btn-ghost btn-xs" onclick="event.stopPropagation(); archiveAdminTopic(${m.id})" title="Archive">Archive</button>`
        }
      </div>
    `;
  }).join('');

  if (topics.length === 0) {
    listContainer.innerHTML = '<div class="empty-state"><div class="empty-state-icon">&#x1F4AC;</div><h3>No admin messages</h3><p>All organization and direct messages will appear here.</p></div>';
  }

  document.getElementById('adminMsgArchiveToggle').textContent = showAdminArchivedMessages ? 'Hide Archived' : 'Show Archived';
}

async function viewAdminThread(id) {
  adminViewingThread = id;
  await renderAdminMessages();
  cachedAdminMessages = [];
  updateAdminMessagesBadge();
}

async function renderAdminThread(id) {
  let thread;
  try {
    thread = await api('/messages/' + id);
  } catch (e) {
    thread = cachedAdminMessages.find(m => m.id === id);
  }
  if (!thread) return;

  const replies = thread.replies || [];
  const label = thread.message_type === 'direct'
    ? (thread.target_user_name || 'Direct Message')
    : (thread.org_name || 'Unknown');

  let readReceiptsHtml = '';
  if (thread.read_receipts && thread.read_receipts.length > 0) {
    const readCount = thread.read_receipts.filter(r => r.has_read).length;
    const totalCount = thread.read_receipts.length;
    readReceiptsHtml = `
      <div class="read-receipts">
        <div class="read-receipts-header">Read by ${readCount} of ${totalCount} members</div>
        ${thread.read_receipts.map(r => `
          <div class="read-receipt-item ${r.has_read ? 'read' : 'unread'}">
            ${r.has_read ? '&#x2713;' : '&#x25CB;'} ${escHtml(r.display_name)} (${escHtml(r.email)})
          </div>
        `).join('')}
      </div>
    `;
  }

  const threadContainer = document.getElementById('adminMessagesThread');
  threadContainer.innerHTML = `
    <div style="margin-bottom: 20px;">
      <button class="btn btn-ghost btn-sm" onclick="adminViewingThread=null; renderAdminMessages();">&larr; Back to Admin Messages</button>
      <h3 style="font-size: 18px; font-weight: 700; margin-top: 12px;">${escHtml(thread.topic)}</h3>
      <div style="font-size:13px;color:var(--text-dim);margin-top:4px;">
        ${thread.message_type === 'direct'
          ? `<span class="msg-tag msg-tag-direct">Direct: ${escHtml(label)}</span>`
          : `<span class="msg-tag msg-tag-org">Org: ${escHtml(label)}</span>`
        }
      </div>
    </div>
    <div style="display:flex;gap:8px;margin-bottom:20px;">
      <textarea class="form-textarea" id="adminReplyText" rows="2" placeholder="Type your reply..." style="min-height:60px;flex:1;"></textarea>
      <div style="display:flex;flex-direction:column;gap:4px;">
        <button class="btn btn-primary btn-sm" onclick="sendAdminReply(${id})">Send</button>
        <button class="btn btn-ghost btn-sm" onclick="adminViewingThread=null; renderAdminMessages();">Cancel</button>
      </div>
    </div>
    ${readReceiptsHtml}
    <div>
      ${replies.slice().reverse().map(msg => {
        let senderLabel = '';
        if (msg.from_type === 'admin') {
          senderLabel = 'Site Admin';
        } else {
          senderLabel = escHtml(thread.org_name || 'Org');
        }
        if (msg.user_email) {
          senderLabel += ` (${escHtml(msg.user_email)})`;
        }
        const timestamp = formatTimestamp(msg.created_at);
        return `
          <div class="msg-bubble ${msg.from_type === 'org' ? 'from-org' : 'from-admin'}">
            ${escHtml(msg.text)}
            <div class="msg-bubble-meta">${senderLabel} · ${timestamp}</div>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

async function sendAdminReply(messageId) {
  const text = document.getElementById('adminReplyText').value.trim();
  if (!text) return;

  try {
    await api('/messages/' + messageId, {
      method: 'POST',
      body: JSON.stringify({ text }),
    });
    showToast('Reply sent!');
    await renderAdminThread(messageId);
    cachedAdminMessages = [];
    updateAdminMessagesBadge();
  } catch (e) {
    showToast('Error sending reply');
  }
}

function toggleAdminArchivedMessages() {
  showAdminArchivedMessages = !showAdminArchivedMessages;
  renderAdminMessages();
}

function archiveAdminTopic(id) {
  showConfirm(
    'Archive Topic?',
    `This will hide the topic from the admin message list.`,
    'Archive Topic',
    async () => {
      try {
        await api('/messages/' + id, {
          method: 'PUT',
          body: JSON.stringify({ archived: true }),
        });
        showToast('Topic archived');
        cachedAdminMessages = [];
        renderAdminMessages();
      } catch (e) {
        showToast('Error archiving topic');
      }
    }
  );
}

async function unarchiveAdminTopic(id) {
  try {
    await api('/messages/' + id, {
      method: 'PUT',
      body: JSON.stringify({ archived: false }),
    });
    showToast('Topic restored');
    cachedAdminMessages = [];
    renderAdminMessages();
  } catch (e) {
    showToast('Error restoring topic');
  }
}

// ======= ADMIN NEW MESSAGE COMPOSE =======
async function openAdminNewMessageModal() {
  adminMsgRecipientType = 'org';
  document.getElementById('adminNewMsgTopic').value = '';
  document.getElementById('adminNewMsgText').value = '';
  document.getElementById('adminMsgUserId').value = '';
  document.getElementById('adminMsgUserSearch').value = '';
  document.getElementById('adminMsgUserDropdown').classList.remove('open');

  // Populate org dropdown
  if (cachedOrgs.length === 0) await loadOrgs();
  const orgSelect = document.getElementById('adminMsgOrgSelect');
  orgSelect.innerHTML = '<option value="">-- Select Organization --</option>' +
    cachedOrgs.map(o => `<option value="${o.id}">${escHtml(o.name)}</option>`).join('');

  setAdminMsgRecipientType('org');
  openModal('adminNewMessageModal');
}

function setAdminMsgRecipientType(type) {
  adminMsgRecipientType = type;
  const orgBtn = document.getElementById('adminMsgToOrg');
  const userBtn = document.getElementById('adminMsgToUser');
  const orgSelect = document.getElementById('adminMsgOrgSelect');
  const userWrap = document.getElementById('adminMsgUserSearchWrap');

  orgBtn.className = type === 'org' ? 'btn btn-sm btn-primary' : 'btn btn-sm btn-secondary';
  userBtn.className = type === 'user' ? 'btn btn-sm btn-primary' : 'btn btn-sm btn-secondary';
  orgSelect.style.display = type === 'org' ? '' : 'none';
  userWrap.style.display = type === 'user' ? '' : 'none';
}

async function filterAdminMsgUsers() {
  const query = document.getElementById('adminMsgUserSearch').value.trim().toLowerCase();
  const dropdown = document.getElementById('adminMsgUserDropdown');

  if (query.length < 2) {
    dropdown.classList.remove('open');
    return;
  }

  if (cachedUsers.length === 0) {
    try { cachedUsers = await api('/users'); } catch (e) { cachedUsers = []; }
  }

  const filtered = cachedUsers.filter(u =>
    (u.display_name && u.display_name.toLowerCase().includes(query)) ||
    (u.email && u.email.toLowerCase().includes(query))
  ).slice(0, 10);

  if (filtered.length === 0) {
    dropdown.innerHTML = '<div class="autocomplete-item" style="color:var(--text-dim);">No users found</div>';
  } else {
    dropdown.innerHTML = filtered.map(u => {
      const safeName = escHtml(u.display_name).replace(/'/g, '&#39;');
      return `
        <div class="autocomplete-item" onclick="selectAdminMsgUser(${u.id}, '${safeName}')">
          ${escHtml(u.display_name)}
          <div class="autocomplete-email">${escHtml(u.email)}</div>
        </div>
      `;
    }).join('');
  }
  dropdown.classList.add('open');
}

function selectAdminMsgUser(userId, name) {
  document.getElementById('adminMsgUserId').value = userId;
  document.getElementById('adminMsgUserSearch').value = name;
  document.getElementById('adminMsgUserDropdown').classList.remove('open');
}

async function submitAdminNewMessage() {
  const topic = document.getElementById('adminNewMsgTopic').value.trim();
  const text = document.getElementById('adminNewMsgText').value.trim();
  if (!topic || !text) {
    showToast('Please fill in topic and message');
    return;
  }

  const payload = { topic, text };

  if (adminMsgRecipientType === 'org') {
    const orgId = document.getElementById('adminMsgOrgSelect').value;
    if (!orgId) {
      showToast('Please select an organization');
      return;
    }
    payload.org_id = parseInt(orgId);
    payload.message_type = 'org';
  } else {
    const userId = document.getElementById('adminMsgUserId').value;
    if (!userId) {
      showToast('Please select a user');
      return;
    }
    payload.user_id = parseInt(userId);
    payload.message_type = 'direct';
  }

  try {
    await api('/messages', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    closeModal('adminNewMessageModal');
    showToast('Message sent!');
    cachedAdminMessages = [];
    cachedMessages = [];
    if (currentSection === 'adminMessages') renderAdminMessages();
    updateAdminMessagesBadge();
    updateMessagesBadge();
  } catch (e) {
    showToast('Error sending message');
  }
}

// ======= ADMIN MESSAGES BADGE =======
async function updateAdminMessagesBadge() {
  await loadAdminMessages();
  const count = cachedAdminMessages.filter(m => !m.archived && m.has_unread).length;
  const badge = document.getElementById('adminMsgBadge');
  if (badge) {
    badge.textContent = count;
    badge.style.display = count > 0 ? '' : 'none';
  }
}

// ======= ORGANIZER SEND AS DROPDOWN =======
async function populateSendAsDropdown() {
  const group = document.getElementById('sendAsGroup');
  const select = document.getElementById('msgSendAs');

  // Only show Send As for organizer (not admin using "Message Org" flow)
  if (DemoSession.role !== 'organizer' && DemoSession.role !== 'admin') {
    group.style.display = 'none';
    return;
  }
  if (pendingMessageOrgId) {
    group.style.display = 'none';
    return;
  }

  try {
    const myOrgs = await api('/users/my-orgs');
    const options = myOrgs.map(o => `<option value="${o.id}">${escHtml(o.name)}</option>`).join('');
    select.innerHTML = options + '<option value="personal">Personal</option>';
    group.style.display = '';
  } catch (e) {
    // Fallback: use primary org
    if (DemoSession.orgId && DemoSession.orgName) {
      select.innerHTML = `<option value="${DemoSession.orgId}">${escHtml(DemoSession.orgName)}</option><option value="personal">Personal</option>`;
      group.style.display = '';
    } else {
      group.style.display = 'none';
    }
  }
}

// ======= ADMIN DRAWER =======
function toggleAdminDrawer() {
  document.getElementById('adminDrawer').classList.toggle('open');
  document.getElementById('adminDrawerOverlay').classList.toggle('open');
}

function closeAdminDrawer() {
  document.getElementById('adminDrawer').classList.remove('open');
  document.getElementById('adminDrawerOverlay').classList.remove('open');
}

function navigateFromDrawer(section) {
  closeAdminDrawer();
  showSection(section);
}

// ======= SPONSORING ORG DROPDOWN =======
async function populateSponsorOrg(preselectedOrgId) {
  const select = document.getElementById('sponsorOrg');
  if (!select) return;

  select.innerHTML = '';

  // Fetch user's org memberships
  let myOrgs = [];
  try {
    myOrgs = await api('/users/my-orgs');
  } catch (e) {
    // fallback: use DemoSession org
    if (DemoSession.orgId && DemoSession.orgName) {
      myOrgs = [{ id: DemoSession.orgId, name: DemoSession.orgName }];
    }
  }

  const isAdmin = DemoSession.role === 'admin';
  const perm = AppConfig.eventOrganizerPermission;

  // For admin: add admin persona option
  if (isAdmin) {
    const opt = document.createElement('option');
    opt.value = 'admin_persona';
    opt.textContent = AppConfig.siteName + ' Admin';
    select.appendChild(opt);
  }

  // Add user's orgs
  myOrgs.forEach(org => {
    const opt = document.createElement('option');
    opt.value = org.id;
    opt.textContent = org.name;
    select.appendChild(opt);
  });

  // Add "Other" option based on permission level
  const showOther = isAdmin || perm === 'approved_list' || perm === 'any_org';
  if (showOther) {
    const opt = document.createElement('option');
    opt.value = 'other';
    opt.textContent = '— Other —';
    select.appendChild(opt);
  }

  // Pre-select
  if (preselectedOrgId !== undefined && preselectedOrgId !== null) {
    const matchOption = Array.from(select.options).find(o => o.value == preselectedOrgId);
    if (matchOption) {
      select.value = preselectedOrgId;
    } else if (showOther) {
      select.value = 'other';
      // Pre-populate the all-orgs dropdown with this org
      await onSponsorOrgChange();
      const allOrgsSelect = document.getElementById('sponsorOrgAllOrgs');
      if (allOrgsSelect) {
        const allMatch = Array.from(allOrgsSelect.options).find(o => o.value == preselectedOrgId);
        if (allMatch) allOrgsSelect.value = preselectedOrgId;
      }
      return;
    }
  } else if (!isAdmin && myOrgs.length > 0) {
    select.value = myOrgs[0].id;
  }

  // Hide the "other" group initially
  const otherGroup = document.getElementById('sponsorOrgOtherGroup');
  if (otherGroup) otherGroup.style.display = 'none';
}

async function onSponsorOrgChange() {
  const select = document.getElementById('sponsorOrg');
  const otherGroup = document.getElementById('sponsorOrgOtherGroup');
  if (!select || !otherGroup) return;

  if (select.value === 'other') {
    otherGroup.style.display = 'block';

    // Populate all-orgs dropdown
    if (cachedOrgs.length === 0) await loadOrgs();
    const allOrgsSelect = document.getElementById('sponsorOrgAllOrgs');
    if (allOrgsSelect && allOrgsSelect.options.length <= 1) {
      cachedOrgs.forEach(org => {
        const opt = document.createElement('option');
        opt.value = org.id;
        opt.textContent = org.name;
        allOrgsSelect.appendChild(opt);
      });
    }

    // Show/hide custom text input based on permission level
    const customInput = document.getElementById('sponsorOrgCustom');
    const isAdmin = DemoSession.role === 'admin';
    const perm = AppConfig.eventOrganizerPermission;
    if (customInput) {
      customInput.style.display = (perm === 'any_org' || isAdmin) ? 'block' : 'none';
    }
  } else {
    otherGroup.style.display = 'none';
  }
}

function onSponsorOrgAllOrgsChange() {
  const allOrgsSelect = document.getElementById('sponsorOrgAllOrgs');
  const customInput = document.getElementById('sponsorOrgCustom');
  if (allOrgsSelect && allOrgsSelect.value && customInput) {
    customInput.value = '';
  }
}

function getSelectedOrgId() {
  const select = document.getElementById('sponsorOrg');
  if (!select) return null;

  const val = select.value;
  if (val === 'admin_persona') return null;
  if (val === 'other') {
    const allOrgsSelect = document.getElementById('sponsorOrgAllOrgs');
    if (allOrgsSelect && allOrgsSelect.value) return parseInt(allOrgsSelect.value);
    // Custom text — no org_id
    return null;
  }
  if (val && !isNaN(val)) return parseInt(val);
  return null;
}

// ======= EVENT SETTINGS =======
function renderEventSettings() {
  const perm = AppConfig.eventOrganizerPermission || 'own_org_only';
  const radios = document.querySelectorAll('input[name="orgPerm"]');
  radios.forEach(r => {
    r.checked = r.value === perm;
  });
}

async function saveEventSettings() {
  const selected = document.querySelector('input[name="orgPerm"]:checked');
  if (!selected) return;

  try {
    await api('/config', {
      method: 'PUT',
      body: JSON.stringify({ event_organizer_permission: selected.value }),
    });
    AppConfig.eventOrganizerPermission = selected.value;
    showToast('Event settings saved!');
  } catch (e) {
    showToast('Error saving settings');
  }
}

// ======= HOMEPAGE SETTINGS =======
function renderHomepageSettings() {
  document.getElementById('hpSiteName').value = AppConfig.siteName;
  document.getElementById('hpSiteRegion').value = AppConfig.siteRegion;
  document.getElementById('hpHeroLine1').value = AppConfig.heroLine1;
  document.getElementById('hpHeroLine2').value = AppConfig.heroLine2;
  document.getElementById('hpHeroSubtitle').value = AppConfig.heroSubtitle;
  document.getElementById('hpShowEventCount').checked = AppConfig.showEventCount === 'yes';
  document.getElementById('hpShowOrgCount').checked = AppConfig.showOrgCount === 'yes';
  document.getElementById('hpShowMobilizedCount').checked = AppConfig.showMobilizedCount === 'yes';
  document.getElementById('hpShowGithubLink').checked = AppConfig.showGithubLink === 'yes';
  document.getElementById('hpPurposeText').value = AppConfig.purposeText;
  document.getElementById('hpPrivacyPolicy').value = AppConfig.privacyPolicy;
  document.getElementById('hpTermsOfService').value = AppConfig.termsOfService;
  document.getElementById('hpCopyrightText').value = AppConfig.copyrightText;
  initHomepageSettingsTracking();

  // Show/hide demo-only cards based on app mode
  const isDemo = typeof AppMode !== 'undefined' && AppMode === 'demo';
  const demoCard = document.getElementById('demoDisableCard');
  if (demoCard) demoCard.style.display = isDemo ? '' : 'none';
  const reseedCard = document.getElementById('demoReseedCard');
  if (reseedCard) reseedCard.style.display = isDemo ? '' : 'none';
}

async function saveHomepageSettings() {
  const fields = [
    { key: 'site_name', prop: 'siteName', label: 'Site Name', el: 'hpSiteName' },
    { key: 'site_region', prop: 'siteRegion', label: 'Site Region', el: 'hpSiteRegion' },
    { key: 'hero_line_1', prop: 'heroLine1', label: 'Hero Line 1', el: 'hpHeroLine1' },
    { key: 'hero_line_2', prop: 'heroLine2', label: 'Hero Line 2', el: 'hpHeroLine2' },
    { key: 'hero_subtitle', prop: 'heroSubtitle', label: 'Hero Subtitle', el: 'hpHeroSubtitle' },
    { key: 'show_event_count', prop: 'showEventCount', label: 'Show Event Count', el: 'hpShowEventCount', checkbox: true },
    { key: 'show_org_count', prop: 'showOrgCount', label: 'Show Org Count', el: 'hpShowOrgCount', checkbox: true },
    { key: 'show_people_mobilized', prop: 'showMobilizedCount', label: 'Show People Mobilized', el: 'hpShowMobilizedCount', checkbox: true },
    { key: 'show_github_link', prop: 'showGithubLink', label: 'Show GitHub Link', el: 'hpShowGithubLink', checkbox: true },
    { key: 'purpose_text', prop: 'purposeText', label: 'Purpose Text', el: 'hpPurposeText', html: true },
    { key: 'privacy_policy', prop: 'privacyPolicy', label: 'Privacy Policy', el: 'hpPrivacyPolicy', html: true },
    { key: 'terms_of_service', prop: 'termsOfService', label: 'Terms of Service', el: 'hpTermsOfService', html: true },
    { key: 'copyright_text', prop: 'copyrightText', label: 'Copyright Text', el: 'hpCopyrightText' },
  ];

  const changes = {};
  const changesList = [];

  for (const f of fields) {
    const formVal = f.checkbox
      ? (document.getElementById(f.el).checked ? 'yes' : 'no')
      : document.getElementById(f.el).value;
    const oldVal = AppConfig[f.prop];
    if (formVal !== oldVal) {
      changes[f.key] = formVal;
      if (f.html) {
        changesList.push(`<li><strong>${f.label}:</strong> <em style="color:var(--amber);">(modified)</em></li>`);
      } else {
        const oldDisplay = f.checkbox ? oldVal : (oldVal.length > 40 ? oldVal.substring(0, 40) + '...' : oldVal);
        const newDisplay = f.checkbox ? formVal : (formVal.length > 40 ? formVal.substring(0, 40) + '...' : formVal);
        changesList.push(`<li><strong>${f.label}:</strong> "${oldDisplay}" → "${newDisplay}"</li>`);
      }
    }
  }

  if (changesList.length === 0) {
    showToast('No changes to save');
    return;
  }

  const msgHtml = `<p style="margin-bottom:8px;">Save these changes?</p><ul style="text-align:left;font-size:13px;line-height:1.6;margin:0;padding-left:18px;">${changesList.join('')}</ul>`;

  document.getElementById('confirmTitle').textContent = 'Update Homepage Settings?';
  document.getElementById('confirmMessage').innerHTML = msgHtml;
  const btn = document.getElementById('confirmBtn');
  btn.textContent = 'Save';
  btn.className = 'btn btn-primary btn-sm';
  btn.onclick = async () => {
    closeConfirm();
    try {
      await api('/config', {
        method: 'PUT',
        body: JSON.stringify(changes),
      });
      for (const f of fields) {
        if (changes[f.key] !== undefined) {
          AppConfig[f.prop] = changes[f.key];
        }
      }
      applyConfig();
      showToast('Homepage settings saved!');
      checkHomepageSettingsChanged();
    } catch (e) {
      showToast('Error saving settings');
    }
  };
  document.getElementById('confirmDialog').classList.add('open');
}

function getHomepageFields() {
  return [
    { key: 'site_name', prop: 'siteName', el: 'hpSiteName', section: 'site-identity' },
    { key: 'site_region', prop: 'siteRegion', el: 'hpSiteRegion', section: 'site-identity' },
    { key: 'hero_line_1', prop: 'heroLine1', el: 'hpHeroLine1', section: 'hero-heading' },
    { key: 'hero_line_2', prop: 'heroLine2', el: 'hpHeroLine2', section: 'hero-heading' },
    { key: 'hero_subtitle', prop: 'heroSubtitle', el: 'hpHeroSubtitle', section: 'hero-heading' },
    { key: 'show_event_count', prop: 'showEventCount', el: 'hpShowEventCount', checkbox: true, section: 'hero-stats' },
    { key: 'show_org_count', prop: 'showOrgCount', el: 'hpShowOrgCount', checkbox: true, section: 'hero-stats' },
    { key: 'show_people_mobilized', prop: 'showMobilizedCount', el: 'hpShowMobilizedCount', checkbox: true, section: 'hero-stats' },
    { key: 'show_github_link', prop: 'showGithubLink', el: 'hpShowGithubLink', checkbox: true, section: 'footer-links' },
    { key: 'purpose_text', prop: 'purposeText', el: 'hpPurposeText', section: 'nav-purpose' },
    { key: 'privacy_policy', prop: 'privacyPolicy', el: 'hpPrivacyPolicy', section: 'footer-privacy' },
    { key: 'terms_of_service', prop: 'termsOfService', el: 'hpTermsOfService', section: 'footer-terms' },
    { key: 'copyright_text', prop: 'copyrightText', el: 'hpCopyrightText', section: 'footer-copyright' },
  ];
}

function checkHomepageSettingsChanged() {
  const fields = getHomepageFields();
  let hasChanges = false;
  for (const f of fields) {
    const formVal = f.checkbox
      ? (document.getElementById(f.el).checked ? 'yes' : 'no')
      : document.getElementById(f.el).value;
    if (formVal !== AppConfig[f.prop]) {
      hasChanges = true;
      break;
    }
  }
  const btn = document.getElementById('hpPreviewBtn');
  if (btn) btn.disabled = !hasChanges;
}

function initHomepageSettingsTracking() {
  const fields = getHomepageFields();
  const ids = fields.map(f => f.el);
  for (const id of ids) {
    const el = document.getElementById(id);
    if (!el) continue;
    el.addEventListener('input', checkHomepageSettingsChanged);
    el.addEventListener('change', checkHomepageSettingsChanged);
  }
  checkHomepageSettingsChanged();
}

function previewHomepageChanges() {
  const fields = getHomepageFields();
  const changedSections = new Set();
  const formValues = {};

  for (const f of fields) {
    const formVal = f.checkbox
      ? (document.getElementById(f.el).checked ? 'yes' : 'no')
      : document.getElementById(f.el).value;
    formValues[f.prop] = formVal;
    if (formVal !== AppConfig[f.prop]) {
      changedSections.add(f.section);
    }
  }

  // Map sections to modal triggers
  if (changedSections.has('nav-purpose')) changedSections.add('modal-purpose');
  if (changedSections.has('footer-privacy')) changedSections.add('modal-privacy');
  if (changedSections.has('footer-terms')) changedSections.add('modal-terms');

  const heroLine1 = formValues.heroLine1 || '';
  const heroLine2 = formValues.heroLine2 || '';
  const heroSubtitle = formValues.heroSubtitle || '';
  const showEventCount = formValues.showEventCount === 'yes';
  const showOrgCount = formValues.showOrgCount === 'yes';
  const showMobilized = formValues.showMobilizedCount === 'yes';
  const showGithub = formValues.showGithubLink === 'yes';
  const copyrightText = formValues.copyrightText || '';
  const purposeText = formValues.purposeText || '';
  const privacyPolicy = formValues.privacyPolicy || '';
  const termsOfService = formValues.termsOfService || '';

  const siteRegion = formValues.siteRegion || '';
  const siteName = formValues.siteName || 'Resist Events';
  const logoHtml = siteRegion
    ? `<span class="highlight">${siteRegion}</span> Resist Events`
    : siteName;

  function sectionClass(name) {
    return changedSections.has(name) ? 'preview-section preview-active' : 'preview-section preview-blurred';
  }

  function arrow(name) {
    if (!changedSections.has(name)) return '';
    return '<span class="preview-arrow">&darr;</span>';
  }

  function arrowLeft(name) {
    if (!changedSections.has(name)) return '';
    return '<span class="preview-arrow preview-arrow-left">&rarr;</span>';
  }

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Preview — Homepage Settings</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Libre+Franklin:wght@300;400;500;600;700;800;900&family=Source+Serif+4:ital,wght@0,400;0,600;0,700;1,400&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/css/styles.css">
<style>
  .preview-section { transition: filter 0.3s ease; position: relative; }
  .preview-blurred { filter: blur(3px); pointer-events: none; user-select: none; }
  .preview-active { filter: none; pointer-events: auto; }
  .preview-static-blur { filter: blur(3px); pointer-events: none; user-select: none; }
  .preview-arrow {
    display: inline-block; color: var(--amber, #f5a623); font-size: 22px;
    animation: preview-bounce 1s ease-in-out infinite;
    margin: 0 6px; vertical-align: middle; line-height: 1;
  }
  .preview-arrow-left { font-size: 20px; }
  @keyframes preview-bounce {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(4px); }
  }
  .preview-notice {
    position: fixed; top: 16px; right: 16px; z-index: 9999;
    background: var(--card-bg, #1a1a2e); color: var(--text, #e0e0e0);
    border: 1px solid var(--amber, #f5a623); border-radius: 8px;
    padding: 14px 18px; max-width: 340px; font-size: 13px; line-height: 1.5;
    box-shadow: 0 4px 20px rgba(0,0,0,0.4);
  }
  .preview-notice strong { color: var(--amber, #f5a623); }
  .preview-notice-close {
    position: absolute; top: 6px; right: 10px; background: none; border: none;
    color: var(--text-muted, #999); cursor: pointer; font-size: 16px; line-height: 1;
  }
  .preview-notice-close:hover { color: var(--text, #e0e0e0); }
  .modal-overlay { display: none; }
  .modal-overlay.open { display: flex; }
</style>
</head>
<body>
<!-- Floating notice -->
<div class="preview-notice" id="previewNotice">
  <button class="preview-notice-close" onclick="document.getElementById('previewNotice').style.display='none'">&times;</button>
  <strong>Preview Mode</strong><br>
  This is a static preview. Save changes on the previous page for them to take effect.
</div>

<!-- Header -->
<header class="site-header ${changedSections.has('site-identity') ? sectionClass('site-identity') : 'preview-static-blur'}">
  <div class="header-inner">
    <a href="#" class="site-logo" onclick="return false;">
      <div class="logo-icon">R</div>
      <span class="logo-text">${logoHtml}</span>
    </a>
  </div>
</header>

<!-- Nav -->
<nav class="nav-bar">
  <div class="nav-inner" style="display:flex;align-items:center;">
    <span class="preview-static-blur"><button class="nav-btn active">Home</button></span>
    <span class="${sectionClass('nav-purpose')}" style="display:inline-flex;align-items:center;">
      ${arrowLeft('nav-purpose')}
      <button class="nav-btn" ${changedSections.has('modal-purpose') ? 'onclick="document.getElementById(\'pvPurposeModal\').classList.add(\'open\')"' : ''}>Our Purpose</button>
    </span>
    <span class="preview-static-blur"><button class="nav-btn">Today's Events</button></span>
    <span class="preview-static-blur"><button class="nav-btn">Full Calendar</button></span>
    <span class="preview-static-blur"><button class="nav-btn">Organizations</button></span>
  </div>
</nav>

<!-- Main -->
<main class="main-content">
  <div class="section-panel active">
    <div class="hero-section fade-in">
      <!-- Hero heading -->
      <div class="${sectionClass('hero-heading')}">
        ${arrow('hero-heading')}
        <h1>${heroLine1}<br><span class="accent">${heroLine2}</span></h1>
        <p class="hero-subtitle">${heroSubtitle}</p>
      </div>
      <!-- Hero stats (grouped — unblur all if any stat toggle changed) -->
      <div class="${sectionClass('hero-stats')}">
        ${arrow('hero-stats')}
        <div class="hero-stats">
          ${showEventCount ? '<div class="hero-stat"><div class="hero-stat-num">12</div><div class="hero-stat-label">Upcoming Events</div></div>' : ''}
          ${showOrgCount ? '<div class="hero-stat"><div class="hero-stat-num">8</div><div class="hero-stat-label">Organizations</div></div>' : ''}
          ${showMobilized ? '<div class="hero-stat"><div class="hero-stat-num">--</div><div class="hero-stat-label">People Mobilized</div></div>' : ''}
        </div>
      </div>
    </div>

    <!-- Upcoming events section (always blurred — not configurable) -->
    <div class="preview-static-blur">
      <h2 class="section-title" style="margin-top: 48px;">Upcoming Events</h2>
      <p class="section-subtitle">Next few events across all organizations</p>
      <div class="events-grid">
        <div class="event-card" style="min-height:160px;">
          <div style="padding:20px;color:var(--text-dim);font-style:italic;text-align:center;">Event placeholder</div>
        </div>
        <div class="event-card" style="min-height:160px;">
          <div style="padding:20px;color:var(--text-dim);font-style:italic;text-align:center;">Event placeholder</div>
        </div>
        <div class="event-card" style="min-height:160px;">
          <div style="padding:20px;color:var(--text-dim);font-style:italic;text-align:center;">Event placeholder</div>
        </div>
      </div>
    </div>
  </div>
</main>

<!-- Footer -->
<footer class="site-footer">
  <div class="footer-inner">
    <div class="${sectionClass('footer-copyright')}">
      ${arrow('footer-copyright')}
      <p>&copy; ${copyrightText}</p>
    </div>
    <div class="footer-links" style="display:flex;align-items:center;gap:0;flex-wrap:wrap;">
      <span class="${sectionClass('footer-privacy')}" style="display:inline-flex;align-items:center;">
        ${arrowLeft('footer-privacy')}
        <a href="#" ${changedSections.has('modal-privacy') ? 'onclick="document.getElementById(\'pvPrivacyModal\').classList.add(\'open\'); return false;"' : 'onclick="return false;"'}>Privacy Policy</a>
      </span>
      <span class="footer-sep">|</span>
      <span class="${sectionClass('footer-terms')}" style="display:inline-flex;align-items:center;">
        ${arrowLeft('footer-terms')}
        <a href="#" ${changedSections.has('modal-terms') ? 'onclick="document.getElementById(\'pvTermsModal\').classList.add(\'open\'); return false;"' : 'onclick="return false;"'}>Terms of Service</a>
      </span>
      <span class="${sectionClass('footer-links')}" style="display:inline-flex;align-items:center;">
        ${showGithub ? '<span class="footer-sep">|</span>' + arrowLeft('footer-links') + '<a href="#" onclick="return false;">GitHub</a>' : ''}
      </span>
    </div>
  </div>
</footer>

<!-- Purpose Modal -->
<div class="modal-overlay" id="pvPurposeModal">
  <div class="modal-box">
    <div class="modal-header">
      <h2>Our Purpose</h2>
      <button class="modal-close" onclick="document.getElementById('pvPurposeModal').classList.remove('open')">&times;</button>
    </div>
    <div class="modal-body">${purposeText}</div>
  </div>
</div>

<!-- Privacy Modal -->
<div class="modal-overlay" id="pvPrivacyModal">
  <div class="modal-box">
    <div class="modal-header">
      <h2>Privacy Policy</h2>
      <button class="modal-close" onclick="document.getElementById('pvPrivacyModal').classList.remove('open')">&times;</button>
    </div>
    <div class="modal-body" style="font-size:14px;line-height:1.7;color:var(--text-muted);">${privacyPolicy}</div>
  </div>
</div>

<!-- Terms Modal -->
<div class="modal-overlay" id="pvTermsModal">
  <div class="modal-box">
    <div class="modal-header">
      <h2>Terms of Service</h2>
      <button class="modal-close" onclick="document.getElementById('pvTermsModal').classList.remove('open')">&times;</button>
    </div>
    <div class="modal-body" style="font-size:14px;line-height:1.7;color:var(--text-muted);">${termsOfService}</div>
  </div>
</div>

</body>
</html>`;

  const previewWindow = window.open('', '_blank');
  if (previewWindow) {
    previewWindow.document.write(html);
    previewWindow.document.close();
  }
}

// ======= DEMO RE-SEED =======
function confirmReseedDatabase() {
  showConfirm(
    'Wipe and Re-Seed Database?',
    'This will wipe all changes and restore the demo database to the default seed data. This cannot be undone.',
    'Wipe and Re-Seed',
    async () => {
      try {
        const res = await fetch('/api/demo/reseed', { method: 'POST' });
        const data = await res.json();
        if (!res.ok || !data.ok) throw new Error(data.error || 'Re-seed failed');
        document.cookie = 'demo_role=; Max-Age=0; path=/';
        document.cookie = 'demo_user_id=; Max-Age=0; path=/';
        window.location.reload();
      } catch (e) {
        showToast('Error: ' + e.message);
      }
    }
  );
}

// ======= DATABASE SETTINGS DEMO STATE =======
function applyDbSettingsDemoState() {
  const isDemo = typeof AppMode !== 'undefined' && AppMode === 'demo';
  const notice = document.getElementById('dbSettingsDemoNotice');
  if (notice) notice.style.display = isDemo ? '' : 'none';
  document.querySelectorAll('#section-dbSettings .db-settings-action').forEach(btn => {
    btn.disabled = isDemo;
    if (isDemo) btn.style.opacity = '0.5';
    else btn.style.opacity = '';
  });
}

// ======= RESET DATABASE =======
let _resetSelections = {};

function showResetDatabaseModal() {
  const options = [
    { key: 'full_reset', label: 'Full Database Reset', parent: true },
    { key: 'reset_orgs', label: 'Organizations', nested: true },
    { key: 'reset_users', label: 'Users', nested: true },
    { key: 'reset_events', label: 'Events', nested: true },
    { key: 'reset_messages', label: 'Messages', nested: true },
    { key: 'reset_flyers', label: 'Flyer Templates', nested: true },
    { key: 'reset_styles', label: 'Sitewide Style Templates', nested: true },
    { key: 'reset_settings', label: 'Site Settings', nested: true },
  ];

  _resetSelections = {};
  options.forEach(o => _resetSelections[o.key] = true); // all checked by default

  let html = '<div class="reset-option-list">';
  for (const o of options) {
    const cls = o.parent ? 'reset-option parent' : 'reset-option nested';
    html += `<label class="${cls}">
      <input type="checkbox" checked data-reset-key="${o.key}" onchange="onResetCheckboxChange('${o.key}', this.checked)">
      ${o.label}
    </label>`;
  }
  html += '</div>';

  document.getElementById('confirmTitle').textContent = 'Reset Database';
  document.getElementById('confirmMessage').innerHTML = html;
  const btn = document.getElementById('confirmBtn');
  btn.textContent = 'Continue';
  btn.className = 'btn btn-danger btn-sm';
  btn.onclick = () => { closeConfirm(); resetDatabaseContinue(); };
  document.getElementById('confirmDialog').classList.add('open');
}

function onResetCheckboxChange(key, checked) {
  _resetSelections[key] = checked;
  const childKeys = ['reset_orgs','reset_users','reset_events','reset_messages','reset_flyers','reset_styles','reset_settings'];

  if (key === 'full_reset') {
    // Toggle all children to match
    childKeys.forEach(k => {
      _resetSelections[k] = checked;
      const cb = document.querySelector(`[data-reset-key="${k}"]`);
      if (cb) cb.checked = checked;
    });
  } else {
    // If any child is unchecked, uncheck full_reset
    if (!checked) {
      _resetSelections.full_reset = false;
      const fcb = document.querySelector('[data-reset-key="full_reset"]');
      if (fcb) fcb.checked = false;
    } else {
      // If all children checked, re-check full_reset
      const allChecked = childKeys.every(k => _resetSelections[k]);
      if (allChecked) {
        _resetSelections.full_reset = true;
        const fcb = document.querySelector('[data-reset-key="full_reset"]');
        if (fcb) fcb.checked = true;
      }
    }
  }
}

async function resetDatabaseContinue() {
  // Check if anything is selected
  const anySelected = Object.values(_resetSelections).some(v => v);
  if (!anySelected) {
    showToast('No categories selected');
    return;
  }

  try {
    const res = await fetch('/api/admin/reset-counts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(_resetSelections),
    });
    if (!res.ok) throw new Error('Failed to fetch counts');
    const counts = await res.json();

    let html = '';
    if (_resetSelections.full_reset) {
      html += '<div style="padding:14px;background:rgba(224,85,85,0.08);border:1px solid rgba(224,85,85,0.25);border-radius:var(--radius-sm);margin-bottom:12px;">';
      html += '<strong style="color:#E05555;">Full Database Reset</strong>';
      html += '<p style="font-size:13px;color:var(--text-muted);margin-top:4px;">All data will be wiped and the app will return to a fresh install state.</p>';
      html += '</div>';
      html += '<div class="reset-summary-list">';
      if (counts.organizations != null) html += `<div class="reset-summary-item"><span>Organizations</span><span class="count">${counts.organizations}</span></div>`;
      if (counts.users != null) html += `<div class="reset-summary-item"><span>Users</span><span class="count">${counts.users}</span></div>`;
      if (counts.events != null) html += `<div class="reset-summary-item"><span>Events</span><span class="count">${counts.events}</span></div>`;
      if (counts.messages != null) html += `<div class="reset-summary-item"><span>Messages</span><span class="count">${counts.messages}</span></div>`;
      if (counts.flyers != null) html += `<div class="reset-summary-item"><span>Flyer Templates</span><span class="count">${counts.flyers}</span></div>`;
      if (counts.settings != null) html += `<div class="reset-summary-item"><span>Site Settings</span><span class="count">${counts.settings}</span></div>`;
      html += '</div>';
    } else {
      html += '<div class="reset-summary-list">';
      if (_resetSelections.reset_orgs && counts.organizations != null) {
        html += `<div class="reset-summary-item"><span>Organizations<br><span class="note">Your admin org will be preserved</span></span><span class="count">${counts.organizations} will be deleted</span></div>`;
      }
      if (_resetSelections.reset_users && counts.users != null) {
        html += `<div class="reset-summary-item"><span>Users<br><span class="note">Your admin account will be preserved</span></span><span class="count">${counts.users} will be deleted</span></div>`;
      }
      if (_resetSelections.reset_events && counts.events != null) {
        html += `<div class="reset-summary-item"><span>Events</span><span class="count">${counts.events} will be deleted</span></div>`;
      }
      if (_resetSelections.reset_messages && counts.messages != null) {
        html += `<div class="reset-summary-item"><span>Messages</span><span class="count">${counts.messages} will be deleted</span></div>`;
      }
      if (_resetSelections.reset_flyers && counts.flyers != null) {
        html += `<div class="reset-summary-item"><span>Flyer Templates</span><span class="count">${counts.flyers} will be deleted</span></div>`;
      }
      if (_resetSelections.reset_styles) {
        html += `<div class="reset-summary-item"><span>Sitewide Style Templates</span><span class="count">0 (placeholder)</span></div>`;
      }
      if (_resetSelections.reset_settings && counts.settings != null) {
        html += `<div class="reset-summary-item"><span>Site Settings<br><span class="note">Core settings (app mode, admin email, site name, region) preserved</span></span><span class="count">${counts.settings} will be deleted</span></div>`;
      }
      html += '</div>';
    }

    html += '<p style="font-size:13px;color:var(--text-muted);margin-top:12px;">Type <strong style="color:#E05555;">RESET</strong> to confirm:</p>';
    html += '<input type="text" class="form-input" id="resetConfirmInput" placeholder="Type RESET" style="margin-top:6px;">';

    document.getElementById('confirmTitle').textContent = 'Confirm Reset';
    document.getElementById('confirmMessage').innerHTML = html;
    const btn = document.getElementById('confirmBtn');
    btn.textContent = 'Reset';
    btn.className = 'btn btn-danger btn-sm';
    btn.onclick = () => { resetDatabaseExecute(); };
    document.getElementById('confirmDialog').classList.add('open');
  } catch (e) {
    showToast('Error: ' + e.message);
  }
}

async function resetDatabaseExecute() {
  const input = document.getElementById('resetConfirmInput');
  if (!input || input.value.trim() !== 'RESET') {
    showToast('Type RESET to confirm');
    return;
  }

  closeConfirm();

  try {
    const payload = { confirm: 'RESET', ..._resetSelections };
    const res = await fetch('/api/admin/reset', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Reset failed');
    }
    const data = await res.json();

    if (data.full_reset) {
      // Clear cookies and reload to trigger setup wizard
      document.cookie = 'demo_role=; Max-Age=0; path=/';
      document.cookie = 'demo_user_id=; Max-Age=0; path=/';
      window.location.reload();
    } else {
      showToast('Database reset complete');
      // Reload config and refresh current view
      await loadConfig();
      showSection(currentSection || 'home');
    }
  } catch (e) {
    showToast('Error: ' + e.message);
  }
}

// ======= APP READY CALLBACK =======
function onAppReady() {
  renderHomeEvents();
}
