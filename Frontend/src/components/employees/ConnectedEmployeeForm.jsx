"use client";
import {useState,useEffect} from 'react';
import {apiClient} from '@/lib/api';
import {IntegrationForm} from '@/components/ui/IntegrationForm';
export function EmployeeForm(props){
 const [schedules,setSchedules]=useState([]);useEffect(()=>{apiClient.get('/api/schedules?limit=200').then(r=>setSchedules(r.data.data.map(s=>({value:s.id,label:s.name})))).catch(()=>{});},[]);
 const fields=[{name:'name',label:'Full name',required:true},{name:'email',label:'Email',type:'email',required:true},{name:'phone',label:'Phone'},{name:'dateOfJoining',label:'Date of joining',type:'date',required:true},{name:'department',label:'Department',required:true},{name:'jobPosition',label:'Job position',required:true},{name:'employeeType',label:'Employee type',options:['FULL_TIME','PART_TIME','CONTRACT','INTERN'],defaultValue:'FULL_TIME',required:true},{name:'employmentStatus',label:'Status',options:['ACTIVE','NOTICE_PERIOD','TERMINATED'],defaultValue:'ACTIVE',required:true},{name:'scheduleId',label:'Working schedule',options:schedules,required:true,helper:'Required for attendance and payroll calculation.'},{name:'panNumber',label:'PAN'},{name:'bankName',label:'Bank name'},{name:'bankAccountNumber',label:'Bank account'},{name:'ifscCode',label:'IFSC'},{name:'uanNumber',label:'UAN'},{name:'pfNumber',label:'PF number'}];
 return <IntegrationForm {...props} fields={fields} initialData={{...props.initialData,dateOfJoining:props.initialData?.dateOfJoining?.slice(0,10)||''}}/>;
}
