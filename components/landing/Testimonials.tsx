import { Star } from "lucide-react"

const testimonials = [
  {
    quote: "Switching to this platform transformed our team's file security without sacrificing speed or design. The UI is sleek and professional—highly recommend!",
    author: "Sarah L., CTO at TechSecure Inc.",
    rating: 5
  },
  {
    quote: "End-to-end encryption that actually works. Beautiful interface makes secure sharing feel effortless, and the compliance features saved us during our audit.",
    author: "Mike R., Security Analyst",
    rating: 5
  },
  {
    quote: "From setup to daily use, everything screams professionalism. Zero-knowledge proof gives us confidence in handling sensitive client data.",
    author: "Elena K., Product Designer",
    rating: 5
  }
]

export default function Testimonials() {
  return (
    <section className="mx-auto mt-20 max-w-5xl px-6 py-16 bg-[#F6F6F6] rounded-xl">
      <h2 className="mb-8 text-3xl font-bold text-center">What Our Users Say</h2>
      <div className="grid gap-6 md:grid-cols-3">
        {testimonials.map((testimonial, index) => (
          <div key={index} className="p-6 rounded-lg bg-background">
            <p className="mb-4 text-muted-foreground italic">"{testimonial.quote}"</p>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold">{testimonial.author}</p>
                <div className="flex gap-1 mt-1">
                  {Array.from({ length: testimonial.rating }).map(() => (
                    <Star key={Math.random()} className="h-4 w-4 fill-current text-yellow-400" />
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}