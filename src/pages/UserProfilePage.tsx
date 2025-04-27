import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Loader2, ChevronRight, PieChart, CalendarDays, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ItemCategory, ItemStatus, categoryIcons, statusColors } from "@/types";

interface UserReport {
  id: string;
  title: string;
  status: ItemStatus;
  date: string;
  location: string;
  category: ItemCategory;
  created_at: string;
}

interface SupabaseReport {
  id: string;
  title: string;
  status: string;
  date: string;
  location: string;
  category: string;
  created_at: string;
}

interface UserStats {
  totalReports: number;
  lostItems: number;
  foundItems: number;
  categories: Record<ItemCategory, number>;
}

const UserProfilePage = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [userReports, setUserReports] = useState<UserReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<UserStats>({
    totalReports: 0,
    lostItems: 0,
    foundItems: 0,
    categories: {
      electronics: 0,
      clothing: 0,
      accessories: 0,
      keys: 0,
      documents: 0,
      pets: 0,
      other: 0,
    }
  });
  const [userClaims, setUserClaims] = useState<any[]>([]);

  useEffect(() => {
    const fetchUserReports = async () => {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from('items')
          .select('id, title, status, date, location, category, created_at')
          .eq('reported_by', user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        
        // Convert the Supabase response data to UserReport[]
        const reports = (data || []).map((item: SupabaseReport) => ({
          ...item,
          status: item.status as ItemStatus,
          category: item.category as ItemCategory
        }));
        
        setUserReports(reports);
        
        // Calculate stats
        const newStats: UserStats = {
          totalReports: reports.length,
          lostItems: reports.filter(item => item.status === 'lost').length,
          foundItems: reports.filter(item => item.status === 'found').length,
          categories: {
            electronics: 0,
            clothing: 0,
            accessories: 0,
            keys: 0,
            documents: 0,
            pets: 0,
            other: 0,
          }
        };
        
        // Count by category
        reports.forEach(item => {
          if (item.category in newStats.categories) {
            newStats.categories[item.category]++;
          }
        });
        
        setStats(newStats);
      } catch (error) {
        console.error('Error fetching user reports:', error);
        toast.error('Failed to load your reports');
      } finally {
        setLoading(false);
      }
    };

    fetchUserReports();
  }, [user]);

  useEffect(() => {
    const fetchUserClaims = async () => {
      if (!user) return;
      // 1. Fetch claims with item info (including reported_by)
      const { data: claims, error } = await supabase
        .from('claims')
        .select('id, item_id, description, status, created_at, items: item_id (title, reported_by)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (error) {
        console.error('Error fetching user claims:', error);
        toast.error('Failed to load your claim requests');
        return;
      }
      // 2. Get unique owner IDs
      const ownerIds = Array.from(new Set((claims || []).map(c => c.items?.reported_by).filter(Boolean)));
      let ownerEmailMap = {};
      if (ownerIds.length > 0) {
        const { data: owners, error: ownerError } = await supabase
          .from('profiles')
          .select('id, email, phone')
          .in('id', ownerIds);
        if (!ownerError && owners) {
          ownerEmailMap = owners.reduce((acc, o) => { acc[o.id] = { email: o.email, phone: o.phone }; return acc; }, {});
        }
      }
      // 3. Attach owner contact info to each claim
      const claimsWithOwnerContact = (claims || []).map(claim => ({
        ...claim,
        ownerContact: claim.items?.reported_by ? ownerEmailMap[claim.items.reported_by] : undefined
      }));
      setUserClaims(claimsWithOwnerContact);
    };
    fetchUserClaims();
  }, [user]);

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success("Signed out successfully");
      navigate("/");
    } catch (error) {
      toast.error("Failed to sign out");
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const handleWithdrawClaim = async (claimId: string) => {
    if (!window.confirm('Are you sure you want to withdraw this claim?')) return;
    const { error } = await supabase.from('claims').delete().eq('id', claimId);
    if (error) {
      toast.error('Failed to withdraw claim');
      return;
    }
    setUserClaims((prev) => prev.filter((c) => c.id !== claimId));
    toast.success('Claim withdrawn');
  };

  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8 flex justify-center items-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary mr-2" />
          <span>Loading your profile...</span>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-6">Your Profile</h1>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* Account Info */}
            <Card className="md:col-span-1">
              <CardHeader>
                <CardTitle>Account Info</CardTitle>
                <CardDescription>Your personal information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Email</p>
                  <p>{user?.email}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Member since</p>
                  <p>{user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'Unknown'}</p>
                </div>
                <Button 
                  variant="outline" 
                  onClick={() => navigate("/report")} 
                  className="w-full mt-2"
                >
                  Report New Item
                </Button>
              </CardContent>
              <CardFooter>
                <Button onClick={handleSignOut} variant="outline" className="w-full border-red-300 hover:bg-red-50 text-red-600">Sign Out</Button>
              </CardFooter>
            </Card>

            {/* User Stats */}
            <Card className="md:col-span-2">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Your Statistics</CardTitle>
                    <CardDescription>Summary of your activity</CardDescription>
                  </div>
                  <PieChart className="h-5 w-5 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
                    <p className="text-sm text-muted-foreground">Total Reports</p>
                    <p className="text-2xl font-bold">{stats.totalReports}</p>
                  </div>
                  <div className="bg-amber-50 dark:bg-amber-950 p-4 rounded-lg">
                    <p className="text-sm text-muted-foreground">Lost Items</p>
                    <p className="text-2xl font-bold">{stats.lostItems}</p>
                  </div>
                  <div className="bg-emerald-50 dark:bg-emerald-950 p-4 rounded-lg">
                    <p className="text-sm text-muted-foreground">Found Items</p>
                    <p className="text-2xl font-bold">{stats.foundItems}</p>
                  </div>
                </div>

                <div className="mt-6">
                  <h3 className="font-medium mb-2">Reports by Category</h3>
                  <div className="space-y-2">
                    {Object.entries(stats.categories)
                      .filter(([_, count]) => count > 0)
                      .sort(([_, countA], [__, countB]) => countB - countA)
                      .map(([category, count]) => (
                        <div key={category} className="flex items-center justify-between">
                          <div className="flex items-center">
                            <span className="mr-2">{categoryIcons[category as ItemCategory]}</span>
                            <span className="capitalize">{category}</span>
                          </div>
                          <Badge variant="outline">{count}</Badge>
                        </div>
                      ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Reports List */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Your Reports</CardTitle>
                  <CardDescription>Items you've reported as lost or found</CardDescription>
                </div>
                <CalendarDays className="h-5 w-5 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="all" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="lost">Lost</TabsTrigger>
                  <TabsTrigger value="found">Found</TabsTrigger>
                </TabsList>

                {['all', 'lost', 'found'].map((tab) => (
                  <TabsContent key={tab} value={tab} className="space-y-4 mt-4">
                    {userReports.filter(report => tab === 'all' || report.status === tab).length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        No {tab !== 'all' ? tab : ''} items reported yet.
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {userReports
                          .filter(report => tab === 'all' || report.status === tab)
                          .map((report) => (
                            <Card key={report.id} className="overflow-hidden hover:shadow-md transition-shadow">
                              <CardContent className="p-0">
                                <div 
                                  className="flex items-center justify-between p-4 cursor-pointer"
                                  onClick={() => navigate(`/item/${report.id}`)}
                                >
                                  <div className="flex items-start gap-3">
                                    <div className="text-2xl">{categoryIcons[report.category]}</div>
                                    <div>
                                      <h3 className="font-medium">{report.title}</h3>
                                      <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                                        <CalendarDays className="h-3.5 w-3.5" />
                                        {formatDate(report.date)}
                                        <MapPin className="h-3.5 w-3.5 ml-1" />
                                        {report.location}
                                      </div>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <div className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${
                                      report.status === 'lost' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                                    }`}>
                                      {report.status}
                                    </div>
                                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))
                        }
                      </div>
                    )}
                  </TabsContent>
                ))}
              </Tabs>
            </CardContent>
          </Card>

          <Card className="mt-8">
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Your Claim Requests</CardTitle>
                  <CardDescription>Items you have claimed</CardDescription>
                </div>
                <CalendarDays className="h-5 w-5 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              {userClaims.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  You have not claimed any items yet.
                </div>
              ) : (
                <div className="space-y-3">
                  {userClaims.map((claim) => (
                    <Card key={claim.id} className="overflow-hidden hover:shadow-md transition-shadow">
                      <CardContent className="p-0">
                        <div className="flex items-center justify-between p-4">
                          <div>
                            <h3 className="font-medium">{claim.items?.title || claim.item_id}</h3>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                              <CalendarDays className="h-3.5 w-3.5" />
                              {formatDate(claim.created_at)}
                            </div>
                            <div className="text-xs mt-1">Status: {claim.status}</div>
                            <div className="text-xs mt-1">Claim: {claim.description}</div>
                            <div className="text-xs mt-1">
                              Owner Contact: {claim.ownerContact?.email ? (
                                <span className="font-mono">{claim.ownerContact.email}</span>
                              ) : claim.ownerContact?.phone ? (
                                <span className="font-mono">{claim.ownerContact.phone}</span>
                              ) : (
                                <span className="italic text-muted-foreground">No contact available</span>
                              )}
                            </div>
                          </div>
                          <div className="flex flex-col gap-2 items-end">
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleWithdrawClaim(claim.id)}
                            >
                              Withdraw
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default UserProfilePage;
