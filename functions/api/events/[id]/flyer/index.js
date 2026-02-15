// POST /api/events/:id/flyer — upload generated flyer
// DELETE /api/events/:id/flyer — remove generated flyer

export async function onRequestPost(context) {
  const db = context.env.RESIST_DB;
  const eventId = context.params.id;
  const role = context.data.demoRole;
  const userId = context.data.demoUserId;

  if (!role || role === 'guest') {
    return Response.json({ error: 'Unauthorized' }, { status: 403 });
  }

  // Check ownership
  const event = await db.prepare('SELECT org_id FROM events WHERE id = ?').bind(eventId).first();
  if (!event) return Response.json({ error: 'Event not found' }, { status: 404 });

  if (role === 'organizer') {
    const user = await db.prepare('SELECT org_id FROM users WHERE id = ?').bind(userId).first();
    if (!user || user.org_id !== event.org_id) {
      return Response.json({ error: 'Not authorized for this event' }, { status: 403 });
    }
  }

  try {
    const formData = await context.request.formData();
    const file = formData.get('flyer');
    const templateName = formData.get('template_name') || '';

    if (!file || !(file instanceof File)) {
      return Response.json({ error: 'No flyer file provided' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    let storageType = 'd1';
    let r2Key = null;

    // Try R2 first
    if (context.env.FLYER_BUCKET) {
      try {
        r2Key = `flyers/event-${eventId}.png`;
        await context.env.FLYER_BUCKET.put(r2Key, arrayBuffer, {
          httpMetadata: { contentType: 'image/png' },
        });
        storageType = 'r2';
      } catch (e) {
        // R2 failed, fall back to D1
        r2Key = null;
        storageType = 'd1';
      }
    }

    if (storageType === 'd1') {
      // Store as base64 in D1
      const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));

      // Upsert
      await db.prepare(`
        INSERT INTO event_flyers (event_id, image_data, r2_key, storage_type, template_name)
        VALUES (?, ?, NULL, 'd1', ?)
        ON CONFLICT(event_id) DO UPDATE SET
          image_data = excluded.image_data,
          r2_key = NULL,
          storage_type = 'd1',
          template_name = excluded.template_name,
          created_at = datetime('now')
      `).bind(eventId, base64, templateName).run();
    } else {
      // Store R2 reference in D1
      await db.prepare(`
        INSERT INTO event_flyers (event_id, image_data, r2_key, storage_type, template_name)
        VALUES (?, NULL, ?, 'r2', ?)
        ON CONFLICT(event_id) DO UPDATE SET
          image_data = NULL,
          r2_key = excluded.r2_key,
          storage_type = 'r2',
          template_name = excluded.template_name,
          created_at = datetime('now')
      `).bind(eventId, r2Key, templateName).run();
    }

    return Response.json({
      success: true,
      flyerUrl: `/api/events/${eventId}/flyer/image.png`,
    });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}

export async function onRequestDelete(context) {
  const db = context.env.RESIST_DB;
  const eventId = context.params.id;
  const role = context.data.demoRole;
  const userId = context.data.demoUserId;

  if (!role || role === 'guest') {
    return Response.json({ error: 'Unauthorized' }, { status: 403 });
  }

  // Check ownership
  const event = await db.prepare('SELECT org_id FROM events WHERE id = ?').bind(eventId).first();
  if (!event) return Response.json({ error: 'Event not found' }, { status: 404 });

  if (role === 'organizer') {
    const user = await db.prepare('SELECT org_id FROM users WHERE id = ?').bind(userId).first();
    if (!user || user.org_id !== event.org_id) {
      return Response.json({ error: 'Not authorized for this event' }, { status: 403 });
    }
  }

  try {
    // Check if flyer exists and get storage info
    const flyer = await db.prepare('SELECT r2_key, storage_type FROM event_flyers WHERE event_id = ?').bind(eventId).first();

    if (!flyer) {
      return Response.json({ error: 'No flyer found' }, { status: 404 });
    }

    // Delete from R2 if applicable
    if (flyer.storage_type === 'r2' && flyer.r2_key && context.env.FLYER_BUCKET) {
      try {
        await context.env.FLYER_BUCKET.delete(flyer.r2_key);
      } catch (e) {
        // Non-critical
      }
    }

    // Delete from D1
    await db.prepare('DELETE FROM event_flyers WHERE event_id = ?').bind(eventId).run();

    return Response.json({ success: true });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
