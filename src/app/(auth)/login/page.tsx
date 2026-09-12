"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { toast } from "sonner";
import {
  AlertTriangle,
  ArrowRight,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  ShieldCheck,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { useAuth } from "@/features/auth/AuthProvider";
import { getApiErrorMessage } from "@/lib/api-client";

const loginSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginLoading />}>
      <LoginForm />
    </Suspense>
  );
}

function LoginLoading() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600" />
    </main>
  );
}

function LoginForm() {
  const { login } = useAuth();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const searchParams = useSearchParams();
  const deactivated = searchParams.get("reason") === "inactive";

  useEffect(() => {
    document.title = "Login — IRIS CRM";
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(values: LoginFormValues) {
    setIsSubmitting(true);

    try {
      await login(values);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-50">
      {/* =====================================================
          BACKGROUND DECORATION
      ===================================================== */}

      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {/* Top blue glow */}
        <div
          className="
            absolute
            -left-32
            -top-40
            h-[420px]
            w-[420px]
            rounded-full
            bg-blue-200/40
            blur-3xl
          "
        />

        {/* Bottom purple glow */}
        <div
          className="
            absolute
            -bottom-48
            -right-32
            h-[420px]
            w-[420px]
            rounded-full
            bg-indigo-200/30
            blur-3xl
          "
        />

        {/* Decorative circles */}
        <div
          className="
            absolute
            right-[12%]
            top-[15%]
            h-24
            w-24
            rounded-full
            border
            border-blue-200/50
          "
        />

        <div
          className="
            absolute
            left-[12%]
            bottom-[16%]
            h-14
            w-14
            rounded-full
            border
            border-indigo-200/50
          "
        />

        {/* Subtle grid */}
        <div
          className="
            absolute
            inset-0
            opacity-[0.35]
            [background-image:linear-gradient(to_right,#cbd5e1_1px,transparent_1px),linear-gradient(to_bottom,#cbd5e1_1px,transparent_1px)]
            [background-size:48px_48px]
            [mask-image:linear-gradient(to_bottom,black,transparent_75%)]
          "
        />
      </div>

      {/* =====================================================
          MAIN
      ===================================================== */}

      <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-10">
        <div className="w-full max-w-[430px]">
          {/* =================================================
              BRAND
          ================================================= */}

          <div className="mb-7 text-center">
            <div className="mb-4 flex justify-center">
              <div
                className="
                  relative
                  flex
                  size-14
                  items-center
                  justify-center
                  overflow-hidden
                  rounded-2xl
                  bg-gradient-to-br
                  from-blue-600
                  to-indigo-600
                  text-xl
                  font-bold
                  text-white
                  shadow-lg
                  shadow-blue-600/20
                "
              >
                <span className="relative z-10">I</span>

                <div
                  className="
                    absolute
                    -right-3
                    -top-3
                    size-10
                    rounded-full
                    bg-white/20
                    blur-md
                  "
                />
              </div>
            </div>

            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              IRIS CRM
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Sales Management Platform
            </p>
          </div>

          {/* =================================================
              LOGIN CARD
          ================================================= */}

          <Card
            className="
              relative
              overflow-hidden
              border-slate-200/80
              bg-white/95
              shadow-xl
              shadow-slate-900/10
              backdrop-blur-xl
            "
          >
            {/* Top accent */}
            <div
              className="
                absolute
                left-0
                right-0
                top-0
                h-1
                bg-gradient-to-r
                from-blue-600
                via-blue-500
                to-indigo-600
              "
            />

            <CardHeader className="px-7 pb-4 pt-8">
              {/* Secure badge */}
              <div
                className="
                  mb-4
                  inline-flex
                  w-fit
                  items-center
                  gap-1.5
                  rounded-full
                  border
                  border-blue-100
                  bg-blue-50
                  px-2.5
                  py-1
                  text-[10px]
                  font-semibold
                  uppercase
                  tracking-wider
                  text-blue-600
                "
              >
                <ShieldCheck className="size-3.5" />
                Secure Login
              </div>

              <CardTitle className="text-2xl font-semibold tracking-tight text-slate-900">
                Welcome back
              </CardTitle>

              <CardDescription className="mt-1.5 text-sm leading-6 text-slate-500">
                Sign in to your IRIS CRM account to
                <br className="hidden sm:block" />
                continue working.
              </CardDescription>
            </CardHeader>

            <CardContent className="px-7 pb-8">
              {/* =================================================
                  DEACTIVATED
              ================================================= */}

              {deactivated ? (
                <div
                  className="
                    mb-5
                    flex
                    items-start
                    gap-3
                    rounded-xl
                    border
                    border-red-200
                    bg-red-50
                    px-3.5
                    py-3
                    text-sm
                    text-red-700
                  "
                >
                  <AlertTriangle className="mt-0.5 size-4 shrink-0" />

                  <div>
                    <p className="font-medium">Account deactivated</p>

                    <p className="mt-0.5 text-xs leading-5 text-red-600/80">
                      Please contact your administrator.
                    </p>
                  </div>
                </div>
              ) : null}

              {/* =================================================
                  FORM
              ================================================= */}

              <form
                onSubmit={handleSubmit(onSubmit)}
                className="space-y-5"
              >
                {/* Email */}
                <div className="space-y-2">
                  <Label
                    htmlFor="email"
                    className="text-xs font-medium text-slate-700"
                  >
                    Email address
                  </Label>

                  <div className="group relative">
                    <Mail
                      className="
                        absolute
                        left-3.5
                        top-1/2
                        size-4
                        -translate-y-1/2
                        text-slate-400
                        transition-colors
                        group-focus-within:text-blue-600
                      "
                    />

                    <Input
                      id="email"
                      type="email"
                      autoComplete="email"
                      placeholder="you@iris.local"
                      {...register("email")}
                      className="
                        h-11
                        rounded-lg
                        border-slate-200
                        bg-slate-50/60
                        pl-10
                        text-sm
                        shadow-none
                        transition-all

                        placeholder:text-slate-400

                        hover:border-slate-300
                        hover:bg-white

                        focus-visible:border-blue-600
                        focus-visible:bg-white
                        focus-visible:ring-4
                        focus-visible:ring-blue-600/10
                      "
                    />
                  </div>

                  {errors.email ? (
                    <p className="text-xs font-medium text-red-600">
                      {errors.email.message}
                    </p>
                  ) : null}
                </div>

                {/* Password */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label
                      htmlFor="password"
                      className="text-xs font-medium text-slate-700"
                    >
                      Password
                    </Label>

                    <button
                      type="button"
                      className="
                        text-xs
                        font-medium
                        text-blue-600
                        transition-colors
                        hover:text-blue-700
                      "
                      onClick={() =>
                        toast.info(
                          "Please contact your administrator to reset your password."
                        )
                      }
                    >
                      Forgot password?
                    </button>
                  </div>

                  <div className="group relative">
                    <LockKeyhole
                      className="
                        absolute
                        left-3.5
                        top-1/2
                        size-4
                        -translate-y-1/2
                        text-slate-400
                        transition-colors
                        group-focus-within:text-blue-600
                      "
                    />

                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      placeholder="Enter your password"
                      {...register("password")}
                      className="
                        h-11
                        rounded-lg
                        border-slate-200
                        bg-slate-50/60
                        pl-10
                        pr-11
                        text-sm
                        shadow-none
                        transition-all

                        placeholder:text-slate-400

                        hover:border-slate-300
                        hover:bg-white

                        focus-visible:border-blue-600
                        focus-visible:bg-white
                        focus-visible:ring-4
                        focus-visible:ring-blue-600/10
                      "
                    />

                    <button
                      type="button"
                      aria-label={
                        showPassword
                          ? "Hide password"
                          : "Show password"
                      }
                      onClick={() =>
                        setShowPassword((value) => !value)
                      }
                      className="
                        absolute
                        right-0
                        top-0
                        flex
                        h-11
                        w-11
                        items-center
                        justify-center
                        text-slate-400
                        transition-colors
                        hover:text-slate-600
                        focus-visible:text-blue-600
                        focus-visible:outline-none
                      "
                    >
                      {showPassword ? (
                        <EyeOff className="size-4" />
                      ) : (
                        <Eye className="size-4" />
                      )}
                    </button>
                  </div>

                  {errors.password ? (
                    <p className="text-xs font-medium text-red-600">
                      {errors.password.message}
                    </p>
                  ) : null}
                </div>

                {/* Remember me */}
                <div className="flex items-center justify-between">
                  <label className="flex cursor-pointer items-center gap-2">
                    <input
                      type="checkbox"
                      defaultChecked
                      className="
                        size-3.5
                        rounded
                        border-slate-300
                        text-blue-600
                        accent-blue-600
                        focus:ring-blue-500
                      "
                    />

                    <span className="text-xs text-slate-500">
                      Keep me signed in
                    </span>
                  </label>

                  <div className="flex items-center gap-1.5 text-xs text-emerald-600">
                    <ShieldCheck className="size-3.5" />
                    Secure
                  </div>
                </div>

                {/* Submit */}
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="
                    h-11
                    w-full
                    rounded-lg
                    bg-blue-600
                    text-sm
                    font-medium
                    shadow-md
                    shadow-blue-600/15
                    transition-all

                    hover:bg-blue-700
                    hover:shadow-lg
                    hover:shadow-blue-600/20

                    focus-visible:ring-4
                    focus-visible:ring-blue-600/20
                  "
                >
                  {isSubmitting ? (
                    <>
                      <span
                        className="
                          mr-2
                          size-4
                          animate-spin
                          rounded-full
                          border-2
                          border-white/30
                          border-t-white
                        "
                      />

                      Signing in...
                    </>
                  ) : (
                    <>
                      Sign in
                      <ArrowRight className="ml-1 size-4" />
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>


          <div className="mt-6 text-center">
            <div className="flex items-center justify-center gap-2 text-[11px] text-slate-400">
              <ShieldCheck className="size-3.5" />
              Secure enterprise authentication
            </div>

            <p className="mt-2 text-[10px] text-slate-400/80">
              © {new Date().getFullYear()} IRIS CRM. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}