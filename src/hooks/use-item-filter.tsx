
import { useState, useEffect } from 'react';
import { Item, ItemCategory } from "@/types";

export function useItemFilter(items: Item[]) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<ItemCategory[]>([]);
  const [filteredItems, setFilteredItems] = useState<Item[]>([]);
  
  useEffect(() => {
    let results = [...items];
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      results = results.filter(item => 
        item.title.toLowerCase().includes(term) || 
        item.description.toLowerCase().includes(term) ||
        item.location.toLowerCase().includes(term)
      );
    }
    
    if (selectedCategories.length > 0) {
      results = results.filter(item => selectedCategories.includes(item.category));
    }
    
    setFilteredItems(results);
  }, [searchTerm, selectedCategories, items]);

  return {
    searchTerm,
    setSearchTerm,
    selectedCategories,
    setSelectedCategories,
    filteredItems
  };
}
