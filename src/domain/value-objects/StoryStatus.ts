export type StoryStatus =
  | 'open'
  | 'in-development'
  | 'done-development'
  | 'in-certification'
  | 'done-certification'
  | 'pase-management'
  | 'finalized'
  | 'done-prd'
  | 'blocked';

export const STORY_STATUS_LABELS: Record<StoryStatus, string> = {
  'open': 'Abierto',
  'in-development': 'En Desarrollo',
  'done-development': 'Done Desarrollo',
  'in-certification': 'En Certificación',
  'done-certification': 'Done Certificación',
  'pase-management': 'Gestión de Pase',
  'finalized': 'Finalizado',
  'done-prd': 'Done PRD',
  'blocked': 'Bloqueado',
};

export const STORY_STATUS_ORDER: StoryStatus[] = [
  'open',
  'blocked',
  'in-development',
  'done-development',
  'in-certification',
  'done-certification',
  'pase-management',
  'finalized',
  'done-prd',
];

export const STORY_STATUS_COLORS: Record<StoryStatus, string> = {
  'open': 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
  'blocked': 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
  'in-development': 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  'done-development': 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900 dark:text-cyan-300',
  'in-certification': 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
  'done-certification': 'bg-violet-100 text-violet-700 dark:bg-violet-900 dark:text-violet-300',
  'pase-management': 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300',
  'finalized': 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
  'done-prd': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300',
};

export const isTerminalStatus = (status: StoryStatus): boolean =>
  status === 'finalized' || status === 'done-prd';

export const isBlockedStatus = (_status: StoryStatus): boolean => false;
