"use client";

import { useState } from "react";
import {
  faviconUrlFromDomain,
  hostnameFromUrl,
  logoUrlFromDomain,
  guessDomainFromName,
} from "@/lib/brand-logo";

export function BrandLogo({
  name,
  domain,
  website,
  logoUrl,
  size = 28,
  className = "",
}: {
  name: string;
  domain?: string | null;
  website?: string | null;
  logoUrl?: string | null;
  size?: number;
  className?: string;
}) {
  const host =
    domain ||
    hostnameFromUrl(website) ||
    hostnameFromUrl(logoUrl || undefined) ||
    guessDomainFromName(name);

  const primary = logoUrl || logoUrlFromDomain(host, size * 2);
  const fallback = faviconUrlFromDomain(host, size * 2);
  const [errored, setErrored] = useState<string[]>([]);
  const src = [primary, fallback].find((s) => !errored.includes(s));

  if (!src) {
    return (
      <span
        className={`inline-flex shrink-0 items-center justify-center rounded-md border border-ink bg-accent-yellow text-[10px] font-semibold uppercase text-ink ${className}`}
        style={{ width: size, height: size }}
        title={name}
      >
        {name.slice(0, 2)}
      </span>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt=""
      width={size}
      height={size}
      className={`shrink-0 rounded-md border border-ink/15 bg-white object-contain ${className}`}
      style={{ width: size, height: size }}
      loading="lazy"
      referrerPolicy="no-referrer"
      onError={() => setErrored((e) => [...e, src])}
    />
  );
}
