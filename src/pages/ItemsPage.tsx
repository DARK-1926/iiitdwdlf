
import { useState } from 'react';
import { useParams } from 'react-router-dom';
import Layout from "@/components/Layout";
import ItemGrid from "@/components/ItemGrid";
import EmptyState from "@/components/EmptyState";
import CategoryFilter from "@/components/CategoryFilter";
import { ItemStatus } from "@/types";
import { useItems } from "@/hooks/use-items";
import { useItemFilter } from "@/hooks/use-item-filter";
import ItemsSearch from "@/components/items/ItemsSearch";

const ItemsPage = () => {
  const { type } = useParams<{ type: string }>();
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  
  const itemStatus: ItemStatus = type === 'found' ? 'found' : 'lost';
  const pageTitle = `${itemStatus === 'lost' ? 'Lost' : 'Found'} Items`;
  
  const { items, loading } = useItems(itemStatus);
  const {
    searchTerm,
    setSearchTerm,
    selectedCategories,
    setSelectedCategories,
    filteredItems
  } = useItemFilter(items);
  
  const emptyState = (
    <EmptyState
      icon={itemStatus === 'lost' ? '😢' : '🔍'}
      title={`No ${itemStatus} items found`}
      description={
        loading ? "Loading items..."
        : searchTerm || selectedCategories.length > 0
          ? "Try adjusting your search or filters"
          : `There are currently no ${itemStatus} items reported. Check back later or report a ${itemStatus === 'lost' ? 'lost' : 'found'} item yourself.`
      }
      actionText={`Report ${itemStatus === 'lost' ? 'a Lost' : 'a Found'} Item`}
      actionLink="/report"
    />
  );

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">{pageTitle}</h1>
        
        <ItemsSearch 
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          isFilterOpen={isFilterOpen}
          onFilterToggle={() => setIsFilterOpen(!isFilterOpen)}
        />
        
        {isFilterOpen && (
          <div className="bg-white dark:bg-card rounded-lg p-4 mb-6 shadow-sm border">
            <CategoryFilter
              selectedCategories={selectedCategories}
              onChange={setSelectedCategories}
            />
          </div>
        )}
        
        <ItemGrid items={filteredItems} emptyState={emptyState} />
      </div>
    </Layout>
  );
};

export default ItemsPage;
