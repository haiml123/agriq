import { DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useState } from 'react';
import { useTranslations } from 'next-intl';

interface CreateOrganizationModalProps {
    onClose: (result?: string) => void;
}

export function CreateOrganizationModal({ onClose }: CreateOrganizationModalProps) {
    const t = useTranslations('modals.organization');
    const tCommon = useTranslations('common');
    const [name, setName] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleCreate = async () => {
        setIsLoading(true);
        try {
            // await api.createOrganization(name);
            onClose(name); // return the created name (or id, or full object)
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <DialogHeader>
                <DialogTitle>{t('createTitle')}</DialogTitle>
                <DialogDescription>
                    {t('createDescription')}
                </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
                <div className="space-y-2">
                    <label htmlFor="orgName" className="text-sm font-medium text-foreground">
                        {t('organizationName')}
                    </label>
                    <Input
                        id="orgName"
                        placeholder={t('organizationNamePlaceholder')}
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                    />
                </div>
            </div>
            <DialogFooter>
                <Button variant="outline" onClick={() => onClose()}>
                    {tCommon('cancel')}
                </Button>
                <Button
                    onClick={handleCreate}
                    disabled={!name.trim() || isLoading}
                    className="bg-emerald-500 hover:bg-emerald-600"
                >
                    {isLoading ? t('creating') : t('createButton')}
                </Button>
            </DialogFooter>
        </>
    );
}