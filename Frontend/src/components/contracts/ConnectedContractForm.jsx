"use client";
import {useEffect,useState} from 'react';
import {apiClient} from '@/lib/api';
import {IntegrationForm} from '@/components/ui/IntegrationForm';

export function ContractForm(props){
 const [options,setOptions]=useState({employees:[],structures:[],schedules:[]});
 const [values,setValues]=useState(props.initialData||{});
 useEffect(()=>{Promise.all([apiClient.get('/api/employees?limit=50'),apiClient.get('/api/contract-options'),apiClient.get('/api/schedules?limit=50')]).then(([e,s,w])=>setOptions({employees:e.data.data,structures:s.data.data,schedules:w.data.data})).catch(()=>{});},[]);
 const employee=options.employees.find(item=>item.id===values.employeeId);
 const status=values.endDate&&new Date(`${values.endDate}T00:00:00Z`)<new Date(new Date().toISOString().slice(0,10)+'T00:00:00Z')?'ENDED':'ACTIVE';
 const fields=[{name:'employeeId',label:'Employee',options:options.employees.map(x=>({value:x.id,label:`${x.name} · ${x.employeeCode}`})),required:true},{name:'wage',label:'Monthly wage (INR)',type:'number',min:0.01,required:true},{name:'startDate',label:'Start date',type:'date',required:true},{name:'endDate',label:'End date',type:'date'},{name:'structureId',label:'Salary structure',options:options.structures.map(x=>({value:x.id,label:x.name})),required:true},{name:'scheduleId',label:'Working schedule',options:options.schedules.map(x=>({value:x.id,label:x.name}))}];
 const initialData={...props.initialData,startDate:props.initialData?.startDate?.slice(0,10)||'',endDate:props.initialData?.endDate?.slice(0,10)||''};
 return <div className="space-y-4">
  {employee&&<div className="grid gap-3 rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm sm:grid-cols-5"><div><span className="block text-xs text-slate-500">Employee ID</span><strong>{employee.employeeCode}</strong></div><div><span className="block text-xs text-slate-500">Department</span><strong>{employee.department}</strong></div><div><span className="block text-xs text-slate-500">Designation</span><strong>{employee.jobPosition}</strong></div><div><span className="block text-xs text-slate-500">Existing contracts</span><strong>{employee._count?.contracts||0}</strong></div><div><span className="block text-xs text-slate-500">Calculated status</span><strong className={status==='ACTIVE'?'text-emerald-700':'text-slate-600'}>{status}</strong></div></div>}
  <IntegrationForm {...props} fields={fields} initialData={initialData} onValuesChange={setValues} onSubmit={b=>props.onSubmit({...b,wage:Number(b.wage),endDate:b.endDate||null,scheduleId:b.scheduleId||employee?.scheduleId||null})}/>
 </div>;
}
