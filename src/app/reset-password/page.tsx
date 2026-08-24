"use client";

import { useEffect, useState } from "react";
import { createSupabaseClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { BackButton } from "@/components/ui/back-button";

const supabase = createSupabaseClient();

type ResetStatus = "verifying" | "ready" | "success" | "error";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState<ResetStatus>("verifying");
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === "PASSWORD_RECOVERY" && session) {
          setStatus("ready");
        } else if (event === "SIGNED_IN" && session) {
          // User already has a valid session; still allow reset if they came from recovery link
          setStatus("ready");
        }
      },
    );

    // Also check if a session was already recovered from the URL hash
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setStatus("ready");
      } else {
        // If no recovery session after a short wait, show error
        const timer = setTimeout(() => {
          setStatus((current) => (current === "verifying" ? "error" : current));
        }, 2000);
        return () => clearTimeout(timer);
      }
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password.length < 6) {
      setError("密码至少需要6位字符");
      return;
    }
    if (password !== confirmPassword) {
      setError("两次输入的密码不一致");
      return;
    }

    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setError(error.message);
    } else {
      setStatus("success");
      setTimeout(() => {
        router.push("/login");
      }, 2000);
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center bg-[#fffaf4] px-4">
      <div className="absolute left-4 top-4">
        <BackButton />
      </div>
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-black text-[#2c3834]">设置新密码</h1>
          <p className="mt-2 text-sm font-bold text-[#8a6b5e]">
            请输入并确认您的新密码
          </p>
        </div>

        {status === "verifying" && (
          <div className="rounded-3xl border border-[#ffe0ce] bg-white p-6 text-center shadow-lg">
            <p className="text-sm font-bold text-[#6d5147]">正在验证重置链接…</p>
          </div>
        )}

        {status === "error" && (
          <div className="space-y-4 rounded-3xl border border-red-100 bg-white p-6 shadow-lg">
            <p className="text-sm font-bold text-red-500">
              重置链接已失效或不存在。请返回登录页重新发送重置邮件。
            </p>
            <Link
              href="/login"
              className="block w-full rounded-full bg-[#ff8c73] py-3 text-center text-sm font-black text-white shadow-md transition hover:bg-[#ff7a5c]"
            >
              返回登录
            </Link>
          </div>
        )}

        {status === "success" && (
          <div className="rounded-3xl border border-[#ffe0ce] bg-[#f4fbf7] p-6 text-center shadow-lg">
            <p className="text-sm font-bold text-[#5a7068]">
              密码重置成功！2秒后自动跳转登录页…
            </p>
          </div>
        )}

        {status === "ready" && (
          <form
            onSubmit={handleSubmit}
            className="space-y-4 rounded-3xl border border-[#ffe0ce] bg-white p-6 shadow-lg"
          >
            <div>
              <label className="mb-1 block text-xs font-black text-[#6d5147]">
                新密码
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-2xl border border-[#ffe0ce] bg-[#fffaf4] px-4 py-3 text-sm font-bold text-[#2c3834] outline-none placeholder:text-[#c4a99b] focus:border-[#ff8c73]"
                placeholder="至少6位字符"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-black text-[#6d5147]">
                确认新密码
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full rounded-2xl border border-[#ffe0ce] bg-[#fffaf4] px-4 py-3 text-sm font-bold text-[#2c3834] outline-none placeholder:text-[#c4a99b] focus:border-[#ff8c73]"
                placeholder="再次输入新密码"
              />
            </div>

            {error && (
              <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-bold text-red-500">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="w-full rounded-full bg-[#ff8c73] py-3 text-sm font-black text-white shadow-md transition hover:bg-[#ff7a5c]"
            >
              确认重置密码
            </button>
          </form>
        )}

        <Link
          href="/"
          className="inline-flex items-center justify-center gap-1 rounded-full border border-[#ffe0ce] bg-white py-3 text-sm font-bold text-[#76584e] transition hover:bg-[#fffaf4]"
        >
          匿名使用，返回地图
        </Link>
      </div>
    </main>
  );
}
