import Link from "next/link";

export default async function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center p-24">
      <Link href="/sign-in">Sign In</Link>
    </main>
  );
}
