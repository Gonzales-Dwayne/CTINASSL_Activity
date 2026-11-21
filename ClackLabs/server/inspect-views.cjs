const { MongoClient } = require('mongodb');
function shape(v) {
  if (Array.isArray(v)) return { array: v.length ? shape(v[0]) : null };
  if (v === null) return 'null';
  if (v && typeof v === 'object') {
    if (v._bsontype === 'ObjectId') return 'objectId';
    if (v instanceof Date) return 'date';
    return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, shape(x)]));
  }
  return typeof v;
}
(async()=>{
 const c=new MongoClient('mongodb://localhost:27017/'); await c.connect(); const db=c.db('clacklabs');
 for(const name of ['user_cart','order_details']){
  const info=(await db.listCollections({name}).toArray())[0];
  console.log('\n',name,info.type,'viewOn',info.options?.viewOn,'pipeline',JSON.stringify(info.options?.pipeline));
  const docs=await db.collection(name).find({}).limit(2).toArray();
  console.log(JSON.stringify(docs.map(shape),null,2));
 }
 console.log('\nusers');
 const users=await db.collection('users').find({},{projection:{passwordHash:0}}).toArray();
 console.log(users.map(u=>({id:u._id.toString(),name:u.name,email:u.email,role:u.role,createdAt:u.createdAt,updatedAt:u.updatedAt,addresses:u.addresses?.length,cart:u.cart?.length})));
 console.log('\ncarts');
 console.log(await db.collection('carts').find({}).toArray());
 await c.close();
})().catch(e=>{console.error(e);process.exit(1)});
