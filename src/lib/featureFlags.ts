const env = import.meta.env;

// Keep AI enabled unless explicitly switched off.
export const ENABLE_APP_AI = env.VITE_ENABLE_APP_AI !== 'false';
export const ENABLE_GROWTH_HUB_V2 = env.VITE_ENABLE_GROWTH_HUB_V2 === 'true';
