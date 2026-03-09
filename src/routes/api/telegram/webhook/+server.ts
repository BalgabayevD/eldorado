import { json } from '@sveltejs/kit';
import { handleUpdate } from '$lib/server/telegram-handler';
import type { TelegramUpdate } from '$lib/server/telegram-bot';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
	const update: TelegramUpdate = await request.json();
	await handleUpdate(update);
	return json({ ok: true });
};
