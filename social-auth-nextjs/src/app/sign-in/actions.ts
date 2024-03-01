"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function signIn(formData: FormData) {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/auth/account/sign-in`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        plainEmail: formData.get("email"),
        plainPassword: formData.get("password"),
      }),
    }
  );

  const data = await res.json();

  cookies().set("session", JSON.stringify(data), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 7, // One week
    path: "/",
  });

  redirect("/");
  // Redirect or handle the response after setting the cookie
}

export async function signInWithGoogle() {
  redirect(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/auth/google`);
}

export async function signInWithNaver() {
  redirect(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/auth/naver`);
}

export async function signOut() {
  // Redirect or handle the response after deleting the cookie
  cookies().delete("session");
  revalidatePath("/");
}
