import { cn } from "@/lib/utils";
import { useState } from "react";
import { Brain, Globe2, Rocket, Sparkles } from "lucide-react";
import Link from "next/link";

export const Component = () => {
  return (
    <section
      id="ai-builder"
      className="bg-white rounded-3xl p-4 my-16 max-w-6xl mx-auto"
    >
      <div className="flex flex-col md:flex-row items-end justify-between w-full">
        <div className="flex flex-col my-12 w-full items-start justify-start gap-4">
          <div className="flex flex-col md:flex-row gap-2 items-end w-full justify-between">
            <h2 className="relative text-4xl md:text-5xl font-sans font-light max-w-xl text-left leading-[1em] text-base-content">
              Build websites instantly with{" "}
              <span>
                <Brain
                  className="inline-flex text-[#0099ffc2] fill-accent/10 rotate-12"
                  size={40}
                  strokeWidth={2}
                />
              </span>{" "}
              Pentrix AI.
            </h2>
            <p className="max-w-sm font-sans font-light text-md text-neutral/50">
              Pentrix transforms your ideas into fully functional websites in
              seconds. Just describe your vision — our AI handles the design,
              content, and deployment automatically.
            </p>
          </div>

          <div className="flex flex-row text-accent gap-6 items-start justify-center">
            <p className="text-[#617583] whitespace-nowrap font-sans font-light">
              +10,000 Websites Created
            </p>
            <p className="text-[#617583] whitespace-nowrap font-sans font-light">
              Trusted by 500+ Creators
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 md:items-start md:justify-start gap-4">
        <Link
          href={"/features/ai-generation"}
          className="md:col-span-2 hover:scale-101 hover:shadow-[-6px_6px_32px_8px_rgba(192,192,192,0.2)] hover:rotate-1 transition-all duration-200 ease-in-out h-[330px] overflow-hidden relative bg-[#0099ff27] rounded-xl flex flex-row items-center gap-8 justify-between px-3 pt-3 pb-6"
        >
          <div className="relative flex flex-col items-start justify-center ml-4 gap-0">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-base-content/10">
              <Sparkles className="h-6 w-6 text-base-content" />
            </div>
            <h3 className="text-2xl font-sans font-light text-center px-6 py-2 bg-white/75 rounded-full">
              AI Website Generation
            </h3>
            <p className="text-base text-center text-neutral/70 mt-3">
              Describe what you want — a portfolio, a store, or a startup site —
              and Pentrix instantly builds it using modern frameworks, responsive
              design, and smart content.
            </p>
          </div>
          <div className="w-full object-fill rounded-xl"></div>
        </Link>

        <Link
          href={"/features/live-deployment"}
          className="overflow-hidden md:hover:scale-105 hover:shadow-[-6px_6px_32px_8px_rgba(192,192,192,0.2)] hover:rotate-3 transition-all duration-200 ease-in-out relative bg-[#F6F6F6] h-[330px] rounded-xl flex flex-col items-center justify-between px-3 py-6"
        >
          <div className="flex flex-col items-center justify-center gap-1">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-base-content/10">
              <Rocket className="h-6 w-6 text-base-content" />
            </div>
            <h3 className="text-2xl font-sans font-light text-center px-6 py-2 bg-white/75 rounded-full">
              One-Click Deployment
            </h3>
            <p className="text-base text-center text-neutral/70 mt-3">
              Launch your site instantly on a custom domain like
              <br />
              <span className="text-[#0099ff] font-medium">
                yourname.pentrix.site
              </span>
              . Fast, secure, and globally optimized.
            </p>
          </div>
          <div className="w-full object-fill rounded-xl"></div>
        </Link>

        <Link
          href={"/features/smart-editing"}
          className="overflow-hidden md:hover:scale-105 hover:shadow-[-6px_6px_32px_8px_rgba(192,192,192,0.2)] hover:-rotate-3 transition-all duration-200 ease-in-out relative bg-[#0099ff27] h-[330px] rounded-xl flex flex-col items-center justify-between px-5 py-6"
        >
          <div className="flex flex-col items-center justify-center gap-1">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-base-content/10">
              <Globe2 className="h-6 w-6 text-base-content" />
            </div>
            <h3 className="text-2xl font-sans font-light text-center px-6 py-2 bg-white/75 rounded-full">
              Smart Editing
            </h3>
            <p className="text-base text-center text-neutral/70 mt-3">
              Update text, images, or layout using natural language. Just type
              what you want changed — Pentrix edits your site live in real time.
            </p>
          </div>
          <div className="w-full object-fill rounded-xl"></div>
        </Link>

        <Link
          href={"/resources/templates"}
          className="pointer-events-none overflow-hidden md:hover:scale-105 hover:shadow-[-6px_6px_32px_8px_rgba(192,192,192,0.2)] hover:rotate-4 transition-all duration-200 ease-in-out relative bg-[#F6F6F6] h-[330px] rounded-xl flex flex-col items-center justify-center px-5 py-6"
        >
          <h3 className="text-2xl font-sans font-light text-center px-6 py-2 bg-white/75 rounded-full">
            Coming Soon
          </h3>
          <p className="text-base text-center text-base-content mt-3">
            A library of AI-generated templates for every niche — design,
            marketing, tech, and more. Start fast, customize instantly.
          </p>
        </Link>

        <Link
          href={"/resources/integrations"}
          className="pointer-events-none overflow-hidden md:hover:scale-105 hover:shadow-[-6px_6px_32px_8px_rgba(192,192,192,0.2)] hover:-rotate-6 transition-all duration-200 ease-in-out relative bg-[#0099ff27] h-[330px] rounded-xl flex flex-col items-center justify-center px-5 py-6"
        >
          <h3 className="text-2xl font-sans font-light text-center px-6 py-2 bg-white/75 rounded-full">
            Coming Soon
          </h3>
          <p className="text-base text-center text-base-content mt-3">
            Connect Pentrix with tools like Notion, Figma, or GitHub to generate
            full projects directly from your workspace.
          </p>
        </Link>
      </div>
    </section>
  );
};
