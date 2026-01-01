import { DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button, buttonVariants } from '@/components/ui/button';
import type { VariantProps } from 'class-variance-authority';

type ButtonVariant = VariantProps<typeof buttonVariants>['variant'];

interface ConfirmActionModalProps {
  title: string;
  description?: string;
  confirmLabel: string;
  cancelLabel: string;
  confirmVariant?: ButtonVariant;
  onClose: (confirmed?: boolean) => void;
}

export function ConfirmActionModal({
  title,
  description,
  confirmLabel,
  cancelLabel,
  confirmVariant = 'destructive',
  onClose,
}: ConfirmActionModalProps) {
  return (
    <>
      <DialogHeader>
        <DialogTitle>{title}</DialogTitle>
        {description && <DialogDescription>{description}</DialogDescription>}
      </DialogHeader>
      <DialogFooter>
        <Button variant="outline" onClick={() => onClose(false)}>
          {cancelLabel}
        </Button>
        <Button variant={confirmVariant} onClick={() => onClose(true)}>
          {confirmLabel}
        </Button>
      </DialogFooter>
    </>
  );
}
