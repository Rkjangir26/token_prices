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

// PostgreSQL client setup
const client = new Client({
    connectionString: process.env.DATABASE_URL,
});
let isConnected = false;

// Function to create the table if it doesn't exist
async function createTableIfNotExists() {
    const query = `
        CREATE TABLE IF NOT EXISTS token_prices (
            id SERIAL PRIMARY KEY,
            token VARCHAR(10) NOT NULL,
            price NUMERIC(20, 10) NOT NULL,
            last_update TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
        );
    `;
    await client.query(query);
    console.log("✅ Table 'token_prices' verified or created successfully.");
}

// Connect to PostgreSQL database
async function connectToDatabase() {
    if (!isConnected) {
        await client.connect();
        isConnected = true;
        console.log("✅ Connected to PostgreSQL successfully.");
        console.log(`Connected to database: ${process.env.DATABASE_URL}`);
        await createTableIfNotExists();
    }
}

// Function to save prices in the database with confirmation logs
async function savePrices(ethPrice: number, maticPrice: number) {
    try {
        await connectToDatabase();

        console.log("Inserting prices:", { ethPrice, maticPrice });

        const result = await client.query(
            'INSERT INTO token_prices (token, price) VALUES ($1, $2), ($3, $4) RETURNING *',
            ['ETH', ethPrice, 'MATIC', maticPrice]
        );

        console.log("✅ Prices saved to database:", result.rows);
    } catch (error) {
        console.error('❌ Error saving prices to PostgreSQL:', error);
    }
}

// Function to send email notification
async function sendEmailAlert(token: string, newPrice: number, oldPrice: number) {
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
    });

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: 'ravijalodiya741@gmail.com',
        subject: `Price Alert: ${token} Price Increased`,
        text: `The price of ${token} has increased from $${oldPrice.toFixed(2)} to $${newPrice.toFixed(2)}.`
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`✅ Email alert sent for ${token}: Price increased from $${oldPrice} to $${newPrice}`);
    } catch (error) {
        console.error('❌ Error sending email:', error);
    }
}

// Function to check for price increases
async function checkPriceIncrease(token: string, newPrice: number) {
    const result = await client.query(
        'SELECT price FROM token_prices WHERE token = $1 ORDER BY last_update DESC LIMIT 1',
        [token]
    );

    if (result.rows.length > 0) {
        const oldPrice = parseFloat(result.rows[0].price);
        // const percentageChange = ((newPrice - oldPrice) / oldPrice) * 100;

        if (newPrice != oldPrice) { // Check if the price increased by more than 0.1%
            await sendEmailAlert(token, newPrice, oldPrice);
        }
    }
}

// Schedule the task every 5 minutes
cron.schedule('*/5 * * * *', async () => {
    try {
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
            console.log(`✅ Saved ETH: ${ethUsdPrice}, MATIC: ${maticUsdPrice}`);

            await checkPriceIncrease('ETH', ethUsdPrice);
            await checkPriceIncrease('MATIC', maticUsdPrice);
        } else {
            console.error('❌ Failed to fetch valid price data.');
        }
    } catch (error) {
        console.error('❌ Error fetching and saving prices:', error);
    }
});

// Function to get hourly prices for the last 24 hours
async function getHourlyPrices() {
    const query = `
        SELECT 
            token,
            DATE_TRUNC('hour', last_update) AS hour,
            AVG(price) AS avg_price
        FROM 
            token_prices
        WHERE 
            last_update >= NOW() - INTERVAL '24 HOURS'
        GROUP BY 
            token, hour
        ORDER BY 
            hour DESC;
    `;
    const result = await client.query(query);
    return result.rows;
}

// API Route Handler for hourly prices and other operations
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method === 'GET' && req.query.type === 'hourlyPrices') {
        try {
            await connectToDatabase();
            const hourlyPrices = await getHourlyPrices();
            res.status(200).json(hourlyPrices);
        } catch (error) {
            console.error('Error fetching hourly prices:', error);
            res.status(500).json({ error: 'Error fetching hourly prices' });
        }
    } else {
        res.status(200).json({ message: 'Scheduler is running' });
    }
}
