import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const file=process.argv[2];
if(!file){console.error('Usage: npm run tariffs:import -- /secure/path/offers.json');process.exit(2);}
let payload;
try{payload=JSON.parse(await fs.readFile(path.resolve(file),'utf8'));}catch{console.error('Tariff feed is not readable JSON.');process.exit(2);}
const {replacePartnerTariffOffers}=await import('../src/lib/owner-intelligence.ts');
try{
  const result=replacePartnerTariffOffers(payload);
  console.log(JSON.stringify({ok:true,partner_id:payload.partnerId,category:payload.category,...result}));
}catch(error){console.error(JSON.stringify({ok:false,error:error instanceof Error?error.message:'tariff_import_failed'}));process.exit(1);}
