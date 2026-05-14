import React from 'react';
import { AlertTriangle, Trash2 } from 'lucide-react';
import { Modal } from './Modal';
import { Button } from './Button';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  message: React.ReactNode;
  detail?: React.ReactNode;
  confirmLabel?: string;
  variant?: 'danger' | 'warning';
  isLoading?: boolean;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  detail,
  confirmLabel = 'Eliminar',
  variant = 'danger',
  isLoading = false,
}) => {
  const iconBg = variant === 'danger'
    ? 'bg-red-100 dark:bg-red-900/30'
    : 'bg-amber-100 dark:bg-amber-900/30';
  const iconColor = variant === 'danger'
    ? 'text-red-600 dark:text-red-400'
    : 'text-amber-600 dark:text-amber-400';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancelar
          </Button>
          <Button
            variant={variant === 'danger' ? 'danger' : 'primary'}
            leftIcon={variant === 'danger' ? <Trash2 className="h-4 w-4" /> : undefined}
            onClick={onConfirm}
            isLoading={isLoading}
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      <div className="flex flex-col items-center gap-4 py-2">
        <div className={`flex h-12 w-12 items-center justify-center rounded-full ${iconBg}`}>
          <AlertTriangle className={`h-6 w-6 ${iconColor}`} />
        </div>
        <div className="text-center space-y-1">
          <p className="text-sm text-gray-600 dark:text-gray-300">{message}</p>
          {detail && (
            <p className="text-xs text-gray-500 dark:text-gray-400 pt-1">{detail}</p>
          )}
        </div>
      </div>
    </Modal>
  );
};
