export function generateWorkerScript(schedule) {
  const tablesList = schedule.backup_type === 'full'
    ? "['events', 'organizations', 'users', 'messages']"
    : "['events']";

  const workerScript = `// Scheduled backup Worker for Resist Events
// Label: ${schedule.label}
// Schedule: ${schedule.cron}
// Type: ${schedule.backup_type}
// Retention: ${schedule.retention_days} days
//
// Deploy steps:
//   1. wrangler secret put RESIST_EVENTS_API_KEY
//   2. wrangler deploy

export default {
  async scheduled(controller, env, ctx) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const uuid = crypto.randomUUID();
    const filename = \`backups/\${timestamp}-\${uuid}.enc\`;

    // Generate encryption key and IV
    const key = await crypto.subtle.generateKey(
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt', 'decrypt']
    );
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const keyBytes = await crypto.subtle.exportKey('raw', key);

    // Collect backup data via API
    const baseUrl = env.RESIST_EVENTS_URL;
    const headers = {
      'Authorization': \`Bearer \${env.RESIST_EVENTS_API_KEY}\`,
      'Content-Type': 'application/json',
    };

    const tables = ${tablesList};
    const backupData = {
      timestamp: new Date().toISOString(),
      type: '${schedule.backup_type}',
      tables: {},
    };

    for (const table of tables) {
      try {
        const resp = await fetch(\`\${baseUrl}/api/\${table}\`, { headers });
        if (resp.ok) {
          backupData.tables[table] = await resp.json();
        } else {
          console.error(\`Failed to fetch \${table}: \${resp.status}\`);
        }
      } catch (e) {
        console.error(\`Error fetching \${table}: \${e.message}\`);
      }
    }

    // Encrypt
    const encoder = new TextEncoder();
    const plaintext = encoder.encode(JSON.stringify(backupData));
    const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, plaintext);

    // Upload to R2
    await env.FLYER_BUCKET.put(filename, ciphertext, {
      httpMetadata: { contentType: 'application/octet-stream' },
    });

    // Log key info (capture from Worker logs immediately — never stored)
    console.log('Backup complete:', filename);
    console.log('Key (hex):', bytesToHex(keyBytes));
    console.log('IV (hex):', bytesToHex(iv));
    console.log('IMPORTANT: Save the key and IV above to restore this backup.');

    // Clean up old backups beyond retention period
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - ${schedule.retention_days});

    let cursor;
    do {
      const listed = await env.FLYER_BUCKET.list({ prefix: 'backups/', cursor });
      for (const obj of listed.objects) {
        if (new Date(obj.uploaded) < cutoff) {
          await env.FLYER_BUCKET.delete(obj.key);
          console.log('Deleted old backup:', obj.key);
        }
      }
      cursor = listed.truncated ? listed.cursor : undefined;
    } while (cursor);
  },
};

function bytesToHex(bytes) {
  return Array.from(new Uint8Array(bytes))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}
`;

  const wranglerToml = `name = "resist-events-backup"
main = "worker.js"
compatibility_date = "2024-01-01"

[triggers]
crons = ["${schedule.cron}"]

[[r2_buckets]]
binding = "FLYER_BUCKET"
bucket_name = "your-r2-bucket-name"

[vars]
RESIST_EVENTS_URL = "https://your-resist-events-domain.com"

# Set secrets via wrangler CLI (do not put real values here):
#   wrangler secret put RESIST_EVENTS_API_KEY
`;

  return { workerScript, wranglerToml };
}
