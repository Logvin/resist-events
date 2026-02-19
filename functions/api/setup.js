// POST /api/setup — handles Setup Wizard form submission

export async function onRequestPost(context) {
  const db = context.env.RESIST_DB;

  try {
    const body = await context.request.json();
    const { mode, admin_email, site_name, city, admin_group_name } = body;

    if (!mode || !admin_email) {
      return Response.json({ error: 'mode and admin_email are required' }, { status: 400 });
    }

    // Check if already set up
    const existing = await db.prepare("SELECT value FROM site_config WHERE key = 'app_mode'").first();
    if (existing && existing.value !== 'setup_required') {
      return Response.json({ error: 'App is already configured. Wipe the database to re-run setup.' }, { status: 400 });
    }

    if (mode === 'demo') {
      // Store app mode and recovery email (use REPLACE in case setup_required row exists from a reset)
      await db.batch([
        db.prepare("INSERT OR REPLACE INTO site_config (key, value) VALUES ('app_mode', 'demo')"),
        db.prepare("INSERT OR REPLACE INTO site_config (key, value) VALUES ('demo_admin_email', ?)").bind(admin_email.toLowerCase().trim()),
      ]);

      // Seed demo data if organizations table is empty
      const orgCount = await db.prepare("SELECT COUNT(*) as cnt FROM organizations").first();
      if (!orgCount || orgCount.cnt === 0) {
        await seedDemoData(db);
      }

      return Response.json({ ok: true });
    }

    if (mode === 'live') {
      if (!site_name) {
        return Response.json({ error: 'site_name is required for live mode' }, { status: 400 });
      }

      const trimmedEmail = admin_email.toLowerCase().trim();
      const orgName = (admin_group_name && admin_group_name.trim()) || 'Site Admins';
      const currentYear = new Date().getFullYear();
      const copyrightText = `${currentYear} ${site_name} · Open source and community-driven`;

      // Clear any existing seed data first
      const clearStmts = [
        db.prepare("DELETE FROM event_published_seen"),
        db.prepare("DELETE FROM review_seen"),
        db.prepare("DELETE FROM message_reads"),
        db.prepare("DELETE FROM user_orgs"),
        db.prepare("DELETE FROM message_replies"),
        db.prepare("DELETE FROM messages"),
        db.prepare("DELETE FROM event_flyers"),
        db.prepare("DELETE FROM events"),
        db.prepare("DELETE FROM users"),
        db.prepare("DELETE FROM organizations"),
        db.prepare("DELETE FROM site_config"),
      ];
      await db.batch(clearStmts);

      // Store config
      const configStmts = [
        db.prepare("INSERT INTO site_config (key, value) VALUES ('app_mode', 'live')"),
        db.prepare("INSERT INTO site_config (key, value) VALUES ('site_name', ?)").bind(site_name),
        db.prepare("INSERT INTO site_config (key, value) VALUES ('admin_email', ?)").bind(trimmedEmail),
        db.prepare("INSERT INTO site_config (key, value) VALUES ('copyright_text', ?)").bind(copyrightText),
        db.prepare("INSERT INTO site_config (key, value) VALUES ('hero_line_1', 'Together We')"),
        db.prepare("INSERT INTO site_config (key, value) VALUES ('hero_line_2', 'Show Up.')"),
        db.prepare("INSERT INTO site_config (key, value) VALUES ('hero_subtitle', 'One calendar for every rally, march, meeting, and action. Find your people. Make your voice heard.')"),
        db.prepare("INSERT INTO site_config (key, value) VALUES ('show_event_count', 'yes')"),
        db.prepare("INSERT INTO site_config (key, value) VALUES ('show_org_count', 'yes')"),
        db.prepare("INSERT INTO site_config (key, value) VALUES ('show_people_mobilized', 'yes')"),
        db.prepare("INSERT INTO site_config (key, value) VALUES ('show_github_link', 'yes')"),
        db.prepare("INSERT INTO site_config (key, value) VALUES ('event_organizer_permission', 'own_org_only')"),
        db.prepare(`INSERT INTO site_config (key, value) VALUES ('privacy_policy', '<p><strong>Last updated:</strong> ${currentYear}</p><p style="margin-top:12px;">We are committed to protecting your privacy. This site collects only the information necessary to coordinate community events.</p><h4 style="margin-top:16px;color:var(--text);font-size:14px;">Information We Collect</h4><p>We collect email addresses for organizer and admin accounts. Event information is provided voluntarily by organizers.</p><h4 style="margin-top:16px;color:var(--text);font-size:14px;">Data Storage</h4><p>All data is stored securely in a Cloudflare D1 database associated with this deployment.</p><h4 style="margin-top:16px;color:var(--text);font-size:14px;">Open Source</h4><p>This application is open source. You can review the codebase to see exactly how data is handled.</p>')`),
        db.prepare(`INSERT INTO site_config (key, value) VALUES ('terms_of_service', '<p><strong>Last updated:</strong> ${currentYear}</p><p style="margin-top:12px;">By using this site, you agree to the following terms.</p><h4 style="margin-top:16px;color:var(--text);font-size:14px;">Purpose</h4><p>This is a community-driven event calendar designed to help local organizations coordinate civic actions, rallies, meetings, and community events.</p><h4 style="margin-top:16px;color:var(--text);font-size:14px;">User Conduct</h4><p>Users agree to submit only truthful event information, refrain from posting harmful or misleading content, and respect the community guidelines set by site administrators.</p><h4 style="margin-top:16px;color:var(--text);font-size:14px;">Disclaimer</h4><p>This platform is provided "as is" without warranty of any kind.</p>')`),
      ];
      configStmts.push(db.prepare(`INSERT INTO site_config (key, value) VALUES ('purpose_text', '<p style="margin-bottom:16px;line-height:1.7;">There are many organizations throughout our community that hold events, rallies, meetings, and civic actions. Finding these events can be challenging — each organization uses different communication channels, from social media to email lists to word of mouth.</p><p style="margin-bottom:16px;line-height:1.7;">We built this platform to solve that problem by creating a single, unified event calendar for our community. Our goal is to make civic engagement as easy as possible by removing barriers to finding out what''s happening and when.</p><p style="margin-bottom:16px;line-height:1.7;">Whether you''re looking for your first rally, your hundredth town hall, or a volunteer opportunity — you''re in the right place.</p><p style="line-height:1.7;">This project is <strong>open source</strong> and community-driven. Everyone is welcome.</p>')`));
      if (city) {
        configStmts.push(db.prepare("INSERT INTO site_config (key, value) VALUES ('site_region', ?)").bind(city));
      }
      await db.batch(configStmts);

      // Create admin organization and user
      const orgResult = await db.prepare(
        "INSERT INTO organizations (name, abbreviation, city, mission_statement) VALUES (?, '', ?, 'Site administration and platform management.')"
      ).bind(orgName, city || '').run();

      const orgId = orgResult.meta.last_row_id;

      const userResult = await db.prepare(
        "INSERT INTO users (email, display_name, role, org_id) VALUES (?, 'Admin', 'admin', ?)"
      ).bind(trimmedEmail, orgId).run();

      const userId = userResult.meta.last_row_id;

      await db.prepare(
        "INSERT INTO user_orgs (user_id, org_id, status) VALUES (?, ?, 'active')"
      ).bind(userId, orgId).run();

      return Response.json({ ok: true, user_id: userId });
    }

    return Response.json({ error: 'Invalid mode. Use "demo" or "live".' }, { status: 400 });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}

async function seedDemoData(db) {
  const stmts = [
    // Site Config
    db.prepare("INSERT OR IGNORE INTO site_config (key, value) VALUES ('site_name', 'Camelot Resist Events')"),
    db.prepare("INSERT OR IGNORE INTO site_config (key, value) VALUES ('site_region', 'Camelot')"),
    db.prepare("INSERT OR IGNORE INTO site_config (key, value) VALUES ('domain', 'cityresist.events')"),
    db.prepare("INSERT OR IGNORE INTO site_config (key, value) VALUES ('archive_retention_months', '12')"),
    db.prepare("INSERT OR IGNORE INTO site_config (key, value) VALUES ('flyer_auto_delete_days', '30')"),
    db.prepare("INSERT OR IGNORE INTO site_config (key, value) VALUES ('event_organizer_permission', 'own_org_only')"),
    db.prepare("INSERT OR IGNORE INTO site_config (key, value) VALUES ('hero_line_1', 'Together We')"),
    db.prepare("INSERT OR IGNORE INTO site_config (key, value) VALUES ('hero_line_2', 'Show Up.')"),
    db.prepare("INSERT OR IGNORE INTO site_config (key, value) VALUES ('hero_subtitle', 'One calendar for every rally, march, meeting, and action. Find your people. Make your voice heard.')"),
    db.prepare("INSERT OR IGNORE INTO site_config (key, value) VALUES ('show_event_count', 'yes')"),
    db.prepare("INSERT OR IGNORE INTO site_config (key, value) VALUES ('show_org_count', 'yes')"),
    db.prepare("INSERT OR IGNORE INTO site_config (key, value) VALUES ('show_people_mobilized', 'yes')"),
    db.prepare("INSERT OR IGNORE INTO site_config (key, value) VALUES ('show_github_link', 'yes')"),
    db.prepare("INSERT OR IGNORE INTO site_config (key, value) VALUES ('copyright_text', '2026 Camelot Resist Events · Open source and community-driven')"),
    db.prepare(`INSERT OR IGNORE INTO site_config (key, value) VALUES ('privacy_policy', '<p><strong>Last updated:</strong> February 2026</p><p style="margin-top:12px;">Resist Events is an open-source community event calendar. We are committed to transparency about how this application works.</p><h4 style="margin-top:16px;color:var(--text);font-size:14px;">Information We Collect</h4><p>This demo instance uses browser cookies solely for demo session management (role selection). No personal data is collected, stored, or shared beyond what you voluntarily enter into the application.</p><h4 style="margin-top:16px;color:var(--text);font-size:14px;">Data Storage</h4><p>All data is stored in a Cloudflare D1 database associated with this deployment. In demo mode, data may be periodically reset.</p><h4 style="margin-top:16px;color:var(--text);font-size:14px;">Open Source</h4><p>The source code for this application is publicly available. You can review exactly what data is collected and how it is handled by inspecting the codebase.</p>')`),
    db.prepare(`INSERT OR IGNORE INTO site_config (key, value) VALUES ('terms_of_service', '<p><strong>Last updated:</strong> February 2026</p><p style="margin-top:12px;">By using Resist Events, you agree to the following terms.</p><h4 style="margin-top:16px;color:var(--text);font-size:14px;">Purpose</h4><p>Resist Events is a community-driven event calendar designed to help local organizations coordinate civic actions, rallies, meetings, and community events.</p><h4 style="margin-top:16px;color:var(--text);font-size:14px;">User Conduct</h4><p>Users agree to submit only truthful event information, refrain from posting harmful or misleading content, and respect the community guidelines set by site administrators.</p><h4 style="margin-top:16px;color:var(--text);font-size:14px;">Disclaimer</h4><p>This platform is provided "as is" without warranty of any kind.</p>')`),
    db.prepare(`INSERT OR IGNORE INTO site_config (key, value) VALUES ('purpose_text', '<p style="margin-bottom:16px;line-height:1.7;">Listen. Strange women lying in ponds distributing swords is no basis for a system of government. Supreme executive power derives from a mandate from the masses, not from some farcical aquatic ceremony.</p><p style="margin-bottom:16px;line-height:1.7;">We built <strong>Camelot Resist Events</strong> because there are many organizations throughout the realm that hold events, rallies, quests, and peasant uprisings.</p><p style="margin-bottom:16px;line-height:1.7;">Our goal is to create a single, unified event calendar for the community. We want to make civic engagement as easy as possible.</p><p style="line-height:1.7;">This project is <strong>open source</strong> and community-driven. You don''t have to be oppressed to join — but it helps.</p>')`),

    // Organizations
    db.prepare("INSERT INTO organizations (id, name, abbreviation, website, socials, city, mission_statement) VALUES (1, 'Knights of the Round Table', 'KRT', 'https://roundtable.camelot', '{\"fb\":\"https://facebook.com/roundtable\",\"ig\":\"https://instagram.com/knightsrt\"}', 'Camelot', 'Defending the realm through chivalry, justice, and the quest for the Holy Grail.')"),
    db.prepare("INSERT INTO organizations (id, name, abbreviation, website, socials, city, mission_statement) VALUES (2, 'Peasants'' Autonomous Collective', 'PAC', 'https://peasants-collective.camelot', '{\"fb\":\"https://facebook.com/peasants\",\"rd\":\"https://reddit.com/r/peasants\"}', 'Muddy Village', 'An anarcho-syndicalist commune demanding fair representation and peasant rights.')"),
    db.prepare("INSERT INTO organizations (id, name, abbreviation, website, socials, city, mission_statement) VALUES (3, 'Knights Who Say Ni', 'NI', NULL, '{\"x\":\"https://x.com/knightswhosyni\"}', 'Forest of Ni', 'Protecting the sacred forests and demanding shrubberies for environmental justice.')"),
    db.prepare("INSERT INTO organizations (id, name, abbreviation, website, socials, city, mission_statement) VALUES (4, 'Camelot Women''s Guild', 'CWG', 'https://womensguild.camelot', '{\"ig\":\"https://instagram.com/cwg\"}', 'Camelot', 'Empowering women across the realm through education, advocacy, and community action.')"),
    db.prepare("INSERT INTO organizations (id, name, abbreviation, website, socials, city, mission_statement) VALUES (5, 'Holy Hand Grenade Society', 'HHGS', NULL, '{}', 'Camelot', 'Promoting safe handling of holy relics and proper counting techniques since 932 AD.')"),
    db.prepare("INSERT INTO organizations (id, name, abbreviation, website, socials, city, mission_statement) VALUES (6, 'Swamp Castle Progressives', 'SCP', 'https://swampcastle.camelot', '{\"fb\":\"https://facebook.com/swampcastle\"}', 'Swamp Castle', 'Building a better future on solid ground — or at least trying to stop sinking.')"),
    db.prepare("INSERT INTO organizations (id, name, abbreviation, website, socials, city, mission_statement) VALUES (7, 'Ministry of Silly Walks', 'MSW', 'https://sillywalks.gov.camelot', '{\"ig\":\"https://instagram.com/sillywalks\",\"x\":\"https://x.com/sillywalks\"}', 'Camelot', 'Advancing pedestrian creativity and securing government funding for silly walks.')"),
    db.prepare("INSERT INTO organizations (id, name, abbreviation, website, socials, city, mission_statement) VALUES (8, 'Dead Parrot Advocacy League', 'DPAL', NULL, '{\"rd\":\"https://reddit.com/r/deadparrot\"}', 'Stinking Fen', 'Fighting for consumer rights and truth in pet shop advertising.')"),

    // Users
    db.prepare("INSERT INTO users (id, email, display_name, role, org_id) VALUES (1, 'admin@camelot-resist.events', 'Arthur Pendragon', 'admin', 1)"),
    db.prepare("INSERT INTO users (id, email, display_name, role, org_id) VALUES (2, 'dennis@peasants.camelot', 'Dennis the Peasant', 'organizer', 2)"),
    db.prepare("INSERT INTO users (id, email, display_name, role, org_id) VALUES (3, 'guest@camelot-resist.events', 'Brave Sir Robin', 'guest', NULL)"),

    // User-Org memberships
    db.prepare("INSERT INTO user_orgs (user_id, org_id, status) VALUES (1, 1, 'active')"),
    db.prepare("INSERT INTO user_orgs (user_id, org_id, status) VALUES (2, 2, 'active')"),

    // Reset autoincrement counters so explicit IDs work after a DB reset
    db.prepare("DELETE FROM sqlite_sequence"),

    // Events (explicit IDs so message FK references remain valid after resets)
    db.prepare("INSERT INTO events (id, title, org_id, date, start_time, end_time, address, description, status, bring_items, no_bring_items, notes, reg_required, event_type) VALUES (1, 'Rally for Peasant Representation', 2, '2026-02-14', '10:00 AM', '1:00 PM', 'Town Square, Muddy Village, Camelot', 'Join us at the Town Square to demand fair representation in governance.', 'published', '[\"Protest Signs\",\"Water\",\"Mud-resistant Boots\"]', '[\"Holy Hand Grenades\",\"Shrubberies\"]', 'Dennis will lead the opening remarks.', 0, 'protest_gathering')"),
    db.prepare("INSERT INTO events (id, title, org_id, date, start_time, end_time, address, description, status, bring_items, no_bring_items, notes, reg_required, event_type) VALUES (2, 'Town Hall: Bridge Toll Policy', 1, '2026-02-15', '6:00 PM', '8:30 PM', 'Castle Camelot, Great Hall, Camelot', 'An open town hall to discuss the controversial bridge-crossing policies.', 'published', '[\"Water\"]', '[\"Holy Hand Grenades\"]', 'Refreshments provided. Swallows welcome.', 1, 'community_event')"),
    db.prepare("INSERT INTO events (id, title, org_id, date, start_time, end_time, address, description, status, bring_items, no_bring_items, notes, reg_required, event_type) VALUES (3, 'Shrubbery Planting Volunteer Day', 3, '2026-02-16', '9:00 AM', '4:00 PM', 'Forest of Ni, Eastern Camelot', 'The Knights Who Say Ni require a shrubbery! Join us for a community planting day.', 'published', '[\"Gardening Gloves\",\"Sunscreen\",\"Water\"]', '[]', 'Do NOT say \"it\" — you know the word.', 0, 'community_event')"),
    db.prepare("INSERT INTO events (id, title, org_id, date, start_time, end_time, address, description, status, bring_items, no_bring_items, notes, reg_required, event_type) VALUES (4, 'March for Swallow Research Funding', 4, '2026-02-22', '11:00 AM', '2:00 PM', 'Castle Courtyard, Camelot', 'March through Camelot in support of increased funding for swallow migration research.', 'published', '[\"Sunscreen\",\"Water\",\"Protest Signs\"]', '[\"Coconut Halves\"]', 'March route is 1.5 leagues, flat terrain.', 0, 'march')"),
    db.prepare("INSERT INTO events (id, title, org_id, date, start_time, end_time, address, description, status, bring_items, no_bring_items, notes, reg_required, event_type) VALUES (5, 'Holy Hand Grenade Safety Workshop', 5, '2026-02-28', '7:00 PM', '9:00 PM', 'Brother Maynard''s Chapel, Camelot', 'Learn the proper counting technique for the Holy Hand Grenade of Antioch.', 'published', '[]', '[\"Live Rabbits\"]', 'The Book of Armaments will be available for reference.', 0, 'community_event')"),
    db.prepare("INSERT INTO events (id, title, org_id, date, start_time, end_time, address, description, status, bring_items, no_bring_items, notes, reg_required, event_type) VALUES (6, 'Know Your Rights: Witch Trial Defense', 2, '2026-03-05', '6:00 PM', '8:00 PM', 'Peasants'' Meeting Hall, Muddy Village, Camelot', 'Learn your rights if accused of being a witch.', 'review', '[]', '[]', 'Scales and ducks will NOT be provided.', 1, 'community_event')"),
    db.prepare("INSERT INTO events (id, title, org_id, date, start_time, end_time, address, description, status, bring_items, no_bring_items, notes, reg_required, event_type) VALUES (7, 'Spring Coconut Migration Census', 1, '2026-03-12', '9:00 AM', '12:00 PM', '', 'Help us count the coconut-carrying swallows on their spring migration.', 'draft', '[\"Water\",\"Comfortable Shoes\",\"Binoculars\"]', '[]', 'Location will be shared upon registration.', 1, 'virtual')"),

    // Messages
    db.prepare("INSERT INTO messages (id, topic, org_id, event_id, archived, created_at) VALUES (1, 'Re: Know Your Rights: Witch Trial Defense', 2, 6, 0, '2026-02-10 14:15:00')"),
    db.prepare("INSERT INTO messages (id, topic, org_id, event_id, archived, created_at) VALUES (2, 'Request to bring coconuts to rally', 2, NULL, 0, '2026-02-05 10:20:00')"),

    // Message replies
    db.prepare("INSERT INTO message_replies (message_id, from_type, text, created_at) VALUES (1, 'org', 'How long does event approval typically take? Help! Help! I''m being repressed!', '2026-02-10 14:15:00')"),
    db.prepare("INSERT INTO message_replies (message_id, from_type, text, created_at) VALUES (1, 'admin', 'Calm down, Dennis. Approvals usually take 24-48 hours.', '2026-02-10 16:30:00')"),
    db.prepare("INSERT INTO message_replies (message_id, from_type, text, created_at) VALUES (1, 'org', 'Come and see the violence inherent in the system!', '2026-02-11 09:00:00')"),
    db.prepare("INSERT INTO message_replies (message_id, from_type, text, created_at) VALUES (1, 'admin', 'Found it. I''ll prioritize it. And Dennis, you''re not being repressed.', '2026-02-11 15:42:00')"),
    db.prepare("INSERT INTO message_replies (message_id, from_type, text, created_at) VALUES (2, 'org', 'Can we bring coconut halves to the Rally for Peasant Representation?', '2026-02-05 10:20:00')"),
  ];

  await db.batch(stmts);
}
