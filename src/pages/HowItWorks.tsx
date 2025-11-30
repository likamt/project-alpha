import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import {
  Search,
  UserCheck,
  Calendar,
  ThumbsUp,
  Shield,
  Clock,
  Award,
  DollarSign,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const HowItWorks = () => {
  const navigate = useNavigate();

  const steps = [
    {
      icon: Search,
      title: "ابحث عن الحرفي المناسب",
      description: "استخدم البحث أو تصفح التخصصات للعثور على الحرفي المثالي لاحتياجك",
      color: "bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300",
    },
    {
      icon: UserCheck,
      title: "اطلع على التقييمات",
      description: "شاهد تقييمات العملاء السابقين والخبرات للتأكد من جودة الخدمة",
      color: "bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-300",
    },
    {
      icon: Calendar,
      title: "احجز موعد الخدمة",
      description: "اختر الموعد المناسب لك وحدد تفاصيل الخدمة المطلوبة",
      color: "bg-purple-100 text-purple-600 dark:bg-purple-900 dark:text-purple-300",
    },
    {
      icon: ThumbsUp,
      title: "استلم الخدمة وقيّم",
      description: "احصل على الخدمة بجودة عالية وقيّم تجربتك لمساعدة الآخرين",
      color: "bg-orange-100 text-orange-600 dark:bg-orange-900 dark:text-orange-300",
    },
  ];

  const features = [
    {
      icon: Shield,
      title: "حرفيون موثوقون",
      description: "جميع الحرفيين يخضعون لفحص دقيق قبل القبول",
    },
    {
      icon: Clock,
      title: "خدمة سريعة",
      description: "احصل على استجابة سريعة وخدمة في الوقت المحدد",
    },
    {
      icon: Award,
      title: "جودة مضمونة",
      description: "ضمان رضاك التام عن جودة الخدمة المقدمة",
    },
    {
      icon: DollarSign,
      title: "أسعار واضحة",
      description: "لا توجد رسوم مخفية، أسعار شفافة ومعلنة مسبقاً",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <Navbar />

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 bg-gradient-hero text-white">
        <div className="container mx-auto text-center animate-fade-in">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">كيف تعمل المنصة؟</h1>
          <p className="text-xl md:text-2xl opacity-90 max-w-3xl mx-auto">
            خطوات بسيطة للحصول على أفضل الحرفيين
          </p>
        </div>
      </section>

      {/* Steps Section */}
      <section className="py-20 bg-white dark:bg-card">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step, index) => {
              const IconComponent = step.icon;
              return (
                <Card
                  key={index}
                  className="text-center hover:shadow-2xl transition-all animate-scale-in"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <CardContent className="p-6">
                    <div className="relative mb-6">
                      <div
                        className={`w-20 h-20 ${step.color} rounded-full flex items-center justify-center mx-auto`}
                      >
                        <IconComponent className="h-10 w-10" />
                      </div>
                      <div className="absolute -top-2 -right-2 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center font-bold">
                        {index + 1}
                      </div>
                    </div>
                    <h3 className="font-bold text-lg mb-3">{step.title}</h3>
                    <p className="text-muted-foreground">{step.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12 animate-fade-in">
            <h2 className="text-4xl font-bold mb-4">لماذا تختار منصتنا؟</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              نوفر لك أفضل تجربة في الحصول على الخدمات المنزلية
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => {
              const IconComponent = feature.icon;
              return (
                <div
                  key={index}
                  className="text-center animate-fade-in"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <IconComponent className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="font-bold text-lg mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-white dark:bg-card">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-3xl mx-auto animate-scale-in">
            <h2 className="text-4xl font-bold mb-6">جاهز للبدء؟</h2>
            <p className="text-muted-foreground text-lg mb-8">
              انضم إلى آلاف العملاء الراضين واحصل على خدمة احترافية الآن
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button
                size="lg"
                className="bg-gradient-primary hover:opacity-90 px-8"
                onClick={() => navigate("/craftsmen")}
              >
                ابحث عن حرفي
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => navigate("/join")}
                className="px-8"
              >
                انضم كحرفي
              </Button>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default HowItWorks;
