// 個人データは端末内のIndexedDBにのみ保存する。
export const collections = ['user','dailyRecords','weightRecords','mealRecords','settings'];
let database;
function open() { return database ||= new Promise((resolve,reject)=>{const request=indexedDB.open('diet-app',1);request.onupgradeneeded=()=>collections.forEach(name=>request.result.createObjectStore(name,{keyPath:'id'}));request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error);request.onblocked=()=>reject(new Error('別のタブを閉じて再読み込みしてください'));}); }
async function operation(collection,mode,action){const db=await open();return new Promise((resolve,reject)=>{const tx=db.transaction(collection,mode);const request=action(tx.objectStore(collection));tx.oncomplete=()=>resolve(request.result);tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error||new Error('保存を中断しました'));});}
export const repository={all:name=>operation(name,'readonly',s=>s.getAll()),get:(name,id)=>operation(name,'readonly',s=>s.get(id)),put:(name,value)=>operation(name,'readwrite',s=>s.put({...value,updatedAt:new Date().toISOString()})),remove:(name,id)=>operation(name,'readwrite',s=>s.delete(id))};
// 全ストアを同じトランザクションで読み、途中更新の混ざらないバックアップを作る。
export async function snapshot(){const db=await open();return new Promise((resolve,reject)=>{const tx=db.transaction(collections,'readonly'),result={};for(const name of collections){const request=tx.objectStore(name).getAll();request.onsuccess=()=>result[name]=request.result;}tx.oncomplete=()=>resolve(result);tx.onabort=tx.onerror=()=>reject(tx.error);});}
// 検証済みデータだけを渡す。容量不足等は全ストアをロールバックする。
export async function restore(records,mode='merge'){
  if(!['merge','replace'].includes(mode))throw new Error('復元方式が不正です');
  const db=await open();return new Promise((resolve,reject)=>{
    const tx=db.transaction(collections,'readwrite');let added=0,skipped=0,cause;
    tx.oncomplete=()=>resolve({added,skipped});tx.onabort=()=>reject(cause||tx.error||new Error('復元を中断しました'));
    try{for(const name of collections){const store=tx.objectStore(name);if(mode==='replace')store.clear();for(const record of records[name]){
      if(mode==='replace'){store.put(record);added++;}
      else{const request=store.get(record.id);request.onsuccess=()=>{try{if(request.result){skipped++;}else{store.add(record);added++;}}catch(error){cause=error;tx.abort();}};}
    }}}catch(error){cause=error;tx.abort();}
  });
}
