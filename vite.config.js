import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts'
import { resolve } from 'path'

export default defineConfig({
    plugins: [dts()],
    resolve: {
        alias: {
            "src": resolve("./src")
        }
    },
    build: {
        target: 'esnext',
        lib: {
            entry: 'src/main.ts',
            name: 'obsidian-search',
        },
        minify: false,
        rollupOptions: {
            external: [
                "obsidian"
            ],
            output: [
                {
                    dir: 'dist',
                    entryFileNames: 'main.mjs',
                    format: 'esm', // For ECMAScript module
                    chunkFileNames: 'chunks/[name]-[hash].js',
                },
                {
                    dir: 'dist',
                    entryFileNames: 'main.[format]',
                    format: 'cjs', // For CommonJS
                    chunkFileNames: 'chunks/[name]-[hash].js',
                },
            ]
        },
    },
});
