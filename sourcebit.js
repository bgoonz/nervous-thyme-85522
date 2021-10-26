const path = require('path');
const { cssClassesFromFilePath, urlPathFromFilePath } = require('./src/utils/path');
const { resolveReferenceFields, flattenMarkdownData, postProcessContactFormEmails, resolvePageProps } = require('./src/utils/process-data');

const isDev = process.env.NODE_ENV === 'development';

module.exports = {
    plugins: [
        {
            module: require('sourcebit-source-filesystem'),
            options: {
                watch: isDev,
                sources: [
                    { name: 'pages', path: path.join(__dirname, 'content/pages') },
                    { name: 'data', path: path.join(__dirname, 'content/data') }
                ]
            }
        },
        flattenMarkdownData(),
        resolveReferenceFields(),
        postProcessContactFormEmails(),
        {
            module: require('sourcebit-target-next'),
            options: {
                liveUpdate: isDev,
                flattenAssetUrls: true,

                // The commonProps() function should return an object that will be merged with props of every page.
                commonProps: (data) => {
                    const site = data.find((page) => page.__metadata.id === 'content/data/config.json');
                    return { site };
                },

                // The pages() function should return an array of objects specifying the URL paths and the props of your
                // site's pages. Every object in this array must have the "path" property with the URL path of the page
                // and any additional properties that will be passed to page component as props.
                pages: (data) => {
                    const pages = data.filter((page) => page.__metadata.sourceName === 'pages');
                    return pages.map((page) => {
                        const path = urlPathFromFilePath(page.__metadata.relSourcePath);
                        const pageCssClasses = cssClassesFromFilePath(page.__metadata.relSourcePath);
                        // Some components rendered in pages may depend on data not related to the page itself.
                        // For example a "RecentPosts" section may depend on a dynamic list of 5 recent blog posts.
                        // In this case, use the resolvePageProps() method and the pagePropsResolvers defined below
                        // to ensure the required data will be added to page props.
                        const pageProps = resolvePageProps({
                            page,
                            data,
                            pagePropsResolvers
                        });
                        return {
                            path,
                            page: {
                                ...page,
                                __metadata: {
                                    ...page.__metadata,
                                    pageCssClasses
                                }
                            },
                            ...pageProps
                        };
                    });
                }
            }
        }
    ]
};

// Use pagePropsResolvers array to define what additional props a page should get based on one of its nested values.
// Every item in the array should be an object with two methods - `match` and `resolveProps`.
// match: (value: string, keyPath: string[]) => boolean
// resolveProps: (data: any) => any
// The `match` method is recursively called for every nested value of the page object, starting with the page itself.
// When `match` returns true, the `resolveProps(data)` is called and its return value is merged with page props.
const pagePropsResolvers = [
    {
        match: (value, keyPath) => {
            if (typeof value !== 'string' || keyPath.length === 0) {
                return false;
            }
            const key = keyPath[keyPath.length - 1];
            return key === 'type' && value === 'LatestPostsSection';
        },
        resolveProps: (data) => {
            const posts = data.filter((page) => page.layout === 'PostLayout');
            return { posts };
        }
    }
];
