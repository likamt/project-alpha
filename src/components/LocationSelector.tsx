import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { MapPin } from "lucide-react";

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
        <Select
          value={selectedCountryId || undefined}
          onValueChange={(value) => {
            onCountryChange(value);
            onCityChange(""); // Reset city when country changes
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder={t("common.selectCountry")} />
          </SelectTrigger>
          <SelectContent>
            {countries.map((country) => (
              <SelectItem key={country.id} value={country.id}>
                {getLocalizedName(country)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label className="flex items-center gap-2">
          <MapPin className="h-4 w-4" />
          {t("common.city")} {required && "*"}
        </Label>
        <Select
          value={selectedCityId || undefined}
          onValueChange={onCityChange}
          disabled={!selectedCountryId || cities.length === 0}
        >
          <SelectTrigger>
            <SelectValue
              placeholder={
                !selectedCountryId
                  ? t("common.selectCountryFirst")
                  : t("common.selectCity")
              }
            />
          </SelectTrigger>
          <SelectContent>
            {cities.map((city) => (
              <SelectItem key={city.id} value={city.id}>
                {getLocalizedName(city)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

export default LocationSelector;
