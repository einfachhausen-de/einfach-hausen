import fs from 'node:fs/promises';
import path from 'node:path';
import { NextRequest,NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { isAdmin } from '@/lib/admin-auth';
import { db } from '@/lib/db';
import { parseArtifactId,resolvePrivateFile } from '@/lib/security/private-files';
import { archivedNeededBody } from '@/lib/byos-archive';

function notFound(){return new NextResponse('Not found',{status:404});}
function mime(file:string){const ext=path.extname(file).toLowerCase();return ext==='.pdf'?'application/pdf':ext==='.png'?'image/png':ext==='.webp'?'image/webp':ext==='.gif'?'image/gif':ext==='.jpg'||ext==='.jpeg'?'image/jpeg':'application/octet-stream';}

export async function GET(_req:NextRequest,{params}:{params:Promise<{id:string}>}){
  const [user,admin]=await Promise.all([getCurrentUser(),isAdmin()]);
  if(!user&&!admin)return new NextResponse('Unauthorized',{status:401});
  const {id}=await params;const documentId=parseArtifactId(id);if(!documentId)return notFound();
  const document=db.prepare('SELECT id,homeowner_id,title,path FROM house_documents WHERE id=?').get(documentId) as {id:number;homeowner_id:number;title:string;path:string}|undefined;
  if(!document||(!admin&&document.homeowner_id!==user?.id))return notFound();
  const file=await resolvePrivateFile(document.path);
  if(!file){const archived=archivedNeededBody(document.path);if(archived)return NextResponse.json(archived,{status:409});return notFound();}
  try{const body=await fs.readFile(file);return new NextResponse(body,{headers:{'Content-Type':mime(file),'Content-Disposition':`inline; filename*=UTF-8''${encodeURIComponent(document.title||`Dokument-${document.id}`)}`,'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'}});}catch{return notFound();}
}
