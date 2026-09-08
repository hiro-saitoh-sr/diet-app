export function today(){const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;}
export function dayOffset(date,offset){const d=new Date(date+'T12:00:00');d.setDate(d.getDate()+offset);return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;}
export function movingAverage(records){return records.map(r=>{const values=records.filter(x=>x.date>=dayOffset(r.date,-6)&&x.date<=r.date);return {...r,weight:values.reduce((n,x)=>n+x.weight,0)/values.length};});}
