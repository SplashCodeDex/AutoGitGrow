import React from 'react';
import { motion } from "framer-motion";
import { CardContainer, CardBody, CardItem } from './ui/3d-card';

const StatCard = ({ title, value, icon: Icon, color }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, ease: "easeOut" }}
  >
    <CardContainer className="inter-var">
      <CardBody className="bg-white dark:bg-slate-800 p-3 rounded-xl shadow-lg flex items-center justify-center space-x-2 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 group border border-slate-200/80 dark:border-slate-700 w-full h-full min-h-[100px]">
        <CardItem translateZ="50" className={`p-1.5 rounded-md bg-slate-100 dark:bg-slate-700 transition-transform duration-300 group-hover:scale-110`}>
          <Icon className="h-5 w-5 text-slate-500 dark:text-slate-400" />
        </CardItem>
        <CardItem translateZ="60">
          <div className="min-w-0 flex-grow text-center">
            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{title}</p>
            <p className="text-lg font-bold text-slate-800 dark:text-white truncate">{value}</p>
          </div>
        </CardItem>
      </CardBody>
    </CardContainer>
  </motion.div>
);

export default StatCard;