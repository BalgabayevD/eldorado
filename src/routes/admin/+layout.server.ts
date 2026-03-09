import { redirect } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { telegramConnections } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals }) => {
	if (!locals.user) {
		redirect(302, '/login');
	}

	const [telegramConnection] = await db
		.select()
		.from(telegramConnections)
		.where(eq(telegramConnections.userId, locals.user.id))
		.limit(1);

	return {
		user: locals.user,
		telegramChatId: telegramConnection?.chatId ?? null
	};
};
