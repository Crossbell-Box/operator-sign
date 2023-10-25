# Crossbell Operator Sign Backend Service

**Operator Sign (Op Sign)** designed to enhance the user experience on the Crossbell network. Its primary goal is to streamline the interaction process by minimizing the number of manual approvals required for each transaction.

## Features

- **Efficient Interactions**: No need to manually approve every transaction, ensuring a smoother user experience.
- **Secure Authentication**: Leverage the SIWE protocol to authenticate users based on their encrypted signature.
- **Delegated Operations**: The Operator contract methods can carry out operations on the user's behalf, ensuring both convenience and security.

## Getting Started

#### Install deps:

```bash
npm install
```

#### Prepare environment variables:

```bash
copy .env.example .env
```

#### Setup wallet:

You will need to create a wallet and obtain the private key and address, then fill in the environment variables: `OP_SIGN_OPERATOR_WALLET_ADDRESS` and `OP_SIGN_OPERATOR_WALLET_PRIVATE_KEY`.

#### Start Database instance:

```bash
npm run docker:db
```

#### Migrate database and generate types in development environment:

```bash
npm run prisma:migrate:dev
```

#### Start server:

```bash
npm run start:dev
```

## Deployment

Docker:

```bash
# building new NestJS docker image
docker-compose build
# or
npm run docker:build

# start docker-compose
docker-compose up -d
# or
npm run docker
```

In Node.js Environment:

```
npm install
npm run build
NODE_ENV=production node dist/main
```

### Migrate database

In development:

```bash
npm run prisma:migrate:dev
```

In production:

```bash
npm run prisma:migrate:deploy
```

## Feedback & Contributions

We welcome feedback and contributions from the community. Feel free to raise issues, submit pull requests, or share your insights to enhance the Operator Sign feature.
