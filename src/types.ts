export type ObraStatus = 'EM_ANDAMENTO' | 'CONCLUIDA' | 'PAUSADA';
export type TarefaStatus = 'PENDENTE' | 'CONCLUIDA' | 'ATRASADA';
export type CompraStatus = 'PENDENTE' | 'COMPRADO' | 'ENTREGUE';
export type TicketStatus = 'ABERTO' | 'ACEITO' | 'RECUSADO';

export type CategoriaDespesa = 'Material' | 'Serviço' | 'Transporte' | 'Alimentação';
export const CATEGORIAS_DESPESA: CategoriaDespesa[] = ['Material', 'Serviço', 'Transporte', 'Alimentação'];

export interface ItemDespesa {
  id: string;
  item: string;
  valorUnitario: number;
  quantidade: number;
  valorTotal: number;
}

export interface SubTarefa {
  id: string;
  titulo: string;
  dataInicioPrevista?: string;
  dataFimPrevista?: string;
  duracaoDias?: number;
  iniciada?: boolean;
  dataInicioReal?: string;
  concluida: boolean;
  dataConclusao?: string;
  fotosExecucao?: string[];
}

export interface Obra {
  id: string;
  nome: string;
  orcamentoPrevisto: number;
  dataInicio: string;
  status: ObraStatus;
}

export interface Tarefa {
  id: string;
  obraId: string;
  titulo: string;
  dataInicioPrevista: string;
  dataFimPrevista: string;
  duracaoDias: number;
  status: TarefaStatus;
  iniciada?: boolean;
  dataInicioReal?: string;
  fotosExecucao: string[];
  subtarefas?: SubTarefa[];
  dataConclusao?: string;
}

export interface Compra {
  id: string;
  obraId: string;
  tarefaId?: string;
  subtarefaId?: string;
  categoria: CategoriaDespesa;
  nomeMaterial: string;
  itens?: ItemDespesa[];
  valorTotal: number;
  dataNecessidade: string;
  statusCompra: CompraStatus;
  comprovanteBase64?: string;
  isPrevisao?: boolean;
  dataConfirmacao?: string;
}

export interface PagamentoCliente {
  id: string;
  obraId: string;
  valor: number;
  data: string;
  metodo: string;
  comprovanteBase64?: string;
  descricao?: string;
  isPrevisao?: boolean;
  dataConfirmacao?: string;
}

export interface ItemChecadoDiario {
  tarefaId: string;
  tarefaTitulo: string;
  subtarefaId?: string;
  subtarefaTitulo?: string;
  tipo: 'TAREFA' | 'SUBTAREFA';
}

export type RdoStatusConfirmacao = 'PENDENTE' | 'CONFIRMADO';
export type ClimaTempo = 'SOL' | 'CHUVA' | 'NUBLADO' | string;

export interface DiarioObra {
  id: string;
  obraId: string;
  data: string;
  clima: string;
  resumoDia: string;
  eventos: string;
  fotosDia: string[];
  itensChecados?: ItemChecadoDiario[];
  statusConfirmacao?: RdoStatusConfirmacao;
  isAutomatico?: boolean;
}

export interface TicketAlteracao {
  id: string;
  obraId: string;
  titulo: string;
  motivo: string;
  impactoDias: number;
  custoAdicional: number;
  status: TicketStatus;
}

export interface AppState {
  obras: Obra[];
  tarefas: Tarefa[];
  compras: Compra[];
  pagamentosCliente: PagamentoCliente[];
  diarioObra: DiarioObra[];
  ticketsAlteracao: TicketAlteracao[];
  obraAtivaId: string | null;
}
