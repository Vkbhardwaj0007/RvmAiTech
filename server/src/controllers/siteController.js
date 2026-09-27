const SiteContent = require('../models/SiteContent');
async function getAll(req,res){
  const docs = await SiteContent.find().lean();
  res.json({ content: Object.fromEntries(docs.map(d=>[d.key,d.value])) });
}
async function getOne(req,res){
  const d = await SiteContent.findOne({ key:req.params.key }).lean();
  res.json({ key:req.params.key, value: d?.value ?? null });
}
async function set(req,res){
  const { key, value } = req.body;
  if(!key) return res.status(400).json({ message:'key required' });
  await SiteContent.findOneAndUpdate({ key }, { $set:{ value } }, { upsert:true });
  res.json({ ok:true });
}
module.exports = { getAll, getOne, set };
