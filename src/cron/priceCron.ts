import cron from 'node-cron';
import fetch from 'node-fetch';

cron.schedule('*/5 * * * *', async () => {
  console.log('Fetching prices every 5 minutes...');
  try {
    await fetch('http://localhost:3000/api/prices');
    console.log('Prices fetched successfully');
  } catch (error) {
    console.error('Error fetching prices:', error);
  }
});
