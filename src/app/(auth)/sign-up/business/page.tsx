import { redirect } from "next/navigation";

type SignUpBusinessPageProps = {
  searchParams: Promise<Record<string, string | undefined>>;
};

export default async function SignUpBusinessPage({
  searchParams,
}: SignUpBusinessPageProps) {
  const params = await searchParams;
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value) query.set(key, value);
  }
  query.set("intent", "program");
  redirect(`/sign-up?${query.toString()}`);
}
