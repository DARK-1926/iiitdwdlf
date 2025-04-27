import { ReactNode } from 'react';
import { Button } from "@/components/ui/button";
import { Link } from 'react-router-dom';

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description: string;
  actionText?: string;
  actionLink?: string;
}

const EmptyState = ({
  icon,
  title,
  description,
  actionText,
  actionLink
}: EmptyStateProps) => {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center animate-fadein">
      <div className="text-5xl mb-4 animate-float animate-pulse-gentle">
        {icon}
      </div>
      <h3 className="text-xl font-semibold mb-2 font-heading animate-fadein">{title}</h3>
      <p className="text-gray-500 mb-6 max-w-md font-body animate-fadein">{description}</p>
      {actionText && actionLink && (
        <Button asChild className="animate-pulse-gentle animate-fadein">
          <Link to={actionLink}>{actionText}</Link>
        </Button>
      )}
    </div>
  );
};

export default EmptyState;
