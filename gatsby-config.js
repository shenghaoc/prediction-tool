/** @type {import('gatsby').GatsbyConfig} */
const { getThemeVariables } = require('antd/dist/theme');
module.exports = {
    siteMetadata: {
        title: "Prediction Tool",
        titleTemplate: "%s · Group 20",
        description:
            "Group 20 Prediction for EE4802.",
        url: "https://ee4802-g20-tool.web.app", // No trailing slash allowed!
    },
    plugins: [
        `gatsby-plugin-react-helmet`,
        {
            resolve: `gatsby-plugin-manifest`,
            options: {
                name: `GatsbyJS`,
                short_name: `GatsbyJS`,
                start_url: `/`,
                background_color: `#f7f0eb`,
                theme_color: `#a2466c`,
                display: `standalone`,
                icon: `src/images/icon.png`
            },
        },
        {
            resolve: `gatsby-plugin-less`,
            options: {
                lessOptions: {
                    modifyVars: getThemeVariables({
                            dark: true, // Enable dark mode
                    }),
                    javascriptEnabled: true,
                }
            }
        }
    ]
}
