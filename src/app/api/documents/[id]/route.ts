import fs from 'node:fs/promises';
import path from 'node:path';
import { NextRequest,NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { isAdmin } from '@/lib/admin-auth';
import { db } from '@/lib/db';
import { getProviderContext } from '@/lib/provider';
import { canReadJobDocument,parseArtifactId,resolvePrivateFile } from '@/lib/security/private-files';
import { archivedNeededBody } from '@/lib/byos-archive';

function mime(file:string){
  const ext=path.extname(file).toLowerCase();
  return ext==='.pdf'?'application/pdf':ext==='.png'?'image/png':ext==='.webp'?'image/webp':ext==='.gif'?'image/gif':ext==='.jpg'||ext==='.jpeg'?'image/jpeg':'application/octet-stream';
}

function notFound(){return new NextResponse('Not found',{status:404});}

export async function GET(_req:NextRequest,{params}:{params:Promise<{id:string}>}){
  const [user,admin]=await Promise.all([getCurrentUser(),isAdmin()]);
  if(!user&&!admin)return new NextResponse('Unauthorized',{status:401});

  const {id}=await params;
  const documentId=parseArtifactId(id);
  if(!documentId)return notFound();
  const document=db.prepare(`SELECT d.id,d.path,d.provider_id document_provider,j.homeowner_id,q.provider_id accepted_provider,a.contact_user_id
    FROM documents d
    JOIN jobs j ON j.id=d.job_id
    LEFT JOIN quotes q ON q.id=j.accepted_quote_id
    LEFT JOIN job_assignments a ON a.job_id=j.id
    WHERE d.id=?`).get(documentId) as {id:number;path:string;document_provider:number|null;homeowner_id:number;accepted_provider:number|null;contact_user_id:number|null}|undefined;
  if(!document)return notFound();

  const context=user?.role==='provider'?getProviderContext(user.id):null;
  if(!canReadJobDocument(user,document.homeowner_id,context,document.document_provider,document.accepted_provider,document.contact_user_id,admin))return notFound();

  const file=await resolvePrivateFile(document.path);
  if(!file){
    const archived=archivedNeededBody(document.path);
    if(archived)return NextResponse.json(archived,{status:409});
    return notFound();
  }

  try{
    const body=await fs.readFile(file);
    const ext=path.extname(file);
    return new NextResponse(body,{headers:{
      'Content-Type':mime(file),
      'Content-Disposition':`inline; filename="document-${document.id}${ext}"`,
      'Cache-Control':'private, no-store',
      'X-Content-Type-Options':'nosniff',
    }});
  }catch{
    return notFound();
  }
}
