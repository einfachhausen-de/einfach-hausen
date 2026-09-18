import { redirect } from 'next/navigation';

/**
 * Legacy-Route: offene Anfragen aus stillgelegter Supabase-Welt. Der kanonische
 * Eingang fuer Partner-Auftraege ist /pro/orders.
 */
export default function AnfragenProRedirect() {
  redirect('/pro/orders');
}
