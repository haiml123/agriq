import { getCommodityLabel, type Trigger, type TriggerCommodityType } from '@/schemas/trigger.schema';
import { Card, CardContent } from '@/components/ui/card';
import { ConditionDisplay, SeverityBadge } from '@/components/triggers';
import { useLocale } from 'next-intl';
import { useTranslationMap } from '@/hooks/use-translation-map';

interface RulePreviewProps {
    trigger: Trigger;
    commodityTypes?: TriggerCommodityType[];
}

export function RulePreview({ trigger, commodityTypes }: RulePreviewProps) {
    const locale = useLocale();
    const resolveCommodityTypeName = useTranslationMap('commodity_type', locale);

    const translatedCommodityType = trigger.commodityType?.id
        ? {
              ...trigger.commodityType,
              name: resolveCommodityTypeName(
                  trigger.commodityType.id,
                  'name',
                  trigger.commodityType.name
              ),
          }
        : trigger.commodityType;

    const translatedCommodityTypes = commodityTypes?.map((type) => ({
        ...type,
        name: resolveCommodityTypeName(type.id, 'name', type.name),
    }));

    const { commodityTypeId, commodityType, conditions, conditionLogic, actions, severity } = trigger;

    return (
        <Card className="bg-emerald-500/5 border-emerald-500/20">
            <CardContent className="pt-6">
                <h3 className="text-sm font-semibold mb-2 text-emerald-700 dark:text-emerald-400">
                    Rule Preview
                </h3>
                <div className="text-sm">
                    <RuleText
                        commodityTypeId={commodityTypeId}
                        commodityType={translatedCommodityType}
                        commodityTypes={translatedCommodityTypes}
                        conditions={conditions}
                        conditionLogic={conditionLogic}
                        actions={actions}
                        severity={severity}
                    />
                </div>
            </CardContent>
        </Card>
    );
}

function RuleText({
    commodityType,
    commodityTypeId,
    commodityTypes,
    conditions,
    conditionLogic,
    actions,
    severity,
}: Pick<Trigger, 'commodityType' | 'commodityTypeId' | 'conditions' | 'conditionLogic' | 'actions' | 'severity'> & {
    commodityTypes?: TriggerCommodityType[];
}) {
    const commodityTypeValue = commodityTypeId || commodityType?.id;

    return (
        <>
            <span className="text-muted-foreground">When </span>

            {(commodityTypeValue || commodityType) && (
                <CommodityClause
                    commodityTypeId={commodityTypeValue}
                    commodityType={commodityType}
                    commodityTypes={commodityTypes}
                />
            )}

            <ConditionsClause conditions={conditions} conditionLogic={conditionLogic} />

            <span className="text-muted-foreground">, send </span>
            <ActionsText actions={actions} />
            <span className="text-muted-foreground"> notification</span>

            {severity && <SeverityClause severity={severity} />}

            <span className="text-muted-foreground">.</span>
        </>
    );
}

function CommodityClause({
    commodityTypeId,
    commodityType,
    commodityTypes,
}: {
    commodityTypeId: Trigger['commodityTypeId'] | undefined;
    commodityType?: Trigger['commodityType'];
    commodityTypes?: TriggerCommodityType[];
}) {
    return (
        <>
            <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                {getCommodityLabel(commodityTypeId, commodityType, commodityTypes)}
            </span>
            <span className="text-muted-foreground"> storage has </span>
        </>
    );
}

function ConditionsClause({
    conditions,
    conditionLogic,
}: Pick<Trigger, 'conditions' | 'conditionLogic'>) {
    return (
        <>
            {conditions.map((condition, index) => (
                <span key={condition.id}>
                    {index > 0 && (
                        <span
                            className={`font-bold ${
                                conditionLogic === 'AND'
                                    ? 'text-emerald-600 dark:text-emerald-400'
                                    : 'text-amber-500'
                            }`}
                        >
                            {' '}{conditionLogic}{' '}
                        </span>
                    )}
                    <ConditionDisplay condition={condition} />
                </span>
            ))}
        </>
    );
}

function ActionsText({ actions }: { actions: Trigger['actions'] }) {
    const actionText = actions.length > 0
        ? actions.map((a) => a.type.toLowerCase()).join(' + ')
        : '...';

    return (
        <span className="font-semibold text-emerald-600 dark:text-emerald-400">
            {actionText}
        </span>
    );
}

function SeverityClause({ severity }: { severity: Trigger['severity'] }) {
    return (
        <>
            <span className="text-muted-foreground"> with </span>
            <SeverityBadge severity={severity} />
            <span className="text-muted-foreground"> severity</span>
        </>
    );
}
