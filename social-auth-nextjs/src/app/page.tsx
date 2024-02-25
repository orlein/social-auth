import { cookies } from "next/headers";

async function getSessionData() {
  const session = cookies().get("session")?.value;
  return session ? JSON.parse(session) : null;
}

export default async function Home() {
  const session = await getSessionData();

  if (!session) {
    return (
      <main className="flex min-h-screen flex-col items-center p-24">
        <h1 className="text-4xl font-bold">Social Auth</h1>
        <p className="mt-4">You are not signed in</p>
      </main>
    );
  }

  const getSelf = async () => {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/auth/account/self`,
      {
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
        },
      }
    );
    const data = await res.json();
    return data;
  };

  const self = await getSelf();

  return (
    <main className="flex min-h-screen flex-col items-center p-24">
      Main
      <pre className="p-4 rounded-lg overflow-auto w-full max-w-xl mt-4">
        {JSON.stringify(self, null, 2)}
      </pre>
    </main>
  );
}
