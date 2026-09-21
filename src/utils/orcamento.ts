import { Tarefa, SubTarefa, Compra, ItemDespesa, CategoriaDespesa } from '../types';

export interface ItemDespesaCalculado {
  id: string;
  compraId: string;
  item: string;
  valorUnitario: number;
  quantidade: number;
  valorTotal: number;
  categoria: CategoriaDespesa;
  dataNecessidade: string;
  isPrevisao: boolean;
  tarefaId?: string;
  subtarefaId?: string;
}

/**
 * Retorna a soma dos orçamentos previstos das subtarefas de uma tarefa
 */
export function somarOrcamentoSubtarefas(subtarefas?: SubTarefa[]): number {
  if (!subtarefas || subtarefas.length === 0) return 0;
  return subtarefas.reduce((acc, sub) => acc + (sub.orcamentoPrevisto && sub.orcamentoPrevisto > 0 ? sub.orcamentoPrevisto : 0), 0);
}

/**
 * Valida se o orçamento da tarefa é suficiente para cobrir o somatório das subtarefas.
 */
export function validarOrcamentoTarefaSubtarefas(orcamentoTarefa?: number, subtarefas?: SubTarefa[]) {
  const somaSubtarefas = somarOrcamentoSubtarefas(subtarefas);
  const orcTarefa = orcamentoTarefa && orcamentoTarefa > 0 ? orcamentoTarefa : 0;

  if (somaSubtarefas > 0 && orcTarefa < somaSubtarefas) {
    return {
      valido: false,
      somaSubtarefas,
      diferenca: somaSubtarefas - orcTarefa,
      mensagem: `O orçamento da tarefa (R$ ${orcTarefa.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}) não pode ser menor que o somatório de suas subtarefas (R$ ${somaSubtarefas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}).`
    };
  }

  return {
    valido: true,
    somaSubtarefas,
    diferenca: 0
  };
}

/**
 * Desmembra compras em seus itens individuais, garantindo que o vínculo de cada item
 * à sua respectiva Tarefa e Subtarefa seja respeitado.
 */
export function extrairItensDespesa(compras: Compra[]): ItemDespesaCalculado[] {
  const itensCalculados: ItemDespesaCalculado[] = [];

  for (const compra of compras) {
    if (compra.itens && compra.itens.length > 0) {
      for (const it of compra.itens) {
        // Se o item tem tarefaId próprio, usa ele; senão usa o fallback do cabeçalho da compra
        const itemTarefaId = it.tarefaId || compra.tarefaId;
        // Se o item tem subtarefaId próprio, usa ele; senão usa do cabeçalho caso a tarefa coincida
        const itemSubtarefaId = it.subtarefaId || (it.tarefaId && it.tarefaId !== compra.tarefaId ? undefined : compra.subtarefaId);
        const vUnit = it.valorUnitario || 0;
        const qtd = it.quantidade || 1;
        const vTotal = it.valorTotal !== undefined ? it.valorTotal : (vUnit * qtd);

        itensCalculados.push({
          id: it.id,
          compraId: compra.id,
          item: it.item || compra.nomeMaterial,
          valorUnitario: vUnit,
          quantidade: qtd,
          valorTotal: vTotal,
          categoria: compra.categoria || 'Material',
          dataNecessidade: compra.dataNecessidade,
          isPrevisao: !!compra.isPrevisao,
          tarefaId: itemTarefaId,
          subtarefaId: itemSubtarefaId
        });
      }
    } else {
      // Compra sem itens detalhados (registro direto de valorTotal)
      itensCalculados.push({
        id: compra.id,
        compraId: compra.id,
        item: compra.nomeMaterial,
        valorUnitario: compra.valorTotal,
        quantidade: 1,
        valorTotal: compra.valorTotal,
        categoria: compra.categoria || 'Material',
        dataNecessidade: compra.dataNecessidade,
        isPrevisao: !!compra.isPrevisao,
        tarefaId: compra.tarefaId,
        subtarefaId: compra.subtarefaId
      });
    }
  }

  return itensCalculados;
}

export type StatusOrcamento = 'ESTOURADO' | 'ALERTA' | 'NORMAL' | 'SEM_ORCAMENTO';

export interface ResumoOrcamentoSubtarefa {
  subtarefa: SubTarefa;
  orcamentoPrevisto?: number;
  totalGasto: number;
  totalPrevisao: number;
  totalComprometido: number;
  saldoRestante: number;
  percentualGasto: number;
  percentualComprometido: number;
  status: StatusOrcamento;
  valorEstourado: number;
  itens: ItemDespesaCalculado[];
}

export interface ResumoOrcamentoTarefa {
  tarefa: Tarefa;
  orcamentoPrevisto?: number;
  orcamentoProprio?: number;
  orcamentoSomaSubs: number;
  temOrcamento: boolean;
  totalGasto: number;
  totalPrevisao: number;
  totalComprometido: number;
  saldoRestante: number;
  percentualGasto: number;
  percentualComprometido: number;
  status: StatusOrcamento;
  valorEstourado: number;
  itens: ItemDespesaCalculado[];
  itensGerais: ItemDespesaCalculado[];
  totalGerais: number;
  subtarefasResumo: ResumoOrcamentoSubtarefa[];
}

/**
 * Calcula o orçamento e despesas de uma tarefa e suas subtarefas
 * A despesa da tarefa é a soma de cada item de despesa cadastrado para ela,
 * incluindo as despesas das suas subtarefas (usando filtro).
 */
export function calcularResumoOrcamentoTarefa(
  tarefa: Tarefa,
  itensCalculados: ItemDespesaCalculado[]
): ResumoOrcamentoTarefa {
  const subtarefas = tarefa.subtarefas || [];
  const idsSubtarefas = new Set(subtarefas.map(s => s.id));

  // Filtra cada item de despesa cadastrado para a tarefa ou para suas subtarefas
  const itensTarefa = itensCalculados.filter(it => 
    it.tarefaId === tarefa.id || (it.subtarefaId ? idsSubtarefas.has(it.subtarefaId) : false)
  );
  const totalGasto = itensTarefa.filter(it => !it.isPrevisao).reduce((acc, it) => acc + it.valorTotal, 0);
  const totalPrevisao = itensTarefa.filter(it => it.isPrevisao).reduce((acc, it) => acc + it.valorTotal, 0);
  const totalComprometido = totalGasto + totalPrevisao;

  // Subtarefas e seus orçamentos
  let orcamentoSomaSubs = 0;

  const subtarefasResumo: ResumoOrcamentoSubtarefa[] = subtarefas.map(sub => {
    const itensSub = itensTarefa.filter(it => it.subtarefaId === sub.id);
    const subGasto = itensSub.filter(it => !it.isPrevisao).reduce((acc, it) => acc + it.valorTotal, 0);
    const subPrevisao = itensSub.filter(it => it.isPrevisao).reduce((acc, it) => acc + it.valorTotal, 0);
    const subComprometido = subGasto + subPrevisao;
    const subOrcamento = sub.orcamentoPrevisto && sub.orcamentoPrevisto > 0 ? sub.orcamentoPrevisto : undefined;

    if (subOrcamento) {
      orcamentoSomaSubs += subOrcamento;
    }

    let subStatus: StatusOrcamento = 'SEM_ORCAMENTO';
    let subPercentual = 0;
    let subPercentualComp = 0;
    let subSaldo = 0;
    let subEstourado = 0;

    if (subOrcamento && subOrcamento > 0) {
      subPercentual = (subGasto / subOrcamento) * 100;
      subPercentualComp = (subComprometido / subOrcamento) * 100;
      subSaldo = subOrcamento - subGasto;
      if (subGasto > subOrcamento) {
        subStatus = 'ESTOURADO';
        subEstourado = subGasto - subOrcamento;
      } else if (subPercentual >= 80 || subComprometido > subOrcamento) {
        subStatus = 'ALERTA';
      } else {
        subStatus = 'NORMAL';
      }
    }

    return {
      subtarefa: sub,
      orcamentoPrevisto: subOrcamento,
      totalGasto: subGasto,
      totalPrevisao: subPrevisao,
      totalComprometido: subComprometido,
      saldoRestante: subSaldo,
      percentualGasto: subPercentual,
      percentualComprometido: subPercentualComp,
      status: subStatus,
      valorEstourado: subEstourado,
      itens: itensSub
    };
  });

  // Gastos gerais da tarefa (sem subtarefa específica)
  const itensGerais = itensTarefa.filter(it => !it.subtarefaId || !idsSubtarefas.has(it.subtarefaId));
  const totalGerais = itensGerais.filter(it => !it.isPrevisao).reduce((acc, it) => acc + it.valorTotal, 0);

  // Orçamento final da tarefa: não pode ser menor que o somatório dos orçamentos das suas subtarefas
  const orcamentoProprio = tarefa.orcamentoPrevisto && tarefa.orcamentoPrevisto > 0 ? tarefa.orcamentoPrevisto : undefined;
  const orcamentoCalculadoMinimo = Math.max(orcamentoProprio || 0, orcamentoSomaSubs);
  const orcamentoPrevisto = orcamentoCalculadoMinimo > 0 ? orcamentoCalculadoMinimo : undefined;

  const temOrcamento = orcamentoPrevisto !== undefined && orcamentoPrevisto > 0;

  let status: StatusOrcamento = 'SEM_ORCAMENTO';
  let percentualGasto = 0;
  let percentualComprometido = 0;
  let saldoRestante = 0;
  let valorEstourado = 0;

  if (temOrcamento && orcamentoPrevisto) {
    percentualGasto = (totalGasto / orcamentoPrevisto) * 100;
    percentualComprometido = (totalComprometido / orcamentoPrevisto) * 100;
    saldoRestante = orcamentoPrevisto - totalGasto;

    if (totalGasto > orcamentoPrevisto) {
      status = 'ESTOURADO';
      valorEstourado = totalGasto - orcamentoPrevisto;
    } else if (percentualGasto >= 80 || totalComprometido > orcamentoPrevisto) {
      status = 'ALERTA';
    } else {
      status = 'NORMAL';
    }
  }

  return {
    tarefa,
    orcamentoPrevisto,
    orcamentoProprio,
    orcamentoSomaSubs,
    temOrcamento,
    totalGasto,
    totalPrevisao,
    totalComprometido,
    saldoRestante,
    percentualGasto,
    percentualComprometido,
    status,
    valorEstourado,
    itens: itensTarefa,
    itensGerais,
    totalGerais,
    subtarefasResumo
  };
}

export interface AlertaNotificacaoOrcamento {
  tipo: 'ESTOURO' | 'ALERTA';
  alvoTipo: 'TAREFA' | 'SUBTAREFA';
  tarefaTitulo: string;
  subtarefaTitulo?: string;
  tituloAlvo: string;
  orcamentoPrevisto: number;
  gastoAtual: number;
  novoGasto: number;
  totalComEsteLancamento: number;
  percentualAtingido: number;
  percentualConsumido: number;
  valorExcedido: number;
  valorDiferenca: number;
  mensagem: string;
}

/**
 * Avalia o impacto de um novo lançamento ou edição de despesa no orçamento das tarefas e subtarefas.
 * Nota: O cadastro de despesa sempre é permitido, mesmo quando o orçamento for ultrapassado.
 */
export function avaliarImpactoOrcamento(
  itensNovos: { item: string; valorTotal: number; tarefaId?: string; subtarefaId?: string; isPrevisao?: boolean }[],
  tarefas: Tarefa[],
  comprasAtuais: Compra[],
  compraEmEdicaoId?: string
): AlertaNotificacaoOrcamento[] {
  // Filtra as compras existentes excluindo a compra em edição se houver
  const comprasBase = compraEmEdicaoId 
    ? comprasAtuais.filter(c => c.id !== compraEmEdicaoId) 
    : comprasAtuais;

  const itensExistentes = extrairItensDespesa(comprasBase);

  // Mapear relação de subtarefaId para sua respectiva tarefaId pai
  const mapaSubParaTarefa: Record<string, string> = {};
  for (const t of tarefas) {
    for (const s of (t.subtarefas || [])) {
      mapaSubParaTarefa[s.id] = t.id;
    }
  }

  // Mapear gastos atuais por subtarefa
  const gastosAtuaisPorSubtarefa: Record<string, number> = {};
  for (const it of itensExistentes) {
    if (!it.isPrevisao && it.subtarefaId) {
      gastosAtuaisPorSubtarefa[it.subtarefaId] = (gastosAtuaisPorSubtarefa[it.subtarefaId] || 0) + it.valorTotal;
    }
  }

  // Somar os acréscimos dos itens novos
  const acrescimoPorTarefa: Record<string, number> = {};
  const acrescimoPorSubtarefa: Record<string, number> = {};

  for (const it of itensNovos) {
    if (!it.isPrevisao && it.valorTotal > 0) {
      // O acréscimo da tarefa pai engloba tanto o item direto quanto os itens de suas subtarefas
      const tId = it.tarefaId || (it.subtarefaId ? mapaSubParaTarefa[it.subtarefaId] : undefined);
      if (tId) {
        acrescimoPorTarefa[tId] = (acrescimoPorTarefa[tId] || 0) + it.valorTotal;
      }
      if (it.subtarefaId) {
        acrescimoPorSubtarefa[it.subtarefaId] = (acrescimoPorSubtarefa[it.subtarefaId] || 0) + it.valorTotal;
      }
    }
  }

  const alertas: AlertaNotificacaoOrcamento[] = [];

  // Verificar Tarefas afetadas
  for (const tarefa of tarefas) {
    const acrescimo = acrescimoPorTarefa[tarefa.id] || 0;
    if (acrescimo <= 0) continue;

    const resumoAtual = calcularResumoOrcamentoTarefa(tarefa, itensExistentes);
    if (!resumoAtual.temOrcamento || !resumoAtual.orcamentoPrevisto) continue;

    const orcamento = resumoAtual.orcamentoPrevisto;
    const gastoAtual = resumoAtual.totalGasto;
    const novoGasto = gastoAtual + acrescimo;
    const percentualAtingido = (novoGasto / orcamento) * 100;

    if (novoGasto > orcamento) {
      const excedido = novoGasto - orcamento;
      alertas.push({
        tipo: 'ESTOURO',
        alvoTipo: 'TAREFA',
        tarefaTitulo: tarefa.titulo,
        tituloAlvo: `Etapa: ${tarefa.titulo}`,
        orcamentoPrevisto: orcamento,
        gastoAtual,
        novoGasto,
        totalComEsteLancamento: novoGasto,
        percentualAtingido,
        percentualConsumido: percentualAtingido,
        valorExcedido: excedido,
        valorDiferenca: excedido,
        mensagem: `Orçamento da etapa "${tarefa.titulo}" excedido em R$ ${excedido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} (${percentualAtingido.toFixed(1)}% do previsto).`
      });
    } else if (percentualAtingido >= 80 && (gastoAtual / orcamento) * 100 < 80) {
      alertas.push({
        tipo: 'ALERTA',
        alvoTipo: 'TAREFA',
        tarefaTitulo: tarefa.titulo,
        tituloAlvo: `Etapa: ${tarefa.titulo}`,
        orcamentoPrevisto: orcamento,
        gastoAtual,
        novoGasto,
        totalComEsteLancamento: novoGasto,
        percentualAtingido,
        percentualConsumido: percentualAtingido,
        valorExcedido: 0,
        valorDiferenca: orcamento - novoGasto,
        mensagem: `A etapa "${tarefa.titulo}" atingiu ${percentualAtingido.toFixed(1)}% do orçamento previsto (R$ ${novoGasto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} de R$ ${orcamento.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}).`
      });
    }

    // Verificar subtarefas desta tarefa
    for (const sub of tarefa.subtarefas || []) {
      const acrescimoSub = acrescimoPorSubtarefa[sub.id] || 0;
      if (acrescimoSub <= 0 || !sub.orcamentoPrevisto || sub.orcamentoPrevisto <= 0) continue;

      const subGastoAtual = gastosAtuaisPorSubtarefa[sub.id] || 0;
      const subNovoGasto = subGastoAtual + acrescimoSub;
      const subPercentual = (subNovoGasto / sub.orcamentoPrevisto) * 100;

      if (subNovoGasto > sub.orcamentoPrevisto) {
        const subExcedido = subNovoGasto - sub.orcamentoPrevisto;
        alertas.push({
          tipo: 'ESTOURO',
          alvoTipo: 'SUBTAREFA',
          tarefaTitulo: tarefa.titulo,
          subtarefaTitulo: sub.titulo,
          tituloAlvo: `${tarefa.titulo} › ${sub.titulo}`,
          orcamentoPrevisto: sub.orcamentoPrevisto,
          gastoAtual: subGastoAtual,
          novoGasto: subNovoGasto,
          totalComEsteLancamento: subNovoGasto,
          percentualAtingido: subPercentual,
          percentualConsumido: subPercentual,
          valorExcedido: subExcedido,
          valorDiferenca: subExcedido,
          mensagem: `Sub-tarefa "${sub.titulo}" (Etapa: ${tarefa.titulo}) excedeu o orçamento em R$ ${subExcedido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} (${subPercentual.toFixed(1)}%).`
        });
      } else if (subPercentual >= 80 && (subGastoAtual / sub.orcamentoPrevisto) * 100 < 80) {
        alertas.push({
          tipo: 'ALERTA',
          alvoTipo: 'SUBTAREFA',
          tarefaTitulo: tarefa.titulo,
          subtarefaTitulo: sub.titulo,
          tituloAlvo: `${tarefa.titulo} › ${sub.titulo}`,
          orcamentoPrevisto: sub.orcamentoPrevisto,
          gastoAtual: subGastoAtual,
          novoGasto: subNovoGasto,
          totalComEsteLancamento: subNovoGasto,
          percentualAtingido: subPercentual,
          percentualConsumido: subPercentual,
          valorExcedido: 0,
          valorDiferenca: sub.orcamentoPrevisto - subNovoGasto,
          mensagem: `Sub-tarefa "${sub.titulo}" atingiu ${subPercentual.toFixed(1)}% do orçamento previsto.`
        });
      }
    }
  }

  return alertas;
}
