"use client"
import React from "react"
import { AuthenticateWithRedirectCallback } from "@clerk/nextjs"

export default function SsoCallbackPage() {
  // The prebuilt component completes the Clerk redirect flow for you.
  // It handles exchanging the temporary info returned by the provider and
  // finalizing the session. If you don't want the prebuilt component,
  // you can call Clerk.handleRedirectCallback() manually.
  return (
    <div className="min-h-screen flex items-center justify-center">
      <AuthenticateWithRedirectCallback />
    </div>
  )
}
