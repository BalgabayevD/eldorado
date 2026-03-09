<script lang="ts">
	import { authClient } from '$lib/auth-client';
	import { goto } from '$app/navigation';
	import { Label } from 'bits-ui';
	import { localizeHref } from '$lib/paraglide/runtime';

	let email = $state('');
	let password = $state('');
	let error = $state('');
	let loading = $state(false);

	async function login() {
		error = '';
		loading = true;
		const { error: err } = await authClient.signIn.email({ email, password });
		loading = false;

		if (err) {
			error = err.message ?? 'Ошибка входа';
			return;
		}

		goto(localizeHref('/admin'));
	}
</script>

<div class="flex min-h-screen items-center justify-center bg-gray-950">
	<div class="w-full max-w-sm">
		<div class="mb-8 text-center">
			<h1 class="text-2xl font-bold text-white">Crypto Alerts</h1>
			<p class="mt-1 text-sm text-gray-400">Войдите в аккаунт</p>
		</div>

		<div class="rounded-xl border border-gray-800 bg-gray-900 p-6">
			<form onsubmit={(e) => { e.preventDefault(); login(); }} class="space-y-4">
				<div>
					<Label.Root for="email" class="mb-1.5 block text-sm text-gray-400">Email</Label.Root>
					<input
						id="email"
						type="email"
						bind:value={email}
						required
						placeholder="you@example.com"
						class="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
					/>
				</div>

				<div>
					<Label.Root for="password" class="mb-1.5 block text-sm text-gray-400">Пароль</Label.Root>
					<input
						id="password"
						type="password"
						bind:value={password}
						required
						placeholder="••••••••"
						class="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
					/>
				</div>

				{#if error}
					<p class="rounded-lg bg-red-500/10 px-4 py-2.5 text-sm text-red-400">{error}</p>
				{/if}

				<button
					type="submit"
					disabled={loading}
					class="w-full rounded-lg bg-blue-600 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
				>
					{loading ? 'Вход...' : 'Войти'}
				</button>
			</form>

			<div class="mt-4 text-center text-sm text-gray-500">
				Нет аккаунта?
				<a href={localizeHref('/register')} class="text-blue-400 hover:text-blue-300">
					Зарегистрироваться
				</a>
			</div>
		</div>
	</div>
</div>
