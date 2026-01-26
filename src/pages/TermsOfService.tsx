import { useTranslation } from "react-i18next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const TermsOfService = () => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  return (
    <div className="min-h-screen bg-gradient-subtle" dir={isRTL ? 'rtl' : 'ltr'}>
      <Navbar />
      <div className="container mx-auto px-4 pt-24 pb-12">
        <div className="max-w-4xl mx-auto">
          <Card className="animate-scale-in shadow-lg">
            <CardHeader className="text-center border-b">
              <CardTitle className="text-3xl">{t('legal.termsTitle')}</CardTitle>
              <p className="text-muted-foreground mt-2">{t('legal.lastUpdated')}: 2024-01-01</p>
            </CardHeader>
            <CardContent className="prose prose-lg dark:prose-invert max-w-none p-8 space-y-8">
              <section>
                <h2 className="text-xl font-bold mb-4">{t('legal.acceptanceTitle')}</h2>
                <p className="text-muted-foreground leading-relaxed">
                  {t('legal.acceptanceText')}
                </p>
              </section>

              <section>
                <h2 className="text-xl font-bold mb-4">{t('legal.servicesTitle')}</h2>
                <p className="text-muted-foreground leading-relaxed">
                  {t('legal.servicesText')}
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2 mt-4">
                  <li>{t('legal.serviceItem1')}</li>
                  <li>{t('legal.serviceItem2')}</li>
                  <li>{t('legal.serviceItem3')}</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-bold mb-4">{t('legal.userAccountsTitle')}</h2>
                <p className="text-muted-foreground leading-relaxed">
                  {t('legal.userAccountsText')}
                </p>
              </section>

              <section>
                <h2 className="text-xl font-bold mb-4">{t('legal.paymentTitle')}</h2>
                <p className="text-muted-foreground leading-relaxed">
                  {t('legal.paymentText')}
                </p>
              </section>

              <section>
                <h2 className="text-xl font-bold mb-4">{t('legal.subscriptionTitle')}</h2>
                <p className="text-muted-foreground leading-relaxed">
                  {t('legal.subscriptionText')}
                </p>
              </section>

              <section>
                <h2 className="text-xl font-bold mb-4">{t('legal.liabilityTitle')}</h2>
                <p className="text-muted-foreground leading-relaxed">
                  {t('legal.liabilityText')}
                </p>
              </section>

              <section>
                <h2 className="text-xl font-bold mb-4">{t('legal.contactTitle')}</h2>
                <p className="text-muted-foreground leading-relaxed">
                  {t('legal.contactText')}
                </p>
                <p className="text-primary font-medium mt-2">info@khidma.ma</p>
              </section>
            </CardContent>
          </Card>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default TermsOfService;
