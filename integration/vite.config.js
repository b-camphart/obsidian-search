import { join, resolve } from 'path'
import { createTestVault, generateManifest, launchObsidian } from './runner'
import { defineConfig } from 'vite'

const vaultPath = join(process.cwd(), 'testVault')
const pluginName = "obsidian-search-e2e-tests";
const pluginPath = join(vaultPath, '.obsidian', 'plugins', pluginName);


createTestVault(vaultPath)

export default defineConfig({
    plugins: [
        {
            name: "launch-obsidian",
            closeBundle() {
                generateManifest(pluginPath, pluginName)
                launchObsidian(vaultPath)
            }
        }
    ],
    resolve: {
        alias: {
            "src": resolve("./src")
        }
    },
    mode: "test",
    build: {
        outDir: pluginPath,
        lib: {
            entry: 'e2e/plugin/TestPlugin.ts',
            name: 'main',
            formats: ['cjs'],
            manualChunks: undefined
        },
        minify: false,
        rollupOptions: {
            external: [
                "obsidian",
                "util"
            ],
            output: [
                {
                    dir: pluginPath,
                    entryFileNames: 'main.js',
                    format: 'cjs',
                    manualChunks: undefined
                },
            ]
        },
    },
})