import {
	pgTable,
	serial,
	text,
	numeric,
	timestamp,
	boolean,
	pgEnum,
	integer
} from 'drizzle-orm/pg-core';

export const alertConditionEnum = pgEnum('alert_condition', ['above', 'below']);
export const alertStatusEnum = pgEnum('alert_status', ['active', 'triggered', 'disabled']);

// Монеты которые отслеживаем
export const coins = pgTable('coins', {
	id: serial('id').primaryKey(),
	symbol: text('symbol').notNull().unique(), // ETH, BTC, etc.
	name: text('name').notNull(), // Ethereum, Bitcoin, etc.
	cmcId: integer('cmc_id').notNull(), // CoinMarketCap ID (числовой)
	enabled: boolean('enabled').notNull().default(true),
	createdAt: timestamp('created_at').notNull().defaultNow()
});

// Алерты: при каком условии слать уведомление
export const alerts = pgTable('alerts', {
	id: serial('id').primaryKey(),
	coinId: integer('coin_id')
		.notNull()
		.references(() => coins.id, { onDelete: 'cascade' }),
	condition: alertConditionEnum('condition').notNull(), // above | below
	targetPrice: numeric('target_price', { precision: 20, scale: 8 }).notNull(),
	telegramChatId: text('telegram_chat_id').notNull(),
	status: alertStatusEnum('status').notNull().default('active'),
	note: text('note'),
	createdAt: timestamp('created_at').notNull().defaultNow(),
	triggeredAt: timestamp('triggered_at')
});

// Одноразовые токены для привязки Telegram
export const telegramTokens = pgTable('telegram_tokens', {
	token: text('token').primaryKey(),
	userId: text('user_id').notNull(),
	expiresAt: timestamp('expires_at').notNull(),
	usedAt: timestamp('used_at')
});

// Привязка пользователя к Telegram chat ID
export const telegramConnections = pgTable('telegram_connections', {
	userId: text('user_id').primaryKey(),
	chatId: text('chat_id').notNull(),
	connectedAt: timestamp('connected_at').notNull().defaultNow()
});

// Лог последних цен
export const priceHistory = pgTable('price_history', {
	id: serial('id').primaryKey(),
	coinId: integer('coin_id')
		.notNull()
		.references(() => coins.id, { onDelete: 'cascade' }),
	price: numeric('price', { precision: 20, scale: 8 }).notNull(),
	checkedAt: timestamp('checked_at').notNull().defaultNow()
});

export * from './auth.schema';
