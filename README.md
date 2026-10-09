# DSP Data Hub — versi awal

Aplikasi contoh untuk pemula: dashboard, data master, impor/ekspor Excel, dan laporan cetak/PDF. Stack: Cloudflare Workers + D1 + HTML/CSS/JavaScript + SheetJS.

## Penting sebelum digunakan
- Versi ini **belum memiliki login atau kontrol akses**. Jangan masukkan data rahasia/internal atau publikasikan sebelum autentikasi, otorisasi, dan kebijakan keamanan organisasi diterapkan.
- SheetJS dimuat dari CDN, sehingga impor/ekspor Excel memerlukan koneksi internet.
- Endpoint impor membatasi maksimal 2.000 baris per permintaan. Data tidak valid dilewati.
- Kode ini adalah starter project, bukan sistem produksi yang sudah diaudit.

## Prasyarat
1. Akun Cloudflare.
2. Node.js versi LTS.
3. Terminal / Command Prompt.
4. Wrangler CLI.

## A. Jalankan lokal
1. Ekstrak ZIP ini.
2. Buka terminal pada folder `dsp-data-hub`.
3. Instal Wrangler:

   ```bash
   npm install -D wrangler
   npx wrangler login
   ```

4. Buat database D1:

   ```bash
   npx wrangler d1 create dsp-data-hub-db
   ```

5. Perintah tersebut akan menampilkan `database_id`. Salin nilainya ke `wrangler.toml`, menggantikan `REPLACE_WITH_YOUR_D1_DATABASE_ID`.
6. Terapkan skema database:

   ```bash
   npx wrangler d1 migrations apply dsp-data-hub-db --local
   ```

7. Jalankan server lokal:

   ```bash
   npx wrangler dev
   ```

8. Buka alamat lokal yang ditampilkan Wrangler, biasanya `http://localhost:8787`.

## B. Buat database produksi
Setelah pengujian lokal selesai:

```bash
npx wrangler d1 migrations apply dsp-data-hub-db --remote
```

## C. Publikasikan aplikasi
Pastikan `database_id` di `wrangler.toml` benar, lalu jalankan:

```bash
npx wrangler deploy
```

Wrangler akan menampilkan URL aplikasi. Periksa log dan uji seluruh fitur setelah deploy.

## Kolom file Excel
Baris pertama harus berisi judul kolom berikut (nama kolom dikenali tanpa membedakan huruf besar/kecil untuk beberapa nama umum):

- Kode K/L
- Nama K/L (wajib)
- Program
- Kegiatan
- Output / RO
- Satuan
- Anggaran
- Keterangan

Gunakan template yang tersedia dari menu Data. Hapus baris contoh sebelum mengimpor.

## Struktur folder

```text
dsp-data-hub/
├── wrangler.toml
├── migrations/
│   └── 0001_create_records.sql
├── src/
│   └── index.js
└── public/
    └── index.html
```

## Sebelum dipakai untuk data organisasi
Tambahkan login/SSO sesuai kebijakan organisasi, pembatasan akses API, validasi impor lebih ketat, audit log, backup/retensi, dan peninjauan keamanan. Konfirmasikan penggunaan Cloudflare dan penyimpanan data dengan pengelola TI/keamanan informasi organisasi.
