import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { 
  ChefHat, Plus, Edit, Trash2, Star, Clock, Users, 
  ShoppingCart, MessageSquare, Loader2, DollarSign, 
  CheckCircle, Package, AlertCircle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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

interface Message {
  id: string;
  content: string;
  sender_id: string;
  recipient_id: string;
  is_read: boolean | null;
  created_at: string | null;
  sender?: {
    full_name: string;
  } | null;
}

interface FoodOrder {
  id: string;
  client_id: string;
  quantity: number;
  unit_price: number;
  total_amount: number;
  platform_fee: number;
  cook_amount: number;
  status: string;
  payment_status: string;
  delivery_address: string | null;
  client_confirmed_at: string | null;
  cook_confirmed_at: string | null;
  created_at: string | null;
  dish: {
    name: string;
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

const HomeCookDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [cookProfile, setCookProfile] = useState<any>(null);
  const [dishes, setDishes] = useState<FoodDish[]>([]);
  const [orders, setOrders] = useState<FoodOrder[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingDish, setEditingDish] = useState<FoodDish | null>(null);
  const [confirmingOrder, setConfirmingOrder] = useState<string | null>(null);
  
  const [dishForm, setDishForm] = useState({
    name: "",
    description: "",
    category: "main",
    price: "",
    preparation_time_minutes: "60",
    servings: "1",
    dietary_tags: "",
    image_url: "",
    is_available: true,
  });

  useEffect(() => {
    checkUserAndLoadData();
  }, []);

  const checkUserAndLoadData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }
      setUser(user);

      // Get cook profile
      const { data: cook, error: cookError } = await supabase
        .from("home_cooks")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (cookError) throw cookError;
      
      if (!cook) {
        toast({
          title: "غير مسجلة كطاهية",
          description: "يرجى التسجيل كطاهية منزلية أولاً",
          variant: "destructive",
        });
        navigate("/join-home-cook");
        return;
      }

      setCookProfile(cook);
      await loadDishes(cook.id);
      await loadOrders(cook.id);
      await loadMessages(user.id);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadDishes = async (cookId: string) => {
    const { data, error } = await supabase
      .from("food_dishes")
      .select("*")
      .eq("cook_id", cookId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error loading dishes:", error);
      return;
    }
    setDishes(data || []);
  };

  const loadOrders = async (cookId: string) => {
    const { data, error } = await supabase
      .from("food_orders")
      .select(`
        *,
        dish:food_dishes(name)
      `)
      .eq("cook_id", cookId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error loading orders:", error);
      return;
    }
    setOrders(data || []);
  };

  const loadMessages = async (userId: string) => {
    const { data, error } = await supabase
      .from("messages")
      .select(`
        *,
        sender:profiles!messages_sender_id_fkey(full_name)
      `)
      .eq("recipient_id", userId)
      .order("created_at", { ascending: false })
      .limit(20);

    if (error) {
      console.error("Error loading messages:", error);
      return;
    }
    setMessages(data || []);
  };

  const resetDishForm = () => {
    setDishForm({
      name: "",
      description: "",
      category: "main",
      price: "",
      preparation_time_minutes: "60",
      servings: "1",
      dietary_tags: "",
      image_url: "",
      is_available: true,
    });
    setEditingDish(null);
  };

  const openEditDialog = (dish: FoodDish) => {
    setEditingDish(dish);
    setDishForm({
      name: dish.name,
      description: dish.description || "",
      category: dish.category,
      price: dish.price.toString(),
      preparation_time_minutes: (dish.preparation_time_minutes || 60).toString(),
      servings: (dish.servings || 1).toString(),
      dietary_tags: dish.dietary_tags?.join(", ") || "",
      image_url: dish.image_url || "",
      is_available: dish.is_available ?? true,
    });
    setDialogOpen(true);
  };

  const handleSaveDish = async () => {
    if (!cookProfile) return;
    
    if (!dishForm.name || !dishForm.price) {
      toast({
        title: "خطأ",
        description: "يرجى ملء الاسم والسعر",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const dishData = {
        cook_id: cookProfile.id,
        name: dishForm.name,
        description: dishForm.description || null,
        category: dishForm.category,
        price: parseFloat(dishForm.price),
        preparation_time_minutes: parseInt(dishForm.preparation_time_minutes) || 60,
        servings: parseInt(dishForm.servings) || 1,
        dietary_tags: dishForm.dietary_tags ? dishForm.dietary_tags.split(",").map(t => t.trim()) : [],
        image_url: dishForm.image_url || null,
        is_available: dishForm.is_available,
      };

      if (editingDish) {
        const { error } = await supabase
          .from("food_dishes")
          .update(dishData)
          .eq("id", editingDish.id);
        
        if (error) throw error;
        toast({ title: "تم تحديث الطبق بنجاح" });
      } else {
        const { error } = await supabase
          .from("food_dishes")
          .insert(dishData);
        
        if (error) throw error;
        toast({ title: "تمت إضافة الطبق بنجاح" });
      }

      await loadDishes(cookProfile.id);
      setDialogOpen(false);
      resetDishForm();
    } catch (error: any) {
      toast({
        title: "خطأ",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteDish = async (dishId: string) => {
    if (!confirm("هل أنت متأكدة من حذف هذا الطبق؟")) return;
    
    try {
      const { error } = await supabase
        .from("food_dishes")
        .delete()
        .eq("id", dishId);
      
      if (error) throw error;
      
      toast({ title: "تم حذف الطبق" });
      await loadDishes(cookProfile.id);
    } catch (error: any) {
      toast({
        title: "خطأ",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const toggleDishAvailability = async (dish: FoodDish) => {
    try {
      const { error } = await supabase
        .from("food_dishes")
        .update({ is_available: !dish.is_available })
        .eq("id", dish.id);
      
      if (error) throw error;
      await loadDishes(cookProfile.id);
    } catch (error: any) {
      toast({
        title: "خطأ",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const markMessageAsRead = async (messageId: string) => {
    await supabase
      .from("messages")
      .update({ is_read: true })
      .eq("id", messageId);
    
    setMessages(msgs => msgs.map(m => 
      m.id === messageId ? { ...m, is_read: true } : m
    ));
  };

  const confirmDelivery = async (orderId: string) => {
    setConfirmingOrder(orderId);
    try {
      const { data, error } = await supabase.functions.invoke("confirm-order-delivery", {
        body: { order_id: orderId, role: "cook" },
      });

      if (error) throw error;

      toast({
        title: data.escrow_released ? "تم إكمال الطلب!" : "تم تأكيد التسليم",
        description: data.escrow_released 
          ? "تم تحويل المبلغ لحسابك. شكراً لك!"
          : "في انتظار تأكيد العميل لتحرير المبلغ",
      });

      if (cookProfile) await loadOrders(cookProfile.id);
    } catch (error: any) {
      toast({
        title: "خطأ",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setConfirmingOrder(null);
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from("food_orders")
        .update({ status: newStatus })
        .eq("id", orderId);

      if (error) throw error;
      toast({ title: "تم تحديث حالة الطلب" });
      if (cookProfile) await loadOrders(cookProfile.id);
    } catch (error: any) {
      toast({
        title: "خطأ",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col" dir="rtl">
        <Navbar />
        <main className="flex-grow pt-16 flex items-center justify-center">
          <Loader2 className="h-12 w-12 animate-spin text-orange-500" />
        </main>
        <Footer />
      </div>
    );
  }

  const activeOrders = orders.filter(o => !["completed", "cancelled"].includes(o.status));
  const statusLabels: Record<string, { label: string; color: string }> = {
    pending: { label: "في انتظار الدفع", color: "bg-yellow-500" },
    paid: { label: "تم الدفع", color: "bg-blue-500" },
    preparing: { label: "جاري التحضير", color: "bg-orange-500" },
    ready: { label: "جاهز للتسليم", color: "bg-purple-500" },
    delivered: { label: "تم التوصيل", color: "bg-green-500" },
    completed: { label: "مكتمل", color: "bg-green-600" },
    cancelled: { label: "ملغي", color: "bg-red-500" },
  };

  const stats = {
    totalDishes: dishes.length,
    availableDishes: dishes.filter(d => d.is_available).length,
    totalOrders: dishes.reduce((sum, d) => sum + (d.order_count || 0), 0),
    unreadMessages: messages.filter(m => !m.is_read).length,
  };

  return (
    <div className="min-h-screen bg-background flex flex-col" dir="rtl">
      <Navbar />
      
      <main className="flex-grow pt-20 pb-12">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <ChefHat className="h-8 w-8 text-orange-500" />
                لوحة تحكم الطاهية
              </h1>
              <p className="text-muted-foreground">إدارة أطباقك وطلباتك</p>
            </div>
            
            <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetDishForm(); }}>
              <DialogTrigger asChild>
                <Button className="bg-orange-500 hover:bg-orange-600">
                  <Plus className="h-4 w-4 ml-2" />
                  إضافة طبق جديد
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>{editingDish ? "تعديل الطبق" : "إضافة طبق جديد"}</DialogTitle>
                  <DialogDescription>
                    أدخلي تفاصيل الطبق
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>اسم الطبق *</Label>
                    <Input
                      value={dishForm.name}
                      onChange={(e) => setDishForm({ ...dishForm, name: e.target.value })}
                      placeholder="كسكس بالخضر"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>الوصف</Label>
                    <Textarea
                      value={dishForm.description}
                      onChange={(e) => setDishForm({ ...dishForm, description: e.target.value })}
                      placeholder="وصف مختصر للطبق..."
                      rows={2}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>الفئة</Label>
                      <Select value={dishForm.category} onValueChange={(v) => setDishForm({ ...dishForm, category: v })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map(cat => (
                            <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>السعر (د.م) *</Label>
                      <Input
                        type="number"
                        value={dishForm.price}
                        onChange={(e) => setDishForm({ ...dishForm, price: e.target.value })}
                        placeholder="50"
                        min="0"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>وقت التحضير (دقيقة)</Label>
                      <Input
                        type="number"
                        value={dishForm.preparation_time_minutes}
                        onChange={(e) => setDishForm({ ...dishForm, preparation_time_minutes: e.target.value })}
                        min="1"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label>عدد الأشخاص</Label>
                      <Input
                        type="number"
                        value={dishForm.servings}
                        onChange={(e) => setDishForm({ ...dishForm, servings: e.target.value })}
                        min="1"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>التصنيفات (مفصولة بفواصل)</Label>
                    <Input
                      value={dishForm.dietary_tags}
                      onChange={(e) => setDishForm({ ...dishForm, dietary_tags: e.target.value })}
                      placeholder="حلال, بدون جلوتين, نباتي"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>رابط الصورة</Label>
                    <Input
                      value={dishForm.image_url}
                      onChange={(e) => setDishForm({ ...dishForm, image_url: e.target.value })}
                      placeholder="https://..."
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label>متاح للطلب</Label>
                    <Switch
                      checked={dishForm.is_available}
                      onCheckedChange={(checked) => setDishForm({ ...dishForm, is_available: checked })}
                    />
                  </div>
                </div>
                
                <DialogFooter>
                  <Button variant="outline" onClick={() => setDialogOpen(false)}>إلغاء</Button>
                  <Button onClick={handleSaveDish} disabled={saving} className="bg-orange-500 hover:bg-orange-600">
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : (editingDish ? "تحديث" : "إضافة")}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardContent className="pt-6 text-center">
                <ChefHat className="h-8 w-8 mx-auto text-orange-500 mb-2" />
                <p className="text-2xl font-bold">{stats.totalDishes}</p>
                <p className="text-sm text-muted-foreground">إجمالي الأطباق</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <Star className="h-8 w-8 mx-auto text-green-500 mb-2" />
                <p className="text-2xl font-bold">{stats.availableDishes}</p>
                <p className="text-sm text-muted-foreground">أطباق متاحة</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <ShoppingCart className="h-8 w-8 mx-auto text-blue-500 mb-2" />
                <p className="text-2xl font-bold">{stats.totalOrders}</p>
                <p className="text-sm text-muted-foreground">إجمالي الطلبات</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <MessageSquare className="h-8 w-8 mx-auto text-purple-500 mb-2" />
                <p className="text-2xl font-bold">{stats.unreadMessages}</p>
                <p className="text-sm text-muted-foreground">رسائل غير مقروءة</p>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <Tabs defaultValue="orders" className="space-y-6">
            <TabsList className="grid w-full max-w-lg grid-cols-3">
              <TabsTrigger value="orders">
                الطلبات
                {activeOrders.length > 0 && (
                  <Badge className="mr-2 bg-orange-500">{activeOrders.length}</Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="dishes">الأطباق</TabsTrigger>
              <TabsTrigger value="messages">
                الرسائل
                {stats.unreadMessages > 0 && (
                  <Badge className="mr-2 bg-red-500">{stats.unreadMessages}</Badge>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="orders">
              {orders.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Package className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-xl font-semibold mb-2">لا توجد طلبات بعد</h3>
                    <p className="text-muted-foreground">ستظهر هنا الطلبات من العملاء</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {orders.map(order => {
                    const status = statusLabels[order.status] || { label: order.status, color: "bg-gray-500" };
                    const canConfirm = ["delivered", "ready"].includes(order.status) && !order.cook_confirmed_at;
                    
                    return (
                      <Card key={order.id}>
                        <CardContent className="pt-6">
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <h3 className="font-semibold">{order.dish?.name}</h3>
                              <p className="text-sm text-muted-foreground">
                                الكمية: {order.quantity} • {order.total_amount} د.م
                              </p>
                              {order.delivery_address && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  📍 {order.delivery_address}
                                </p>
                              )}
                            </div>
                            <Badge className={status.color}>{status.label}</Badge>
                          </div>
                          
                          {/* Status update buttons */}
                          {order.status === "paid" && (
                            <div className="flex gap-2 mb-4">
                              <Button 
                                size="sm" 
                                onClick={() => updateOrderStatus(order.id, "preparing")}
                                className="bg-orange-500 hover:bg-orange-600"
                              >
                                بدء التحضير
                              </Button>
                            </div>
                          )}
                          
                          {order.status === "preparing" && (
                            <div className="flex gap-2 mb-4">
                              <Button 
                                size="sm" 
                                onClick={() => updateOrderStatus(order.id, "ready")}
                                className="bg-purple-500 hover:bg-purple-600"
                              >
                                جاهز للتسليم
                              </Button>
                            </div>
                          )}
                          
                          {order.status === "ready" && (
                            <div className="flex gap-2 mb-4">
                              <Button 
                                size="sm" 
                                onClick={() => updateOrderStatus(order.id, "delivered")}
                                className="bg-green-500 hover:bg-green-600"
                              >
                                تم التوصيل
                              </Button>
                            </div>
                          )}
                          
                          {/* Confirmation status */}
                          {!["completed", "cancelled", "pending"].includes(order.status) && (
                            <div className="flex items-center gap-4 text-xs mb-3">
                              <span className={order.client_confirmed_at ? "text-green-600" : "text-muted-foreground"}>
                                {order.client_confirmed_at ? <CheckCircle className="h-4 w-4 inline ml-1" /> : <Clock className="h-4 w-4 inline ml-1" />}
                                تأكيد العميل
                              </span>
                              <span className={order.cook_confirmed_at ? "text-green-600" : "text-muted-foreground"}>
                                {order.cook_confirmed_at ? <CheckCircle className="h-4 w-4 inline ml-1" /> : <Clock className="h-4 w-4 inline ml-1" />}
                                تأكيدك
                              </span>
                            </div>
                          )}
                          
                          {/* Confirm delivery button */}
                          {canConfirm && (
                            <Button 
                              onClick={() => confirmDelivery(order.id)}
                              disabled={confirmingOrder === order.id}
                              className="bg-green-600 hover:bg-green-700"
                              size="sm"
                            >
                              {confirmingOrder === order.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <>
                                  <CheckCircle className="h-4 w-4 ml-2" />
                                  تأكيد التسليم
                                </>
                              )}
                            </Button>
                          )}
                          
                          {/* Escrow info */}
                          {order.payment_status === "held" && (
                            <div className="mt-3 p-2 bg-blue-50 rounded text-xs text-blue-700 flex items-center gap-2">
                              <AlertCircle className="h-4 w-4" />
                              المبلغ محجوز - سيُحول لك بعد تأكيد الطرفين: {order.cook_amount} د.م
                            </div>
                          )}
                          
                          {order.status === "completed" && (
                            <div className="mt-3 p-2 bg-green-50 rounded text-xs text-green-700 flex items-center gap-2">
                              <CheckCircle className="h-4 w-4" />
                              تم تحويل المبلغ: {order.cook_amount} د.م
                            </div>
                          )}
                          
                          <div className="text-xs text-muted-foreground mt-3 text-left">
                            {order.created_at ? new Date(order.created_at).toLocaleDateString("ar-MA") : ""}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </TabsContent>

            <TabsContent value="dishes">
              {dishes.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <ChefHat className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-xl font-semibold mb-2">لا توجد أطباق بعد</h3>
                    <p className="text-muted-foreground mb-4">ابدئي بإضافة أول طبق لك</p>
                    <Button onClick={() => setDialogOpen(true)} className="bg-orange-500 hover:bg-orange-600">
                      <Plus className="h-4 w-4 ml-2" />
                      إضافة طبق
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {dishes.map(dish => (
                    <Card key={dish.id} className={!dish.is_available ? "opacity-60" : ""}>
                      <div className="relative h-40 bg-gradient-to-br from-orange-100 to-red-100 rounded-t-lg">
                        {dish.image_url ? (
                          <img src={dish.image_url} alt={dish.name} className="w-full h-full object-cover rounded-t-lg" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <ChefHat className="h-12 w-12 text-orange-300" />
                          </div>
                        )}
                        <Badge className="absolute top-2 left-2 bg-orange-500">
                          {categories.find(c => c.value === dish.category)?.label}
                        </Badge>
                        {!dish.is_available && (
                          <Badge className="absolute top-2 right-2" variant="secondary">غير متاح</Badge>
                        )}
                      </div>
                      
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg">{dish.name}</CardTitle>
                        {dish.description && (
                          <CardDescription className="line-clamp-2">{dish.description}</CardDescription>
                        )}
                      </CardHeader>
                      
                      <CardContent className="pb-2">
                        <div className="flex items-center justify-between text-sm text-muted-foreground mb-3">
                          <span className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {dish.preparation_time_minutes || 60} د
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="h-4 w-4" />
                            {dish.servings || 1} شخص
                          </span>
                          <span className="flex items-center gap-1">
                            <ShoppingCart className="h-4 w-4" />
                            {dish.order_count || 0}
                          </span>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <span className="text-xl font-bold text-orange-600">{dish.price} د.م</span>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" onClick={() => toggleDishAvailability(dish)}>
                              {dish.is_available ? "إخفاء" : "إظهار"}
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => openEditDialog(dish)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="destructive" onClick={() => handleDeleteDish(dish.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="messages">
              {messages.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <MessageSquare className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-xl font-semibold mb-2">لا توجد رسائل</h3>
                    <p className="text-muted-foreground">ستظهر هنا الرسائل من العملاء</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {messages.map(msg => (
                    <Card 
                      key={msg.id} 
                      className={`cursor-pointer transition-colors ${!msg.is_read ? "bg-orange-50 border-orange-200" : ""}`}
                      onClick={() => markMessageAsRead(msg.id)}
                    >
                      <CardContent className="py-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-semibold">{msg.sender?.full_name || "مستخدم"}</p>
                            <p className="text-muted-foreground mt-1">{msg.content}</p>
                          </div>
                          <div className="text-left">
                            <p className="text-xs text-muted-foreground">
                              {msg.created_at ? new Date(msg.created_at).toLocaleDateString("ar-MA") : ""}
                            </p>
                            {!msg.is_read && <Badge className="mt-1 bg-orange-500">جديد</Badge>}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default HomeCookDashboard;
