// GET /api/events/:id/flyer/image.png — serve flyer image (public, no auth)

export async function onRequestGet(context) {
  const db = context.env.RESIST_DB;
  const eventId = context.params.id;

  try {
    const flyer = await db.prepare(
      'SELECT image_data, r2_key, storage_type FROM event_flyers WHERE event_id = ?'
    ).bind(eventId).first();

    if (!flyer) {
      return Response.json({ error: 'No flyer found' }, { status: 404 });
    }

    if (flyer.storage_type === 'r2' && flyer.r2_key && context.env.FLYER_BUCKET) {
      const object = await context.env.FLYER_BUCKET.get(flyer.r2_key);
      if (!object) {
        return Response.json({ error: 'Flyer not found in storage' }, { status: 404 });
      }
      return new Response(object.body, {
        headers: {
          'Content-Type': 'image/png',
          'Cache-Control': 'public, max-age=86400',
        },
      });
    }

    if (flyer.storage_type === 'd1' && flyer.image_data) {
      // Decode base64 to binary
      const binaryString = atob(flyer.image_data);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      return new Response(bytes, {
        headers: {
          'Content-Type': 'image/png',
          'Cache-Control': 'public, max-age=86400',
        },
      });
    }

    return Response.json({ error: 'Flyer data unavailable' }, { status: 404 });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
