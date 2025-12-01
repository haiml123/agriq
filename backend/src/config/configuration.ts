import * as process from 'node:process';

export default () => ({
  env: process.env.NODE_ENV || 'development',
  database: {
    uri: process.env.DATABASE_URL || '',
  },
  port: parseInt(process.env.PORT!, 10) || 3005,
});
