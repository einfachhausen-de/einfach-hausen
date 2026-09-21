import fs from 'node:fs/promises';
import path from 'node:path';
import { NextRequest,NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { isAdmin } from '@/lib/admin-auth';
import { db } from '@/lib/db';
import { getProviderContext } from '@/lib/provider';
import { canProviderReadJobMedia,canReadJobMedia,parseArtifactId,resolvePrivateFile } from '@/lib/security/private-files';
import { archivedNeededBody } from '@/lib/byos-archive';

function mime(file:string){
  const ext=path.extname(file).toLowerCase();
  return ext==='.png'?'image/png':ext==='.webp'?'image/webp':ext==='.gif'?'image/gif':ext==='.jpg'||ext==='.jpeg'?'image/jpeg':ext==='.mp4'?'video/mp4':ext==='.webm'?'video/webm':ext==='.mov'?'video/quicktime':ext==='.m4v'?'video/x-m4v':ext==='.aac'?'audio/aac':ext==='.mp3'?'audio/mpeg':ext==='.m4a'?'audio/mp4':ext==='.ogg'?'audio/ogg':ext==='.opus'?'audio/opus':ext==='.wav'?'audio/wav':'application/octet-stream';
}

function notFound(){return new NextResponse('Not found',{status:404});}

export async function GET(_req:NextRequest,{params}:{params:Promise<{id:string}>}){
  const [user,admin]=await Promise.all([getCurrentUser(),isAdmin()]);
  if(!user&&!admin)return new NextResponse('Unauthorized',{status:401});

  const {id}=await params;
  const mediaId=parseArtifactId(id);
  if(!mediaId)return notFound();
  const media=db.prepare(`SELECT p.path,p.job_id,j.homeowner_id FROM job_photos p JOIN jobs j ON j.id=p.job_id WHERE p.id=?`).get(mediaId) as {path:string;job_id:number;homeowner_id:number}|undefined;
  if(!media)return notFound();

  let providerAuthorized=false;
  if(user?.role==='provider'){
    const context=getProviderContext(user.id);
    if(context){
      const assignment=db.prepare(`SELECT contact_user_id FROM job_assignments WHERE job_id=? AND provider_id=?`).get(media.job_id,context.providerId) as {contact_user_id:number}|undefined;
      const activeDispatch=Boolean(db.prepare(`SELECT 1 FROM job_dispatches WHERE job_id=? AND provider_id=? AND status IN ('sent','viewed','quoted','accepted')`).get(media.job_id,context.providerId));
      providerAuthorized=canProviderReadJobMedia(context,Boolean(assignment),assignment?.contact_user_id??null,activeDispatch);
    }
  }
  if(!canReadJobMedia(user,media.homeowner_id,providerAuthorized,admin))return notFound();

  const file=await resolvePrivateFile(media.path);
  if(!file){
    const archived=archivedNeededBody(media.path);
    if(archived)return NextResponse.json(archived,{status:409});
    return notFound();
  }

  try{
    const body=await fs.readFile(file);
    return new NextResponse(body,{headers:{
      'Content-Type':mime(file),
      'Cache-Control':'private, no-store',
      'X-Content-Type-Options':'nosniff',
    }});
  }catch{
    return notFound();
  }
}
