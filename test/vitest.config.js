import { defineConfig } from 'vitest/config'

export default defineConfig({
    test: {
        "setupFiles": [
            "test/assertions.ts"  // relative to top-level 
        ],
        include: ["test/**/*.test.ts"],
    }
})