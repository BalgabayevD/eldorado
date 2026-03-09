import { db } from './db';
import { telegramTokens, telegramConnections } from './db/schema';
import { eq, and, gt, isNull } from 'drizzle-orm';
import { sendBotMessage } from './telegram-bot';
import type { TelegramUpdate } from './telegram-bot';

export async function handleUpdate(update: TelegramUpdate): Promise<void> {
	const message = update.message;
	if (!message?.text || !message.from) return;

	const chatId = String(message.chat.id);
	const text = message.text.trim();

	if (text.startsWith('/start ')) {
		const token = text.slice(7).trim();

		const [row] = await db
			.select()
			.from(telegramTokens)
			.where(
				and(
					eq(telegramTokens.token, token),
					gt(telegramTokens.expiresAt, new Date()),
					isNull(telegramTokens.usedAt)
				)
			)
			.limit(1);

		if (!row) {
			await sendBotMessage(chatId, '❌ Ссылка недействительна или устарела. Сгенерируйте новую в панели управления.');
			return;
		}

		await db.update(telegramTokens).set({ usedAt: new Date() }).where(eq(telegramTokens.token, token));

		await db
			.insert(telegramConnections)
			.values({ userId: row.userId, chatId })
			.onConflictDoUpdate({
				target: telegramConnections.userId,
				set: { chatId, connectedAt: new Date() }
			});

		const firstName = message.from.first_name ?? 'пользователь';
		await sendBotMessage(
			chatId,
			`✅ <b>Telegram успешно привязан!</b>\n\nПривет, ${firstName}! Теперь вы будете получать уведомления об изменении цен криптовалют в этот чат.`
		);
		return;
	}

	if (text === '/start') {
		await sendBotMessage(
			chatId,
			'👋 Привет! Этот бот отправляет уведомления о ценах криптовалют.\n\nДля привязки аккаунта перейдите в панель управления и нажмите «Подключить Telegram».'
		);
	}
}
