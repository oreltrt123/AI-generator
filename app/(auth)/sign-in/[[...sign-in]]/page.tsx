"use client"
import React, { useState } from "react"
import { useSignIn } from "@clerk/nextjs"
import type { OAuthStrategy } from "@clerk/types" // types only
import Link from "next/link"

export default function Page() {
  const { signIn, isLoaded, setActive } = useSignIn()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loadingProvider, setLoadingProvider] = useState<string | null>(null)

  // Candidate strategy names to try for each provider.
  // These cover the common possibilities Clerk tenants use.
  const GITHUB_CANDIDATES = ["oauth_github", "oauth_github_oauth_app"]
  const GOOGLE_CANDIDATES = ["oauth_google", "oauth_google_oauth_app"]

  // Helper: try a list of candidate strategies until one succeeds
  async function tryStrategies(
    candidates: string[],
    redirectUrl = "/sso-callback",
    redirectUrlComplete = "/"
  ): Promise<void> {
    if (!isLoaded || !signIn) throw new Error("SignIn not loaded")
    let lastError: any = null

    for (const s of candidates) {
      try {
        // attempt the flow with the candidate
        await signIn.authenticateWithRedirect({
          strategy: s as OAuthStrategy,
          redirectUrl,
          redirectUrlComplete,
        })
        // if no exception thrown, Clerk initiated redirect successfully
        return // execution will not continue because browser will redirect
      } catch (err: any) {
        // Keep last error; try next candidate
        lastError = err
        // If it's a 422-like "strategy not allowed", just continue to next candidate
        // Other unexpected errors we also continue but collect.
        console.warn(`strategy ${s} failed:`, err?.message ?? err)
      }
    }

    // if we reach here, all candidates failed — throw the last error to caller
    throw lastError ?? new Error("No strategy succeeded")
  }

  // OAuth button handlers
  const handleOAuthGithub = async (): Promise<void> => {
    setError(null)
    setLoadingProvider("github")
    try {
      await tryStrategies(GITHUB_CANDIDATES)
    } catch (err: any) {
      console.error("All GitHub strategies failed:", err)
      setError(
        "GitHub sign-in failed. Make sure GitHub is enabled in your Clerk Dashboard and your OAuth redirect URIs are configured. (See console for details.)"
      )
      setLoadingProvider(null)
    }
  }

  const handleOAuthGoogle = async (): Promise<void> => {
    setError(null)
    setLoadingProvider("google")
    try {
      await tryStrategies(GOOGLE_CANDIDATES)
    } catch (err: any) {
      console.error("All Google strategies failed:", err)
      setError(
        "Google sign-in failed. Make sure Google is enabled in your Clerk Dashboard and your OAuth redirect URIs are configured. (See console for details.)"
      )
      setLoadingProvider(null)
    }
  }

  // Email + password sign-in (keeps your custom UI)
  const handleLogin = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    setError(null)
    if (!isLoaded || !signIn) {
      setError("Auth system not ready")
      return
    }
    try {
      // Create a signIn attempt using identifier/password
      const result = await signIn.create({
        identifier: email,
        password,
      })
      // If Clerk completes the sign-in synchronously:
      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId })
        window.location.href = "/"
        return
      }
      // Otherwise there may be more steps (e.g., multi-factor), show generic message
      setError("Sign-in needs more steps. Check console or Clerk Dashboard.")
    } catch (err: any) {
      console.error("Email sign-in error:", err)
      setError(err?.errors?.[0]?.message ?? err?.message ?? "Sign-in failed")
    }
  }

  return (
    <div className="min-h-screen flex flex-row w-full">
      <div className="w-1/2 flex justify-center items-center p-8">
        <div className="w-full max-w-md bg-white rounded-2xl p-8">
          <h1 className="text-2xl font-sans font-light text-center mb-6">Log in to your account</h1>

          {/* Form */}
          <form onSubmit={handleLogin} className="flex flex-col gap-3">
            <input
              type="text"
              placeholder="Email or Username"
              className="px-4 py-2 border rounded-md focus:outline-none"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <input
              type="password"
              placeholder="Password"
              className="px-4 py-2 border rounded-md focus:outline-none"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            {error && <div className="text-red-500 text-sm text-center">{error}</div>}
            <button className="mt-2 bg-[#0099ff88] text-white py-2 rounded-md ">Log in</button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-4">Forgot password?</p>

          {/* Social buttons */}
          <div className="flex flex-col gap-3 mt-6">
            <button
              onClick={handleOAuthGoogle}
              className="flex items-center justify-center gap-3 rounded-lg py-2 px-3 bg-gray-200"
              disabled={loadingProvider !== null}
            >
              <img alt="Google" src="/googlelogo.png" className="w-5 h-5" />
              {loadingProvider === "google" ? "Opening Google..." : "Continue with Google"}
            </button>
            <button
              onClick={handleOAuthGithub}
              className="flex items-center justify-center gap-3 rounded-lg py-2 px-3 bg-gray-200"
              disabled={loadingProvider !== null}
            >
              <img alt="GitHub" src="/githublogo.png" className="w-5 h-5" />
              {loadingProvider === "github" ? "Opening GitHub..." : "Continue with GitHub"}
            </button>
          </div>

          <p className="text-center text-sm text-gray-500 mt-6">New to Pentrix? <Link href={'/sign-up'} className="text-[#0099ffc7]">Sign up</Link></p>
          <p className="text-center text-xs text-gray-400 mt-2">
            This site is protected by reCAPTCHA Enterprise and the Google Privacy and Terms of Service apply.
          </p>
        </div>
      </div>
      <div className="w-1/2 bg-cover bg-center" style={{ backgroundImage: "url(/bg.png)" }}>
        <div className="h-full flex items-center justify-center">
          <p className="text-white text-center p-8 bg-[#070707] bg-opacity-50 font-sans font-light text-2xl">
            Your journey in website building, website maintenance and website assurance is here.
          </p>
        </div>
      </div>
    </div>
  )
}
// import { SignIn } from '@clerk/nextjs'

// export default function Page() {
//   return (
//     <div className='flex items-center justify-center h-screen'>
//       <SignIn />
//     </div>
//   )
// }