import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type PageProps = {
  params: Promise<{ token: string }>;
};

export default async function SmsWebViewerPage({ params }: PageProps) {
  const { token } = await params;

  return (
    <div className="min-h-dvh bg-background px-4 py-8">
      <div className="mx-auto max-w-lg">
        <Card>
          <CardHeader>
            <CardTitle>Daily report</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            <p>
              SMS web viewer for parents without the app installed. Token:{" "}
              <span className="font-mono text-xs">{token.slice(0, 8)}…</span>
            </p>
            <p>Report content loads here after invite link validation.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
