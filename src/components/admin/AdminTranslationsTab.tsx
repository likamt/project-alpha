import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Languages, Plus, Edit, Trash2, Loader2, Search, Save } from "lucide-react";

interface Translation {
  id: string;
  language_code: string;
  translation_key: string;
  translation_value: string;
}

const LANGUAGES = [
  { code: "ar", name: "العربية" },
  { code: "en", name: "English" },
  { code: "fr", name: "Français" },
  { code: "es", name: "Español" },
  { code: "de", name: "Deutsch" },
];

const AdminTranslationsTab = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [translations, setTranslations] = useState<Translation[]>([]);
  const [selectedLanguage, setSelectedLanguage] = useState("ar");
  const [searchQuery, setSearchQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTranslation, setEditingTranslation] = useState<Translation | null>(null);
  const [formData, setFormData] = useState({
    translation_key: "",
    translation_value: "",
  });

  useEffect(() => {
    loadTranslations();
  }, [selectedLanguage]);

  const loadTranslations = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from("translations")
        .select("*")
        .eq("language_code", selectedLanguage)
        .order("translation_key");

      if (error) throw error;
      setTranslations(data || []);
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

  const handleSave = async () => {
    if (!formData.translation_key || !formData.translation_value) {
      toast({
        title: "خطأ",
        description: "يرجى ملء جميع الحقول",
        variant: "destructive",
      });
      return;
    }

    try {
      if (editingTranslation) {
        const { error } = await supabase
          .from("translations")
          .update({
            translation_value: formData.translation_value,
            updated_at: new Date().toISOString(),
          })
          .eq("id", editingTranslation.id);

        if (error) throw error;
        toast({ title: "تم التحديث", description: "تم تحديث الترجمة بنجاح" });
      } else {
        const { error } = await supabase.from("translations").insert({
          language_code: selectedLanguage,
          translation_key: formData.translation_key,
          translation_value: formData.translation_value,
        });

        if (error) throw error;
        toast({ title: "تمت الإضافة", description: "تم إضافة الترجمة بنجاح" });
      }

      setFormData({ translation_key: "", translation_value: "" });
      setEditingTranslation(null);
      setDialogOpen(false);
      loadTranslations();
    } catch (error: any) {
      toast({
        title: "خطأ",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleEdit = (translation: Translation) => {
    setEditingTranslation(translation);
    setFormData({
      translation_key: translation.translation_key,
      translation_value: translation.translation_value,
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from("translations").delete().eq("id", id);
      if (error) throw error;
      toast({ title: "تم الحذف", description: "تم حذف الترجمة بنجاح" });
      loadTranslations();
    } catch (error: any) {
      toast({
        title: "خطأ",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const filteredTranslations = translations.filter(
    (t) =>
      t.translation_key.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.translation_value.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Languages className="h-5 w-5" />
              إدارة الترجمات
            </CardTitle>
            <CardDescription>إضافة وتعديل الترجمات المخصصة</CardDescription>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LANGUAGES.map((lang) => (
                  <SelectItem key={lang.code} value={lang.code}>
                    {lang.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Dialog open={dialogOpen} onOpenChange={(open) => {
              setDialogOpen(open);
              if (!open) {
                setEditingTranslation(null);
                setFormData({ translation_key: "", translation_value: "" });
              }
            }}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 ml-2" />
                  إضافة ترجمة
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {editingTranslation ? "تعديل الترجمة" : "إضافة ترجمة جديدة"}
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>المفتاح (Key)</Label>
                    <Input
                      value={formData.translation_key}
                      onChange={(e) =>
                        setFormData({ ...formData, translation_key: e.target.value })
                      }
                      placeholder="common.welcome"
                      disabled={!!editingTranslation}
                      dir="ltr"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>النص المترجم</Label>
                    <Textarea
                      value={formData.translation_value}
                      onChange={(e) =>
                        setFormData({ ...formData, translation_value: e.target.value })
                      }
                      placeholder="مرحباً"
                      rows={3}
                    />
                  </div>
                  <Button onClick={handleSave} className="w-full">
                    <Save className="h-4 w-4 ml-2" />
                    {editingTranslation ? "حفظ التعديلات" : "إضافة"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="بحث..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-10"
            />
          </div>
        </div>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right">المفتاح</TableHead>
                <TableHead className="text-right">النص</TableHead>
                <TableHead className="text-right w-24">إجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTranslations.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                    لا توجد ترجمات
                  </TableCell>
                </TableRow>
              ) : (
                filteredTranslations.map((translation) => (
                  <TableRow key={translation.id}>
                    <TableCell className="font-mono text-sm" dir="ltr">
                      {translation.translation_key}
                    </TableCell>
                    <TableCell>{translation.translation_value}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(translation)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive"
                          onClick={() => handleDelete(translation.id)}
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
  );
};

export default AdminTranslationsTab;
