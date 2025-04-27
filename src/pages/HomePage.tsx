import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ItemGrid from "@/components/ItemGrid";
import Layout from "@/components/Layout";
import { Search, MapPin, Loader2 } from 'lucide-react';
import { supabase } from "@/integrations/supabase/client";
import { Item, ItemCategory, ItemStatus } from "@/types";
import { toast } from "sonner";

const HomePage = () => {
  const [recentItems, setRecentItems] = useState<{
    lost: Item[],
    found: Item[]
  }>({
    lost: [],
    found: []
  });
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchRecentItems = async () => {
      setLoading(true);
      try {
        // Fetch recent lost items
        const { data: lostItems, error: lostError } = await supabase
          .from('items')
          .select(`
            id, 
            title, 
            description, 
            category, 
            status, 
            location, 
            date, 
            images, 
            reported_by, 
            claimed_by, 
            created_at, 
            updated_at
          `)
          .in('status', ['lost', 'claimed'])
          .order('created_at', { ascending: false })
          .limit(4);
          
        if (lostError) throw lostError;
        
        // Fetch recent found items
        const { data: foundItems, error: foundError } = await supabase
          .from('items')
          .select(`
            id, 
            title, 
            description, 
            category, 
            status, 
            location, 
            date, 
            images, 
            reported_by, 
            claimed_by, 
            created_at, 
            updated_at
          `)
          .eq('status', 'found')
          .order('created_at', { ascending: false })
          .limit(4);
          
        if (foundError) throw foundError;
        
        // Transform the data to match our Item type
        const transformItems = (items: any[]): Item[] => items.map((item) => ({
          id: item.id,
          title: item.title,
          description: item.description,
          category: item.category as ItemCategory,
          status: item.status as ItemStatus,
          location: item.location,
          date: item.date,
          images: item.images || [],
          reportedBy: { id: item.reported_by, name: '', email: '' },
          createdAt: item.created_at,
          updatedAt: item.updated_at
        }));
        
        setRecentItems({
          lost: transformItems(lostItems || []),
          found: transformItems(foundItems || [])
        });
      } catch (error) {
        console.error('Error fetching recent items:', error);
        toast.error('Failed to load recent items');
      } finally {
        setLoading(false);
      }
    };
    
    fetchRecentItems();
  }, []);
  
  return <Layout>
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-blue-50 to-white dark:from-blue-900 dark:to-background py-16 md:py-24 shadow-xl rounded-xl animate-fadein">
        <div className="container mx-auto px-4 flex flex-col md:flex-row items-center">
          <div className="md:w-1/2 mb-8 md:mb-0">
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold mb-4 text-iiit-blue font-heading animate-fadein dark:text-stroke-white">IIIT Dharwad Lost & Found</h1>
            <p className="text-xl md:text-2xl mb-8 max-w-lg text-gray-700 dark:text-gray-300 font-body animate-fadein">If you've Lost It, we've Got It (Maybe).</p>
            <div className="flex flex-col sm:flex-row gap-4 animate-fadein">
              <Button size="lg" asChild className="bg-iiit-blue hover:bg-iiit-blue-dark animate-pulse-gentle shadow-lg">
                <Link to="/report">I Found Something</Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="border-iiit-blue text-iiit-blue hover:bg-iiit-blue/10 animate-pulse-gentle shadow-lg">
                <Link to="/items/lost">I Lost Something</Link>
              </Button>
            </div>
          </div>
          <div className="md:w-1/2 flex justify-center animate-fadein">
            {/* Hero image could go here */}
          </div>
        </div>
      </section>

      {/* Recent Items Section */}
      <section className="py-16 bg-iiit-blue text-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Recently Reported Items</h2>
            <p className="text-lg mb-8 max-w-2xl mx-auto opacity-90">
              Browse through recent lost and found reports from our campus community
            </p>
          </div>
          
          <Tabs defaultValue="lost" className="w-full">
            <div className="flex justify-center mb-6">
              <TabsList>
                <TabsTrigger value="lost">Lost Items</TabsTrigger>
                <TabsTrigger value="found">Found Items</TabsTrigger>
              </TabsList>
            </div>
            
            {loading ? (
              <div className="flex justify-center items-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-primary mr-2" />
                <span>Loading items...</span>
              </div>
            ) : (
              <>
                <TabsContent value="lost">
                  {recentItems.lost.length > 0 ? (
                    <ItemGrid items={recentItems.lost} />
                  ) : (
                    <div className="text-center py-12 text-muted-foreground">
                      No lost items reported yet.
                    </div>
                  )}
                  
                  <div className="text-center mt-8">
                    <Button asChild variant="outline" className="border-iiit-blue text-iiit-blue hover:bg-iiit-blue/10">
                      <Link to="/items/lost">View All Lost Items</Link>
                    </Button>
                  </div>
                </TabsContent>
                
                <TabsContent value="found">
                  {recentItems.found.length > 0 ? (
                    <ItemGrid items={recentItems.found} />
                  ) : (
                    <div className="text-center py-12 text-muted-foreground">
                      No found items reported yet.
                    </div>
                  )}
                  
                  <div className="text-center mt-8">
                    <Button asChild variant="outline" className="border-iiit-blue text-iiit-blue hover:bg-iiit-blue/10">
                      <Link to="/items/found">View All Found Items</Link>
                    </Button>
                  </div>
                </TabsContent>
              </>
            )}
          </Tabs>
        </div>
      </section>
    </Layout>;
};

export default HomePage;
