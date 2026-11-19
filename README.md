# Demiral Gıda — One Page

Demiral Gıda Ürünleri San. ve Dış Ticaret A.Ş. için tek sayfalık tanıtım sitesi.
Saf HTML/CSS/JS, build adımı yok. İletişim formu için PHP destekli hosting gerekir.

```
index.html            Ana sayfa: grup şirketleri slider'ı (ilk ekran), Hakkımızda, Faaliyet Alanları, Kalite, İletişim
firma/*.html          Kendi sitesi olmayan grup şirketlerinin detay sayfaları (slider'dan yeni sekmede açılır)
assets/css/style.css  Stiller
assets/js/main.js     Menü, scroll-spy, animasyon, KVKK penceresi, AJAX form
send-mail.php         Form → info@demiral.com.tr (honeypot spam koruması)
assets/img/           Logo + favicon
```

Yerelde önizleme: `php -S localhost:8000` (form da çalışır) veya `python3 -m http.server`.

## Eksikler (TODO)

- Slider arka planları şu an çizim + renk geçişi; gerçek fotoğraflar gelince `.slide__bg` içine eklenebilir
- Akya Mantar linki önizleme adresine gidiyor (mertcilli.github.io/akyamantar) — gerçek domain gelince güncelle
- Dönüşüm Ar-Ge sayfasında yalnızca kısa tanıtım var; hakkımızda metni bekleniyor

- Telefon numarası (index.html iletişim bölümünde yorum satırı yerinde)
- Ürün grubu listesi ve ürün görselleri → ayrı bölüm olarak eklenebilir
- Sena Demiral imzalı kurumsal tanıtım yazısı → Hakkımızda metnini değiştirir
- Gerçek domain (canonical / og etiketleri şu an `demiralgrup.com.tr`)
- Hosting'de `mail()` kapalıysa PHPMailer + SMTP
- KVKK metni kısaltılmış özet; hukuki kontrol önerilir
