

const TOKEN = "8957741117:AAEmI4Tc7JSUemVUAnUzoYpD8J2p1aMCfyk";
const CHAT_ID = "-1004349739187";
const FIREBASE_DB = "https://turkdev-photourl-default-rtdb.firebaseio.com";

export default async function handler(req, res){
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if(req.method === 'OPTIONS') return res.status(200).end();
  if(req.method !== 'POST') return res.status(405).json({ error: 'Sadece POST' });

  try{
    const { image, uid, apiKey } = req.body;

    if(!image || !image.startsWith('data:image/')){
      return res.status(400).json({ error: 'Geçersiz resim' });
    }

    if(apiKey){
      const keyCevap = await fetch(`${FIREBASE_DB}/apiKeys/${apiKey}.json`);
      const keyData = await keyCevap.json();
      if(!keyData) return res.status(401).json({ error: 'Geçersiz API key' });
      const buAy = keyData.kullanim?.buAy || 0;
      if(buAy >= 100) return res.status(429).json({ error: 'Aylık limit doldu (100)' });
      await fetch(`${FIREBASE_DB}/apiKeys/${apiKey}/kullanim.json`, {
        method: 'PUT',
        body: JSON.stringify({ buAy: buAy + 1, toplam: (keyData.kullanim?.toplam || 0) + 1 })
      });
    }

    const base64Data = image.split(',')[1];
    const buffer = Buffer.from(base64Data, 'base64');
    const boyut = (buffer.length / 1024).toFixed(1) + ' KB';

    const formData = new FormData();
    formData.append('chat_id', CHAT_ID);
    formData.append('document', new Blob([buffer], { type: 'image/png' }), 'resim.png');

    const yukleCevap = await fetch(`https://api.telegram.org/bot${TOKEN}/sendDocument`, {
      method: 'POST',
      body: formData
    });
    const yukleData = await yukleCevap.json();

    if(!yukleData.ok) return res.status(500).json({ error: 'Depolama hatası' });

    const fileId = yukleData.result.document.file_id;
    const id = Array.from(crypto.getRandomValues(new Uint8Array(8))).map(b => b.toString(16).padStart(2, '0')).join('');

    await fetch(`${FIREBASE_DB}/resimler/${id}.json`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fileId: fileId,
        sahip: uid || 'anonim',
        olusturma: Date.now(),
        boyut: parseFloat(boyut),
        format: 'PNG'
      })
    });

    const host = req.headers.host ? 'https://' + req.headers.host : '';
    return res.status(200).json({
      success: true,
      url: `${host}/i/${id}.png`,
      boyut: boyut
    });

  }catch(err){
    return res.status(500).json({ error: err.message });
  }
      }
