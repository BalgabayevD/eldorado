import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { coins } from '$lib/server/db/schema';
import type { RequestHandler } from './$types';

// GET /api/coins - список всех монет
export const GET: RequestHandler = async () => {
	const all = await db.select().from(coins).orderBy(coins.symbol);
	return json(all);
};

// POST /api/coins - добавить монету
export const POST: RequestHandler = async ({ request }) => {
	const body = await request.json();
	const { symbol, name, cmcId } = body as { symbol: string; name: string; cmcId: number };

	if (!symbol || !name || !cmcId) {
		return json({ error: 'symbol, name и cmcId обязательны' }, { status: 400 });
	}

	const [coin] = await db
		.insert(coins)
		.values({ symbol: symbol.toUpperCase(), name, cmcId })
		.returning();

	return json(coin, { status: 201 });
};
