
import { ReactNode, useRef, useEffect } from 'react';
import { Item } from "@/types";
import ItemCard from './ItemCard';
import { staggerFadeIn } from '@/lib/animations';

interface ItemGridProps {
  items: Item[];
  emptyState?: ReactNode;
}

const ItemGrid = ({ items, emptyState }: ItemGridProps) => {
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (gridRef.current) {
      const elements = Array.from(gridRef.current.children) as HTMLElement[];
      staggerFadeIn(elements);
    }
  }, [items]);

  if (items.length === 0 && emptyState) {
    return <>{emptyState}</>;
  }

  return (
    <div ref={gridRef} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {items.map(item => (
        <ItemCard key={item.id} item={item} />
      ))}
    </div>
  );
};

export default ItemGrid;
