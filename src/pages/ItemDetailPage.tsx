import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Layout from "@/components/Layout";
import { ArrowLeft, CalendarIcon, MapPinIcon, Loader2, Check } from 'lucide-react';
import { statusColors, statusLabels, categoryIcons, ItemStatus, ItemCategory } from "@/types";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import ClaimDialog from "@/components/ClaimDialog";
import { fadeInUp } from '@/lib/animations';
import anime from 'animejs';
import { useAuth } from "@/contexts/AuthContext";
import ItemLocationMap from '@/components/ItemLocationMap';
import NotificationBadge from '@/components/NotificationBadge';
import ItemActions from '@/components/ItemActions';
import { Comments } from '@/components/Comments';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ItemDetail {
  id: string;
  title: string;
  description: string;
  category: ItemCategory;
  status: ItemStatus;
  location: string;
  date: string;
  images: string[];
  reportedBy: string;
  claimedBy?: string | null;
  createdAt: string;
  updatedAt: string;
  isVisible: boolean;
  coordinates?: {
    latitude: number;
    longitude: number;
  } | null;
}

// Add a type for claims
interface Claim {
  id: string;
  user_id: string;
  description: string;
  status: string;
  created_at: string;
  contact?: string;
  profile: any; // Now required
}

const ItemDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const [item, setItem] = useState<ItemDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [showClaim, setShowClaim] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const { user } = useAuth();
  const navigate = useNavigate();
  const [claimers, setClaimers] = useState<Claim[]>([]);
  
  const fetchItemDetails = async () => {
    if (!id) return;

    try {
      console.log(`Fetching details for item ${id}`);
      const { data, error } = await supabase
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
          updated_at,
          location_lat,
          location_lng,
          is_visible
        `)
        .eq('id', id)
        .single();

      if (error) {
        console.error('Supabase error fetching item:', error);
        throw error;
      }

      if (!data) {
        console.error('Item not found in database');
        throw new Error("Item not found");
      }

      console.log('Item data retrieved:', data);

      const coordinates = (typeof data.location_lat === 'number' && typeof data.location_lng === 'number')
        ? { latitude: data.location_lat, longitude: data.location_lng }
        : null;

      const itemData: ItemDetail = {
        id: data.id,
        title: data.title,
        description: data.description,
        category: data.category as ItemCategory,
        status: data.status as ItemStatus,
        location: data.location,
        date: data.date,
        images: data.images || [],
        reportedBy: data.reported_by,
        claimedBy: data.claimed_by,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
        isVisible: data.is_visible,
        coordinates
      };

      setItem(itemData);

      setTimeout(() => {
        anime({
          targets: '.detail-content > *',
          translateY: [20, 0],
          opacity: [0, 1],
          delay: anime.stagger(100),
          easing: 'easeOutExpo',
          duration: 800
        });
      }, 200);

    } catch (error) {
      console.error('Error fetching item details:', error);
      toast.error('Failed to load item details');
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchItemDetails();
    
    const channel = supabase
      .channel(`item_${id}`)
      .on('postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'items',
          filter: `id=eq.${id}`
        },
        (payload) => {
          console.log('Item real-time update received:', payload);
          fetchItemDetails();
        }
      )
      .on('postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'items',
          filter: `id=eq.${id}`
        },
        (payload) => {
          console.log('Item deleted:', payload);
          toast.info('This item has been deleted');
          const status = item?.status || 'lost';
          navigate(`/items/${status}`);
        }
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, [id]);

  // Fetch claimers for this item (for owner only)
  useEffect(() => {
    const fetchClaimers = async () => {
      if (!item || !user || user.id !== item.reportedBy) return;
      const { data, error } = await supabase
        .from('claims')
        .select('id, user_id, description, status, created_at, contact')
        .eq('item_id', item.id);
      if (error) {
        console.error('Error fetching claimers:', error);
        return;
      }
      // Fetch profiles for all user_ids in claims
      const userIds = (data || []).map((c) => c.user_id);
      let profilesMap = {};
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name, email')
          .in('id', userIds);
        profilesMap = (profiles || []).reduce((acc, p) => {
          acc[p.id] = p;
          return acc;
        }, {});
      }
      // Attach profile info to each claim if available
      const claimsWithProfiles = (Array.isArray(data) ? data : []).map((claim) => {
        if (!claim || typeof claim !== 'object' || 'code' in claim || !('user_id' in claim)) return null;
        const validClaim = claim as Claim;
        return {
          ...validClaim,
          profile: profilesMap[validClaim.user_id] || null
        };
      }).filter((c): c is Claim => !!c);
      setClaimers(claimsWithProfiles);
    };
    fetchClaimers();
  }, [item, user]);

  // Handler to close/delete a claim
  const handleCloseClaim = async (claimId: string) => {
    if (!window.confirm('Are you sure you want to close this claim?')) return;
    const { error } = await supabase.from('claims').delete().eq('id', claimId);
    if (error) {
      toast.error('Failed to close claim');
      return;
    }
    setClaimers((prev) => prev.filter((c) => c.id !== claimId));
    toast.success('Claim closed');
  };

  const formattedDate = item?.date 
    ? new Date(item.date).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    : '';

  const nextImage = () => {
    if (!item?.images?.length) return;
    setCurrentImageIndex((prev) => (prev + 1) % item.images.length);
  };

  const prevImage = () => {
    if (!item?.images?.length) return;
    setCurrentImageIndex((prev) => (prev - 1 + item.images.length) % item.images.length);
  };

  const isReporter = user && item && user.id === item.reportedBy;
  
  const isClaimer = user && item && user.id === item.claimedBy;
  
  const handleClaimSuccess = () => {
    if (id) {
      toast.success("Claim submitted successfully");
      fetchItemDetails();
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-12 flex flex-col items-center justify-center min-h-[60vh]">
          <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
          <p className="text-lg text-muted-foreground">Loading item details...</p>
        </div>
      </Layout>
    );
  }

  if (!item) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-12">
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold mb-4">Item Not Found</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6">The item you're looking for doesn't exist or has been removed.</p>
            <Link to="/">
              <Button>Return Home</Button>
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <Link to={`/items/${item.status}`} className="inline-flex items-center mb-6 text-sm hover:text-primary transition-colors">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to {item.status === 'lost' ? 'Lost' : 'Found'} Items
        </Link>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-card rounded-lg overflow-hidden shadow">
              {item.images && item.images.length > 0 ? (
                <div className="relative">
                  <img
                    src={item.images[currentImageIndex]}
                    alt={item.title}
                    className="w-full aspect-square object-cover"
                    onError={(e) => {
                      e.currentTarget.src = '/placeholder.svg';
                    }}
                  />
                  {item.images.length > 1 && (
                    <>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white rounded-full"
                        onClick={prevImage}
                      >
                        <ArrowLeft className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white rounded-full"
                        onClick={nextImage}
                      >
                        <ArrowLeft className="h-4 w-4 transform rotate-180" />
                      </Button>
                      <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1">
                        {item.images.map((_, index) => (
                          <button
                            key={index}
                            className={`w-2 h-2 rounded-full ${
                              index === currentImageIndex ? 'bg-white' : 'bg-white/50'
                            }`}
                            onClick={() => setCurrentImageIndex(index)}
                            aria-label={`Go to image ${index + 1}`}
                          />
                        ))}
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <div className="w-full aspect-square bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-6xl">
                  {categoryIcons[item.category]}
                </div>
              )}
            </div>

            {item.coordinates && (
              <div className="mt-4 bg-white dark:bg-card rounded-lg overflow-hidden shadow">
                <div className="p-4 border-b">
                  <h3 className="font-medium">Location</h3>
                </div>
                <div className="h-[200px]">
                  <ItemLocationMap 
                    latitude={item.coordinates.latitude} 
                    longitude={item.coordinates.longitude} 
                  />
                </div>
              </div>
            )}
          </div>
          
          <div className="lg:col-span-2 detail-content">
            <div className="flex justify-between items-start mb-4">
              <div className="flex flex-wrap gap-2 items-center">
                <Badge className={`${statusColors[item.status]}`}>
                  {statusLabels[item.status]}
                </Badge>
                
                {!item.isVisible && (
                  <Badge variant="outline" className="border-amber-500 text-amber-500">
                    Hidden
                  </Badge>
                )}
              </div>
              
              {user && <NotificationBadge />}
            </div>
            
            <h1 className="text-3xl font-bold mb-2">{item.title}</h1>
            
            <div className="flex items-center text-gray-500 dark:text-gray-400 mb-6">
              <CalendarIcon className="h-4 w-4 mr-2" />
              <span>{formattedDate}</span>
            </div>
            
            <div className="flex items-start gap-2 mb-6">
              <MapPinIcon className="h-5 w-5 text-gray-500 dark:text-gray-400 mt-0.5" />
              <p className="text-gray-700 dark:text-gray-300">{item.location}</p>
            </div>
            
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-3">Description</h2>
              <p className="whitespace-pre-line text-gray-700 dark:text-gray-300">{item.description}</p>
              <div className="mt-2 text-sm text-muted-foreground">
                <span className="font-medium">Owner: </span>
                {/* Try to show owner's name or email */}
                {user && item.reportedBy && (
                  <OwnerInfo userId={item.reportedBy} />
                )}
              </div>
            </div>
            
            {isReporter && (
              <div className="mb-6">
                <h3 className="text-lg font-medium mb-2">Manage Item</h3>
                <ItemActions 
                  item={{ 
                    id: item.id,
                    title: item.title,
                    description: item.description,
                    category: item.category,
                    status: item.status,
                    location: item.location,
                    date: item.date,
                    images: item.images || [],
                    reportedBy: { id: item.reportedBy, name: '', email: '' },
                    claimedBy: item.claimedBy ? { id: item.claimedBy, name: '', email: '' } : undefined,
                    createdAt: item.createdAt,
                    updatedAt: item.updatedAt,
                    isVisible: item.isVisible
                  }} 
                  onUpdate={fetchItemDetails} 
                />
              </div>
            )}
            
            <div className="flex flex-wrap gap-4 mb-8">
              {!isReporter && !isClaimer && user && (
                <Button 
                  variant={item.status === 'lost' ? 'default' : 'outline'}
                  onClick={() => setShowClaim(true)}
                >
                  {item.status === 'lost' ? 'I Found This' : 'This is Mine'}
                </Button>
              )}

              {isReporter && (
                <Button variant="outline" disabled>
                  <Check className="mr-2 h-4 w-4" />
                  You Reported This
                </Button>
              )}

              {isClaimer && (
                <Button variant="outline" disabled>
                  <Check className="mr-2 h-4 w-4" />
                  You Claimed This
                </Button>
              )}
              
              {item.claimedBy && !isClaimer && !isReporter && (
                <Badge variant="outline" className="py-2 px-4">
                  This item has been claimed
                </Badge>
              )}
            </div>
            
            {/* Claims List for Owner */}
            {isReporter && (
              <div className="mb-8">
                <h2 className="text-xl font-semibold mb-3">Claims for this Item</h2>
                {claimers.length === 0 ? (
                  <div className="text-muted-foreground">No claims yet.</div>
                ) : (
                  <div className="space-y-3">
                    {claimers.map((claim) => (
                      <div key={claim.id} className="flex flex-col md:flex-row md:items-center md:justify-between bg-muted/30 rounded p-3">
                        <div>
                          <div className="font-medium">{claim.profile?.full_name || claim.profile?.email || claim.user_id}</div>
                          <div className="text-sm text-muted-foreground">{claim.profile?.email}</div>
                          <div className="text-sm mt-1">Claim: {claim.description}</div>
                          <div className="text-sm mt-1">Contact: {claim.contact || 'N/A'}</div>
                          <div className="text-xs text-muted-foreground mt-1">Status: {claim.status} | Claimed at: {new Date(claim.created_at).toLocaleString()}</div>
                        </div>
                        <div className="flex flex-col gap-2 md:items-end md:justify-end">
                          {claim.profile?.email && (
                            <a
                              href={`mailto:${claim.profile.email}`}
                              className="inline-block bg-primary text-white px-3 py-1 rounded hover:bg-primary/80 mb-2 md:mb-0"
                            >
                              Contact
                            </a>
                          )}
                          {claim.status !== 'approved' && (
                            <Button
                              variant="default"
                              size="sm"
                              onClick={async () => {
                                // Approve claim: set claim status, update item status and claimed_by
                                const { error: claimError } = await supabase
                                  .from('claims')
                                  .update({ status: 'approved' })
                                  .eq('id', claim.id);
                                if (claimError) {
                                  toast.error('Failed to approve claim');
                                  return;
                                }
                                const { error: itemError } = await supabase
                                  .from('items')
                                  .update({ status: 'claimed', claimed_by: claim.user_id })
                                  .eq('id', item.id);
                                if (itemError) {
                                  toast.error('Failed to update item status');
                                  return;
                                }
                                setClaimers((prev) => prev.map((c) => c.id === claim.id ? { ...c, status: 'approved' } : c));
                                toast.success('Claim approved and item marked as claimed');
                                fetchItemDetails();
                              }}
                            >
                              Approve
                            </Button>
                          )}
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleCloseClaim(claim.id)}
                          >
                            Close
                          </Button>
                        </div>
                      </div>
                    ))}
                    {/* Toggle claim status button */}
                    {(() => {
                      const approvedClaim = claimers.find((c) => c.status === 'approved');
                      if (item.status === 'claimed') {
                        // Allow mark as lost (unclaim)
                        return (
                          <Button
                            variant="outline"
                            className="mt-4"
                            onClick={async () => {
                              const { error } = await supabase
                                .from('items')
                                .update({ status: 'lost', claimed_by: null })
                                .eq('id', item.id);
                              if (error) {
                                toast.error('Failed to mark as lost');
                                return;
                              }
                              toast.success('Item marked as lost');
                              fetchItemDetails();
                            }}
                          >
                            Mark as Lost
                          </Button>
                        );
                      } else if (approvedClaim) {
                        // Allow mark as claimed
                        return (
                          <Button
                            variant="default"
                            className="mt-4"
                            onClick={async () => {
                              const { error } = await supabase
                                .from('items')
                                .update({ status: 'claimed', claimed_by: approvedClaim.user_id })
                                .eq('id', item.id);
                              if (error) {
                                toast.error('Failed to mark as claimed');
                                return;
                              }
                              toast.success('Item marked as claimed');
                              fetchItemDetails();
                            }}
                          >
                            Mark as Claimed
                          </Button>
                        );
                      }
                      return null;
                    })()}
                  </div>
                )}
              </div>
            )}
            
            {isReporter && item.status === 'claimed' && (
              <Button
                variant="outline"
                className="mt-4"
                onClick={async () => {
                  const { error } = await supabase
                    .from('items')
                    .update({ status: 'lost', claimed_by: null })
                    .eq('id', item.id);
                  if (error) {
                    toast.error('Failed to mark as lost');
                    return;
                  }
                  toast.success('Item marked as lost');
                  fetchItemDetails();
                }}
              >
                Mark as Lost
              </Button>
            )}
            
            <Card>
              <CardContent className="pt-6">
                {item && item.reportedBy && (
                  <Comments itemId={item.id} reportedById={item.reportedBy} />
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      
      <ClaimDialog
        open={showClaim}
        onOpenChange={setShowClaim}
        itemId={item.id}
        itemStatus={item.status}
        onClaimSuccess={handleClaimSuccess}
      />
    </Layout>
  );
};

// Helper component to fetch and show owner info
function OwnerInfo({ userId }: { userId: string }) {
  const [email, setEmail] = useState<string | null>(null);
  useEffect(() => {
    supabase
      .from('profiles')
      .select('email')
      .eq('id', userId)
      .single()
      .then(({ data }) => setEmail(data?.email || null));
  }, [userId]);
  return <span className="font-mono break-all text-sm">{email || 'Unknown'}</span>;
}

export default ItemDetailPage;
