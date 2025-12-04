import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ContactDialog from "@/components/ContactDialog";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Star, Clock, Users, ChefHat, MapPin, ShoppingCart, 
  CheckCircle, Phone, MessageSquare, ArrowRight 
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface HomeCook {
  id: string;
  user_id: string;
  specialties: string[] | null;
  description: string | null;
  hourly_rate: number;
  location: string | null;
  is_verified: boolean | null;
  rating: number | null;
  completed_orders: number | null;
  delivery_available: boolean | null;
  min_order_amount: number | null;
  profile: {
    full_name: string;
    avatar_url: string | null;
    phone: string | null;
  } | null;
}

interface FoodDish {
  id: string;
  name: string;
  description: string | null;
  category: string;
  price: number;
  preparation_time_minutes: number | null;
  servings: number | null;
  dietary_tags: string[] | null;
  image_url: string | null;
  is_available: boolean | null;
  rating: number | null;
  order_count: number | null;
}

interface Rating {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string | null;
  client: {
    full_name: string;
  } | null;
}

const categories = [
  { value: "main", label: "أطباق رئيسية" },
  { value: "appetizer", label: "مقبلات" },
  { value: "dessert", label: "حلويات" },
  { value: "breakfast", label: "فطور" },
  { value: "soup", label: "شوربات" },
  { value: "salad", label: "سلطات" },
  { value: "pastry", label: "معجنات" },
];

const HomeCookProfile = () => {
  const { id } = useParams<{ id: string }>();
  const [cook, setCook] = useState<HomeCook | null>(null);
  const [dishes, setDishes] = useState<FoodDish[]>([]);
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [loading, setLoading] = useState(true);
  const [contactOpen, setContactOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (id) {
      fetchCookData();
    }
  }, [id]);

  const fetchCookData = async () => {
    try {
      // Fetch cook profile
      const { data: cookData, error: cookError } = await supabase
        .from("home_cooks")
        .select(`
          *,
          profile:profiles(full_name, avatar_url, phone)
        `)
        .eq("id", id)
        .maybeSingle();

      if (cookError) throw cookError;
      if (!cookData) {
        setLoading(false);
        return;
      }
      setCook(cookData);

      // Fetch dishes
      const { data: dishesData, error: dishesError } = await supabase
        .from("food_dishes")
        .select("*")
        .eq("cook_id", id)
        .eq("is_available", true);

      if (dishesError) throw dishesError;
      setDishes(dishesData || []);

      // Note: ratings table doesn't have home_cook support yet, skipping for now

    } catch (error) {
      console.error("Error fetching cook data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleOrder = (dish: FoodDish) => {
    toast({
      title: "قريباً!",
      description: `سيتم تفعيل خدمة الطلب قريباً. طبق: ${dish.name}`,
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col" dir="rtl">
        <Navbar />
        <main className="flex-grow pt-16 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!cook) {
    return (
      <div className="min-h-screen bg-background flex flex-col" dir="rtl">
        <Navbar />
        <main className="flex-grow pt-16 flex items-center justify-center">
          <div className="text-center">
            <ChefHat className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-2xl font-bold mb-2">الطاهية غير موجودة</h2>
            <p className="text-muted-foreground mb-4">لم نتمكن من العثور على هذه الطاهية</p>
            <Button asChild>
              <Link to="/home-cooking">
                <ArrowRight className="ml-2 h-4 w-4" />
                العودة للطبخ المنزلي
              </Link>
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col" dir="rtl">
      <Navbar />
      
      <main className="flex-grow pt-16">
        {/* Profile Header */}
        <section className="bg-gradient-to-br from-orange-500 to-red-600 text-white py-12">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="w-32 h-32 rounded-full bg-white/20 flex items-center justify-center">
                {cook.profile?.avatar_url ? (
                  <img 
                    src={cook.profile.avatar_url} 
                    alt={cook.profile.full_name}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <ChefHat className="h-16 w-16 text-white" />
                )}
              </div>
              
              <div className="text-center md:text-right flex-grow">
                <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
                  <h1 className="text-3xl font-bold">{cook.profile?.full_name || "طاهية"}</h1>
                  {cook.is_verified && (
                    <CheckCircle className="h-6 w-6 text-green-300" />
                  )}
                </div>
                
                {cook.location && (
                  <p className="flex items-center justify-center md:justify-start gap-1 opacity-90 mb-2">
                    <MapPin className="h-4 w-4" />
                    {cook.location}
                  </p>
                )}
                
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 mt-3">
                  <div className="flex items-center gap-1">
                    <Star className="h-5 w-5 fill-yellow-300 text-yellow-300" />
                    <span className="font-semibold">{cook.rating || 0}</span>
                  </div>
                  <span className="opacity-70">|</span>
                  <span>{cook.completed_orders || 0} طلب مكتمل</span>
                  {cook.delivery_available && (
                    <>
                      <span className="opacity-70">|</span>
                      <Badge variant="secondary" className="bg-white/20 text-white">
                        توصيل متاح
                      </Badge>
                    </>
                  )}
                </div>
              </div>
              
              <div className="flex gap-3">
                <Button variant="secondary" size="lg" onClick={() => setContactOpen(true)}>
                  <MessageSquare className="ml-2 h-5 w-5" />
                  راسلها
                </Button>
                {cook.profile?.phone && (
                  <Button 
                    variant="outline" 
                    size="lg" 
                    className="border-white text-white hover:bg-white/10"
                    onClick={() => window.location.href = `tel:${cook.profile?.phone}`}
                  >
                    <Phone className="ml-2 h-5 w-5" />
                    اتصل
                  </Button>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Main Content */}
        <section className="py-8">
          <div className="container mx-auto px-4">
            <Tabs defaultValue="dishes" className="space-y-6">
              <TabsList className="grid w-full max-w-md mx-auto grid-cols-3">
                <TabsTrigger value="dishes">الأطباق ({dishes.length})</TabsTrigger>
                <TabsTrigger value="about">نبذة</TabsTrigger>
                <TabsTrigger value="reviews">التقييمات</TabsTrigger>
              </TabsList>
              
              <TabsContent value="dishes">
                {dishes.length === 0 ? (
                  <div className="text-center py-12">
                    <ChefHat className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                    <p className="text-muted-foreground">لا توجد أطباق متاحة حالياً</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {dishes.map((dish) => (
                      <Card key={dish.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                        <div className="relative h-48 bg-gradient-to-br from-orange-100 to-red-100">
                          {dish.image_url ? (
                            <img
                              src={dish.image_url}
                              alt={dish.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <ChefHat className="h-16 w-16 text-orange-300" />
                            </div>
                          )}
                          <Badge className="absolute top-2 left-2 bg-orange-500">
                            {categories.find(c => c.value === dish.category)?.label || dish.category}
                          </Badge>
                        </div>
                        
                        <CardHeader className="pb-2">
                          <h3 className="font-bold text-lg">{dish.name}</h3>
                          {dish.description && (
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {dish.description}
                            </p>
                          )}
                        </CardHeader>
                        
                        <CardContent className="pb-2">
                          <div className="flex flex-wrap gap-2 mb-3">
                            {dish.dietary_tags?.slice(0, 3).map((tag, i) => (
                              <Badge key={i} variant="outline" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                          
                          <div className="flex items-center justify-between text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              <span>{dish.preparation_time_minutes || 60} د</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Users className="h-4 w-4" />
                              <span>{dish.servings || 1} شخص</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                              <span>{dish.rating || 0}</span>
                            </div>
                          </div>
                        </CardContent>
                        
                        <CardFooter className="pt-2">
                          <div className="flex items-center justify-between w-full">
                            <span className="text-xl font-bold text-orange-600">
                              {dish.price} د.م
                            </span>
                            <Button 
                              onClick={() => handleOrder(dish)}
                              className="bg-orange-500 hover:bg-orange-600"
                            >
                              <ShoppingCart className="h-4 w-4 ml-2" />
                              اطلب
                            </Button>
                          </div>
                        </CardFooter>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="about">
                <Card className="max-w-2xl mx-auto">
                  <CardContent className="pt-6 space-y-6">
                    {cook.description && (
                      <div>
                        <h3 className="font-semibold mb-2">عن الطاهية</h3>
                        <p className="text-muted-foreground">{cook.description}</p>
                      </div>
                    )}
                    
                    {cook.specialties && cook.specialties.length > 0 && (
                      <div>
                        <h3 className="font-semibold mb-2">التخصصات</h3>
                        <div className="flex flex-wrap gap-2">
                          {cook.specialties.map((specialty, i) => (
                            <Badge key={i} variant="secondary">
                              {specialty}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-muted rounded-lg text-center">
                        <p className="text-2xl font-bold text-orange-600">{cook.hourly_rate}</p>
                        <p className="text-sm text-muted-foreground">د.م / ساعة</p>
                      </div>
                      {cook.min_order_amount && cook.min_order_amount > 0 && (
                        <div className="p-4 bg-muted rounded-lg text-center">
                          <p className="text-2xl font-bold text-orange-600">{cook.min_order_amount}</p>
                          <p className="text-sm text-muted-foreground">د.م الحد الأدنى</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="reviews">
                <div className="max-w-2xl mx-auto text-center py-12">
                  <Star className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                  <p className="text-muted-foreground">لا توجد تقييمات بعد</p>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </section>
      </main>

      <Footer />
      
      {cook && (
        <ContactDialog
          open={contactOpen}
          onOpenChange={setContactOpen}
          recipientId={cook.user_id}
          recipientName={cook.profile?.full_name || "الطاهية"}
        />
      )}
    </div>
  );
};

export default HomeCookProfile;