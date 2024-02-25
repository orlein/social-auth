import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function GET() {
  // Redirect or handle the response after deleting the cookie
  cookies().delete("session");
  revalidatePath("/");
  redirect("/");
}
