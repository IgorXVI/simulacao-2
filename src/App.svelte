<script>
	import NumList from "./components/NumList.svelte";

	let inialTempoSimulacao = 180;

	let inialTECs = [10, 11, 12];
	let inialDefaultTEC = 0;

	let inialTSs = [9, 10, 11];
	let inialDefaultTS = 0;

	const inialTable = [
		{
			cliente: 0,
			tempoDesdeAUltimaChegada: 0,
			tempoDeChegadaNoRelogio: 0,
			tempoDoServico: 0,
			tempoDeInicioDeServicoNoRelogio: 0,
			tempoDoClienteNaFila: 0,
			tempoFinalDoServicoNoRelogio: 0,
			tempoDoClienteNoSistema: 0,
			tempoLivreDoOperador: 0,
		},
	];

	let initialFinalInfos = [""];

	let tempoSimulacao = inialTempoSimulacao;
	let TECs = [...inialTECs];
	let defaultTEC = inialDefaultTEC;
	let TSs = [...inialTSs];
	let defaultTS = inialDefaultTS;
	let table = [...inialTable];
	let finalInfos = initialFinalInfos;

	const calcTable = () => {
		const getRandBetween = (num1 = 0, num2 = 1) => {
			return Math.floor(Math.random() * (num2 - num1 + 1) + num1);
		};

		const getRandomEL = (arr = [0]) => arr[getRandBetween(0, arr.length - 1)] || 0;

		const newTable = [];

		while (true) {
			const lastEl = newTable[newTable.length - 1] || inialTable[0];

			const cliente = lastEl.cliente + 1;

			const tempoDesdeAUltimaChegada = getRandomEL(TECs);

			const tempoDeChegadaNoRelogio = lastEl.tempoDeChegadaNoRelogio + tempoDesdeAUltimaChegada;

			if (tempoDeChegadaNoRelogio > tempoSimulacao) {
				break;
			}

			const tempoDoServico = getRandomEL(TSs);

			const tempoDoClienteNaFila =
				lastEl.tempoFinalDoServicoNoRelogio >= tempoDeChegadaNoRelogio
					? lastEl.tempoFinalDoServicoNoRelogio - tempoDeChegadaNoRelogio
					: 0;

			const tempoDeInicioDeServicoNoRelogio = tempoDeChegadaNoRelogio + tempoDoClienteNaFila;

			const tempoFinalDoServicoNoRelogio = tempoDeInicioDeServicoNoRelogio + tempoDoServico;

			const tempoDoClienteNoSistema = tempoDoServico + tempoDoClienteNaFila;

			const tempoLivreDoOperador =
				lastEl.tempoFinalDoServicoNoRelogio <= tempoDeChegadaNoRelogio
					? tempoDeChegadaNoRelogio - lastEl.tempoFinalDoServicoNoRelogio
					: 0;

			const newEl = {
				cliente,
				tempoDesdeAUltimaChegada,
				tempoDeChegadaNoRelogio,
				tempoDoServico,
				tempoDeInicioDeServicoNoRelogio,
				tempoDoClienteNaFila,
				tempoFinalDoServicoNoRelogio,
				tempoDoClienteNoSistema,
				tempoLivreDoOperador,
			};

			newTable.push(newEl);
		}

		const sumTableRows = (attr = "") => newTable.reduce((acc, el) => acc + el[attr], 0);

		const quantidadeDeClientes = newTable.length;

		const numClienteEsperaram = newTable.filter((el) => el.tempoDoClienteNaFila > 0).length;

		const sumsRow = {
			cliente: "",
			tempoDesdeAUltimaChegada: "",
			tempoDeChegadaNoRelogio: "",
			tempoDoServico: sumTableRows("tempoDoServico"),
			tempoDeInicioDeServicoNoRelogio: "",
			tempoDoClienteNaFila: sumTableRows("tempoDoClienteNaFila"),
			tempoFinalDoServicoNoRelogio: "",
			tempoDoClienteNoSistema: sumTableRows("tempoDoClienteNoSistema"),
			tempoLivreDoOperador: sumTableRows("tempoLivreDoOperador"),
		};

		newTable.push(sumsRow);

		const tempoMedioEspera = (sumsRow.tempoDoClienteNaFila / quantidadeDeClientes).toFixed(2);

		const probClienteFila = (100 * (numClienteEsperaram / quantidadeDeClientes)).toFixed(2);

		const probOperadorLivre = (100 * (sumsRow.tempoLivreDoOperador / tempoSimulacao)).toFixed(2);

		const tempoMedioServico = (sumsRow.tempoDoServico / quantidadeDeClientes).toFixed(2);

		const tempoMedioSistema = (sumsRow.tempoDoClienteNoSistema / quantidadeDeClientes).toFixed(2);

		finalInfos = [
			`Tempo médio de espera na fila: ${tempoMedioEspera} minutos`,
			`Probabilidade de um cliente esperar na fila: ${probClienteFila} %`,
			`Probabilidade do operador livre: ${probOperadorLivre} %`,
			`Tempo médio do serviço: ${tempoMedioServico} minutos`,
			`Tempo médio despendido no sistema: ${tempoMedioSistema} minutos`,
		];

		table = newTable;
	};

	const clearAll = () => {
		tempoSimulacao = inialTempoSimulacao;
		TECs = [...inialTECs];
		defaultTEC = inialDefaultTEC;
		TSs = [...inialTSs];
		defaultTS = inialDefaultTS;
		table = [...inialTable];
		finalInfos = initialFinalInfos;
	};
</script>

<main>
	<div class="container">
		<div class="row padded">
			<div class="col">
				<button on:click={calcTable} class="btn btn-success">Simular</button>
				<button on:click={clearAll} class="btn btn-danger">Limpar</button>
			</div>
		</div>
		<div class="row padded">
			<div class="col">
				<div class="card" hidden={finalInfos.length === 1}>
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
		<div class="row padded">
			<div class="col">
				<table class="table table-bordered" hidden={finalInfos.length === 1}>
					<thead>
						<th>Cliente</th>
						<th>Tempo desde a Ultima Chegada (minutos)</th>
						<th>Tempo de chegada no relógio</th>
						<th>Tempo do Serviço (minutos)</th>
						<th>Tempo de início do serviço no relógio</th>
						<th>Tempo do cliente na fila (minutos)</th>
						<th>Tempo final do serviço no relógio</th>
						<th>Tempo do cliente no sistema (minutos)</th>
						<th>Tempo livre do operador (minutos)</th>
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
	</div>
</main>

<style>
	.last-line {
		font-weight: bolder;
		color: red;
	}
</style>
