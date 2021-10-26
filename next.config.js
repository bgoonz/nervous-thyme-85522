const path = require('path');
const sourcebit = require('sourcebit');
const sourcebitConfig = require('./sourcebit.js');
const withBundleAnalyzer = require('@next/bundle-analyzer')({
    enabled: process.env.ANALYZE === 'true',
});

sourcebit.fetch(sourcebitConfig);

module.exports = withBundleAnalyzer({
    trailingSlash: true,
    devIndicators: {
        autoPrerender: false
    },
    eslint: {
        // Allow production builds to successfully complete even if your project has ESLint errors.
        ignoreDuringBuilds: true
    },
    webpack: (config, { webpack, dev }) => {
        // temporary: for local development -  edit package.json "@stackbit/components": "file:../stackbit-components" and uncomment the alias below.
        // config.resolve.alias['react'] = path.resolve('./node_modules/react');
        // config.resolve.alias['next'] = path.resolve('./node_modules/next');

        // Tell webpack to ignore watching content files in the content folder.
        // Otherwise webpack recompiles the app and refreshes the whole page.
        // Instead, the src/pages/[...slug].js uses the "withRemoteDataUpdates"
        // function to update the content on the page without refreshing the
        // whole page
        config.plugins.push(new webpack.WatchIgnorePlugin({ paths: [/\/content\//] }));
        if (dev) {
            // enable tree shaking for development mode, on production it is on by default
            config.optimization.usedExports = true;
        }

        return config;
    }
});
