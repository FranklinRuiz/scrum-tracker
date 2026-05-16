import React, { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { Clock, CheckCircle2, Pencil, Trash2 } from 'lucide-react';
import type { ProgressRecord } from '@/domain/entities/ProgressRecord';
import type { Developer } from '@/domain/entities/Developer';
import { STORY_STATUS_COLORS, STORY_STATUS_LABELS } from '@/domain/value-objects/StoryStatus';
import { Badge } from '../common/Badge';
import { Avatar } from '../common/Avatar';
import { ConfirmDialog } from '../common/ConfirmDialog';

interface ProgressTimelineProps {
  records: ProgressRecord[];
  developers: Developer[];
  onEdit?: (record: ProgressRecord) => void;
  onDelete?: (recordId: string) => void;
}

export const ProgressTimeline: React.FC<ProgressTimelineProps> = ({
  records,
  developers,
  onEdit,
  onDelete,
}) => {
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  if (records.length === 0) {
    return (
      <div className="text-center py-6 text-gray-400 dark:text-gray-500 text-sm">
        Sin registros de avance aún
      </div>
    );
  }

  const getDeveloper = (id: string) => developers.find((d) => d.id === id);
  const recordToDelete = confirmDeleteId ? records.find((r) => r.id === confirmDeleteId) : null;

  return (
    <>
      <div className="space-y-3">
        {records.map((record, idx) => {
          const dev = getDeveloper(record.developerId);
          return (
            <div key={record.id} className="relative flex gap-3">
              {idx < records.length - 1 && (
                <div className="absolute left-4 top-8 bottom-0 w-px bg-gray-200 dark:bg-slate-700" />
              )}

              <div className="shrink-0 z-10">
                {dev ? (
                  <Avatar developer={dev} size="sm" />
                ) : (
                  <div className="h-7 w-7 rounded-full bg-gray-300 dark:bg-slate-600" />
                )}
              </div>

              <div className={`flex-1 min-w-0 rounded-lg p-3 ${
                record.commitmentMet
                  ? 'bg-green-50 dark:bg-green-900/20 ring-1 ring-green-200 dark:ring-green-800'
                  : 'bg-gray-50 dark:bg-slate-700/50'
              }`}>
                <div className="flex items-start justify-between gap-2 mb-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {dev?.name ?? 'Desconocido'}
                    </span>
                    <Badge className={STORY_STATUS_COLORS[record.newStatus]}>
                      {STORY_STATUS_LABELS[record.newStatus]}
                    </Badge>
                    {record.commitmentMet && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400">
                        <CheckCircle2 className="h-3 w-3" />
                        Compromiso cumplido
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {record.progressPercentage}%
                    </span>
                    <div className="flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500">
                      <Clock className="h-3 w-3" />
                      {record.hoursWorked}h
                    </div>
                    {(onEdit || onDelete) && (
                      <div className="flex items-center gap-1 ml-1">
                        {onEdit && (
                          <button
                            onClick={() => onEdit(record)}
                            className="p-1 rounded text-gray-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors"
                            title="Editar"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                        )}
                        {onDelete && (
                          <button
                            onClick={() => setConfirmDeleteId(record.id)}
                            className="p-1 rounded text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                            title="Eliminar"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300">{record.comment}</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                  {format(parseISO(record.timestamp), "d 'de' MMM yyyy — HH:mm", { locale: es })}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {confirmDeleteId && (
        <ConfirmDialog
          isOpen
          title="Eliminar registro de avance"
          message={`¿Eliminar el registro de ${recordToDelete ? getDeveloper(recordToDelete.developerId)?.name ?? 'este desarrollador' : ''} (${recordToDelete?.hoursWorked}h)? El avance de la historia se recalculará automáticamente.`}
          confirmLabel="Eliminar"
          variant="danger"
          onConfirm={() => {
            onDelete!(confirmDeleteId);
            setConfirmDeleteId(null);
          }}
          onClose={() => setConfirmDeleteId(null)}
        />
      )}
    </>
  );
};
