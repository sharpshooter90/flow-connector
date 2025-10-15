// Shared styling constants for dropdown components
export const DROPDOWN_STYLES = {
  // Label styling
  label: "block text-[10px] font-semibold text-gray-700",

  // Select element styling (for native HTML select)
  select:
    "w-full bg-gray-100 border border-gray-200 rounded text-xs px-3 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent",

  // Container styling
  container: "space-y-2",
} as const;

// Alternative styling for components that need different appearance
export const DROPDOWN_STYLES_WHITE = {
  // Label styling
  label: "block text-[10px] font-semibold text-gray-700",

  // Select element styling (for native HTML select with white background)
  select:
    "w-full appearance-none bg-white border border-gray-300 rounded-md px-2 py-1.5 pr-8 text-xs focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent",

  // Container styling
  container: "space-y-2",
} as const;
