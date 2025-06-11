"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import AssistantUI from "../components/assistantUI"

export default function AssistantPage() {
  // const router = useRouter()

  // useEffect(() => {
  //   // Check if user has completed onboarding
  //   const userName = localStorage.getItem("userName")
  //   const userLanguage = localStorage.getItem("userLanguage")

  //   if (!userName || !userLanguage) {
  //     // Redirect back to onboarding if information is missing
  //     router.push("/onboarding")
  //   }
  // }, [router])

  return <AssistantUI />
}
