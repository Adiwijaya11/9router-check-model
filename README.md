# 9Router Check

> Unofficial CLI tool untuk mengecek ketersediaan dan kesehatan model AI pada server 9Router.

[![npm version](https://img.shields.io/npm/v/9router-check.svg)](https://www.npmjs.com/package/9router-check)
[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](LICENSE)

---

## Daftar Isi

- [Apa itu 9Router Check?](#apa-itu-9router-check)
- [Fitur](#fitur)
- [Persyaratan](#persyaratan)
- [Instalasi](#instalasi)
- [Konfigurasi](#konfigurasi)
- [Cara Penggunaan](#cara-penggunaan)
- [Opsi CLI](#opsi-cli)
- [Contoh Penggunaan](#contoh-penggunaan)
- [Format Output](#format-output)
- [Keterangan Status](#keterangan-status)
- [Struktur Proyek](#struktur-proyek)
- [Pengembangan](#pengembangan)
- [Troubleshooting](#troubleshooting)
- [Lisensi](#lisensi)
- [Disclaimer](#disclaimer)

---

## Apa itu 9Router Check?

**9Router Check** adalah tool command-line yang membantu Anda memantau ketersediaan dan kesehatan model AI melalui server 9Router. Tool ini terhubung ke instance 9Router Anda, menemukan semua model yang tersedia, dan menguji masing-masing model untuk memberikan informasi status secara real-time.

### Masalah yang Diatasi

- **Ketersediaan Model** — Cek dengan cepat model mana yang aktif dan siap digunakan
- **Monitoring Latency** — Ukur waktu respons setiap model
- **Deteksi Error** — Identifikasi rate limit, timeout, dan error provider
- **Health Monitoring** — Cek berkala untuk memastikan infrastruktur AI Anda berjalan baik

---

## Fitur

- **Dynamic Model Discovery** — Otomatis mengambil daftar model dari server 9Router
- **Concurrent Testing** — Uji banyak model secara bersamaan dengan concurrency yang bisa dikonfigurasi
- **Smart Retry Logic** — Otomatis retry request yang gagal dengan exponential backoff
- **Multiple Output Formats** — Output Terminal, JSON, dan CSV
- **Error Classification** — Mengkategorikan error ke dalam status yang mudah dipahami
- **Provider Filtering** — Filter model berdasarkan provider
- **Timeout Protection** — Mencegah request menggantung menghalangi seluruh proses pengecekan

---

## Persyaratan

| Komponen | Versi Minimum |
|----------|---------------|
| Node.js | >= 18.0.0 |
| npm | >= 9.0.0 |
| Server 9Router | Berjalan dan dapat diakses |

---

## Instalasi

### Opsi 1: Install dari npm (Recommended)

```bash
npm install -g 9router-check
```

Setelah install, Anda bisa langsung menjalankan dari terminal mana saja:

```bash
9router-check
```

### Opsi 2: Install via npx (Tanpa install)

```bash
npx 9router-check
```

### Opsi 3: Install dari Source

```bash
# Clone repository
git clone https://github.com/Adiwijaya11/9router-check-model.git
cd 9router-check-model

# Install dependencies
npm install

# Build project
npm run build

# Jalankan
npm start
```

---

## Konfigurasi

### Environment Variables

| Variable | Wajib | Default | Keterangan |
|----------|-------|---------|------------|
| `NINE_ROUTER_BASE_URL` | Tidak | `http://localhost:20128/v1` | Base URL API 9Router |
| `NINE_ROUTER_API_KEY` | Ya | — | API key 9Router Anda |

### Cara Konfigurasi

**Opsi 1: File `.env`**

Buat file `.env` di root project:

```env
NINE_ROUTER_BASE_URL=http://localhost:20128/v1
NINE_ROUTER_API_KEY=your-api-key-here
```

**Opsi 2: Environment Variable di Terminal**

Linux / macOS:
```bash
export NINE_ROUTER_BASE_URL=http://localhost:20128/v1
export NINE_ROUTER_API_KEY=your-api-key-here
```

Windows (PowerShell):
```powershell
$env:NINE_ROUTER_BASE_URL="http://localhost:20128/v1"
$env:NINE_ROUTER_API_KEY="your-api-key-here"
```

**Opsi 3: Prompt Interaktif**

Jika `NINE_ROUTER_API_KEY` tidak diset, tool akan meminta Anda memasukkan API key saat dijalankan.

---

## Cara Penggunaan

### Menjalankan Pengecekan

```bash
# Pengecekan dasar
9router-check

# Dengan concurrency 5
9router-check --concurrency 5

# Output sebagai JSON
9router-check --json

# Output sebagai CSV
9router-check --csv

# Filter berdasarkan provider
9router-check --provider cc

# Kombinasi opsi
9router-check --concurrency 5 --json --provider cc
```

### Alur Kerja

1. Tool membaca konfigurasi (Base URL & API key)
2. Tool mengambil daftar semua model dari server 9Router
3. Tool menguji setiap model dengan mengirim request chat completion
4. Hasil ditampilkan per provider dengan status masing-masing model
5. Ringkasan dan rekomendasi model terbaik ditampilkan di akhir

---

## Opsi CLI

| Opsi | Short | Default | Keterangan |
|------|-------|---------|------------|
| `--help` | `-h` | — | Tampilkan pesan bantuan |
| `--version` | `-v` | — | Tampilkan versi |
| `--base-url <url>` | `-b` | `http://localhost:20128/v1` | Base URL 9Router |
| `--concurrency <n>` | `-c` | `3` | Maksimal request bersamaan |
| `--provider <name>` | `-p` | — | Filter berdasarkan provider |
| `--json` | — | `false` | Output sebagai JSON |
| `--csv` | — | `false` | Output sebagai CSV |

---

## Contoh Penggunaan

### Contoh 1: Pengecekan Sederhana

```bash
$ 9router-check

╔══════════════════════════════════════════════════════════╗
║      9Router Model Checker v0.1.0                       ║
╚══════════════════════════════════════════════════════════╝

Base URL: http://localhost:20128/v1
API Key: ***abcd

Fetching models...

Cek model dari provider: cc (5 model)
✓ claude-opus-4-5-20251101   HIDUP            1.21s
✓ claude-sonnet-4-20250514   HIDUP            0.95s
✗ claude-haiku-4-20251001     MATI             0.50s

Cek model dari provider: gemini (3 model)
✓ gemini-pro                 HIDUP            0.80s
⚠ gemini-flash               LIMIT            2.10s

──────────────────────────────────────────────────
Total Model   : 8
Hidup         : 3
Mati          : 1
Limit         : 1
Timeout       : 0
Auth Error    : 0
Provider Error: 0
Invalid       : 0
Unknown       : 0
──────────────────────────────────────────────────
```

### Contoh 2: Output JSON

```bash
$ 9router-check --json
```

```json
{
  "summary": {
    "total": 8,
    "active": 3,
    "unavailable": 1,
    "rateLimited": 1,
    "timeout": 0,
    "authError": 0,
    "providerError": 0,
    "invalidResponse": 0,
    "unknownError": 0
  },
  "providers": [
    {
      "name": "cc",
      "models": [
        {
          "id": "claude-opus-4-5-20251101",
          "status": "ACTIVE",
          "latencyMs": 1210
        }
      ]
    }
  ]
}
```

### Contoh 3: Output CSV

```bash
$ 9router-check --csv
```

```csv
provider,model,status,latencyMs,error
cc,claude-opus-4-5-20251101,ACTIVE,1210,
cc,claude-sonnet-4-20250514,ACTIVE,950,
cc,claude-haiku-4-20251001,UNAVAILABLE,500,Model not found
```

---

## Format Output

### Terminal Output

Menampilkan hasil pengecekan secara visual dengan warna:
- **Hijau** — Model aktif dan berfungsi normal
- **Merah** — Model mati/error
- **Kuning** — Rate limit atau timeout
- **Ungu** — Error tidak dikenali

### JSON Output

Output terstruktur yang cocok untuk:
- Integrasi dengan sistem lain
- Monitoring otomatis
- Logging dan analisis

### CSV Output

Output tabular yang cocok untuk:
- Import ke spreadsheet
- Reporting
- Analisis data

---

## Keterangan Status

| Status | Simbol | Keterangan |
|--------|--------|------------|
| `ACTIVE` | ✓ | Model berfungsi normal dan dapat digunakan |
| `UNAVAILABLE` | ✗ | Model tidak ditemukan atau tidak tersedia |
| `RATE_LIMITED` | ⚠ | Rate limit exceeded (429) — terlalu banyak request |
| `AUTH_ERROR` | ✗ | Authentication gagal (401/403) — API key salah/expired |
| `PROVIDER_ERROR` | ✗ | Provider server error (5xx) — masalah di sisi provider |
| `TIMEOUT` | ⚠ | Request timeout — model terlalu lambat merespons |
| `INVALID_RESPONSE` | ✗ | Response tidak valid — format response salah |
| `UNKNOWN_ERROR` | ? | Error tidak dikenali — perlu investigasi lebih lanjut |

---

## Struktur Proyek

```
9router-check-model/
│
├── src/
│   ├── index.ts              # CLI entry point
│   ├── config/
│   │   └── config.ts         # Configuration management
│   ├── router/
│   │   ├── client.ts         # 9Router API client
│   │   └── models.ts         # Model discovery
│   ├── tester/
│   │   ├── model-tester.ts   # Model health checker
│   │   ├── concurrency.ts    # Concurrency controller
│   │   └── retry.ts          # Retry logic
│   ├── classifier/
│   │   └── error-classifier.ts # Error classification
│   ├── output/
│   │   ├── terminal.ts       # Terminal output
│   │   ├── json.ts           # JSON output
│   │   └── csv.ts            # CSV output
│   └── types/
│       └── index.ts          # Type definitions
│
├── dist/                     # Compiled JavaScript
├── package.json
├── tsconfig.json
├── .env.example
├── .gitignore
└── README.md
```

---

## Pengembangan

### Setup Development

```bash
git clone https://github.com/Adiwijaya11/9router-check-model.git
cd 9router-check-model
npm install
```

### Scripts yang Tersedia

| Perintah | Keterangan |
|----------|------------|
| `npm run dev` | Jalankan dalam mode development dengan ts-node |
| `npm run build` | Compile TypeScript ke JavaScript |
| `npm start` | Jalankan hasil compile |
| `npm test` | Jalankan semua test |

### Menjalankan Test

```bash
npm test
```

Test terletak di samping file source dengan ekstensi `.test.ts`.

---

## Troubleshooting

### Error: "Configuration errors"

**Penyebab:** API key tidak diset atau tidak valid.

**Solusi:**
```bash
export NINE_ROUTER_API_KEY=your-api-key-here
```

### Error: "Error connecting to 9Router"

**Penyebab:** Server 9Router tidak berjalan atau Base URL salah.

**Solusi:**
1. Pastikan 9Router berjalan: `curl http://localhost:20128/v1/models`
2. Cek Base URL benar
3. Cek koneksi network

### Error: "AUTH ERROR" pada semua model

**Penyebab:** API key salah atau expired.

**Solusi:**
1. Cek API key Anda benar
2. Generate API key baru dari dashboard 9Router

### Error: "TIMEOUT" pada banyak model

**Penyebab:** Server 9Router lambat atau concurrency terlalu tinggi.

**Solusi:**
```bash
# Kurangi concurrency
9router-check --concurrency 1
```

---

## Lisensi

ISC License — lihat file [LICENSE](LICENSE) untuk detail lengkap.

---

## Disclaimer

> ⚠️ Ini adalah tool **unofficial** dan tidak berafiliasi dengan atau didukung oleh 9Router. Gunakan dengan risiko Anda sendiri.
