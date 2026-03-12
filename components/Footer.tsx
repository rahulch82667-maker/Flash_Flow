"use client";

import { memo } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { 
  Mail, 
  Phone, 
  MapPin, 
  Facebook, 
  Twitter, 
  Instagram, 
  Linkedin, 
  Youtube,
  ChevronRight
} from "lucide-react";

// Footer link item component - vertical layout
const FooterLink = memo(({ children }: { children: React.ReactNode }) => (
  <motion.li
    whileHover={{ x: 5 }}
    transition={{ type: "spring", stiffness: 400, damping: 25 }}
    className="flex items-center gap-2 text-sm font-bold text-indigo-100 cursor-default group"
  >
    <ChevronRight size={14} className="text-indigo-300 group-hover:text-indigo-200 transition-colors" />
    <span className="relative">
      {children}
      <span className="absolute -bottom-0.5 left-0 w-0 h-[1px] bg-indigo-300 transition-all duration-300 group-hover:w-full" />
    </span>
  </motion.li>
));

FooterLink.displayName = "FooterLink";

// Social media icon component - with hover color change
const SocialIcon = memo(({ icon: Icon, label }: { icon: any; label: string }) => {
  // Define brand colors for each social platform
  const getBrandColor = (platform: string) => {
    switch(platform) {
      case "Facebook": return "hover:bg-[#1877F2]";
      case "Twitter": return "hover:bg-[#1DA1F2]";
      case "Instagram": return "hover:bg-[#E4405F]";
      case "LinkedIn": return "hover:bg-[#0A66C2]";
      case "YouTube": return "hover:bg-[#FF0000]";
      default: return "hover:bg-indigo-500";
    }
  };

  return (
    <motion.div
      whileHover={{ y: -3, scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      className={`flex h-10 w-10 items-center justify-center rounded-full bg-indigo-800 text-indigo-100 cursor-default transition-colors duration-300 ${getBrandColor(label)} hover:text-white hover:shadow-lg`}
      aria-label={label}
    >
      <Icon size={18} />
    </motion.div>
  );
});

SocialIcon.displayName = "SocialIcon";

// Newsletter form component - now just static
const NewsletterForm = memo(() => {
  return (
    <div className="mt-2">
      <p className="mb-3 text-base font-bold text-white">Subscribe to our newsletter</p>
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="flex-1 rounded-lg border border-indigo-700 bg-indigo-900/50 px-4 py-2 text-base text-white placeholder-indigo-300 opacity-75 cursor-not-allowed">
          Enter your email
        </div>
        <div className="rounded-lg bg-indigo-500/50 px-4 py-2 text-base font-bold text-white shadow-lg cursor-not-allowed">
          Subscribe
        </div>
      </div>
      <p className="mt-3 text-sm font-bold text-indigo-300">
        Get 10% off your first order
      </p>
    </div>
  );
});

NewsletterForm.displayName = "NewsletterForm";

// Main Footer Component
export default memo(function Footer() {
  const currentYear = new Date().getFullYear();

  // Footer sections data - with vertical layout
  const footerSections = [
    {
      title: "About",
      items: ["Our Story", "Careers", "Press", "Blog", "Sustainability"],
    },
    {
      title: "Contact",
      items: ["Help Center", "Track Order", "WhatsApp", "Email Us", "Live Chat"],
    },
    {
      title: "FAQ",
      items: ["Shipping Info", "Returns", "Payments", "Size Guide", "Gift Cards"],
    },
    {
      title: "Policies",
      items: ["Privacy", "Terms", "Cookies", "Security", "GDPR"],
    },
  ];

  // Social media icons
  const socialIcons = [
    { icon: Facebook, label: "Facebook" },
    { icon: Twitter, label: "Twitter" },
    { icon: Instagram, label: "Instagram" },
    { icon: Linkedin, label: "LinkedIn" },
    { icon: Youtube, label: "YouTube" },
  ];

  return (
    <footer className="relative bg-gradient-to-br from-indigo-900 via-indigo-800 to-indigo-900 border-t border-indigo-700">
      {/* Background decoration - subtle pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 2px 2px, rgba(255,255,255,0.1) 1px, transparent 0)`,
          backgroundSize: '40px 40px',
        }} />
      </div>
      
      {/* Main Footer */}
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        {/* Grid Layout - Responsive */}
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-5">
          {/* Brand Column - Full width on mobile, 2 cols on tablet, 1 col on desktop */}
          <div className="sm:col-span-2 lg:col-span-1">
            <div className="inline-block">
              <motion.div 
                className="flex items-center gap-3"
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
              >
                {/* Logo - Original styling preserved */}
                <div className="relative h-10 w-10 overflow-hidden rounded-lg bg-white p-1.5 shadow-lg">
                  <Image
                    src="/Flow_logo_.png"
                    alt="Flash Flow Logo"
                    width={40}
                    height={40}
                    className="object-contain"
                    priority={false}
                  />
                </div>
                <span className="text-xl font-bold text-white">Flash Flow</span>
              </motion.div>
            </div>
            
            <p className="mt-4 text-base font-bold text-indigo-200 leading-relaxed">
              Your one-stop destination for lightning-fast delivery and unbeatable deals. 
              Shop smarter, live better with Flash Flow.
            </p>
            
            {/* Contact Info */}
            <div className="mt-6 space-y-3">
              <motion.div 
                className="flex items-center gap-3 text-base font-bold text-indigo-200 group"
                whileHover={{ x: 5 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
              >
                <MapPin size={18} className="text-indigo-300 shrink-0" />
                <span>Mumbai, India - 400001</span>
              </motion.div>
              <motion.div 
                className="flex items-center gap-3 text-base font-bold text-indigo-200 group"
                whileHover={{ x: 5 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
              >
                <Phone size={18} className="text-indigo-300 shrink-0" />
                <span>+91 12345 67890</span>
              </motion.div>
              <motion.div 
                className="flex items-center gap-3 text-base font-bold text-indigo-200 group"
                whileHover={{ x: 5 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
              >
                <Mail size={18} className="text-indigo-300 shrink-0" />
                <span>support@flashflow.com</span>
              </motion.div>
            </div>
          </div>

          {/* Links Columns - Responsive */}
          {footerSections.map((section) => (
            <div key={section.title} className="sm:col-span-1 lg:col-span-1">
              <h3 className="text-lg font-bold text-white uppercase tracking-wider mb-4">
                {section.title}
              </h3>
              <ul className="space-y-3">
                {section.items.map((item) => (
                  <FooterLink key={item}>
                    {item}
                  </FooterLink>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Newsletter - Centered */}
        <div className="mt-16 max-w-2xl mx-auto">
          <NewsletterForm />
        </div>

        {/* Bottom Bar */}
        <div className="mt-16 pt-8 border-t border-indigo-700">
          <div className="flex flex-col items-center gap-6 md:flex-row md:justify-between">
            {/* Copyright */}
            <div className="text-center text-base font-bold text-indigo-300 md:text-left">
              © {currentYear} Flash Flow. All rights reserved.
            </div>

            {/* Social Icons */}
            <div className="flex items-center gap-3">
              {socialIcons.map((social) => (
                <SocialIcon
                  key={social.label}
                  icon={social.icon}
                  label={social.label}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
});