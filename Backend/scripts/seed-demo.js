import {PrismaClient} from '@prisma/client';
import bcrypt from 'bcryptjs';
const db=new PrismaClient(),password='password123';
const roles=[['admin@peoplepay360.com','Administrator','ADMIN'],['payroll_manager@peoplepay360.com','Payroll Manager','HR_PAYROLL_MANAGER'],['payroll_user@peoplepay360.com','Payroll Officer','HR_PAYROLL_USER'],['hr_manager@peoplepay360.com','HR Manager','HR_MANAGER']];
try{
 const passwordHash=await bcrypt.hash(password,12);
 let schedule=await db.workingSchedule.findFirst({where:{name:{in:['Weekday Office Schedule','Standard 40 Hour Week']}}});
 if(schedule) schedule=await db.workingSchedule.update({where:{id:schedule.id},data:{name:'Weekday Office Schedule'}});
 else schedule=await db.workingSchedule.create({data:{name:'Weekday Office Schedule',type:'STANDARD',weeklyHours:40,scheduleDays:{create:['MONDAY','TUESDAY','WEDNESDAY','THURSDAY','FRIDAY'].map(dayOfWeek=>({dayOfWeek,isWorkingDay:true,startTime:new Date('1970-01-01T09:00:00Z'),endTime:new Date('1970-01-01T18:00:00Z'),breakMinutes:60}))}}});
 let structure=await db.salaryStructure.findFirst({where:{code:{in:['MONTHLY_SALARIED','DEMO_MONTHLY']}}});
 if(structure) structure=await db.salaryStructure.update({where:{id:structure.id},data:{name:'Monthly Salaried Employees',code:'MONTHLY_SALARIED',description:'Monthly salary rules for salaried employees'}});
 else structure=await db.salaryStructure.create({data:{name:'Monthly Salaried Employees',code:'MONTHLY_SALARIED',description:'Monthly salary rules for salaried employees',isActive:true,rules:{create:[{name:'Basic Salary',code:'BASIC',category:'BASIC',sequence:10,computationType:'PERCENTAGE',value:50,formula:'wage'},{name:'House Rent Allowance',code:'HRA',category:'ALLOWANCE',sequence:20,computationType:'PERCENTAGE',value:40,formula:'BASIC'},{name:'Special Allowance',code:'SPECIAL',category:'ALLOWANCE',sequence:30,computationType:'FORMULA',formula:'wage - BASIC - HRA'},{name:'Unpaid Leave Deduction',code:'UNPAID_LEAVE',category:'DEDUCTION',sequence:40,computationType:'FORMULA',formula:'wage / workingDays * unpaidLeaveDays'},{name:'Provident Fund',code:'PF',category:'DEDUCTION',sequence:50,computationType:'PERCENTAGE',value:12,formula:'BASIC'}]}}});
 let employee=await db.employee.findUnique({where:{employeeCode:'DEMO-001'}});
 if(!employee) employee=await db.employee.create({data:{employeeCode:'DEMO-001',firstName:'Ananya',lastName:'Sharma',email:'employee@peoplepay360.com',phone:'+91 90000 00001',dateOfJoining:new Date('2024-04-01'),department:'Engineering',designation:'Software Engineer',employeeType:'FULL_TIME',status:'ACTIVE',workingScheduleId:schedule.id,pan:'ABCDE1234F',uan:'100900000001',pfNumber:'PF-DEMO-001',bankName:'Demo Bank',bankAccountNumber:'1234567890',bankIFSC:'DEMO0001234',location:'Bengaluru'}});
 const contract=await db.contract.findFirst({where:{employeeId:employee.id,status:'ACTIVE'}});if(!contract)await db.contract.create({data:{employeeId:employee.id,startDate:new Date('2024-04-01'),department:employee.department,designation:employee.designation,wage:50000,salaryStructureId:structure.id,status:'ACTIVE'}});
 for(const [email,name,role] of roles)await db.user.upsert({where:{email},update:{name,role,passwordHash},create:{email,name,role,passwordHash}});
 await db.user.upsert({where:{email:'employee@peoplepay360.com'},update:{name:'Ananya Sharma',role:'EMPLOYEE',passwordHash,employeeId:employee.id},create:{email:'employee@peoplepay360.com',name:'Ananya Sharma',role:'EMPLOYEE',passwordHash,employeeId:employee.id}});
 for(const type of [{name:'Annual Leave',code:'ANNUAL',isPaid:true},{name:'Unpaid Leave',code:'UNPAID',isPaid:false}])await db.timeOffType.upsert({where:{code:type.code},update:type,create:{...type,unit:'DAYS',requiresAllocation:true,approvalRequired:true,payrollIntegration:true}});
 console.log('Demo accounts and representative HR/payroll setup are ready. Password: password123');
}finally{await db.$disconnect();}
