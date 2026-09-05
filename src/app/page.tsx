import { redirect } from "next/navigation";

export default function Home() {
  redirect(`/d/${new Date().toISOString().slice(0, 10)}`);
}
