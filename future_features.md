# İleri Aşama Özellik Planlamaları (Future Features)

Bu döküman, MVP aşamasından sonra sisteme eklenecek olan yeni özelliklerin tasarım kararlarını ve iş mantıklarını içerir.

## 3. Gelişmiş İstatistik ve Raporlama (Analytics)

* **Yaklaşım (Kişiselleştirilmiş İçgörüler):** Soğuk grafikler yerine doğrudan kullanıcıyla iletişim kuran metin tabanlı yönlendirmeler ön planda tutulacak. 
  * *Öğrenci için:* "Sınıftakiler ödevlerini ortalama 2 gün erken teslim ediyor, sen sınırda teslim ediyorsun."
  * *Eğitmen için:* Sınıf ortalamaları ve "Risk Altındaki Öğrenciler" (örn: son 3 ödevini yapmayanlar) listesi.
* **Görselleştirme:** Bar veya pasta grafik gibi geleneksel gösterimler ana odak olmayacak, ancak destekleyici olarak kenarda/alt kısımda sunulacak.
* **Tetiklenme Mekanizması (On-Demand):** Hesaplamalar arka planda zamanlanmış (cron) bir göreve bağlı OLMAYACAK. Veritabanının gereksiz yorulmaması ve her zaman en güncel verinin sunulması için sistem, sadece kullanıcı arayüzden bir butona tıkladığında o anki verileri hesaplayarak ekrana getirecek.

## 7. Sosyal Öğrenme ve Forum (Discussion Boards)

* **Platform Odağı:** Web ve Mobil platformların her ikisi de ana odak noktasında. Özellikle geniş ekranlı Web paneli, kompleks forum okuma/yazma deneyimi için büyük bir avantaja sahip olacak.
* **Yapısal Format (StackOverflow Modeli):** Dağınık ve kaybolan anlık mesajlaşma/sohbet grubu formatı YERİNE, yapısal bir soru-cevap mantığı kurulacak. Gönderiler belirli başlıklar/dersler altında (Örn: "Matematik 101 Vize Soruları", "Hata Çözümleri") organize edilecek.
* **Soru-Cevap Akışı:** Bir konu (Thread/Topic) açılacak, altına yorumlar ve çözümler girilecek. İleride (Upvote/Downvote) gibi özelliklerle doğru cevapların en üste çıkması sağlanabilir.
