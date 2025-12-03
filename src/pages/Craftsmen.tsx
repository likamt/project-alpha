import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Star, Search, Wrench, MapPin, CheckCircle } from "lucide-react";

interface Craftsman {
  id: string;
  profession: string;
  description: string | null;
  hourly_rate: number;
  location: string | null;
  is_verified: boolean | null;
  rating: number | null;
  completed_orders: number | null;
  services: string[] | null;
  profile: {
    full_name: string;
    avatar_url: string | null;
  } | null;
}

const professions = [
  { value: "all", label: "جميع المهن" },
  { value: "plumber", label: "سباك" },
  { value: "electrician", label: "كهربائي" },
  { value: "carpenter", label: "نجار" },
  { value: "painter", label: "دهان" },
  { value: "mechanic", label: "ميكانيكي" },
  { value: "ac_technician", label: "فني تكييف" },
  { value: "builder", label: "بناء" },
];

const Craftsmen = () => {
  const [craftsmen, setCraftsmen] = useState<Craftsman[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProfession, setSelectedProfession] = useState("all");

  useEffect(() => {
    fetchCraftsmen();
  }, []);

  const fetchCraftsmen = async () => {
    try {
      const { data, error } = await supabase
        .from("craftsmen")
        .select(`
          *,
          profile:profiles(full_name, avatar_url)
        `);

      if (error) throw error;
      setCraftsmen(data || []);
    } catch (error) {
      console.error("Error fetching craftsmen:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredCraftsmen = craftsmen.filter((craftsman) => {
    const matchesSearch = craftsman.profile?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      craftsman.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesProfession = selectedProfession === "all" || craftsman.profession === selectedProfession;
    return matchesSearch && matchesProfession;
  });

  return (
    <div className="min-h-screen bg-background flex flex-col" dir="rtl">
      <Navbar />
      
      <main className="flex-grow pt-16">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white py-16">
          <div className="container mx-auto px-4 text-center">
            <div className="flex justify-center mb-4">
              <Wrench className="h-16 w-16" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">الحرفيون</h1>
            <p className="text-xl md:text-2xl opacity-90 max-w-2xl mx-auto">
              اعثر على حرفي ماهر لإنجاز أعمالك
            </p>
          </div>
        </section>

        {/* Search & Filter */}
        <section className="py-8 bg-muted/50">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row gap-4 max-w-4xl mx-auto">
              <div className="relative flex-grow">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  placeholder="ابحث عن حرفي..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pr-10"
                />
              </div>
              <Select value={selectedProfession} onValueChange={setSelectedProfession}>
                <SelectTrigger className="w-full md:w-[200px]">
                  <SelectValue placeholder="اختر المهنة" />
                </SelectTrigger>
                <SelectContent>
                  {professions.map((prof) => (
                    <SelectItem key={prof.value} value={prof.value}>
                      {prof.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </section>

        {/* Craftsmen Grid */}
        <section className="py-12">
          <div className="container mx-auto px-4">
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {[...Array(8)].map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <div className="h-32 bg-muted rounded-t-lg" />
                    <CardContent className="p-4 space-y-2">
                      <div className="h-4 bg-muted rounded w-3/4" />
                      <div className="h-3 bg-muted rounded w-1/2" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : filteredCraftsmen.length === 0 ? (
              <div className="text-center py-16">
                <Wrench className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">لا يوجد حرفيون متاحون</h3>
                <p className="text-muted-foreground">
                  جرب تغيير معايير البحث
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredCraftsmen.map((craftsman) => (
                  <Card key={craftsman.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                    <CardHeader className="pb-2">
                      <div className="flex items-center gap-3">
                        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center">
                          <Wrench className="h-7 w-7 text-blue-500" />
                        </div>
                        <div className="flex-grow">
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold">{craftsman.profile?.full_name || "حرفي"}</h3>
                            {craftsman.is_verified && (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            )}
                          </div>
                          <Badge variant="secondary">
                            {professions.find(p => p.value === craftsman.profession)?.label || craftsman.profession}
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="pb-2">
                      {craftsman.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                          {craftsman.description}
                        </p>
                      )}
                      
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        {craftsman.location && (
                          <div className="flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            <span>{craftsman.location}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          <span>{craftsman.rating || 0}</span>
                        </div>
                      </div>
                    </CardContent>
                    
                    <CardFooter className="pt-2">
                      <div className="flex items-center justify-between w-full">
                        <span className="text-lg font-bold text-blue-600">
                          {craftsman.hourly_rate} د.م/ساعة
                        </span>
                        <Button size="sm">
                          تواصل
                        </Button>
                      </div>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Craftsmen;