# ÖĞRENCİ VE KURS TAKİP SİSTEMİ - MİMARİ VE KAPSAM ANALİZİ (MVP)

## 1. PROJE KAPSAMI VE TEMEL KURALLAR

- **Platformlar:** Yönetim için Web Paneli, son kullanıcı (Öğrenci/Eğitmen) için Mobil Uygulama ve merkezi bir RESTful API.
- **Kapsam Dışı (Phase 2):** WhatsApp Bot entegrasyonu, NLP sorguları ve online sınav gibi özellikler MVP aşamasında mimariye dahil edilmeyecektir.
- **Mimari Yaklaşım:** Monolitik API mimarisi, Clean Architecture prensipleri ve Normalize İlişkisel Veritabanı (RDBMS).

## 2. TEKNOLOJİ YIĞINI (TECH STACK)

- **Backend:** Python, Django, Django REST Framework (DRF).
- **Veritabanı:** PostgreSQL (Katı Foreign Key ilişkileri ve Transaction yönetimi ile).
- **Mobil İstemci:** karar verilmedi.
- **Durum Yönetimi (Mobil):** karar verilmedi.
- **Versiyon Kontrolü:** Git (Feature branch stratejisi ve Pull Request tabanlı kod inceleme süreci).

## 3. KULLANICI ROLLERİ VE YETKİLERİ

1. **Yönetici (Admin):** Sistemdeki tüm CRUD işlemlerinin tek otoritesidir. Kullanıcıları, sınıfları oluşturur; eğitmen ve öğrencileri bu sınıflara atar (Çoka çok ilişki yönetimi). Tatil/İstisna günlerini sisteme tanımlar.
2. **Eğitmen:** Yalnızca `InstructorOf` ilişkisi ile atandığı sınıflara erişebilir. Ortak panoya duyuru/ödev atar, ödevleri notlandırır ve sistemin onayladığı zaman penceresi içinde yoklama alır.
3. **Öğrenci:** Yalnızca `EnrolledIn` ilişkisi ile atandığı sınıfların verilerini okur. Panodan duyuruları takip eder, aktif ödevlere dosya yükleyerek teslim durumunu günceller.

## 4. TEMEL MODÜLLER VE İŞ KURALLARI (BUSINESS LOGIC)

### A. Birleştirilmiş Pano (Aggregated Feed) Mekaniği

- Duyurular (Announcements) ve Ödevler (Assignments) veritabanında kesinlikle ayrı tablolarda tutulacaktır.
- API tarafındaki `GetFeed` servisi, öğrencinin sınıflarına ait güncel duyuruları ve aktif ödevleri çeker, bunları tek bir `FeedItemDTO` listesinde tarihe göre harmanlayarak (Merge) istemciye gönderir.
- Mobil arayüz, bu veriyi tek bir akışta (zaman tüneli) gösterir ve UI üzerinde sekme (tab) tabanlı filtreleme uygular.

### B. Zaman ve Durum Duyarlı Yoklama (State Machine)

- Sistem, eğitmenin manuel olarak serbestçe ders oluşturmasını engeller. "Schedule-Driven Session Management" uygulanır.
- **Cron Job:** Her gece saat 00:00'da çalışan bir arka plan görevi, statik ders programını (Schedules) ve resmi tatilleri kontrol ederek, o gün işlenecek derslerin oturumlarını (Sessions) `Scheduled` statüsünde üretir.
- **Zaman Penceresi (Time-Window):** Dersin başlama saatinden +- 10 dakika aralığında oturum otomatik olarak `Ready` (Hazır) statüsüne geçer. Eğitmen sadece statüsü `Ready` olan bir dersin yoklamasını başlatabilir (`Active`).
- Süre aşıldığında oturum `Missed` statüsüne geçer; istisnai durumlarda geçmişe dönük işlem veya Ek Ders açma yetkisi çakışma kontrollerinden geçmek şartıyla yönetilir.

### C. Ödev Teslim ve Gecikme Kontrolü

- Eğitmen ödev oluşturduğunda, sınıftaki tüm öğrenciler için ilişki tablosuna `Pending` statüsünde kayıt atılır.
- Öğrenci dosya yüklediğinde statü `Submitted` olur.
- Arka plan görevi (Cron Job), teslim tarihi (Deadline) geçen ödevleri düzenli tarar ve statüsü halen `Pending` olanları `Overdue` (Gecikmiş) olarak günceller. `Overdue` olan ödevlere arayüzden dosya yükleme işlemi kapatılır.

## 5. VERİTABANI ŞEMASI (CORE ENTITIES)

- **Users:** Rol tabanlı kullanıcı bilgileri.
- **Classes:** Şube/Sınıf tanımları.
- **Class_Students & Class_Instructors:** İlişki (Bridge) tabloları.
- **Announcements:** Sınıf bazlı statik duyurular.
- **Assignments:** Teslim tarihi ve dosya eklentisi içeren ödev nesneleri.
- **Student_Assignments:** ÖdevId, ÖğrenciId, Teslim Durumu (Status), Not (Grade) ve Dosya URL'ini tutan kritik takip tablosu.
- **Schedules:** Statik haftalık ders programı şablonu.
- **Sessions:** Durum makinesiyle (Scheduled, Ready, Active, Completed, Missed) yönetilen dinamik günlük oturum logları.
- **Attendances:** Oturum bazlı öğrenci katılım verisi.
