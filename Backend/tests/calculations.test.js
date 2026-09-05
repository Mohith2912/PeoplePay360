import test from 'node:test';
import assert from 'node:assert/strict';
import { calculate,formula,resolveContract,workingDates } from '../src/modules/integration/calculations.js';
const r=(code,category,sequence,computationType,value,expression)=>({code,name:code,category,sequence,computationType,value,formula:expression});
test('gross/net summary rules are not counted twice and reimbursement stays separate',()=>{
  const result=calculate([r('BASIC','BASIC',10,'FIXED',30000),r('HRA','ALLOWANCE',20,'PERCENTAGE',40,'BASIC'),r('GROSS','GROSS',30,'FORMULA',null,'BASIC + HRA'),r('TAX','DEDUCTION',40,'FIXED',500),r('FUEL','REIMBURSEMENT',50,'FIXED',1000),r('NET','NET',60,'FORMULA',null,'GROSS - TAX')],{wage:30000});
  assert.equal(result.grossEarnings,42000);assert.equal(result.netPay,41500);assert.equal(result.netTransfer,42500);
});
test('formula refuses code execution, missing dependencies and division by zero',()=>{for(const s of ['process.exit()','1 / 0','UNKNOWN + 1'])assert.throws(()=>formula(s,{}));assert.equal(formula('-(2 + 3) * 4',{}),-20);});
test('duplicate rules and sequences are rejected',()=>assert.throws(()=>calculate([r('A','BASIC',1,'FIXED',1),r('B','ALLOWANCE',1,'FIXED',2)],{})));
test('contract selection preserves ended historical contracts and rejects overlaps',()=>{const start=new Date('2026-01-01'),end=new Date('2026-01-31'),c={status:'ENDED',startDate:'2025-01-01',endDate:'2026-01-31'};assert.equal(resolveContract([c],start,end),c);assert.throws(()=>resolveContract([c,c],start,end));});
test('working days are derived from actual weekly pattern',()=>{const result=workingDates(new Date('2026-09-01'),new Date('2026-09-07'),[{dayOfWeek:'MONDAY',startTime:'1970-01-01T09:00Z',endTime:'1970-01-01T18:00Z',breakMinutes:60}]);assert.equal(result.length,1);assert.equal(result[0].hours,8);});
