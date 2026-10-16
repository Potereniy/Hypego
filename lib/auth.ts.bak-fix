import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
const cookieName = 'hypego_session';
function secret() { const s=process.env.AUTH_SECRET; if(!s || s.length<32) throw new Error('AUTH_SECRET must contain at least 32 characters'); return new TextEncoder().encode(s); }
export async function makeSession(user:{id:string;username:string}) { return new SignJWT({username:user.username}).setProtectedHeader({alg:'HS256'}).setSubject(user.id).setIssuedAt().setExpirationTime('7d').sign(secret()); }
export async function setSession(token:string) { (await cookies()).set(cookieName,token,{httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'lax',path:'/',maxAge:60*60*24*7}); }
export async function clearSession() { (await cookies()).set(cookieName,'',{httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'lax',path:'/',maxAge:0}); }
export async function currentUserId() { try { const token=(await cookies()).get(cookieName)?.value; if(!token)return null; const {payload}=await jwtVerify(token,secret()); return payload.sub??null; } catch { return null; } }
