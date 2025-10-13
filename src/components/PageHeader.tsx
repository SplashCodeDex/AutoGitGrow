import React from 'react';
import { Github } from 'lucide-react';
import { AuroraText } from "./ui/aurora-text";

const PageHeader = ({ title, subtitle }) => (
    <div className="mb-10">
        <div className="flex items-center gap-2 mb-3">
            <Github className="h-8 w-8 md:h-10 md:w-10 text-slate-900 dark:text-white" />
            <h1 className="text-3xl md:text-5xl font-extrabold text-slate-900 dark:text-white tracking-wide">
                <AuroraText>{title}</AuroraText>
            </h1>
        </div>
        <p className="text-lg text-slate-600 dark:text-slate-400">{subtitle}</p>
    </div>
);

export default PageHeader;