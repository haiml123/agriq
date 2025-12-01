import { DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useState } from 'react';

interface CreateOrganizationModalProps {
    onClose: (result?: string) => void;
}

export function CreateOrganizationModal({ onClose }: CreateOrganizationModalProps) {
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
                <DialogTitle>Create New Organization</DialogTitle>
                <DialogDescription>
                    Add a new organization to the platform. You can add sites and users after creation.
                </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
                <div className="space-y-2">
                    <label htmlFor="orgName" className="text-sm font-medium text-foreground">
                        Organization Name
                    </label>
                    <Input
                        id="orgName"
                        placeholder="Enter organization name"
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
                    onClick={handleCreate}
                    disabled={!name.trim() || isLoading}
                    className="bg-emerald-500 hover:bg-emerald-600"
                >
                    {isLoading ? "Creating..." : "Create Organization"}
                </Button>
            </DialogFooter>
        </>
    );
}