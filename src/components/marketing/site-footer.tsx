import Link from "next/link";
import { AnchorLogo } from "@/components/brand/anchor-logo";
import { marketingContainer } from "@/lib/marketing-layout";

type SiteFooterProps = {
  labels: {
    footerTagline: string;
    footerProduct: string;
    footerTrust: string;
    footerCompany: string;
    footerPrograms: string;
    footerParents: string;
    footerSignIn: string;
    footerPrivacy: string;
    footerTerms: string;
    footerContact: string;
    footerSupport: string;
    footerRights: string;
    appName: string;
  };
};

export function SiteFooter({ labels }: SiteFooterProps) {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border/50 bg-secondary/30">
      <div className={`${marketingContainer} py-16 md:py-24`}>
        <div className="grid gap-12 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div className="space-y-4">
            <Link
              href="/"
              className="inline-flex rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <AnchorLogo />
            </Link>
            <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
              {labels.footerTagline}
            </p>
          </div>

          <div>
            <p className="mb-4 text-xs font-medium uppercase tracking-[0.18em] text-foreground/70">
              {labels.footerProduct}
            </p>
            <ul className="space-y-3 text-sm">
              <li>
                <Link
                  href="/for-programs"
                  className="text-muted-foreground transition-colors duration-300 ease-premium hover:text-foreground"
                >
                  {labels.footerPrograms}
                </Link>
              </li>
              <li>
                <Link
                  href="/for-parents"
                  className="text-muted-foreground transition-colors duration-300 ease-premium hover:text-foreground"
                >
                  {labels.footerParents}
                </Link>
              </li>
              <li>
                <Link
                  href="/login"
                  className="text-muted-foreground transition-colors duration-300 ease-premium hover:text-foreground"
                >
                  {labels.footerSignIn}
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <p className="mb-4 text-xs font-medium uppercase tracking-[0.18em] text-foreground/70">
              {labels.footerTrust}
            </p>
            <ul className="space-y-3 text-sm">
              <li>
                <Link
                  href="/support"
                  className="text-muted-foreground transition-colors duration-300 ease-premium hover:text-foreground"
                >
                  {labels.footerSupport}
                </Link>
              </li>
              <li>
                <Link
                  href="/privacy"
                  className="text-muted-foreground transition-colors duration-300 ease-premium hover:text-foreground"
                >
                  {labels.footerPrivacy}
                </Link>
              </li>
              <li>
                <Link
                  href="/terms"
                  className="text-muted-foreground transition-colors duration-300 ease-premium hover:text-foreground"
                >
                  {labels.footerTerms}
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <p className="mb-4 text-xs font-medium uppercase tracking-[0.18em] text-foreground/70">
              {labels.footerCompany}
            </p>
            <ul className="space-y-3 text-sm">
              <li>
                <a
                  href="mailto:hello@anchor.care"
                  className="text-muted-foreground transition-colors duration-300 ease-premium hover:text-foreground"
                >
                  {labels.footerContact}
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-14 flex flex-col gap-3 border-t border-border/40 pt-8 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {year} {labels.appName}. {labels.footerRights}
          </p>
        </div>
      </div>
    </footer>
  );
}
