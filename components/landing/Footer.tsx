import Link from "next/link"

export default function Footer() {
  return (
    <footer className="mt-20 border-t bg-background px-6 py-8">
      <div className="container mx-auto flex flex-col items-center gap-4 md:flex-row md:justify-between">
        <p className="text-muted-foreground">&copy; 2025 Pentrix. All rights reserved.</p>
        <div className="flex gap-6">
          <Link href="/legal/privacy" className="text-sm text-muted-foreground hover:text-foreground">Privacy</Link>
          <Link href="/legal/terms" className="text-sm text-muted-foreground hover:text-foreground">Terms</Link>
          <Link href="/legal/contact" className="text-sm text-muted-foreground hover:text-foreground">Contact</Link>
        </div>
      </div>
    </footer>
  )
}