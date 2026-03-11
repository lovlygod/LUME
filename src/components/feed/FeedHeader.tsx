import { useState } from "react";
import { motion } from "framer-motion";
import { MinimalTabs } from "@/components/ui/glass";
import logo from "@/assets/icons/logo.png";

const tabs = ["For you", "Following"];

const FeedHeader = () => {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <div className="sticky top-0 z-10 bg-background/60 backdrop-blur-md">
      <div className="px-4 py-6">
        <div className="flex items-center gap-2">
          <img
            src={logo}
            alt="LUME"
            className="h-4 w-6 object-contain"
          />
          <h2 className="text-[13px] font-medium tracking-[0.2em] text-secondary">
            LUME
          </h2>
        </div>
      </div>
      <div className="px-4 pb-4">
        <MinimalTabs>
          {tabs.map((tab, i) => (
            <button
              key={tab}
              onClick={() => setActiveTab(i)}
              className={`flex-1 rounded-full px-4 py-2 text-sm font-medium transition-all ${
                activeTab === i
                  ? "bg-white/10 text-white"
                  : "text-secondary hover:text-white"
              }`}
            >
              <span>{tab}</span>
              {activeTab === i && (
                <motion.span
                  className="sr-only"
                  layoutId="feed-tab"
                  transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
                />
              )}
            </button>
          ))}
        </MinimalTabs>
      </div>
    </div>
  );
};

export default FeedHeader;
