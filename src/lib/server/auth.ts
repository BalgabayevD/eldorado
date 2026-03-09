import { betterAuth } from 'better-auth/minimal';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { sveltekitCookies } from 'better-auth/svelte-kit';
import { env } from '$env/dynamic/private';
import { getRequestEvent } from '$app/server';
import { db } from '$lib/server/db';
import { Resend } from 'resend';

const resend = new Resend(env.RESEND_API_KEY);

export const auth = betterAuth({
	baseURL: env.ORIGIN,
	secret: env.BETTER_AUTH_SECRET,
	database: drizzleAdapter(db, { provider: 'pg' }),
	emailAndPassword: {
		enabled: true,
		requireEmailVerification: true,
		sendResetPassword: async ({ user, url }) => {
			await resend.emails.send({
				from: 'Crypto Alerts <onboarding@resend.dev>',
				to: user.email,
				subject: 'Сброс пароля',
				html: `
					<h2>Сброс пароля</h2>
					<p>Нажмите на ссылку ниже чтобы сбросить пароль:</p>
					<a href="${url}" style="display:inline-block;padding:12px 24px;background:#2563eb;color:#fff;border-radius:8px;text-decoration:none;">Сбросить пароль</a>
					<p>Ссылка действительна 1 час.</p>
				`
			});
		}
	},
	emailVerification: {
		sendVerificationEmail: async ({ user, url }) => {
			await resend.emails.send({
				from: 'Crypto Alerts <onboarding@resend.dev>',
				to: user.email,
				subject: 'Подтвердите email',
				html: `
					<h2>Подтвердите ваш email</h2>
					<p>Нажмите на кнопку ниже для подтверждения:</p>
					<a href="${url}" style="display:inline-block;padding:12px 24px;background:#2563eb;color:#fff;border-radius:8px;text-decoration:none;">Подтвердить email</a>
					<p>Если вы не регистрировались — проигнорируйте это письмо.</p>
				`
			});
		},
		sendOnSignUp: true
	},
	plugins: [sveltekitCookies(getRequestEvent)] // make sure this is the last plugin in the array
});
