const { MongoClient, ObjectId } = require('mongodb');
function typeOf(v){
 if(v===null) return 'null';
 if(v instanceof ObjectId) return 'objectId';
 if(v instanceof Date) return 'date';
 if(Array.isArray(v)) return 'array';
 if(typeof v==='object') return 'object';
 return typeof v;
}
function shape(v){
 if(Array.isArray(v)) return {array: v.length?shape(v[0]):null};
 if(v && typeof v==='object' && !(v instanceof ObjectId) && !(v instanceof Date)){
   return Object.fromEntries(Object.entries(v).map(([k,x])=>[k,shape(x)]));
 }
 return typeOf(v);
}
(async()=>{
 const c=new MongoClient('mongodb://localhost:27017/'); await c.connect();
 const db=c.db('clacklabs');
 const infos=await db.listCollections().toArray();
 for(const info of infos){
   const docs=await db.collection(info.name).find({}).limit(5).toArray();
   console.log('\n===',info.name,info.type,'count',await db.collection(info.name).countDocuments(),'===');
   if(info.type==='view'){ console.log('viewOn',info.options?.viewOn,'pipeline',JSON.stringify(info.options?.pipeline)); }
   if(info.options?.validator) console.log('validator',JSON.stringify(info.options.validator));
   console.log('indexes',JSON.stringify(await db.collection(info.name).indexes()));
   console.log('docs',JSON.stringify(docs.map(d=>shape(d)),null,2));
 }
 await c.close();
})().catch(e=>{console.error(e);process.exit(1)});
