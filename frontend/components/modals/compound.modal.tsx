import { DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useState } from 'react';
import { Compound } from '@/schemas/sites.schema';

interface CompoundModalProps {
  siteName: string;
  compound?: Partial<Compound> | null;
  onClose: (result?: { name: string } | null) => void;
}

export function CompoundModal({ siteName, compound, onClose }: CompoundModalProps) {
  const [name, setName] = useState(compound?.name || '');
  const isEdit = !!(compound && compound.id);

  const handleSubmit = () => {
    onClose({ name });
  };

  const title = isEdit ? 'Edit Compound' : `Add Compound to ${siteName}`;

  return (
    <>
      <DialogHeader>
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription>
          {isEdit
            ? 'Update the compound information below.'
            : 'Add a new compound to this site.'}
        </DialogDescription>
      </DialogHeader>
      <div className="space-y-4 py-4">
        <div className="space-y-2">
          <label htmlFor="compoundName" className="text-sm font-medium text-foreground">
            Compound Name
          </label>
          <Input
            id="compoundName"
            placeholder="e.g. Grain Block A"
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
          className="bg-emerald-500 hover:bg-emerald-600"
        >
          {isEdit ? 'Save Changes' : 'Create Compound'}
        </Button>
      </DialogFooter>
    </>
  );
}
