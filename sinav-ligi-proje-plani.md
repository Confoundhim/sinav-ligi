# Sınav Ligi Proje Planı

## 1. Yönetici Özeti

Sınav Ligi; YKS, KPSS, ALES, YDS, DGS ve LGS gibi Türkiye'deki yüksek hacimli sınav pazarına hitap eden, web ve mobil kanallarda çalışacak çok platformlu bir dijital sınav hazırlık ekosistemidir. Ürün, klasik dershane deneme modeli ile oyunlaştırılmış ilerleme sistemlerini, gerçek para değerine sahip burs mekaniklerini, yapay zekâ destekli öğretmen deneyimini ve rekabetçi sıralama altyapısını aynı çatı altında birleştirmeyi hedeflemektedir.

Projenin en güçlü farklaştırıcı unsurları; sonsuz ve tekrar etmeyen soru havuzu, sınav bazlı kişiselleştirilmiş çalışma akışları, haftalık ödüllü deneme sistemi, düello/rekabet kurgusu, AI hoca odaları ve ilerlemeyi görünür kılan başarı vitrini bileşenleridir. Ancak dokümandaki vizyonun ticari olarak sürdürülebilir, hukuken uyumlu ve teknik olarak ölçeklenebilir bir ürüne dönüşebilmesi için içerik üretimi, ödeme altyapısı, güvenlik, kopya tespiti, video üretim hattı, moderasyon, analitik ve operasyonel yönetim gibi temel ürünleşme katmanlarının da ilk günden planlanması gerekmektedir.

Bu plan; ürün gereksinimlerini sistematik biçimde ayrıştırmak, eksik alanları görünür kılmak, uygulanabilir teknik mimari önermek, MVP'den v2.0'a uzanan aşamalı yol haritası oluşturmak, temel riskleri değerlendirmek ve yaklaşık maliyet çerçevesi sunmak amacıyla hazırlanmıştır. Önerilen yaklaşım, önce doğrulanabilir çekirdek değer önerisini pazara çıkaran bir MVP ile başlamayı; ardından içerik ölçeği, canlı sınav operasyonu, burs süreçleri, topluluk özellikleri ve çoklu sınav genişlemesini kontrollü fazlar halinde devreye almayı esas almaktadır.

---

## 2. Dokümandan Çıkan Gereksinimler

Bu bölüm, proje dokümanında açıkça belirtilen ihtiyaçları işlevsel ve işlevsel olmayan gereksinimler olarak kategorize eder.

### 2.1 Ürün Kapsamı ve Platform Gereksinimleri

- Çok platformlu ürün:
  - Web uygulaması
  - Android uygulaması
  - iOS uygulaması
- Hedef sınavlar:
  - YKS
  - KPSS
  - ALES
  - YDS
  - DGS
  - LGS
- Her sınav için ayrı deneyim ve tasarım varyasyonu
- Hocaların sınavlar arasında ortak kullanılabilmesi

### 2.2 İş Modeli ve Gelir Gereksinimleri

- Her sınav için yıllık 250 TL kayıt ücreti
- Kullanıcının birden fazla sınava aynı anda kayıt olabilmesi
- Haftalık deneme sınavı katılım ücreti: 100 TL
- Haftalık deneme sınavı için minimum 1000 katılımcı şartı
- Haftalık burs ve aylık burs mekanikleri ile ödül ekonomisi

### 2.3 İçerik ve Soru Havuzu Gereksinimleri

- Sonsuz soru havuzu oluşturulması
- Soru havuzu, son 20 yıl ÖSYM sorularının:
  - dağılımına
  - konu yapısına
  - soru tiplerine
  - zorluk karakterine
  - çeldirici mantığına
  uygun olmalı
- Soru tekrarı kesinlikle engellenmeli
- Soru tiplerine göre sınıflandırılmış içerik yapısı bulunmalı
- Özel sınav oluşturma için ders, soru tipi, zorluk, soru sayısı bazında filtrelenebilir havuz olmalı
- Haftalık ortak sınavlar için admin tarafından seçilmiş ve kilitlenmiş soru setleri hazırlanabilmeli

### 2.4 AI Hoca / Öğretmenler Odası Gereksinimleri

- Her ders için farklı persona temelli AI öğretmen:
  - Türkçe: Kaşgarlı Mahmud
  - Matematik: Harezmi
  - Geometri: Ali Kuşçu
  - Tarih: Halil İnalcık
  - Coğrafya: Piri Reis
  - Vatandaşlık: Ahmet Cevdet
  - Güncel: Farabi
- Her hocanın ayrı tematik odası bulunmalı
- Her soru tipi için video içerikler olmalı
- Her soru tipi için 3 seviye:
  - Giriş
  - Orta
  - Zor
- Her seviyede 10 video
- Örnek olarak KPSS matematik için 26 soru tipi x 30 video = 780 video gereksinimi
- Videolarda:
  - ÖSYM çıkmış sorular çözülmeli
  - püf noktaları anlatılmalı
  - sık yapılan hatalar gösterilmeli
  - soru tuzakları açıklanmalı
- Isı haritası ile ilerleme takibi yapılmalı
- Hocalara özgü ses karakteri olmalı
- Ses tonu bilge ve otoriter olmalı

### 2.5 Gölge Rakip Odası Gereksinimleri

- Kullanıcı, her hafta bir önceki kendi performansına karşı yarışmalı
- Sistem, sonsuz soru havuzundan otomatik sınav oluşturmalı
- Haftalık gelişim raporları üretmeli
- Kullanıcı bazında zaman serisi karşılaştırma yapılmalı

### 2.6 Haftalık Deneme Sınavı Gereksinimleri

- Her Cumartesi 19:30'da ortak sınav yapılmalı
- Sınav soruları admin tarafından hazırlanmalı
- Katılım ücretli olmalı
- Sonuçlar Pazar 13:00'te açıklanmalı
- İlk 10 kullanıcıya 5000 TL burs verilmeli
- Yüksek eşzamanlı katılım desteklenmeli
- Sınav sırasında kopya tespiti mekanizması çalışmalı

### 2.7 Duello Odası Gereksinimleri

- Kullanıcı arkadaşlarıyla düello yapabilmeli
- Kullanıcı aynı rütbedeki rastgele biriyle eşleşebilmeli
- Düellolar 20 soruluk olmalı
- Sıralama puanları bahis olarak kullanılmalı
- Haftada 5 düello hakkı olmalı
- Pazartesi-Cuma arası her gün 1 hak prensibi uygulanmalı

### 2.8 Özel Sınav Odası Gereksinimleri

- Kullanıcı şunları seçebilmelidir:
  - ders
  - soru tipi
  - zorluk
  - soru sayısı
- Kişisel sınav anında oluşturulabilmeli
- Sonuç ve analiz hemen görüntülenebilmeli

### 2.9 Soru Karantinası Gereksinimleri

- Yanlış yapılan sorular otomatik olarak karantinaya alınmalı
- Karantinadan çıkarmak için:
  - ilgili ders videosu izlenmeli
  - 3/3 doğru yeniden çözüm yapılmalı
- Haftalık temizlenmeyen karantina soruları için eksi puan uygulanmalı

### 2.10 Başarı Müzesi Gereksinimleri

- Sertifika duvarı
- Kupa rafı
- Bilgelik ağacı görselleştirmesi
- Her tamamlanan soru tipi için ağaca dal+yaprak eklenmesi
- Tebrik et butonu
- Gizlilik ayarları
- Tasarım dili:
  - Sertifika duvarı: krem + antrasit + altın varak
  - Kupa rafı: terracotta

### 2.11 Puanlama ve Sıralama Gereksinimleri

- Türkiye geneli sıralama
- Anlık güncellenen puan panosu
- İnteraktif leaderboard
- Aylık puan sıralaması
- İlk 3 kullanıcıya 10.000 TL burs
- Prestij ödülleri / madalyalar:
  - Haftanın En Gelişeni
  - En Çok Düello Kazananı
  - benzeri ünvanlar

### 2.12 Anti-Cheat ve Sınav Güvenliği Gereksinimleri

- Sınav sırasında kopya tespiti yapılmalı
- Kullanıcıya 2 uyarı verilmeli
- 3. ihlalde sınavdan elenme uygulanmalı

### 2.13 Deneyim ve Tema Gereksinimleri

- Gece mesaisi modu:
  - 23:00-02:00 aktif deneyim
  - loş ışık teması
  - alfa dalga müziği
  - fısıltı modu
- Renk paleti:
  - Antrasit
  - Terracotta
  - Krem
- Her sınav için kendi tasarım varyantı olmalı

### 2.14 İşlevsel Olmayan Gereksinimler

- Ölçeklenebilirlik:
  - büyük katılımlı haftalık sınavlar
  - anlık puan güncellemeleri
  - çok sayıda eş zamanlı kullanıcı
- Güvenilirlik:
  - sınav saatlerinde kesintisiz çalışma
  - sonuçların zamanında açıklanması
- Tutarlılık:
  - puan, burs ve sıralama hesapları güvenilir olmalı
- İçerik kalitesi:
  - soru tekrarı olmamalı
  - sınav formatına sadakat korunmalı
- Marka bütünlüğü:
  - öğretmen persona'ları, sesler ve görsel dünya tutarlı olmalı

---

## 3. Eksik Analizi

Doküman güçlü bir vizyon ve oyunlaştırılmış çekirdek deneyim sunuyor; ancak gerçek bir ürünün pazara çıkabilmesi için aşağıdaki kritik alanlar mutlaka tasarlanmalıdır. Bu başlıklar, mevcut dokümanda ya hiç yoktur ya da operasyonel derinlikte tanımlanmamıştır.

### 3.1 Kimlik, Hesap ve Kullanıcı Yönetimi

Olmazsa olmaz gereksinimler:

- E-posta/telefon ile kayıt
- OTP veya e-posta doğrulama
- Giriş / çıkış
- Şifre sıfırlama
- Çoklu cihaz oturum yönetimi
- Sosyal giriş:
  - Google
  - Apple
  - mümkünse Facebook yerine daha düşük öncelik
- Profil yönetimi:
  - hedef sınav(lar)
  - sınıf / mezuniyet durumu
  - şehir
  - okul / kurum
  - fotoğraf / avatar
  - kullanıcı adı
- KVKK onayları
- Açık rıza yönetimi
- Hesap silme / veriyi taşıma süreçleri
- Yaş doğrulama ve veli onayı gereksinimi:
  - özellikle LGS ve reşit olmayan kullanıcılar için

### 3.2 Ödeme ve Finansal Operasyonlar

Dokümanda kayıt ücreti ve burslar tanımlı; fakat tam ödeme sistemi eksik. Gerekli unsurlar:

- Ödeme sağlayıcı entegrasyonu
- Kartla ödeme
- Tek seferlik ödeme
- Sınav bazlı satın alma
- Kampanya / kupon / promosyon altyapısı
- Cüzdan/bakiye yapısı
- İade kuralları
- Kısmi iade / tam iade senaryoları
- Fatura/e-arşiv süreçleri
- KDV ve vergi hesaplama
- Başarısız ödeme yönetimi
- Chargeback / itiraz yönetimi
- Burs ödemeleri için para çekme ve kimlik doğrulama süreci
- IBAN doğrulama
- Mali müşavirlik ve muhasebe entegrasyonları
- Fraud detection

### 3.3 Admin Paneli ve Operasyon Konsolu

Bu projede admin paneli ürünün kalbi niteliğindedir. İhtiyaçlar:

- Soru CMS
- Konu / alt konu / soru tipi hiyerarşisi yönetimi
- Soru kalite puanlama
- Soru havuzu versiyonlama
- Soru benzersizlik takibi
- Haftalık deneme oluşturma ve yayınlama
- Sonuç açıklama zamanlama ekranları
- Kopya ihlal kayıtlarını izleme
- Kullanıcı yönetimi
- Yasaklama / dondurma / inceleme
- Burs dağıtım onayı ve muhasebe iş akışı
- İçerik üretim pipeline izleme
- AI hoca içerik üretim dashboard'u
- Video yayınlama, yayından kaldırma, yeniden işleme
- Push / e-posta kampanyaları
- Moderasyon kuyruğu
- Destek talepleri yönetimi
- KPI panoları
- Operasyon logları ve denetim kayıtları

### 3.4 Bildirim ve Yeniden Etkileşim Sistemi

- Push bildirimleri
- E-posta bildirimleri
- Uygulama içi bildirim merkezi
- SMS bildirimleri (yüksek önemde opsiyonel)
- Bildirim tercihleri
- Otomatik tetiklenen mesajlar:
  - sınav yaklaşırken
  - sonuç açıklandığında
  - düello hakkı yenilendiğinde
  - karantina cezası yaklaşırken
  - burs kazandığında
  - haftalık gelişim özeti
- Segment bazlı kampanya gönderimleri
- Sessiz saatler ve frekans sınırı

### 3.5 AI Hoca Teknik Altyapısı

Persona isimleri tanımlanmış olsa da gerçek üretim mimarisi eksik. Gerekli yapı:

- Metin üretimi için LLM tabanlı içerik üretim sistemi
- TTS altyapısı
- Ses klonlama / marka uyumlu ses üretimi
- AI öğretmen kişilik kılavuzları
- Ders bazlı üslup ve terminoloji setleri
- Konuşma metni üretim kalite kontrolü
- Yanlış bilgi tespiti
- İnsan onay süreci
- Avatar / karakter görsel üretimi
- Video scene assembly pipeline
- Çoklu versiyon desteği:
  - kısa video
  - uzun anlatım
  - soru çözüm klibi
- Telif ve eğitim içeriği lisans uyumluluğu

### 3.6 Video Üretim Stratejisi

Dokümanda video hacmi çok yüksektir. Yalnızca bir branşta yüzlerce video ihtiyacı oluşmaktadır. Bu nedenle:

- Tam manuel üretim sürdürülebilir değildir
- Yarı otomatik içerik fabrikası kurulmalıdır
- İçerik üretimi için önerilen katmanlar:
  1. Soru tipi taksonomisi
  2. Ders şablonları
  3. Script üretimi
  4. Akademik onay
  5. TTS / sunum üretimi
  6. Video render
  7. Kalite denetimi
  8. Yayınlama
- Video tekrarını önleyen içerik varyasyon sistemi
- Yüksek öncelikli soru tiplerinden başlanması
- İzlenme / fayda skoruna göre içerik önceliklendirme
- Stüdyo çekimi mi AI video mu hibrit model mi kararının netleşmesi

### 3.7 Hukuk, KVKK ve Uyum

- KVKK aydınlatma metni
- Açık rıza metinleri
- Çocuk kullanıcılar için ek koruma süreçleri
- Veri minimizasyon politikası
- Veri saklama süreleri
- Hesap silme ve anonimleştirme
- Çerez politikası
- Gizlilik politikası
- Mesafeli satış sözleşmesi
- Kullanım şartları
- Burs süreçleri için hukuki çerçeve
- Yarışma/ödül yönetmeliği
- Ses ve persona kullanımı için marka/hukuk değerlendirmesi
- GDPR uyumu:
  - AB kullanıcı hedeflenmese bile ileride gereklilik olabilir

### 3.8 Moderasyon, Güvenlik ve Kötüye Kullanım Önleme

- Hesap paylaşımı tespiti
- Bot kullanımı tespiti
- Çoklu hesap / burs manipülasyonu önleme
- Mesajlaşma olacaksa içerik moderasyonu
- Uygunsuz kullanıcı adı / profil fotoğrafı filtreleme
- Ödeme sahteciliği tespiti
- Rate limiting
- Device fingerprinting
- Şüpheli davranış skorlaması
- DDoS koruması
- Web application firewall
- Güvenli secrets yönetimi
- Log redaction
- Penetrasyon testi

### 3.9 Analytics, BI ve Karar Destek Katmanı

- Funnel analizi:
  - kayıt
  - ödeme
  - ilk sınav
  - haftalık geri dönüş
- Öğrenme analitiği:
  - konu bazlı zorlanma
  - video izleme sonrası başarı artışı
  - karantina çözülme oranı
- Burs ROI analizi
- Soru kalite analitiği
- A/B test altyapısı
- Cohort analizi
- Retention dashboard
- İçerik tüketim analitiği
- Operasyonel SLA dashboard'ları

### 3.10 Ölçeklenebilirlik ve Gerçek Zamanlı Operasyon

- 1000+ eşzamanlı sınav oturumu
- Daha gerçekçi senaryoda 10.000+ kullanıcıya hazırlık
- Canlı leaderboard akışı
- Sonuç açıklama anında trafik patlaması
- Kuyruk sistemleri
- Cache stratejisi
- Read replica / partitioning planı
- Realtime servis izolasyonu
- Failover ve disaster recovery

### 3.11 Müşteri Destek ve Operasyon

- Destek merkezi
- Canlı destek / chatbot / ticket sistemi
- Sık sorulan sorular
- İade talepleri yönetimi
- Burs itiraz süreci
- Sınav kesintisi / teknik arıza telafi süreçleri
- SLA ve olay yönetimi

### 3.12 Onboarding ve Aktivasyon

- İlk kayıt akışı
- Hedef sınav seçimi
- Seviye belirleme testi
- İlk çalışma planı önerisi
- İlk düello / ilk özel sınav / ilk video deneyimi
- Bildirim izin akışı
- Öğrenciyi ilk 24 saatte aktive edecek görev zinciri

### 3.13 Sosyal Özellikler

- Arkadaş ekleme
- Arkadaş listesi
- Arkadaş daveti
- Tebrik et / alkışla
- Sosyal paylaşım kartları
- Gruplar / çalışma kulüpleri
- Mesajlaşma
- Arkadaşlar arası özel düello
- Sosyal feed

Not: İlk versiyonda mesajlaşma moderasyon yükü yaratacağı için ertelenebilir.

### 3.14 Offline Erişim

- Daha önce izlenen videoları çevrimdışı alma
- İnternet zayıfken deneme dışı soru çözme
- Çevrimdışı çözüm senkronizasyonu
- Düşük bant genişliği modları

### 3.15 Erişilebilirlik

- Ekran okuyucu uyumu
- Renk körlüğü uyumu
- Dinamik yazı boyutu
- Alt yazı / transkript
- Sesli komut veya sesli yönlendirme
- Klavye ile gezinme

### 3.16 SEO, ASO ve Büyüme Altyapısı

- Web landing page SEO
- Sınav bazlı organik içerik stratejisi
- App Store Optimization
- Kampanya sayfaları
- Referral ve davet sistemi
- Influencer / dershane ortaklığı tracking
- Kupon kodu altyapısı

### 3.17 Veli Paneli

Özellikle LGS segmenti için kritik bir katmandır:

- Veli hesabı
- Çocuk hesabı bağlantısı
- İlerleme raporları
- Bildirimler
- Harcama / ödeme geçmişi
- Ekran süresi / çalışma saati görünümü
- İzin / gizlilik yönetimi

### 3.18 Soru Havuzu Sürdürülebilirliği

Bu alan ürünün varlık sebebidir ve ayrı bir iş akışı gerektirir:

- Soru üretim editörleri
- Akademik denetim kurulu
- Benzerlik kontrol sistemi
- Soru yaşam döngüsü:
  - taslak
  - incelemede
  - onaylı
  - aktif
  - emekli
- İstatistik bazlı soru kalite skoru
- Hatalı soru geri çekme mekanizması
- Telif kontrolü

### 3.19 Kopya Tespiti Teknik Detayları

Dokümanda sadece uyarı/eleyici davranış tanımlıdır; teknik çerçeve eksiktir. Gerekli detaylar:

- Tam ekran dışına çıkma tespiti
- Sekme değiştirme tespiti
- Çok hızlı pencere geçişi
- Aynı IP / aynı cihazdan şüpheli eş zamanlılık
- Olağan dışı cevap ritmi
- Cevap desen benzerliği
- Kamera / mikrofon doğrulama kararı
- Face verification kullanılıp kullanılmayacağı
- Gizlilik etkisi değerlendirmesi
- Web ve mobil için ayrı anti-cheat stratejisi
- İhlal kayıtlarının insan incelemesine açılması

### 3.20 Ek Kritik Boşluklar

Dokümanda geçmeyen ancak önerilmesi gereken ilave başlıklar:

- Çok dilli destek ihtimali
- Kurumsal paketler:
  - dershane
  - okul
  - koçluk merkezi
- Denetim kayıtları
- Sözleşmeli içerik üretici yönetimi
- Feature flag altyapısı
- Test otomasyonu
- CI/CD
- Sürüm yönetimi
- Store release süreci
- Gözlemleme altyapısı:
  - log
  - metrics
  - tracing
- Veri ambarı
- Veri yedekleme ve geri dönüş planı
- Marka rehberi
- Kriz iletişim planı

---

## 4. Teknik Mimari Önerisi

Bu bölüm, hedef ölçek ve ürün karmaşıklığına uygun, gerçekçi ve aşamalı olarak büyüyebilen bir teknik mimari önerir.

### 4.1 Genel Mimari Yaklaşım

Önerilen yaklaşım:

- İstemci katmanı:
  - Web: Next.js
  - Mobil: React Native
- Backend:
  - Modüler monolith ile başlanması
  - Kritik trafik arttıkça belirli domain'lerin servisleştirilmesi
- İçerik/medya işleme:
  - ayrı asenkron worker katmanı
- Gerçek zamanlı özellikler:
  - event-driven altyapı + websocket katmanı
- Analitik:
  - operasyonel veri tabanı + event stream + data warehouse

Neden modüler monolith?

- MVP aşamasında mikroservis karmaşıklığını azaltır
- Domain sınırlarını koruyarak sonradan ayrıştırmaya izin verir
- Daha küçük ekiple daha hızlı teslim sağlar
- İçerik, ödeme, sınav, leaderboard ve kullanıcı yönetimi gibi alanlar modüller halinde tasarlanabilir

### 4.2 Önerilen Teknoloji Stack'i

#### Frontend

- Web:
  - Next.js 15+
  - TypeScript
  - Tailwind CSS
  - shadcn/ui veya benzeri component altyapısı
- Mobil:
  - React Native + Expo (erken faz)
  - Gerektiğinde bare workflow geçişi
- State yönetimi:
  - TanStack Query
  - Zustand
- Form yönetimi:
  - React Hook Form + Zod

#### Backend

- Node.js + NestJS
- TypeScript
- REST + GraphQL hibrit veya sadece REST + websocket
- Authentication:
  - JWT + refresh token
  - cihaz bazlı session kayıtları
- Asenkron işler:
  - BullMQ + Redis

#### Veritabanı

- PostgreSQL ana transactional database
- Redis:
  - cache
  - rate limit
  - leaderboard hızlandırma
  - session yardımcı katmanı
- Object Storage:
  - AWS S3 / Cloudflare R2
- Search:
  - OpenSearch veya Meilisearch
- Analytics warehouse:
  - BigQuery / ClickHouse / Snowflake içinden bütçeye göre seçim

#### Realtime

- WebSocket gateway
- Redis pub/sub veya NATS
- Canlı leaderboard ve düello durum güncellemeleri

#### DevOps / Infra

- Docker
- Kubernetes (v1.0 sonrası)
- Başlangıçta:
  - ECS / Render / Railway / Fly.io yerine
  - daha kontrollü yönetim için AWS ECS Fargate veya GCP Cloud Run önerilir
- CI/CD:
  - GitHub Actions
- Gözlemleme:
  - Sentry
  - Grafana
  - Prometheus
  - Loki / Datadog

### 4.3 Domain Bazlı Backend Modülleri

Önerilen ana modüller:

1. Auth & Identity
2. User Profile & Preferences
3. Catalog & Exam Enrollment
4. Payments & Billing
5. Question Bank
6. Exam Engine
7. Duel Engine
8. Ranking & Rewards
9. AI Teacher Content
10. Video Library
11. Notifications
12. Social Graph
13. Moderation & Trust
14. Admin Console API
15. Analytics Event Pipeline

### 4.4 Veritabanı ve Veri Modeli İlkeleri

Temel entity grupları:

- users
- user_profiles
- devices
- auth_sessions
- exams
- exam_tracks
- enrollments
- question_types
- question_templates
- questions
- question_versions
- question_similarity_index
- exam_sessions
- exam_attempts
- answers
- quarantine_items
- duel_matches
- duel_rounds
- ranking_snapshots
- reward_campaigns
- scholarships
- payouts
- videos
- video_scripts
- teacher_personas
- notifications
- badges
- museum_assets
- audit_logs
- support_tickets

İlkeler:

- Kritik finansal veriler için immutable ledger mantığı
- Puan ve ödül hesapları için event sourcing benzeri kayıt yaklaşımı
- Büyük leaderboard sorguları için precomputed snapshot tabloları
- Soru kalitesi ve benzerlik analizi için ayrı indeksler
- Soft delete yerine çoğu kritik alanda status transition yaklaşımı

### 4.5 Sınav Motoru Mimarisi

Sınav motoru şu yetenekleri desteklemelidir:

- Sınav şablonu tanımı
- Oturum oluşturma
- Soru dağıtımı
- Süre yönetimi
- Cevap kaydı
- Otomatik puanlama
- kopya sinyali işleme
- sonuç hesaplama
- sonuç yayınlama

Teknik öneriler:

- Her sınav attempt'i için immutable event log
- Cevaplar autosave ile kaydedilmeli
- Ağ kesintisine dayanıklı local buffering
- Haftalık sınavlarda soru seti önceden şifrelenmiş paket olarak istemciye gecikmeli açılabilir
- Sonuç hesaplama için batch + realtime hibrit yaklaşım

### 4.6 Realtime Leaderboard Mimarisi

Kullanım alanları:

- Türkiye sıralaması
- Haftalık sınav sonuç ekranı
- Düello canlı skor takibi
- Haftanın en gelişeni gibi rozet listeleri

Teknik yaklaşım:

- Redis sorted sets ile anlık skor sıralama
- Belirli aralıklarla PostgreSQL snapshot yazımı
- Kullanıcı yakın çevresi için contextual ranking sorguları
- Büyük sıralamalar için sayfalama ve segmentleme:
  - ülke
  - sınav
  - şehir
  - okul

### 4.7 Soru Havuzu ve Benzersizlik Altyapısı

Soru tekrarını engellemek için:

- Soru tipi bazlı template sistemi
- Parametrik soru üretimi
- Metin benzerlik analizi
- Görsel benzerlik analizi
- Embedding tabanlı semantic similarity taraması
- Onay öncesi benzerlik skoru eşik kontrolü
- Aynı kullanıcıya çok benzer soru gelmesini engelleyen delivery history sistemi

Önerilen pipeline:

1. Müfredat ve soru tipi haritası
2. Template ve çözüm mantığı tanımı
3. AI destekli varyasyon üretimi
4. Akademik editör kontrolü
5. Benzerlik ve kalite analizi
6. Onay ve yayınlama

### 4.8 AI Hoca ve Video Pipeline Önerisi

#### İçerik Üretim Hattı

1. Soru tipi / konu seçimi
2. Öğrenme hedefi çıkarımı
3. Ders script üretimi
4. Akademik doğrulama
5. Persona'ya uygun üslup dönüşümü
6. TTS üretimi
7. Slayt / animasyon / çözüm ekranı oluşturma
8. Video birleştirme ve render
9. QA kontrolü
10. CDN'e yayın

#### TTS ve Ses Katmanı

Alternatifler:

- ElevenLabs
- Azure Speech
- Google Cloud TTS
- OpenAI TTS

Öneri:

- MVP: dış servis TTS
- v1.0: ana hocalar için premium ses profili
- v2.0: maliyet düşürmek için hibrit / özel ses modeli değerlendirmesi

#### Video Üretim Stratejisi

Pragmatik yaklaşım:

- MVP'de tüm soru tipleri için video üretmeye çalışılmamalı
- En yüksek talep gören ders ve soru tipleri önceliklendirilmeli
- İlk fazda:
  - top 20 soru tipi
  - giriş ve orta seviye
  - yüksek trafik üreten senaryolar
- Video formatları:
  - çözüm videosu
  - mini konu anlatımı
  - karantina kurtarma videosu

### 4.9 Anti-Cheat Teknik Mimari

Kademeli yaklaşım önerilir:

#### Seviye 1: Düşük sürtünmeli temel koruma

- fullscreen ayrılma tespiti
- tab switch tespiti
- copy/paste engelleme
- developer tools uyarıları
- cihaz ve oturum doğrulama

#### Seviye 2: Davranışsal analiz

- cevaplama süresi anomalileri
- imkânsız hızda çözüm desenleri
- toplu cevap senkronu
- aynı ağ / cihaz kümelenmesi

#### Seviye 3: Yüksek riskli sınavlar için ek doğrulama

- ön kamera doğrulaması
- selfie match
- session recording (hukuki değerlendirme sonrası)

Not: Kamera/mikrofon kullanımı gizlilik maliyetini ciddi artıracağından MVP'de önerilmez.

### 4.10 Bildirim Mimarisi

- Notification service
- Template engine
- Segment engine
- Provider abstraction
- Gönderim logları
- Delivery/open/click tracking

Kanal öncelikleri:

- Mobil push
- In-app
- E-posta
- SMS yalnızca kritik senaryolar

### 4.11 Güvenlik Mimarisi

- OAuth ve token rotation
- Hassas alanlarda RBAC
- Admin paneli için MFA
- Şifrelerin Argon2 ile hashlenmesi
- WAF
- IP ve device risk scoring
- Secrets manager
- Audit logging
- Dosya yüklemelerinde malware scanning

### 4.12 Çok Platform Stratejisi

Öneri:

- Web ve React Native code sharing maksimum seviyede tutulmalı
- Tasarım sistemi ortak kurulmalı
- Sınav akışı gibi kritik ekranlar native performance ihtiyacına göre optimize edilmeli
- iOS / Android notification ve background davranış farklılıkları erken ele alınmalı

---

## 5. Aşamalı Yol Haritası

Bu yol haritası, vizyonu tek seferde inşa etmek yerine riski azaltan ve öğrenmeyi hızlandıran fazlara böler.

### 5.1 Faz 0 - Strateji ve Hazırlık (4-6 Hafta)

Amaç: ürünün ticari ve teknik temelini doğrulamak.

Kapsam:

- Ürün keşfi ve kullanıcı personları
- Sınav bazlı müfredat ve soru tipi haritası
- Hukuki çerçeve taslağı
- Marka dili ve görsel yön belirleme
- Teknik mimari kararları
- İçerik üretim operasyon modelinin netleştirilmesi
- Admin paneli bilgi mimarisi
- Ölçüm planı ve KPI tanımı

Çıktılar:

- Product requirements document
- Teknik mimari dokümanı
- Soru üretim kuralları
- İlk içerik üretim SOP'leri
- MVP backlog'u

### 5.2 Faz 1 - MVP (3-4 Ay)

Amaç: çekirdek değer önerisini sınırlı ama gerçek kullanımla piyasaya çıkarmak.

#### MVP'de Olması Gerekenler

- Kullanıcı kayıt / giriş / profil
- Sınav seçimi ve yıllık kayıt satın alma
- Temel ödeme entegrasyonu
- Soru havuzu çekirdeği
- Özel Sınav Odası
- Gölge Rakip Odası'nın temel versiyonu
- Soru Karantinası temel akışı
- Sıralama sistemi temel versiyonu
- Rozet/madalya temel seti
- AI Hoca odalarının text + sınırlı video destekli ilk versiyonu
- Haftalık gelişim raporları
- Admin panel:
  - kullanıcı yönetimi
  - soru ekleme
  - sınav yayınlama
  - rapor görüntüleme
- Push ve e-posta bildirimlerinin temel versiyonu

#### MVP'de Bilinçli Olarak Ertelenmesi Önerilenler

- Gerçek para ödüllü büyük haftalık deneme
- Tam kapsamlı düello sistemi
- Geniş sosyal özellikler / mesajlaşma
- Gece mesaisi deneyiminin tüm medya bileşenleri
- Başarı müzesinin zengin 3D/gelişmiş versiyonu
- Veli paneli
- Offline çözümleme
- Kamera tabanlı anti-cheat

#### MVP Başarı Kriterleri

- Ücretli kayıt dönüşüm oranı
- İlk 7 gün aktivasyon
- Haftalık aktif kullanıcı
- Özel sınav tamamlama oranı
- Karantina çözülme oranı
- İçerik memnuniyeti

### 5.3 Faz 2 - v1.0 (4-6 Ay)

Amaç: rekabetçi deneyimi ve gelir modelini güçlendirmek.

#### v1.0 Özellikleri

- Haftalık deneme sınavı altyapısı
- Min 1000 eşzamanlı katılıma hazırlık
- Sonuç açıklama ve burs puanlama sistemi
- Düello Odası
- Arkadaş ekleme
- Tebrik et özelliği
- Başarı müzesi genişletilmiş sürüm
- Isı haritası ilerleme ekranları
- AI hoca video kataloğunun ciddi genişlemesi
- Gelişmiş anti-cheat seviye 1 + seviye 2
- Burs operasyon paneli
- Referral sistemi
- Kampanya ve kupon altyapısı
- Analitik dashboard'lar

#### v1.0 Operasyonel Gereksinimleri

- Destek ekibi
- İçerik kalite ekibi
- Finans operasyonu
- Sınav günü canlı operasyon prosedürleri
- Incident management playbook

### 5.4 Faz 3 - v2.0 (6-9 Ay)

Amaç: ürünü platform seviyesine taşımak ve savunulabilirlik yaratmak.

#### v2.0 Özellikleri

- Çok daha geniş AI video üretim otomasyonu
- Veli paneli
- Kurumsal paketler
- Offline erişim
- Gelişmiş sosyal kulüpler / çalışma grupları
- İleri anti-cheat seçenekleri
- Segment bazlı canlı etkinlikler
- Kişisel çalışma planı ve AI koç
- Store/SEO/ASO büyüme motorları
- Çoklu sınav portföyünün derinleştirilmesi
- Gelişmiş veri bilimi ve başarı tahmin modelleri

### 5.5 Önerilen Önceliklendirme Mantığı

Öncelik sırası:

1. Gelir üreten çekirdek akışlar
2. İçerik sürdürülebilirliği
3. Öğrenme sonuçlarını iyileştiren mekanikler
4. Rekabet ve sosyal retention özellikleri
5. Gelişmiş atmosfer ve premium deneyim katmanları

### 5.6 Örnek Zaman Çizelgesi

Gerçekçi ekip ve iyi karar alma ile:

- Faz 0: 1-1.5 ay
- MVP: 3-4 ay
- v1.0: +4-6 ay
- v2.0: +6-9 ay

Toplam ilk güçlü ürün yolculuğu: yaklaşık 12-18 ay

---

## 6. Risk Analizi

| Risk | Etki | Olasılık | Açıklama | Önlem |
|---|---|---:|---|---|
| Soru havuzunun sürdürülememesi | Çok yüksek | Yüksek | Sonsuz soru vaadi operasyonel olarak zor | Template tabanlı üretim, editör kurulu, benzerlik kontrol sistemi |
| Video üretim maliyetinin patlaması | Çok yüksek | Yüksek | Binlerce video manuel üretilemez | Önceliklendirilmiş katalog, yarı otomatik pipeline, en çok kullanılan tiplere odak |
| Haftalık sınavda ölçek sorunu | Çok yüksek | Orta | Trafik patlaması itibar kaybına yol açar | Load test, queue, pre-warm, cache, canlı operasyon runbook |
| Burs suiistimali | Yüksek | Orta | Çoklu hesap, sahte kullanıcı, itirazlar | KYC, device fingerprint, risk scoring, manuel inceleme |
| Anti-cheat yetersizliği | Çok yüksek | Orta | Ödüllü sınavlarda güven kaybı olur | Çok katmanlı davranışsal tespit, ihlal logları, yüksek riskli segmentte ek doğrulama |
| Hukuki uyumsuzluk | Çok yüksek | Orta | KVKK, çocuk verisi, yarışma mevzuatı kritik | Erken hukuk danışmanlığı, açık rıza, veri saklama politikası |
| Ödeme/iadelerde operasyon yükü | Yüksek | Orta | İptal, hata, chargeback süreçleri büyür | Net iade politikası, muhasebe entegrasyonu, otomasyon |
| AI içerikte yanlış bilgi | Yüksek | Yüksek | Eğitim ürününde güveni bozar | İnsan onay süreci, kalite kontrol checklist'i |
| Öğretmen persona kullanımında marka/hukuk riski | Orta | Orta | Tarihi kişilik isimleri ve sunum biçimi tartışma yaratabilir | Hukuki ve marka değerlendirmesi, alternatif isim stratejisi |
| Çok platform yönetim karmaşıklığı | Orta | Yüksek | Web+iOS+Android aynı anda zordur | Ortak tasarım sistemi, paylaşımlı kod, web+mobil çekirdek odak |
| Düşük retention | Çok yüksek | Orta | İlk heyecan sonrası kullanım düşebilir | Onboarding, streak, karantina, haftalık hedefler, sosyal katman |
| Haftalık ödül ekonomisinin finansal yükü | Yüksek | Orta | Burslar gelir-gider dengesini bozabilir | LTV/CAC modeli, burs limitleri, sponsor gelirleri |
| App store onay riskleri | Orta | Düşük | Ödeme, ödül, yarışma akışları sorgulanabilir | Store policy uyumu, erken inceleme |
| Canlı sınavda hata sonrası itibar kaybı | Çok yüksek | Orta | Eğitim pazarında güven zor kazanılır | Kaos testleri, yedek plan, telafi mekanizması |
| Sosyal özelliklerde moderasyon yükü | Orta | Orta | Mesajlaşma toksisite riski yaratır | Mesajlaşmayı geç faza ertele, otomatik filtreler |
| Maliyetlerin gelirden hızlı büyümesi | Çok yüksek | Yüksek | Video, AI, burs ve altyapı maliyetlidir | Fazlı ürün çıkışı, birim ekonomisi takibi, kullanım başına maliyet optimizasyonu |

---

## 7. Maliyet Tahmini

Bu maliyetler yaklaşık seviyededir ve kapsam, trafik, içerik üretim yöntemi, servis sağlayıcı ve ekip yapısına göre ciddi değişebilir. Aşağıdaki rakamlar profesyonel planlama için başlangıç referansı olarak düşünülmelidir.

### 7.1 Varsayım Seti

Tahmin varsayımları:

- İlk yıl kontrollü lansman
- 5.000-20.000 kayıtlı kullanıcı aralığı
- Haftalık aktif kullanıcı sayısı kademeli büyüyor
- İlk aşamada birkaç sınav ve sınırlı video kataloğu
- AI + insan hibrit içerik üretim modeli

### 7.2 Aylık Teknik Altyapı Tahmini

| Kalem | MVP Aylık | v1.0 Aylık | Not |
|---|---:|---:|---|
| Uygulama sunucuları | 25.000 TL | 60.000 TL | API, worker, admin |
| PostgreSQL yönetilen DB | 10.000 TL | 30.000 TL | Yedekli yapı ile artar |
| Redis | 5.000 TL | 15.000 TL | Cache + leaderboard |
| Object storage + CDN | 8.000 TL | 25.000 TL | Video hacmine bağlı |
| Monitoring / logging | 5.000 TL | 15.000 TL | Sentry, log, metrics |
| Websocket / realtime | 3.000 TL | 12.000 TL | Trafiğe göre |
| Arama / benzerlik altyapısı | 5.000 TL | 20.000 TL | OpenSearch / vektör katmanı |
| Toplam yaklaşık | 61.000 TL | 177.000 TL | Trafik arttıkça yükselir |

### 7.3 AI / TTS / Video İşleme Aylık Tahmini

| Kalem | MVP Aylık | v1.0 Aylık | Not |
|---|---:|---:|---|
| TTS API | 20.000 TL | 75.000 TL | Video hacmine bağlı |
| LLM içerik üretimi | 15.000 TL | 50.000 TL | Script ve içerik üretimi |
| Video render pipeline | 10.000 TL | 40.000 TL | Bulut render veya servis |
| Görsel/avatar üretimi | 5.000 TL | 20.000 TL | Yüksek hacimde artar |
| QA otomasyonu ve araçlar | 3.000 TL | 10.000 TL | İçerik işleme araçları |
| Toplam yaklaşık | 53.000 TL | 195.000 TL | |

### 7.4 İçerik ve Operasyon Maliyeti

| Kalem | Aylık Tahmin | Not |
|---|---:|---|
| Akademik editörler | 120.000-300.000 TL | Branş sayısına göre |
| Soru yazım/inceleme ekibi | 150.000-400.000 TL | İçerik hacmi kritik |
| Operasyon ve destek | 80.000-200.000 TL | Canlı sınav destek yükü |
| Tasarım / motion / medya | 60.000-200.000 TL | Video kalitesine göre |
| Hukuk / mali müşavirlik | 25.000-75.000 TL | Dış kaynaklı olabilir |

### 7.5 Burs Havuzu Maliyeti

Dokümandaki ödül sistemine göre teorik maksimum yük yüksektir.

#### Haftalık Deneme Bursu

- İlk 10 kişiye 5.000 TL = haftalık 50.000 TL
- Aylık yaklaşık = 200.000 TL

#### Aylık Genel Sıralama Bursu

- İlk 3 kişiye 10.000 TL = aylık 30.000 TL

#### Toplam Burs Havuzu

- Aylık yaklaşık sabit görünür yük: 230.000 TL

Not:

- Bu modelin sürdürülebilirliği için sponsor, marka ortaklığı veya belirli gelir eşiğine bağlı dinamik burs modeli düşünülmelidir.
- Aksi halde erken fazda ciddi nakit baskısı oluşturur.

### 7.6 Ödeme Komisyonları

Kabaca:

- Sanal POS / ödeme altyapısı komisyonu: %2.5 - %4.5 + sabit ücret
- İade ve chargeback ek maliyetleri
- Taksit / kampanya maliyetleri ayrıca değişebilir

Örnek:

- Aylık 1.000.000 TL tahsilatta %3.5 komisyon yaklaşık 35.000 TL komisyon yükü oluşturur

### 7.7 Toplam Aylık Çalışma Aralığı

Gerçekçi ilk yıl aralığı:

- Düşük ölçek kontrollü MVP operasyonu:
  - 400.000 TL - 900.000 TL / ay
- v1.0 büyüme ve canlı sınav operasyonu:
  - 900.000 TL - 2.500.000 TL / ay

Bu aralığın geniş olmasının nedeni; içerik üretiminin manuel mi yarı otomatik mi yürüdüğü, burs bütçesinin sabit mi dinamik mi olduğu ve video kataloğunun ne kadar agresif büyütüldüğüdür.

### 7.8 Birim Ekonomi Notu

Takip edilmesi gereken ana metrikler:

- Ücretli kullanıcı başı gelir
- Kullanıcı başı içerik tüketim maliyeti
- Haftalık aktif kullanıcı başı altyapı maliyeti
- Ödül / burs maliyetinin gelir oranı
- İlk 90 gün retention
- Payback süresi

---

## 8. Karar Notları ve Varsayımlar

### 8.1 Ana Karar Notları

- Proje tek seferde tam vizyonla değil, fazlı olarak ilerlemelidir.
- MVP'nin amacı “tüm özellikleri göstermek” değil, “çekirdek değerin para ödeyen kullanıcıda karşılık bulduğunu doğrulamak” olmalıdır.
- İlk sürümde en kritik yatırım alanı soru havuzu sürdürülebilirliği ve sınav motorudur.
- Haftalık ödüllü sınav sistemi, anti-cheat ve operasyon olgunlaşmadan tam ölçek açılmamalıdır.
- AI hoca deneyimi güçlü bir marka farkı yaratabilir; ancak akademik doğruluk insan kontrolü olmadan bırakılmamalıdır.
- Video stratejisi, yüksek hacimli ama önceliklendirilmiş katalog mantığında ilerlemelidir.
- Sosyal mesajlaşma, moderasyon yükü nedeniyle erken aşamada çekirdek öncelik değildir.
- LGS segmenti için veli paneli stratejik olabilir; ancak erken aşamada ayrı faza bırakılmalıdır.

### 8.2 Ürün Varsayımları

- Kullanıcılar rekabetçi ve ödüllü sistemi motive edici bulacaktır.
- Yıllık sınav bazlı ücret modeli kabul görecektir.
- Aynı kullanıcı birden fazla sınava kayıt olabilecektir.
- Gölge Rakip ve Karantina gibi mekanikler retention üzerinde olumlu etki yaratacaktır.
- Türkiye genelinde sıralama deneyimi ürünün sosyal kanıtını artıracaktır.

### 8.3 Teknik Varsayımlar

- Tek bir modüler backend ile MVP ve erken v1.0 yönetilebilir.
- PostgreSQL + Redis kombinasyonu ilk ölçek için yeterlidir.
- Realtime leaderboard için Redis tabanlı yapı yeterli performans sağlayacaktır.
- Video ve TTS üretimi dış servislerle hızla başlatılabilir.
- İçerik üretim pipeline'ı zamanla özelleştirilerek maliyet optimize edilebilir.

### 8.4 Operasyonel Varsayımlar

- Akademik içerik üretimi için uzman kadro erişimi vardır.
- Hukuk, mali müşavirlik ve ödeme sağlayıcı tarafında operasyon kurulabilir.
- Canlı sınav günlerinde destek ve teknik operasyon ekibi hazır bulunacaktır.
- Burs dağıtımı için doğrulama ve muhasebe süreçleri tanımlanacaktır.

### 8.5 Önerilen Başlangıç Kapsamı

En mantıklı ilk odak:

- 1 veya 2 sınav türü ile başlamak
- En güçlü içerik bulunan 2-3 dersi önceliklendirmek
- Özel sınav + Gölge Rakip + Karantina + temel AI hoca çekirdeğini çıkarmak
- Ödüllü haftalık denemeyi kontrollü pilot olarak daha sonra devreye almak

### 8.6 Açık Karar Gerektiren Konular

Projeyi detaylı ürün keşfine almadan önce aşağıdaki kararlar netleştirilmelidir:

- İlk lansmanda hangi sınav(lar) olacak?
- İlk yıl burs modeli sabit mi, gelir oranına bağlı mı olacak?
- Video üretiminde tam AI mı, hibrit mi, stüdyo destekli mi ilerlenilecek?
- LGS ve çocuk kullanıcılar ilk fazda dahil mi?
- Düello sistemi ilk sürüme alınacak mı yoksa v1.0'a mı bırakılacak?
- Kamera/mikrofon bazlı anti-cheat stratejisi uygulanacak mı?
- Soru üretiminde iç ekip mi dış uzman ağı mı kullanılacak?

---

## Sonuç

Sınav Ligi; doğru icra edilirse eğitim teknolojisi, oyunlaştırma ve rekabetçi sınav hazırlığını güçlü biçimde birleştirebilecek yüksek potansiyelli bir girişimdir. Bununla birlikte ürün vizyonu, içerik yoğunluğu ve ödül ekonomisi nedeniyle sıradan bir mobil uygulamadan çok daha karmaşık bir işletim modeline sahiptir. Başarı için en kritik unsur; vizyonu korurken kapsamı disiplinli biçimde fazlara ayırmak, içerik ve operasyon maliyetini erkenden kontrol altına almak ve güvenilir sınav deneyimini tavizsiz biçimde sunmaktır.

Bu nedenle önerilen strateji; önce çekirdek öğrenme ve tekrar kullanım değerini kanıtlayan bir MVP çıkarmak, ardından canlı rekabet ve burs ekonomisini kontrollü olarak ölçeklemek, son fazlarda ise AI üretim otomasyonu ve platformlaşma ile savunulabilir üstünlük yaratmaktır.