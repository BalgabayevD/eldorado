import { json } from '@sveltejs/kit';
import { getUpdates, deleteWebhook } from '$lib/server/telegram-bot';
import { handleUpdate } from '$lib/server/telegram-handler';
import type { RequestHandler } from './$types';

// POST /api/telegram/poll — вручную забирает обновления из Telegram и обрабатывает их.
// Используется для локальной разработки вместо webhook.
export const POST: RequestHandler = async ({ locals }) => {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	// Webhook должен быть отключён иначе getUpdates не работает
	await deleteWebhook();

	const updates = await getUpdates();

	for (const update of updates) {
		await handleUpdate(update);
	}

	return json({ ok: true, processed: updates.length });
};
