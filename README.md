# Habit Tracker

Exposure AI Academy · Project 9 — React Native + Expo + Local Notifications ile geliştirilmiş, backend gerektirmeyen, local-first bir habit tracker mobil uygulaması.

## Özellikler

- Sınırsız goal oluşturma, düzenleme, silme ve tamamlama (undo destekli)
- İki goal türü:
  - **Tek Seferlik**: zorunlu bitiş tarihi + "X gün önce hatırlat" (tek seferlik reminder)
  - **Tekrarlayan**: bitiş tarihi yok, her gün seçilen saatte tekrar eden hatırlatma; günlük "bugün tamamlandı" toggle'ı ile işaretlenir (brief'in temel kapsamının ötesinde eklenen bonus özellik)
- `expo-notifications` ile cihaz içi zamanlanmış local notification (remote push yok)
- Goal edit/delete/complete olduğunda eski notification otomatik cancel/reschedule edilir
- Active / Overdue / Completed durumları ayrı bölümlerde, net badge'lerle gösterilir
- Günlük streak: art arda her gün en az bir goal tamamlanırsa +1, boş gün geçerse sıfırlanır (`currentStreak`, `bestStreak`)
- Tüm veriler (`goals`, `streak`, notification ID'leri) `AsyncStorage`'da saklanır, app kapanıp açılınca kaybolmaz
- Empty state, form validation, geçmiş reminder zamanı uyarısı ve bildirim izni reddedilme state'i

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
app/                # Expo Router ekranları (index, goal-form modal, _layout)
components/         # GoalCard, StreakHeader, EmptyState, PermissionBanner, SectionHeader
context/            # GoalsContext — goals/streak state + storage + notification orkestrasyonu
lib/                # types, date, storage, streak (saf fonksiyon), notifications, id
constants/, hooks/  # theme token'ları ve useAppTheme
```

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

## Notlar

- Backend, external API veya login yoktur; tüm veri cihazda tutulur.
- Secret / API key hard-code edilmemiştir.
- Goal sayısı için sabit bir limit veya demo data yoktur.
