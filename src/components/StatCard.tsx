import React from 'react';

const StatCard = ({ title, value, icon: Icon, color }) => (
  <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg flex items-center space-x-4 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 group border border-slate-200/80 dark:border-slate-700">
    <div className={`bg-opacity-10 p-3 rounded-full ${color} transition-transform duration-300 group-hover:scale-110`}>
      <Icon className="h-6 w-6" />
    </div>
    <div>
      <p className="text-sm text-slate-500 dark:text-slate-400">{title}</p>
      <p className="text-2xl font-bold text-slate-800 dark:text-white">{value}</p>
    </div>
  </div>
);

export default StatCard;