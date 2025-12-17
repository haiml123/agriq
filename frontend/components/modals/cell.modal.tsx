import { DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useForm } from 'react-hook-form';
import { Cell, CreateCellDto, UpdateCellDto, updateCellSchema } from '@/schemas/sites.schema';
import { zodResolver } from '@hookform/resolvers/zod';


interface CellModalProps {
    compoundName: string;
    cell?: Cell | null;
    onClose: (result?: CreateCellDto | UpdateCellDto | null) => void;
}

export function CellModal({ compoundName, cell, onClose }: CellModalProps) {
    const isEdit = !!cell?.id;

    const {
        register,
        handleSubmit,
        formState: { errors, isValid },
    } = useForm<UpdateCellDto>({
        resolver: zodResolver(updateCellSchema),
        defaultValues: {
            name:  cell?.name,
            capacity: cell?.capacity || 0,
        },
        mode: 'onChange',
    });


    const onSubmit = (data: UpdateCellDto) => {
        onClose(data);
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
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
                <div className="space-y-2">
                    <label htmlFor="cellName" className="text-sm font-medium text-foreground">
                        Cell Name
                    </label>
                    <Input
                        id="cellName"
                        placeholder="e.g. Cell A-101"
                        {...register('name')}
                    />
                    {errors.name && (
                        <p className="text-sm text-destructive">{errors.name.message}</p>
                    )}
                </div>
                <div className="space-y-2">
                    <label htmlFor="capacity" className="text-sm font-medium text-foreground">
                        Capacity (tons)
                    </label>
                    <Input
                        id="capacity"
                        type="number"
                        min={0}
                        placeholder="e.g. 5000"
                        {...register('capacity', { valueAsNumber: true })}
                    />
                    {errors.capacity && (
                        <p className="text-sm text-destructive">{errors.capacity.message}</p>
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
                        {isEdit ? 'Save Changes' : 'Create Cell'}
                    </Button>
                </DialogFooter>
            </form>
        </>
    );
}