const esbuild = require('esbuild');
const path = require('path');
const polyfill = require('@esbuild-plugins/node-globals-polyfill');

const production = process.argv.includes('--production');
const watch = process.argv.includes('--watch');

async function main() {
    const ctx = await esbuild.context({
        entryPoints: ['src/extension/extension.ts'],
        bundle: true,
        format: 'cjs',
        minify: production,
        sourcemap: !production,
        sourcesContent: false,
        platform: 'browser',
        outdir: 'out/web',
        external: ['vscode'],
        logLevel: 'warning',
        // Node.js global to browser globalThis
        define: {
            global: 'globalThis'
        },

        plugins: [
            polyfill.NodeGlobalsPolyfillPlugin({
                process: true,
                buffer: true
            }),
            esbuildProblemMatcherPlugin /* add to the end of plugins array */
        ]
    });
    if (watch) {
        await ctx.watch();
    } else {
        await ctx.rebuild();
        await ctx.dispose();
    }
}

/**
 * This plugin hooks into the build process to print errors in a format that the problem matcher in
 * Visual Studio Code can understand.
 * @type {import('esbuild').Plugin}
 */
const esbuildProblemMatcherPlugin = {
    name: 'esbuild-problem-matcher',

    setup(build) {
        build.onStart(() => {
            console.log('[watch] build started');
        });
        build.onEnd(result => {
            result.errors.forEach(({ text, location }) => {
                console.error(`✘ [ERROR] ${text}`);
                if (location == null) return;
                console.error(`    ${location.file}:${location.line}:${location.column}:`);
            });
            console.log('[watch] build finished');
        });
    }
};

main().catch(e => {
    console.error(e);
    process.exit(1);
});