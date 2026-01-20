export const config = {
    apiUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3005',
    weatherApiKey: process.env.WEATHER_API_KEY || '',
    nodeEnv: process.env.NODE_ENV || 'development',
};
