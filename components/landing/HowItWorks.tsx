import { Shield, Upload, Link2, Download } from "lucide-react"

const steps = [
  { icon: Shield, title: "Encrypt Locally", description: "Your files are secured with AES-256 in-browser before anything leaves your device." },
  { icon: Upload, title: "Upload Securely", description: "Transfer to our zero-knowledge servers with automatic key management—no server access." },
  { icon: Link2, title: "Share Links", description: "Generate password-protected, expiring links with granular permissions for recipients." },
  { icon: Download, title: "Access Safely", description: "Recipients decrypt on their end. Full logs track usage without compromising privacy." }
]

export default function HowItWorks() {
  return (
    <section className="mx-auto mt-20 max-w-5xl px-6 py-16 bg-[#F6F6F6] rounded-2xl">
      <h2 className="mb-8 text-3xl font-bold text-center">How Secure Sharing Works</h2>
      <div className="grid gap-8 md:grid-cols-4">
        {steps.map((step, index) => {
          const Icon = step.icon
          return (
            <div key={index} className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <Icon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mb-2 font-semibold">{step.title}</h3>
              <p className="text-sm text-muted-foreground">{step.description}</p>
            </div>
          )
        })}
      </div>
    </section>
  )
}