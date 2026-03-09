<script lang="ts">
	import { authClient } from '$lib/auth-client';
	import { Label } from 'bits-ui';
	import { localizeHref } from '$lib/paraglide/runtime';

	let name = $state('');
	let email = $state('');
	let password = $state('');
	let error = $state('');
	let success = $state('');
	let loading = $state(false);

	async function register() {
		error = '';
		success = '';
		loading = true;

		const { error: err } = await authClient.signUp.email({ name, email, password });
		loading = false;

		if (err) {
			error = err.message ?? 'Ошибка регистрации';
			return;
		}

		success = 'Аккаунт создан! Проверьте email для подтверждения.';
	}
</script>

<div class="flex min-h-screen items-center justify-center bg-gray-950">
	<div class="w-full max-w-sm">
		<div class="mb-8 text-center">
			<h1 class="text-2xl font-bold text-white">Crypto Alerts</h1>
			<p class="mt-1 text-sm text-gray-400">Создайте аккаунт</p>
		</div>

		<div class="rounded-xl border border-gray-800 bg-gray-900 p-6">
			{#if success}
				<div class="rounded-lg bg-emerald-500/10 px-4 py-4 text-center">
					<p class="text-sm text-emerald-400">{success}</p>
					<a
						href={localizeHref('/login')}
						class="mt-3 inline-block text-sm text-blue-400 hover:text-blue-300"
					>
						Перейти к входу →
					</a>
				</div>
			{:else}
				<form onsubmit={(e) => { e.preventDefault(); register(); }} class="space-y-4">
					<div>
						<Label.Root for="name" class="mb-1.5 block text-sm text-gray-400">Имя</Label.Root>
						<input
							id="name"
							type="text"
							bind:value={name}
							required
							placeholder="Иван"
							class="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
						/>
					</div>

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
							minlength={8}
							placeholder="минимум 8 символов"
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
						{loading ? 'Создание...' : 'Зарегистрироваться'}
					</button>
				</form>

				<div class="mt-4 text-center text-sm text-gray-500">
					Уже есть аккаунт?
					<a href={localizeHref('/login')} class="text-blue-400 hover:text-blue-300">Войти</a>
				</div>
			{/if}
		</div>
	</div>
</div>
