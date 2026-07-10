"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const accessToken = useAuthStore((s) => s.accessToken);
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  if (pathname === "/login") return null;

  function handleLogout() {
    logout();
    router.push("/login");
  }

  const linkClass = (href: string) =>
    `rounded-md px-3 py-1.5 text-sm font-medium transition ${
      pathname?.startsWith(href)
        ? "bg-brand text-white"
        : "text-slate-600 hover:bg-slate-100"
    }`;

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-6">
          <Link href="/tasks" className="text-lg font-bold text-slate-900">
            VAi
          </Link>
          {accessToken && (
            <nav className="flex items-center gap-1">
              <Link href="/tasks" className={linkClass("/tasks")}>
                Tasks
              </Link>
              <Link href="/annotate" className={linkClass("/annotate")}>
                Annotate
              </Link>
            </nav>
          )}
        </div>
        {accessToken && (
          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-500">{user?.email}</span>
            <button
              onClick={handleLogout}
              className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:bg-slate-100"
            >
              Log out
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
