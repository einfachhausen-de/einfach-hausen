import type { Metadata,Viewport } from 'next';
import localFont from 'next/font/local';
import './globals.css';
import '../../packages/eh-design/src/tokens.css';
import './design-system.css';
import '@/components/marketing/tokens.css';
import { HouseAssistant } from '@/components/house-assistant';
import { PwaRegister } from '@/components/pwa-register';
import { AuthProvider } from '@/components/AuthContext';
import NativeInit from '@/components/NativeInit';
import { CwvTelemetry } from '@/components/telemetry/cwv-telemetry';
import { SITE_URL, ogImages, orgWebsiteJsonLd } from '@/lib/seo';

// Brand typography: self-hosted Inter Variable for ALL surfaces (site, funnel, app).
const interVariable = localFont({
  src: '../fonts/InterVariable.woff2',
  weight: '100 900',
  style: 'normal',
  display: 'swap',
  variable: '--font-marketing',
  fallback: ['ui-sans-serif', 'system-ui', 'sans-serif'],
});

export const metadata: Metadata = {
  metadataBase:new URL(SITE_URL),
  alternates:{canonical:'/'},
  applicationName:'Einfach Hausen',
  title:{default:'Einfach Hausen · Alles rund ums Eigenheim',template:'%s · Einfach Hausen'},
  description:'Ein Ansprechpartner für alles rund ums Eigenheim. Fragen klären, passende Menschen finden, Aufträge organisieren und Hauswissen an einem Ort behalten.',
  openGraph:{type:'website',locale:'de_DE',siteName:'Einfach Hausen',url:'/',images:ogImages()},
  twitter:{card:'summary_large_image'},
  manifest:'/manifest.webmanifest',
  appleWebApp:{capable:true,statusBarStyle:'black-translucent',title:'Einfach Hausen'},
  formatDetection:{telephone:false},
  icons:{icon:[{url:'/icons/favicon-32.png',sizes:'32x32',type:'image/png'},{url:'/icons/icon-192.png',sizes:'192x192',type:'image/png'}],apple:[{url:'/icons/apple-touch-icon.png',sizes:'180x180',type:'image/png'}]},
};

export const viewport:Viewport={width:'device-width',initialScale:1,viewportFit:'cover',themeColor:'#ffffff'};

export default async function RootLayout({children}:{children:React.ReactNode}){
  // T-0132: the proxy-generated correlation id is exposed to the client error
  // reporter so boundary errors join with server logs. headers() makes this
  // layout dynamic; the attribute is empty when no id exists.
  let correlationId = '';
  try {
    const { headers } = await import('next/headers');
    correlationId = (await headers()).get('x-correlation-id') ?? '';
  } catch { /* static render: no correlation id */ }
  return <html lang="de" data-scroll-behavior="smooth" data-correlation-id={correlationId} className={interVariable.variable}><body><script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(orgWebsiteJsonLd())}} /><NativeInit><AuthProvider><PwaRegister/><CwvTelemetry/>{children}<HouseAssistant/></AuthProvider></NativeInit></body></html>;
}
