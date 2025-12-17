'use client';

import { createContext, ReactNode, useCallback, useContext, useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';

interface ModalItem {
    id: number;
    content: ReactNode;
    resolve: (value: unknown) => void;
}

interface ModalContextValue {
    open: <T = unknown>(content: ReactNode | ((onClose: (result?: T) => void) => ReactNode)) => Promise<T | undefined>;
    close: <T = unknown>(result?: T) => void;
}

const ModalContext = createContext<ModalContextValue | null>(null);

let modalId = 0;

export function ModalProvider({ children }: { children: ReactNode }) {
    const [modals, setModals] = useState<ModalItem[]>([]);

    const close = useCallback((result?: unknown) => {
        setModals((prev) => {
            const last = prev[prev.length - 1];
            last?.resolve(result);
            return prev.slice(0, -1);
        });
    }, []);

    const open = useCallback(<T = unknown>(
        content: ReactNode | ((onClose: (result?: T) => void) => ReactNode)
    ): Promise<T | undefined> => {
        return new Promise((resolve) => {
            const id = modalId++;
            const onClose = (result?: T) => {
                setModals((prev) => prev.filter((m) => m.id !== id));
                resolve(result);
            };

            const resolvedContent = typeof content === 'function' ? content(onClose) : content;

            setModals((prev) => [...prev, { id, content: resolvedContent, resolve: resolve as (value: unknown) => void }]);
        });
    }, []);

    return (
        <ModalContext.Provider value={{ open, close }}>
            {children}
            {modals.map((modal, index) => (
                <Dialog
                    key={modal.id}
                    open={true}
                    onOpenChange={(open) => !open && close()}
                >
                    <DialogContent style={{ zIndex: 50 + index }}>
                        {modal.content}
                    </DialogContent>
                </Dialog>
            ))}
        </ModalContext.Provider>
    );
}

export function useModal() {
    const context = useContext(ModalContext);
    if (!context) {
        throw new Error('useModal must be used within a ModalProvider');
    }
    return context;
}