import React, { useState, useEffect } from 'react';
import { X, Megaphone } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../lib/utils';

interface AnnouncementProps {
  message: string;
  link?: {
    href: string;
    text: string;
  };
  variant?: 'default' | 'info' | 'success' | 'warning' | 'error';
  className?: string;
  id: string; // Unique ID for persistence
}

export const Announcement: React.FC<AnnouncementProps> = ({
  message,
  link,
  variant = 'default',
  className,
  id,
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hasBeenDismissed = localStorage.getItem(`announcement-${id}-dismissed`);
      setIsVisible(!hasBeenDismissed);
    }
  }, [id]);

  const handleDismiss = () => {
    setIsVisible(false);
    if (typeof window !== 'undefined') {
      localStorage.setItem(`announcement-${id}-dismissed`, 'true');
    }
  };

  const getVariantClasses = () => {
    switch (variant) {
      case 'info':
        return 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-200 dark:border-blue-800';
      case 'success':
        return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-200 dark:border-green-800';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-200 dark:border-yellow-800';
      case 'error':
        return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-200 dark:border-red-800';
      case 'default':
      default:
        return 'bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-200 dark:border-indigo-800';
    }
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          transition={{ duration: 0.3 }}
          className={cn(
            'relative flex items-center justify-between p-3 rounded-lg shadow-md text-sm font-medium',
            getVariantClasses(),
            className
          )}
          role="alert"
        >
          <div className="flex items-center space-x-2">
            <Megaphone className="h-4 w-4 flex-shrink-0" />
            <span>{message}</span>
            {link && (
              <a
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:no-underline ml-1"
              >
                {link.text}
              </a>
            )}
          </div>
          <button
            onClick={handleDismiss}
            className="ml-4 p-1 rounded-full hover:bg-current/20 transition-colors duration-200"
            aria-label="Dismiss announcement"
          >
            <X className="h-4 w-4" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
