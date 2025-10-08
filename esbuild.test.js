const esbuild = require('esbuild');
const glob = require('glob');
const path = require('path');

const testFiles = glob.sync('src/test/**/*.test.ts');

esbuild.build({
    entryPoints: testFiles,
    outdir: 'out/test',
    bundle: true,
    platform: 'node',
    sourcemap: true,
    format: 'cjs',
    target: ['node18'],
    external: [
        'vscode',
        // add other externals as needed
    ]
}).catch(() => process.exit(1));
