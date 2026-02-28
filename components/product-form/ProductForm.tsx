"use client";

import { useState, useEffect, useRef } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  Package,
  FileText,
  Search,
  MapPin,
  Sparkles,
  Save,
  RotateCcw,
  Plus,
  X,
  ChevronRight,
  AlertCircle,
  Loader2,
  History,
  Wand2,
} from "lucide-react";
import { productSchema, type ProductFormValues } from "@/lib/schema";
import { createNomenclature } from "@/lib/api";

const DRAFT_KEY = "product_form_draft";

const TABS = [
  { id: "main", label: "Основное", icon: Package },
  { id: "description", label: "Описание", icon: FileText },
  { id: "seo", label: "SEO", icon: Search },
  { id: "location", label: "Локация", icon: MapPin },
];

const CASHBACK_OPTIONS = [
  { value: "lcard_cashback", label: "L-Card Cashback" },
  { value: "bonus", label: "Бонусы" },
  { value: "none", label: "Без кешбэка" },
];

const UNIT_OPTIONS = [
  { value: 116, label: "шт" },
  { value: 117, label: "кг" },
  { value: 118, label: "л" },
  { value: 119, label: "м" },
  { value: 120, label: "упак" },
];

function ErrorMsg({ msg }: { msg?: string }) {
  if (!msg) return null;
  return (
    <div className="flex items-center gap-1.5 mt-1.5">
      <AlertCircle className="w-3.5 h-3.5 text-red-500 shrink-0" />
      <span className="text-xs text-red-500">{msg}</span>
    </div>
  );
}

function Label({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block text-sm font-medium text-ink mb-1.5">
      {children}
      {required && <span className="text-accent ml-1">*</span>}
    </label>
  );
}

function Input({ className = "", ...props }: React.InputHTMLAttributes<HTMLInputElement> & { className?: string }) {
  return (
    <input
      className={`w-full px-3.5 py-2.5 rounded-xl border border-border bg-white text-sm text-ink placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-all ${className}`}
      {...props}
    />
  );
}

function Textarea({ className = "", ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={`w-full px-3.5 py-2.5 rounded-xl border border-border bg-white text-sm text-ink placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-all resize-none ${className}`}
      {...props}
    />
  );
}

function Select({
  options,
  value,
  onChange,
  placeholder,
}: {
  options: { value: string | number; label: string }[];
  value: string | number | undefined;
  onChange: (v: string | number) => void;
  placeholder?: string;
}) {
  return (
    <select
      value={value ?? ""}
      onChange={(e) => {
        const v = e.target.value;
        if (v === "") return;
        const opt = options.find((o) => String(o.value) === v);
        if (opt) onChange(opt.value);
      }}
      className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-white text-sm text-ink focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-all appearance-none cursor-pointer"
    >
      {placeholder && (
        <option value="" disabled>
          {placeholder}
        </option>
      )}
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

export default function ProductForm() {
  const [activeTab, setActiveTab] = useState("main");
  const [tagInput, setTagInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [hasDraft, setHasDraft] = useState(false);
  const tagInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    reset,
    getValues,
    formState: { errors },
  } = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      type: "product",
      cashback_type: "lcard_cashback",
      seo_keywords: [],
    },
  });

  const keywords = watch("seo_keywords") ?? [];
  const nameValue = watch("name") ?? "";

  useEffect(() => {
    const draft = localStorage.getItem(DRAFT_KEY);
    if (draft) setHasDraft(true);
  }, []);

  function saveDraft() {
    const values = getValues();
    localStorage.setItem(DRAFT_KEY, JSON.stringify(values));
    toast.success("Черновик сохранён");
    setHasDraft(true);
  }

  function restoreDraft() {
    const draft = localStorage.getItem(DRAFT_KEY);
    if (!draft) return;
    try {
      const values = JSON.parse(draft);
      reset(values);
      toast.success("Черновик восстановлен");
    } catch {
      toast.error("Не удалось восстановить черновик");
    }
  }

  function handleReset() {
    reset({
      type: "product",
      cashback_type: "lcard_cashback",
      seo_keywords: [],
    });
    localStorage.removeItem(DRAFT_KEY);
    setHasDraft(false);
    toast.info("Форма сброшена");
  }

  function generateSEO() {
    const name = nameValue;
    if (!name || name.length < 2) {
      toast.error("Сначала введите название товара");
      return;
    }
    setValue("seo_title", `${name} купить по выгодной цене`);
    setValue(
      "seo_description",
      `Закажите ${name}. Быстрая доставка, гарантия качества, удобная оплата.`
    );
    const words = name
      .toLowerCase()
      .split(/\s+/)
      .filter((w) => w.length > 2)
      .slice(0, 5);
    const extra = ["купить", "цена", "доставка"];
    setValue("seo_keywords", Array.from(new Set([...words, ...extra])).slice(0, 20));
    toast.success("SEO сгенерировано из названия");
    setActiveTab("seo");
  }

  function addTag() {
    const tag = tagInput.trim();
    if (!tag) return;
    if (tag.length > 32) {
      toast.error("Тег не может быть длиннее 32 символов");
      return;
    }
    if (keywords.includes(tag)) {
      toast.error("Такой тег уже есть");
      return;
    }
    if (keywords.length >= 20) {
      toast.error("Максимум 20 тегов");
      return;
    }
    setValue("seo_keywords", [...keywords, tag]);
    setTagInput("");
    tagInputRef.current?.focus();
  }

  function removeTag(tag: string) {
    setValue("seo_keywords", keywords.filter((k) => k !== tag));
  }

  async function onSubmit(data: ProductFormValues) {
    setLoading(true);
    try {
      // Clean empty optional fields
      const payload: Record<string, unknown> = {};
      Object.entries(data).forEach(([k, v]) => {
        if (v !== "" && v !== undefined && v !== null) {
          payload[k] = v;
        }
      });
      if (!payload.seo_keywords || (payload.seo_keywords as string[]).length === 0) {
        delete payload.seo_keywords;
      }

      const result = await createNomenclature(payload);
      toast.success("Товар успешно создан!", {
        description: `ID: ${JSON.stringify(result).slice(0, 60)}`,
      });
      localStorage.removeItem(DRAFT_KEY);
      setHasDraft(false);
      reset({ type: "product", cashback_type: "lcard_cashback", seo_keywords: [] });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Неизвестная ошибка";
      toast.error("Ошибка при создании товара", { description: msg });
    } finally {
      setLoading(false);
    }
  }

  const tabErrors: Record<string, boolean> = {
    main: !!(errors.name || errors.code || errors.marketplace_price || errors.unit || errors.category || errors.global_category_id),
    description: !!(errors.description_short || errors.description_long),
    seo: !!(errors.seo_title || errors.seo_description || errors.seo_keywords),
    location: !!(errors.address || errors.latitude || errors.longitude || errors.chatting_percent),
  };

  return (
    <div className="min-h-screen bg-surface">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-surface/80 backdrop-blur-md border-b border-border">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-ink flex items-center justify-center">
              <Package className="w-4 h-4 text-surface" />
            </div>
            <div>
              <h1 className="font-display text-sm font-600 text-ink leading-tight">
                Новый товар
              </h1>
              <p className="text-xs text-muted">Marketplace</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {hasDraft && (
              <button
                type="button"
                onClick={restoreDraft}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-accent border border-accent/30 bg-accent-light hover:bg-accent/10 transition-colors"
              >
                <History className="w-3.5 h-3.5" />
                Черновик
              </button>
            )}
            <button
              type="button"
              onClick={generateSEO}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-ink border border-border bg-white hover:bg-surface transition-colors"
            >
              <Wand2 className="w-3.5 h-3.5" />
              SEO из названия
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        {/* Hero */}
        <div className="mb-8">
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-ink mb-2">
            Создание товара
          </h2>
          <p className="text-muted text-sm">
            Заполните информацию о товаре. Обязательные поля отмечены{" "}
            <span className="text-accent">*</span>
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          {/* Tabs */}
          <div className="flex gap-1 p-1 bg-white rounded-2xl border border-border mb-6 overflow-x-auto">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => setActiveTab(id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap flex-1 justify-center relative ${
                  activeTab === id
                    ? "bg-ink text-surface shadow-sm"
                    : "text-muted hover:text-ink hover:bg-surface"
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
                {tabErrors[id] && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
                )}
              </button>
            ))}
          </div>

          {/* Tab: Main */}
          {activeTab === "main" && (
            <div className="space-y-5">
              <div className="bg-white rounded-2xl border border-border p-6">
                <h3 className="font-display text-sm font-600 text-ink mb-5 flex items-center gap-2">
                  <Package className="w-4 h-4 text-accent" />
                  Основная информация
                </h3>
                <div className="space-y-4">
                  <div>
                    <Label required>Название товара</Label>
                    <Input
                      {...register("name")}
                      placeholder="Например: Кроссовки Nike Air Max 2024"
                    />
                    <ErrorMsg msg={errors.name?.message} />
                    {nameValue.length > 0 && (
                      <p className="text-xs text-muted mt-1 text-right">
                        {nameValue.length}/120
                      </p>
                    )}
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <Label>Артикул / Код</Label>
                      <Input {...register("code")} placeholder="SKU-001" />
                      <ErrorMsg msg={errors.code?.message} />
                    </div>
                    <div>
                      <Label>Цена на маркетплейсе, ₽</Label>
                      <Input
                        type="number"
                        min={0}
                        step={0.01}
                        {...register("marketplace_price", { valueAsNumber: true })}
                        placeholder="1 990"
                      />
                      <ErrorMsg msg={errors.marketplace_price?.message} />
                    </div>
                  </div>
                  <div className="grid sm:grid-cols-3 gap-4">
                    <div>
                      <Label>Единица измерения</Label>
                      <Controller
                        name="unit"
                        control={control}
                        render={({ field }) => (
                          <Select
                            options={UNIT_OPTIONS}
                            value={field.value}
                            onChange={(v) => field.onChange(Number(v))}
                            placeholder="Выбрать..."
                          />
                        )}
                      />
                      <ErrorMsg msg={errors.unit?.message} />
                    </div>
                    <div>
                      <Label>Категория (ID)</Label>
                      <Input
                        type="number"
                        min={1}
                        {...register("category", { valueAsNumber: true })}
                        placeholder="2477"
                      />
                      <ErrorMsg msg={errors.category?.message} />
                    </div>
                    <div>
                      <Label>Глобальная категория (ID)</Label>
                      <Input
                        type="number"
                        min={1}
                        {...register("global_category_id", { valueAsNumber: true })}
                        placeholder="127"
                      />
                      <ErrorMsg msg={errors.global_category_id?.message} />
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-border p-6">
                <h3 className="font-display text-sm font-600 text-ink mb-5 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-accent" />
                  Кешбэк и условия
                </h3>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <Label>Тип кешбэка</Label>
                    <Controller
                      name="cashback_type"
                      control={control}
                      render={({ field }) => (
                        <Select
                          options={CASHBACK_OPTIONS}
                          value={field.value}
                          onChange={(v) => field.onChange(String(v))}
                        />
                      )}
                    />
                  </div>
                  <div>
                    <Label>Процент чата (%)</Label>
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      step={0.1}
                      {...register("chatting_percent", { valueAsNumber: true })}
                      placeholder="4"
                    />
                    <ErrorMsg msg={errors.chatting_percent?.message} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab: Description */}
          {activeTab === "description" && (
            <div className="bg-white rounded-2xl border border-border p-6 space-y-5">
              <h3 className="font-display text-sm font-600 text-ink mb-1 flex items-center gap-2">
                <FileText className="w-4 h-4 text-accent" />
                Описания
              </h3>
              <div>
                <Label>Краткое описание</Label>
                <Textarea
                  {...register("description_short")}
                  rows={3}
                  placeholder="Короткий анонс товара (показывается в карточке)"
                />
                <ErrorMsg msg={errors.description_short?.message} />
              </div>
              <div>
                <Label>Полное описание</Label>
                <Textarea
                  {...register("description_long")}
                  rows={8}
                  placeholder="Подробное описание: характеристики, преимущества, комплектация..."
                />
                <ErrorMsg msg={errors.description_long?.message} />
              </div>
            </div>
          )}

          {/* Tab: SEO */}
          {activeTab === "seo" && (
            <div className="space-y-5">
              <div className="bg-accent-light rounded-2xl border border-accent/20 p-4 flex items-start gap-3">
                <Wand2 className="w-5 h-5 text-accent mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-ink">
                    Автогенерация SEO
                  </p>
                  <p className="text-xs text-muted mt-0.5">
                    Введите название товара и нажмите «SEO из названия» — поля
                    заполнятся автоматически
                  </p>
                </div>
                <button
                  type="button"
                  onClick={generateSEO}
                  className="ml-auto shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-accent text-white rounded-lg text-xs font-medium hover:bg-accent/90 transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Сгенерировать
                </button>
              </div>

              <div className="bg-white rounded-2xl border border-border p-6 space-y-4">
                <h3 className="font-display text-sm font-600 text-ink mb-1 flex items-center gap-2">
                  <Search className="w-4 h-4 text-accent" />
                  SEO-данные
                </h3>
                <div>
                  <Label>SEO-заголовок</Label>
                  <Input
                    {...register("seo_title")}
                    placeholder="Заголовок страницы товара"
                  />
                  <ErrorMsg msg={errors.seo_title?.message} />
                </div>
                <div>
                  <Label>SEO-описание</Label>
                  <Textarea
                    {...register("seo_description")}
                    rows={3}
                    placeholder="Meta description — описание для поисковых систем"
                  />
                  <ErrorMsg msg={errors.seo_description?.message} />
                </div>
                <div>
                  <Label>Ключевые слова</Label>
                  <div className="flex flex-wrap gap-2 mb-2 min-h-[2rem]">
                    {keywords.map((tag) => (
                      <span
                        key={tag}
                        className="flex items-center gap-1 px-2.5 py-1 bg-ink text-surface rounded-lg text-xs font-medium"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => removeTag(tag)}
                          className="hover:text-accent transition-colors ml-1"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input
                      ref={tagInputRef}
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addTag();
                        }
                      }}
                      placeholder="Добавить тег и нажать Enter"
                      className="flex-1 px-3.5 py-2.5 rounded-xl border border-border bg-white text-sm text-ink placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-all"
                    />
                    <button
                      type="button"
                      onClick={addTag}
                      className="px-3.5 py-2.5 rounded-xl border border-border bg-white hover:bg-surface text-muted hover:text-ink transition-all"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-xs text-muted mt-1">
                    {keywords.length}/20 тегов · каждый до 32 символов
                  </p>
                  <ErrorMsg msg={(errors.seo_keywords as { message?: string } | undefined)?.message} />
                </div>
              </div>
            </div>
          )}

          {/* Tab: Location */}
          {activeTab === "location" && (
            <div className="bg-white rounded-2xl border border-border p-6 space-y-4">
              <h3 className="font-display text-sm font-600 text-ink mb-1 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-accent" />
                Адрес и координаты
              </h3>
              <div>
                <Label>Адрес</Label>
                <Input
                  {...register("address")}
                  placeholder="г. Казань, ул. Баумана, 20"
                />
                <ErrorMsg msg={errors.address?.message} />
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label>Широта (latitude)</Label>
                  <Input
                    type="number"
                    step="any"
                    {...register("latitude", { valueAsNumber: true })}
                    placeholder="55.7900"
                  />
                  <p className="text-xs text-muted mt-1">От -90 до 90</p>
                  <ErrorMsg msg={errors.latitude?.message} />
                </div>
                <div>
                  <Label>Долгота (longitude)</Label>
                  <Input
                    type="number"
                    step="any"
                    {...register("longitude", { valueAsNumber: true })}
                    placeholder="49.1300"
                  />
                  <p className="text-xs text-muted mt-1">От -180 до 180</p>
                  <ErrorMsg msg={errors.longitude?.message} />
                </div>
              </div>
              <div className="p-4 rounded-xl bg-surface border border-border">
                <p className="text-xs text-muted flex items-start gap-2">
                  <MapPin className="w-3.5 h-3.5 shrink-0 mt-0.5 text-accent" />
                  Координаты необязательны. Их можно найти через Google Maps:
                  кликните правой кнопкой по точке и скопируйте значения.
                </p>
              </div>
            </div>
          )}

          {/* Navigation between tabs */}
          <div className="flex items-center justify-between mt-4 mb-6">
            {TABS.findIndex((t) => t.id === activeTab) > 0 && (
              <button
                type="button"
                onClick={() => {
                  const idx = TABS.findIndex((t) => t.id === activeTab);
                  setActiveTab(TABS[idx - 1].id);
                }}
                className="text-sm text-muted hover:text-ink flex items-center gap-1 transition-colors"
              >
                ← Назад
              </button>
            )}
            <div className="ml-auto">
              {TABS.findIndex((t) => t.id === activeTab) < TABS.length - 1 && (
                <button
                  type="button"
                  onClick={() => {
                    const idx = TABS.findIndex((t) => t.id === activeTab);
                    setActiveTab(TABS[idx + 1].id);
                  }}
                  className="text-sm text-muted hover:text-ink flex items-center gap-1 transition-colors"
                >
                  Далее <ChevronRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-3 mt-2">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-ink text-surface font-medium text-sm hover:bg-ink/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-ink/10 hover:shadow-ink/20"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Создаём товар...
                </>
              ) : (
                <>
                  <Package className="w-4 h-4" />
                  Создать товар
                </>
              )}
            </button>
            <button
              type="button"
              onClick={saveDraft}
              className="flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-white border border-border text-ink font-medium text-sm hover:bg-surface transition-all"
            >
              <Save className="w-4 h-4" />
              Черновик
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-white border border-border text-muted font-medium text-sm hover:text-ink hover:bg-surface transition-all"
            >
              <RotateCcw className="w-4 h-4" />
              Сброс
            </button>
          </div>
        </form>

        <p className="text-center text-xs text-muted mt-8">
          Данные отправляются в TableCRM · Токен из переменных окружения
        </p>
      </main>
    </div>
  );
}
