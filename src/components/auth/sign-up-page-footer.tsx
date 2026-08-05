import Link from "next/link";
import { getTranslations } from "next-intl/server";

type SignUpPageFooterProps = {
  intent: "parent" | "program";
};

export async function SignUpPageFooter({ intent }: SignUpPageFooterProps) {
  const t = await getTranslations("auth");
  const isProgram = intent === "program";

  return (
    <div className="mt-6 space-y-3 text-center text-sm text-muted-foreground">
      <p>
        {t("hasAccount")}{" "}
        <Link href="/login" className="font-medium text-primary hover:underline">
          {t("login")}
        </Link>
      </p>
      <p>
        {isProgram ? (
          <>
            {t("parentInsteadPrompt")}{" "}
            <Link
              href="/sign-up?intent=parent"
              className="font-medium text-primary hover:underline"
            >
              {t("parentSignupLink")}
            </Link>
          </>
        ) : (
          <>
            {t("programPrompt")}{" "}
            <Link
              href="/sign-up?intent=program"
              className="font-medium text-primary hover:underline"
            >
              {t("programSignupLink")}
            </Link>
          </>
        )}
      </p>
    </div>
  );
}
