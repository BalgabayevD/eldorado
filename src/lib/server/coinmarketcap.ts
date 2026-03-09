import { env } from '$env/dynamic/private';

const BASE_URL = 'https://pro-api.coinmarketcap.com/v1';

interface CmcQuote {
	price: number;
	volume_24h: number;
	percent_change_24h: number;
	market_cap: number;
	last_updated: string;
}

interface CmcCoin {
	id: number;
	name: string;
	symbol: string;
	quote: {
		USD: CmcQuote;
	};
}

interface CmcPriceResponse {
	data: Record<string, CmcCoin>;
}

interface CmcSearchResult {
	id: number;
	name: string;
	symbol: string;
	slug: string;
}

interface CmcMapResponse {
	data: CmcSearchResult[];
}

async function cmcFetch<T>(path: string, params: Record<string, string> = {}): Promise<T> {
	const url = new URL(`${BASE_URL}${path}`);
	for (const [key, value] of Object.entries(params)) {
		url.searchParams.set(key, value);
	}

	const response = await fetch(url.toString(), {
		headers: {
			'X-CMC_PRO_API_KEY': env.COINMARKETCAP_API_KEY,
			Accept: 'application/json'
		}
	});

	if (!response.ok) {
		throw new Error(`CoinMarketCap API error: ${response.status} ${response.statusText}`);
	}

	return response.json() as Promise<T>;
}

// Получить цены по CMC ID монет
export async function getPrices(cmcIds: number[]): Promise<Record<number, number>> {
	if (cmcIds.length === 0) return {};

	const data = await cmcFetch<CmcPriceResponse>('/cryptocurrency/quotes/latest', {
		id: cmcIds.join(','),
		convert: 'USD'
	});

	const result: Record<number, number> = {};
	for (const coin of Object.values(data.data)) {
		result[coin.id] = coin.quote.USD.price;
	}
	return result;
}

// Поиск монет по названию/символу для добавления в админку
export async function searchCoins(query: string): Promise<CmcSearchResult[]> {
	const data = await cmcFetch<CmcMapResponse>('/cryptocurrency/map', {
		listing_status: 'active',
		limit: '20',
		sort: 'cmc_rank'
	});

	const q = query.toLowerCase();
	return data.data.filter(
		(c) => c.symbol.toLowerCase().includes(q) || c.name.toLowerCase().includes(q)
	);
}
