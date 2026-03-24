# SON KAPI — Last Gate

> *"Bu kapı düşerse, şehir düşer."*

Post-apokaliptik bir hayatta kalma stratejisi. Sektör 7 karantina bölgesinin son kapı komutanısın. Her gün kapına gelen yabancıları sorgula, kararını ver — kimini içeri alacaksın, kimini dışarıda bırakacaksın. Yanlış bir seçim tüm yerleşimi tehlikeye atabilir.

---

## İçindekiler

- [Oyun Hakkında](#oyun-hakkında)
- [Temel Mekanikler](#temel-mekanikler)
- [5 Ana Stat](#5-ana-stat)
- [Zorluk Seviyeleri](#zorluk-seviyeleri)
- [NPC Sistemi](#npc-sistemi)
- [Gizli Özellikler](#gizli-özellikler)
- [Sorgulama Sistemi](#sorgulama-sistemi)
- [Rol Sinerjileri](#rol-sinerjileri)
- [Binalar](#binalar)
- [Beceriler](#beceriler)
- [Olaylar](#olaylar)
- [Yerleşim Puanı ve İlerleme](#yerleşim-puanı-ve-ilerleme)
- [Oyun Sonu Koşulları](#oyun-sonu-koşulları)
- [Teknik Altyapı](#teknik-altyapı)

---

## Oyun Hakkında

**Last Gate**, bilinmeyen bir virüsün şehri kasıp kavurduğu post-apokaliptik bir dünyada geçen, kart tabanlı hayatta kalma stratejisidir. Oyuncu; bir kapı komutanı olarak her gün 1–3 mülteci/sığınak arayan kişiyle yüz yüze gelir ve sınırlı bilgiyle kararlar vermek zorunda kalır.

- **Platform**: iOS & Android (React Native / Expo)
- **Dil**: Türkçe
- **Hedef**: 100 günü hayatta geçir
- **Durum**: BETA v0.1

---

## Temel Mekanikler

### Gün Döngüsü

```
Giriş → NPC Geliş → Karar (×1–3 NPC) → Gün Özeti → İnşaat → [Tekrar]
```

Her gün:
1. Pasif bina bonusları uygulanır
2. Rol sinerji bonusları hesaplanır
3. Ekonomiden gıdaya dönüşüm yapılır (Pazar binası varsa)
4. Nüfusa göre günlük gıda tüketimi düşülür
5. Gıda kritikse açlık cezası uygulanır
6. Zorluk modifikatörleri işlenir
7. Kritik statlar zincirleme hasar tetikler
8. Gizli özellikler (enfeksiyon, ajan vb.) tıklanır
9. Olay tetiklenip tetiklenmediği kontrol edilir (gün 1–50: %50, gün 50+: %75)
10. Gün ilerler, sorgulama şarjları sıfırlanır

### Karar Verme

| Hareket | Açıklama |
|---------|----------|
| Sağa kaydır | **Kabul et** — stat değişiklikleri uygulanır |
| Sola kaydır | **Reddet** — genellikle hafif negatif etki |
| Dokun | **Sorgula** — ipucu veya derin tarama |

---

## 5 Ana Stat

| Stat | Başlangıç | Maks | Kritik Eşiği | Sıfıra Düşünce |
|------|-----------|------|--------------|----------------|
| 💊 Bağışıklık | 65 | 100 | 15 | Veba — oyun biter |
| 🌾 Gıda | 100 | 200 | 35 | Açlık — oyun biter |
| 👥 Nüfus | 50 | 500 | 10 | Yok oluş — oyun biter |
| 🛡 Savunma | 45 | 100 | 10 | İhlal — oyun biter |
| 💰 Ekonomi | 50 | 100 | 5 | Çöküş — oyun biter |

### Zincirleme Etkiler

Bir stat kritik seviyeye düştüğünde diğer statları da etkiler:

| Kritik Stat | Zincirleme Hasar |
|-------------|-----------------|
| Bağışıklık | Nüfus −2 |
| Gıda | Ekonomi −3, Savunma −2 |
| Savunma | Gıda −8, Ekonomi −5, Nüfus −3 |
| Ekonomi | Gıda −5, Savunma −3 |
| Nüfus | Ekonomi −5, Savunma −3 |

**Günlük gıda tüketimi**: `nüfus × 0.04` (yuvarlanır)

---

## Zorluk Seviyeleri

| | Kolay | Normal | Zor |
|--|-------|--------|-----|
| Günlük gıda bonusu | +2 | 0 | −3 |
| Açlık cezası | Yok | Yok | Nüfus −2/gün |
| NPC negatif etkisi | ×0.75 | ×1.0 | ×1.3 |
| Başlangıç statları | +%30 | Normal | −%25 |

---

## NPC Sistemi

**154 benzersiz NPC**, 6 rol kategorisinde:

| Rol | İkon | Güçlü Yön | Tipik Kabul Etkisi |
|-----|------|-----------|-------------------|
| Doktor | 👨‍⚕️ | Bağışıklık | +13 bağışıklık, −4 gıda |
| Çiftçi | 🌾 | Gıda | +gıda, −hafif nüfus |
| Asker | ⚔️ | Savunma | +savunma, −hafif nüfus |
| Tüccar | 💰 | Ekonomi | +ekonomi, +gıda |
| Mühendis | 🔧 | Bağışıklık + Ekonomi | +bağışıklık, +ekonomi |
| Çöpçü | 🔍 | Belirsiz | Değişken, tahmin edilemez |

Her NPC'nin:
- Kendine özel diyaloğu var (kapıya geldiğinde ne söylediği)
- İpucu metni var (gözlemlenebilir şüpheli işaretler)
- Derin tarama sonucu var (sorgulama ile ortaya çıkar)
- Gizli özelliği olabilir (enfekte, ajan, hırsız...)

---

## Gizli Özellikler

NPC'ler görünenden farklı olabilir. Kabul edildikten sonra günler geçtikçe etkileri ortaya çıkar:

### 🦠 Enfekte
| Gün | Etki |
|-----|------|
| 1–2 | −3 bağışıklık/gün |
| 5 | Kriz: −12 bağışıklık, −4 nüfus |
| 6+ | −4 bağışıklık/gün (kalıcı) |

Hastane/Laboratuvar binaları enfeksiyon etkisini %20–40 azaltır.

### 🕵️ Ajan
| Gün | Etki |
|-----|------|
| Her 3 günde bir | −4 savunma |
| Gün 10 | Sabotaj: −15 savunma |

### 💸 Hırsız
| Gün | Etki |
|-----|------|
| Gün 2 | Küçük çalıntı: −6 ekonomi, −4 gıda |
| Gün 5 | Büyük çalıntı: −10 ekonomi, −8 gıda |

### 🛡 Koruyucu
Tek seferlik gizli bonus: +5 bağışıklık, +3 savunma, +2 ekonomi *(Nadir)*

### 🎭 Yalancı
- Sorgulamada %30 ihtimalle temiz görünür
- Kabul edilirse stat bonusları %30 azalır

---

## Sorgulama Sistemi

Günde **3 sorgulama şarjı** (Gözetleme Kulesi binası başına +1):

| Sorgulama | Maliyet | Ortaya Çıkan |
|-----------|---------|--------------|
| 1. (ücretsiz) | — | Clue metni (şüpheli ipuçları) |
| 2. Derin tarama | −8 ekonomi, −5 gıda | Scan sonucu |
| 3. İkinci tarama | −10 ekonomi, −6 savunma, −3 bağışıklık | Scan sonucu |

**Tespitten kaçış ihtimalleri:**

| Özellik | Kaçış İhtimali |
|---------|---------------|
| Yalancı | %30 |
| Ajan | %15 |
| Enfekte | %10 |

---

## Rol Sinerjileri

Aynı rolden birden fazla kişi kabul edilince günlük pasif bonus açılır:

| Rol | Gerekli Sayı | Günlük Bonus |
|-----|-------------|--------------|
| Doktor | 3+ | +3 bağışıklık/gün |
| Çiftçi | 2+ | +4 gıda/gün |
| Asker | 2+ | +3 savunma/gün |
| Tüccar | 2+ | +4 ekonomi, +2 gıda/gün |
| Mühendis | 3+ | +2 bağışıklık, +2 ekonomi/gün |

---

## Binalar

Yerleşim puanıyla satın alınan kalıcı yatırımlar. Her birinin belirli bir güne kadar kilidi açılmaz.

| Bina | İkon | Maliyet | Kilit Gün | Günlük Bonus | Özel Etki |
|------|------|---------|-----------|-------------|-----------|
| Çiftlik | 🌾 | 40 SP | G3 | +3 gıda | Gıda krizi −%15 |
| Pazar | 🏪 | 45 SP | G4 | +3 ekonomi | 10 ekonomi → +0.5 gıda |
| Hastane | 🏥 | 55 SP | G5 | +2 bağışıklık | Enfeksiyon −%20 |
| Barınak | ⛺ | 50 SP | G6 | +3 nüfus | Mülteci bonusu |
| Gözetleme Kulesi | 🗼 | 65 SP | G7 | +3 savunma | +1 sorgulama şarjı/gün |
| Su Arıtma | 💧 | 70 SP | G9 | +1 bağışıklık, +2 nüfus | Veba −%10 |
| Laboratuvar | 🔬 | 85 SP | G11 | — | Enfeksiyon tespiti +%30, veba süresi −%40 |
| Cephanelik | ⚔️ | 80 SP | G14 | +5 savunma | Saldırı hasarı −%50 |
| Nükleer Jeneratör | ☢️ | 175 SP | G22 | +2 bağışıklık, +2 gıda | Tüm pasif bonus +%5 |

---

## Beceriler

Tek seferlik kullanılabilen aktif yetenekler:

| Beceri | İkon | Maliyet | Kilit Gün | Etki |
|--------|------|---------|-----------|------|
| Acil İkmal | 📦 | 40 SP | G1 | +40 gıda |
| Tahliye Operasyonu | 🚨 | 65 SP | G5 | +50 nüfus |
| Ticaret Anlaşması | 💎 | 35 SP | G7 | +20 ekonomi |
| Biyotehlike Müdahalesi | 🧪 | 60 SP | G9 | +40 bağışıklık |
| Kamu Çağrısı | 📣 | 55 SP | G10 | +25 nüfus |
| Savunma Hattı | 🛡 | 75 SP | G13 | +35 savunma |
| Tıbbi Müdahale | 💉 | 45 SP | G15 | +20 bağışıklık |
| Ekonomik Kurtarma | 💹 | 85 SP | G18 | +35 ekonomi, +20 gıda |
| Genel Seferberlik | ⚡ | 130 SP | G30 | Tüm statlara +10 |

---

## Olaylar

**50 benzersiz olay**, 5 kategoride. Her olay bir kez tetiklenir:

| Kategori | İçerik |
|----------|--------|
| Zombi Savaşı | Doğrudan çatışma senaryoları |
| Hastalık Salgını | Sağlık krizleri |
| Keşif Fırsatı | Kaynak bulma |
| Moral/Psikoloji | Sosyal dinamikler |
| Politik/Sosyal | Yönetim zorlukları |

Her olayda **3 seçenek (A, B, C)** sunulur. Bazı seçenekler belirli rolleri kabul etmişsen ekstra bonus sağlar.

---

## Yerleşim Puanı ve İlerleme

**SP Kazanımı:**

| Eylem | SP |
|-------|----|
| Hayatta kalınan her gün | +4 |
| Doğru NPC kararı | +1 |
| Olaydan sağ çıkma | +3 |
| Mükemmel gün (stat düşmeden) | +6 |
| Oyun sonu (kazanma/kaybetme) | +5 |

SP **kalıcıdır** — oyunlar arası birikir. Binalara ve becerilere yatırım yapılır.

**İlerleme takibi:**
- Toplam SP
- Sahip olunan binalar
- Ulaşılan en iyi gün
- Toplam galibiyet (100. güne ulaşan run sayısı)
- Toplam oynanan run

---

## Oyun Sonu Koşulları

| Koşul | Tetikleyici |
|-------|-------------|
| 🌾 Açlık | Gıda = 0 |
| 🦠 Veba | Bağışıklık = 0 |
| 🛡 İhlal | Savunma = 0 |
| 💀 Yok Oluş | Nüfus = 0 |
| 💸 Çöküş | Ekonomi = 0 |
| 🏆 Zafer | Gün 100'e ulaşıldı |

Her son, kendine özel anlatı metni ve ikon ile gösterilir.

---

## Teknik Altyapı

### Stack

| Katman | Teknoloji |
|--------|-----------|
| Framework | React Native + Expo SDK 54 |
| Dil | TypeScript 5.9 |
| State | Zustand 5.0 |
| Animasyon | React Native Reanimated 4.1 |
| Depolama | AsyncStorage |
| Ses | Expo AV |
| Haptic | Expo Haptics |
| Build | Expo EAS |

### Klasör Yapısı

```
src/
├── screens/          # 6 ekran (Splash, Menu, Game, Building, GameOver, Summary)
├── components/
│   ├── Card/         # NPCCard, CardDetails, SwipeHandler
│   ├── HUD/          # DayCounter, StatBar
│   └── Overlays/     # EventModal, DaySummary, NotificationOverlay, Tutorial
├── store/            # Zustand store'ları (game, stat, progress, settings)
├── domain/           # İş mantığı (StatEngine, HiddenSystem, EventManager, NPCGenerator, SaveSystem)
├── hooks/            # useGameLoop
└── data/
    ├── config.json   # Tüm sayısal denge değerleri
    ├── ui.json       # Tüm Türkçe UI metinleri
    ├── theme.json    # Renk paleti, tipografi, spacing
    ├── events.json   # 50 oyun olayı
    └── scenarios.json # 154 NPC kartı
```

### Kayıt Sistemi

5 AsyncStorage slotu:

| Anahtar | İçerik |
|---------|--------|
| `lastgate_game` | Faz, gün, aktif NPC/olay, şarj |
| `lastgate_stats` | Mevcut stat değerleri |
| `lastgate_progress` | SP, binalar, run istatistikleri |
| `lastgate_npc_queue` | NPC havuzu durumu |
| `lastgate_settings` | Müzik/SFX/zorluk tercihleri |

---

## Kurulum

```bash
git clone <repo>
cd LastGate
npm install
npx expo start
```

iOS için: `npx expo run:ios`
Android için: `npx expo run:android`

---

*BETA v0.1 · Sektör 7 Karantina Bölgesi*
