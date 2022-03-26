export const defaultTabletEl = {
    cliente: 0,
    tempoDesdeAUltimaChegada: 0,
    tempoDeChegadaNoRelogio: 0,
    tempoDoServico: 0,
    tempoDeInicioDeServicoNoRelogio: 0,
    tempoDoClienteNaFila: 0,
    tempoFinalDoServicoNoRelogio: 0,
    tempoDoClienteNoSistema: 0,
    tempoLivreDoOperador: 0
}

export const calcTable = ({
    tempoSimulacao = 0,
    TECs = [0],
    TSs = [0],
    firstTableEl = defaultTabletEl
}) => {
    const getRandBetween = (num1 = 0, num2 = 1) => {
        return Math.floor(Math.random() * (num2 - num1 + 1) + num1)
    }

    const getRandomEL = (arr = [0]) => arr[getRandBetween(0, arr.length - 1)] || 0

    const newTable = [firstTableEl]

    // eslint-disable-next-line no-constant-condition
    while (true) {
        const lastEl = newTable[newTable.length - 1]

        const cliente = lastEl.cliente + 1

        const tempoDesdeAUltimaChegada = getRandomEL(TECs)

        const tempoDeChegadaNoRelogio = lastEl.tempoDeChegadaNoRelogio + tempoDesdeAUltimaChegada

        if (tempoDeChegadaNoRelogio > tempoSimulacao) {
            break
        }

        const tempoDoServico = getRandomEL(TSs)

        const tempoDoClienteNaFila =
            lastEl.tempoFinalDoServicoNoRelogio >= tempoDeChegadaNoRelogio
                ? lastEl.tempoFinalDoServicoNoRelogio - tempoDeChegadaNoRelogio
                : 0

        const tempoDeInicioDeServicoNoRelogio = tempoDeChegadaNoRelogio + tempoDoClienteNaFila

        const tempoFinalDoServicoNoRelogio = tempoDeInicioDeServicoNoRelogio + tempoDoServico

        const tempoDoClienteNoSistema = tempoDoServico + tempoDoClienteNaFila

        const tempoLivreDoOperador =
            lastEl.tempoFinalDoServicoNoRelogio <= tempoDeChegadaNoRelogio
                ? tempoDeChegadaNoRelogio - lastEl.tempoFinalDoServicoNoRelogio
                : 0

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
        }

        newTable.push(newEl)
    }

    const sumTableRows = (attr = "") => newTable.reduce((acc, el) => acc + el[attr], 0)

    const quantidadeDeClientes = newTable.length

    const numClienteEsperaram = newTable.filter((el) => el.tempoDoClienteNaFila > 0).length

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
    }

    newTable.push(sumsRow)

    const tempoMedioEspera = (sumsRow.tempoDoClienteNaFila / quantidadeDeClientes).toFixed(2)

    const probClienteFila = (100 * (numClienteEsperaram / quantidadeDeClientes)).toFixed(2)

    const probOperadorLivre = (100 * (sumsRow.tempoLivreDoOperador / tempoSimulacao)).toFixed(2)

    const tempoMedioServico = (sumsRow.tempoDoServico / quantidadeDeClientes).toFixed(2)

    const tempoMedioSistema = (sumsRow.tempoDoClienteNoSistema / quantidadeDeClientes).toFixed(2)

    const finalInfos = [
        `Tempo médio de espera na fila: ${tempoMedioEspera} minutos`,
        `Probabilidade de um cliente esperar na fila: ${probClienteFila} %`,
        `Probabilidade do operador livre: ${probOperadorLivre} %`,
        `Tempo médio do serviço: ${tempoMedioServico} minutos`,
        `Tempo médio despendido no sistema: ${tempoMedioSistema} minutos`,
    ]

    const table = newTable

    return {
        finalInfos,
        table
    }
}