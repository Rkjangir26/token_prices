import { NextApiRequest, NextApiResponse } from 'next';
import Moralis from 'moralis';
import { Client } from 'pg';
import cron from 'node-cron';

// Initialize Moralis only once
let isMoralisInitialized = false;

async function initializeMoralis() {
    if (!isMoralisInitialized) {
        await Moralis.start({
            apiKey: process.env.MORALIS_API_KEY || '',
        });
        isMoralisInitialized = true;
    }
}

// PostgreSQL client setup
const client = new Client({
    connectionString: process.env.DATABASE_URL, // Ensure you have the DATABASE_URL in your .env
});

// Function to save prices in the database
async function savePrices(ethPrice: number, maticPrice: number) {
  try {
      // Check if client is already connected
      if (!client.connect) {
          await client.connect();
      }
      // Insert both prices dynamically into the database
      await client.query(
          'INSERT INTO token_prices (token, price) VALUES ($1, $2), ($3, $4)',
          ['ETH', ethPrice, 'MATIC', maticPrice]
      );
  } catch (error) {
      console.error('Error saving prices to PostgreSQL:', error);
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
              { tokenAddress: '0x7d1afa7b718fb893db30a3abc0cfc608aacfebb0' } // Matic Token
            ]
          }
        );

        const prices = response.raw;
        const ethUsdPrice = prices[0]?.usdPrice;
        const maticUsdPrice = prices[1]?.usdPrice;

        if (ethUsdPrice && maticUsdPrice) {
            await savePrices(ethUsdPrice, maticUsdPrice);
            console.log(`Saved ETH: ${ethUsdPrice}, MATIC: ${maticUsdPrice}`);
        }
    } catch (error) {
        console.error('Error fetching and saving prices:', error);
    }
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    // You can keep your existing handler code here
    res.status(200).json({ message: 'Scheduler is running' });
}
