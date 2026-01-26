import { z } from "zod";

// Common validation patterns
const phoneRegex = /^[0-9+\-\s()]{7,20}$/;
const arabicTextRegex = /^[\u0600-\u06FF\s\d.,!?؟،؛:()[\]"'_\-]+$/;

// Helper for non-empty trimmed strings
const nonEmptyString = (message: string) => 
  z.string().trim().min(1, { message });

// Helper for optional trimmed strings with max length
const optionalString = (maxLength: number) => 
  z.string().trim().max(maxLength).optional().or(z.literal(""));

// ===================
// Authentication Schemas
// ===================

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .email({ message: "البريد الإلكتروني غير صالح" })
    .max(255, { message: "البريد الإلكتروني طويل جداً" }),
  password: z
    .string()
    .min(8, { message: "كلمة المرور يجب أن تكون 8 أحرف على الأقل" })
    .max(72, { message: "كلمة المرور طويلة جداً" }),
});

export const signupSchema = z.object({
  fullName: nonEmptyString("الاسم الكامل مطلوب")
    .min(2, { message: "الاسم يجب أن يكون حرفين على الأقل" })
    .max(100, { message: "الاسم طويل جداً" }),
  email: z
    .string()
    .trim()
    .email({ message: "البريد الإلكتروني غير صالح" })
    .max(255, { message: "البريد الإلكتروني طويل جداً" }),
  phone: z
    .string()
    .trim()
    .regex(phoneRegex, { message: "رقم الهاتف غير صالح" })
    .optional()
    .or(z.literal("")),
  password: z
    .string()
    .min(8, { message: "كلمة المرور يجب أن تكون 8 أحرف على الأقل" })
    .max(72, { message: "كلمة المرور طويلة جداً" })
    .regex(/[A-Z]/, { message: "يجب أن تحتوي على حرف كبير واحد على الأقل" })
    .regex(/[a-z]/, { message: "يجب أن تحتوي على حرف صغير واحد على الأقل" })
    .regex(/[0-9]/, { message: "يجب أن تحتوي على رقم واحد على الأقل" }),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "كلمات المرور غير متطابقة",
  path: ["confirmPassword"],
});

// ===================
// Home Cook Schemas
// ===================

export const homeCookRegistrationSchema = z.object({
  description: nonEmptyString("وصف الخدمات مطلوب")
    .min(20, { message: "الوصف يجب أن يكون 20 حرفاً على الأقل" })
    .max(1000, { message: "الوصف طويل جداً" }),
  hourlyRate: z
    .string()
    .trim()
    .refine((val) => !val || (!isNaN(Number(val)) && Number(val) >= 0), {
      message: "السعر يجب أن يكون رقماً موجباً",
    })
    .optional()
    .or(z.literal("")),
  minOrderAmount: z
    .string()
    .trim()
    .refine((val) => !val || (!isNaN(Number(val)) && Number(val) >= 0), {
      message: "الحد الأدنى يجب أن يكون رقماً موجباً",
    })
    .optional()
    .or(z.literal("")),
  location: optionalString(500),
  countryId: nonEmptyString("اختيار الدولة مطلوب"),
  cityId: nonEmptyString("اختيار المدينة مطلوب"),
  specialties: z
    .array(z.string())
    .min(1, { message: "يجب اختيار تخصص واحد على الأقل" })
    .max(10, { message: "الحد الأقصى 10 تخصصات" }),
  deliveryAvailable: z.boolean().default(true),
});

// ===================
// House Worker Schemas
// ===================

export const houseWorkerRegistrationSchema = z.object({
  description: nonEmptyString("وصف الخدمات مطلوب")
    .min(20, { message: "الوصف يجب أن يكون 20 حرفاً على الأقل" })
    .max(1000, { message: "الوصف طويل جداً" }),
  hourlyRate: z
    .string()
    .trim()
    .refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
      message: "سعر الساعة مطلوب ويجب أن يكون أكبر من صفر",
    }),
  location: optionalString(500),
  countryId: nonEmptyString("اختيار الدولة مطلوب"),
  cityId: nonEmptyString("اختيار المدينة مطلوب"),
  services: z
    .array(z.string())
    .min(1, { message: "يجب اختيار خدمة واحدة على الأقل" })
    .max(10, { message: "الحد الأقصى 10 خدمات" }),
  experienceYears: z
    .string()
    .trim()
    .refine((val) => !val || (!isNaN(Number(val)) && Number(val) >= 0 && Number(val) <= 50), {
      message: "سنوات الخبرة يجب أن تكون بين 0 و 50",
    })
    .optional()
    .or(z.literal("")),
  workType: z.enum(["flexible", "full_time", "part_time"]).default("flexible"),
  serviceCategory: z.string().optional(),
  ageRange: z.string().optional(),
  nationality: optionalString(100),
  languages: z.array(z.string()).optional(),
  availableDays: z.array(z.string()).optional(),
});

// ===================
// Food Order Schemas
// ===================

export const foodOrderSchema = z.object({
  quantity: z
    .number()
    .int()
    .min(1, { message: "الكمية يجب أن تكون 1 على الأقل" })
    .max(50, { message: "الحد الأقصى 50" }),
  deliveryAddress: nonEmptyString("عنوان التوصيل مطلوب")
    .min(10, { message: "العنوان يجب أن يكون 10 أحرف على الأقل" })
    .max(500, { message: "العنوان طويل جداً" }),
  deliveryNotes: optionalString(500),
  scheduledDeliveryAt: z.date().optional(),
  countryId: nonEmptyString("اختيار الدولة مطلوب"),
  cityId: nonEmptyString("اختيار المدينة مطلوب"),
});

// ===================
// Worker Booking Schemas
// ===================

export const workerBookingSchema = z.object({
  bookingDate: z.date({
    required_error: "تاريخ الحجز مطلوب",
  }),
  startTime: nonEmptyString("وقت البداية مطلوب"),
  endTime: nonEmptyString("وقت الانتهاء مطلوب"),
  serviceType: nonEmptyString("نوع الخدمة مطلوب"),
  notes: optionalString(1000),
  countryId: nonEmptyString("اختيار الدولة مطلوب"),
  cityId: nonEmptyString("اختيار المدينة مطلوب"),
}).refine((data) => {
  if (data.startTime && data.endTime) {
    return data.startTime < data.endTime;
  }
  return true;
}, {
  message: "وقت الانتهاء يجب أن يكون بعد وقت البداية",
  path: ["endTime"],
});

// ===================
// Dish Schemas
// ===================

export const dishSchema = z.object({
  name: nonEmptyString("اسم الطبق مطلوب")
    .min(2, { message: "الاسم يجب أن يكون حرفين على الأقل" })
    .max(100, { message: "الاسم طويل جداً" }),
  description: optionalString(500),
  price: z
    .string()
    .trim()
    .refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
      message: "السعر مطلوب ويجب أن يكون أكبر من صفر",
    }),
  category: nonEmptyString("التصنيف مطلوب"),
  preparationTimeMinutes: z
    .string()
    .trim()
    .refine((val) => !val || (!isNaN(Number(val)) && Number(val) >= 5 && Number(val) <= 480), {
      message: "وقت التحضير يجب أن يكون بين 5 و 480 دقيقة",
    })
    .optional()
    .or(z.literal("")),
  servings: z
    .string()
    .trim()
    .refine((val) => !val || (!isNaN(Number(val)) && Number(val) >= 1 && Number(val) <= 50), {
      message: "عدد الحصص يجب أن يكون بين 1 و 50",
    })
    .optional()
    .or(z.literal("")),
  ingredients: z.array(z.string()).optional(),
  dietaryTags: z.array(z.string()).optional(),
  isAvailable: z.boolean().default(true),
});

// ===================
// Rating Schemas
// ===================

export const ratingSchema = z.object({
  rating: z
    .number()
    .int()
    .min(1, { message: "التقييم يجب أن يكون بين 1 و 5" })
    .max(5, { message: "التقييم يجب أن يكون بين 1 و 5" }),
  comment: optionalString(500),
});

// ===================
// Message Schemas
// ===================

export const messageSchema = z.object({
  content: nonEmptyString("الرسالة مطلوبة")
    .max(2000, { message: "الرسالة طويلة جداً" }),
});

// ===================
// Profile Schemas
// ===================

export const profileUpdateSchema = z.object({
  fullName: nonEmptyString("الاسم الكامل مطلوب")
    .min(2, { message: "الاسم يجب أن يكون حرفين على الأقل" })
    .max(100, { message: "الاسم طويل جداً" }),
  phone: z
    .string()
    .trim()
    .regex(phoneRegex, { message: "رقم الهاتف غير صالح" })
    .optional()
    .or(z.literal("")),
});

// ===================
// Contact/Support Schemas
// ===================

export const contactSchema = z.object({
  name: nonEmptyString("الاسم مطلوب")
    .min(2, { message: "الاسم يجب أن يكون حرفين على الأقل" })
    .max(100, { message: "الاسم طويل جداً" }),
  email: z
    .string()
    .trim()
    .email({ message: "البريد الإلكتروني غير صالح" })
    .max(255, { message: "البريد الإلكتروني طويل جداً" }),
  subject: nonEmptyString("الموضوع مطلوب")
    .max(200, { message: "الموضوع طويل جداً" }),
  message: nonEmptyString("الرسالة مطلوبة")
    .min(10, { message: "الرسالة يجب أن تكون 10 أحرف على الأقل" })
    .max(2000, { message: "الرسالة طويلة جداً" }),
});

// ===================
// Type exports
// ===================

export type LoginFormData = z.infer<typeof loginSchema>;
export type SignupFormData = z.infer<typeof signupSchema>;
export type HomeCookRegistrationData = z.infer<typeof homeCookRegistrationSchema>;
export type HouseWorkerRegistrationData = z.infer<typeof houseWorkerRegistrationSchema>;
export type FoodOrderData = z.infer<typeof foodOrderSchema>;
export type WorkerBookingData = z.infer<typeof workerBookingSchema>;
export type DishData = z.infer<typeof dishSchema>;
export type RatingData = z.infer<typeof ratingSchema>;
export type MessageData = z.infer<typeof messageSchema>;
export type ProfileUpdateData = z.infer<typeof profileUpdateSchema>;
export type ContactData = z.infer<typeof contactSchema>;
