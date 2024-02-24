"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function SignInForm(props: { csrfToken: string | undefined }) {
  const router = useRouter();

  const action = async (formData: FormData) => {
    "use server";
    console.log("server action");
  };

  return (
    <form action={action}>
      <Input name="csrfToken" type="hidden" defaultValue={props.csrfToken} />
      <Label>
        Username
        <Input name="email" type="text" defaultValue={"email@email.com"} />
      </Label>
      <Label>
        Password
        <Input name="password" type="password" defaultValue={"p@sSw0rd"} />
      </Label>
      <Button type="submit">Sign in</Button>
    </form>
  );
}
