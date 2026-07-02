import { LogOut } from "lucide-react";
import { signOutAction } from "@/app/(auth)/actions";

export function SignOutButton() {
  return (
    <form action={signOutAction}>
      <button
        type="submit"
        className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-900"
      >
        <LogOut className="h-4 w-4" />
        Sign out
      </button>
    </form>
  );
}
