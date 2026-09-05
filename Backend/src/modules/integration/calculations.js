// Pure domain calculations: no database, UI state, or evaluation of JavaScript.
export function money(n) { if(!Number.isFinite(Number(n)))throw new Error('Invalid amount');return Math.round((Number(n)+Number.EPSILON)*100)/100; }
export function formula(source, values) {
  const tokens=String(source).trim().match(/\d+(?:\.\d+)?|[A-Za-z_][A-Za-z_0-9]*|[()+*/-]|\S/g)||[];let i=0;
  const atom=()=>{const t=tokens[i++];if(t==='-')return -atom();if(t==='+')return atom();if(t==='('){const n=sum();if(tokens[i++]!==')')throw new Error('Unclosed formula parenthesis');return n;}if(/^\d+(\.\d+)?$/.test(t))return Number(t);if(Object.hasOwn(values,t))return values[t];throw new Error(`Unknown formula variable: ${t}`);};
  const product=()=>{let n=atom();while(['*','/'].includes(tokens[i])){const op=tokens[i++],r=atom();if(op==='/'&&r===0)throw new Error('Division by zero');n=op==='*'?n*r:n/r;}return n;};
  const sum=()=>{let n=product();while(['+','-'].includes(tokens[i])){const op=tokens[i++],r=product();n=op==='+'?n+r:n-r;}return n;};
  const n=sum();if(i!==tokens.length||!Number.isFinite(n))throw new Error('Invalid formula');return n;
}
export function calculate(rules,context) {
  const values={...context},codes=new Set(),sequences=new Set();const lines=[];
  for(const r of [...rules].filter(r=>r.isActive!==false).sort((a,b)=>a.sequence-b.sequence)) {
    if(codes.has(r.code)||Object.hasOwn(context,r.code))throw new Error(`Duplicate/reserved rule code ${r.code}`);
    if(sequences.has(r.sequence))throw new Error('Rule sequences must be unique');codes.add(r.code);sequences.add(r.sequence);
    let n;if(r.computationType==='FORMULA')n=formula(r.formula,values);
    else if(r.computationType==='PERCENTAGE'){const base=r.formula||'wage';if(!Object.hasOwn(values,base))throw new Error(`Unknown rule dependency ${base}`);n=values[base]*Number(r.value)/100;}
    else n=Number(r.value);
    n=money(n);values[r.code]=n;lines.push({salaryRuleId:r.id||null,name:r.name,code:r.code,category:r.category,sequence:r.sequence,amount:n});
  }
  // GROSS and NET are display summaries, not additional earnings.
  const total=categories=>money(lines.filter(l=>categories.includes(l.category)).reduce((s,l)=>s+l.amount,0));
  const grossEarnings=total(['BASIC','ALLOWANCE']),totalDeductions=total(['DEDUCTION']),totalReimbursement=total(['REIMBURSEMENT']);
  return {lines,grossEarnings,totalDeductions,totalReimbursement,netPay:money(grossEarnings-totalDeductions),netTransfer:money(grossEarnings-totalDeductions+totalReimbursement)};
}
export function resolveContract(contracts,start,end) {
  const matches=contracts.filter(c=>c.status!=='CANCELLED'&&new Date(c.startDate)<=end&&(!c.endDate||new Date(c.endDate)>=start));
  if(matches.length!==1)throw new Error(matches.length?'Overlapping contracts in selected period':'No applicable contract');
  const c=matches[0];if(new Date(c.startDate)>start||(c.endDate&&new Date(c.endDate)<end))throw new Error('Contract does not cover the complete period; split the payroll period');return c;
}
export function workingDates(start,end,scheduleDays) {
  const names=['SUNDAY','MONDAY','TUESDAY','WEDNESDAY','THURSDAY','FRIDAY','SATURDAY'];const result=[];
  for(let d=new Date(start);d<=end;d.setUTCDate(d.getUTCDate()+1)) {const line=scheduleDays.find(l=>l.dayOfWeek===names[d.getUTCDay()]&&l.isWorkingDay!==false);if(line)result.push({date:d.toISOString().slice(0,10),hours:(new Date(line.endTime)-new Date(line.startTime))/3600000-line.breakMinutes/60});}
  return result;
}
