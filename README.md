# Absensi Karyawan

Fitur:
- Login admin dan karyawan
- Admin tambah, edit, dan hapus karyawan
- Admin menentukan jam masuk dan jam pulang berbeda untuk setiap karyawan
- Karyawan absen masuk dan pulang
- Status otomatis: Hadir, Terlambat, Pulang Cepat
- Laporan absensi admin

## Akun demo
Admin:
- Email: admin@absensi.com
- Password: admin123

Karyawan:
- Email: budi@absensi.com
- Password: user123

## Jalankan Backend
```powershell
cd "C:\Users\LENOVO\Documents\VSCode\absensi-karyawan\backend"
npm install
node seed.js
npm run dev
```

## Jalankan Frontend
Buka terminal kedua:
```powershell
cd "C:\Users\LENOVO\Documents\VSCode\absensi-karyawan\frontend"
npm install
npm run dev
```

Buka browser:
```txt
http://localhost:5173
```

## Catatan update
Jika sebelumnya sudah pernah menjalankan project, cukup replace folder lama dengan versi ini. Database lama tetap bisa dipakai karena sistem otomatis menambahkan kolom `work_start` dan `work_end`.
