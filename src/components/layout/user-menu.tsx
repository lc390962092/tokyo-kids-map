"use client";

import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import {
  User,
  LogIn,
  LogOut,
  Shield,
  UsersRound,
  Plus,
} from "lucide-react";
import type { User as SupabaseUser } from "@supabase/supabase-js";

type UserMenuProps = {
  user: SupabaseUser | null;
  role: string | null;
  onLogout: () => void;
  showPlaydates?: boolean;
  onTogglePlaydates?: () => void;
  playdateCount?: number;
  onCreatePlaydate?: () => void;
};

export function UserMenu({
  user,
  role,
  onLogout,
  showPlaydates,
  onTogglePlaydates,
  playdateCount,
  onCreatePlaydate,
}: UserMenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handle = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") setOpen(false);
  };

  const displayName = user?.email?.split("@")[0] ?? user?.id?.slice(0, 8);

  return (
    <div ref={ref} className="relative" onKeyDown={handleKeyDown}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`flex h-10 w-10 items-center justify-center rounded-full border shadow-md backdrop-blur transition md:h-11 md:w-11 ${
          open
            ? "border-brand-accent bg-brand-accent text-white"
            : "border-brand-200 bg-white text-brand-600 hover:bg-brand-50"
        }`}
        aria-label={user ? "用户菜单" : "登录"}
        aria-expanded={open}
      >
        <User className="h-5 w-5" />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-52 overflow-hidden rounded-2xl border border-brand-200 bg-white p-2 shadow-xl">
          {user && (
            <div className="mb-1 border-b border-brand-100 px-3 py-2">
              <p className="text-xs font-black text-brand-800 truncate">
                {displayName}
              </p>
              <p className="text-[10px] font-medium text-brand-500 truncate">
                {user.email}
              </p>
            </div>
          )}

          <div className="space-y-0.5">
            {onTogglePlaydates && (
              <MenuItem onClick={() => { onTogglePlaydates(); setOpen(false); }}>
                <UsersRound
                  className={`h-4 w-4 ${showPlaydates ? "text-brand-accent" : "text-brand-400"}`}
                />
                <span className="flex-1 text-left">
                  {showPlaydates ? "隐藏约伴" : "显示约伴"}
                </span>
                {playdateCount ? (
                  <span className="ml-auto flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-black text-white">
                    {playdateCount}
                  </span>
                ) : null}
              </MenuItem>
            )}

            {onCreatePlaydate && user && (
              <MenuItem onClick={() => { onCreatePlaydate(); setOpen(false); }}>
                <Plus className="h-4 w-4 text-[#4a8c4a]" />
                发起约伴
              </MenuItem>
            )}

            {user ? (
              <>
                <MenuItem href="/member" onClick={() => setOpen(false)}>
                  <UsersRound className="h-4 w-4 text-brand-500" />
                  会员中心
                </MenuItem>
                {role === "admin" && (
                  <MenuItem href="/admin" onClick={() => setOpen(false)}>
                    <Shield className="h-4 w-4 text-brand-accent" />
                    管理后台
                  </MenuItem>
                )}
                <MenuItem onClick={() => { onLogout(); setOpen(false); }}>
                  <LogOut className="h-4 w-4 text-brand-500" />
                  退出登录
                </MenuItem>
              </>
            ) : (
              <MenuItem href="/login" onClick={() => setOpen(false)}>
                <LogIn className="h-4 w-4 text-brand-500" />
                登录
              </MenuItem>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function MenuItem({
  children,
  href,
  onClick,
}: {
  children: React.ReactNode;
  href?: string;
  onClick?: () => void;
}) {
  const className =
    "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-bold text-brand-700 transition hover:bg-brand-50";

  if (href) {
    return (
      <Link href={href} className={className} onClick={onClick}>
        {children}
      </Link>
    );
  }

  return (
    <button type="button" className={className} onClick={onClick}>
      {children}
    </button>
  );
}
