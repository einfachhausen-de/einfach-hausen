import { Manrope } from 'next/font/google';

export const displayFont = Manrope({
  subsets: ['latin'],
  weight: ['600', '700', '800'],
  display: 'swap',
  variable: '--font-display-face',
});
