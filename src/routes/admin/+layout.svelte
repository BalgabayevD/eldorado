<script lang="ts">
	import { authClient } from '$lib/auth-client';
	import { goto, invalidateAll } from '$app/navigation';
	import { localizeHref } from '$lib/paraglide/runtime';
	import { Popover } from 'bits-ui';

	let { data, children } = $props();

	let telegramChatId = $derived(data.telegramChatId);
	let generatedLink = $state('');
	let linkExpiry = $state(0);
	let linkLoading = $state(false);
	let testLoading = $state(false);
	let testResult = $state<'success' | 'error' | null>(null);
	let pollLoading = $state(false);
	let pollResult = $state<{ processed: number } | null>(null);
	let countdownInterval: ReturnType<typeof setInterval>;

	async function logout() {
		await authClient.signOut();
		goto(localizeHref('/login'));
	}

	async function generateLink() {
		linkLoading = true;
		const res = await fetch('/api/telegram/link', { method: 'POST' });
		const data = await res.json();
		linkLoading = false;

		generatedLink = data.link;
		linkExpiry = data.expiresIn; // seconds

		clearInterval(countdownInterval);
		countdownInterval = setInterval(() => {
			linkExpiry--;
			if (linkExpiry <= 0) {
				clearInterval(countdownInterval);
				generatedLink = '';
			}
		}, 1000);
	}

	async function disconnectTelegram() {
		await fetch('/api/telegram/connection', { method: 'DELETE' });
		await invalidateAll();
	}

	function formatCountdown(seconds: number): string {
		const m = Math.floor(seconds / 60);
		const s = seconds % 60;
		return `${m}:${s.toString().padStart(2, '0')}`;
	}

	async function copyLink() {
		await navigator.clipboard.writeText(generatedLink);
	}

	async function pollUpdates() {
		pollLoading = true;
		pollResult = null;
		const res = await fetch('/api/telegram/poll', { method: 'POST' });
		const data = await res.json();
		pollLoading = false;
		if (res.ok) {
			pollResult = { processed: data.processed };
			await invalidateAll(); // обновляем статус подключения
			setTimeout(() => (pollResult = null), 4000);
		}
	}

	async function sendTestNotification() {
		testLoading = true;
		testResult = null;
		const res = await fetch('/api/telegram/test', { method: 'POST' });
		testLoading = false;
		testResult = res.ok ? 'success' : 'error';
		setTimeout(() => (testResult = null), 3000);
	}
</script>

<div class="min-h-screen bg-gray-950">
	<!-- Topbar -->
	<header class="border-b border-gray-800 bg-gray-900">
		<div class="mx-auto flex max-w-4xl items-center justify-between px-6 py-3">
			<span class="text-sm font-medium text-gray-300">{data.user.email}</span>

			<div class="flex items-center gap-3">
				<!-- Telegram статус / кнопка подключения -->
				<Popover.Root>
					<Popover.Trigger
						class="flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs transition-colors {telegramChatId
							? 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
							: 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'}"
					>
						<svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor">
							<path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12l-6.871 4.326-2.962-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.194 1.006.131.833.941z"/>
						</svg>
						{#if telegramChatId}
							Подключён
						{:else}
							Подключить Telegram
						{/if}
					</Popover.Trigger>

					<Popover.Portal>
						<Popover.Content
							class="z-50 w-80 rounded-xl border border-gray-700 bg-gray-900 p-4 shadow-xl"
							sideOffset={8}
							align="end"
						>
							{#if telegramChatId}
								<!-- Уже подключён -->
								<div class="mb-4">
									<p class="text-sm font-medium text-white">Telegram подключён</p>
									<p class="mt-1 text-xs text-gray-400">Chat ID: <span class="font-mono text-gray-300">{telegramChatId}</span></p>
								</div>

								<button
									onclick={sendTestNotification}
									disabled={testLoading}
									class="mb-2 w-full rounded-lg bg-blue-600 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-500 disabled:opacity-50"
								>
									{#if testLoading}
										Отправка...
									{:else if testResult === 'success'}
										✅ Отправлено!
									{:else if testResult === 'error'}
										❌ Ошибка отправки
									{:else}
										🔔 Тестовое уведомление
									{/if}
								</button>

								<button
									onclick={disconnectTelegram}
									class="w-full rounded-lg bg-red-500/10 py-2 text-sm text-red-400 transition-colors hover:bg-red-500/20"
								>
									Отвязать Telegram
								</button>
							{:else}
								<!-- Не подключён -->
								<div class="mb-3">
									<p class="text-sm font-medium text-white">Подключить Telegram</p>
									<p class="mt-1 text-xs text-gray-400">
										Сгенерируйте ссылку и перейдите по ней в боте — ваш Chat ID будет привязан автоматически.
									</p>
								</div>

								{#if generatedLink}
									<div class="mb-3 rounded-lg bg-gray-800 p-3">
										<div class="flex items-center justify-between gap-2">
											<p class="truncate text-xs font-mono text-blue-400">{generatedLink}</p>
											<button
												onclick={copyLink}
												class="shrink-0 text-xs text-gray-400 hover:text-white"
												title="Скопировать"
											>
												📋
											</button>
										</div>
										<p class="mt-2 text-xs text-gray-500">
											Действует {formatCountdown(linkExpiry)}
										</p>
									</div>
									<a
										href={generatedLink}
										target="_blank"
										rel="noopener noreferrer"
										class="mb-2 flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-500"
									>
										Открыть в Telegram
									</a>
									<button
										onclick={generateLink}
										class="w-full rounded-lg py-1.5 text-xs text-gray-400 hover:text-white"
									>
										Обновить ссылку
									</button>
								{:else}
									<button
										onclick={generateLink}
										disabled={linkLoading}
										class="mb-2 w-full rounded-lg bg-blue-600 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-500 disabled:opacity-50"
									>
										{linkLoading ? 'Генерация...' : 'Сгенерировать ссылку'}
									</button>
								{/if}

								<div class="mt-3 border-t border-gray-800 pt-3">
									<p class="mb-2 text-xs text-gray-500">Уже нажали /start в боте?</p>
									<button
										onclick={pollUpdates}
										disabled={pollLoading}
										class="w-full rounded-lg bg-gray-800 py-2 text-sm text-gray-300 transition-colors hover:bg-gray-700 disabled:opacity-50"
									>
										{#if pollLoading}
											Проверка...
										{:else if pollResult}
											✅ Обработано: {pollResult.processed} обновлений
										{:else}
											↻ Проверить подключение
										{/if}
									</button>
								</div>
							{/if}
						</Popover.Content>
					</Popover.Portal>
				</Popover.Root>

				<button
					onclick={logout}
					class="rounded-lg px-3 py-1.5 text-xs text-gray-400 transition-colors hover:bg-gray-800 hover:text-white"
				>
					Выйти
				</button>
			</div>
		</div>
	</header>

	{@render children()}
</div>
