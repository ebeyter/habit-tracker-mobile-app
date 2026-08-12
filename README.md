# Habit Tracker

Exposure AI Academy · Project 9 — React Native + Expo + Local Notifications ile geliştirilmiş, backend gerektirmeyen, local-first bir habit tracker mobil uygulaması.

## Özellikler

### Brief kapsamındaki çekirdek akış

- Sınırsız goal oluşturma, düzenleme, silme ve tamamlama (undo destekli)
- **Tek Seferlik** hedefler: zorunlu bitiş tarihi + "X gün önce hatırlat"
- `expo-notifications` ile cihaz içi zamanlanmış local notification (remote push yok)
- Goal edit/delete/complete olduğunda eski notification otomatik cancel/reschedule edilir
- Active / Overdue / Completed durumları ayrı bölümlerde, net badge'lerle gösterilir
- Günlük streak: art arda her gün en az bir goal tamamlanırsa +1, boş gün geçerse sıfırlanır (`currentStreak`, `bestStreak`)
- Tüm veriler (`goals`, `streak`, notification ID'leri) `AsyncStorage`'da saklanır, app kapanıp açılınca kaybolmaz
- Empty state, form validation, geçmiş reminder zamanı uyarısı ve bildirim izni reddedilme state'i

### Brief'in ötesinde eklenen özellikler

- **Tekrarlayan alışkanlıklar**: bitiş tarihi yok; tekrar kuralı seçilebilir (her gün / haftanın belirli günleri / N günde bir) ve **günde birden fazla hatırlatma saati** kurulabilir
- **Kategoriler**: 5 hazır kategori + kullanıcının kendi oluşturduğu kategoriler (emoji + isim), ana ekranda filtre chip'leri
- **Öncelik** (Düşük/Orta/Yüksek) ve **alt görevler** (subtask) — Apple Reminders esintili
- **Akıllı Plan**: hedef miktar + birim girilirse kalan güne göre günlük tempo önerisi (tamamen local hesaplama, dış API yok)
- **Maskot (Foksi)**: streak durumuna göre ifade/mesaj değiştiren, ismi–rengi–kıyafeti kişiselleştirilebilen karakter
- **5 sekme**: Hedefler · Gün Gün (günlük checklist) · Takvim (ay görünümü + local etkinlikler) · Yapılacaklar (hızlı to-do listesi) · Rapor (haftalık/aylık istatistikler)

## Teknik yapı

| Parça | Kullanılan |
|---|---|
| Framework | React Native + Expo (SDK 54) |
| Navigation | Expo Router |
| Data | `@react-native-async-storage/async-storage` |
| Notifications | `expo-notifications` (local scheduled) |
| Date picker | `@react-native-community/datetimepicker` |

Proje yapısı:

```
app/(tabs)/         # Hedefler (index), Gün Gün (day), Takvim (calendar),
                    #   Yapılacaklar (todos), Rapor (reports)
app/goal-form.tsx   # hedef oluşturma/düzenleme modalı
components/         # GoalCard, MascotCard, StreakHeader, EmptyState, PermissionBanner, SectionHeader
context/            # GoalsContext — goals/streak/kategori/todo/etkinlik state + storage + notification
lib/                # types, date, storage, planner-storage, categories, recurrence,
                    #   streak, reports, smart-plan, notifications, mascot, id
scripts/            # generate-mascot-art.mjs (dev-time fal.ai asset üretimi)
constants/, hooks/  # theme token'ları ve useAppTheme
```

> **Not:** `scripts/generate-mascot-art.mjs` maskot görsellerini fal.ai ile üreten, yalnızca
> geliştirme sırasında elle çalıştırılan bir script'tir. Üretilen PNG'ler `assets/mascot/` altına
> kaydedilir; uygulama çalışma anında hiçbir external API çağrısı yapmaz.

## Kurulum

```bash
npm install
```

Yeni bir native paket eklemek gerekirse `npm install` yerine daima:

```bash
npx expo install <paket-adi>
```

## Çalıştırma (Expo Go)

```bash
npx expo start
```

Terminalde `i` / `a` ile simulator/emulator açabilir, ya da QR kodu Expo Go ile gerçek cihazdan okutabilirsin. Local notification'lar Expo Go içinde tam çalışır (yalnızca remote push Expo Go'da desteklenmiyor, bu proje onu kullanmıyor).

## Local Development Build

`expo-notifications`, `async-storage` ve `datetimepicker` native modül içerdiğinden, tam native davranışı (izin promptları, native tarih seçici vb.) test etmek için development build önerilir:

```bash
npx expo install expo-dev-client
npx expo prebuild
npx expo run:ios       # Xcode + iOS Simulator gerekir
npx expo run:android   # Android Studio + emulator/cihaz gerekir
```

## EAS Build (Android preview / iOS)

```bash
npm install -g eas-cli
eas login
eas build:configure

# Android preview (APK)
eas build -p android --profile preview

# iOS (Apple Developer hesabı gerekir)
eas build -p ios --profile preview
```

Build tamamlanınca EAS, indirilebilir APK / build linkini verir.

## Test senaryosu (final test)

1. Bir goal oluştur, reminder'ı deadline'a göre 1-2 dakika sonrasına denk gelecek şekilde ayarla (ör. reminder = 0 gün, deadline = bugün, cihaz saatini yakın tut) ve bildirimin gerçekten geldiğini doğrula.
2. Goal'ı edit et (deadline/reminder değiştir) → eski notification'ın iptal edilip yenisinin planlandığını doğrula.
3. Goal'ı tamamla → streak'in +1 olduğunu, Completed bölümüne düştüğünü; Undo ile geri alındığında streak'in yeniden hesaplandığını doğrula.
4. Goal'ı sil → bağlı notification'ın iptal edildiğini doğrula.
5. Uygulamayı tamamen kapatıp aç → goals, streak ve notification ID'lerinin korunduğunu doğrula.
6. Deadline'ı geçmiş bir goal ile Overdue state'ini, boş listede Empty state'i kontrol et.
7. Tekrarlayan bir alışkanlık oluştur (ör. "haftanın günleri: Pzt/Çar/Cum", iki hatırlatma saati) →
   Takvim sekmesinde yalnızca o günlerin işaretlendiğini, Gün Gün'de geçmiş günlerin doldurulabildiğini
   ve gelecek günlerin kilitli olduğunu doğrula.
8. Kendi kategorini oluştur, bir hedefe ata, sonra kategoriye uzun basıp sil → hedefin "Genel"e
   düştüğünü doğrula.

## Notlar

- Backend, external API veya login yoktur; tüm veri cihazda tutulur.
- Secret / API key hard-code edilmemiştir.
- Goal sayısı için sabit bir limit veya demo data yoktur.
