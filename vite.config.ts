import { defineConfig } from 'vite';

export default defineConfig({
    base: './', // For easy deployment to itch.io/GitHub Pages
    build: {
        assetsInlineLimit: 0, // Ensure assets are not inlined as base64
    },
    server: {
        port: 3000,
    },
});
