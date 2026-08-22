import { fetchShellPrices } from './shell-prices.js';

try {
  const result = await fetchShellPrices();

  console.log('');
  console.log('========================================');
  console.log('SHELL PRICE TEST');
  console.log('========================================');

  console.log('Bron:', result.source);
  console.log('Type:', result.source_type);
  console.log('Geldig vanaf:', result.effective_date);
  console.log('');

  console.table(result.prices);

  console.log('');
  console.log('TEST GESLAAGD');
} catch (error) {
  console.error('');
  console.error('SHELL PRICE TEST MISLUKT');
  console.error(error);
  process.exit(1);
}