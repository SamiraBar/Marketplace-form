import { z } from "zod";

export const productSchema = z.object({
  name: z.string().min(2, "Минимум 2 символа").max(120, "Максимум 120 символов"),
  type: z.string().default("product"),
  code: z
    .string()
    .max(64, "Максимум 64 символа")
    .refine((v) => v === v.trim(), "Нет пробелов в начале/конце")
    .optional()
    .or(z.literal("")),
  marketplace_price: z
    .number({ invalid_type_error: "Укажите число" })
    .min(0, "Цена не может быть отрицательной")
    .optional(),
  unit: z.number().int().positive("Должно быть положительным числом").optional(),
  category: z.number().int().positive("Должно быть положительным числом").optional(),
  global_category_id: z.number().int().positive("Должно быть положительным числом").optional(),
  description_short: z.string().max(500).optional().or(z.literal("")),
  description_long: z.string().optional().or(z.literal("")),
  seo_title: z.string().max(200).optional().or(z.literal("")),
  seo_description: z.string().max(500).optional().or(z.literal("")),
  seo_keywords: z
    .array(z.string().min(1).max(32, "Тег до 32 символов"))
    .max(20, "Максимум 20 тегов")
    .default([]),
  cashback_type: z.string().default("lcard_cashback"),
  chatting_percent: z
    .number({ invalid_type_error: "Укажите число" })
    .min(0, "Минимум 0")
    .max(100, "Максимум 100")
    .optional(),
  address: z.string().optional().or(z.literal("")),
  latitude: z
    .number({ invalid_type_error: "Укажите число" })
    .min(-90, "От -90 до 90")
    .max(90, "От -90 до 90")
    .optional(),
  longitude: z
    .number({ invalid_type_error: "Укажите число" })
    .min(-180, "От -180 до 180")
    .max(180, "От -180 до 180")
    .optional(),
});

export type ProductFormValues = z.infer<typeof productSchema>;
