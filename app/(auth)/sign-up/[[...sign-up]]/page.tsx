"use client"
import React, { useState, useEffect } from "react"
import { useSignUp } from "@clerk/nextjs"
import type { OAuthStrategy } from "@clerk/types"
import Link from "next/link"

export default function Page() {
  const { signUp, isLoaded, setActive } = useSignUp()
  const [step, setStep] = useState<'form' | 'missing' | 'verify'>('form')
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [username, setUsername] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [phone, setPhone] = useState("")
  const [verificationCode, setVerificationCode] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [loadingProvider, setLoadingProvider] = useState<string | null>(null)
  const [missingFields, setMissingFields] = useState<string[]>([])

  // Dynamically determine required fields
  const [requiredFields, setRequiredFields] = useState<string[]>([])
  const [showUsername, setShowUsername] = useState(false)
  const [showPhone, setShowPhone] = useState(false)

  useEffect(() => {
    if (isLoaded && signUp) {
      const req = signUp.requiredFields || []
      setRequiredFields(req.map((f: any) => f.path))
      setShowUsername(req.some((f: any) => f.path === 'username'))
      setShowPhone(req.some((f: any) => f.path === 'phone_number'))
      console.log("Required fields from Clerk:", req)
    }
  }, [isLoaded, signUp])

  // Candidate strategies for OAuth
  const GITHUB_CANDIDATES = ["oauth_github", "oauth_github_oauth_app"]
  const GOOGLE_CANDIDATES = ["oauth_google", "oauth_google_oauth_app"]

  async function tryStrategies(candidates: string[], redirectUrl = "/sso-callback", redirectUrlComplete = "/"): Promise<void> {
    if (!isLoaded || !signUp) throw new Error("SignUp not loaded")
    let lastError: any = null
    for (const s of candidates) {
      try {
        await signUp.authenticateWithRedirect({
          strategy: s as OAuthStrategy,
          redirectUrl,
          redirectUrlComplete,
        })
        return
      } catch (err: any) {
        lastError = err
        console.warn(`Strategy ${s} failed:`, err?.message ?? err)
      }
    }
    throw lastError ?? new Error("No strategy succeeded")
  }

  const handleOAuthGithub = async (): Promise<void> => {
    setError(null)
    setLoadingProvider("github")
    try {
      await tryStrategies(GITHUB_CANDIDATES)
    } catch (err: any) {
      setError("GitHub sign-up failed. Check Clerk Dashboard > Social Connections.")
      setLoadingProvider(null)
    }
  }

  const handleOAuthGoogle = async (): Promise<void> => {
    setError(null)
    setLoadingProvider("google")
    try {
      await tryStrategies(GOOGLE_CANDIDATES)
    } catch (err: any) {
      setError("Google sign-up failed. Check Clerk Dashboard > Social Connections.")
      setLoadingProvider(null)
    }
  }

  // Progressive update for missing fields
  const updateMissingFields = async (): Promise<void> => {
    if (!signUp || step !== 'missing') return
    const updateData: any = {}
    if (missingFields.includes('username') && username) updateData.username = username
    if (missingFields.includes('phone_number') && phone) updateData.phoneNumber = phone
    // Add custom fields here if needed, e.g., unsafeMetadata: { terms: true }

    try {
      const updateResult = await signUp.update(updateData)
      console.log("Update result:", updateResult)
      if (updateResult.status === 'complete') {
        await setActive({ session: updateResult.createdSessionId })
        window.location.href = "/"
      } else if (updateResult.missingFields?.length) {
        setMissingFields(updateResult.missingFields)
        setError(`Still missing: ${updateResult.missingFields.join(', ')}`)
      } else {
        setStep('verify') // Move to verification if no missing
      }
    } catch (err: any) {
      setError(err?.errors?.[0]?.message ?? "Update failed")
    }
  }

  const handleSignUp = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    if (!isLoaded || !signUp) {
      setError("Auth system not ready")
      setLoading(false)
      return
    }

    try {
      const createData: any = {
        firstName,
        lastName,
        emailAddress: email,
        password,
      }
      if (showUsername) createData.username = username
      if (showPhone) createData.phoneNumber = phone

      const result = await signUp.create(createData)
      console.log("Create result:", result) // Debug full object

      switch (result.status) {
        case "complete":
          await setActive({ session: result.createdSessionId })
          window.location.href = "/"
          return
        case "missing_requirements":
          const missing = result.missingFields || []
          const unverified = result.unverifiedFields || []
          console.log("Missing:", missing, "Unverified:", unverified)
          setMissingFields(missing)
          if (missing.length > 0) {
            setStep('missing')
            setError(`Please complete: ${missing.join(', ')}`)
          } else if (unverified.length > 0) {
            setStep('verify')
            // Prep verification for unverified (e.g., email)
            if (unverified.includes('email_address')) {
              await signUp.prepareEmailAddressVerification({ strategy: "email_code" })
              setError("Check your email for verification code.")
            }
          }
          break
        case "needs_email_verification":
        case "needs_factor_one":
          await signUp.prepareEmailAddressVerification({ strategy: "email_code" })
          setStep('verify')
          setError("Check your email for a verification code.")
          break
        case "needs_second_factor":
          setStep('verify')
          setError("Enter the code sent to your email/phone.")
          break
        default:
          setError(`Status: ${result.status}. Check console.`)
      }
    } catch (err: any) {
      console.error("Sign-up error:", err)
      const code = err?.errors?.[0]?.code
      let msg = err?.errors?.[0]?.message ?? "Sign-up failed"
      if (code === 'form_identifier_not_allowed') msg = "Email already in use. Try logging in."
      else if (code === 'form_password_invalid') msg = "Password too weak. Use 8+ characters with mix."
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  const handleVerification = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    if (!isLoaded || !signUp) {
      setError("Auth system not ready")
      setLoading(false)
      return
    }

    try {
      const result = await signUp.attemptEmailAddressVerification({ code: verificationCode })
      console.log("Verification result:", result)
      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId })
        window.location.href = "/"
      } else {
        // Re-check for missing after verification
        if (result.missingFields?.length) {
          setMissingFields(result.missingFields)
          setStep('missing')
          setError(`After verification, still need: ${result.missingFields.join(', ')}`)
        } else {
          setError("Verification incomplete. Try resending code.")
        }
      }
    } catch (err: any) {
      console.error("Verification error:", err)
      setError(err?.errors?.[0]?.message ?? "Invalid code. Check email and try again.")
    } finally {
      setLoading(false)
    }
  }

  const resendCode = async (): Promise<void> => {
    if (!signUp) return
    try {
      await signUp.prepareEmailAddressVerification({ strategy: "email_code" })
      setError("Code resent. Check your email.")
    } catch (err: any) {
      setError("Failed to resend. Try again.")
    }
  }

  const renderForm = () => (
    <form onSubmit={handleSignUp} className="flex flex-col gap-3">
      <div className="flex flex-row gap-3">
        <input
          type="text"
          placeholder="First Name"
          className="px-4 py-2 border rounded-md focus:outline-none w-1/2"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          required
        />
        <input
          type="text"
          placeholder="Last Name"
          className="px-4 py-2 border rounded-md focus:outline-none w-1/2"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          required
        />
      </div>
      {showUsername && (
        <input
          type="text"
          placeholder="Username"
          className="px-4 py-2 border rounded-md focus:outline-none"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />
      )}
      <input
        type="email"
        placeholder="Email"
        className="px-4 py-2 border rounded-md focus:outline-none"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      {showPhone && (
        <input
          type="tel"
          placeholder="Phone Number"
          className="px-4 py-2 border rounded-md focus:outline-none"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          required
        />
      )}
      <input
        type="password"
        placeholder="Password"
        className="px-4 py-2 border rounded-md focus:outline-none"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />
      {error && <div className="text-red-500 text-sm text-center">{error}</div>}
      <button type="submit" disabled={loading} className="mt-2 bg-[#0099ff88] text-white py-2 rounded-md disabled:opacity-50">
        {loading ? "Creating..." : "Sign up"}
      </button>
    </form>
  )

  const renderMissing = () => (
    <form onSubmit={(e) => { e.preventDefault(); updateMissingFields(); }} className="flex flex-col gap-3">
      {missingFields.includes('username') && !showUsername && (
        <input
          type="text"
          placeholder="Username (required)"
          className="px-4 py-2 border rounded-md focus:outline-none"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />
      )}
      {missingFields.includes('phone_number') && !showPhone && (
        <input
          type="tel"
          placeholder="Phone Number (required)"
          className="px-4 py-2 border rounded-md focus:outline-none"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          required
        />
      )}
      {error && <div className="text-red-500 text-sm text-center">{error}</div>}
      <button type="submit" disabled={loading} className="mt-2 bg-[#0099ff88] text-white py-2 rounded-md disabled:opacity-50">
        {loading ? "Updating..." : "Continue"}
      </button>
    </form>
  )

  const renderVerify = () => (
    <form onSubmit={handleVerification} className="flex flex-col gap-3">
      <input
        type="text"
        placeholder="Enter 6-digit code from email"
        className="px-4 py-2 border rounded-md focus:outline-none"
        value={verificationCode}
        onChange={(e) => setVerificationCode(e.target.value)}
        required
        maxLength={6}
      />
      {error && <div className="text-red-500 text-sm text-center">{error}</div>}
      <button type="button" onClick={resendCode} className="text-sm text-[#0099ff88] text-center underline">
        Resend code
      </button>
      <button type="submit" disabled={loading} className="mt-2 bg-[#0099ff88] text-white py-2 rounded-md disabled:opacity-50">
        {loading ? "Verifying..." : "Verify"}
      </button>
    </form>
  )

  return (
    <div className="min-h-screen flex flex-row w-full">
      <div className="w-1/2 flex justify-center items-center p-8">
        <div className="w-full max-w-md bg-white rounded-2xl p-8">
          <h1 className="text-2xl font-sans font-light text-center mb-6">
            {step === 'form' ? 'Create your account' : step === 'missing' ? 'Complete profile' : 'Verify email'}
          </h1>

          <div id="clerk-captcha" className="mb-4"></div>

          {step === 'form' && renderForm()}
          {step === 'missing' && renderMissing()}
          {step === 'verify' && renderVerify()}

          {step === 'form' && (
            <div className="flex flex-col gap-3 mt-6">
              <button
                onClick={handleOAuthGoogle}
                className="flex items-center justify-center gap-3 rounded-lg py-2 px-3 bg-gray-200"
                disabled={loadingProvider !== null || loading}
              >
                <img alt="Google" src="/googlelogo.png" className="w-5 h-5" />
                {loadingProvider === "google" ? "Opening..." : "Continue with Google"}
              </button>
              <button
                onClick={handleOAuthGithub}
                className="flex items-center justify-center gap-3 rounded-lg py-2 px-3 bg-gray-200"
                disabled={loadingProvider !== null || loading}
              >
                <img alt="GitHub" src="/githublogo.png" className="w-5 h-5" />
                {loadingProvider === "github" ? "Opening..." : "Continue with GitHub"}
              </button>
            </div>
          )}

          <p className="text-center text-sm text-gray-500 mt-6">
            Already have an account? <Link href="/sign-in" className="text-[#0099ffc7]">Log in</Link>
          </p>
          <p className="text-center text-xs text-gray-400 mt-2">
            Protected by reCAPTCHA and Google Privacy Policy.
          </p>
        </div>
      </div>
      <div className="w-1/2 bg-cover bg-center" style={{ backgroundImage: "url(/bg-100.jpeg)" }}>
        <div className="h-full flex items-center justify-center">
          <p className="text-black text-center p-8 bg-none bg-opacity-50 font-sans font-light text-2xl">
            Your journey in website building, <br />maintenance, and assurance starts here.
          </p>
        </div>
      </div>
    </div>
  )
}
// import { SignUp } from '@clerk/nextjs'

// export default function Page() {
//   return (
//       <div className='flex items-center justify-center h-screen'>
//         <SignUp />
//       </div>
//   )
// }