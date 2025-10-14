"use client";

import { useState } from "react";
import Image from "next/image";
import { Sparkles, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

const featuresData = [
  {
    icon: Sparkles,
    title: "Protect your website",
    description: "Your site stays online — we make sure it’s protected.",
    linkText: "Learn more",
    // linkHref: "https://www.figma.com/ai/",
    imageSrc: "/CreateWWEB.png",
  },
  {
    icon: null,
    title: "Create your workspace",
    description: "Create your own Workspace, upload your files, and keep yourself and your data protected online.",
    imageSrc: "/Untitled design (14).png",
  },
  {
    icon: null,
    title: "Verify your domain using DNS",
    description: "We securely integrate your domain through your registrar’s DNS.",
    imageSrc: "/verifyDomainDNS.png",
  },
  {
    icon: null,
    title: "Audit logs let you view all the files you’ve uploaded to the site.",
    description: "With our audit logs, you have full visibility over all the files you upload. Easily track, review, and manage your content, giving you complete control and peace of mind over your digital assets.",
    imageSrc: "/Untitled design (11).png",
  },
];

type Feature = (typeof featuresData)[0];

const FeatureTab = ({ feature, isActive, onClick }: { feature: Feature; isActive: boolean; onClick: () => void }) => {
  const Icon = feature.icon;

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "text-left w-full py-6 transition-opacity duration-300",
        !isActive ? "opacity-50 hover:opacity-100" : "opacity-100"
      )}
    >
      <div className="relative mb-2 h-px w-full bg-black/20 overflow-hidden">
        <div 
          className="absolute top-0 left-0 h-full bg-black transition-transform duration-500 ease-in-out"
          style={{ transform: isActive ? 'scaleX(1)' : 'scaleX(0)', transformOrigin: 'left' }}
        />
      </div>
      <div className="flex flex-row items-start gap-3">
        {Icon ? <Icon className="w-6 h-6 mt-1.5 flex-shrink-0 text-black fill-black" /> : <div className="w-6 h-6 flex-shrink-0" />}
        <div className="flex flex-col">
          <h3 className="text-2xl font-medium text-black">
            {feature.title}
          </h3>
          <p className="mt-2 text-lg text-black leading-snug">
            {feature.description}
          </p>
          {/* {feature.linkText && isActive && (
            <a href={feature.linkHref} className="mt-4 flex items-center text-[#0d99ff] font-medium group text-base hover:underline">
              {feature.linkText}
              <ArrowRight className="ml-1 w-4 h-4 transition-transform group-hover:translate-x-1" />
            </a>
          )} */}
        </div>
      </div>
    </button>
  );
};

export default function DesignFeatures() {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <section className="bg-white rounded-3xl p-4 my-16 max-w-6xl mx-auto">
      <div className="container px-6 lg:px-12">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-[56px] font-semibold text-black leading-[1.2]">
            Explore our features
          </h2>  
          <p className="mt-4 text-xl text-black">
            Explore and discover the features behind Secure Share
          </p>
        </div>

        <div className="grid lg:grid-cols-2 lg:gap-x-16 gap-y-12 items-start">
          <div className="flex flex-col">
            {featuresData.map((feature, index) => (
              <FeatureTab
                key={index}
                feature={feature}
                isActive={activeTab === index}
                onClick={() => setActiveTab(index)}
              />
            ))}
          </div>

          <div className="relative aspect-[908/726] lg:sticky lg:top-24">
            {featuresData.map((feature, index) => (
              <Image
                key={index}
                src={feature.imageSrc}
                alt={feature.title}
                width={908}
                height={726}
                className={cn(
                  "absolute inset-0 w-full h-full object-cover rounded-xl transition-opacity duration-500",
                  activeTab === index ? "opacity-100" : "opacity-0 pointer-events-none"
                )}
                priority={index === 0}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}