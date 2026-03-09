import { db } from './db/index';
import { alerts, coins, priceHistory } from './db/schema';
import { eq, and, inArray } from 'drizzle-orm';
import { getPrices } from './coinmarketcap';
import { sendMessage, formatAlertMessage } from './telegram';

export async function checkAlerts(): Promise<{ checked: number; triggered: number }> {
	// Получаем все включённые монеты с активными алертами
	const activeAlerts = await db
		.select({
			alertId: alerts.id,
			alertCondition: alerts.condition,
			alertTargetPrice: alerts.targetPrice,
			alertChatId: alerts.telegramChatId,
			alertNote: alerts.note,
			coinId: coins.id,
			coinName: coins.name,
			coinSymbol: coins.symbol,
			coinCmcId: coins.cmcId
		})
		.from(alerts)
		.innerJoin(coins, eq(alerts.coinId, coins.id))
		.where(and(eq(alerts.status, 'active'), eq(coins.enabled, true)));

	if (activeAlerts.length === 0) return { checked: 0, triggered: 0 };

	// Уникальные CMC ID
	const cmcIds = [...new Set(activeAlerts.map((a) => a.coinCmcId))];
	const prices = await getPrices(cmcIds);

	// Сохраняем историю цен
	const uniqueCoins = [...new Map(activeAlerts.map((a) => [a.coinId, a])).values()];
	for (const coin of uniqueCoins) {
		const price = prices[coin.coinCmcId];
		if (price !== undefined) {
			await db.insert(priceHistory).values({
				coinId: coin.coinId,
				price: price.toString()
			});
		}
	}

	// Проверяем условия алертов
	let triggered = 0;
	const triggeredIds: number[] = [];

	for (const alert of activeAlerts) {
		const currentPrice = prices[alert.coinCmcId];
		if (currentPrice === undefined) continue;

		const targetPrice = parseFloat(alert.alertTargetPrice);
		const conditionMet =
			alert.alertCondition === 'above'
				? currentPrice >= targetPrice
				: currentPrice <= targetPrice;

		if (conditionMet) {
			try {
				const message = formatAlertMessage({
					coinName: alert.coinName,
					symbol: alert.coinSymbol,
					condition: alert.alertCondition,
					targetPrice,
					currentPrice,
					note: alert.alertNote
				});
				await sendMessage(alert.alertChatId, message);
				triggeredIds.push(alert.alertId);
				triggered++;
			} catch (err) {
				console.error(`Failed to send alert ${alert.alertId}:`, err);
			}
		}
	}

	// Помечаем сработавшие алерты
	if (triggeredIds.length > 0) {
		await db
			.update(alerts)
			.set({ status: 'triggered', triggeredAt: new Date() })
			.where(inArray(alerts.id, triggeredIds));
	}

	return { checked: activeAlerts.length, triggered };
}
