import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { Label } from "@/components/ui/label";
import { MapPin, ChevronDown } from "lucide-react";

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
  const [loading, setLoading] = useState(true);
  const [citiesLoading, setCitiesLoading] = useState(false);

  useEffect(() => {
    loadCountries();
  }, []);

  useEffect(() => {
    if (selectedCountryId) {
      loadCities(selectedCountryId);
    } else {
      setCities([]);
    }
  }, [selectedCountryId]);

  const loadCountries = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("countries")
        .select("*")
        .eq("is_active", true)
        .order("name_ar");

      if (error) throw error;
      console.log("Loaded countries:", data);
      setCountries(data || []);
    } catch (error) {
      console.error("Error loading countries:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadCities = useCallback(async (countryId: string) => {
    try {
      setCitiesLoading(true);
      const { data, error } = await supabase
        .from("cities")
        .select("*")
        .eq("country_id", countryId)
        .eq("is_active", true)
        .order("name_ar");

      if (error) throw error;
      console.log("Loaded cities for country", countryId, ":", data);
      setCities(data || []);
    } catch (error) {
      console.error("Error loading cities:", error);
    } finally {
      setCitiesLoading(false);
    }
  }, []);

  const getLocalizedName = (item: Country | City) => {
    switch (i18n.language) {
      case "ar":
        return item.name_ar;
      case "fr":
        return item.name_fr || item.name_en;
      default:
        return item.name_en;
    }
  };

  const handleCountryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    console.log("Country selected:", value);
    onCountryChange(value);
    onCityChange(""); // Reset city when country changes
  };

  const handleCityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    console.log("City selected:", value);
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
            disabled={loading}
            className="flex h-10 w-full cursor-pointer appearance-none items-center rounded-md border border-input bg-background pe-10 ps-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="">{loading ? "جاري التحميل..." : t("common.selectCountry")}</option>
            {countries.map((country) => (
              <option key={country.id} value={country.id}>
                {getLocalizedName(country)}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 opacity-50 pointer-events-none" />
        </div>
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
            className="flex h-10 w-full cursor-pointer appearance-none items-center rounded-md border border-input bg-background pe-10 ps-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="">
              {!selectedCountryId
                ? t("common.selectCountryFirst")
                : citiesLoading
                ? "جاري التحميل..."
                : cities.length === 0
                ? "لا توجد مدن متاحة"
                : t("common.selectCity")}
            </option>
            {cities.map((city) => (
              <option key={city.id} value={city.id}>
                {getLocalizedName(city)}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 opacity-50 pointer-events-none" />
        </div>
      </div>
    </div>
  );
};

export default LocationSelector;
