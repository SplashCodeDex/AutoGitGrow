import React, { useState } from 'react';
import { ChevronLeft, Sun, Moon, Search, Settings, LayoutDashboard, Activity, HeartHandshake, Sparkles } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useTheme } from '../lib/state';

const NewSidebar = ({ navItems, activeTab, setActiveTab }) => {
    const { isDarkMode, toggleTheme } = useTheme();
    const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <motion.aside 
        initial={{ width: isCollapsed ? 100 : 288 }}
        animate={{ width: isCollapsed ? 100 : 288 }}
        transition={{ duration: 0.5, ease: [0.32, 0.72, 0, 1] }}
        className={`relative bg-gradient-to-b from-white to-gray-50 dark:from-[#111111] dark:to-black border-r border-gray-200/80 dark:border-white/10 flex flex-col h-full z-50 flex-shrink-0`}>
        
        {/* Aurora Effect */}
        <div className="absolute inset-0 overflow-hidden z-0">
            <motion.div 
                className="absolute -top-1/4 -left-1/4 w-1/2 h-1/2 bg-indigo-500/30 dark:bg-indigo-500/20 rounded-full"
                animate={{ 
                    scale: [1, 1.2, 1], 
                    rotate: [0, 90, 0],
                    x: [0, 50, 0],
                    y: [0, 50, 0]
                }}
                transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
            />
            <motion.div 
                className="absolute -bottom-1/4 -right-1/4 w-1/2 h-1/2 bg-orange-500/30 dark:bg-orange-500/20 rounded-full"
                animate={{ 
                    scale: [1, 1.1, 1], 
                    rotate: [0, -90, 0],
                    x: [0, -50, 0],
                    y: [0, -50, 0]
                }}
                transition={{ duration: 25, repeat: Infinity, ease: 'easeInOut' }}
            />
            <div className="absolute inset-0 backdrop-blur-2xl"></div>
        </div>

        <div className="relative z-10 flex flex-col h-full">
            {/* User Profile */}
            <div className={`flex items-center gap-3 px-6 py-4 h-20`}>
                <img src="https://i.pravatar.cc/150?u=a042581f4e29026704d" alt="User Avatar" className="w-11 h-11 rounded-full border-2 border-white/50"/>
                <AnimatePresence>
                {!isCollapsed &&
                <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0, transition:{delay: 0.2} }} exit={{ opacity: 0, x: -10 }} >
                    <p className="font-bold text-sm text-gray-800 dark:text-white">Jackson D.</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Manager</p>
                </motion.div>}
                </AnimatePresence>
                <button onClick={() => setIsCollapsed(!isCollapsed)} className="p-2 rounded-full bg-white/50 dark:bg-black/20 hover:bg-white/80 dark:hover:bg-black/40 transition-colors duration-200 ml-auto">
                    <ChevronLeft size={16} className={`transition-transform duration-500 ease-in-out ${isCollapsed && "rotate-180"}`}/>
                </button>
            </div>
            
            {/* Main Navigation */}
            <nav className="flex-grow p-4">
                <ul className="space-y-2 relative">
                  <AnimatePresence>
                    {navItems.map(item => (
                        <NavItem 
                        key={item.id}
                        icon={item.icon} 
                        label={item.label} 
                        isCollapsed={isCollapsed} 
                        active={activeTab === item.id} 
                        onClick={() => setActiveTab(item.id)} 
                        />
                    ))}
                  </AnimatePresence>
                </ul>
            </nav>

            {/* Footer */}
            <div className={`p-4 mt-auto`}>
                <ul className="space-y-2">
                    <NavItem icon={Settings} label="Settings" isCollapsed={isCollapsed} active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} />
                </ul>
                <div className={`mt-2`}>
                    <ThemeToggle isCollapsed={isCollapsed} />
                </div>
            </div>
        </div>
    </motion.aside>
  );
};

const NavItem = ({ icon: Icon, label, isCollapsed, active, onClick }) => {
  return (
    <li onClick={onClick} className={`relative flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors duration-200 ease-in-out cursor-pointer text-gray-600 dark:text-gray-300 hover:bg-black/5 dark:hover:bg-white/5 ${isCollapsed && 'justify-center'}`}>
        {active && (
            <motion.div
                layoutId="active-pill"
                className="absolute inset-0 bg-indigo-500/10 dark:bg-indigo-500/20 shadow-inner dark:shadow-indigo-500/10 rounded-lg"
                style={{ borderRadius: 12 }}
                transition={{ duration: 0.5, type: 'spring' }}
            />
        )}
        <Icon className={`relative z-10 h-6 w-6 flex-shrink-0 transition-colors duration-300 ${active ? 'text-indigo-500' : 'text-gray-400 dark:text-gray-500'}`} />
        <AnimatePresence>
        {!isCollapsed && (
          <motion.span 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1, transition: {delay: 0.2} }} 
            exit={{ opacity: 0 }} 
            className="relative z-10 flex-grow font-semibold text-sm text-gray-700 dark:text-gray-200"
          >
            {label}
          </motion.span>
        )}
        </AnimatePresence>
    </li>
  );
};

const ThemeToggle = ({ isCollapsed }) => {
    const { isDarkMode, toggleTheme, setTheme } = useTheme();
    return (
        <div className={`relative flex items-center transition-all duration-300 ${isCollapsed ? 'justify-center' : 'w-full h-14 rounded-2xl bg-white/20 dark:bg-black/20 backdrop-blur-sm border border-white/30 dark:border-black/30 p-1.5'}`}>
            <AnimatePresence mode="wait">
                {isCollapsed ? (
                     <motion.button 
                        key="collapsed-theme-btn"
                        initial={{opacity: 0, scale: 0.5}}
                        animate={{opacity: 1, scale: 1}}
                        exit={{opacity: 0, scale: 0.5}}
                        onClick={toggleTheme} className="w-12 h-12 flex items-center justify-center rounded-full bg-white/20 dark:bg-black/20 backdrop-blur-md border border-white/30 dark:border-black/30">
                        {isDarkMode ? <Moon size={20} className="text-indigo-400"/> : <Sun size={20} className="text-yellow-300" />}
                    </motion.button>
                ) : (
                    <motion.div key="expanded-theme-toggle" className="w-full h-full flex items-center" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>
                        <motion.div
                            layoutId="theme-pill"
                            className='absolute inset-1.5 w-[calc(50%-6px)] bg-white/50 dark:bg-black/40 shadow-lg rounded-xl'
                            style={{ 
                                transform: isDarkMode ? 'translateX(100%)' : 'translateX(0%)',
                            }}
                            transition={{ duration: 0.5, type: 'spring', bounce: 0.2 }}
                        />
                        <button onClick={() => setTheme('light')} className={`relative z-10 flex-1 flex items-center justify-center gap-2 p-2 rounded-lg transition-colors duration-300 ${!isDarkMode ? 'text-indigo-600' : 'text-gray-500'}`}>
                            <Sun size={18}/>
                            <span className="font-semibold text-sm">Light</span>
                        </button>
                        <button onClick={() => setTheme('dark')} className={`relative z-10 flex-1 flex items-center justify-center gap-2 p-2 rounded-lg transition-colors duration-300 ${isDarkMode ? 'text-indigo-400' : 'text-gray-500'}`}>
                            <Moon size={18}/>
                            <span className="font-semibold text-sm">Dark</span>
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}

export default NewSidebar;
