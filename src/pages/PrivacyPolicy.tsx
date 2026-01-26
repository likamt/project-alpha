import { useTranslation } from "react-i18next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const PrivacyPolicy = () => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  return (
    <div className="min-h-screen bg-gradient-subtle" dir={isRTL ? 'rtl' : 'ltr'}>
      <Navbar />
      <div className="container mx-auto px-4 pt-24 pb-12">
        <div className="max-w-4xl mx-auto">
          <Card className="animate-scale-in shadow-lg">
            <CardHeader className="text-center border-b">
              <CardTitle className="text-3xl">{t('legal.privacyTitle')}</CardTitle>
              <p className="text-muted-foreground mt-2">{t('legal.lastUpdated')}: 2024-01-01</p>
            </CardHeader>
            <CardContent className="prose prose-lg dark:prose-invert max-w-none p-8 space-y-8">
              <section>
                <h2 className="text-xl font-bold mb-4">{t('legal.dataCollectionTitle')}</h2>
                <p className="text-muted-foreground leading-relaxed">
                  {t('legal.dataCollectionText')}
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2 mt-4">
                  <li>{t('legal.dataItem1')}</li>
                  <li>{t('legal.dataItem2')}</li>
                  <li>{t('legal.dataItem3')}</li>
                  <li>{t('legal.dataItem4')}</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-bold mb-4">{t('legal.dataUseTitle')}</h2>
                <p className="text-muted-foreground leading-relaxed">
                  {t('legal.dataUseText')}
                </p>
              </section>

              <section>
                <h2 className="text-xl font-bold mb-4">{t('legal.dataProtectionTitle')}</h2>
                <p className="text-muted-foreground leading-relaxed">
                  {t('legal.dataProtectionText')}
                </p>
              </section>

              <section>
                <h2 className="text-xl font-bold mb-4">{t('legal.cookiesTitle')}</h2>
                <p className="text-muted-foreground leading-relaxed">
                  {t('legal.cookiesText')}
                </p>
              </section>

              <section>
                <h2 className="text-xl font-bold mb-4">{t('legal.userRightsTitle')}</h2>
                <p className="text-muted-foreground leading-relaxed">
                  {t('legal.userRightsText')}
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2 mt-4">
                  <li>{t('legal.rightItem1')}</li>
                  <li>{t('legal.rightItem2')}</li>
                  <li>{t('legal.rightItem3')}</li>
                  <li>{t('legal.rightItem4')}</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-bold mb-4">{t('legal.contactTitle')}</h2>
                <p className="text-muted-foreground leading-relaxed">
                  {t('legal.privacyContactText')}
                </p>
                <p className="text-primary font-medium mt-2">privacy@khidma.ma</p>
              </section>
            </CardContent>
          </Card>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default PrivacyPolicy;
