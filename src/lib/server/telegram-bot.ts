import { env } from '$env/dynamic/private';

const BASE_URL = `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN ?? ''}`;

export async function getBotUsername(): Promise<string> {
	const res = await fetch(`${BASE_URL}/getMe`);
	const data = await res.json();
	return data.result?.username ?? 'your_bot';
}

export async function setWebhook(webhookUrl: string): Promise<boolean> {
	const res = await fetch(`${BASE_URL}/setWebhook`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ url: webhookUrl })
	});
	const data = await res.json();
	return data.ok;
}

export async function deleteWebhook(): Promise<boolean> {
	const res = await fetch(`${BASE_URL}/deleteWebhook`, { method: 'POST' });
	const data = await res.json();
	return data.ok;
}

export async function getUpdates(offset?: number): Promise<TelegramUpdate[]> {
	const params = new URLSearchParams({ timeout: '0', limit: '100' });
	if (offset !== undefined) params.set('offset', String(offset));

	const res = await fetch(`${BASE_URL}/getUpdates?${params}`);
	const data = await res.json();
	return data.ok ? data.result : [];
}

export async function sendBotMessage(chatId: string, text: string): Promise<void> {
	await fetch(`${BASE_URL}/sendMessage`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' })
	});
}

export interface TelegramUpdate {
	update_id: number;
	message?: {
		message_id: number;
		from?: { id: number; username?: string; first_name?: string };
		chat: { id: number; type: string };
		text?: string;
	};
}
