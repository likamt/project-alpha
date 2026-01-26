import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { Label } from "@/components/ui/label";
import { MapPin, ChevronDown, Loader2 } from "lucide-react";

interface Country {
  id: string;
  code: string;
  name_ar: string;
  name_en: string;
  name_fr: string | null;
  is_active: boolean;
}

interface City {
  id: string;
  country_id: string;
  name_ar: string;
  name_en: string;
  name_fr: string | null;
  is_active: boolean;
}

interface LocationSelectorProps {
  selectedCountryId: string;
  selectedCityId: string;
  onCountryChange: (countryId: string) => void;
  onCityChange: (cityId: string) => void;
  required?: boolean;
  className?: string;
}

const LocationSelector = ({
  selectedCountryId,
  selectedCityId,
  onCountryChange,
  onCityChange,
  required = false,
  className = "",
}: LocationSelectorProps) => {
  const { t, i18n } = useTranslation();
  const [countries, setCountries] = useState<Country[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [countriesLoading, setCountriesLoading] = useState(true);
  const [citiesLoading, setCitiesLoading] = useState(false);
  const [countriesError, setCountriesError] = useState<string | null>(null);
  const [citiesError, setCitiesError] = useState<string | null>(null);

  // Load countries on mount
  useEffect(() => {
    const loadCountries = async () => {
      try {
        setCountriesLoading(true);
        setCountriesError(null);
        
        const { data, error } = await supabase
          .from("countries")
          .select("*")
          .eq("is_active", true)
          .order("name_ar");

        if (error) {
          console.error("Error loading countries:", error);
          setCountriesError("فشل في تحميل الدول");
          return;
        }
        
        setCountries(data || []);
      } catch (error) {
        console.error("Exception loading countries:", error);
        setCountriesError("فشل في تحميل الدول");
      } finally {
        setCountriesLoading(false);
      }
    };

    loadCountries();
  }, []);

  // Load cities when country changes
  useEffect(() => {
    const loadCities = async () => {
      // Reset cities when no country is selected
      if (!selectedCountryId) {
        setCities([]);
        return;
      }

      try {
        setCitiesLoading(true);
        setCitiesError(null);
        
        console.log("Fetching cities for country:", selectedCountryId);
        
        const { data, error } = await supabase
          .from("cities")
          .select("*")
          .eq("country_id", selectedCountryId)
          .eq("is_active", true)
          .order("name_ar");

        if (error) {
          console.error("Error loading cities:", error);
          setCitiesError("فشل في تحميل المدن");
          return;
        }
        
        console.log("Loaded cities:", data);
        setCities(data || []);
      } catch (error) {
        console.error("Exception loading cities:", error);
        setCitiesError("فشل في تحميل المدن");
      } finally {
        setCitiesLoading(false);
      }
    };

    loadCities();
  }, [selectedCountryId]);

  const getLocalizedName = (item: Country | City) => {
    const lang = i18n.language;
    if (lang === "ar") return item.name_ar;
    if (lang === "fr" && item.name_fr) return item.name_fr;
    return item.name_en;
  };

  const handleCountryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    console.log("Country changed to:", value);
    onCountryChange(value);
    onCityChange(""); // Reset city when country changes
  };

  const handleCityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    console.log("City changed to:", value);
    onCityChange(value);
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Country Selection */}
      <div className="space-y-2">
        <Label className="flex items-center gap-2">
          <MapPin className="h-4 w-4" />
          {t("common.country")} {required && <span className="text-destructive">*</span>}
        </Label>
        <div className="relative">
          <select
            value={selectedCountryId}
            onChange={handleCountryChange}
            disabled={countriesLoading}
            required={required}
            className="flex h-10 w-full cursor-pointer appearance-none items-center rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            aria-label={t("common.selectCountry")}
          >
            <option value="">
              {countriesLoading ? (
                "جاري تحميل الدول..."
              ) : countriesError ? (
                countriesError
              ) : (
                t("common.selectCountry")
              )}
            </option>
            {countries.map((country) => (
              <option key={country.id} value={country.id}>
                {getLocalizedName(country)}
              </option>
            ))}
          </select>
          <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
            {countriesLoading ? (
              <Loader2 className="h-4 w-4 animate-spin opacity-50" />
            ) : (
              <ChevronDown className="h-4 w-4 opacity-50" />
            )}
          </div>
        </div>
        {countriesError && (
          <p className="text-sm text-destructive">{countriesError}</p>
        )}
      </div>

      {/* City Selection */}
      <div className="space-y-2">
        <Label className="flex items-center gap-2">
          <MapPin className="h-4 w-4" />
          {t("common.city")} {required && <span className="text-destructive">*</span>}
        </Label>
        <div className="relative">
          <select
            value={selectedCityId}
            onChange={handleCityChange}
            disabled={!selectedCountryId || citiesLoading}
            required={required}
            className="flex h-10 w-full cursor-pointer appearance-none items-center rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            aria-label={t("common.selectCity")}
          >
            <option value="">
              {!selectedCountryId ? (
                t("common.selectCountryFirst")
              ) : citiesLoading ? (
                "جاري تحميل المدن..."
              ) : citiesError ? (
                citiesError
              ) : cities.length === 0 ? (
                "لا توجد مدن متاحة"
              ) : (
                t("common.selectCity")
              )}
            </option>
            {cities.map((city) => (
              <option key={city.id} value={city.id}>
                {getLocalizedName(city)}
              </option>
            ))}
          </select>
          <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
            {citiesLoading ? (
              <Loader2 className="h-4 w-4 animate-spin opacity-50" />
            ) : (
              <ChevronDown className="h-4 w-4 opacity-50" />
            )}
          </div>
        </div>
        {citiesError && (
          <p className="text-sm text-destructive">{citiesError}</p>
        )}
        {selectedCountryId && !citiesLoading && cities.length > 0 && (
          <p className="text-xs text-muted-foreground">
            {cities.length} مدينة متاحة
          </p>
        )}
      </div>
    </div>
  );
};

export default LocationSelector;
