const TOKEN = "8957741117:AAEmI4Tc7JSUemVUAnUzoYpD8J2p1aMCfyk";
const FIREBASE_DB = "https://turkdev-photourl-default-rtdb.firebaseio.com";

export default async function handler(req, res){
  const { id } = req.query;

  if(!id) return res.status(400).send('ID gerekli');

  try{
    const snap = await fetch(`${FIREBASE_DB}/resimler/${id}.json`);
    const data = await snap.json();

    if(!data || !data.fileId) return res.status(404).send('Resim bulunamadı');

    const yolCevap = await fetch(`https://api.telegram.org/bot${TOKEN}/getFile?file_id=${data.fileId}`);
    const yolData = await yolCevap.json();

    if(!yolData.ok) return res.status(500).send('Dosya alınamadı');

    const resimCevap = await fetch(`https://api.telegram.org/file/bot${TOKEN}/${yolData.result.file_path}`);
    const buffer = Buffer.from(await resimCevap.arrayBuffer());

    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'public, max-age=31536000');
    res.send(buffer);

  }catch(err){
    res.status(500).send('Hata: ' + err.message);
  }
}
