import { auth, db, createUserWithEmailAndPassword, signInWithEmailAndPassword, sendEmailVerification, onAuthStateChanged, signOut, ref, set, get, update } from './firebase-config.js';

window.git = function(sayfaAdi){
  document.querySelectorAll('.sayfa').forEach(s => s.classList.remove('aktif'));
  const hedef = document.getElementById('sayfa-' + sayfaAdi);
  if(hedef) hedef.classList.add('aktif');
  document.querySelectorAll('.nav-links button[data-sayfa]').forEach(b => {
    b.classList.toggle('aktif', b.dataset.sayfa === sayfaAdi);
  });
  window.scrollTo({top:0, behavior:'smooth'});
};

document.querySelectorAll('.nav-links button[data-sayfa]').forEach(btn => {
  btn.addEventListener('click', () => git(btn.dataset.sayfa));
});

function uyari(id, mesaj, tip='hata'){
  const el = document.getElementById(id);
  if(!el) return;
  el.textContent = mesaj;
  el.className = 'alert alert-' + tip + ' aktif';
  setTimeout(() => el.classList.remove('aktif'), 5000);
}

let captchaCevapDogru = 0;
function captchaOlustur(){
  const a = Math.floor(Math.random() * 10) + 1;
  const b = Math.floor(Math.random() * 10) + 1;
  captchaCevapDogru = a + b;
  const el = document.getElementById('captchaSoru');
  if(el) el.textContent = `${a} + ${b} = ?`;
}
captchaOlustur();

window.kayitOl = async function(){
  const mail = document.getElementById('kayitMail').value.trim();
  const sifre = document.getElementById('kayitSifre').value;
  const cevap = parseInt(document.getElementById('captchaCevap').value);

  if(!mail || !sifre){ uyari('kayitHata', 'Mail ve şifre zorunlu'); return; }
  if(sifre.length < 6){ uyari('kayitHata', 'Şifre min 6 karakter'); return; }
  if(cevap !== captchaCevapDogru){ uyari('kayitHata', 'Captcha yanlış'); captchaOlustur(); return; }

  try{
    const sonuc = await createUserWithEmailAndPassword(auth, mail, sifre);
    const uid = sonuc.user.uid;
    const apiKey = 'td_live_' + Array.from(crypto.getRandomValues(new Uint8Array(16))).map(b => b.toString(16).padStart(2, '0')).join('');

    await set(ref(db, 'kullanicilar/' + uid), {
      mail: mail,
      olusturma: Date.now(),
      aktif: true,
      apiKey: apiKey,
      kullanim: { buAy: 0, toplam: 0 }
    });

    await set(ref(db, 'apiKeys/' + apiKey), {
      sahip: uid,
      key: apiKey,
      olusturma: Date.now(),
      kullanim: { buAy: 0, toplam: 0 }
    });

    await sendEmailVerification(sonuc.user);
    uyari('kayitBasari', '✅ Kayıt başarılı!', 'basari');
    setTimeout(() => { git('panel'); panelYukle(sonuc.user); }, 1500);
  }catch(err){
    let msg = err.message;
    if(msg.includes('email-already-in-use')) msg = 'Bu mail zaten kayıtlı';
    else if(msg.includes('invalid-email')) msg = 'Geçersiz mail';
    else if(msg.includes('weak-password')) msg = 'Şifre çok zayıf';
    uyari('kayitHata', msg);
  }
};

window.girisYap = async function(){
  const mail = document.getElementById('girisMail').value.trim();
  const sifre = document.getElementById('girisSifre').value;
  if(!mail || !sifre){ uyari('girisHata', 'Mail ve şifre zorunlu'); return; }
  try{
    const sonuc = await signInWithEmailAndPassword(auth, mail, sifre);
    uyari('girisBasari', '✅ Giriş başarılı!', 'basari');
    setTimeout(() => { git('panel'); panelYukle(sonuc.user); }, 800);
  }catch(err){
    let msg = err.message;
    if(msg.includes('user-not-found') || msg.includes('wrong-password') || msg.includes('invalid-credential')) msg = 'Mail veya şifre hatalı';
    uyari('girisHata', msg);
  }
};

async function cikisYap(){ await signOut(auth); git('anasayfa'); }

onAuthStateChanged(auth, (user) => {
  const girisBtn = document.getElementById('girisBtn');
  const panelBtn = document.getElementById('panelBtn');
  const cikisBtn = document.getElementById('cikisBtn');
  if(user){
    girisBtn.style.display = 'none';
    panelBtn.style.display = 'inline-block';
    cikisBtn.style.display = 'inline-block';
    panelBtn.onclick = () => { git('panel'); panelYukle(user); };
    cikisBtn.onclick = cikisYap;
  }else{
    girisBtn.style.display = 'inline-block';
    panelBtn.style.display = 'none';
    cikisBtn.style.display = 'none';
    girisBtn.onclick = () => git('giris');
  }
});

window.panelYukle = async function(user){
  try{
    const snap = await get(ref(db, 'kullanicilar/' + user.uid));
    if(!snap.exists()) return;
    const data = snap.val();
    document.getElementById('panelMail').textContent = data.mail;
    document.getElementById('apiKeyAlan').textContent = data.apiKey || 'Yükleniyor...';
    document.getElementById('pAylik').textContent = data.kullanim?.buAy || 0;
    document.getElementById('pKalan').textContent = 100 - (data.kullanim?.buAy || 0);
    document.getElementById('pGunluk').textContent = '0';
  }catch(err){ console.error(err); }
};

window.apiKeyYenile = async function(){
  const user = auth.currentUser;
  if(!user) return;
  const yeniKey = 'td_live_' + Array.from(crypto.getRandomValues(new Uint8Array(16))).map(b => b.toString(16).padStart(2, '0')).join('');
  try{
    await update(ref(db, 'kullanicilar/' + user.uid), { apiKey: yeniKey });
    await set(ref(db, 'apiKeys/' + yeniKey), {
      sahip: user.uid, key: yeniKey, olusturma: Date.now(),
      kullanim: { buAy: 0, toplam: 0 }
    });
    document.getElementById('apiKeyAlan').textContent = yeniKey;
    alert('✅ API key yenilendi!');
  }catch(err){ alert('Hata: ' + err.message); }
};

window.apiKeyKopyala = function(){
  const key = document.getElementById('apiKeyAlan').textContent;
  navigator.clipboard.writeText(key);
  alert('📋 Kopyalandı!');
};

const drop = document.getElementById('drop');
const fileInput = document.getElementById('fileInput');
const onizleme = document.getElementById('onizleme');
const sonucAlan = document.getElementById('sonucAlan');

if(drop){
  drop.addEventListener('click', () => fileInput.click());
  drop.addEventListener('dragover', (e) => { e.preventDefault(); drop.classList.add('drag'); });
  drop.addEventListener('dragleave', () => drop.classList.remove('drag'));
  drop.addEventListener('drop', (e) => {
    e.preventDefault(); drop.classList.remove('drag');
    if(e.dataTransfer.files[0]) resmiIsle(e.dataTransfer.files[0]);
  });
  fileInput.addEventListener('change', (e) => {
    if(e.target.files[0]) resmiIsle(e.target.files[0]);
  });
}

async function resmiIsle(dosya){
  if(!dosya.type.startsWith('image/')){
    uyari('uyariHata', 'Sadece resim dosyası yükleyebilirsin');
    return;
  }
  if(dosya.size > 10 * 1024 * 1024){
    uyari('uyariHata', 'Maks 10 MB yükleyebilirsin');
    return;
  }

  const reader = new FileReader();
  reader.onload = (e) => {
    const img = new Image();
    img.onload = async () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      const pngBase64 = canvas.toDataURL('image/png');

      onizleme.src = pngBase64;
      onizleme.classList.add('aktif');

      try{
        const user = auth.currentUser;
        const cevap = await fetch('/api/convert', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            image: pngBase64,
            uid: user ? user.uid : null
          })
        });

        const data = await cevap.json();

        if(data.success){
          sonucAlan.innerHTML = `
            <div class="sonuc">
              <div>✅ Resmin hazır!</div>
              <span class="link">${data.url}</span>
              <div class="meta">Boyut: ${data.boyut}</div>
              <button class="btn btn-primary btn-sm" style="margin-top:10px" onclick="navigator.clipboard.writeText('${data.url}');alert('📋 Kopyalandı!')">📋 Linki Kopyala</button>
            </div>
          `;
          uyari('uyariBasari', '✅ Resim yüklendi!', 'basari');
        }else{
          uyari('uyariHata', data.error || 'Yükleme başarısız');
        }
      }catch(err){
        uyari('uyariHata', 'Bağlantı hatası: ' + err.message);
      }
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(dosya);
}

window.qrOlustur = function(){
  const metin = document.getElementById('qrMetin').value.trim();
  const boyut = document.getElementById('qrBoyut').value;
  const renk = document.getElementById('qrRenk').value.replace('#', '');

  if(!metin){ alert('Bir metin gir'); return; }

  const url = `https://api.qrserver.com/v1/create-qr-code/?size=${boyut}x${boyut}&data=${encodeURIComponent(metin)}&color=${renk}&bgcolor=FFFFFF`;
  document.getElementById('qrResim').src = url;
  document.getElementById('qrSonuc').classList.add('aktif');
};

window.qrIndir = function(){
  const src = document.getElementById('qrResim').src;
  if(!src){ alert('Önce QR oluştur'); return; }
  const a = document.createElement('a');
  a.href = src;
  a.download = 'qrkod.png';
  a.click();
};

git('anasayfa');
