"use client";

import { useState } from "react";
import { createSupabaseClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { BackButton } from "@/components/ui/back-button";

const supabase = createSupabaseClient();

type ViewMode = "login" | "register" | "forgot";

function getRedirectUrl() {
  const base =
    typeof window !== "undefined"
      ? window.location.origin
      : process.env.NEXT_PUBLIC_SITE_URL;
  return `${base}/reset-password`;
}

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<ViewMode>("login");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setMessage("");

    if (mode === "register") {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) setError(error.message);
      else setMessage("注册成功！请查收验证邮件后登录。");
    } else if (mode === "login") {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) setError(error.message);
      else router.push("/");
    } else {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: getRedirectUrl(),
      });
      if (error) setError(error.message);
      else
        setMessage("重置链接已发送到邮箱，请查收后点击链接设置新密码。");
    }
  }

  const title =
    mode === "register" ? "注册会员" : mode === "forgot" ? "重置密码" : "会员登录";
  const subtitle =
    mode === "register"
      ? "注册后即可收藏和管理评论"
      : mode === "forgot"
        ? "输入注册邮箱，我们将发送重置链接"
        : "登录后可享受完整功能";

  return (
    <main className="relative flex min-h-screen items-center justify-center bg-[#fffaf4] px-4">
      <div className="absolute left-4 top-4">
        <BackButton />
      </div>
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-black text-[#2c3834]">{title}</h1>
          <p className="mt-2 text-sm font-bold text-[#8a6b5e]">{subtitle}</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-4 rounded-3xl border border-[#ffe0ce] bg-white p-6 shadow-lg"
        >
          <div>
            <label className="mb-1 block text-xs font-black text-[#6d5147]">
              邮箱
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-2xl border border-[#ffe0ce] bg-[#fffaf4] px-4 py-3 text-sm font-bold text-[#2c3834] outline-none placeholder:text-[#c4a99b] focus:border-[#ff8c73]"
              placeholder="your@email.com"
            />
          </div>

          {mode !== "forgot" && (
            <div>
              <label className="mb-1 block text-xs font-black text-[#6d5147]">
                密码
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
          )}

          {error && (
            <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-bold text-red-500">
              {error}
            </div>
          )}
          {message && (
            <div className="rounded-2xl bg-[#f4fbf7] px-4 py-3 text-sm font-bold text-[#5a7068]">
              {message}
            </div>
          )}

          <button
            type="submit"
            className="w-full rounded-full bg-[#ff8c73] py-3 text-sm font-black text-white shadow-md transition hover:bg-[#ff7a5c]"
          >
            {mode === "register" ? "注册" : mode === "forgot" ? "发送重置链接" : "登录"}
          </button>
        </form>

        <div className="flex flex-col gap-3 text-center">
          {mode === "forgot" ? (
            <button
              type="button"
              onClick={() => {
                setMode("login");
                setError("");
                setMessage("");
              }}
              className="text-sm font-bold text-[#ff8c73] transition hover:underline"
            >
              想起密码了？返回登录
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={() => {
                  setMode(mode === "login" ? "register" : "login");
                  setError("");
                  setMessage("");
                }}
                className="text-sm font-bold text-[#ff8c73] transition hover:underline"
              >
                {mode === "login" ? "没有账号？免费注册" : "已有账号？直接登录"}
              </button>
              {mode === "login" && (
                <button
                  type="button"
                  onClick={() => {
                    setMode("forgot");
                    setError("");
                    setMessage("");
                  }}
                  className="text-sm font-bold text-[#8a6b5e] transition hover:underline"
                >
                  忘记密码？
                </button>
              )}
            </>
          )}

          <Link
            href="/"
            className="inline-flex items-center justify-center gap-1 rounded-full border border-[#ffe0ce] bg-white py-3 text-sm font-bold text-[#76584e] transition hover:bg-[#fffaf4]"
          >
            匿名使用，返回地图
          </Link>
        </div>
      </div>
    </main>
  );
}
