"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogIn, LogOut, Shield, UsersRound } from "lucide-react";
import { useAuth } from "@/lib/supabase/auth-context";
import { createSupabaseClient } from "@/lib/supabase/client";

const supabase = createSupabaseClient();

export function TopNav() {
  const { user, role } = useAuth();
  const pathname = usePathname();
  const hideOnHome = pathname === "/";

  // 首页由地图内的 UserMenu 统一提供用户/管理入口，这里完全隐藏避免重复
  if (hideOnHome) return null;

  const mobileClass = pathname === "/admin" ? "hidden md:block" : "block";

  return (
    <div className={`fixed right-4 top-4 z-50 max-w-fit ${mobileClass}`}>
      {user ? (
        <div className="flex items-center gap-2 rounded-full bg-white/90 px-3 py-2 shadow backdrop-blur">
          {role === "admin" && (
            <Link
              href="/admin"
              className="flex items-center gap-1 rounded-full bg-[#ff8c73] px-3 py-1 text-xs font-bold text-white transition hover:bg-[#ff7a5c]"
            >
              <Shield className="h-3 w-3" />
              管理
            </Link>
          )}
          <Link
            href="/member"
            className="flex items-center gap-1 rounded-full bg-[#fff0e8] px-3 py-1 text-xs font-bold text-[#76584e] transition hover:bg-[#ffe0ce]"
            title="会员中心"
          >
            <UsersRound className="h-3 w-3" />
            会员
          </Link>
          <span className="hidden max-w-[120px] truncate text-xs font-bold text-[#2c3834] sm:inline">
            {user.email?.split("@")[0]}
          </span>
          <button
            onClick={() => supabase.auth.signOut()}
            className="flex items-center gap-1 text-xs font-bold text-[#76584e] transition hover:text-[#ff8c73]"
            title="退出"
          >
            <LogOut className="h-3 w-3" />
          </button>
        </div>
      ) : (
        <Link
          href="/login"
          className="flex items-center gap-1 rounded-full bg-white/90 px-3 py-2 text-xs font-bold text-[#76584e] shadow backdrop-blur transition hover:bg-[#fff0e8]"
        >
          <LogIn className="h-3 w-3" />
          登录
        </Link>
      )}
    </div>
  );
}
