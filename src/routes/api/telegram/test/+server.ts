import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { telegramConnections } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { sendBotMessage } from '$lib/server/telegram-bot';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ locals }) => {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const [connection] = await db
		.select()
		.from(telegramConnections)
		.where(eq(telegramConnections.userId, locals.user.id))
		.limit(1);

	if (!connection) {
		return json({ error: 'Telegram не привязан' }, { status: 400 });
	}

	await sendBotMessage(
		connection.chatId,
		`🔔 <b>Тестовое уведомление</b>\n\nВсё работает! Вы будете получать алерты об изменении цен здесь.`
	);

	return json({ ok: true });
};
