import {PrismaClient} from '@prisma/client';
import bcrypt from 'bcryptjs';
import {randomBytes} from 'node:crypto';
import {writeFileSync,mkdirSync,existsSync} from 'node:fs';
const prisma=new PrismaClient();
try {
 const email=process.env.ADMIN_EMAIL||'admin@peoplepay360.local';
 if(await prisma.user.findUnique({where:{email}})){console.log('Admin already exists; no credentials changed.');}
 else {const password=process.env.ADMIN_PASSWORD||randomBytes(16).toString('base64url');await prisma.user.create({data:{name:'Demo Administrator',email,passwordHash:await bcrypt.hash(password,12),role:'ADMIN'}});mkdirSync('../.local-runtime',{recursive:true});writeFileSync('../.local-runtime/demo-login.json',JSON.stringify({email,password},null,2));console.log('Admin created. Local sign-in details saved to .local-runtime/demo-login.json (not tracked).');}
}finally{await prisma.$disconnect();}
