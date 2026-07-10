# Course Management System (KBS Portal)

KBS Portal, Django (Backend) ve React/Vite (Frontend) kullanılarak geliştirilmiş modern bir Kurs ve Sınıf Yönetim Sistemidir. Öğretmenler sınıflarını yönetebilir, ödev ve yoklama verebilir; öğrenciler notlarını takip edebilir ve forumda tartışmalara katılabilir.

---

## 🚀 Hızlı Kurulum (Tek Tıkla DevOps)

Projeyi bilgisayarınıza klonlamanıza veya klasörlerle uğraşmanıza gerek yok. Aşağıdaki tek satırlık komutu terminalinize yapıştırdığınızda; proje indirilecek, sanal ortamlar kurulacak, veritabanı ayarlanacak ve tüm kütüphaneler otomatik yüklenecektir.

_(Terminali açın ve aşağıdaki komutu kopyalayıp yapıştırın)_

```bash
curl -O https://raw.githubusercontent.com/bunyaminkaplan/course-management-system/main/setup.py && python setup.py
```

> **Not:** Windows kullanıcıları `curl` komutunu Powershell veya Git Bash üzerinden çalıştırabilirler.

---

## 🏃‍♂️ Projeyi Çalıştırma

Kurulum başarıyla tamamlandıktan sonra, oluşturulan `course-management-system` klasörünün içine girin:

```bash
cd course-management-system
```

Ardından uygulamayı tek tıkla ayağa kaldırmak için aşağıdaki komutu çalıştırın:

```bash
python start.py
```

Bu komut hem backend (Django) hem de frontend (React) sunucularını aynı anda başlatır.

- **Frontend URL:** `http://localhost:5173`
- **Backend API:** `http://127.0.0.1:8000`

Uygulamayı durdurmak için terminalde `Ctrl + C` yapmanız yeterlidir.

---

## 🧪 Test Hesapları (Seed Verisi)

Kurulum sırasında sisteme örnek veriler eklenir. Aşağıdaki hesapları kullanarak hemen sisteme giriş yapabilirsiniz:

| Rol                  | Kullanıcı Adı | Şifre         |
| :------------------- | :------------ | :------------ |
| **Yönetici (Admin)** | `admin`       | `password123` |
| **Öğrenci**          | `student1`    | `password123` |
| **Eğitmen**          | `instructor1` | `password123` |
