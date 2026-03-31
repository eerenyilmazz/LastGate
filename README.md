# SON KAPI — Last Gate

> *"Bu kapı düşerse, şehir düşer."*

Post-apokaliptik kart tabanlı hayatta kalma stratejisi. Sektör 7 karantina bölgesinin son kapı komutanısın. Her gün kapına gelen yabancıları sorgula, kararını ver.

- **Platform**: iOS & Android (React Native / Expo)
- **Dil**: Türkçe
- **Hedef**: 100 günü hayatta geçir
- **Durum**: BETA v0.1

---

## İçindekiler

- [Temel Mekanikler](#temel-mekanikler)
- [5 Ana Stat](#5-ana-stat)
- [Zorluk Seviyeleri](#zorluk-seviyeleri)
- [Run Modifikatörleri](#run-modifikatörleri)
- [NPC Sistemi](#npc-sistemi)
- [Gizli Özellikler](#gizli-özellikler)
- [NPC Hafızası ve Geri Dönüş](#npc-hafızası-ve-geri-dönüş)
- [Sorgulama Sistemi](#sorgulama-sistemi)
- [Rol Sinerjileri](#rol-sinerjileri)
- [Binalar](#binalar)
- [Beceriler](#beceriler)
- [Olaylar](#olaylar)
- [Yerleşim Puanı](#yerleşim-puanı)
- [Oyun Sonu Koşulları](#oyun-sonu-koşulları)
- [Teknik Altyapı](#teknik-altyapı)

---

## Temel Mekanikler

### Gün Döngüsü

```
Giriş → NPC Geliş → Karar (×1–3) → Gün Özeti → İnşaat → [Tekrar]
```

Her gün sırasıyla: pasif bina bonusları → rol sinerjileri → gıda tüketimi (`nüfus × 0.04`) → zincirleme etkiler → gecikmiş NPC etkileri → olay kontrolü.

### Karar Verme

| Hareket | Açıklama |
|---------|----------|
| Sağa kaydır | **Kabul et** |
| Sola kaydır | **Reddet** |
| Dokun | **Sorgula** |

> **%35 NPC'de reddetmek net daha avantajlıdır.** Herkesi kabul etmek optimal strateji değildir.

---

## 5 Ana Stat

| Stat | Başlangıç | Maks | Kritik Eşiği | Sıfırda |
|------|-----------|------|--------------|---------|
| 💊 Bağışıklık | 65 | 100 | 15 | Veba |
| 🌾 Gıda | 100 | 200 | 35 | Açlık |
| 👥 Nüfus | 50 | 150 | 25 | Yok oluş |
| 🛡 Savunma | 45 | 100 | 10 | İhlal |
| 💰 Ekonomi | 50 | 100 | 5 | Çöküş |

### Zincirleme Etkiler

| Kritik Stat | Zincirleme Hasar /gün |
|-------------|----------------------|
| Bağışıklık | Nüfus −1 |
| Gıda | Ekonomi −2, Savunma −1 |
| Savunma | Gıda −4, Ekonomi −3, Nüfus −2 |
| Ekonomi | Gıda −3, Savunma −2 |
| Nüfus | Ekonomi −3, Savunma −2 |

---

## Zorluk Seviyeleri

| | Kolay | Normal | Zor |
|--|-------|--------|-----|
| Günlük gıda bonusu | +2 | 0 | −3 |
| NPC negatif etkisi | ×0.75 | ×1.0 | ×1.3 |
| Başlangıç statları | +%30 | Normal | −%25 |

---

## Run Modifikatörleri

Ayarlardan açıkken, 1. günü tamamladıktan sonra rastgele bir kural devreye girer. Aktif modifikatör HUD'da ve Sefer Günlüğü'nde sürekli görünür.

**16 modifikatör:**

| Tür | Örnekler |
|-----|---------|
| Zorlaştırıcı | Kıtlık (gıda ×1.5), Gölge Veba (−20 bağışıklık), Paranoya (negatif ×1.5) |
| Kolaylaştırıcı | Altın Çağ (negatif ×0.7), Bedava Keşif, İkmal Günü (+gıda/ekonomi) |
| Rol Odaklı | Tıp Çağı (Doktor ×2), Savaş Dönemi (Asker ×2), Ticaret Dönemi (Tüccar ×2) |

---

## NPC Sistemi

**154 benzersiz NPC**, 6 rol:

| Rol | Güçlü Yön | Not |
|-----|-----------|-----|
| Doktor | Bağışıklık | Enfekte doktor kabul = immunity kaybı |
| Çiftçi | Gıda | Yük çiftçiler gıda maliyeti getirir |
| Asker | Savunma | Şüpheliler sabotaj riski |
| Tüccar | Ekonomi | Yalancılar görünenden az faydalı |
| Mühendis | Ekonomi + Savunma | Genellikle kabul avantajlı |
| Çöpçü | Gıda + Ekonomi | En tahmin edilemez |

**NPC dağılımı:** %40 açık kabul · %30 takas · %30 yük (reddet avantajlı)

---

## Gizli Özellikler

| Özellik | NPC % | Tespit Kaçış | Etki |
|---------|-------|-------------|------|
| 🦠 Enfekte | %15 | %10 | Kabul: immunity düşer; reddet: korunur |
| 🕵️ Ajan | %10 | %15 | Her 3 günde −4 savunma, gün 10'da sabotaj |
| 💸 Hırsız | %10 | — | Gün 2 ve 5'te ekonomi+gıda çalar |
| 🛡 Koruyucu | %6 | — | Gizli tek seferlik bonus |
| 🎭 Yalancı | %15 | %30 | Pozitif accept ×0.3 uygulanır |

---

## NPC Hafızası ve Geri Dönüş

### Gecikmiş Etkiler
53 NPC kabul edildikten X gün sonra otomatik stat değişimi tetikler (bildirim gelir).

### Aktif Geri Dönüş
25 NPC belirli günler sonra yeni bir karar ekranıyla geri döner — KABUL veya RET seçimi.

---

## Sorgulama Sistemi

Günde **3 şarj** (Gözetleme Kulesi +1 şarj):

| Sıra | Maliyet |
|------|---------|
| 1. Ücretsiz | — |
| 2. Derin tarama | −8 ekonomi, −5 gıda |
| 3. İkinci tarama | −10 ekonomi, −6 savunma, −3 bağışıklık |

---

## Rol Sinerjileri

| Rol | Min. Sayı | Günlük Bonus |
|-----|----------|--------------|
| Doktor | 3+ | +3 bağışıklık |
| Çiftçi | 2+ | +4 gıda |
| Asker | 2+ | +3 savunma |
| Tüccar | 2+ | +4 ekonomi, +2 gıda |
| Mühendis | 3+ | +2 bağışıklık, +2 ekonomi |
| Çöpçü | 2+ | +3 gıda, +2 ekonomi |

---

## Binalar

| Bina | SP | Kilit | Bonus |
|------|----|-------|-------|
| 🌾 Çiftlik | 40 | G3 | +3 gıda/gün |
| 🏪 Pazar | 45 | G4 | +3 ekonomi/gün + dönüşüm |
| 🏥 Hastane | 55 | G5 | +2 bağışıklık/gün, enfeksiyon −%20 |
| ⛺ Barınak | 50 | G6 | +3 nüfus/gün |
| 🗼 Gözetleme Kulesi | 65 | G7 | +3 savunma/gün, +1 sorgu |
| 💧 Su Arıtma | 70 | G9 | +1 bağışıklık, +2 nüfus/gün |
| 🔬 Laboratuvar | 85 | G11 | Enfekte tespiti +%30 |
| ⚔️ Cephanelik | 80 | G14 | +5 savunma/gün |
| ☢️ Nükleer Jeneratör | 175 | G22 | +2 bağışıklık, +2 gıda/gün |

---

## Beceriler

Tek seferlik kullanım:

| Beceri | SP | Kilit | Etki |
|--------|----|-------|------|
| 📦 Acil İkmal | 40 | G1 | +40 gıda |
| 🚨 Tahliye | 65 | G5 | +50 nüfus |
| 💎 Ticaret | 35 | G7 | +20 ekonomi |
| 🧪 Biyotehlike | 60 | G9 | +40 bağışıklık |
| 📣 Kamu Çağrısı | 55 | G10 | +25 nüfus |
| 🛡 Savunma Hattı | 75 | G13 | +35 savunma |
| 💉 Tıbbi Müdahale | 45 | G15 | +20 bağışıklık |
| 💹 Ekonomik Kurtarma | 85 | G18 | +35 ekonomi, +20 gıda |
| ⚡ Genel Seferberlik | 130 | G30 | Tüm statlara +10 |

---

## Olaylar

50 benzersiz olay, her biri bir kez tetiklenir. 3 seçenek — bazıları belirli rollere sahipsen ekstra bonus sağlar.

Kategoriler: Zombi Savaşı (12) · Hastalık (10) · Keşif (10) · Politik (10) · Moral (8)

---

## Yerleşim Puanı

Runlar arası birikir. Bina ve yeteneklere yatırılır.

| Eylem | SP |
|-------|----|
| Her gün hayatta | +4 |
| Doğru NPC kararı | +1 |
| Olaydan çıkma | +3 |
| Mükemmel gün | +6 |
| Oyun sonu | +5 |

100 günlük zafer: **~670 SP** · Tüm binalar: 665 SP · Tüm beceriler: 590 SP — her şeyi açmak tek runda imkânsız.

---

## Oyun Sonu Koşulları

| Koşul | Tetikleyici |
|-------|-------------|
| 🌾 Açlık | Gıda = 0 |
| 🦠 Veba | Bağışıklık = 0 |
| 🛡 İhlal | Savunma = 0 |
| 💀 Yok Oluş | Nüfus = 0 |
| 💸 Çöküş | Ekonomi = 0 |
| 🏆 Zafer | Gün 100 tamamlandı |

---

## Teknik Altyapı

**Stack:** React Native · Expo SDK 54 · TypeScript · Zustand · Reanimated · AsyncStorage · Expo AV

```
src/
├── screens/        Splash, Menu, Game, Building, GameOver, Summary
├── components/     Card/, HUD/, Overlays/
├── store/          useGameStore, useStatStore, useProgressStore, useSettingsStore
├── domain/         StatEngine, HiddenSystem, ReturnSystem, EventManager, NPCGenerator, SaveSystem
├── hooks/          useGameLoop, useAudio
└── data/           config.json, ui.json, theme.json, events.json,
                    scenarios.json, followups.json, modifiers.json
```

**Kayıt:** 5 AsyncStorage anahtarı — `lastgate_game`, `lastgate_stats`, `lastgate_progress`, `lastgate_npc_queue`, `lastgate_settings`

### Kurulum

```bash
git clone <repo>
cd LastGate
npm install
npx expo start
```

---

*BETA v0.1 · Sektör 7 · [Gizlilik Politikası](https://statuesque-biscochitos-fb477f.netlify.app/)*
