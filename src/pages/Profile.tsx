import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Mail, Phone, MapPin, Edit, Save, X, Shield } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const Profile = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [formData, setFormData] = useState({
    full_name: "",
    phone: "",
  });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        toast({
          title: "غير مصرح",
          description: "يجب تسجيل الدخول أولاً",
          variant: "destructive",
        });
        navigate("/auth");
        return;
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .single();

      if (error) throw error;

      setProfile(data);
      setFormData({
        full_name: data.full_name || "",
        phone: data.phone || "",
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
      const {
        data: { session },
      } = await supabase.auth.getSession();
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

      setProfile((prev: any) => prev ? { ...prev, ...formData } : null);
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-subtle">
        <Navbar />
        <div className="container mx-auto px-4 pt-24 pb-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">جاري التحميل...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gradient-subtle">
        <Navbar />
        <div className="container mx-auto px-4 pt-24 pb-12">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">الملف الشخصي غير موجود</h2>
            <Button onClick={() => navigate("/auth")}>تسجيل الدخول</Button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <Navbar />

      <div className="container mx-auto px-4 pt-24 pb-12">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* الشريط الجانبي */}
            <div className="lg:col-span-1">
              <Card className="animate-scale-in">
                <CardContent className="p-6">
                  <div className="text-center">
                    <div className="w-24 h-24 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-4">
                      <User className="h-12 w-12 text-white" />
                    </div>
                    <h2 className="text-xl font-bold mb-2">{profile.full_name}</h2>
                    <Badge
                      variant="secondary"
                      className={
                        profile.role === "admin"
                          ? "bg-destructive text-destructive-foreground"
                          : "bg-primary text-primary-foreground"
                      }
                    >
                      {profile.role === "client"
                        ? "عميل"
                        : profile.role === "craftsman"
                        ? "حرفي"
                        : "مدير"}
                    </Badge>

                    <div className="space-y-3 text-sm text-muted-foreground mt-6">
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        <span className="text-xs">البريد الإلكتروني</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        <span>{profile.phone || "غير محدد"}</span>
                      </div>
                      <div className="flex items-center gap-2">
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
                      
                      {profile.role === "admin" && (
                        <Button
                          variant="outline"
                          className="w-full border-primary text-primary hover:bg-primary/10"
                          onClick={() => navigate("/admin")}
                        >
                          <Shield className="h-4 w-4 ml-2" />
                          لوحة التحكم
                        </Button>
                      )}
                      
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
            <div className="lg:col-span-2">
              <Card className="animate-fade-in">
                <CardHeader>
                  <CardTitle>معلومات الشخصية</CardTitle>
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
                        <div>
                          <Label className="text-muted-foreground">الاسم الكامل</Label>
                          <p className="font-medium">{profile.full_name}</p>
                        </div>
                        <div>
                          <Label className="text-muted-foreground">رقم الهاتف</Label>
                          <p className="font-medium">{profile.phone || "غير محدد"}</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-muted-foreground">الدور</Label>
                          <p className="font-medium">
                            {profile.role === "client"
                              ? "عميل"
                              : profile.role === "craftsman"
                              ? "حرفي"
                              : "مدير"}
                          </p>
                        </div>
                        <div>
                          <Label className="text-muted-foreground">الباقة</Label>
                          <p className="font-medium capitalize">{profile.subscription_tier}</p>
                        </div>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">تاريخ الانضمام</Label>
                        <p className="font-medium">
                          {new Date(profile.created_at).toLocaleDateString("ar-MA")}
                        </p>
                      </div>
                    </div>
                  )}

                  {profile.role === "client" && (
                    <div className="mt-8 p-4 bg-muted rounded-lg">
                      <h3 className="font-semibold mb-2">هل أنت حرفي؟</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        انضم إلى منصتنا كحرفي واحصل على المزيد من فرص العمل
                      </p>
                      <Button variant="outline" onClick={() => navigate("/join")}>
                        انضم كحرفي
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Profile;
