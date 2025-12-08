import { Plus } from 'lucide-react';
import { type Condition, type Trigger } from '@/schemas/trigger.schema';
import { Button } from '@/components/ui/button';
import { ConditionEditor } from '@/components/triggers';

interface ConditionsSectionProps {
    conditions: Condition[];
    conditionLogic: Trigger['conditionLogic'];
    onAddCondition: () => void;
    onUpdateCondition: (index: number, condition: Condition) => void;
    onRemoveCondition: (index: number) => void;
    onUpdateLogic: (logic: Trigger['conditionLogic']) => void;
}

export function ConditionsSection({
    conditions,
    conditionLogic,
    onAddCondition,
    onUpdateCondition,
    onRemoveCondition,
    onUpdateLogic,
}: ConditionsSectionProps) {
    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                    Conditions
                </h3>
                {conditions.length > 1 && (
                    <LogicToggle value={conditionLogic} onChange={onUpdateLogic} />
                )}
            </div>

            <ConditionsList
                conditions={conditions}
                conditionLogic={conditionLogic}
                onUpdate={onUpdateCondition}
                onRemove={onRemoveCondition}
            />

            <Button
                type="button"
                variant="ghost"
                onClick={onAddCondition}
                className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-500/10"
            >
                <Plus className="w-4 h-4 mr-2" />
                Add Condition
            </Button>
        </div>
    );
}

function LogicToggle({
    value,
    onChange,
}: {
    value: Trigger['conditionLogic'];
    onChange: (logic: Trigger['conditionLogic']) => void;
}) {
    const options = ['AND', 'OR'] as const;

    return (
        <div className="flex items-center gap-1 rounded-lg p-1 bg-muted">
            {options.map((option) => (
                <button
                    key={option}
                    type="button"
                    onClick={() => onChange(option)}
                    className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                        value === option
                            ? 'bg-background text-emerald-600 shadow-sm dark:text-emerald-400'
                            : 'text-muted-foreground hover:text-foreground'
                    }`}
                >
                    {option}
                </button>
            ))}
        </div>
    );
}

function ConditionsList({
    conditions,
    conditionLogic,
    onUpdate,
    onRemove,
}: {
    conditions: Condition[];
    conditionLogic: Trigger['conditionLogic'];
    onUpdate: (index: number, condition: Condition) => void;
    onRemove: (index: number) => void;
}) {
    return (
        <div className="space-y-3">
            {conditions.map((condition, index) => (
                <div key={condition.id}>
                    {index > 0 && <LogicDivider logic={conditionLogic} />}
                    <ConditionEditor
                        condition={condition}
                        onChange={(c) => onUpdate(index, c)}
                        onRemove={() => onRemove(index)}
                        canRemove={conditions.length > 1}
                    />
                </div>
            ))}
        </div>
    );
}

function LogicDivider({ logic }: { logic: Trigger['conditionLogic'] }) {
    const colorClass =
        logic === 'AND'
            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
            : 'bg-amber-500/10 text-amber-600 dark:text-amber-400';

    return (
        <div className="flex items-center justify-center py-2">
            <span className={`px-3 py-1 text-xs font-bold rounded-full ${colorClass}`}>
                {logic}
            </span>
        </div>
    );
}
