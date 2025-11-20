import React, { forwardRef } from 'react';
import { UserPlus, UserMinus, Users, Star, Github } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Card, CardContent } from './ui/card';

interface ActivityItem {
  type: string;
  target: string;
  time: Date | string | number;
}

interface ActivityCardProps {
  title?: string;
  value?: string | number;
  icon?: React.ElementType;
  description?: string;
  color?: string;
  item: ActivityItem;
}

const ActivityCard = forwardRef<HTMLDivElement, ActivityCardProps>(({ title, value, icon: IconComponent, description, color, item }, ref) => {
  let Icon;
  let iconColor;

  switch (item.type) {
    case 'Follow': Icon = UserPlus; iconColor = 'text-green-500'; break;
    case 'Unfollow': Icon = UserMinus; iconColor = 'text-red-500'; break;
    case 'Star': Icon = Star; iconColor = 'text-yellow-400'; break;
    case 'New Follower': Icon = Users; iconColor = 'text-blue-500'; break;
    default: Icon = Github; iconColor = 'text-slate-400';
  }

  return (
    <Card ref={ref} className="transition-all duration-200 hover:shadow-md border-slate-200 dark:border-slate-700">
      <CardContent className="flex items-start space-x-2 p-3">
        <div className="p-1.5 bg-slate-100 dark:bg-slate-700 rounded-full mt-1 flex-shrink-0">
          <Icon className={`h-4 w-4 ${iconColor}`} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm text-slate-700 dark:text-slate-300">
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
      </CardContent>
    </Card>
  );
}
);

ActivityCard.displayName = 'ActivityCard';

export default ActivityCard;
