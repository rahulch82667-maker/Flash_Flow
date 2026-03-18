"use client";

import { motion } from "framer-motion";

interface SuggestedMessagesProps {
  onSelectMessage: (message: string) => void;
  messages: string[];
}

export default function SuggestedMessages({ onSelectMessage, messages }: SuggestedMessagesProps) {
  if (!messages.length) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="px-2 sm:px-4 py-2 sm:py-3 border-t border-gray-100 bg-white"
    >
      <div className="flex flex-wrap gap-1.5 sm:gap-2 max-h-24 sm:max-h-32">
        {messages.map((message, index) => (
          <motion.button
            key={index}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.05 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onSelectMessage(message)}
            className="px-2 sm:px-4 py-1 sm:py-2 text-[10px] sm:text-sm font-medium rounded-full bg-gradient-to-r from-[#5D5FEF]/10 to-[#868CFF]/10 text-[#5D5FEF] border border-[#5D5FEF]/20 hover:from-[#5D5FEF]/20 hover:to-[#868CFF]/20 whitespace-nowrap"
          >
            {message}
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
}