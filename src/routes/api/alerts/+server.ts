import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db/index';
import { alerts, coins } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import type { RequestHandler } from './$types';

// GET /api/alerts - все алерты с данными монеты
export const GET: RequestHandler = async () => {
	const all = await db
		.select({
			id: alerts.id,
			condition: alerts.condition,
			targetPrice: alerts.targetPrice,
			telegramChatId: alerts.telegramChatId,
			status: alerts.status,
			note: alerts.note,
			createdAt: alerts.createdAt,
			triggeredAt: alerts.triggeredAt,
			coinId: coins.id,
			coinName: coins.name,
			coinSymbol: coins.symbol
		})
		.from(alerts)
		.innerJoin(coins, eq(alerts.coinId, coins.id))
		.orderBy(alerts.createdAt);

	return json(all);
};

// POST /api/alerts - создать алерт
export const POST: RequestHandler = async ({ request }) => {
	const body = await request.json();
	const { coinId, condition, targetPrice, telegramChatId, note } = body as {
		coinId: number;
		condition: 'above' | 'below';
		targetPrice: number;
		telegramChatId: string;
		note?: string;
	};

	if (!coinId || !condition || !targetPrice || !telegramChatId) {
		return json({ error: 'coinId, condition, targetPrice и telegramChatId обязательны' }, { status: 400 });
	}

	const [alert] = await db
		.insert(alerts)
		.values({
			coinId,
			condition,
			targetPrice: targetPrice.toString(),
			telegramChatId,
			note: note || null
		})
		.returning();

	return json(alert, { status: 201 });
};
