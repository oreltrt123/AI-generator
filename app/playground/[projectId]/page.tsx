import type { Metadata } from "next"
import ClientPage from "./client"

export const metadata: Metadata = {
  title: "Playground",
}

export default function Page() {
  return <ClientPage />
}

