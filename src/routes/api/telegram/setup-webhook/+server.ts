import { json } from '@sveltejs/kit';
import { setWebhook, deleteWebhook } from '$lib/server/telegram-bot';
import { env } from '$env/dynamic/private';
import type { RequestHandler } from './$types';

// POST /api/telegram/setup-webhook?url=https://your-domain.com
// Регистрирует webhook в Telegram
export const POST: RequestHandler = async ({ request, locals }) => {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const body = await request.json().catch(() => ({}));
	const webhookUrl = body.url ?? `${env.ORIGIN}/api/telegram/webhook`;

	const ok = await setWebhook(webhookUrl);
	return json({ ok, webhookUrl });
};

// DELETE /api/telegram/setup-webhook — удаляет webhook
export const DELETE: RequestHandler = async ({ locals }) => {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const ok = await deleteWebhook();
	return json({ ok });
};
