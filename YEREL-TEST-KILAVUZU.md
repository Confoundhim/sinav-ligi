# Sınav Ligi - Yerel Test Ortamı Kurulumu (Ücretsiz)

## ⚠️ ÖNEMLİ NOT
Bu kılavuz yerel bilgisayarında (Windows) ücretsiz test etmen için hazırlandı. Gerçek sunucu (Natro vb.) için değil.

---

## 📋 GEREKSİNİMLER

### Windows İçin Gerekli Programlar (Hepsi Ücretsiz)

1. **Node.js 18+** → https://nodejs.org (LTS sürümünü indir)
2. **PostgreSQL** → https://www.postgresql.org/download/windows/
3. **Redis** → https://github.com/microsoftarchive/redis/releases (Redis-x64-3.0.504.msi)
4. **Git** → https://git-scm.com/download/win (Zaten kurulu)
5. **VS Code** → https://code.visualstudio.com/ (Önerilen editör)

---

## 🔧 ADIM ADIM KURULUM

### ADIM 1: Programları Kur

**Node.js:**
- İndir ve kur (Next, Next, Finish)
- Kurulumdan sonra Command Prompt (CMD) aç ve test et:
```cmd
node --version
npm --version
```

**PostgreSQL:**
- İndir ve kur
- Kurulum sırasında şifre belirle (örn: `admin123`)
- Port 5433 olarak kalabilir
- pgAdmin4 de kurulsun

**Redis:**
- Redis-x64-3.0.504.msi indir ve kur
- Kurulumdan sonra Services'de Redis çalışıyor olmalı

---

### ADIM 2: Veritabanı Oluştur

**pgAdmin4 ile:**
1. pgAdmin4'i aç
2. PostgreSQL 16 → Databases üzerine sağ tık → Create → Database
3. Database adı: `sinavligi`
4. Save

**Veya Command Line ile:**
```cmd
"C:\Program Files\PostgreSQL\16\bin\psql.exe" -U postgres
```
Şifreyi gir (kurulumda belirlediğin), sonra:
```sql
CREATE DATABASE sinavligi;
CREATE USER sinavuser WITH ENCRYPTED PASSWORD 'sifrenburaya';
GRANT ALL PRIVILEGES ON DATABASE sinavligi TO sinavuser;
\q
```

---

### ADIM 3: Projeyi Hazırla

**Proje dizinine git:**
```cmd
cd "C:\Harici Disk\Proje Market\İşler\İşler 2026\Dijital KPSS\SinavLigi"
```

---

### ADIM 4: Backend Kurulumu

```cmd
cd backend

# Bağımlılıkları yükle (biraz zaman alır)
npm install

# Environment dosyasını oluştur
# .env.example dosyasını .env olarak kopyala
# Windows Explorer'da backend klasörüne git, .env.example dosyasını bul
# Kopyala yapıştır ve adını .env olarak değiştir
```

**.env dosyasını düzenle (VS Code ile):**
```env
NODE_ENV=development
PORT=3005

# PostgreSQL (kendi şifreni yaz)
DATABASE_URL=postgresql://postgres:admin123@localhost:5432/sinavligi

# Redis
REDIS_URL=redis://localhost:6379

# JWT (rastgele uzun string)
JWT_SECRET=bu-cok-gizli-bir-sifre-olmali-en-az-32-karakter
JWT_REFRESH_SECRET=bu-da-baska-bir-gizli-sifre-olmali

# PayTR (TEST modu için - gerçek ödeme almaz)
PAYTR_MERCHANT_ID=TEST_ID
PAYTR_MERCHANT_KEY=TEST_KEY
PAYTR_MERCHANT_SALT=TEST_SALT
PAYTR_TEST_MODE=1

# Frontend (CORS için)
FRONTEND_URL=http://localhost:3000
```

**Prisma Migration Çalıştır:**
```cmd
npx prisma migrate dev
```
Sorarsa migration adı için: `init` yaz

**Seed Data Yükle:**
```cmd
npx prisma db seed
```
Bu komut KPSS dersleri, soru tipleri ve rozetleri yükler.

**Prisma Client Generate:**
```cmd
npx prisma generate
```

**Backend'i Başlat:**
```cmd
npm run start:dev
```

✅ Backend çalışıyor! `http://localhost:3005`
Swagger: `http://localhost:3005/docs`

**Yeni bir CMD penceresi aç (backend çalışmaya devam etsin)**

---

### ADIM 5: Frontend Kurulumu

```cmd
cd "C:\Harici Disk\Proje Market\İşler\İşler 2026\Dijital KPSS\SinavLigi\frontend"

# Bağımlılıkları yükle
npm install

# Environment dosyasını oluştur
# .env.example dosyasını .env.local olarak kopyala
```

**.env.local dosyasını düzenle:**
```env
NEXT_PUBLIC_API_URL=http://localhost:3005
```

**Frontend'i Başlat:**
```cmd
npm run dev
```

✅ Frontend çalışıyor! `http://localhost:3000`

---

## 🧪 TEST ETME

### 1. Tarayıcıda Aç
- `http://localhost:3000` → Ana sayfa (Karargah)

### 2. Kayıt Ol
- "Kayıt Ol" butonuna tıkla
- Email, şifre, ad bilgilerini gir
- KPSS seç

### 3. Giriş Yap
- Email ve şifre ile giriş yap

### 4. Admin Panelinden Soru Ekle
- `http://localhost:3000/admin/questions/new` git
- KPSS → Matematik → bir soru tipi seç
- Soru metni, şıklar, doğru cevap gir
- Kaydet

### 5. Özel Sınav Dene
- Karargah'dan "Özel Sınav Odası"na git
- Ders ve soru tipi seç
- Sınav oluştur ve çöz

### 6. Diğer Odaları Test Et
- Öğretmenler Odası (videolar)
- Gölge Rakip
- Cüzdan
- Profil
- Ayarlar

---

## 🐞 SORUN GİDERME

### "Cannot find module"
```cmd
cd backend
npm install

# veya
cd frontend
npm install
```

### "Database connection failed"
- PostgreSQL çalışıyor mu? Services'de kontrol et
- .env dosyasındaki DATABASE_URL doğru mu?
- Şifre doğru mu?

### "Redis connection failed"
- Redis çalışıyor mu? Services'de kontrol et
- .env'de REDIS_URL doğru mu?

### "Port 3005 already in use"
```cmd
# Hangi program kullanıyor bul
netstat -ano | findstr :3005

# Task Manager'dan o process'i sonlandır
# veya başka port kullan (.env'de PORT=3006 yap)
```

### "Migration failed"
```cmd
# Veritabanını sil ve yeniden oluştur (pgAdmin4 ile)
# Sonra tekrar dene:
npx prisma migrate dev
```

---

## 📁 ÖNEMLİ DOSYALAR

| Dosya | Açıklama |
|-------|----------|
| `backend/.env` | Backend ayarları (şifreler burada) |
| `frontend/.env.local` | Frontend ayarları |
| `backend/prisma/schema.prisma` | Veritabanı şeması |
| `backend/prisma/seed.js` | Başlangıç verileri |

---

## 🎯 TEST CHECKLIST

- [ ] Kayıt olma çalışıyor
- [ ] Giriş yapma çalışıyor
- [ ] Admin paneline erişebiliyorum
- [ ] Soru ekleyebiliyorum
- [ ] Özel sınav oluşturabiliyorum
- [ ] Sınav çözebiliyorum
- [ ] Sonuçları görebiliyorum
- [ ] Cüzdanımı görebiliyorum
- [ ] Profilimi düzenleyebiliyorum
- [ ] Öğretmenler Odası videoları görüyorum
- [ ] Gölge Rakip sınavı başlatabiliyorum

---

## 💡 İPUÇLARI

1. **Backend ve frontend aynı anda çalışmalı** - İki ayrı CMD penceresi aç
2. **Hata mesajlarını oku** - Çoğu zaman çözüm mesajın içinde
3. **.env dosyasını asla paylaşma** - Şifreler içeriyor
4. **Düzenli commit yap** - `git add . && git commit -m "test"`

---

## 🚀 SIRADAKİ ADIMLAR

Test ettikten sonra:
1. Soruları admin panelinden ekle (en az 50-100 soru)
2. Videoları hazırla veya YouTube linkleri ekle
3. Gerçek sunucuya taşıma kılavuzunu takip et

Başarılar! 🎉
