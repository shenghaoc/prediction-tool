/** @type {import('gatsby').GatsbyConfig} */
module.exports = {
  siteMetadata: {
      siteUrl: `https://www.yourdomain.tld`,
  },
    plugins: [
        {
            resolve: `gatsby-plugin-less`,
            options: {
                lessOptions: {
                    javascriptEnabled: true,
                }
            }
        },
    ]
}
