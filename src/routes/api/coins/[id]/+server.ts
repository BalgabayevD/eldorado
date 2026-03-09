import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db/index';
import { coins } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import type { RequestHandler } from './$types';

// PATCH /api/coins/:id - включить/выключить монету
export const PATCH: RequestHandler = async ({ params, request }) => {
	const id = parseInt(params.id);
	const body = await request.json();

	const [updated] = await db
		.update(coins)
		.set({ enabled: body.enabled })
		.where(eq(coins.id, id))
		.returning();

	return json(updated);
};

// DELETE /api/coins/:id - удалить монету
export const DELETE: RequestHandler = async ({ params }) => {
	const id = parseInt(params.id);
	await db.delete(coins).where(eq(coins.id, id));
	return json({ ok: true });
};
