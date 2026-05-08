import Link from "next/link";
import type { ComponentPropsWithoutRef, ReactNode } from "react";

import { cn } from "@/lib/utils";

type Size = "sm" | "md" | "lg";
type Variant = "brand" | "dark" | "ghost" | "subtle";

const BASE =
  "group inline-flex items-center gap-2 rounded-full font-semibold tracking-tight transition-all outline-none disabled:pointer-events-none disabled:opacity-50 active:translate-y-px focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-white";

const SIZES: Record<Size, string> = {
  sm: "h-8 px-3 text-xs",
  md: "h-10 px-4 text-sm",
  lg: "h-11 px-5 text-sm",
};

const VARIANTS: Record<Variant, string> = {
  brand:
    "bg-[var(--brand)] text-[var(--brand-foreground)] shadow-[0_8px_20px_-12px_var(--brand)] hover:bg-[var(--brand-hover)] focus-visible:ring-[color-mix(in_srgb,var(--brand)_40%,transparent)]",
  dark: "bg-zinc-900 text-zinc-50 hover:bg-zinc-800 focus-visible:ring-zinc-400",
  ghost:
    "bg-transparent text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900 focus-visible:ring-zinc-200",
  subtle:
    "bg-zinc-100 text-zinc-700 hover:bg-zinc-200 focus-visible:ring-zinc-300",
};

type CommonProps = {
  size?: Size;
  variant?: Variant;
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
  className?: string;
};

type ButtonProps = CommonProps &
  ComponentPropsWithoutRef<"button"> & { href?: undefined };
type LinkProps = CommonProps &
  Omit<ComponentPropsWithoutRef<typeof Link>, "className"> & {
    href: string;
  };

function renderInner(
  children: ReactNode,
  leadingIcon?: ReactNode,
  trailingIcon?: ReactNode,
) {
  return (
    <>
      {leadingIcon ? (
        <span className="shrink-0 [&_svg]:size-3.5">{leadingIcon}</span>
      ) : null}
      <span>{children}</span>
      {trailingIcon ? (
        <span className="shrink-0 transition group-hover:translate-x-0.5 [&_svg]:size-3.5">
          {trailingIcon}
        </span>
      ) : null}
    </>
  );
}

export function BrandButton(props: ButtonProps | LinkProps) {
  // Extraemos las props custom del componente para que NO viajen al DOM via
  // {...rest}. React advertía con `leadingIcon`/`size`/`variant` como atributos
  // desconocidos del <a>/<button>.
  const {
    size = "md",
    variant = "brand",
    leadingIcon,
    trailingIcon,
    className,
    children,
    ...domProps
  } = props as CommonProps & {
    href?: string;
    children?: ReactNode;
  } & Record<string, unknown>;
  const cls = cn(BASE, SIZES[size], VARIANTS[variant], className);
  if ("href" in props && props.href) {
    const { href: _href, ...rest } = domProps;
    return (
      <Link
        href={(props as LinkProps).href}
        {...(rest as Omit<ComponentPropsWithoutRef<typeof Link>, "className" | "href">)}
        className={cls}
      >
        {renderInner(children, leadingIcon, trailingIcon)}
      </Link>
    );
  }
  return (
    <button
      {...(domProps as ComponentPropsWithoutRef<"button">)}
      className={cls}
    >
      {renderInner(children, leadingIcon, trailingIcon)}
    </button>
  );
}
