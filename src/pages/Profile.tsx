import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
  User, Mail, Phone, MapPin, Edit, Save, X, Shield, 
  ChefHat, Home, MessageSquare, Loader2, Settings
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

type AppRole = "admin" | "client" | "craftsman" | "house_worker" | "home_cook";

const Profile = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [userRoles, setUserRoles] = useState<AppRole[]>([]);
  const [formData, setFormData] = useState({
    full_name: "",
    phone: "",
  });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        toast({
          title: "غير مصرح",
          description: "يجب تسجيل الدخول أولاً",
          variant: "destructive",
        });
        navigate("/auth");
        return;
      }

      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .maybeSingle();

      if (profileError) throw profileError;

      const { data: rolesData } = await supabase.rpc("get_user_roles", {
        _user_id: session.user.id,
      });

      setProfile(profileData);
      setUserRoles((rolesData as AppRole[]) || ["client"]);
      setFormData({
        full_name: profileData.full_name || "",
        phone: profileData.phone || "",
      });
    } catch (error: any) {
      console.error("Error loading profile:", error);
      toast({
        title: "خطأ",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: formData.full_name,
          phone: formData.phone,
          updated_at: new Date().toISOString(),
        })
        .eq("id", session.user.id);

      if (error) throw error;

      setProfile((prev: any) => (prev ? { ...prev, ...formData } : null));
      setEditing(false);

      toast({
        title: "تم الحفظ",
        description: "تم تحديث الملف الشخصي بنجاح",
      });
    } catch (error: any) {
      toast({
        title: "خطأ في الحفظ",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const getRoleLabel = (role: AppRole) => {
    const labels: Record<AppRole, string> = {
      admin: "مدير",
      client: "عميل",
      craftsman: "حرفي",
      house_worker: "عاملة منزلية",
      home_cook: "طاهية منزلية",
    };
    return labels[role] || role;
  };

  const getRoleBadgeClass = (role: AppRole) => {
    const classes: Record<AppRole, string> = {
      admin: "bg-destructive text-destructive-foreground",
      client: "bg-primary text-primary-foreground",
      craftsman: "bg-blue-500 text-white",
      house_worker: "bg-purple-500 text-white",
      home_cook: "bg-orange-500 text-white",
    };
    return classes[role] || "bg-secondary text-secondary-foreground";
  };

  const isAdmin = userRoles.includes("admin");
  const isHomeCook = userRoles.includes("home_cook");
  const isHouseWorker = userRoles.includes("house_worker");

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-subtle flex flex-col" dir="rtl">
        <Navbar />
        <main className="flex-grow pt-24 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
            <p className="mt-4 text-muted-foreground">جاري التحميل...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gradient-subtle flex flex-col" dir="rtl">
        <Navbar />
        <main className="flex-grow pt-24 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">الملف الشخصي غير موجود</h2>
            <Button onClick={() => navigate("/auth")}>تسجيل الدخول</Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-subtle flex flex-col" dir="rtl">
      <Navbar />

      <main className="flex-grow pt-24 pb-12">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* الشريط الجانبي */}
              <div className="lg:col-span-1">
                <Card className="animate-scale-in sticky top-24">
                  <CardContent className="p-6">
                    <div className="text-center">
                      <div className="w-24 h-24 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center mx-auto mb-4">
                        <User className="h-12 w-12 text-white" />
                      </div>
                      <h2 className="text-xl font-bold mb-2">{profile.full_name}</h2>
                      <div className="flex flex-wrap justify-center gap-2 mb-4">
                        {userRoles.map((role) => (
                          <Badge key={role} className={getRoleBadgeClass(role)}>
                            {getRoleLabel(role)}
                          </Badge>
                        ))}
                      </div>

                      <div className="space-y-3 text-sm text-muted-foreground mt-6">
                        <div className="flex items-center gap-2 justify-center">
                          <Phone className="h-4 w-4" />
                          <span>{profile.phone || "غير محدد"}</span>
                        </div>
                        <div className="flex items-center gap-2 justify-center">
                          <MapPin className="h-4 w-4" />
                          <span>المغرب</span>
                        </div>
                      </div>

                      <div className="mt-6 space-y-2">
                        <Button
                          variant="outline"
                          className="w-full"
                          onClick={() => setEditing(!editing)}
                        >
                          {editing ? (
                            <>
                              <X className="h-4 w-4 ml-2" />
                              إلغاء
                            </>
                          ) : (
                            <>
                              <Edit className="h-4 w-4 ml-2" />
                              تعديل الملف
                            </>
                          )}
                        </Button>

                        {isAdmin && (
                          <Button
                            variant="outline"
                            className="w-full border-destructive text-destructive hover:bg-destructive/10"
                            onClick={() => navigate("/admin")}
                          >
                            <Shield className="h-4 w-4 ml-2" />
                            لوحة الإدارة
                          </Button>
                        )}

                        {isHomeCook && (
                          <Button
                            variant="outline"
                            className="w-full border-orange-500 text-orange-500 hover:bg-orange-50"
                            onClick={() => navigate("/cook-dashboard")}
                          >
                            <ChefHat className="h-4 w-4 ml-2" />
                            لوحة الطاهية
                          </Button>
                        )}

                        {isHouseWorker && (
                          <Button
                            variant="outline"
                            className="w-full border-purple-500 text-purple-500 hover:bg-purple-50"
                            onClick={() => navigate("/worker-dashboard")}
                          >
                            <Home className="h-4 w-4 ml-2" />
                            لوحة العاملة
                          </Button>
                        )}

                        <Button
                          variant="outline"
                          className="w-full"
                          onClick={() => navigate("/messages")}
                        >
                          <MessageSquare className="h-4 w-4 ml-2" />
                          الرسائل
                        </Button>

                        <Button
                          variant="outline"
                          className="w-full"
                          onClick={() => navigate("/my-orders")}
                        >
                          طلباتي
                        </Button>

                        <Button
                          variant="outline"
                          className="w-full text-destructive hover:bg-destructive/10 hover:text-destructive"
                          onClick={handleSignOut}
                        >
                          تسجيل الخروج
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* المحتوى الرئيسي */}
              <div className="lg:col-span-2 space-y-6">
                <Card className="animate-fade-in">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Settings className="h-5 w-5" />
                      معلومات الشخصية
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {editing ? (
                      <>
                        <div className="space-y-2">
                          <Label htmlFor="full_name">الاسم الكامل</Label>
                          <Input
                            id="full_name"
                            value={formData.full_name}
                            onChange={(e) =>
                              setFormData((prev) => ({ ...prev, full_name: e.target.value }))
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="phone">رقم الهاتف</Label>
                          <Input
                            id="phone"
                            value={formData.phone}
                            onChange={(e) =>
                              setFormData((prev) => ({ ...prev, phone: e.target.value }))
                            }
                          />
                        </div>
                        <Button onClick={handleSaveProfile} className="w-full">
                          <Save className="h-4 w-4 ml-2" />
                          حفظ التغييرات
                        </Button>
                      </>
                    ) : (
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="p-4 bg-muted/50 rounded-lg">
                            <Label className="text-muted-foreground text-xs">الاسم الكامل</Label>
                            <p className="font-medium mt-1">{profile.full_name}</p>
                          </div>
                          <div className="p-4 bg-muted/50 rounded-lg">
                            <Label className="text-muted-foreground text-xs">رقم الهاتف</Label>
                            <p className="font-medium mt-1">{profile.phone || "غير محدد"}</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="p-4 bg-muted/50 rounded-lg">
                            <Label className="text-muted-foreground text-xs">الأدوار</Label>
                            <div className="flex flex-wrap gap-1 mt-2">
                              {userRoles.map((role) => (
                                <Badge key={role} variant="outline" className="text-xs">
                                  {getRoleLabel(role)}
                                </Badge>
                              ))}
                            </div>
                          </div>
                          <div className="p-4 bg-muted/50 rounded-lg">
                            <Label className="text-muted-foreground text-xs">الباقة</Label>
                            <p className="font-medium mt-1 capitalize">{profile.subscription_tier}</p>
                          </div>
                        </div>
                        <div className="p-4 bg-muted/50 rounded-lg">
                          <Label className="text-muted-foreground text-xs">تاريخ الانضمام</Label>
                          <p className="font-medium mt-1">
                            {new Date(profile.created_at).toLocaleDateString("ar-MA")}
                          </p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* خيارات الانضمام كمقدم خدمة */}
                {!isHouseWorker && !isHomeCook && (
                  <Card className="animate-fade-in" style={{ animationDelay: "0.1s" }}>
                    <CardHeader>
                      <CardTitle>انضمي كمقدمة خدمة</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {!isHouseWorker && (
                          <div className="p-6 bg-purple-50 dark:bg-purple-500/10 rounded-xl border border-purple-200 dark:border-purple-500/20">
                            <div className="flex items-center gap-3 mb-3">
                              <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center">
                                <Home className="h-6 w-6 text-white" />
                              </div>
                              <span className="font-semibold text-lg">عاملة منزلية</span>
                            </div>
                            <p className="text-sm text-muted-foreground mb-4">
                              قدمي خدمات التنظيف والعناية بالمنزل
                            </p>
                            <Button 
                              variant="outline" 
                              className="w-full border-purple-500 text-purple-500 hover:bg-purple-50"
                              onClick={() => navigate("/join-house-worker")}
                            >
                              انضمي الآن
                            </Button>
                          </div>
                        )}

                        {!isHomeCook && (
                          <div className="p-6 bg-orange-50 dark:bg-orange-500/10 rounded-xl border border-orange-200 dark:border-orange-500/20">
                            <div className="flex items-center gap-3 mb-3">
                              <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center">
                                <ChefHat className="h-6 w-6 text-white" />
                              </div>
                              <span className="font-semibold text-lg">طاهية منزلية</span>
                            </div>
                            <p className="text-sm text-muted-foreground mb-4">
                              شاركي وصفاتك اللذيذة واكسبي دخلاً إضافياً
                            </p>
                            <Button 
                              variant="outline" 
                              className="w-full border-orange-500 text-orange-500 hover:bg-orange-50"
                              onClick={() => navigate("/join-home-cook")}
                            >
                              انضمي الآن
                            </Button>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Profile;
