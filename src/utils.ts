/**
 * Utilitários de manipulação de datas e cálculo de prazos no cronograma de obras.
 */

export function calcularDuracaoDias(dataInicio: string, dataFim: string): number {
  if (!dataInicio || !dataFim) return 1;
  const dInicio = new Date(dataInicio + 'T00:00:00');
  const dFim = new Date(dataFim + 'T00:00:00');
  if (isNaN(dInicio.getTime()) || isNaN(dFim.getTime())) return 1;
  
  const diffTime = dFim.getTime() - dInicio.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
  
  // Duração em dias corridos inclusiva (ex: mesmo dia = 1 dia; dia 10 ao dia 12 = 3 dias)
  return diffDays >= 0 ? diffDays + 1 : 1;
}

export function formatarDataBR(dataStr?: string): string {
  if (!dataStr) return '-';
  const d = new Date(dataStr + 'T00:00:00');
  if (isNaN(d.getTime())) return dataStr;
  return d.toLocaleDateString('pt-BR');
}

export type StatusAlertaInicio = 
  | 'CONCLUIDA'
  | 'INICIADA'
  | 'INICIO_ATRASADO'
  | 'INICIO_HOJE'
  | 'INICIO_PROXIMO'
  | 'AGUARDANDO';

export interface InfoAlertaInicio {
  tipo: StatusAlertaInicio;
  diasDiferenca: number;
  mensagem: string;
  isUrgente: boolean;
}

export function obterAlertaInicio(
  dataInicioPrevista?: string,
  iniciada?: boolean,
  concluida?: boolean
): InfoAlertaInicio {
  if (concluida) {
    return {
      tipo: 'CONCLUIDA',
      diasDiferenca: 0,
      mensagem: 'Etapa concluída',
      isUrgente: false
    };
  }

  if (iniciada) {
    return {
      tipo: 'INICIADA',
      diasDiferenca: 0,
      mensagem: 'Em andamento (Iniciada)',
      isUrgente: false
    };
  }

  if (!dataInicioPrevista) {
    return {
      tipo: 'AGUARDANDO',
      diasDiferenca: 0,
      mensagem: 'Aguardando início',
      isUrgente: false
    };
  }

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const dInicio = new Date(dataInicioPrevista + 'T00:00:00');
  dInicio.setHours(0, 0, 0, 0);

  const diffTime = dInicio.getTime() - hoje.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    const atraso = Math.abs(diffDays);
    return {
      tipo: 'INICIO_ATRASADO',
      diasDiferenca: diffDays,
      mensagem: `Início atrasado há ${atraso} ${atraso === 1 ? 'dia' : 'dias'}! Deveria ter iniciado em ${formatarDataBR(dataInicioPrevista)}.`,
      isUrgente: true
    };
  }

  if (diffDays === 0) {
    return {
      tipo: 'INICIO_HOJE',
      diasDiferenca: 0,
      mensagem: 'Início previsto para hoje! Confirme o início dos trabalhos.',
      isUrgente: true
    };
  }

  if (diffDays <= 3) {
    return {
      tipo: 'INICIO_PROXIMO',
      diasDiferenca: diffDays,
      mensagem: `Início previsto em ${diffDays} ${diffDays === 1 ? 'dia' : 'dias'} (${formatarDataBR(dataInicioPrevista)}).`,
      isUrgente: true
    };
  }

  return {
    tipo: 'AGUARDANDO',
    diasDiferenca: diffDays,
    mensagem: `Início previsto para ${formatarDataBR(dataInicioPrevista)} (${diffDays} dias).`,
    isUrgente: false
  };
}
