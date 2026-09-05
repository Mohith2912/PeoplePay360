import { prisma } from '@/lib/prisma';
import { requireAuth, requireRoles } from '@/lib/auth';
import { ZodError } from 'zod';
export const HR = ['HR_MANAGER','HR_PAYROLL_USER','HR_PAYROLL_MANAGER','ADMIN'];
export const PAYROLL = ['HR_PAYROLL_USER','HR_PAYROLL_MANAGER','ADMIN'];
export const MANAGERS = ['HR_PAYROLL_MANAGER','ADMIN'];
export function fail(message,status=400,code='VALIDATION_FAILED',extra={}) { throw Object.assign(new Error(message),{status,code,...extra}); }
export function check(condition,message,status=400,code) { if(!condition) fail(message,status,code); }
export const reply = (data,status=200,extra={}) => Response.json({data,...extra},{status});
export function handler(fn,allowed) { return async (request,context) => {
  try {
    const user=await requireAuth(); if(allowed) requireRoles(user,...allowed);
    if(!['GET','HEAD'].includes(request.method)) {
      const origin=request.headers.get('origin');
      const host=request.headers.get('x-forwarded-host') || request.headers.get('host');
      if(origin && new URL(origin).host !== host && origin !== process.env.APP_URL) fail('Request origin is not allowed',403,'FORBIDDEN');
    }
    return await fn({request,user,params:await context?.params||{},query:Object.fromEntries(new URL(request.url).searchParams)});
  } catch(e) {
    if(e instanceof ZodError) return Response.json({message:'Check the highlighted fields',code:'VALIDATION_FAILED',fieldErrors:e.issues.map(i=>({field:i.path.join('.'),message:i.message}))},{status:400});
    const status=e.status || ({UnauthorizedError:401,ForbiddenError:403,NotFoundError:404,ConflictError:409,BusinessRuleError:422}[e.name]) || ({P2002:409,P2003:409,P2025:404,P2034:409}[e.code]) || 500;
    if(status===500) console.error(e);
    return Response.json({message:status===500?'Unable to complete this request. Check backend configuration.':e.message,code:e.code||e.name,...(e.warnings?{warnings:e.warnings}:{}),...(e.errors?{errors:e.errors}:{}),...(e.currentVersion!==undefined?{currentVersion:e.currentVersion}:{})},{status});
  }
}; }
export function scope(user,employeeId) { if(user.role==='EMPLOYEE') { check(user.employeeId,'No employee profile is linked to your account',403); if(employeeId) check(employeeId===user.employeeId,'Access denied',403); return user.employeeId; } return employeeId; }
export async function list(model,where,query,include,view=x=>x) {
  const page=Math.max(1,Number(query.page)||1),limit=Math.min(200,Math.max(1,Number(query.limit)||20));
  const [rows,total]=await Promise.all([prisma[model].findMany({where,include,skip:(page-1)*limit,take:limit,orderBy:{createdAt:'desc'}}),prisma[model].count({where})]);
  return reply(rows.map(view),200,{total,page,limit});
}
export async function audit(tx,user,action,entityType,entityId,metadata={}) { await tx.auditLog.create({data:{userId:user.id,action,entityType,entityId,metadata:JSON.parse(JSON.stringify(metadata))}}); }
