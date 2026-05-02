# PRD Web Presensi Mahasiswa

## Ringkasan Produk
Web presensi mahasiswa untuk mencatat kehadiran per mata kuliah, menentukan status kehadiran otomatis berdasarkan batas waktu presensi, dan menampilkan ringkasan kelas dalam satu dashboard.

## Tujuan
- Mempercepat pencatatan presensi perkuliahan.
- Mengurangi kesalahan manual saat menentukan status kehadiran.
- Memberikan visibilitas cepat untuk dosen atau admin akademik.

## Pengguna Utama
- Admin akademik
- Dosen pengampu

## Ruang Lingkup MVP
- Form input presensi mahasiswa.
- Penentuan status otomatis berdasarkan jam WITA dan cutoff tiap mata kuliah.
- Riwayat presensi dengan filter.
- Ringkasan harian dan statistik cepat.
- Penyimpanan persisten menggunakan Postgres.

## Kebutuhan Fungsional
1. Admin dapat menambahkan presensi dengan nama mahasiswa, NIM, fakultas, mata kuliah, tanggal, dan catatan.
2. Sistem otomatis mencatat jam check-in saat submit.
3. Sistem otomatis memberi status `hadir` atau `terlambat` berdasarkan cutoff mata kuliah.
4. Satu mahasiswa hanya boleh memiliki satu presensi untuk mata kuliah yang sama pada tanggal yang sama.
5. Admin dapat mengubah dan menghapus catatan presensi.
6. Dashboard menampilkan statistik total, hadir, terlambat, jumlah mahasiswa unik, dan fakultas aktif.
7. Riwayat dapat difilter berdasarkan nama/NIM, status, fakultas, mata kuliah, dan tanggal.

## Non-Fungsional
- UI harus nyaman dipakai di desktop dan mobile.
- Respons antarmuka harus ringan untuk data kelas harian.
- Struktur kode mudah dikembangkan ke QR attendance, autentikasi, atau ekspor laporan.

## Aturan Bisnis
- Zona waktu utama: `WITA (UTC+08:00)`.
- Status `hadir` jika `check_in_time <= cutoff_time`.
- Status `terlambat` jika `check_in_time > cutoff_time`.
- Validasi wajib: nama mahasiswa, fakultas, mata kuliah, dan tanggal.

## Kriteria Sukses
- Admin bisa menambahkan presensi baru kurang dari 15 detik.
- Status presensi konsisten dengan aturan mata kuliah.
- Dashboard langsung memperlihatkan kondisi presensi hari ini tanpa perlu membuka seluruh tabel.
