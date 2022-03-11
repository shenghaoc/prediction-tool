/** @type {import('gatsby').GatsbyConfig} */
module.exports = {
  siteMetadata: {
      siteUrl: `https://www.yourdomain.tld`,
  },
    plugins: [
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
                    javascriptEnabled: true,
                }
            }
        }
    ]
}
