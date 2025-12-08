interface ValidationErrorsProps {
    errors: string[];
}

export function ValidationErrors({ errors }: ValidationErrorsProps) {
    if (errors.length === 0) return null;

    return (
        <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
            <ul className="text-sm text-destructive list-disc list-inside">
                {errors.map((error, i) => (
                    <li key={i}>{error}</li>
                ))}
            </ul>
        </div>
    );
}
