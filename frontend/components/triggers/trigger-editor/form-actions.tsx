import { Button } from '@/components/ui/button';

interface FormActionsProps {
    isEditing: boolean;
    isLoading?: boolean;
    isValid: boolean;
    onCancel: () => void;
    onSubmit: () => void | Promise<void>;
}

export function FormActions({
    isEditing,
    isLoading,
    isValid,
    onCancel,
    onSubmit,
}: FormActionsProps) {
    return (
        <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="ghost" onClick={onCancel}>
                Cancel
            </Button>
            <Button
                type="button"
                onClick={onSubmit}
                disabled={!isValid || isLoading}
                className="bg-emerald-500 hover:bg-emerald-600"
            >
                {isLoading ? 'Saving...' : isEditing ? 'Update Trigger' : 'Create Trigger'}
            </Button>
        </div>
    );
}
