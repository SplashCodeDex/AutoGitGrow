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
          <CardBody className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-lg flex items-center space-x-3 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 group border border-slate-200/80 dark:border-slate-700">
            <CardItem translateZ="50" className={`bg-opacity-10 p-2 rounded-full ${color} transition-transform duration-300 group-hover:scale-110`}>
              <Icon className="h-5 w-5" />
            </CardItem>
            <CardItem translateZ="60">
              <div className="min-w-0">
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{title}</p>
                <p className="text-xl font-bold text-slate-800 dark:text-white truncate">{value}</p>
              </div>
            </CardItem>
          </CardBody>    </CardContainer>
  </motion.div>
);

export default StatCard;