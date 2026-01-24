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
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Globe, Plus, Trash2, Loader2, MapPin, Edit, Flag, Check, X } from "lucide-react";

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
  
  // Dialogs
  const [countryDialogOpen, setCountryDialogOpen] = useState(false);
  const [cityDialogOpen, setCityDialogOpen] = useState(false);
  const [editCountryDialogOpen, setEditCountryDialogOpen] = useState(false);
  const [editCityDialogOpen, setEditCityDialogOpen] = useState(false);
  
  // Forms
  const [newCountry, setNewCountry] = useState({ code: "", name_ar: "", name_en: "", name_fr: "" });
  const [newCity, setNewCity] = useState({ name_ar: "", name_en: "", name_fr: "" });
  const [editingCountry, setEditingCountry] = useState<Country | null>(null);
  const [editingCity, setEditingCity] = useState<City | null>(null);

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

  // Country CRUD
  const handleAddCountry = async () => {
    if (!newCountry.code || !newCountry.name_ar || !newCountry.name_en) {
      toast({
        title: "خطأ",
        description: "يرجى ملء الحقول المطلوبة",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase.from("countries").insert(newCountry);

      if (error) throw error;

      toast({
        title: "تمت الإضافة",
        description: "تم إضافة الدولة بنجاح",
      });

      setNewCountry({ code: "", name_ar: "", name_en: "", name_fr: "" });
      setCountryDialogOpen(false);
      loadData();
    } catch (error: any) {
      toast({
        title: "خطأ",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleUpdateCountry = async () => {
    if (!editingCountry) return;

    try {
      const { error } = await supabase
        .from("countries")
        .update({
          code: editingCountry.code,
          name_ar: editingCountry.name_ar,
          name_en: editingCountry.name_en,
          name_fr: editingCountry.name_fr,
        })
        .eq("id", editingCountry.id);

      if (error) throw error;

      toast({
        title: "تم التحديث",
        description: "تم تحديث الدولة بنجاح",
      });

      setEditCountryDialogOpen(false);
      setEditingCountry(null);
      loadData();
    } catch (error: any) {
      toast({
        title: "خطأ",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleToggleCountry = async (countryId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from("countries")
        .update({ is_active: !isActive })
        .eq("id", countryId);

      if (error) throw error;

      toast({
        title: "تم التحديث",
        description: isActive ? "تم تعطيل الدولة" : "تم تفعيل الدولة",
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

  const handleDeleteCountry = async (countryId: string) => {
    try {
      const { error } = await supabase.from("countries").delete().eq("id", countryId);

      if (error) throw error;

      toast({
        title: "تم الحذف",
        description: "تم حذف الدولة بنجاح",
      });

      if (selectedCountry === countryId) {
        setSelectedCountry(countries.find(c => c.id !== countryId)?.id || null);
      }
      loadData();
    } catch (error: any) {
      toast({
        title: "خطأ",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  // City CRUD
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

  const handleUpdateCity = async () => {
    if (!editingCity) return;

    try {
      const { error } = await supabase
        .from("cities")
        .update({
          name_ar: editingCity.name_ar,
          name_en: editingCity.name_en,
          name_fr: editingCity.name_fr,
        })
        .eq("id", editingCity.id);

      if (error) throw error;

      toast({
        title: "تم التحديث",
        description: "تم تحديث المدينة بنجاح",
      });

      setEditCityDialogOpen(false);
      setEditingCity(null);
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
      <Tabs defaultValue="countries" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="countries" className="flex items-center gap-2">
            <Flag className="h-4 w-4" />
            الدول
          </TabsTrigger>
          <TabsTrigger value="cities" className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            المدن
          </TabsTrigger>
        </TabsList>

        {/* Countries Tab */}
        <TabsContent value="countries">
          <Card>
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="h-5 w-5" />
                    إدارة الدول
                  </CardTitle>
                  <CardDescription>إضافة وتعديل وحذف الدول</CardDescription>
                </div>
                <Dialog open={countryDialogOpen} onOpenChange={setCountryDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 ml-2" />
                      إضافة دولة
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>إضافة دولة جديدة</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label>رمز الدولة *</Label>
                        <Input
                          value={newCountry.code}
                          onChange={(e) => setNewCountry({ ...newCountry, code: e.target.value.toUpperCase() })}
                          placeholder="MA"
                          maxLength={3}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>الاسم بالعربية *</Label>
                        <Input
                          value={newCountry.name_ar}
                          onChange={(e) => setNewCountry({ ...newCountry, name_ar: e.target.value })}
                          placeholder="المغرب"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>الاسم بالإنجليزية *</Label>
                        <Input
                          value={newCountry.name_en}
                          onChange={(e) => setNewCountry({ ...newCountry, name_en: e.target.value })}
                          placeholder="Morocco"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>الاسم بالفرنسية</Label>
                        <Input
                          value={newCountry.name_fr}
                          onChange={(e) => setNewCountry({ ...newCountry, name_fr: e.target.value })}
                          placeholder="Maroc"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setCountryDialogOpen(false)}>
                        إلغاء
                      </Button>
                      <Button onClick={handleAddCountry}>
                        إضافة
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right">الرمز</TableHead>
                      <TableHead className="text-right">الاسم بالعربية</TableHead>
                      <TableHead className="text-right">الاسم بالإنجليزية</TableHead>
                      <TableHead className="text-right">الاسم بالفرنسية</TableHead>
                      <TableHead className="text-right">الحالة</TableHead>
                      <TableHead className="text-right">إجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {countries.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          لا توجد دول
                        </TableCell>
                      </TableRow>
                    ) : (
                      countries.map((country) => (
                        <TableRow key={country.id}>
                          <TableCell className="font-mono font-bold">{country.code}</TableCell>
                          <TableCell className="font-medium">{country.name_ar}</TableCell>
                          <TableCell>{country.name_en}</TableCell>
                          <TableCell>{country.name_fr || "-"}</TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={
                                country.is_active
                                  ? "bg-green-50 text-green-700 border-green-200"
                                  : "bg-red-50 text-red-700 border-red-200"
                              }
                            >
                              {country.is_active ? "مفعل" : "معطل"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  setEditingCountry(country);
                                  setEditCountryDialogOpen(true);
                                }}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleToggleCountry(country.id, country.is_active)}
                              >
                                {country.is_active ? (
                                  <X className="h-4 w-4 text-red-500" />
                                ) : (
                                  <Check className="h-4 w-4 text-green-500" />
                                )}
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-destructive hover:text-destructive"
                                onClick={() => handleDeleteCountry(country.id)}
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
        </TabsContent>

        {/* Cities Tab */}
        <TabsContent value="cities">
          <div className="space-y-6">
            {/* Country Selector */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  اختر الدولة
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {countries.map((country) => (
                    <Button
                      key={country.id}
                      variant={selectedCountry === country.id ? "default" : "outline"}
                      onClick={() => setSelectedCountry(country.id)}
                      className="gap-2"
                    >
                      <span className="font-mono text-xs">{country.code}</span>
                      {country.name_ar}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Cities List */}
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
                      <Button disabled={!selectedCountry}>
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
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setCityDialogOpen(false)}>
                          إلغاء
                        </Button>
                        <Button onClick={handleAddCity}>
                          إضافة
                        </Button>
                      </DialogFooter>
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
                              <div className="flex items-center gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => {
                                    setEditingCity(city);
                                    setEditCityDialogOpen(true);
                                  }}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleToggleCity(city.id, city.is_active)}
                                >
                                  {city.is_active ? (
                                    <X className="h-4 w-4 text-red-500" />
                                  ) : (
                                    <Check className="h-4 w-4 text-green-500" />
                                  )}
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="text-destructive hover:text-destructive"
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
        </TabsContent>
      </Tabs>

      {/* Edit Country Dialog */}
      <Dialog open={editCountryDialogOpen} onOpenChange={setEditCountryDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تعديل الدولة</DialogTitle>
          </DialogHeader>
          {editingCountry && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>رمز الدولة</Label>
                <Input
                  value={editingCountry.code}
                  onChange={(e) => setEditingCountry({ ...editingCountry, code: e.target.value.toUpperCase() })}
                  maxLength={3}
                />
              </div>
              <div className="space-y-2">
                <Label>الاسم بالعربية</Label>
                <Input
                  value={editingCountry.name_ar}
                  onChange={(e) => setEditingCountry({ ...editingCountry, name_ar: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>الاسم بالإنجليزية</Label>
                <Input
                  value={editingCountry.name_en}
                  onChange={(e) => setEditingCountry({ ...editingCountry, name_en: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>الاسم بالفرنسية</Label>
                <Input
                  value={editingCountry.name_fr || ""}
                  onChange={(e) => setEditingCountry({ ...editingCountry, name_fr: e.target.value })}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditCountryDialogOpen(false)}>
              إلغاء
            </Button>
            <Button onClick={handleUpdateCountry}>
              حفظ
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit City Dialog */}
      <Dialog open={editCityDialogOpen} onOpenChange={setEditCityDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تعديل المدينة</DialogTitle>
          </DialogHeader>
          {editingCity && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>الاسم بالعربية</Label>
                <Input
                  value={editingCity.name_ar}
                  onChange={(e) => setEditingCity({ ...editingCity, name_ar: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>الاسم بالإنجليزية</Label>
                <Input
                  value={editingCity.name_en}
                  onChange={(e) => setEditingCity({ ...editingCity, name_en: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>الاسم بالفرنسية</Label>
                <Input
                  value={editingCity.name_fr || ""}
                  onChange={(e) => setEditingCity({ ...editingCity, name_fr: e.target.value })}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditCityDialogOpen(false)}>
              إلغاء
            </Button>
            <Button onClick={handleUpdateCity}>
              حفظ
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminLocationsTab;
