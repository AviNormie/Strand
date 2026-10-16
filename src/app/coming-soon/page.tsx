import type { Metadata } from "next";
import { ComingSoon } from "@/components/landing/ComingSoon";

export const metadata: Metadata = {
  title: "Coming soon — Strand",
  description: "Early access to Strand is on the way. We'll ping you when doors open.",
};

export default function ComingSoonPage() {
  return <ComingSoon />;
}
