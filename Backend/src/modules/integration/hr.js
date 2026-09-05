import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { handler, HR, reply, check, scope, list, audit } from './http';
import { employeeView, scheduleView, contractView } from './serializers';
const optional=z.string().nullish();
const employeeSchema=z.object({name:z.string().trim().min(1),email:z.string().email(),phone:optional,department:z.string().min(1),jobPosition:z.string().min(1),employeeCode:z.string().optional(),dateOfJoining:z.coerce.date(),employeeType:z.enum(['FULL_TIME','PART_TIME','CONTRACT','CONTRACTOR','INTERN']),employmentStatus:z.enum(['ACTIVE','NOTICE_PERIOD','TERMINATED']),scheduleId:optional,managerId:optional,panNumber:optional,bankName:optional,bankAccountNumber:optional,ifscCode:optional,uanNumber:optional,pfNumber:optional});
const employeeInclude={workingSchedule:{include:{scheduleDays:true}},_count:{select:{contracts:true,attendanceRecords:true,timeOffRequests:true,timeOffAllocations:true}}};
export const employeesGET=handler(async({user,query})=>{
  const id=scope(user,query.employeeId);
  const where={...(id?{id}:{}),...(query.department?{department:query.department}:{}),...(query.status?{status:query.status}:{}),...(query.employeeType?{employeeType:query.employeeType}:{}),...(query.search?{OR:['firstName','lastName','email','employeeCode'].map(k=>({[k]:{contains:query.search}}))}:{})};
  return list('employee',where,query,employeeInclude,employeeView);
});
export const employeeGET=handler(async({user,params})=>{scope(user,params.id); const e=await prisma.employee.findUnique({where:{id:params.id},include:employeeInclude}); check(e,'Employee not found',404,'EMPLOYEE_NOT_FOUND');return reply(employeeView(e));});
async function saveEmployee({request,user,params}) {
  const b=employeeSchema.parse(await request.json()); const [firstName,...rest]=b.name.split(/\s+/);
  const data={firstName,lastName:rest.join(' '),email:b.email,phone:b.phone||null,department:b.department,designation:b.jobPosition,dateOfJoining:b.dateOfJoining,employeeType:b.employeeType==='CONTRACTOR'?'CONTRACT':b.employeeType,status:b.employmentStatus,workingScheduleId:b.scheduleId||null,managerId:b.managerId||null,pan:b.panNumber||null,uan:b.uanNumber||null,pfNumber:b.pfNumber||null,bankName:b.bankName||null,bankAccountNumber:b.bankAccountNumber||null,bankIFSC:b.ifscCode||null};
  check(!params.id || data.managerId!==params.id,'An employee cannot manage themselves');
  const e=await prisma.$transaction(async tx=>{const row=params.id?await tx.employee.update({where:{id:params.id},data}):await tx.employee.create({data:{...data,employeeCode:b.employeeCode||`EMP-${crypto.randomUUID().slice(0,8).toUpperCase()}`}});await audit(tx,user,params.id?'UPDATE':'CREATE','EMPLOYEE',row.id);return row;});
  return reply(employeeView(e),params.id?200:201);
}
export const employeesPOST=handler(saveEmployee,HR),employeePUT=handler(saveEmployee,HR);
export const employeeDELETE=handler(async({params,user})=>{await prisma.$transaction(async tx=>{await tx.employee.delete({where:{id:params.id}});await audit(tx,user,'DELETE','EMPLOYEE',params.id);});return reply({deleted:true});},HR);
const days=['MONDAY','TUESDAY','WEDNESDAY','THURSDAY','FRIDAY','SATURDAY','SUNDAY'];
const time=z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/);
const scheduleSchema=z.object({name:z.string().min(1),lines:z.array(z.object({day:z.string(),startTime:time,endTime:time,breakDuration:z.coerce.number().int().min(0)})).min(1)});
export const schedulesGET=handler(async({user,query})=>{const id=user.role==='EMPLOYEE'?user.employee?.workingScheduleId:null; if(user.role==='EMPLOYEE'&&!id)return reply([],200,{total:0});return list('workingSchedule',id?{id}:{},query,{scheduleDays:true},scheduleView);});
export const scheduleGET=handler(async({user,params})=>{const id=params.id==='me'?user.employee?.workingScheduleId:params.id; if(!id)return reply(null); if(user.role==='EMPLOYEE')check(id===user.employee?.workingScheduleId,'Access denied',403); const s=await prisma.workingSchedule.findUnique({where:{id},include:{scheduleDays:true}});check(s,'Schedule not found',404);return reply(scheduleView(s));});
async function saveSchedule({request,user,params}) {
  const b=scheduleSchema.parse(await request.json());const seen=new Set();let minutes=0;
  const lines=b.lines.map(l=>{const day=days.find(d=>d===l.day.toUpperCase()||d.slice(0,3)===l.day.toUpperCase());check(day&&!seen.has(day),'Each weekday must appear once');seen.add(day);const [sh,sm]=l.startTime.split(':').map(Number),[eh,em]=l.endTime.split(':').map(Number);const duration=eh*60+em-sh*60-sm-l.breakDuration;check(duration>0,'End time must follow start time and break must fit within the shift');minutes+=duration;return {dayOfWeek:day,startTime:new Date(`1970-01-01T${l.startTime}:00Z`),endTime:new Date(`1970-01-01T${l.endTime}:00Z`),breakMinutes:l.breakDuration};});
  const row=await prisma.$transaction(async tx=>{const data={name:b.name,type:'STANDARD',weeklyHours:minutes/60};const s=params.id?await tx.workingSchedule.update({where:{id:params.id},data}):await tx.workingSchedule.create({data});if(params.id)await tx.scheduleDay.deleteMany({where:{workingScheduleId:s.id}});await tx.scheduleDay.createMany({data:lines.map(l=>({...l,workingScheduleId:s.id}))});await audit(tx,user,'SAVE','SCHEDULE',s.id);return tx.workingSchedule.findUnique({where:{id:s.id},include:{scheduleDays:true}});});return reply(scheduleView(row),params.id?200:201);
}
export const schedulesPOST=handler(saveSchedule,HR),schedulePUT=handler(saveSchedule,HR);
export const scheduleDELETE=handler(async({params})=>{await prisma.workingSchedule.delete({where:{id:params.id}});return reply({deleted:true});},HR);
export const contractsGET=handler(async({query,params,user})=>{const employeeId=scope(user,params.id||query.employeeId);check(user.role==='EMPLOYEE'||HR.includes(user.role),'Access denied',403);return list('contract',{...(employeeId?{employeeId}:{}),...(query.status?{status:query.status}:{})},query,{employee:true,salaryStructure:true},contractView);});
export const contractGET=handler(async({params,user})=>{const c=await prisma.contract.findUnique({where:{id:params.id},include:{employee:true,salaryStructure:true}});check(c,'Contract not found',404);scope(user,c.employeeId);check(user.role==='EMPLOYEE'||HR.includes(user.role),'Access denied',403);return reply(contractView(c));});
const contractSchema=z.object({employeeId:z.string().min(1),wage:z.coerce.number().positive(),startDate:z.coerce.date(),endDate:z.coerce.date().nullish(),structureId:z.string().min(1),status:z.enum(['ACTIVE','ENDED','CANCELLED']),scheduleId:optional});
async function saveContract({request,user,params}) {
  const b=contractSchema.parse(await request.json());check(!b.endDate||b.endDate>=b.startDate,'Contract end date precedes start date');
  const row=await prisma.$transaction(async tx=>{const employee=await tx.employee.findUnique({where:{id:b.employeeId}});check(employee,'Employee not found',404);if(b.status!=='CANCELLED'){const overlap=await tx.contract.findFirst({where:{employeeId:b.employeeId,id:params.id?{not:params.id}:undefined,status:{not:'CANCELLED'},startDate:{lte:b.endDate||new Date('9999-12-31')},OR:[{endDate:null},{endDate:{gte:b.startDate}}]}});check(!overlap,'Contract dates overlap an existing contract',409,'OVERLAPPING_CONTRACT');}
    const data={employeeId:b.employeeId,wage:b.wage,startDate:b.startDate,endDate:b.endDate||null,salaryStructureId:b.structureId,status:b.status,department:employee.department,designation:employee.designation};const c=params.id?await tx.contract.update({where:{id:params.id},data}):await tx.contract.create({data});if(b.scheduleId)await tx.employee.update({where:{id:b.employeeId},data:{workingScheduleId:b.scheduleId}});await audit(tx,user,'SAVE','CONTRACT',c.id);return c;},{isolationLevel:'Serializable'});return reply(contractView(row),params.id?200:201);
}
export const contractsPOST=handler(saveContract,HR),contractPUT=handler(saveContract,HR);
export const contractDELETE=handler(async({params})=>{await prisma.contract.delete({where:{id:params.id}});return reply({deleted:true});},HR);
