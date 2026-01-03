"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Nav() {
  const pathname = usePathname();

  const linkClass = (path: string) =>
    `px-3 py-2 rounded-md text-sm ${
      pathname === path
        ? "bg-muted font-medium"
        : "hover:bg-muted/50"
    }`;

  return (
    <nav className="border-b">
      <div className="mx-auto max-w-5xl px-6 py-3 flex items-center gap-4">
        <Link href="/" className="font-semibold text-sm">
          Pickleball Manager
        </Link>

        <Link href="/players" className={linkClass("/players")}>
          Players
        </Link>

        <Link href="/sessions" className={linkClass("/sessions")}>
          Sessions
        </Link>
      </div>
    </nav>
  );
}
