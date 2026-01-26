import { useState, useEffect } from "react";
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
      const { data, error } = await supabase
        .from("countries")
        .select("*")
        .eq("is_active", true)
        .order("name_ar");

      if (error) throw error;
      setCountries(data || []);
    } catch (error) {
      console.error("Error loading countries:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadCities = async (countryId: string) => {
    try {
      const { data, error } = await supabase
        .from("cities")
        .select("*")
        .eq("country_id", countryId)
        .eq("is_active", true)
        .order("name_ar");

      if (error) throw error;
      setCities(data || []);
    } catch (error) {
      console.error("Error loading cities:", error);
    }
  };

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

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="space-y-2">
        <Label className="flex items-center gap-2">
          <MapPin className="h-4 w-4" />
          {t("common.country")} {required && "*"}
        </Label>
        <div className="relative">
          <select
            value={selectedCountryId}
            onChange={(e) => {
              onCountryChange(e.target.value);
              onCityChange(""); // Reset city when country changes
            }}
            className="flex h-10 w-full appearance-none items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={loading}
          >
            <option value="">{t("common.selectCountry")}</option>
            {countries.map((country) => (
              <option key={country.id} value={country.id}>
                {getLocalizedName(country)}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 opacity-50 pointer-events-none" />
        </div>
      </div>

      <div className="space-y-2">
        <Label className="flex items-center gap-2">
          <MapPin className="h-4 w-4" />
          {t("common.city")} {required && "*"}
        </Label>
        <div className="relative">
          <select
            value={selectedCityId}
            onChange={(e) => onCityChange(e.target.value)}
            disabled={!selectedCountryId || cities.length === 0}
            className="flex h-10 w-full appearance-none items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="">
              {!selectedCountryId
                ? t("common.selectCountryFirst")
                : t("common.selectCity")}
            </option>
            {cities.map((city) => (
              <option key={city.id} value={city.id}>
                {getLocalizedName(city)}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 opacity-50 pointer-events-none" />
        </div>
      </div>
    </div>
  );
};

export default LocationSelector;
