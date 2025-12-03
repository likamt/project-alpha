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
import { Star, Clock, Users, Search, ChefHat, MapPin, ShoppingCart } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface FoodDish {
  id: string;
  name: string;
  description: string | null;
  category: string;
  price: number;
  preparation_time_minutes: number | null;
  servings: number | null;
  ingredients: string[] | null;
  dietary_tags: string[] | null;
  image_url: string | null;
  is_available: boolean | null;
  rating: number | null;
  order_count: number | null;
  cook: {
    id: string;
    location: string | null;
    rating: number | null;
    profile: {
      full_name: string;
      avatar_url: string | null;
    } | null;
  } | null;
}

const categories = [
  { value: "all", label: "جميع الفئات" },
  { value: "main", label: "أطباق رئيسية" },
  { value: "appetizer", label: "مقبلات" },
  { value: "dessert", label: "حلويات" },
  { value: "breakfast", label: "فطور" },
  { value: "soup", label: "شوربات" },
  { value: "salad", label: "سلطات" },
  { value: "pastry", label: "معجنات" },
];

const HomeCooking = () => {
  const [dishes, setDishes] = useState<FoodDish[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const { toast } = useToast();

  useEffect(() => {
    fetchDishes();
  }, []);

  const fetchDishes = async () => {
    try {
      const { data, error } = await supabase
        .from("food_dishes")
        .select(`
          *,
          cook:home_cooks(
            id,
            location,
            rating,
            profile:profiles(full_name, avatar_url)
          )
        `)
        .eq("is_available", true);

      if (error) throw error;
      setDishes(data || []);
    } catch (error) {
      console.error("Error fetching dishes:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredDishes = dishes.filter((dish) => {
    const matchesSearch = dish.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dish.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || dish.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleOrder = (dish: FoodDish) => {
    toast({
      title: "قريباً!",
      description: `سيتم تفعيل خدمة الطلب قريباً. طبق: ${dish.name}`,
    });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col" dir="rtl">
      <Navbar />
      
      <main className="flex-grow">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-orange-500 to-red-600 text-white py-16">
          <div className="container mx-auto px-4 text-center">
            <div className="flex justify-center mb-4">
              <ChefHat className="h-16 w-16" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">الطبخ المنزلي</h1>
            <p className="text-xl md:text-2xl opacity-90 max-w-2xl mx-auto">
              أطباق منزلية طازجة من طاهيات محترفات
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
                  placeholder="ابحث عن طبق..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pr-10"
                />
              </div>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-full md:w-[200px]">
                  <SelectValue placeholder="اختر الفئة" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </section>

        {/* Dishes Grid */}
        <section className="py-12">
          <div className="container mx-auto px-4">
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {[...Array(8)].map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <div className="h-48 bg-muted rounded-t-lg" />
                    <CardContent className="p-4 space-y-2">
                      <div className="h-4 bg-muted rounded w-3/4" />
                      <div className="h-3 bg-muted rounded w-1/2" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : filteredDishes.length === 0 ? (
              <div className="text-center py-16">
                <ChefHat className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">لا توجد أطباق متاحة</h3>
                <p className="text-muted-foreground">
                  جرب تغيير معايير البحث أو تصفح جميع الفئات
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredDishes.map((dish) => (
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
                      <h3 className="font-bold text-lg line-clamp-1">{dish.name}</h3>
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
                      
                      {dish.cook?.profile && (
                        <Link 
                          to={`/home-cook/${dish.cook.id}`}
                          className="flex items-center gap-2 mt-3 pt-3 border-t hover:bg-muted/50 -mx-2 px-2 py-2 rounded transition-colors"
                        >
                          <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center">
                            <ChefHat className="h-4 w-4 text-orange-500" />
                          </div>
                          <div className="flex-grow">
                            <p className="text-sm font-medium">{dish.cook.profile.full_name}</p>
                            {dish.cook.location && (
                              <p className="text-xs text-muted-foreground flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {dish.cook.location}
                              </p>
                            )}
                          </div>
                        </Link>
                      )}
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
                          اطلب الآن
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

export default HomeCooking;