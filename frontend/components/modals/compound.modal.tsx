'use client';

import { DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Compound, CreateCompoundDto, createCompoundSchema } from '@/schemas/sites.schema';

interface CompoundModalProps {
  siteName: string;
  compound?: Partial<Compound> | null;
  onClose: (result?: CreateCompoundDto | null) => void;
}

export function CompoundModal({ siteName, compound, onClose }: CompoundModalProps) {
  const isEdit = !!(compound && compound.id);

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<CreateCompoundDto>({
    resolver: zodResolver(createCompoundSchema),
    defaultValues: {
      name: compound?.name ?? '',
    },
    mode: 'onChange',
  });

  const onSubmit = (data: CreateCompoundDto) => {
    onClose(data);
  };

  console.log(errors, isValid)
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
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
          <div className="space-y-2">
            <label htmlFor="compoundName" className="text-sm font-medium text-foreground">
              Compound Name
            </label>
            <Input
                id="compoundName"
                placeholder="e.g. Grain Block A"
                {...register('name')}
            />
            {errors.name && (
                <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onClose()}>
              Cancel
            </Button>
            <Button
                type="submit"
                disabled={!isValid}
                className="bg-emerald-500 hover:bg-emerald-600"
            >
              {isEdit ? 'Save Changes' : 'Create Compound'}
            </Button>
          </DialogFooter>
        </form>
      </>
  );
}