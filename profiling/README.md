# BidMart Profiling Pack

Dokumen ini fokus ke profiling, bukan monitoring. Output utamanya adalah hasil load test k6 dan rekaman Java Flight Recorder (JFR) untuk service JVM.

## Scope Service

| Service | Target default |
| --- | --- |
| Auth | `http://auth-service:8081` |
| Bidding | `http://bidding-service:8082` |
| Catalog | `http://catalog-service:8083` |
| Wallet | `http://wallet-service:8084` |
| Order | `http://order-service:8085` |
| Notification | `http://notification-service:8086` |
| Frontend | `http://frontend:3000` |

## Quick Run 30 Menit

1. Jalankan seluruh stack BidMart dari folder `bidmart-deployment`.

```bash
docker compose up -d
```

2. Siapkan env profiling.

```bash
cp profiling/profile.env.example profiling/profile.env
```

Isi minimal `USER_ID`. Isi `LISTING_ID`, `AUCTION_ID`, `ORDER_ID`, `JWT_TOKEN`, `AUTH_EMAIL`, `AUTH_PASSWORD`, dan `BIDMART_SESSION` kalau ada data staging/local yang valid. Kalau belum ada, script tetap berjalan dan fokus ke endpoint yang bisa dipanggil tanpa data spesifik.

3. Jalankan load profiling k6 selama 5 menit.

```bash
./profiling/run-k6.sh
```

4. Dalam terminal lain, ambil JFR semua service JVM selama 3 menit.

```bash
./profiling/profile-all-jfr.sh 180s
```

5. Simpan bukti dari folder `profiling-results`.

| Bukti | Lokasi |
| --- | --- |
| Ringkasan k6 | `profiling-results/k6-bidmart-summary.json` |
| Output terminal k6 | screenshot atau copy terminal summary |
| JFR tiap service | `profiling-results/jfr/*.jfr` |

## Mode Strict

Default script mengecek tidak ada response `5xx`. Ini sengaja dipakai agar profiling tetap jalan walaupun data seed belum lengkap dan beberapa endpoint mengembalikan `404` atau `401`.

Untuk bukti final yang lebih kuat, isi semua ID/token valid lalu set:

```bash
STRICT=true ./profiling/run-k6.sh
```

Mode strict mengharapkan status sukses sesuai endpoint yang diprofilkan.

## Justifikasi Profiling

- k6 dipakai untuk memberi beban HTTP yang stabil, repeatable, dan bisa dibatasi durasinya sehingga cocok untuk profiling singkat.
- Skenario dipisah per service agar bottleneck bisa terlihat dari `http_req_duration{service:...}` dan `checks{service:...}`.
- JFR dipakai untuk profiling JVM karena bisa memperlihatkan CPU hotspot, allocation pressure, GC pause, thread blocking, dan lock contention tanpa menambah kode instrumentasi.
- Profiling dilakukan saat load test berjalan, sehingga file JFR merekam perilaku service di bawah beban, bukan kondisi idle.

## Analisis Improvement Awal

| Service | Sinyal profiling | Improvement yang dicek |
| --- | --- | --- |
| Auth | p95 login/validate tinggi, CPU hashing tinggi di JFR | Batasi login VU realistis, cek cost password hashing, indeks email/session, cache permission efektif. |
| Catalog | p95 `/catalog` tinggi, DB wait dominan | Tambah indeks filter/sort catalog, cek pagination dan query category/price/end time. |
| Bidding | p95 bid/history tinggi, lock/blocking tinggi | Audit transaksi bid, idempotency key, indeks `auction_id` untuk bid history, dan call wallet/catalog sinkron. |
| Wallet | p95 wallet summary/transactions tinggi, DB pool penuh | Tambah indeks `wallet_transactions(wallet_id, created_at)`, cek pool Hikari, optimalkan ledger query. |
| Order | p95 list order tinggi | Tambah indeks `orders(buyer_id, created_at)`, `orders(seller_id, created_at)`, dan varian `status`. |
| Notification | p95 list/preference tinggi, allocation tinggi | Indeks `notifications(user_id, read, created_at)`, batasi payload page, cache preference. |
| Frontend | p95 page tinggi | Cek SSR/data fetching berulang, cache route, kurangi waterfall API, optimalkan bundle. |

## Template Link Checklist

| Item | Link |
| --- | --- |
| Bukti profiling k6 | TODO: link screenshot/output terminal k6 |
| Bukti profiling JFR | TODO: link file/screenshot JFR Mission Control |
| Commit profiling | TODO: `https://github.com/advprog-2026-B02-project/bidmart-deployment/commit/<sha>` |
| Branch 100% milestone | TODO: `https://github.com/advprog-2026-B02-project/bidmart-deployment/tree/<branch>` |

## Membaca Hasil

Gunakan k6 summary untuk melihat:

- `http_req_duration p(95)` per service.
- `http_req_failed` untuk error transport/status yang dianggap gagal.
- `checks` untuk rasio endpoint tanpa `5xx` atau status strict.

Gunakan JFR Mission Control untuk melihat:

- `Method Profiling` untuk CPU hotspot.
- `Memory` dan `Allocation in new TLAB/outside TLAB` untuk allocation pressure.
- `Garbage Collections` untuk pause/heap pressure.
- `Threads`, `Socket Read`, dan `Java Monitor Blocked` untuk blocking dependency.
