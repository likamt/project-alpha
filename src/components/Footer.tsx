import { Link } from "react-router-dom";
import { Facebook, Twitter, Instagram, Mail, Phone, MapPin } from "lucide-react";
import { useTranslation } from "react-i18next";

const Footer = () => {
  const { t } = useTranslation();
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-muted border-t border-border">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* معلومات الشركة */}
          <div>
            <h3 className="text-lg font-bold mb-4">{t('hero.title')}</h3>
            <p className="text-muted-foreground mb-4">
              {t('hero.subtitle')}
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
            <h3 className="text-lg font-bold mb-4">{t('footer.quickLinks')}</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/home-cooking" className="text-muted-foreground hover:text-primary transition-colors">
                  {t('nav.homeCooking')}
                </Link>
              </li>
              <li>
                <Link to="/house-workers" className="text-muted-foreground hover:text-primary transition-colors">
                  {t('nav.houseWorkers')}
                </Link>
              </li>
              <li>
                <Link to="/how-it-works" className="text-muted-foreground hover:text-primary transition-colors">
                  {t('common.howItWorks')}
                </Link>
              </li>
            </ul>
          </div>

          {/* القانونية */}
          <div>
            <h3 className="text-lg font-bold mb-4">{t('footer.legal')}</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/terms" className="text-muted-foreground hover:text-primary transition-colors">
                  {t('footer.termsOfService')}
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="text-muted-foreground hover:text-primary transition-colors">
                  {t('footer.privacyPolicy')}
                </Link>
              </li>
            </ul>
          </div>

          {/* معلومات التواصل */}
          <div>
            <h3 className="text-lg font-bold mb-4">{t('footer.contactUs')}</h3>
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
                <span>{t('footer.location')}</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-border mt-8 pt-8 text-center">
          <p className="text-muted-foreground">
            © {currentYear} {t('hero.title')}. {t('footer.allRightsReserved')}
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
