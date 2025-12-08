import { DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useState } from 'react';
import { Cell } from '@/schemas/sites.schema';

interface CellModalProps {
  compoundName: string;
  cell?: Partial<Cell> | null;
  onClose: (result?: { name: string } | null) => void;
}

export function CellModal({ compoundName, cell, onClose }: CellModalProps) {
  const [name, setName] = useState<string>(cell?.name || '');
  const isEdit = !!cell?.id;

  const handleSubmit = () => {
    onClose({ name });
  };

  const title = isEdit ? 'Edit Cell' : `Add Cell to ${compoundName}`;

  return (
    <>
      <DialogHeader>
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription>
          {isEdit
            ? 'Update the cell information below.'
            : 'Add a new cell to this compound.'}
        </DialogDescription>
      </DialogHeader>
      <div className="space-y-4 py-4">
        <div className="space-y-2">
          <label htmlFor="cellName" className="text-sm font-medium text-foreground">
            Cell Name
          </label>
          <Input
            id="cellName"
            placeholder="e.g. Cell A-101"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={() => onClose()}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={!name.trim()}
          className="bg-cyan-600 hover:bg-cyan-500"
        >
          {isEdit ? 'Save Changes' : 'Create Cell'}
        </Button>
      </DialogFooter>
    </>
  );
}
