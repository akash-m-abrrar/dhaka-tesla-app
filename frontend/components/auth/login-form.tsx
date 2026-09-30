"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Eye, EyeOff, LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { AuthField } from "@/components/auth/auth-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAppDispatch } from "@/lib/hooks";
import { getAuthErrorMessage, getValidationFieldError } from "@/lib/features/auth/form-errors";
import { loginUserMutationOptions } from "@/lib/features/auth/mutations";
import { startAuthenticatedSession } from "@/lib/features/auth/session";
import { loginFormSchema, type LoginFormValues } from "@/lib/features/auth/schemas";

const loginFields = ["email", "password"] as const;

export function LoginForm() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();
  const [passwordVisible, setPasswordVisible] = useState(false);
  const mutation = useMutation(loginUserMutationOptions);
  const {
    clearErrors,
    handleSubmit,
    register,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
  });

  async function onSubmit(values: LoginFormValues) {
    if (mutation.isPending) {
      return;
    }

    clearErrors("root.server");

    try {
      const result = await mutation.mutateAsync(values);
      startAuthenticatedSession(dispatch, queryClient, {
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
      });
      toast.success("You’re signed in", {
        description: "Welcome back to Tesla Bullet.",
      });
      router.replace("/dashboard");
    } catch (error) {
      const validationError = getValidationFieldError(error, loginFields);

      if (validationError) {
        setError(validationError.field as keyof LoginFormValues, {
          type: "server",
          message: validationError.message,
        });
        return;
      }

      setError("root.server", {
        type: "server",
        message: getAuthErrorMessage(
          error,
          "We couldn’t sign you in. Check your details and try again.",
        ),
      });
    }
  }

  const isPending = mutation.isPending || isSubmitting;

  return (
    <form
      autoComplete="off"
      className="space-y-5"
      noValidate
      onSubmit={handleSubmit(onSubmit)}
    >
      <AuthField error={errors.email?.message} id="email" label="Email">
        <Input
          autoComplete="off"
          aria-describedby={errors.email ? "email-error" : undefined}
          aria-invalid={Boolean(errors.email)}
          id="email"
          inputMode="email"
          maxLength={100}
          placeholder="you@example.com"
          type="email"
          {...register("email")}
        />
      </AuthField>

      <AuthField error={errors.password?.message} id="login-password" label="Password">
        <div className="relative">
          <Input
            autoComplete="off"
            aria-describedby={
              errors.password ? "login-password-error" : undefined
            }
            aria-invalid={Boolean(errors.password)}
            className="pr-12"
            id="login-password"
            maxLength={255}
            placeholder="Your password"
            type={passwordVisible ? "text" : "password"}
            {...register("password")}
          />
          <button
            aria-label={passwordVisible ? "Hide password" : "Show password"}
            aria-pressed={passwordVisible}
            className="absolute inset-y-0 right-2 grid size-10 place-items-center self-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            onClick={() => setPasswordVisible((visible) => !visible)}
            type="button"
          >
            {passwordVisible ? (
              <EyeOff aria-hidden="true" className="size-4" />
            ) : (
              <Eye aria-hidden="true" className="size-4" />
            )}
          </button>
        </div>
      </AuthField>

      {errors.root?.server?.message && (
        <p
          className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
          role="alert"
        >
          {errors.root.server.message}
        </p>
      )}

      <Button
        className="h-12 w-full rounded-full text-sm"
        disabled={isPending}
        type="submit"
      >
        {isPending ? (
          <>
            <LoaderCircle aria-hidden="true" className="mr-2 size-4 animate-spin" />
            Signing in…
          </>
        ) : (
          "Log in"
        )}
      </Button>
    </form>
  );
}
