import React from 'react';
import { UserPlus, UserMinus, Users, Star, Github } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface ActivityCardProps {
  item: {
    type: string;
    target: string;
    time: Date;
  };
  isDarkMode: boolean;
}

const ActivityCard = React.forwardRef<HTMLDivElement, ActivityCardProps>(
  ({ item, isDarkMode }, ref) => {
    let Icon, color;
    switch (item.type) {
      case 'Follow': Icon = UserPlus; color = 'text-green-500'; break;
      case 'Unfollow': Icon = UserMinus; color = 'text-red-500'; break;
      case 'Star': Icon = Star; color = 'text-yellow-400'; break;
      case 'New Follower': Icon = Users; color = 'text-blue-500'; break;
      default: Icon = Github; color = 'text-slate-400';
    }

    return (
      <div
        ref={ref}
        className={`flex items-start space-x-3 p-4 rounded-lg shadow-sm transition-all duration-200
          ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'} border`}
      >
        <div className="p-2 bg-slate-100 dark:bg-slate-700 rounded-full mt-1 flex-shrink-0">
          <Icon className={`h-4 w-4 ${color}`} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-slate-700 dark:text-slate-300">
            <span className="font-semibold truncate">{item.type}:</span>{' '}
            <a
              href={`https://github.com/${item.target}`}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:underline"
            >
              {item.target}
            </a>
          </p>
          <p className="text-slate-500 dark:text-slate-500 text-xs">
            {formatDistanceToNow(item.time, { addSuffix: true })}
          </p>
        </div>
      </div>
    );
  }
);

ActivityCard.displayName = 'ActivityCard';

export default ActivityCard;