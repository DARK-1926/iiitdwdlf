
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { ItemCategory, categoryIcons } from "@/types";
import { X } from 'lucide-react';

interface CategoryFilterProps {
  selectedCategories: ItemCategory[];
  onChange: (categories: ItemCategory[]) => void;
}

const allCategories: ItemCategory[] = [
  'electronics',
  'clothing',
  'accessories',
  'keys',
  'documents',
  'pets',
  'other'
];

const CategoryFilter = ({ selectedCategories, onChange }: CategoryFilterProps) => {
  const toggleCategory = (category: ItemCategory) => {
    if (selectedCategories.includes(category)) {
      onChange(selectedCategories.filter(c => c !== category));
    } else {
      onChange([...selectedCategories, category]);
    }
  };
  
  const clearFilters = () => {
    onChange([]);
  };
  
  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium">Filter by Category</h3>
        {selectedCategories.length > 0 && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={clearFilters}
            className="h-8 text-xs text-gray-500"
          >
            <X className="h-3 w-3 mr-1" />
            Clear
          </Button>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        {allCategories.map((category) => {
          const isSelected = selectedCategories.includes(category);
          return (
            <Button
              key={category}
              variant={isSelected ? "default" : "outline"}
              size="sm"
              onClick={() => toggleCategory(category)}
              className={`rounded-full text-xs capitalize ${
                isSelected 
                  ? 'bg-lost-purple hover:bg-lost-purple-dark' 
                  : 'hover:text-lost-purple hover:border-lost-purple'
              }`}
            >
              <span className="mr-1">{categoryIcons[category]}</span>
              {category}
            </Button>
          );
        })}
      </div>
    </div>
  );
};

export default CategoryFilter;
