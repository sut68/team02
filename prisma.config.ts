// Prisma configuration for database connection URL
// This file is used by Prisma Migrate to load connection URLs

export const config = {
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
};

export default config;

