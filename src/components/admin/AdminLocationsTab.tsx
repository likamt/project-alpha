import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Globe, Plus, Edit, Trash2, Loader2, MapPin } from "lucide-react";

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

const AdminLocationsTab = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [countries, setCountries] = useState<Country[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [cityDialogOpen, setCityDialogOpen] = useState(false);
  const [newCity, setNewCity] = useState({ name_ar: "", name_en: "", name_fr: "" });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      const [countriesRes, citiesRes] = await Promise.all([
        supabase.from("countries").select("*").order("name_ar"),
        supabase.from("cities").select("*").order("name_ar"),
      ]);

      if (countriesRes.error) throw countriesRes.error;
      if (citiesRes.error) throw citiesRes.error;

      setCountries(countriesRes.data || []);
      setCities(citiesRes.data || []);
      
      if (countriesRes.data?.[0]) {
        setSelectedCountry(countriesRes.data[0].id);
      }
    } catch (error: any) {
      toast({
        title: "خطأ",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddCity = async () => {
    if (!selectedCountry || !newCity.name_ar || !newCity.name_en) {
      toast({
        title: "خطأ",
        description: "يرجى ملء الحقول المطلوبة",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase.from("cities").insert({
        country_id: selectedCountry,
        ...newCity,
      });

      if (error) throw error;

      toast({
        title: "تمت الإضافة",
        description: "تم إضافة المدينة بنجاح",
      });

      setNewCity({ name_ar: "", name_en: "", name_fr: "" });
      setCityDialogOpen(false);
      loadData();
    } catch (error: any) {
      toast({
        title: "خطأ",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleToggleCity = async (cityId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from("cities")
        .update({ is_active: !isActive })
        .eq("id", cityId);

      if (error) throw error;

      toast({
        title: "تم التحديث",
        description: isActive ? "تم تعطيل المدينة" : "تم تفعيل المدينة",
      });

      loadData();
    } catch (error: any) {
      toast({
        title: "خطأ",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDeleteCity = async (cityId: string) => {
    try {
      const { error } = await supabase.from("cities").delete().eq("id", cityId);

      if (error) throw error;

      toast({
        title: "تم الحذف",
        description: "تم حذف المدينة بنجاح",
      });

      loadData();
    } catch (error: any) {
      toast({
        title: "خطأ",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const filteredCities = cities.filter((c) => c.country_id === selectedCountry);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Countries */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            الدول
          </CardTitle>
          <CardDescription>اختر دولة لعرض مدنها</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {countries.map((country) => (
              <Button
                key={country.id}
                variant={selectedCountry === country.id ? "default" : "outline"}
                onClick={() => setSelectedCountry(country.id)}
              >
                {country.name_ar}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Cities */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                المدن
              </CardTitle>
              <CardDescription>
                {countries.find((c) => c.id === selectedCountry)?.name_ar || "اختر دولة"}
              </CardDescription>
            </div>
            <Dialog open={cityDialogOpen} onOpenChange={setCityDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 ml-2" />
                  إضافة مدينة
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>إضافة مدينة جديدة</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>الاسم بالعربية *</Label>
                    <Input
                      value={newCity.name_ar}
                      onChange={(e) => setNewCity({ ...newCity, name_ar: e.target.value })}
                      placeholder="الدار البيضاء"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>الاسم بالإنجليزية *</Label>
                    <Input
                      value={newCity.name_en}
                      onChange={(e) => setNewCity({ ...newCity, name_en: e.target.value })}
                      placeholder="Casablanca"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>الاسم بالفرنسية</Label>
                    <Input
                      value={newCity.name_fr}
                      onChange={(e) => setNewCity({ ...newCity, name_fr: e.target.value })}
                      placeholder="Casablanca"
                    />
                  </div>
                  <Button onClick={handleAddCity} className="w-full">
                    إضافة
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">الاسم بالعربية</TableHead>
                  <TableHead className="text-right">الاسم بالإنجليزية</TableHead>
                  <TableHead className="text-right">الاسم بالفرنسية</TableHead>
                  <TableHead className="text-right">الحالة</TableHead>
                  <TableHead className="text-right">إجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCities.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      لا توجد مدن
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCities.map((city) => (
                    <TableRow key={city.id}>
                      <TableCell className="font-medium">{city.name_ar}</TableCell>
                      <TableCell>{city.name_en}</TableCell>
                      <TableCell>{city.name_fr || "-"}</TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            city.is_active
                              ? "bg-green-50 text-green-700 border-green-200"
                              : "bg-red-50 text-red-700 border-red-200"
                          }
                        >
                          {city.is_active ? "مفعل" : "معطل"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggleCity(city.id, city.is_active)}
                          >
                            {city.is_active ? "تعطيل" : "تفعيل"}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive"
                            onClick={() => handleDeleteCity(city.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminLocationsTab;
