import fs from 'node:fs/promises';
import path from 'node:path';

type PrivateUser={id:number;role:'homeowner'|'provider'};
type ProviderArtifactContext={userId:number;providerId:number;canManageJobs:boolean;active:boolean};

function isContained(root:string,candidate:string){
  const relative=path.relative(root,candidate);
  return relative!==''&&!relative.startsWith(`..${path.sep}`)&&relative!=='..'&&!path.isAbsolute(relative);
}

function hasTraversalSegment(storedPath:string){
  // Percent-decode first: an attacker who can write into data/private can plant
  // literal "%2e%2e"-style names, and any downstream URL-decoding consumer would
  // otherwise turn them into traversal after this check (T-0120 fuzz finding).
  let decoded=storedPath;
  for(let i=0;i<3;i++){
    let next:string;
    try{ next=decodeURIComponent(decoded); }catch{ return true; }
    if(next===decoded)break;
    decoded=next;
  }
  return [storedPath,decoded].some(p=>p.split(/[\\/]+/).some(segment=>segment==='..'));
}


export function parseArtifactId(value:string){
  if(!/^[1-9]\d*$/.test(value))return null;
  const id=Number(value);
  return Number.isSafeInteger(id)?id:null;
}

export function privateRoot(){
  // PRIVATE_ROOT hat Vorrang: in Produktion liegt die Ablage ausserhalb des
  // Projekts (/var/lib/einfach-hausen/private), damit sie Neustarts und
  // Neuinstallationen ueberlebt und vom Backup erfasst wird.
  //
  // Der frueher benutzte Weg ueber einen Symlink <project>/data/private -> /var/lib
  // ist eine Falle: Turbopack loest den Pfad statisch auf und bricht den Build ab,
  // sobald dort echte Dateien liegen ("Symlink ... points out of the filesystem
  // root"). Solange die Ablage leer war, fiel das nie auf - die Dokumentenablage
  // hat in Produktion deshalb noch nie funktioniert. Ohne den Symlink sieht
  // Turbopack den Pfad gar nicht erst.
  return process.env.PRIVATE_ROOT || path.resolve(process.cwd(), 'data', 'private');
}

export function publicRoot(){
  return path.resolve(process.cwd(), 'public');
}

export function resolvePrivatePath(storedPath:string|null|undefined){
  if(!storedPath||storedPath.includes('\0'))return null;
  if(path.posix.isAbsolute(storedPath)||path.win32.isAbsolute(storedPath))return null;
  if(hasTraversalSegment(storedPath))return null;

  const root=privateRoot();
  const resolved=path.resolve(root,storedPath);
  return isContained(root,resolved)?resolved:null;
}

export async function resolvePrivateFile(storedPath:string|null|undefined){
  const lexical=resolvePrivatePath(storedPath);
  if(!lexical)return null;

  try{
    const [realRoot,realPublic,realFile]=await Promise.all([
      fs.realpath(/* turbopackIgnore: true */ privateRoot()),
      fs.realpath(/* turbopackIgnore: true */ publicRoot()),
      fs.realpath(/* turbopackIgnore: true */ lexical),
    ]);

    // Misconfigured or symlinked roots must never make private content part of
    // the public tree. Symlink targets below the private root must remain there.
    if(realRoot===realPublic||isContained(realRoot,realPublic)||isContained(realPublic,realRoot))return null;
    if(!isContained(realRoot,realFile))return null;
    if(realFile===realPublic||isContained(realPublic,realFile))return null;
    return realFile;
  }catch{
    return null;
  }
}

export function canReadJobDocument(
  user:PrivateUser|null,
  homeownerId:number,
  context:ProviderArtifactContext|null,
  documentProviderId:number|null,
  acceptedProviderId:number|null,
  assignedContactUserId:number|null,
  admin:boolean,
){
  if(admin)return true;
  if(!user)return false;
  if(user.role==='homeowner')return user.id===homeownerId;
  if(!context?.active||context.userId!==user.id)return false;
  if(documentProviderId===null||context.providerId!==documentProviderId||context.providerId!==acceptedProviderId)return false;
  return context.canManageJobs||assignedContactUserId===user.id;
}

export function canProviderReadJobMedia(
  context:ProviderArtifactContext|null,
  hasProviderAssignment:boolean,
  assignedContactUserId:number|null,
  hasActiveDispatch:boolean,
){
  if(!context?.active)return false;
  if(hasProviderAssignment&&(context.canManageJobs||assignedContactUserId===context.userId))return true;
  return context.canManageJobs&&hasActiveDispatch;
}

export function canReadJobMedia(user:PrivateUser|null,homeownerId:number,providerAuthorized:boolean,admin:boolean){
  return admin||Boolean(user&&(user.id===homeownerId||(user.role==='provider'&&providerAuthorized)));
}
