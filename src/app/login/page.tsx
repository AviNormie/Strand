import { redirect } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { getOptionalUser } from "@/lib/auth";
import { LoginButton } from "./LoginButton";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const user = await getOptionalUser();
  if (user) redirect("/analyze");

  const { error } = await searchParams;

  return (
    <div className="flex min-h-screen flex-col bg-paper pt-24 text-ink">
      <AppHeader user={null} tone="paper" />
      {error === "auth" ? (
        <p className="mx-auto mt-6 max-w-md rounded-2xl border-2 border-ink bg-red-100 px-4 py-2 text-center text-sm text-red-900">
          Sign-in failed. Please try again.
        </p>
      ) : null}
      <LoginButton />
    </div>
  );
}
