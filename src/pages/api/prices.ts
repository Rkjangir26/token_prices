import { NextApiRequest, NextApiResponse } from 'next';
import Moralis from 'moralis';
import { Client } from 'pg';
import cron from 'node-cron';
import nodemailer from 'nodemailer';

// Initialize Moralis only once
let isMoralisInitialized = false;
async function initializeMoralis() {
    if (!isMoralisInitialized) {
        await Moralis.start({
            apiKey: process.env.MORALIS_API_KEY || '',
        });
        isMoralisInitialized = true;
        console.log("✅ Moralis initialized successfully.");
    }
}

// PostgreSQL client setup with connection checkpoint
const client = new Client({
    connectionString: process.env.DATABASE_URL, // Ensure you have the DATABASE_URL in your .env
});
let isConnected = false;
async function connectToDatabase() {
    if (!isConnected) {
        await client.connect();

        // Create necessary tables if they don't exist
        await client.query(`
            CREATE TABLE IF NOT EXISTS public.token_prices (
                id SERIAL PRIMARY KEY,
                token VARCHAR(10) NOT NULL,
                price NUMERIC(20, 10) NOT NULL,
                last_update TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
            );
        `);

        await client.query(`
            CREATE TABLE IF NOT EXISTS public.alerts (
                id SERIAL PRIMARY KEY,
                chain VARCHAR(255) NOT NULL,
                dollar DECIMAL(10, 2) NOT NULL,
                email VARCHAR(255) NOT NULL,
                created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
            );
        `);

        isConnected = true;
        console.log("✅ Connected to PostgreSQL successfully.");
    }
}

// Function to send email alerts
async function sendEmailAlert(token: string, newPrice: number, oldPrice: number) {
    const transporter = nodemailer.createTransport({
        service: 'Gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: 'ravijangir741@gmail.com', // Replace with actual recipient email
        subject: `Price Alert: ${token}`,
        text: `The price of ${token} has changed from ${oldPrice} to ${newPrice}.`
    };

    await transporter.sendMail(mailOptions);
}

// Function to check for price increases
async function checkPriceIncrease(token: string, newPrice: number) {
    const result = await client.query(
        'SELECT price FROM public.token_prices WHERE token = $1 ORDER BY last_update DESC LIMIT 1', [token]
    );

    if (result.rows.length > 0) {
        const oldPrice = result.rows[0].price;
        if (newPrice > oldPrice) {
            await sendEmailAlert(token, newPrice, oldPrice);
        }
    }
}

// Function to save prices in the database with confirmation logs
async function savePrices(ethPrice: number, maticPrice: number) {
    try {
        // Ensure client is connected
        await connectToDatabase();

        // Insert both prices dynamically into the database and log inserted data
        await client.query('INSERT INTO public.token_prices (token, price) VALUES ($1, $2)', ['ETH', ethPrice]);
        await client.query('INSERT INTO public.token_prices (token, price) VALUES ($1, $2)', ['MATIC', maticPrice]);

        // Check for price increases and send alerts
        await checkPriceIncrease('ETH', ethPrice);
        await checkPriceIncrease('MATIC', maticPrice);

        console.log("✅ Prices saved to database");
    } catch (error) {
        console.error('❌ Error saving prices to PostgreSQL:', error);
    }
}

// Schedule the task every 5 minutes
cron.schedule('*/1 * * * *', async () => {
    try {
        // Initialize Moralis and connect to the database if needed
        await initializeMoralis();

        const response = await Moralis.EvmApi.token.getMultipleTokenPrices(
            { chain: '0x1' },
            {
                tokens: [
                    { tokenAddress: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2' }, // Wrapped Ether
                    { tokenAddress: '0x7d1afa7b718fb893db30a3abc0cfc608aacfebb0' }  // Matic Token
                ]
            }
        );

        const prices = response.raw;
        const ethUsdPrice = prices[0]?.usdPrice;
        const maticUsdPrice = prices[1]?.usdPrice;

        console.log(`Fetched ETH: ${ethUsdPrice}, MATIC: ${maticUsdPrice}`);

        if (ethUsdPrice && maticUsdPrice) {
            await savePrices(ethUsdPrice, maticUsdPrice);
            console.log(`✅ Saved ETH: ${ethUsdPrice}, MATIC: ${ethUsdPrice}`);
        } else {
            console.error('❌ Failed to fetch valid price data.');
        }
    } catch (error) {
        console.error('❌ Error fetching and saving prices:', error);
    }
});

// API Route Handler
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    res.status(200).json({ message: 'Scheduler is running' });
}
