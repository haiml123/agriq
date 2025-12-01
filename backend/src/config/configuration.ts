import * as process from 'node:process';

export default () => ({
  env: process.env.NODE_ENV || 'development',
  ratehawk: {
    apiKey: process.env.RATEHAWK_API_KEY,
    apiKeyId: process.env.RATEHAWK_API_KEY_ID,
    baseUrl: process.env.RATEHAWK_BASE_URL || 'https://api.worldota.net',
  },
  database: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/ratehawk',
  },
  tbo: {
    username: process.env.TBO_USERNAME,
    password: process.env.TBO_PASSWORD,
    apiUrl:
      process.env.TBO_API_URL ||
      'http://api.tbotechnology.in/TBOHolidays_HotelAPI',
  },
  google: {
    mapApiKey: process.env.GOOGLE_MAP_API_KEY,
  },
  typesense: {
    adminSecret: process.env.TYPESENSE_ADMIN_SECRET,
    searchSecret: process.env.TYPESENSE_SEARCH_SECRET,
    nodes: process.env.TYPESENSE_NODES?.split(',') || [],
    local: {
      host: process.env.TYPESENSE_HOST || 'localhost',
      port: Number(process.env.TYPESENSE_PORT) || 8108,
      protocol: process.env.TYPESENSE_PROTOCOL || 'http',
      apiKey: process.env.TYPESENSE_API_KEY || 'xyz',
    }
  },
  llm: {
    openaiKey: process.env.OPENAI_API_KEY,
    claudeKey: process.env.ANTHROPIC_API_KEY,
  },
  port: parseInt(process.env.PORT!, 10) || 3000,
});
