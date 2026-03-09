import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db/index';
import { alerts } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import type { RequestHandler } from './$types';

// PATCH /api/alerts/:id - изменить статус алерта
export const PATCH: RequestHandler = async ({ params, request }) => {
	const id = parseInt(params.id);
	const body = await request.json();

	const [updated] = await db
		.update(alerts)
		.set({ status: body.status })
		.where(eq(alerts.id, id))
		.returning();

	return json(updated);
};

// DELETE /api/alerts/:id - удалить алерт
export const DELETE: RequestHandler = async ({ params }) => {
	const id = parseInt(params.id);
	await db.delete(alerts).where(eq(alerts.id, id));
	return json({ ok: true });
};
