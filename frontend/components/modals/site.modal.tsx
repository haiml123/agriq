'use client';

import { DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Site, UpdateSiteDto, updateSiteSchema } from '@/schemas/sites.schema';

interface SiteModalProps {
  site?: Site | null;
  onClose: (result?: UpdateSiteDto | null) => void;
}

export function SiteModal({ site, onClose }: SiteModalProps) {
  const isEdit = !!site?.id;

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<UpdateSiteDto>({
    resolver: zodResolver(updateSiteSchema),
    defaultValues: {
      name: site?.name ?? '',
      address: site?.address ?? '',
    },
    mode: 'onChange',
  });

  const onSubmit = (data: UpdateSiteDto) => {
    onClose({
      name: data.name,
      address: data.address || undefined,
    });
  };

  const title = isEdit ? 'Edit Site' : 'Create Site';

  return (
      <>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {isEdit
                ? 'Update the site information below.'
                : 'Add a new site to your organization.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
          <div className="space-y-2">
            <label htmlFor="siteName" className="text-sm font-medium text-foreground">
              Site Name
            </label>
            <Input
                id="siteName"
                placeholder="e.g. Northern Storage Facility"
                {...register('name')}
            />
            {errors.name && (
                <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <label htmlFor="siteAddress" className="text-sm font-medium text-foreground">
              Address
            </label>
            <Input
                id="siteAddress"
                placeholder="e.g. Minneapolis, MN"
                {...register('address')}
            />
            {errors.address && (
                <p className="text-sm text-destructive">{errors.address.message}</p>
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
              {isEdit ? 'Save Changes' : 'Create Site'}
            </Button>
          </DialogFooter>
        </form>
      </>
  );
}