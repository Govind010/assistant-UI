import { redirect } from "next/navigation"

export default function Home() {
  // Redirect the root page to the onboarding page
  redirect("/onboarding")
}
