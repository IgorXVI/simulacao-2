<script>
	import NumList from "./components/NumList.svelte";

	import { calcTable, defaultTabletEl } from "./modules/table";

	let inialTempoSimulacao = 180;

	let inialTECs = [10, 11, 12];
	let inialDefaultTEC = 0;

	let inialTSs = [9, 10, 11];
	let inialDefaultTS = 0;

	const inialTable = [defaultTabletEl];

	let initialFinalInfos = [""];

	let tempoSimulacao = inialTempoSimulacao;
	let TECs = [...inialTECs];
	let defaultTEC = inialDefaultTEC;
	let TSs = [...inialTSs];
	let defaultTS = inialDefaultTS;
	let table = [...inialTable];
	let finalInfos = initialFinalInfos;

	const calcTableClick = () => {
		const calcResult = calcTable({
			firstTableEl: table[0],
			tempoSimulacao,
			TECs,
			TSs,
		});
		finalInfos = calcResult.finalInfos;
		table = calcResult.table;
	};

	let renderTable = false;
	const unsetRenderTable = () => {
		renderTable = !renderTable;
	};

	const resetAll = () => {
		tempoSimulacao = inialTempoSimulacao;
		TECs = [...inialTECs];
		defaultTEC = inialDefaultTEC;
		TSs = [...inialTSs];
		defaultTS = inialDefaultTS;
		table = [...inialTable];
		finalInfos = initialFinalInfos;
		renderTable = false;
	};
</script>

<main>
	<div class="container">
		<div class="row padded">
			<div class="col">
				<button on:click={calcTableClick} class="btn btn-success">Simular</button>
				<button on:click={resetAll} class="btn btn-danger">Limpar</button>
			</div>
		</div>
		<div class="row padded">
			<div class="col-5">
				<div class="input-group mb-3">
					<span class="input-group-text">Tempo da Simulação (em minutos):</span>
					<input type="number" class="form-control" bind:value={tempoSimulacao} />
				</div>
			</div>
		</div>
		<div class="row padded">
			<div class="col-5">
				<NumList name="TEC" bind:nums={TECs} bind:defaultNum={defaultTEC} />
			</div>
			<div class="col-5">
				<NumList name="TS" bind:nums={TSs} bind:defaultNum={defaultTS} />
			</div>
		</div>
		<div class="row padded" hidden={finalInfos.length === 1}>
			<div class="col">
				<div class="card">
					<div class="card-header">Resultados finais</div>
					<div class="card-body">
						<blockquote class="blockquote mb-0">
							{#each finalInfos as finalInfo}
								<p>{finalInfo}</p>
							{/each}
						</blockquote>
					</div>
				</div>
			</div>
		</div>
		<div class="row padded" hidden={finalInfos.length === 1}>
			<div class="col">
				<button on:click={unsetRenderTable} class="btn" class:btn-success={!renderTable} class:btn-danger={renderTable}>
					{renderTable ? "Esconder tabela" : "Mostrar Tabela"}
				</button>
			</div>
		</div>
		{#if renderTable}
			<div class="row padded" hidden={finalInfos.length === 1}>
				<div class="col">
					<table class="table table-dark table-bordered border border-white">
						<thead>
							<tr>
								<th>Cliente</th>
								<th>Tempo desde a Ultima Chegada (minutos)</th>
								<th>Tempo de chegada no relógio</th>
								<th>Tempo do Serviço (minutos)</th>
								<th>Tempo de início do serviço no relógio</th>
								<th>Tempo do cliente na fila (minutos)</th>
								<th>Tempo final do serviço no relógio</th>
								<th>Tempo do cliente no sistema (minutos)</th>
								<th>Tempo livre do operador (minutos)</th>
							</tr>
						</thead>
						<tbody>
							{#each table as row, index}
								<tr class:last-line={index === table.length - 1}>
									<td>{row.cliente}</td>
									<td>{row.tempoDesdeAUltimaChegada}</td>
									<td>{row.tempoDeChegadaNoRelogio}</td>
									<td>{row.tempoDoServico}</td>
									<td>{row.tempoDeInicioDeServicoNoRelogio}</td>
									<td>{row.tempoDoClienteNaFila}</td>
									<td>{row.tempoFinalDoServicoNoRelogio}</td>
									<td>{row.tempoDoClienteNoSistema}</td>
									<td>{row.tempoLivreDoOperador}</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			</div>
		{/if}
	</div>
</main>

<style>
	.last-line {
		font-weight: bolder;
		color: red;
	}
</style>
