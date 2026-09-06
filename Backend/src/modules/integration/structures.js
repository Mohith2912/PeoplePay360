import { prisma } from '@/lib/prisma';
import { handler,reply,check,list,PAYROLL,MANAGERS,audit } from './http';
import { structureView } from './serializers';
import { calculate } from './calculations';
export function normalizeRules(rules) {
  check(Array.isArray(rules)&&rules.length>0,'Add at least one salary rule');
  return rules.map((r,i)=>{
    const type=r.computationType||r.calculationType||r.type;
    const computationType=type==='FORMULA'?'FORMULA':['PERCENTAGE','PERCENTAGE_OF_BASE','PERCENTAGE_DEDUCTION'].includes(type)?'PERCENTAGE':'FIXED';
    const category=['BASIC','ALLOWANCE','GROSS','DEDUCTION','NET','REIMBURSEMENT','CONTRIBUTION'].includes(r.category)?r.category:(r.category==='DEDUCTION'||String(type).includes('DEDUCTION'))?'DEDUCTION':r.code==='BASIC'?'BASIC':'ALLOWANCE';
    const value=Number(r.value??(computationType==='PERCENTAGE'?r.percentage:r.amount));
    check(r.code&&/^[A-Za-z_][A-Za-z0-9_]*$/.test(r.code)&&String(r.name||r.label||'').trim(),'Rule name and valid code are required');
    check(computationType==='FORMULA'||Number.isFinite(value)&&value>=0,'Rule value must be non-negative');
    return {name:r.name||r.label,code:r.code,category,sequence:Number(r.sequence??i+1),computationType,value:computationType==='FORMULA'?null:value,formula:computationType==='FORMULA'?r.formula:computationType==='PERCENTAGE'?(r.baseRuleCode||r.formula||'wage'):null,isActive:r.isActive!==false};
  });
}
export const structuresGET=handler(async({query})=>list('salaryStructure',{...(query.search?{name:{contains:query.search}}:{}),...(query.status?{isActive:query.status==='ACTIVE'}:{})},query,{rules:{orderBy:{sequence:'asc'}}},structureView),PAYROLL);
export const structureGET=handler(async({params})=>{const s=await prisma.salaryStructure.findUnique({where:{id:params.id},include:{rules:{orderBy:{sequence:'asc'}}}});check(s,'Salary structure not found',404);return reply(structureView(s));},PAYROLL);
export const previewPOST=handler(async({request})=>{const b=await request.json();check(Number(b.sampleWage)>0,'Enter a positive sample wage');const result=calculate(normalizeRules(b.rules),{wage:Number(b.sampleWage),workedDays:0,workingDays:0,unpaidLeaveDays:0,payableDays:0,overtimeHours:0});return reply({...result,items:result.lines});},MANAGERS);
async function save({request,params,user}) {
  const b=await request.json();check(String(b.name||'').trim(),'Structure name is required');const rules=normalizeRules(b.rules);calculate(rules,{wage:50000,workingDays:22,workedDays:22,payableDays:22,unpaidLeaveDays:0,overtimeHours:0});
  const result=await prisma.$transaction(async tx=>{const data={name:b.name,description:b.description||null,isActive:b.status!=='INACTIVE'};const s=params.id?await tx.salaryStructure.update({where:{id:params.id},data}):await tx.salaryStructure.create({data:{...data,code:b.code||`SAL-${crypto.randomUUID().slice(0,8)}`}});if(params.id){const old=await tx.salaryRule.findMany({where:{salaryStructureId:s.id}});await tx.payslipLine.updateMany({where:{salaryRuleId:{in:old.map(r=>r.id)}},data:{salaryRuleId:null}});await tx.salaryRule.deleteMany({where:{salaryStructureId:s.id}});}await tx.salaryRule.createMany({data:rules.map(r=>({...r,salaryStructureId:s.id}))});await audit(tx,user,'SAVE','SALARY_STRUCTURE',s.id);return tx.salaryStructure.findUnique({where:{id:s.id},include:{rules:true}});});return reply(structureView(result),params.id?200:201);
}
export const structuresPOST=handler(save,MANAGERS),structurePUT=handler(save,MANAGERS);
export const structureDELETE=handler(async({params})=>{await prisma.salaryStructure.update({where:{id:params.id},data:{isActive:false}});return reply({archived:true});},MANAGERS);
