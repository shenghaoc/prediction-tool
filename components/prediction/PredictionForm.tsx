"use client";

import { useRef, useCallback } from "react";
import type { TFunction } from "../../lib/i18n";
import { Temporal } from "../../lib/temporal";
import { MAX_FLOOR_AREA_SQM, MIN_FLOOR_AREA_SQM } from "../../lib/prediction";
import { FLAT_MODELS, ML_MODELS, STOREY_RANGES, TOWNS, LEASE_COMMENCE_YEARS } from "../../lib/lists";
import type { FieldType } from "./types";

type PredictionFormProps = {
  loading: boolean;
  onFinish: (values: FieldType) => Promise<void>;
  onReset: () => void;
  onValuesChange: (_: unknown, allValues: Partial<FieldType>) => void;
  t: TFunction;
  formValues: FieldType;
};

function Field({ label, children, full, htmlFor }: { label: string; children: React.ReactNode; full?: boolean; htmlFor?: string }) {
  return (
    <div className={full ? "col-span-2 max-sm:col-span-1" : undefined}>
      <label className="mb-1.5 block text-[10.5px] font-bold uppercase tracking-[1px] text-text-secondary" htmlFor={htmlFor}>
        {label}
      </label>
      {children}
    </div>
  );
}

function BtnPrimary({ children, loading }: { children: React.ReactNode; loading: boolean }) {
  const ref = useRef<HTMLButtonElement>(null);

  const handleClick = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    const el = ref.current;
    if (!el || loading) return;
    const rect = el.getBoundingClientRect();
    const sz = Math.max(rect.width, rect.height) * 2;
    const span = document.createElement("span");
    span.className = "ripple-circle";
    span.style.cssText = `width:${sz}px;height:${sz}px;left:${e.clientX - rect.left - sz / 2}px;top:${e.clientY - rect.top - sz / 2}px`;
    el.appendChild(span);
    setTimeout(() => span.remove(), 600);
  }, [loading]);

  return (
    <button
      ref={ref}
      type="submit"
      onClick={handleClick}
      disabled={loading}
      className={`ripple-container rounded-btn bg-primary text-on-primary shadow-button flex min-h-10 cursor-pointer items-center justify-center border-none px-6 text-sm font-semibold transition hover:-translate-y-px active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50 disabled:pointer-events-none${loading ? " animate-pulse" : ""}`}
    >
      {children}
    </button>
  );
}

export default function PredictionForm({
  loading,
  onFinish,
  onReset,
  onValuesChange,
  t,
  formValues,
}: PredictionFormProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onFinish(formValues);
  };

  const handleChange = (key: keyof FieldType, value: unknown) => {
    const newValues = { ...formValues, [key]: value };
    onValuesChange(null, newValues);
  };

  const selectClass =
    "field-select w-full cursor-pointer appearance-none rounded-input border border-border bg-input-bg pl-3.5 pr-9 text-sm font-medium text-text outline-none transition hover:border-border-strong focus:border-primary focus:ring-[3px] focus:ring-primary-ring min-h-10";

  return (
    <>
      <h2 className="mb-4 flex items-center gap-2.5 text-lg font-bold tracking-[-0.02em] text-primary">
        <span className="block w-[3px] h-5 rounded-full bg-primary" />
        {t("prediction_form")}
      </h2>
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-2 gap-x-4 gap-y-3.5 max-sm:grid-cols-1">
          <Field label={t("ml_model")} htmlFor="input-ml_model">
            <select
              id="input-ml_model"
              className={selectClass}
              value={formValues.ml_model || ""}
              onChange={(e) => handleChange("ml_model", e.target.value)}
              required
            >
              <option value="" disabled>{t("select_ml_model")}</option>
              {ML_MODELS.map((m) => (
                <option key={m} value={m}>{t(`ml_models.${m}`, m)}</option>
              ))}
            </select>
          </Field>
          <Field label={t("town")} htmlFor="input-town">
            <select
              id="input-town"
              className={selectClass}
              value={formValues.town || ""}
              onChange={(e) => handleChange("town", e.target.value)}
              required
            >
              <option value="" disabled>{t("select_town")}</option>
              {TOWNS.map((m) => (
                <option key={m} value={m}>{t(`towns.${m}`, m)}</option>
              ))}
            </select>
          </Field>
          <Field label={t("storey_range")} htmlFor="input-storey_range">
            <select
              id="input-storey_range"
              className={selectClass}
              value={formValues.storey_range || ""}
              onChange={(e) => handleChange("storey_range", e.target.value)}
              required
            >
              <option value="" disabled>{t("select_storey_range")}</option>
              {STOREY_RANGES.map((m) => (
                <option key={m} value={m}>{t(`storey_ranges.${m}`, m)}</option>
              ))}
            </select>
          </Field>
          <Field label={t("flat_model")} htmlFor="input-flat_model">
            <select
              id="input-flat_model"
              className={selectClass}
              value={formValues.flat_model || ""}
              onChange={(e) => handleChange("flat_model", e.target.value)}
              required
            >
              <option value="" disabled>{t("select_flat_model")}</option>
              {FLAT_MODELS.map((m) => (
                <option key={m} value={m}>{t(`flat_models.${m}`, m)}</option>
              ))}
            </select>
          </Field>
          <Field label={t("floor_area")} full htmlFor="input-floor_area">
            <div className="grid grid-cols-[1fr_auto]">
              <input
                id="input-floor_area"
                type="number"
                inputMode="numeric"
                enterKeyHint="done"
                className="rounded-input rounded-r-none border border-border bg-input-bg px-3.5 text-sm font-medium text-text outline-none transition hover:border-border-strong focus:border-primary focus:ring-[3px] focus:ring-primary-ring min-h-10 w-full cursor-text placeholder:text-text-muted placeholder:font-normal"
                min={MIN_FLOOR_AREA_SQM}
                max={MAX_FLOOR_AREA_SQM}
                value={formValues.floor_area_sqm || ""}
                placeholder={t("enter_floor_area")}
                onChange={(e) => handleChange("floor_area_sqm", e.target.value ? Number(e.target.value) : undefined)}
                required
              />
              <span className="unit-tag">m²</span>
            </div>
          </Field>
          <Field label={t("lease_commence_date")} full htmlFor="input-lease_commence_date">
            <select
              id="input-lease_commence_date"
              className={selectClass}
              value={formValues.lease_commence_date ? formValues.lease_commence_date.year : ""}
              onChange={(e) => {
                handleChange("lease_commence_date", Temporal.PlainDate.from(`${e.target.value}-01-01`));
              }}
              required
            >
              <option value="" disabled>{t("select_year")}</option>
              {LEASE_COMMENCE_YEARS.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </Field>
          <div className="col-span-2 mt-1 grid grid-cols-2 gap-3 max-sm:col-span-1 max-sm:grid-cols-1">
            <BtnPrimary loading={loading}>
              {loading ? t("predicting") : t("get_prediction")}
            </BtnPrimary>
            <button type="button" className="rounded-btn flex min-h-10 cursor-pointer items-center justify-center border border-border bg-transparent px-6 text-sm font-semibold text-text-secondary transition hover:-translate-y-px active:translate-y-0" onClick={onReset}>
              {t("reset_form")}
            </button>
          </div>
        </div>
      </form>
    </>
  );
}
