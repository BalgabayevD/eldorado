import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { telegramConnections } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import type { RequestHandler } from './$types';

// GET /api/telegram/connection — статус привязки текущего пользователя
export const GET: RequestHandler = async ({ locals }) => {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const [connection] = await db
		.select()
		.from(telegramConnections)
		.where(eq(telegramConnections.userId, locals.user.id))
		.limit(1);

	return json(connection ?? null);
};

// DELETE /api/telegram/connection — отвязать Telegram
export const DELETE: RequestHandler = async ({ locals }) => {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	await db
		.delete(telegramConnections)
		.where(eq(telegramConnections.userId, locals.user.id));

	return json({ ok: true });
};
