"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Eye, EyeOff, LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { AuthField } from "@/components/auth/auth-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getAuthErrorMessage, getValidationFieldError } from "@/lib/features/auth/form-errors";
import { registerUserMutationOptions } from "@/lib/features/auth/mutations";
import {
  registerFormSchema,
  type RegisterFormValues,
} from "@/lib/features/auth/schemas";

const registerFields = ["name", "email", "phone", "password"] as const;

export function RegisterForm() {
  const router = useRouter();
  const [passwordVisible, setPasswordVisible] = useState(false);
  const mutation = useMutation(registerUserMutationOptions);
  const {
    clearErrors,
    handleSubmit,
    register,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerFormSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      password: "",
    },
  });

  async function onSubmit(values: RegisterFormValues) {
    if (mutation.isPending) {
      return;
    }

    clearErrors("root.server");

    try {
      await mutation.mutateAsync({
        ...values,
        phone: values.phone || undefined,
      });
      toast.success("Your account is ready", {
        description: "Log in to continue to Tesla Bullet.",
      });
      router.replace("/login");
    } catch (error) {
      const validationError = getValidationFieldError(error, registerFields);

      if (validationError) {
        setError(validationError.field as keyof RegisterFormValues, {
          type: "server",
          message: validationError.message,
        });
        return;
      }

      setError("root.server", {
        type: "server",
        message: getAuthErrorMessage(
          error,
          "We couldn’t create your account. Please try again.",
        ),
      });
    }
  }

  const isPending = mutation.isPending || isSubmitting;

  return (
    <form className="space-y-5" noValidate onSubmit={handleSubmit(onSubmit)}>
      <AuthField error={errors.name?.message} id="name" label="Full name">
        <Input
          autoComplete="name"
          aria-describedby={errors.name ? "name-error" : undefined}
          aria-invalid={Boolean(errors.name)}
          id="name"
          maxLength={100}
          placeholder="Your name"
          {...register("name")}
        />
      </AuthField>

      <AuthField error={errors.email?.message} id="email" label="Email">
        <Input
          autoComplete="email"
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

      <AuthField
        error={errors.phone?.message}
        id="phone"
        label="Phone number"
        optional
      >
        <Input
          autoComplete="tel"
          aria-describedby={errors.phone ? "phone-error" : undefined}
          aria-invalid={Boolean(errors.phone)}
          id="phone"
          maxLength={20}
          placeholder="Your phone number"
          type="tel"
          {...register("phone")}
        />
      </AuthField>

      <AuthField
        error={errors.password?.message}
        id="register-password"
        label="Password"
      >
        <div className="relative">
          <Input
            autoComplete="new-password"
            aria-describedby={
              errors.password ? "register-password-error" : undefined
            }
            aria-invalid={Boolean(errors.password)}
            className="pr-12"
            id="register-password"
            maxLength={255}
            placeholder="At least 6 characters"
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
            Creating account…
          </>
        ) : (
          "Create account"
        )}
      </Button>
      <p className="text-center text-xs leading-5 text-muted-foreground">
        Your account starts as a passenger. You can apply to drive later.
      </p>
    </form>
  );
}
