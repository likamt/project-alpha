import { Link } from "react-router-dom";
import { Facebook, Twitter, Instagram, Mail, Phone, MapPin } from "lucide-react";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-muted border-t border-border">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* معلومات الشركة */}
          <div>
            <h3 className="text-lg font-bold mb-4">خدمة سريعة</h3>
            <p className="text-muted-foreground mb-4">
              منصة متكاملة لربط الحرفيين المحترفين مع العملاء بسهولة وأمان
            </p>
            <div className="flex items-center space-x-4 space-x-reverse">
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                <Instagram className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* روابط سريعة */}
          <div>
            <h3 className="text-lg font-bold mb-4">روابط سريعة</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/craftsmen" className="text-muted-foreground hover:text-primary transition-colors">
                  الحرفيون
                </Link>
              </li>
              <li>
                <Link to="/how-it-works" className="text-muted-foreground hover:text-primary transition-colors">
                  كيف يعمل
                </Link>
              </li>
              <li>
                <Link to="/join" className="text-muted-foreground hover:text-primary transition-colors">
                  انضم كحرفي
                </Link>
              </li>
              <li>
                <Link to="/support" className="text-muted-foreground hover:text-primary transition-colors">
                  الدعم الفني
                </Link>
              </li>
            </ul>
          </div>

          {/* الخدمات */}
          <div>
            <h3 className="text-lg font-bold mb-4">الخدمات</h3>
            <ul className="space-y-2">
              <li className="text-muted-foreground">سباكة</li>
              <li className="text-muted-foreground">كهرباء</li>
              <li className="text-muted-foreground">نجارة</li>
              <li className="text-muted-foreground">دهان</li>
              <li className="text-muted-foreground">تكييف وتبريد</li>
            </ul>
          </div>

          {/* معلومات التواصل */}
          <div>
            <h3 className="text-lg font-bold mb-4">تواصل معنا</h3>
            <ul className="space-y-3">
              <li className="flex items-center space-x-3 space-x-reverse text-muted-foreground">
                <Mail className="h-5 w-5" />
                <span>info@khidma.ma</span>
              </li>
              <li className="flex items-center space-x-3 space-x-reverse text-muted-foreground">
                <Phone className="h-5 w-5" />
                <span dir="ltr">+212 600 000 000</span>
              </li>
              <li className="flex items-center space-x-3 space-x-reverse text-muted-foreground">
                <MapPin className="h-5 w-5" />
                <span>المغرب - الدار البيضاء</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-border mt-8 pt-8 text-center">
          <p className="text-muted-foreground">
            © {currentYear} خدمة سريعة. جميع الحقوق محفوظة.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
