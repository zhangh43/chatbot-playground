"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { login } from "@/app/login/actions";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import Link from "next/link";
import { useFormStatus } from "react-dom";

function SubmitButton() {
  const { pending } = useFormStatus();
  const t = useTranslations("common");

  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? t("loggingIn") : t("login")}
    </Button>
  );
}

export default function LoginPage() {
  const t = useTranslations("common");
  const searchParams = useSearchParams();
  const message = searchParams.get("message");

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-muted p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-xl">{t("welcomeBack")}</CardTitle>
              <CardDescription>{t("welcomeBackDesc")}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6">
                {message && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{message}</AlertDescription>
                  </Alert>
                )}
                <form action={login}>
                  <div className="grid gap-6">
                    <div className="grid gap-2">
                      <Label htmlFor="email">{t("email")}</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        placeholder="example@email.com"
                        required
                      />
                    </div>
                    <div className="grid gap-2">
                      <div className="flex items-center">
                        <Label htmlFor="password">{t("password")}</Label>
                        <Link
                          href="#"
                          className="ml-auto text-sm underline-offset-4 hover:underline"
                        >
                          {t("forgotPassword")}
                        </Link>
                      </div>
                      <Input
                        id="password"
                        name="password"
                        type="password"
                        placeholder="••••••••"
                        required
                      />
                    </div>
                    <SubmitButton />
                  </div>
                </form>
                <div className="text-center text-sm">
                  {t("noAccount")}{" "}
                  <Link href="/signup" className="underline underline-offset-4">
                    {t("signup")}
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
          <div className="text-balance text-center text-xs text-muted-foreground [&_a]:underline [&_a]:underline-offset-4 [&_a]:hover:text-primary">
            {t("agreeTerms", {
              terms: t("termsOfService"),
              privacy: t("privacyPolicy"),
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
