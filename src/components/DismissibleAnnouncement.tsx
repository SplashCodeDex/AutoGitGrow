import React, { useState, useEffect } from 'react';
import { Announcement, AnnouncementTag, AnnouncementTitle } from './ui/announcement';
import { X, Megaphone } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface DismissibleAnnouncementProps {
  message: string;
  link?: {
    href: string;
    text: string;
  };
  variant?: 'default' | 'secondary' | 'destructive' | 'outline';
  id: string; // Unique ID for persistence
  className?: string;
}

export const DismissibleAnnouncement: React.FC<DismissibleAnnouncementProps> = ({
  message,
  link,
  variant,
  id,
  className,
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

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          transition={{ duration: 0.3 }}
          className={className} // Apply className to the motion.div
        >
          <Announcement variant={variant} className="w-full">
            <AnnouncementTag>
              <Megaphone className="h-4 w-4" />
            </AnnouncementTag>
            <AnnouncementTitle>
              {message}
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
            </AnnouncementTitle>
            <button
              onClick={handleDismiss}
              className="ml-auto p-1 rounded-full hover:bg-foreground/10 transition-colors duration-200"
              aria-label="Dismiss announcement"
            >
              <X className="h-4 w-4" />
            </button>
          </Announcement>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
