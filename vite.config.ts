import { defineConfig, loadEnv } from 'vite';

// Inline env at build time: .env locally, Cloudflare injects process.env in CI
function getEnv(mode: string) {
    const fromFile = loadEnv(mode, process.cwd(), '');
    return {
        VITE_SUPABASE_URL: process.env.VITE_SUPABASE_URL ?? fromFile.VITE_SUPABASE_URL ?? '',
        VITE_SUPABASE_ANON_KEY: process.env.VITE_SUPABASE_ANON_KEY ?? fromFile.VITE_SUPABASE_ANON_KEY ?? '',
        VITE_SEASON_ID: process.env.VITE_SEASON_ID ?? fromFile.VITE_SEASON_ID ?? 's1',
        VITE_BUILD_ID: process.env.VITE_BUILD_ID ?? fromFile.VITE_BUILD_ID ?? 'v1',
        VITE_TOTAL_LEVELS: process.env.VITE_TOTAL_LEVELS ?? fromFile.VITE_TOTAL_LEVELS ?? '12',
    };
}

export default defineConfig(({ mode }) => {
    const env = getEnv(mode);
    return {
        base: './', // For easy deployment to itch.io/GitHub Pages
        define: {
            'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(env.VITE_SUPABASE_URL),
            'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(env.VITE_SUPABASE_ANON_KEY),
            'import.meta.env.VITE_SEASON_ID': JSON.stringify(env.VITE_SEASON_ID),
            'import.meta.env.VITE_BUILD_ID': JSON.stringify(env.VITE_BUILD_ID),
            'import.meta.env.VITE_TOTAL_LEVELS': JSON.stringify(env.VITE_TOTAL_LEVELS),
        },
    build: {
        assetsInlineLimit: 0, // Ensure assets are not inlined as base64
    },
    server: {
        port: 3000,
    },
    };
});
