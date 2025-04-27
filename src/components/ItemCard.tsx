import { Link } from 'react-router-dom';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Item, statusColors, statusLabels, categoryIcons } from "@/types";
import { useState, useRef, useEffect } from 'react';
import { fadeInUp } from '@/lib/animations';
import { useAuth } from "@/contexts/AuthContext";
import ItemActions from './ItemActions';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useNavigate } from 'react-router-dom';

interface ItemCardProps {
  item: Item;
}

const ItemCard = ({ item }: ItemCardProps) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const isOwner = user && item.reportedBy?.id === user.id;
  const [guestModalOpen, setGuestModalOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (cardRef.current) {
      fadeInUp(cardRef.current);
    }
  }, []);

  const formattedDate = new Date(item.date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  return (
    <div ref={cardRef} className="lost-item-card border group transition-transform duration-300 hover:scale-105">
      {user ? (
        <Link to={`/item/${item.id}`} className="block">
          <div className="aspect-square relative overflow-hidden">
            <div className="absolute top-2 left-2 z-10">
              <Badge className={`${statusColors[item.status]}`}>
                {statusLabels[item.status]}
              </Badge>
            </div>
            {item.images && item.images.length > 0 ? (
              <img
                src={item.images[0]}
                alt={item.title}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                onError={(e) => {
                  e.currentTarget.src = '/placeholder.svg';
                }}
              />
            ) : (
              <div className="w-full h-full bg-gray-100 flex items-center justify-center text-4xl">
                {categoryIcons[item.category]}
              </div>
            )}
          </div>
          <div className="p-4">
            <h3 className="font-semibold text-lg line-clamp-1">{item.title}</h3>
            <div className="flex items-center text-sm text-gray-500 mt-1">
              <span className="line-clamp-1">{item.location}</span>
            </div>
            <p className="text-sm mt-2 text-gray-700 line-clamp-2">{item.description}</p>
            <div className="mt-3 flex items-center justify-between">
              <span className="text-xs text-gray-500">{formattedDate}</span>
              <Button
                variant="default"
                size="sm"
                className="transition-transform duration-200 hover:scale-105 focus:scale-105"
                asChild
              >
                <Link to={`/item/${item.id}`}>View Details</Link>
              </Button>
            </div>
          </div>
        </Link>
      ) : (
        <div className="block cursor-not-allowed" onClick={() => setGuestModalOpen(true)}>
          <div className="aspect-square relative overflow-hidden">
            <div className="absolute top-2 left-2 z-10">
              <Badge className={`${statusColors[item.status]}`}>
                {statusLabels[item.status]}
              </Badge>
            </div>
            {item.images && item.images.length > 0 ? (
              <img
                src={item.images[0]}
                alt={item.title}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.src = '/placeholder.svg';
                }}
              />
            ) : (
              <div className="w-full h-full bg-gray-100 flex items-center justify-center text-4xl">
                {categoryIcons[item.category]}
              </div>
            )}
          </div>
          <div className="p-4">
            <h3 className="font-semibold text-lg line-clamp-1">{item.title}</h3>
            <div className="flex items-center text-sm text-gray-500 mt-1">
              <span className="line-clamp-1">{item.location}</span>
            </div>
            <p className="text-sm mt-2 text-gray-700 line-clamp-2">{item.description}</p>
            <div className="mt-3 flex items-center justify-between">
              <span className="text-xs text-gray-500">{formattedDate}</span>
              <Button
                variant="default"
                size="sm"
                className="transition-transform duration-200 opacity-60 cursor-not-allowed"
                disabled
              >
                View Details
              </Button>
            </div>
          </div>
        </div>
      )}
      
      {user && isOwner && (
        <div className="p-4 border-t">
          <ItemActions item={item} />
        </div>
      )}
      <Dialog open={guestModalOpen} onOpenChange={setGuestModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sign In Required</DialogTitle>
            <DialogDescription>
              Please sign in or sign up to view item details or interact with items.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-4 mt-4">
            <Button className="w-full" onClick={() => { setGuestModalOpen(false); navigate('/auth'); }}>
              Sign In / Sign Up
            </Button>
            <Button variant="outline" className="w-full" onClick={() => setGuestModalOpen(false)}>
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default ItemCard;
