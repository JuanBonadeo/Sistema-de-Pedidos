"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { Minus, Plus } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { formatCurrency } from "@/lib/currency";
import type { MenuModifier, MenuProduct } from "@/lib/menu";
import { useCart, type CartModifier } from "@/stores/cart";

type Selection = Record<string, string[]>;

function initialSelection(product: MenuProduct): Selection {
  const sel: Selection = {};
  for (const g of product.modifier_groups) sel[g.id] = [];
  return sel;
}

function validate(product: MenuProduct, selection: Selection): string | null {
  for (const g of product.modifier_groups) {
    const count = selection[g.id]?.length ?? 0;
    if (count < g.min_selection) return `Elegí al menos ${g.min_selection} en "${g.name}".`;
    if (count > g.max_selection) return `Podés elegir hasta ${g.max_selection} en "${g.name}".`;
  }
  return null;
}

export function ProductSheet({
  slug,
  product,
  open,
  onOpenChange,
}: {
  slug: string;
  product: MenuProduct | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const addItem = useCart(slug, (s) => s.addItem);
  const [selection, setSelection] = useState<Selection>({});
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (product) {
      setSelection(initialSelection(product));
      setQuantity(1);
      setNotes("");
    }
  }, [product?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const lineTotal = useMemo(() => {
    if (!product) return 0;
    const modsTotal = product.modifier_groups.reduce((acc, g) => {
      const selected = selection[g.id] ?? [];
      return (
        acc +
        g.modifiers
          .filter((m) => selected.includes(m.id))
          .reduce((a, m) => a + m.price_delta_cents, 0)
      );
    }, 0);
    return (product.price_cents + modsTotal) * quantity;
  }, [product, selection, quantity]);

  if (!product) return null;

  const handleAdd = () => {
    const error = validate(product, selection);
    if (error) {
      toast.error(error);
      return;
    }
    const modifiers: CartModifier[] = product.modifier_groups.flatMap((g) =>
      g.modifiers
        .filter((m) => selection[g.id]?.includes(m.id))
        .map((m) => ({
          modifier_id: m.id,
          group_id: g.id,
          name: m.name,
          price_delta_cents: m.price_delta_cents,
        })),
    );
    addItem({
      id: crypto.randomUUID(),
      product_id: product.id,
      product_name: product.name,
      unit_price_cents: product.price_cents,
      quantity,
      notes: notes.trim() || undefined,
      image_url: product.image_url,
      modifiers,
    });
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="max-h-[90vh] overflow-y-auto rounded-t-2xl p-0"
      >
        {product.image_url && (
          <div className="relative h-48 w-full">
            <Image
              src={product.image_url}
              alt={product.name}
              fill
              sizes="500px"
              priority
              className="object-cover"
            />
          </div>
        )}
        <div className="px-4 pt-4 pb-28">
          <SheetHeader className="p-0 text-left">
            <SheetTitle className="text-2xl">{product.name}</SheetTitle>
          </SheetHeader>
          {product.description && (
            <p className="text-muted-foreground mt-1 text-sm">
              {product.description}
            </p>
          )}

          {product.modifier_groups.map((group) => (
            <ModifierGroupSection
              key={group.id}
              groupId={group.id}
              name={group.name}
              required={group.is_required}
              min={group.min_selection}
              max={group.max_selection}
              modifiers={group.modifiers}
              value={selection[group.id] ?? []}
              onChange={(next) =>
                setSelection((prev) => ({ ...prev, [group.id]: next }))
              }
            />
          ))}

          <div className="mt-6">
            <Label htmlFor="notes">Aclaraciones</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ej. sin cebolla"
              className="mt-2"
              maxLength={200}
            />
          </div>
        </div>

        <div className="bg-background sticky bottom-0 flex items-center gap-3 border-t px-4 py-3">
          <div className="flex items-center gap-2">
            <Button
              size="icon-sm"
              variant="outline"
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              aria-label="Menos"
            >
              <Minus />
            </Button>
            <span className="w-6 text-center font-semibold">{quantity}</span>
            <Button
              size="icon-sm"
              variant="outline"
              onClick={() => setQuantity((q) => Math.min(99, q + 1))}
              aria-label="Más"
            >
              <Plus />
            </Button>
          </div>
          <Button
            size="lg"
            className="flex-1"
            onClick={handleAdd}
            disabled={!product.is_available}
          >
            Agregar · {formatCurrency(lineTotal)}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function ModifierGroupSection({
  groupId,
  name,
  required,
  min,
  max,
  modifiers,
  value,
  onChange,
}: {
  groupId: string;
  name: string;
  required: boolean;
  min: number;
  max: number;
  modifiers: MenuModifier[];
  value: string[];
  onChange: (next: string[]) => void;
}) {
  const isSingle = max === 1 && min === 1;
  return (
    <section className="mt-6">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">{name}</h3>
        <span className="text-muted-foreground text-xs font-medium uppercase tracking-wider">
          {required ? "Obligatorio" : "Opcional"}
        </span>
      </div>

      {isSingle ? (
        <RadioGroup
          value={value[0] ?? ""}
          onValueChange={(v) => onChange([v])}
          className="mt-3 grid gap-2"
        >
          {modifiers.map((m) => (
            <Label
              key={m.id}
              htmlFor={`${groupId}-${m.id}`}
              className="bg-card flex cursor-pointer items-center justify-between rounded-lg border px-3 py-3"
            >
              <span className="flex items-center gap-3">
                <RadioGroupItem
                  value={m.id}
                  id={`${groupId}-${m.id}`}
                  disabled={!m.is_available}
                />
                <span className="text-sm font-medium">{m.name}</span>
              </span>
              <span className="text-muted-foreground text-sm">
                {m.price_delta_cents > 0
                  ? `+${formatCurrency(m.price_delta_cents)}`
                  : ""}
              </span>
            </Label>
          ))}
        </RadioGroup>
      ) : (
        <div className="mt-3 grid gap-2">
          {modifiers.map((m) => {
            const checked = value.includes(m.id);
            const atMax = !checked && value.length >= max;
            return (
              <label
                key={m.id}
                className="bg-card flex cursor-pointer items-center justify-between rounded-lg border px-3 py-3"
              >
                <span className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    className="size-4"
                    checked={checked}
                    disabled={!m.is_available || atMax}
                    onChange={(e) => {
                      if (e.target.checked) {
                        onChange([...value, m.id]);
                      } else {
                        onChange(value.filter((id) => id !== m.id));
                      }
                    }}
                  />
                  <span className="text-sm font-medium">{m.name}</span>
                </span>
                <span className="text-muted-foreground text-sm">
                  {m.price_delta_cents > 0
                    ? `+${formatCurrency(m.price_delta_cents)}`
                    : ""}
                </span>
              </label>
            );
          })}
        </div>
      )}
    </section>
  );
}
