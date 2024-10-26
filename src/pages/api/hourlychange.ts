import { NextApiRequest, NextApiResponse } from 'next';
import { Client } from 'pg';

// PostgreSQL client setup
const client = new Client({
    connectionString: process.env.DATABASE_URL,
});

// Function to calculate hourly change
async function getHourlyChange() {
    await client.connect();
    const result = await client.query(`
        SELECT token, AVG(price) AS average_price, date_trunc('hour', created_at) AS hour
        FROM public.token_prices
        WHERE created_at >= NOW() - INTERVAL '1 hour'
        GROUP BY token, date_trunc('hour', created_at)
        ORDER BY hour DESC
        LIMIT 1;
    `);
    await client.end();
    return result.rows;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    try {
        const hourlyChange = await getHourlyChange();
        res.status(200).json({ hourlyChange });
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
        res.status(500).json({ error: 'Error fetching hourly change' });
    }
}
