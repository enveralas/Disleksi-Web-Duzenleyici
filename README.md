# 📖 Disleksi Dostu Web Okuma Modu (Chrome Eklentisi)

Disleksi sahibi bireylerin web üzerindeki okuma deneyimlerini kolaylaştırmak, daha akıcı ve stressiz bir okuma süreci sağlamak amacıyla geliştirilmiş **Google Chrome Eklentisi** (Manifest V3 uyumlu) ve **OpenAI API** tabanlı sadeleştirme servisidir.

Eklenti; yazı tiplerini disleksi dostu olan `OpenDyslexic` veya `Lexend` fontlarına çevirir, satır/harf aralıklarını optimize eder, zengin web sayfalarındaki karmaşık cümleleri yapay zeka ile sadeleştirir ve seçili metinleri sesli okuyarak çoklu duyu ile takibi kolaylaştırır.

---

## ✨ Özellikler

*   **🔍 Disleksi Dostu Tipografi:** Sayfalardaki yazı tiplerini tek bir tıkla disleksik bireyler için özel tasarlanmış `OpenDyslexic` veya okunaklı `Lexend` fontuna dönüştürür.
*   **📏 Esnek Boyut Ayarı:** Kaydırıcı (Slider) yardımıyla sayfadaki yazı boyutlarını anlık olarak 14px ile 40px arasında değiştirebilirsiniz.
*   **🤖 AI ile Sadeleştirme (OpenAI gpt-4o-mini):** Web sayfalarındaki karmaşık, uzun veya akademik cümleleri seçip yapay zeka yardımıyla anlam kaybı olmadan basit, akıcı ve kısa maddeler (bullet points) halinde sadeleştirebilirsiniz.
*   **🗣️ Akıllı Sesli Okuma (Text-to-Speech):** Seçtiğiniz metinleri tarayıcının yerel ses sentezleyici motoru yardımıyla, sayfanın dilini (Türkçe, İngilizce vb.) otomatik olarak tespit ederek akıcı bir şekilde seslendirir.
*   **💾 Sayfalar Arası Durum Kalıcılığı:** Eklentiyi bir kere açtığınızda tarayıcınız bunu hatırlar. Yeni sekmelerde veya sayfa geçişlerinde disleksi modunu her seferinde baştan açmak zorunda kalmazsınız.
*   **⚡ Performans Dostu Hafıza Yönetimi:** Kaydırıcıyı hızlıca sürükleseniz bile, debounced (gecikmeli) iletişim sistemi sayesinde tarayıcınızın iletişim kanalları veya hafıza kotası asla kilitlenmez.
*   **🔄 Kusursuz Geri Alma (Non-destructive DOM):** AI ile sadeleştirdiğiniz veya dönüştürdüğünüz metinlerin orijinal zengin HTML yapıları (kalın yazılar, linkler vs.) arka planda yedeklenir. Modu kapattığınızda sayfadaki her şey orijinal haline pürüzsüzce geri döner.

---

## 📁 Proje Yapısı

```bash
├── manifest.json       # Eklenti izinleri, background ve content script tanımları
├── background.js       # Sağ tık menüleri, TTS (sesli okuma) ve AI API köprü yönetimi
├── content.js          # Sayfa içi stil enjeksiyonu, DOM değiştirme ve geri alma mantığı
├── popup.html          # Eklenti menü arayüzü
├── popup.js            # Kaydırıcı, font seçimi ve durum yönetimi (Debounced)
├── style.css           # Eklenti popup menü görselleri
├── api/
│   └── simplify.js     # OpenAI API entegrasyonuna sahip Vercel Serverless Function
├── fonts/
│   └── OpenDyslexic-Regular.otf  # Yerel font yedeği
├── .env                # OpenAI API Anahtarı (Gizli - Git'e gönderilmez)
├── .env.example        # API anahtarı için örnek yapılandırma dosyası
└── README.md           # Proje dokümantasyonu
```

---

## 🚀 Kurulum ve Çalıştırma

### 1. Adım: API Anahtarı Tanımlama
Yapay zeka ile sadeleştirme özelliğini kullanabilmek için projenin kök dizininde bir `.env` dosyası oluşturmalısınız:

1.  Kök dizindeki `.env.example` dosyasının adını `.env` olarak değiştirin (veya yeni bir `.env` dosyası oluşturun).
2.  Dosya içerisine kendi OpenAI API anahtarınızı ekleyin:
    ```env
    OPENAI_API_KEY=sk-proj-sizin-openai-api-anahtariniz...
    ```

### 2. Adım: Yerel API Sunucusunu Başlatma
Eklenti, OpenAI isteklerini güvenli bir sunucu üzerinden geçirir. Bunun için yerelinizde Vercel sunucusunu çalıştırmanız gerekir:

```bash
# Vercel geliştirme sunucusunu başlatın
npx vercel dev
```
Sunucu başarıyla başladığında terminalinizde `Ready! Available at http://localhost:3000` çıktısı görünecektir.

### 3. Adım: Eklentiyi Chrome'a Yükleme

1.  **Google Chrome** tarayıcınızı açın ve adres çubuğuna şu adresi yazın: `chrome://extensions/`
2.  Sağ üst köşede bulunan **Geliştirici Modu (Developer Mode)** seçeneğini aktif edin.
3.  Sol üst köşedeki **Paketlenmemiş öğe yükle (Load unpacked)** butonuna tıklayın.
4.  Açılan pencereden projenin ana klasörünü (`Disleksi-Web-Duzenleyici`) seçip yükleyin.

Tebrikler! Eklentiniz kuruldu. Artık dilediğiniz bir web sayfasını açıp test edebilirsiniz.

---

## 💡 Kullanım İpuçları

*   **Tüm Sayfayı Dönüştürme:** Eklenti ikonuna tıklayıp **"Disleksi Modu Aç/Kapat"** butonunu kullanabilir veya sayfada boş bir yere sağ tıklayıp **"Disleksi Modu -> Tüm Sayfayı Disleksi Moduna Çevir"** diyebilirsiniz.
*   **AI Sadeleştirmesi:** Web sayfasındaki karmaşık bir paragrafı farenizle seçin, sağ tıklayın ve **"Disleksi Modu -> AI ile Sadeleştir"** seçeneğini seçin. Metin anında krem rengi arka plana sahip sadeleştirilmiş versiyonu ile değişecektir.
*   **Sesli Dinleme:** İstediğiniz metni seçip sağ tıklayarak **"Disleksi Modu -> Sesli Oku"** seçeneği ile dinleyebilirsiniz.
