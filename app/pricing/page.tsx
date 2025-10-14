// pages/subscribe.tsx or app/subscribe/page.tsx
import React from 'react';
import { PricingTable } from '@clerk/nextjs';  // or appropriate import depending on your setup
import Link from 'next/link';

const SubscribePage = () => {
  return (
    <div>
      <header>
        <Link href="/">← Back to Home</Link>
      </header>
      <main style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '2rem' }}>
        <h1>Choose a plan</h1>
        <p>Pick the subscription plan that fits your needs.</p>
        <div style={{ width: '100%', maxWidth: '600px' }}>
          <PricingTable />
        </div>
      </main>
    </div>
  );
};

export default SubscribePage;
