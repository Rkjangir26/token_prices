import { NextApiRequest, NextApiResponse } from 'next';
import { Client } from 'pg';

// PostgreSQL client setup
const client = new Client({
    connectionString: process.env.DATABASE_URL,
});

async function connectToDatabase() {
    await client.connect();

    // Create necessary tables if they don't exist
    await client.query(`
        CREATE TABLE IF NOT EXISTS public.alerts (
            id SERIAL PRIMARY KEY,
            chain VARCHAR(255) NOT NULL,
            dollar DECIMAL(10, 2) NOT NULL,
            email VARCHAR(255) NOT NULL,
            created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
        );
    `);
}

async function setAlert(chain: string, dollar: number, email: string) {
    await connectToDatabase();
    await client.query(`
        INSERT INTO public.alerts (chain, dollar, email)
        VALUES ($1, $2, $3)
    `, [chain, dollar, email]);
    await client.end();
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const { chain, dollar, email } = req.body;
    try {
        await setAlert(chain, dollar, email);
        res.status(200).json({ message: 'Alert set successfully' });
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
        res.status(500).json({ error: 'Error setting alert' });
    }
}
