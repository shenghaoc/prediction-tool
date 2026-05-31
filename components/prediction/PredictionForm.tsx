"use client";

import { useMemo } from "react";
import { Loader2 } from "lucide-react";
import type { UseFormReturn } from "react-hook-form";

import type { TFunction } from "../../lib/i18n";
import type { PredictionFormValues } from "../../lib/prediction-schema";
import { FLAT_MODELS, ML_MODELS, STOREY_RANGES, TOWNS, LEASE_COMMENCE_YEARS } from "../../lib/lists";
import { MIN_FLOOR_AREA_SQM, MAX_FLOOR_AREA_SQM } from "../../lib/prediction";
import { FormSelect, type FormSelectOption } from "@/components/ui/form-select";
import { Button } from "@/components/ui/button";
import { Combobox, type ComboboxOption } from "@/components/ui/combobox";
import { NumberField } from "@/components/ui/number-field";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  useFormField,
} from "@/components/ui/form";
import { FieldGroup } from "@/components/ui/field";
import type { FieldType } from "./types";

type PredictionFormProps = {
  form: UseFormReturn<FieldType>;
  onSubmit: (values: PredictionFormValues) => void;
  onReset: () => void;
  isPending: boolean;
  t: TFunction;
};

function labeledOptions<T extends string>(
  values: readonly T[],
  labelFor: (value: T) => string,
): FormSelectOption<T>[] {
  return values.map((value) => ({ value, label: labelFor(value) }));
}

function TranslatedFormMessage({ t }: { t: TFunction }) {
  const { error, formMessageId } = useFormField();
  if (!error?.message) return null;

  return (
    <p
      id={formMessageId}
      role="alert"
      className="text-sm font-normal text-destructive"
    >
      {t(error.message, error.message)}
    </p>
  );
}

function SubmitButton({ t, isPending }: { t: TFunction; isPending: boolean }) {
  return (
    <Button
      type="submit"
      size="lg"
      className="w-full normal-case tracking-normal transition-all duration-200 hover:brightness-110"
      disabled={isPending}
    >
      {isPending ? (
        <>
          <Loader2 className="size-4 animate-spin" aria-hidden />
          {t("predicting")}
        </>
      ) : (
        t("get_prediction")
      )}
    </Button>
  );
}

export default function PredictionForm({
  form,
  onSubmit,
  onReset,
  isPending,
  t,
}: PredictionFormProps) {
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
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="contents">
        <FieldGroup className="gap-6">
          <FormField
            control={form.control}
            name="ml_model"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("ml_model")}</FormLabel>
                <FormControl>
                  <FormSelect
                    id="input-ml_model"
                    value={field.value}
                    onChange={field.onChange}
                    options={mlModelOptions}
                    placeholder={t("select_ml_model")}
                  />
                </FormControl>
                <TranslatedFormMessage t={t} />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-2 gap-4 max-[520px]:grid-cols-1">
            <FormField
              control={form.control}
              name="town"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("town")}</FormLabel>
                  <FormControl>
                    <Combobox
                      id="input-town"
                      value={field.value}
                      onChange={field.onChange}
                      options={townComboboxOptions}
                      placeholder={t("select_town")}
                      ariaLabel={t("town")}
                    />
                  </FormControl>
                  <TranslatedFormMessage t={t} />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="storey_range"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("storey_range")}</FormLabel>
                  <FormControl>
                    <FormSelect
                      id="input-storey_range"
                      value={field.value}
                      onChange={field.onChange}
                      options={storeyOptions}
                      placeholder={t("select_storey_range")}
                    />
                  </FormControl>
                  <TranslatedFormMessage t={t} />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="flat_model"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("flat_model")}</FormLabel>
                  <FormControl>
                    <FormSelect
                      id="input-flat_model"
                      value={field.value}
                      onChange={field.onChange}
                      options={flatModelOptions}
                      placeholder={t("select_flat_model")}
                    />
                  </FormControl>
                  <TranslatedFormMessage t={t} />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="floor_area_sqm"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("floor_area")}</FormLabel>
                  <FormControl>
                    <NumberField
                      id="input-floor_area"
                      value={field.value}
                      onChange={(value) => field.onChange(value === "" ? 0 : value)}
                      min={MIN_FLOOR_AREA_SQM}
                      max={MAX_FLOOR_AREA_SQM}
                      step={5}
                      placeholder={t("enter_floor_area")}
                      unit="m²"
                      unitLabel={t("square_metres")}
                      ariaLabel={t("floor_area")}
                      required
                    />
                  </FormControl>
                  <TranslatedFormMessage t={t} />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="lease_commence_year"
            render={({ field }) => (
              <FormItem>
                <FormLabel htmlFor="input-lease_commence_date">{t("lease_commence_date")}</FormLabel>
                <FormControl>
                  <FormSelect
                    id="input-lease_commence_date"
                    value={String(field.value)}
                    onChange={(year) => field.onChange(Number(year))}
                    options={leaseYearOptions}
                    placeholder={t("select_year")}
                  />
                </FormControl>
                <TranslatedFormMessage t={t} />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-2 gap-3 max-[520px]:grid-cols-1">
            <SubmitButton t={t} isPending={isPending} />
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
    </Form>
  );
}
