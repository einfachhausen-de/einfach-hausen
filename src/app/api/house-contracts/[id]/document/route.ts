import fs from 'node:fs/promises';
import path from 'node:path';
import { NextRequest,NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { isAdmin } from '@/lib/admin-auth';
import { db } from '@/lib/db';
import { parseArtifactId,resolvePrivateFile } from '@/lib/security/private-files';
import { archivedNeededBody } from '@/lib/byos-archive';

function notFound(){return new NextResponse('Not found',{status:404});}

function mime(file:string){
  const ext=path.extname(file).toLowerCase();
  return ext==='.pdf'?'application/pdf':ext==='.png'?'image/png':ext==='.webp'?'image/webp':ext==='.gif'?'image/gif':ext==='.jpg'||ext==='.jpeg'?'image/jpeg':'application/octet-stream';
}

export async function GET(_req:NextRequest,{params}:{params:Promise<{id:string}>}){
  const [user,admin]=await Promise.all([getCurrentUser(),isAdmin()]);
  if(!user&&!admin)return new NextResponse('Unauthorized',{status:401});

  const {id}=await params;
  const contractId=parseArtifactId(id);
  if(!contractId)return notFound();
  // A contract belongs to the homeowner, not to the property: it stays with the
  // person who signed it even when the house changes hands.
  const contract=db.prepare(`SELECT id,homeowner_id,document_title,document_path FROM house_contracts WHERE id=?`).get(contractId) as {id:number;homeowner_id:number;document_title:string;document_path:string|null}|undefined;
  if(!contract||!contract.document_path)return notFound();

  if(!admin&&contract.homeowner_id!==user?.id)return notFound();

  const file=await resolvePrivateFile(contract.document_path);
  if(!file){
    const archived=archivedNeededBody(contract.document_path);
    if(archived)return NextResponse.json(archived,{status:409});
    return notFound();
  }

  try{
    const body=await fs.readFile(file);
    return new NextResponse(body,{headers:{
      'Content-Type':mime(file),
      'Content-Disposition':`inline; filename*=UTF-8''${encodeURIComponent(contract.document_title||'Vertrag')}`,
      'Cache-Control':'private, no-store',
      'X-Content-Type-Options':'nosniff',
    }});
  }catch{
    return notFound();
  }
}
