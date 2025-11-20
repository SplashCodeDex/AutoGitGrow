import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

export const TooltipProvider = ({ children }: { children: React.ReactNode }) => {
    return <>{children}</>;
};

export const Tooltip = ({ children }: { children: React.ReactNode }) => {
    const [isVisible, setIsVisible] = useState(false);

    // Clone children to pass down state setters if needed,
    // but simpler to just use context or render props.
    // For this simple implementation, we'll rely on the Trigger and Content being direct children
    // and managing state via a wrapper or context.
    // Actually, let's use a simple Context for cleaner API matching Shadcn.

    return (
        <TooltipContext.Provider value={{ isVisible, setIsVisible }}>
            <div className="relative inline-block" onMouseEnter={() => setIsVisible(true)} onMouseLeave={() => setIsVisible(false)}>
                {children}
            </div>
        </TooltipContext.Provider>
    );
};

const TooltipContext = React.createContext({
    isVisible: false,
    setIsVisible: (v: boolean) => { },
});

export const TooltipTrigger = ({ children, asChild }: { children: React.ReactNode; asChild?: boolean }) => {
    return <>{children}</>;
};

export const TooltipContent = ({ children }: { children: React.ReactNode }) => {
    const { isVisible } = React.useContext(TooltipContext);

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ opacity: 0, y: 5, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 5, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute z-50 px-3 py-1.5 text-xs font-medium text-white bg-slate-900 dark:bg-slate-100 dark:text-slate-900 rounded-md shadow-md -top-10 left-1/2 -translate-x-1/2 whitespace-nowrap pointer-events-none"
                >
                    {children}
                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-900 dark:bg-slate-100 rotate-45" />
                </motion.div>
            )}
        </AnimatePresence>
    );
};
