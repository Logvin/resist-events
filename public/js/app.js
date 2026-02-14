// ======= STATE =======
let currentSection = 'home';
let calMonth = new Date().getMonth();
let calYear = new Date().getFullYear();
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
let pendingMessageOrgId = null;

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
  if (section === 'calendar') renderCalendar();
  if (section === 'orgs') renderOrgs();
  if (section === 'myEvents') { eventsPage = 1; renderMyEvents(); }
  if (section === 'contact') { viewingThread = null; renderContact(); }
  if (section === 'home') renderHomeEvents();
  if (section === 'newEvent' && !editingEventId) resetEventForm();
  if (section === 'reviewQueue') renderReviewQueue();
  if (section === 'manageOrgs') renderAdminOrgs();
  if (section === 'manageUsers') renderAdminUsers();
}

// ======= MODAL =======
function openModal(id) {
  document.getElementById(id).classList.add('open');
  document.body.style.overflow = 'hidden';
  if (id === 'purposeModal') loadPurpose();
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
  const orgName = event.org_name || '';
  const desc = event.description || '';

  return `
    <div class="event-card" onclick="openEventDetail(${event.id})">
      <div class="event-card-date">${formatDate(event.date)} · ${startTime} – ${endTime}</div>
      <div class="event-card-title">${escHtml(event.title)}</div>
      <div class="event-card-org">
        ${escHtml(orgName)}
        ${isHostOrg ? '<span class="verified-badge" title="Event added by hosting organization">&#x2713;</span>' : ''}
      </div>
      <div class="event-card-desc">${escHtml(desc)}</div>
      <div class="event-card-footer">
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

  const bringItems = event.bring_items || [];
  const noBringItems = event.no_bring_items || [];

  const bringHtml = bringItems.length > 0
    ? `<div style="margin-top:16px;"><strong style="font-family:var(--font-display);font-size:12px;text-transform:uppercase;letter-spacing:0.06em;color:var(--text-dim);">What to Bring</strong><div class="chip-group" style="margin-top:6px;">${bringItems.map(b => `<span class="chip selected" style="cursor:default;">${escHtml(b)}</span>`).join('')}</div></div>`
    : '';

  const noBringHtml = noBringItems.length > 0
    ? `<div style="margin-top:16px;"><strong style="font-family:var(--font-display);font-size:12px;text-transform:uppercase;letter-spacing:0.06em;color:var(--text-dim);">What NOT to Bring</strong><div class="chip-group" style="margin-top:6px;">${noBringItems.map(b => `<span class="chip selected" style="cursor:default;background:rgba(224,85,85,0.08);border-color:rgba(224,85,85,0.2);color:#E05555;">${escHtml(b)}</span>`).join('')}</div></div>`
    : '';

  // Show edit button for organizers (own org events) and admins
  const canEdit = DemoSession.role === 'admin' || (DemoSession.role === 'organizer' && event.org_id === DemoSession.orgId);
  const editBtnHtml = canEdit ? `<button class="btn btn-ghost btn-xs" style="margin-right:8px;" onclick="closeEventDetailModal(); editEvent(${event.id})">Edit</button>` : '';

  let finalFooterHtml = footerHtml || '';
  if (canEdit && !footerHtml) {
    finalFooterHtml = `<button class="btn btn-secondary btn-sm" onclick="closeEventDetailModal(); editEvent(${event.id})">Edit Event</button>`;
  }
  const footerSection = finalFooterHtml ? `<div class="modal-footer">${finalFooterHtml}</div>` : '';

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
            <span style="font-family:var(--font-display);font-size:13px;font-weight:600;color:var(--text-muted);">${escHtml(event.org_name || '')}</span>
            ${event.org_is_host ? '<span class="verified-badge" title="Event added by hosting organization">&#x2713;</span>' : ''}
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
        ${footerSection}
      </div>
    </div>
  `;
  document.body.insertAdjacentHTML('beforeend', detailHTML);
  document.body.style.overflow = 'hidden';
}

function closeEventDetailModal() {
  const modal = document.getElementById('eventDetailModal');
  if (modal) { modal.remove(); document.body.style.overflow = ''; }
}

async function openReviewEventDetail(id) {
  const event = cachedEvents.find(e => e.id === id);
  const orgId = event ? event.org_id : null;
  const eventTitle = event ? event.title : '';
  const footerHtml = `
    <button class="btn btn-success btn-sm" onclick="closeEventDetailModal(); approveEvent(${id})">Approve</button>
    <button class="btn btn-danger btn-sm" onclick="closeEventDetailModal(); rejectEvent(${id})">Reject</button>
    <button class="btn btn-secondary btn-sm" style="margin-left:auto;" onclick="closeEventDetailModal(); openMessageOrgModal(${orgId}, '${escHtml(eventTitle).replace(/'/g, "\\'")}')">Message Org</button>
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
  const todayStr = today.toISOString().split('T')[0];
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

// ======= ORGANIZATIONS =======
async function renderOrgs() {
  await loadOrgs();
  document.getElementById('orgsList').innerHTML = cachedOrgs.map(org => {
    const socials = org.socials || {};
    return `
      <div class="org-card">
        <div class="org-avatar">${escHtml(org.abbreviation || '')}</div>
        <div class="org-info">
          <h4>${escHtml(org.name)}</h4>
          <p>${org.website ? escHtml(org.website) : 'No website listed'}</p>
        </div>
        <div class="org-links">
          ${socials.fb ? `<a href="${escAttr(socials.fb)}" class="org-link-icon" title="Facebook" target="_blank" rel="noopener">FB</a>` : ''}
          ${socials.ig ? `<a href="${escAttr(socials.ig)}" class="org-link-icon" title="Instagram" target="_blank" rel="noopener">IG</a>` : ''}
          ${socials.x ? `<a href="${escAttr(socials.x)}" class="org-link-icon" title="X / Twitter" target="_blank" rel="noopener">X</a>` : ''}
          ${socials.rd ? `<a href="${escAttr(socials.rd)}" class="org-link-icon" title="Reddit" target="_blank" rel="noopener">RD</a>` : ''}
        </div>
      </div>
    `;
  }).join('');
}

// ======= MY EVENTS =======
async function renderMyEvents() {
  showLoading('myEventsList');
  await loadEvents();
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
    const statusClass = e.status === 'published' ? 'status-published' : e.status === 'review' ? 'status-review' : e.status === 'draft' ? 'status-draft' : 'status-archived';
    const statusLabel = e.status === 'published' ? 'Published' : e.status === 'review' ? 'In Review' : e.status === 'draft' ? 'Draft' : 'Archived';

    return `
      <div class="event-list-item${e.status === 'archived' ? ' archived-row' : ''}">
        <div class="event-list-date">${formatDate(e.date)}</div>
        <div class="event-list-name">${escHtml(e.title)}</div>
        <span class="event-list-status ${statusClass}">${statusLabel}</span>
        <div class="event-list-actions">
          ${e.status !== 'archived' ? `
            <button class="btn btn-ghost btn-xs" onclick="editEvent(${e.id})" title="Edit">Edit</button>
            <button class="btn btn-ghost btn-xs" onclick="cloneEvent(${e.id})" title="Clone">Clone</button>
            <button class="btn btn-ghost btn-xs" onclick="archiveEvent(${e.id})" title="Archive">Archive</button>
          ` : `
            <button class="btn btn-ghost btn-xs" onclick="cloneEvent(${e.id})" title="Clone">Clone</button>
            <button class="btn btn-ghost btn-xs" onclick="unarchiveEvent(${e.id})" title="Unarchive">Unarchive</button>
          `}
        </div>
      </div>
    `;
  }).join('');

  document.getElementById('loadMoreEvents').style.display = events.length > pageEvents.length ? 'block' : 'none';
  document.getElementById('archiveToggle').textContent = showArchived ? 'Hide Archived' : 'Show Archived';
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

  // Set bring chips
  setChipSelections('bringChips', event.bring_items || []);
  setChipSelections('noBringChips', event.no_bring_items || []);

  showSection('newEvent');
}

function resetEventForm() {
  editingEventId = null;
  document.getElementById('eventFormTitle').textContent = 'Register a New Event';
  document.getElementById('eventForm').reset();
  if (DemoSession.orgName) {
    document.getElementById('sponsorOrg').value = DemoSession.orgName;
  }
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

  // Clear dates so the user must pick new ones
  document.getElementById('eventStart').value = '';
  document.getElementById('eventEnd').value = '';

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

  // Reset recurring for clone
  document.getElementById('recurringCheck').checked = false;
  toggleRecurring();

  setChipSelections('bringChips', event.bring_items || []);
  setChipSelections('noBringChips', event.no_bring_items || []);

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
    <div class="msg-list-item" onclick="viewThread(${m.id})">
      <div class="msg-topic">${escHtml(m.topic)}</div>
      <div class="msg-meta">
        <div style="font-weight:600;">${escHtml(m.org_name || 'Unknown')}</div>
        <div>${formatTimestamp(m.created_at)}</div>
      </div>
      <button class="btn btn-ghost btn-xs" onclick="event.stopPropagation(); archiveTopic(${m.id})" title="Archive">Archive</button>
    </div>
  `).join('');

  if (topics.length === 0) {
    container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">&#x1F4AC;</div><h3>No messages yet</h3><p>Start a conversation with the site admin.</p></div>';
  }

  document.getElementById('contactArchiveToggle').textContent = showArchivedTopics ? 'Hide Archived' : 'Show Archived';
}

function viewThread(id) {
  viewingThread = id;
  renderContact();
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

function toggleArchivedTopics() {
  showArchivedTopics = !showArchivedTopics;
  renderContact();
}

// ======= NEW MESSAGE =======
function openMessageOrgModal(orgId, eventTitle) {
  pendingMessageOrgId = orgId;
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
    if (pendingMessageOrgId) payload.org_id = pendingMessageOrgId;
    await api('/messages', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    closeModal('newMessageModal');
    document.getElementById('newMsgTopic').value = '';
    document.getElementById('newMsgText').value = '';
    pendingMessageOrgId = null;
    showToast('Message sent!');
    if (currentSection === 'contact') renderContact();
  } catch (e) {
    showToast('Error sending message');
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
    status,
  };

  try {
    if (editingEventId) {
      await api('/events/' + editingEventId, { method: 'PUT', body: JSON.stringify(body) });
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
          await api('/events', { method: 'POST', body: JSON.stringify(occBody) });
        }
        showToast(`${count} recurring events created!`);
      } else {
        await api('/events', { method: 'POST', body: JSON.stringify(body) });
        showToast(status === 'draft' ? 'Draft saved!' : 'Event submitted for review!');
      }
    }
    editingEventId = null;
    setTimeout(() => showSection('myEvents'), 800);
  } catch (e) {
    showToast('Error saving event');
  }
}

// ======= PROFILE =======
async function saveProfile() {
  const name = document.getElementById('profileOrgName').value.trim();
  const website = document.getElementById('profileOrgWebsite').value.trim();
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
      body: JSON.stringify({ name, website, socials }),
    });
    closeModal('profileModal');
    showToast('Profile updated!');
    DemoSession.orgName = name;
    applyDemoRole();
  } catch (e) {
    showToast('Error updating profile');
  }
}

// ======= FORM HELPERS =======
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
  const count = cachedMessages.filter(m => !m.archived).length;
  const badge = document.getElementById('messagesBadge');
  if (badge) {
    badge.textContent = count;
    badge.style.display = count > 0 ? '' : 'none';
  }
}

// ======= ADMIN: REVIEW QUEUE =======
async function updateReviewBadge() {
  await loadEvents();
  const count = cachedEvents.filter(e => e.status === 'review').length;
  const badge = document.getElementById('reviewBadge');
  if (badge) {
    badge.textContent = count;
    badge.style.display = count > 0 ? '' : 'none';
  }
}

async function renderReviewQueue() {
  showLoading('reviewQueueList');
  await loadEvents();
  const reviewEvents = cachedEvents.filter(e => e.status === 'review');

  const listEl = document.getElementById('reviewQueueList');
  const emptyEl = document.getElementById('reviewQueueEmpty');

  if (reviewEvents.length === 0) {
    listEl.innerHTML = '';
    emptyEl.style.display = 'block';
    return;
  }

  emptyEl.style.display = 'none';
  listEl.innerHTML = reviewEvents.map(e => `
    <div class="event-list-item" style="cursor:pointer;" onclick="openReviewEventDetail(${e.id})">
      <div class="event-list-date">${formatDate(e.date)}</div>
      <div class="event-list-name">${escHtml(e.title)}</div>
      <div style="font-size:12px;color:var(--text-dim);white-space:nowrap;">${escHtml(e.org_name || '')}</div>
      <div class="event-list-actions">
        <button class="btn btn-success btn-xs" onclick="event.stopPropagation(); approveEvent(${e.id})">Approve</button>
        <button class="btn btn-danger btn-xs" onclick="event.stopPropagation(); rejectEvent(${e.id})">Reject</button>
      </div>
    </div>
  `).join('');
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

function openOrgEditModal(org) {
  document.getElementById('orgEditId').value = org ? org.id : '';
  document.getElementById('orgEditModalTitle').textContent = org ? 'Edit Organization' : 'Add Organization';
  document.getElementById('orgEditName').value = org ? org.name : '';
  document.getElementById('orgEditAbbr').value = org ? org.abbreviation : '';
  document.getElementById('orgEditWebsite').value = org ? (org.website || '') : '';
  const socials = org ? (org.socials || {}) : {};
  document.getElementById('orgEditFB').value = socials.fb || '';
  document.getElementById('orgEditIG').value = socials.ig || '';
  document.getElementById('orgEditX').value = socials.x || '';
  document.getElementById('orgEditRD').value = socials.rd || '';
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
  const website = document.getElementById('orgEditWebsite').value.trim();
  const socials = {
    fb: document.getElementById('orgEditFB').value.trim() || undefined,
    ig: document.getElementById('orgEditIG').value.trim() || undefined,
    x: document.getElementById('orgEditX').value.trim() || undefined,
    rd: document.getElementById('orgEditRD').value.trim() || undefined,
  };

  if (!name || !abbreviation) {
    showToast('Name and abbreviation are required');
    return;
  }

  try {
    if (id) {
      await api('/orgs/' + id, { method: 'PUT', body: JSON.stringify({ name, abbreviation, website, socials }) });
    } else {
      await api('/orgs', { method: 'POST', body: JSON.stringify({ name, abbreviation, website, socials }) });
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

  document.getElementById('adminUsersList').innerHTML = cachedUsers.map(u => {
    const roleClass = u.role === 'admin' ? 'role-admin' : u.role === 'organizer' ? 'role-organizer' : 'role-guest';
    const roleLabel = u.role.charAt(0).toUpperCase() + u.role.slice(1);
    return `
      <div class="event-list-item">
        <div class="event-list-name">${escHtml(u.display_name)}</div>
        <div style="font-family:var(--font-mono);font-size:12px;color:var(--text-dim);min-width:160px;">${escHtml(u.email || '')}</div>
        <span class="role-badge ${roleClass}">${roleLabel}</span>
        <div style="font-size:12px;color:var(--text-dim);white-space:nowrap;min-width:80px;">${escHtml(u.org_name || '')}</div>
        <div class="event-list-actions">
          <button class="btn btn-ghost btn-xs" onclick="editUserById(${u.id})">Edit</button>
          <button class="btn btn-danger btn-xs" onclick="deleteUserById(${u.id})">Delete</button>
        </div>
      </div>
    `;
  }).join('');

  if (cachedUsers.length === 0) {
    document.getElementById('adminUsersList').innerHTML = '<div class="empty-state"><div class="empty-state-icon">&#x1F465;</div><h3>No users</h3><p>Add your first user above.</p></div>';
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

// ======= APP READY CALLBACK =======
function onAppReady() {
  renderHomeEvents();
}
