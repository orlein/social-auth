import { signIn } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default async function SignInForm() {
  return (
    <form action={signIn}>
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