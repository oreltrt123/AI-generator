"use client";
import "@/styles/button.css"

export default function NewsLetter() {
  return (
    <main
      style={{
        backgroundSize: "100% auto", // full width, auto height
        backgroundPosition: "center -130px", // move image down
        backgroundRepeat: "no-repeat",
        backgroundImage: 'url("/assets/images/bg.jpg")'
      }}
      className="min-h-screen text-black flex flex-col items-center px-6 py-12"
    >
      <div className="relative top-[50px]">
        {/* Header */}
        <header className="w-full max-w-4xl mb-12 text-center">
          <h1 className="text-4xl font-sans font-light italic">
            Website Security{" "}
            <span className="bg-[#0099ff34] px-2.5 py-0.5 rounded-xl text-lg">
              <span className="relative left-[-2px]">Beta</span>
            </span>
          </h1>
        </header>

        {/* Content */}
        <div className="w-full max-w-4xl space-y-10 text-left">
          <section>
            <h2 className="text-3xl font-sans font-light italic mb-4">
              Securing Your Website & Domain
            </h2>
            <p className="text-gray-900 text-lg font-light leading-relaxed">
              A secure website begins with protecting your domain. With our system, 
              the first step is simple: register the DNS we provide inside your domain company. 
              Once this step is completed, your domain becomes connected to our protection system, 
              laying the foundation for stronger security across your entire site.
            </p>
          </section>

          <section>
            <h2 className="text-3xl font-sans font-light italic mb-4">
              What Beta Security Means
            </h2>
            <p className="text-gray-900 text-lg font-light leading-relaxed">
              After verifying your domain, you will see it listed in your dashboard. 
              From there, you can activate our guarantee system—a layer of protection that ensures 
              your website and domain are secured against unauthorized access, DNS attacks, and potential hijacking. 
            </p>
            <p className="text-gray-900 text-lg font-light leading-relaxed mt-4">
              Similar to how industry leaders like Google safeguard domains with advanced authentication, 
              our Beta Security brings a step-by-step verification process to every registered website. 
              This ensures your digital identity is protected before, during, and after launch.
            </p>
          </section>

          <section>
            <h2 className="text-3xl font-sans font-light italic mb-4">
              Why It Matters
            </h2>
            <p className="text-gray-900 text-lg font-light leading-relaxed">
              Your website is your business card on the internet. If your domain is compromised, 
              everything from user trust to search engine ranking can be at risk. 
              With Beta Security enabled, your site gains an additional layer of protection that 
              makes it significantly harder for attackers to manipulate your DNS or impersonate your brand.
            </p>
            <p className="text-gray-900 text-lg font-light leading-relaxed">
              Our mission is clear: before providing you with tools to expand your online presence, 
              we make sure your foundation is safe. By securing your domain, we give you the confidence 
              to grow your website without fear of losing ownership or control.
            </p>
          </section>

          <section>
            <p className="text-gray-900 text-lg font-light leading-relaxed">
              Whether you are setting up a new website or already connected through our Beta Security program, 
              know that your domain is verified and protected in a secure environment. 
              This is only the beginning—we are constantly working to make our platform safer, 
              stronger, and more reliable for every website owner.
            </p>
          </section>

          {/* Start button */}
          <div className="mt-10 text-center">
            <button
              onClick={() => (window.location.href = "/dashboard/security")}
              className="fixed bottom-4 left-5 bg-[#0099ffb2] hover:bg-[#0099ffbe] text-white r2552esf25_252trewt3erblueFontDocs"
            >
              Start Securing Your Domain
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
