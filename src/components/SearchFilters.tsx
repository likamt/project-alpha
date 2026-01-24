import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Filter, X } from "lucide-react";

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

interface SearchFiltersProps {
  selectedCountryId: string;
  selectedCityId: string;
  onCountryChange: (countryId: string) => void;
  onCityChange: (cityId: string) => void;
  onClearFilters: () => void;
  additionalFilters?: React.ReactNode;
}

const SearchFilters = ({
  selectedCountryId,
  selectedCityId,
  onCountryChange,
  onCityChange,
  onClearFilters,
  additionalFilters,
}: SearchFiltersProps) => {
  const { t, i18n } = useTranslation();
  const [countries, setCountries] = useState<Country[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);

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
    const { data } = await supabase
      .from("countries")
      .select("*")
      .eq("is_active", true)
      .order("name_ar");
    setCountries(data || []);
  };

  const loadCities = async (countryId: string) => {
    const { data } = await supabase
      .from("cities")
      .select("*")
      .eq("country_id", countryId)
      .eq("is_active", true)
      .order("name_ar");
    setCities(data || []);
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

  const hasActiveFilters = selectedCountryId || selectedCityId;
  const selectedCountry = countries.find((c) => c.id === selectedCountryId);
  const selectedCity = cities.find((c) => c.id === selectedCityId);

  return (
    <Card className="mb-6">
      <CardContent className="pt-4">
        {/* Active filters badges */}
        {hasActiveFilters && (
          <div className="flex flex-wrap gap-2 mb-4">
            {selectedCountry && (
              <Badge variant="secondary" className="gap-1">
                <MapPin className="h-3 w-3" />
                {getLocalizedName(selectedCountry)}
                <button
                  onClick={() => {
                    onCountryChange("");
                    onCityChange("");
                  }}
                  className="ml-1 hover:text-destructive"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {selectedCity && (
              <Badge variant="secondary" className="gap-1">
                {getLocalizedName(selectedCity)}
                <button
                  onClick={() => onCityChange("")}
                  className="ml-1 hover:text-destructive"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearFilters}
              className="text-xs h-6"
            >
              {t("common.clearFilters") || "مسح الكل"}
            </Button>
          </div>
        )}

        {/* Filter toggle button */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          className="gap-2 mb-4"
        >
          <Filter className="h-4 w-4" />
          {t("common.filter")}
        </Button>

        {/* Expanded filters */}
        {isExpanded && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-in fade-in-50">
            <Select
              value={selectedCountryId}
              onValueChange={(value) => {
                onCountryChange(value);
                onCityChange("");
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder={t("common.selectCountry")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("common.allCountries") || "جميع الدول"}</SelectItem>
                {countries.map((country) => (
                  <SelectItem key={country.id} value={country.id}>
                    {getLocalizedName(country)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={selectedCityId}
              onValueChange={onCityChange}
              disabled={!selectedCountryId || selectedCountryId === "all"}
            >
              <SelectTrigger>
                <SelectValue
                  placeholder={
                    !selectedCountryId || selectedCountryId === "all"
                      ? t("common.selectCountryFirst")
                      : t("common.selectCity")
                  }
                />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("common.allCities") || "جميع المدن"}</SelectItem>
                {cities.map((city) => (
                  <SelectItem key={city.id} value={city.id}>
                    {getLocalizedName(city)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {additionalFilters}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SearchFilters;
