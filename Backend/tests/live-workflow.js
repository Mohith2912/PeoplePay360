// Explicit integration exercise; creates labelled review records through real APIs.
// Run against a dedicated demo database, never a production database.
import {readFileSync,writeFileSync} from 'node:fs';
import assert from 'node:assert/strict';
const base=process.env.TEST_APP_URL||'http://localhost:3000';
const credentials=JSON.parse(readFileSync('../.local-runtime/demo-login.json','utf8'));
let cookie='';
async function call(path,method='GET',body,expected=200){const response=await fetch(base+'/api/'+path,{method,headers:{'Content-Type':'application/json',...(cookie?{cookie}:{})},body:body?JSON.stringify(body):undefined});const result=await response.json();assert.equal(response.status,expected,`${method} ${path}: ${JSON.stringify(result)}`);const setCookie=response.headers.get('set-cookie');if(setCookie)cookie=setCookie.split(';')[0];return result.data??result;}
await call('auth/login','POST',credentials);console.log('PASS real database login');
const key=Date.now().toString().slice(-7);
const schedule=await call('schedules','POST',{name:'Review schedule '+key,lines:['MON','TUE','WED','THU','FRI'].map(day=>({day,startTime:'09:00',endTime:'18:00',breakDuration:60}))},201);
const structure=await call('salary-structures','POST',{name:'Review salary '+key,rules:[{code:'BASIC',label:'Basic pay',type:'PERCENTAGE_OF_BASE',value:100,baseRuleCode:'wage'},{code:'UNPAID',name:'Unpaid leave',category:'DEDUCTION',computationType:'FORMULA',formula:'wage / workingDays * unpaidLeaveDays',sequence:2}]},201);
const employee=await call('employees','POST',{name:'Review Employee '+key,email:`review-${key}@example.test`,department:'Review',jobPosition:'Engineer',dateOfJoining:'2026-01-01',employeeType:'FULL_TIME',employmentStatus:'ACTIVE',scheduleId:schedule.id,bankAccountNumber:'1234567890',bankName:'Review Bank',ifscCode:'TEST0001234',panNumber:'ABCDE1234F'},201);
await call('contracts','POST',{employeeId:employee.id,wage:30000,startDate:'2026-01-01',endDate:null,structureId:structure.id,scheduleId:schedule.id,status:'ACTIVE'},201);
console.log('PASS employee → schedule → contract → salary structure');
const leaveType=await call('timeoff/types','POST',{name:'Review unpaid '+key,code:'UNPAID'+key,unit:'DAYS',isPaid:false,requiresAllocation:true},201);
const allocation=await call('timeoff/allocations','POST',{employeeId:employee.id,timeOffTypeId:leaveType.id,periodStart:'2026-01-01',periodEnd:'2026-12-31',allocatedAmount:2},201);
const leave=await call('timeoff/requests','POST',{employeeId:employee.id,timeOffTypeId:leaveType.id,fromDate:'2026-09-02',toDate:'2026-09-02',reason:'Review workflow'},201);
await call(`timeoff/requests/${leave.id}`,'PUT',{status:'APPROVED'});
const balances=await call('timeoff/allocations?employeeId='+employee.id);assert.equal(Number(balances[0].remainingAmount),1);
const attendance=await call('attendance','POST',{employeeId:employee.id,date:'2026-09-01',checkIn:'2026-09-01T09:00:00Z',breakMinutes:60},201);
let payrun=await call('payruns','POST',{name:'Review payroll '+key,salaryStructureId:structure.id,startDate:'2026-09-01',endDate:'2026-09-02',employeeIds:[employee.id]},201);
payrun=await call(`payruns/${payrun.id}/compute`,'POST',{expectedVersion:payrun.version});
await call(`payruns/${payrun.id}/validate`,'POST',{expectedVersion:payrun.version},422);
await call(`attendance/${attendance.id}`,'PUT',{employeeId:employee.id,date:'2026-09-01',checkIn:'2026-09-01T09:00:00Z',checkOut:'2026-09-01T18:00:00Z',breakMinutes:60,reason:'Complete review checkout'});
payrun=await call(`payruns/${payrun.id}/compute`,'POST',{expectedVersion:payrun.version});assert.equal(payrun.totalNet,15000);
await call(`payruns/${payrun.id}/compute`,'POST',{expectedVersion:1},409);
payrun=await call(`payruns/${payrun.id}/validate`,'POST',{expectedVersion:payrun.version});
payrun=await call(`payruns/${payrun.id}/pay`,'POST',{expectedVersion:payrun.version});assert.equal(payrun.status,'PAID');
await call(`payruns/${payrun.id}/compute`,'POST',{expectedVersion:payrun.version},400);
const payslip=await call('payslips/'+payrun.lines[0].payslipId);assert.equal(payslip.netPayable,15000);
const dashboard=await call('dashboard?department=Review');assert.ok(dashboard.kpis.totalNetSalaryPaid>=15000);
console.log('PASS leave balance → attendance correction → payroll → version guard → validation → paid history → live dashboard');
const employeeCredentials={email:`login-${key}@example.test`,password:credentials.password};
await call('auth/register','POST',{name:employee.name,...employeeCredentials,role:'EMPLOYEE',employeeId:employee.id},201);
await call('auth/login','POST',employeeCredentials);const own=await call('payslips/me');assert.ok(own.every(s=>s.employeeId===employee.id));await call('salary-structures','GET',undefined,403);await call('payruns','GET',undefined,403);
writeFileSync('../.local-runtime/last-workflow.json',JSON.stringify({employeeId:employee.id,payrunId:payrun.id,payslipId:payslip.id,employeeCredentials},null,2));
console.log('PASS employee-scoped payslips and payroll access restrictions');
