import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { 
  Menu, X, User, LogOut, Settings, Package, 
  MessageSquare, Calendar, Shield, ChefHat, Home as HomeIcon
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "react-i18next";
import LanguageSwitcher from "./LanguageSwitcher";
import NotificationBell from "./NotificationBell";

const Navbar = () => {
  const { t, i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [isHomeCook, setIsHomeCook] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const navigate = useNavigate();
  
  const isRTL = i18n.language === 'ar';

  useEffect(() => {
    // التحقق من حالة المستخدم
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        loadProfile(session.user.id);
        checkRoles(session.user.id);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        loadProfile(session.user.id);
        checkRoles(session.user.id);
      } else {
        setProfile(null);
        setIsHomeCook(false);
        setIsAdmin(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadProfile = async (userId: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();
    setProfile(data);
  };

  const checkRoles = async (userId: string) => {
    // Check if user is a home cook
    const { data: cookData } = await supabase
      .from('home_cooks')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();
    setIsHomeCook(!!cookData);

    // Check if user is admin using the secure function
    const { data: adminData } = await supabase.rpc('has_role', {
      _user_id: userId,
      _role: 'admin'
    });
    setIsAdmin(!!adminData);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const navLinks = [
    { name: t("common.home"), path: "/" },
    { name: t("nav.houseWorkers"), path: "/house-workers" },
    { name: t("nav.homeCooking"), path: "/home-cooking" },
    { name: t("common.howItWorks"), path: "/how-it-works" },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3 space-x-reverse">
            <div className="w-10 h-10 bg-gradient-primary rounded-lg flex items-center justify-center">
              <Package className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              خدمة سريعة
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8 space-x-reverse">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className="text-foreground hover:text-primary transition-colors font-medium"
              >
                {link.name}
              </Link>
            ))}
          </div>

          {/* User Menu / Auth Buttons */}
          <div className="hidden md:flex items-center gap-4">
            <LanguageSwitcher />
            {user && <NotificationBell />}
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-gradient-primary rounded-full flex items-center justify-center">
                      <User className="h-5 w-5 text-white" />
                    </div>
                    <span className="font-medium">{profile?.full_name || t("common.profile")}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>{t("common.profile")}</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate("/profile")}>
                    <User className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                    {t("common.profile")}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/bookings")}>
                    <Calendar className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                    {t("common.orders")}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/messages")}>
                    <MessageSquare className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                    {t("common.messages")}
                  </DropdownMenuItem>
                  {isHomeCook && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => navigate("/cook-dashboard")}>
                        <ChefHat className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                        {t("common.dashboard")}
                      </DropdownMenuItem>
                    </>
                  )}
                  {isAdmin && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => navigate("/admin")}>
                        <Shield className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                        {t("common.dashboard")}
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate("/profile")}>
                    <Settings className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                    {t("common.profile")}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
                    <LogOut className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                    {t("common.logout")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center gap-3">
                <Button variant="ghost" onClick={() => navigate("/auth")}>
                  {t("common.login")}
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => navigate("/join-house-worker")}
                >
                  انضمي كعاملة
                </Button>
                <Button 
                  className="bg-orange-500 hover:bg-orange-600"
                  onClick={() => navigate("/join-home-cook")}
                >
                  انضمي كطاهية
                </Button>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden p-2"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden py-4 space-y-3 animate-fade-in">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className="block py-2 text-foreground hover:text-primary transition-colors"
                onClick={() => setIsOpen(false)}
              >
                {link.name}
              </Link>
            ))}
            {user ? (
              <>
                <Link
                  to="/profile"
                  className="block py-2 text-foreground hover:text-primary transition-colors"
                  onClick={() => setIsOpen(false)}
                >
                  الملف الشخصي
                </Link>
                <Link
                  to="/messages"
                  className="block py-2 text-foreground hover:text-primary transition-colors"
                  onClick={() => setIsOpen(false)}
                >
                  الرسائل
                </Link>
                {isHomeCook && (
                  <Link
                    to="/cook-dashboard"
                    className="block py-2 text-foreground hover:text-primary transition-colors"
                    onClick={() => setIsOpen(false)}
                  >
                    لوحة تحكم الطاهية
                  </Link>
                )}
                {isAdmin && (
                  <Link
                    to="/admin"
                    className="block py-2 text-foreground hover:text-primary transition-colors"
                    onClick={() => setIsOpen(false)}
                  >
                    لوحة التحكم
                  </Link>
                )}
                <button
                  className="block w-full text-right py-2 text-destructive"
                  onClick={() => {
                    handleSignOut();
                    setIsOpen(false);
                  }}
                >
                  تسجيل الخروج
                </button>
              </>
            ) : (
              <>
                <Button 
                  variant="ghost" 
                  className="w-full justify-start"
                  onClick={() => {
                    navigate("/auth");
                    setIsOpen(false);
                  }}
                >
                  تسجيل الدخول
                </Button>
                <Button 
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    navigate("/join-house-worker");
                    setIsOpen(false);
                  }}
                >
                  انضمي كعاملة
                </Button>
                <Button 
                  className="w-full bg-orange-500 hover:bg-orange-600"
                  onClick={() => {
                    navigate("/join-home-cook");
                    setIsOpen(false);
                  }}
                >
                  انضمي كطاهية
                </Button>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
