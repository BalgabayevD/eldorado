<script lang="ts">
	import { onMount } from 'svelte';
	import { Tabs, Switch, Label, Combobox, Select } from 'bits-ui';

	interface Coin {
		id: number;
		symbol: string;
		name: string;
		cmcId: number;
		enabled: boolean;
	}

	interface Alert {
		id: number;
		coinId: number;
		coinName: string;
		coinSymbol: string;
		condition: 'above' | 'below';
		targetPrice: string;
		telegramChatId: string;
		status: 'active' | 'triggered' | 'disabled';
		note: string | null;
		createdAt: string;
		triggeredAt: string | null;
	}

	interface SearchResult {
		id: number;
		name: string;
		symbol: string;
	}

	let coins = $state<Coin[]>([]);
	let alerts = $state<Alert[]>([]);
	let searchQuery = $state('');
	let searchResults = $state<SearchResult[]>([]);
	let searching = $state(false);
	let searchTimeout: ReturnType<typeof setTimeout>;

	let newAlert = $state({
		coinId: 0,
		condition: 'above' as 'above' | 'below',
		targetPrice: '',
		telegramChatId: '',
		note: ''
	});

	let selectedCoinValue = $state('');
	let selectedConditionValue = $state('above');

	const conditionOptions = [
		{ value: 'above', label: '📈 Цена выше' },
		{ value: 'below', label: '📉 Цена ниже' }
	];

	const selectedCoinLabel = $derived(
		coins.find((c) => String(c.id) === selectedCoinValue)
			? `${coins.find((c) => String(c.id) === selectedCoinValue)!.symbol} — ${coins.find((c) => String(c.id) === selectedCoinValue)!.name}`
			: 'Выберите монету'
	);

	const selectedConditionLabel = $derived(
		conditionOptions.find((o) => o.value === selectedConditionValue)?.label ?? 'Выберите условие'
	);

	async function loadCoins() {
		const res = await fetch('/api/coins');
		coins = await res.json();
	}

	async function loadAlerts() {
		const res = await fetch('/api/alerts');
		alerts = await res.json();
	}

	onMount(() => {
		loadCoins();
		loadAlerts();
	});

	function onSearchInput(e: Event) {
		searchQuery = (e.currentTarget as HTMLInputElement).value;
		clearTimeout(searchTimeout);
		if (searchQuery.length < 2) {
			searchResults = [];
			return;
		}
		searchTimeout = setTimeout(async () => {
			searching = true;
			const res = await fetch(`/api/coins/search?q=${encodeURIComponent(searchQuery)}`);
			searchResults = await res.json();
			searching = false;
		}, 300);
	}

	async function addCoin(result: SearchResult) {
		await fetch('/api/coins', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ symbol: result.symbol, name: result.name, cmcId: result.id })
		});
		searchQuery = '';
		searchResults = [];
		await loadCoins();
	}

	async function toggleCoin(coin: Coin) {
		await fetch(`/api/coins/${coin.id}`, {
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ enabled: !coin.enabled })
		});
		await loadCoins();
	}

	async function deleteCoin(id: number) {
		if (!confirm('Удалить монету и все её алерты?')) return;
		await fetch(`/api/coins/${id}`, { method: 'DELETE' });
		await loadCoins();
		await loadAlerts();
	}

	async function createAlert() {
		if (!selectedCoinValue || !newAlert.targetPrice || !newAlert.telegramChatId) return;
		await fetch('/api/alerts', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				coinId: parseInt(selectedCoinValue),
				condition: selectedConditionValue,
				targetPrice: parseFloat(newAlert.targetPrice),
				telegramChatId: newAlert.telegramChatId,
				note: newAlert.note || null
			})
		});
		selectedCoinValue = '';
		selectedConditionValue = 'above';
		newAlert = { coinId: 0, condition: 'above', targetPrice: '', telegramChatId: '', note: '' };
		await loadAlerts();
	}

	async function deleteAlert(id: number) {
		if (!confirm('Удалить алерт?')) return;
		await fetch(`/api/alerts/${id}`, { method: 'DELETE' });
		await loadAlerts();
	}

	async function reactivateAlert(id: number) {
		await fetch(`/api/alerts/${id}`, {
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ status: 'active' })
		});
		await loadAlerts();
	}

	const statusConfig: Record<string, { label: string; class: string }> = {
		active: { label: '✅ Активен', class: 'bg-emerald-100 text-emerald-700' },
		triggered: { label: '🔔 Сработал', class: 'bg-amber-100 text-amber-700' },
		disabled: { label: '⏸ Отключён', class: 'bg-gray-100 text-gray-500' }
	};
</script>

<div class="text-gray-100">
	<div class="mx-auto max-w-4xl px-6 py-10">
		<!-- Header -->
		<div class="mb-8">
			<h1 class="text-3xl font-bold tracking-tight text-white">Crypto Alerts</h1>
			<p class="mt-1 text-sm text-gray-400">Управление монетами и уведомлениями в Telegram</p>
		</div>

		<Tabs.Root value="coins">
			<!-- Tab list -->
			<Tabs.List
				class="mb-6 flex w-full gap-1 rounded-xl bg-gray-900 p-1"
			>
				<Tabs.Trigger
					value="coins"
					class="flex-1 rounded-lg px-4 py-2 text-sm font-medium text-gray-400 transition-colors data-[state=active]:bg-gray-800 data-[state=active]:text-white hover:text-gray-200"
				>
					Монеты ({coins.length})
				</Tabs.Trigger>
				<Tabs.Trigger
					value="alerts"
					class="flex-1 rounded-lg px-4 py-2 text-sm font-medium text-gray-400 transition-colors data-[state=active]:bg-gray-800 data-[state=active]:text-white hover:text-gray-200"
				>
					Алерты ({alerts.length})
				</Tabs.Trigger>
			</Tabs.List>

			<!-- Вкладка: Монеты -->
			<Tabs.Content value="coins">
				<!-- Поиск через Combobox -->
				<div class="mb-6 rounded-xl border border-gray-800 bg-gray-900 p-5">
					<h2 class="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-400">
						Добавить монету
					</h2>

					<Combobox.Root type="single">
						<div class="relative">
							<Combobox.Input
								class="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
								placeholder="Поиск: ETH, Bitcoin..."
								oninput={onSearchInput}
							/>
							{#if searching}
								<div class="absolute top-1/2 right-3 -translate-y-1/2">
									<div class="h-4 w-4 animate-spin rounded-full border-2 border-blue-500 border-t-transparent"></div>
								</div>
							{/if}
						</div>

						{#if searchResults.length > 0}
							<Combobox.Portal>
								<Combobox.Content
									class="z-50 mt-1 w-full rounded-lg border border-gray-700 bg-gray-800 shadow-xl"
									sideOffset={4}
								>
									<Combobox.Viewport class="p-1">
										{#each searchResults as result (result.id)}
											<Combobox.Item
												value={String(result.id)}
												label={result.symbol}
												class="flex cursor-pointer items-center justify-between rounded-md px-3 py-2.5 text-sm hover:bg-gray-700"
												onselect={() => addCoin(result)}
											>
												<div class="flex items-center gap-3">
													<span class="font-bold text-white">{result.symbol}</span>
													<span class="text-gray-400">{result.name}</span>
												</div>
												<span class="text-xs text-blue-400">+ Добавить</span>
											</Combobox.Item>
										{/each}
									</Combobox.Viewport>
								</Combobox.Content>
							</Combobox.Portal>
						{/if}
					</Combobox.Root>
				</div>

				<!-- Список монет -->
				<div class="space-y-2">
					{#each coins as coin (coin.id)}
						<div
							class="flex items-center justify-between rounded-xl border border-gray-800 bg-gray-900 px-5 py-4 transition-opacity {coin.enabled ? '' : 'opacity-50'}"
						>
							<div class="flex items-center gap-4">
								<div class="flex h-9 w-9 items-center justify-center rounded-full bg-gray-800 text-xs font-bold text-blue-400">
									{coin.symbol.slice(0, 3)}
								</div>
								<div>
									<div class="font-semibold text-white">{coin.symbol}</div>
									<div class="text-xs text-gray-500">{coin.name} · CMC #{coin.cmcId}</div>
								</div>
							</div>

							<div class="flex items-center gap-4">
								<div class="flex items-center gap-2">
									<Switch.Root
										checked={coin.enabled}
										onCheckedChange={() => toggleCoin(coin)}
										class="inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent bg-gray-700 transition-colors data-[state=checked]:bg-blue-500"
									>
										<Switch.Thumb
											class="pointer-events-none block h-4 w-4 rounded-full bg-white shadow-lg transition-transform data-[state=checked]:translate-x-4 data-[state=unchecked]:translate-x-0"
										/>
									</Switch.Root>
									<span class="text-xs text-gray-400">{coin.enabled ? 'Вкл' : 'Выкл'}</span>
								</div>
								<button
									onclick={() => deleteCoin(coin.id)}
									class="rounded-lg px-3 py-1.5 text-xs text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors"
								>
									Удалить
								</button>
							</div>
						</div>
					{:else}
						<div class="rounded-xl border border-dashed border-gray-800 py-12 text-center text-gray-500">
							Нет монет. Добавьте первую через поиск выше.
						</div>
					{/each}
				</div>
			</Tabs.Content>

			<!-- Вкладка: Алерты -->
			<Tabs.Content value="alerts">
				<!-- Форма создания алерта -->
				<div class="mb-6 rounded-xl border border-gray-800 bg-gray-900 p-5">
					<h2 class="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-400">
						Создать алерт
					</h2>

					<div class="grid grid-cols-2 gap-3">
						<!-- Select монеты -->
						<div>
							<Label.Root for="alert-coin" class="mb-1.5 block text-sm text-gray-400">Монета</Label.Root>
							<Select.Root type="single" bind:value={selectedCoinValue}>
								<Select.Trigger
									id="alert-coin"
									class="flex w-full items-center justify-between rounded-lg border border-gray-700 bg-gray-800 px-4 py-2.5 text-sm text-white focus:border-blue-500 focus:outline-none"
								>
									<span class={selectedCoinValue ? 'text-white' : 'text-gray-500'}>
										{selectedCoinLabel}
									</span>
									<span class="text-gray-500">▾</span>
								</Select.Trigger>
								<Select.Portal>
									<Select.Content
										class="z-50 rounded-lg border border-gray-700 bg-gray-800 shadow-xl"
										sideOffset={4}
									>
										<Select.Viewport class="p-1">
											{#each coins.filter((c) => c.enabled) as coin (coin.id)}
												<Select.Item
													value={String(coin.id)}
													label={`${coin.symbol} — ${coin.name}`}
													class="cursor-pointer rounded-md px-3 py-2 text-sm text-gray-200 hover:bg-gray-700 data-[highlighted]:bg-gray-700"
												>
													{#snippet children({ selected })}
														<div class="flex items-center gap-2">
															{#if selected}<span class="text-blue-400">✓</span>{/if}
															<span class="font-medium">{coin.symbol}</span>
															<span class="text-gray-400">{coin.name}</span>
														</div>
													{/snippet}
												</Select.Item>
											{/each}
										</Select.Viewport>
									</Select.Content>
								</Select.Portal>
							</Select.Root>
						</div>

						<!-- Select условия -->
						<div>
							<Label.Root for="alert-condition" class="mb-1.5 block text-sm text-gray-400">Условие</Label.Root>
							<Select.Root type="single" bind:value={selectedConditionValue}>
								<Select.Trigger
									id="alert-condition"
									class="flex w-full items-center justify-between rounded-lg border border-gray-700 bg-gray-800 px-4 py-2.5 text-sm text-white focus:border-blue-500 focus:outline-none"
								>
									<span>{selectedConditionLabel}</span>
									<span class="text-gray-500">▾</span>
								</Select.Trigger>
								<Select.Portal>
									<Select.Content
										class="z-50 rounded-lg border border-gray-700 bg-gray-800 shadow-xl"
										sideOffset={4}
									>
										<Select.Viewport class="p-1">
											{#each conditionOptions as option (option.value)}
												<Select.Item
													value={option.value}
													label={option.label}
													class="cursor-pointer rounded-md px-3 py-2 text-sm text-gray-200 hover:bg-gray-700 data-[highlighted]:bg-gray-700"
												>
													{#snippet children({ selected })}
														<div class="flex items-center gap-2">
															{#if selected}<span class="text-blue-400">✓</span>{/if}
															{option.label}
														</div>
													{/snippet}
												</Select.Item>
											{/each}
										</Select.Viewport>
									</Select.Content>
								</Select.Portal>
							</Select.Root>
						</div>

						<!-- Целевая цена -->
						<div>
							<Label.Root for="alert-price" class="mb-1.5 block text-sm text-gray-400">
								Целевая цена (USD)
							</Label.Root>
							<input
								id="alert-price"
								type="number"
								placeholder="например 4000"
								bind:value={newAlert.targetPrice}
								class="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
							/>
						</div>

						<!-- Telegram Chat ID -->
						<div>
							<Label.Root for="alert-chat" class="mb-1.5 block text-sm text-gray-400">
								Telegram Chat ID
							</Label.Root>
							<input
								id="alert-chat"
								type="text"
								placeholder="например 123456789"
								bind:value={newAlert.telegramChatId}
								class="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
							/>
						</div>

						<!-- Заметка -->
						<div class="col-span-2">
							<Label.Root for="alert-note" class="mb-1.5 block text-sm text-gray-400">
								Заметка (необязательно)
							</Label.Root>
							<input
								id="alert-note"
								type="text"
								placeholder="например: Buy signal"
								bind:value={newAlert.note}
								class="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
							/>
						</div>
					</div>

					<button
						onclick={createAlert}
						disabled={!selectedCoinValue || !newAlert.targetPrice || !newAlert.telegramChatId}
						class="mt-4 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-40"
					>
						Создать алерт
					</button>
				</div>

				<!-- Список алертов -->
				<div class="space-y-2">
					{#each alerts as alert (alert.id)}
						<div class="rounded-xl border border-gray-800 bg-gray-900 px-5 py-4">
							<div class="flex items-start justify-between">
								<div class="flex items-start gap-4">
									<div class="flex h-9 w-9 items-center justify-center rounded-full bg-gray-800 text-xs font-bold text-blue-400">
										{alert.coinSymbol.slice(0, 3)}
									</div>
									<div>
										<div class="flex items-center gap-2">
											<span class="font-semibold text-white">{alert.coinSymbol}</span>
											<span class="text-sm text-gray-400">
												{alert.condition === 'above' ? '📈 выше' : '📉 ниже'}
												<span class="font-medium text-white">
													${parseFloat(alert.targetPrice).toLocaleString('en-US')}
												</span>
											</span>
											<span
												class="rounded-full px-2.5 py-0.5 text-xs font-medium {statusConfig[alert.status]?.class}"
											>
												{statusConfig[alert.status]?.label}
											</span>
										</div>
										<div class="mt-1 text-xs text-gray-500">
											Chat ID: {alert.telegramChatId}
											{#if alert.note}<span class="ml-2">· {alert.note}</span>{/if}
										</div>
										{#if alert.triggeredAt}
											<div class="mt-1 text-xs text-gray-600">
												Сработал: {new Date(alert.triggeredAt).toLocaleString('ru-RU')}
											</div>
										{/if}
									</div>
								</div>

								<div class="flex shrink-0 gap-2">
									{#if alert.status === 'triggered'}
										<button
											onclick={() => reactivateAlert(alert.id)}
											class="rounded-lg px-3 py-1.5 text-xs text-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-300 transition-colors"
										>
											Снова активен
										</button>
									{/if}
									<button
										onclick={() => deleteAlert(alert.id)}
										class="rounded-lg px-3 py-1.5 text-xs text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors"
									>
										Удалить
									</button>
								</div>
							</div>
						</div>
					{:else}
						<div class="rounded-xl border border-dashed border-gray-800 py-12 text-center text-gray-500">
							Нет алертов. Создайте первый выше.
						</div>
					{/each}
				</div>
			</Tabs.Content>
		</Tabs.Root>
	</div>
</div>
