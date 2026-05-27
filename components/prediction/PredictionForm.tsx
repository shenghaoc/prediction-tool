"use client";

import { useMemo } from "react";
import { Loader2 } from "lucide-react";
import type { TFunction } from "../../lib/i18n";
import { Temporal } from "../../lib/temporal";
import { MAX_FLOOR_AREA_SQM, MIN_FLOOR_AREA_SQM } from "../../lib/prediction";
import { FLAT_MODELS, ML_MODELS, STOREY_RANGES, TOWNS, LEASE_COMMENCE_YEARS } from "../../lib/lists";
import { FormSelect, type FormSelectOption } from "@/components/ui/form-select";
import { Button } from "@/components/ui/button";
import { Field, FieldContent, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Combobox, type ComboboxOption } from "@/components/ui/combobox";
import { NumberField } from "@/components/ui/number-field";
import type { FieldType } from "./types";

type PredictionFormProps = {
  loading: boolean;
  onFinish: (values: FieldType) => Promise<void>;
  onReset: () => void;
  onValuesChange: (allValues: Partial<FieldType>) => void;
  t: TFunction;
  formValues: FieldType;
};

function labeledOptions<T extends string>(
  values: readonly T[],
  labelFor: (value: T) => string,
): FormSelectOption<T>[] {
  return values.map((value) => ({ value, label: labelFor(value) }));
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
    void onFinish(formValues);
  };

  const handleChange = <K extends keyof FieldType>(key: K, value: FieldType[K]) => {
    onValuesChange({ ...formValues, [key]: value });
  };

  const mlModelOptions = useMemo(
    () => labeledOptions(ML_MODELS, (m) => t(`ml_models.${m}`, m)),
    [t],
  );
  const townComboboxOptions: ComboboxOption[] = useMemo(
    () => TOWNS.map((town) => ({ value: town, label: t(`towns.${town}`, town) })),
    [t],
  );
  const storeyOptions = useMemo(
    () => labeledOptions(STOREY_RANGES, (m) => t(`storey_ranges.${m}`, m)),
    [t],
  );
  const flatModelOptions = useMemo(
    () => labeledOptions(FLAT_MODELS, (m) => t(`flat_models.${m}`, m)),
    [t],
  );
  const leaseYearOptions = useMemo(
    () => LEASE_COMMENCE_YEARS.map((y) => ({ value: String(y), label: String(y) })),
    [],
  );

  return (
    <form onSubmit={handleSubmit}>
      <FieldGroup className="gap-6">
        <Field>
          <FieldLabel htmlFor="input-ml_model">{t("ml_model")}</FieldLabel>
          <FieldContent>
            <FormSelect
              id="input-ml_model"
              value={formValues.ml_model}
              onChange={(value) => handleChange("ml_model", value)}
              options={mlModelOptions}
              placeholder={t("select_ml_model")}
            />
          </FieldContent>
        </Field>

        <div className="grid grid-cols-2 gap-4 max-[520px]:grid-cols-1">
          <Field>
            <FieldLabel htmlFor="input-town">{t("town")}</FieldLabel>
            <FieldContent>
              <Combobox
                id="input-town"
                value={formValues.town}
                onChange={(value) => handleChange("town", value as typeof formValues.town)}
                options={townComboboxOptions}
                placeholder={t("select_town")}
                ariaLabel={t("town")}
              />
            </FieldContent>
          </Field>
          <Field>
            <FieldLabel htmlFor="input-storey_range">{t("storey_range")}</FieldLabel>
            <FieldContent>
              <FormSelect
                id="input-storey_range"
                value={formValues.storey_range}
                onChange={(value) => handleChange("storey_range", value)}
                options={storeyOptions}
                placeholder={t("select_storey_range")}
              />
            </FieldContent>
          </Field>
          <Field>
            <FieldLabel htmlFor="input-flat_model">{t("flat_model")}</FieldLabel>
            <FieldContent>
              <FormSelect
                id="input-flat_model"
                value={formValues.flat_model}
                onChange={(value) => handleChange("flat_model", value)}
                options={flatModelOptions}
                placeholder={t("select_flat_model")}
              />
            </FieldContent>
          </Field>
          <Field>
            <FieldLabel htmlFor="input-floor_area">{t("floor_area")}</FieldLabel>
            <FieldContent>
              <NumberField
                id="input-floor_area"
                value={formValues.floor_area_sqm || ""}
                onChange={(value) => handleChange("floor_area_sqm", value || 0)}
                min={MIN_FLOOR_AREA_SQM}
                max={MAX_FLOOR_AREA_SQM}
                step={5}
                placeholder={t("enter_floor_area")}
                unit="m²"
                ariaLabel={t("floor_area")}
              />
            </FieldContent>
          </Field>
        </div>

        <Field>
          <FieldLabel htmlFor="input-lease_commence_date">{t("lease_commence_date")}</FieldLabel>
          <FieldContent>
            <FormSelect
              id="input-lease_commence_date"
              value={String(formValues.lease_commence_date.year)}
              onChange={(year) => {
                handleChange("lease_commence_date", Temporal.PlainDate.from(`${year}-01-01`));
              }}
              options={leaseYearOptions}
              placeholder={t("select_year")}
            />
          </FieldContent>
        </Field>

        <div className="grid grid-cols-2 gap-3 max-[520px]:grid-cols-1">
          <Button
            type="submit"
            size="lg"
            className="w-full normal-case tracking-normal transition-all duration-200 hover:brightness-110"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="size-4 animate-spin" aria-hidden />
                {t("predicting")}
              </>
            ) : (
              t("get_prediction")
            )}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="lg"
            className="w-full normal-case tracking-normal transition-all duration-200"
            onClick={onReset}
          >
            {t("reset_form")}
          </Button>
        </div>
      </FieldGroup>
    </form>
  );
}
