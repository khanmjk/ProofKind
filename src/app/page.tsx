import { redirect } from "next/navigation";
import { getServerEnv } from "@/lib/env";

export default function Home() {
  redirect(`/p/${getServerEnv().PROOFKIND_PUBLIC_SLUG}`);
}

