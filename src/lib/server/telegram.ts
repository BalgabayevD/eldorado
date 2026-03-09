import { env } from '$env/dynamic/private';

const BASE_URL = `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN ?? ''}`;

export async function sendMessage(chatId: string, text: string): Promise<void> {
	const response = await fetch(`${BASE_URL}/sendMessage`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({
			chat_id: chatId,
			text,
			parse_mode: 'HTML'
		})
	});

	if (!response.ok) {
		const body = await response.text();
		throw new Error(`Telegram API error: ${response.status} - ${body}`);
	}
}

export function formatAlertMessage(params: {
	coinName: string;
	symbol: string;
	condition: 'above' | 'below';
	targetPrice: number;
	currentPrice: number;
	note?: string | null;
}): string {
	const { coinName, symbol, condition, targetPrice, currentPrice, note } = params;
	const arrow = condition === 'above' ? '📈' : '📉';
	const conditionText = condition === 'above' ? 'превысила' : 'упала ниже';

	let message = `${arrow} <b>Алерт сработал!</b>\n\n`;
	message += `<b>${coinName} (${symbol})</b>\n`;
	message += `Цена ${conditionText} <b>$${targetPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</b>\n`;
	message += `Текущая цена: <b>$${currentPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</b>`;

	if (note) {
		message += `\n\n📝 ${note}`;
	}

	return message;
}
