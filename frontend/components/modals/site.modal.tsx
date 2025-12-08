import { DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useState } from 'react';
import { Site } from '@/schemas/sites.schema';

interface SiteModalProps {
  site?: Site | null;
  onClose: (result?: { name: string; address?: string } | null) => void;
}

export function SiteModal({ site, onClose }: SiteModalProps) {
  const [name, setName] = useState(site?.name || '');
  const [address, setAddress] = useState(site?.address || '');
  const isEdit = !!site;

  const handleSubmit = () => {
    onClose({ name, address: address || undefined });
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
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label htmlFor="siteName" className="text-sm font-medium text-foreground">
              Site Name
            </label>
            <Input
                id="siteName"
                placeholder="e.g. Northern Storage Facility"
                value={name}
                onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="siteAddress" className="text-sm font-medium text-foreground">
              Address
            </label>
            <Input
                id="siteAddress"
                placeholder="e.g. Minneapolis, MN"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
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
            {isEdit ? 'Save Changes' : 'Create Site'}
          </Button>
        </DialogFooter>
      </>
  );
}