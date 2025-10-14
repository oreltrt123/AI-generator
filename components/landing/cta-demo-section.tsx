import Image from 'next/image';
import { ChevronRight } from 'lucide-react';

const CtaDemoSection = () => {
  return (
    <section className="bg-background py-16 sm:py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="relative isolate flex flex-col items-center justify-between gap-10 overflow-hidden rounded-2xl bg-[#0099ff27] px-6 py-16 text-center sm:px-16 md:flex-row md:gap-0 md:text-left">
          {/* Decorative blobs */}
          <div className="absolute -left-20 -top-24 -z-10 h-[250px] w-[250px] rounded-full bg-primary/30 blur-3xl" />
          <div className="absolute -bottom-24 -right-20 -z-10 h-[250px] w-[250px] rounded-full bg-blue-500/30 blur-3xl" />
          
          <div className="flex flex-col items-center gap-10 md:flex-row md:gap-16">
            <div className="">
              <p className="font-sans font-light text-primary">
                Ready to protect your projects?
              </p>
              <h2 className="font-sans font-light text-3xl tracking-tight text-text-dark-gray sm:text-4xl">
                You focus on content, we handle protection.
              </h2>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-x-6 mt-12">
            <a
              href="/auth/sign-up"
              className="group relative inline-flex items-center justify-center whitespace-nowrap rounded-full bg-primary px-8 py-4 text-base font-semibold text-primary-foreground transition-transform duration-200 ease-in-out hover:-translate-y-1"
            >
              Create an account
            </a>
            <Image
              src="/logonet.png"
              alt="Decorative illustration of a hand holding a cup"
              width={200}
              height={74}
              className="hidden lg:block absolute mt-[-140px]"
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default CtaDemoSection;