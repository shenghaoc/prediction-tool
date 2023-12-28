# Prediction Tool

[![Netlify Status](https://api.netlify.com/api/v1/badges/f95e6bac-be11-4252-94ac-22c6b3714dc8/deploy-status)](https://app.netlify.com/sites/ee4802-g20-tool/deploys)

This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app). The purpose is to create a website on which the user can obtain a predicted HDB resale flat price by filling in a form.

As part of a minor project in EE4802, only regression models are available to avoid having to maintain a Python backend runnning scikit-learn for the neural network model.

Due to limitations of one-hot encoding in EE4802, prediction of future prices is not possible and the output is hardcoded to show a year before the last month in the data set.

This repository was updated about one and a half years later for me to expriment with web development, code was refactored but the UI has not changed.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/basic-features/font-optimization) to automatically optimize and load Inter, a custom Google Font.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js/) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/deployment) for more details.
