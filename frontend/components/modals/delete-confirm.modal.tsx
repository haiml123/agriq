import { DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

interface DeleteConfirmModalProps {
  itemType: string;
  itemName: string;
  onClose: (confirmed?: boolean) => void;
}

export function DeleteConfirmModal({ itemType, itemName, onClose }: DeleteConfirmModalProps) {
  return (
    <>
      <DialogHeader>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-destructive" />
          </div>
          <div>
            <DialogTitle>Delete {itemType}</DialogTitle>
            <DialogDescription>
              This action cannot be undone.
            </DialogDescription>
          </div>
        </div>
      </DialogHeader>
      <div className="py-4">
        <p className="text-muted-foreground">
          Are you sure you want to delete{' '}
          <span className="font-semibold text-foreground">{itemName}</span>?
        </p>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={() => onClose(false)}>
          Cancel
        </Button>
        <Button variant="destructive" onClick={() => onClose(true)}>
          Delete
        </Button>
      </DialogFooter>
    </>
  );
}
