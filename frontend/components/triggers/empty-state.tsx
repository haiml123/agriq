'use client';

import { Bell, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface EmptyStateProps {
    onCreateTrigger: () => void;
}

export function EmptyState({ onCreateTrigger }: EmptyStateProps) {
    return (
        <Card className="text-center items-center py-16 border-dashed">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center bg-muted text-muted-foreground">
                <Bell className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-medium mb-1">No triggers yet</h3>
            <p className="text-muted-foreground mb-4">Create your first trigger to start receiving alerts</p>
            <Button onClick={onCreateTrigger} className="bg-emerald-500 hover:bg-emerald-600 w-fit">
                <Plus className="w-4 h-4 mr-2" />
                Create Trigger
            </Button>
        </Card>
    );
}