import { useEffect, useState } from 'react';

const Home = () => {
  const [ethPrice, setEthPrice] = useState<number | null>(null);
  const [maticPrice, setMaticPrice] = useState<number | null>(null);

  useEffect(() => {
    const fetchPrices = async () => {
      try {
        const response = await fetch('/api/prices');
        if (!response.ok) {
          throw new Error('Failed to fetch prices');
        }
        const data = await response.json();
        setEthPrice(data.ethUsdPrice);
        setMaticPrice(data.maticUsdPrice);
      } catch (err) {
        // TypeScript error is resolved by casting 'err' to 'any'
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        console.error('Error fetching prices:', (err as any).message); // Cast err to 'any'
      }
    };

    fetchPrices();
  }, []);

  return (
    <div>
      <h1>Crypto Prices</h1>
      <p>ETH Price: {ethPrice ? `$${ethPrice}` : 'Loading...'}</p>
      <p>MATIC Price: {maticPrice ? `$${maticPrice}` : 'Loading...'}</p>
    </div>
  );
};

export default Home;