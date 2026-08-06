import { redirect } from "next/navigation";

type SignUpParentPageProps = {
  searchParams: Promise<Record<string, string | undefined>>;
};

export default async function SignUpParentPage({
  searchParams,
}: SignUpParentPageProps) {
  const params = await searchParams;
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value) query.set(key, value);
  }
  query.set("intent", "parent");
  redirect(`/sign-up?${query.toString()}`);
}
