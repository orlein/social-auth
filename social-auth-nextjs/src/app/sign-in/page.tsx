import SignInForm from "@/app/sign-in/sign-in-form";
import { getCsrfToken } from "next-auth/react";

export default async function SignInPage() {
  const csrfToken = await getCsrfToken();

  return <SignInForm csrfToken={csrfToken} />;
}
