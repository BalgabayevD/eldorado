import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { telegramTokens } from '$lib/server/db/schema';
import { env } from '$env/dynamic/private';
import type { RequestHandler } from './$types';

// POST /api/telegram/link — генерирует одноразовую ссылку для привязки
export const POST: RequestHandler = async ({ locals }) => {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const token = crypto.randomUUID().replace(/-/g, '');

	await db.insert(telegramTokens).values({
		token,
		userId: locals.user.id,
		expiresAt: new Date(Date.now() + 15 * 60 * 1000)
	});

	const link = `https://t.me/${env.TELEGRAM_BOT_USERNAME}?start=${token}`;

	return json({ link, expiresIn: 15 * 60 });
};
