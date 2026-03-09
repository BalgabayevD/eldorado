import { json } from '@sveltejs/kit';
import { checkAlerts } from '$lib/server/alertChecker';
import type { RequestHandler } from './$types';

// GET /api/cron - вызывается периодически (например, через Vercel Cron или внешний scheduler)
export const GET: RequestHandler = async ({ request }) => {
	// Простая защита через secret header
	const secret = request.headers.get('x-cron-secret');
	if (secret !== (process.env.CRON_SECRET ?? 'dev-secret')) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const result = await checkAlerts();
	return json({ ok: true, ...result });
};
