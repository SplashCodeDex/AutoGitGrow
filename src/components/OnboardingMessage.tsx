import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AppleHelloEnglishEffect } from './ui/apple-hello-effect'; // Import the new component
import { cn } from '../lib/utils'; // Add this import

interface OnboardingMessageProps {
  onClose: () => void;
  isDarkMode: boolean;
}

const OnboardingMessage: React.FC<OnboardingMessageProps> = ({ onClose, isDarkMode }) => {
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[100]" // High z-index to be on top
      >
        <motion.div
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -50, opacity: 0 }}
          className={`relative rounded-lg shadow-xl p-6 max-w-md w-full mx-auto border max-h-[90vh] overflow-y-auto ${isDarkMode ? 'bg-slate-800 text-slate-200 border-slate-700' : 'bg-white text-slate-800 border-slate-200'}`}
        >
          <div className="mb-4">
            <AppleHelloEnglishEffect className="w-32 h-auto mx-auto" speed={0.7} />
          </div>
          <h2 className="text-2xl font-bold mb-4 text-center">Welcome to AutoGitGrow!</h2>
          <p className="mb-4">
            Your personal GitHub networking assistant is ready to help you grow your presence.
            Here's a quick overview of what you can do:
          </p>
          <ul className="list-disc list-inside mb-4 space-y-1">
            <li>Track your followers and stars.</li>
            <li>Automate follow-backs and star-backs.</li>
            <li>Discover reciprocity data and suggested users.</li>
            <li>Get insights from Gemini AI.</li>
          </ul>
          <p className="mb-6">
            Explore the dashboard to see your analytics and configure your settings to get started.
          </p>
          <button
            onClick={onClose}
            className={`w-full py-2 px-4 rounded-md font-semibold transition-colors duration-200 ${isDarkMode ? 'bg-indigo-600 hover:bg-indigo-700 text-white' : 'bg-indigo-500 hover:bg-indigo-600 text-white'}`}
          >
            Got it! Let's go!
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default OnboardingMessage;