import { json } from '@sveltejs/kit';
import { searchCoins } from '$lib/server/coinmarketcap';
import type { RequestHandler } from './$types';

// GET /api/coins/search?q=eth - поиск монет через CoinMarketCap
export const GET: RequestHandler = async ({ url }) => {
	const q = url.searchParams.get('q') ?? '';
	if (q.length < 2) return json([]);

	const results = await searchCoins(q);
	return json(results);
};
