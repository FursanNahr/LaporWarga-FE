# Struktur Direktori Frontend LaporWarga

## Tujuan

Dokumen ini menjelaskan struktur direktori frontend LaporWarga beserta fungsi setiap folder dan file utama sebagai acuan selama pengembangan aplikasi.

## Struktur Direktori

```text
    LaporWarga-FE/
    ├── public/
    ├── src/
    │   ├── api/
    │   ├── assets/
    │   ├── components/
    │   ├── composables/
    │   ├── constants/
    │   ├── layouts/
    │   ├── pages/
    │   ├── router/
    │   ├── stores/
    │   ├── utils/
    │   ├── App.vue
    │   └── main.js
    ├── .env
    ├── .env.example
    ├── .gitignore
    ├── index.html
    ├── jsconfig.json
    ├── package.json
    ├── README.md
    └── vite.config.js
```

*Catatan: Struktur di atas merupakan ringkasan. Rincian subfolder dan file beserta fungsinya dapat dilihat pada struktur lengkap di bawah ini.*

    LaporWarga-FE/
    ├── public/
    │   └── favicon.ico
    ├── src/
    │   ├── api/                      ← semua komunikasi ke backend
    │   │   ├── index.js              ← instance axios + interceptor (inti)
    │   │   ├── auth.api.js
    │   │   ├── laporan.api.js
    │   │   ├── instansi.api.js
    │   │   ├── notifikasi.api.js
    │   │   ├── admin.api.js
    │   │   ├── support.api.js
    │   │   └── master.api.js
    │   │
    │   ├── assets/
    │   │   ├── images/
    │   │   └── styles/
    │   │       ├── main.css          ← pindahan dari style.css
    │   │       ├── admin.css
    │   │       ├── variables.css     ← warna, font, spacing
    │   │       └── reset.css
    │   │
    │   ├── components/               ← komponen yang dipakai berulang
    │   │   ├── common/               ← generik, dipakai di mana saja
    │   │   │   ├── BaseButton.vue
    │   │   │   ├── BaseInput.vue
    │   │   │   ├── BaseModal.vue
    │   │   │   ├── BaseCard.vue
    │   │   │   ├── BaseBadge.vue
    │   │   │   ├── BaseTable.vue
    │   │   │   ├── BasePagination.vue
    │   │   │   ├── BaseLoading.vue
    │   │   │   ├── BaseToast.vue
    │   │   │   └── BaseEmptyState.vue
    │   │   ├── layout/               ← bagian-bagian layout
    │   │   │   ├── AppNavbar.vue
    │   │   │   ├── AppFooter.vue
    │   │   │   ├── AppSidebar.vue
    │   │   │   └── AppBreadcrumb.vue
    │   │   ├── admin/  
    │   │   │   ├── AgencySection.vue
    │   │   │   ├── DuplicatePanel.vue
    │   │   │   ├── SlaTag.vue
    │   │   │   ├── StaffSection.vue
    │   │   │   └── VerifyForm.vue
    │   │   ├── notifikasi/    
    │   │   │   └── NotifikasiList.vue
    │   │   └── laporan/              ← komponen khusus domain laporan
    │   │       ├── LaporanCard.vue
    │   │       ├── LaporanForm.vue
    │   │       ├── FeedCard.vue
    │   │       ├── LaporanFilter.vue
    │   │       ├── StatusBadge.vue
    │   │       ├── ProgressUpdateForm.vue
    │   │       └── ProgressTimeline.vue
    │   │
    │   ├── composables/              ← logika reusable (fungsi use...)
    │   │   ├── useAuth.js
    │   │   ├── useModal.js
    │   │   ├── usePagination.js
    │   │   ├── useGeolocation.js
    │   │   ├── useFilteredList.js
    │   │   ├── useMasterOptions.js
    │   │   └── useToast.js
    │   │
    │   ├── constants/
    │   │   ├── roles.js              ← PUBLIK, WARGA, INSTANSI, ADMIN
    │   │   └── status.js             ← status laporan
    │   │
    │   ├── layouts/                  ← "pembungkus" halaman
    │   │   ├── PublicLayout.vue      ← navbar + <slot/router-view> + footer
    │   │   ├── DashboardLayout.vue   ← sidebar + topbar (warga/instansi/admin)
    │   │   └── AuthLayout.vue        ← polos untuk Masuk & Daftar
    │   │
    │   ├── pages/                    ← satu file = satu halaman (rute)
    │   │   ├── publik/
    │   │   │   ├── BerandaPage.vue
    │   │   │   ├── CariLaporanPage.vue
    │   │   │   ├── DetailLaporanPage.vue
    │   │   │   ├── PapanTransparansiPage.vue
    │   │   │   ├── PanduanBantuanPage.vue
    │   │   │   ├── MasukPage.vue
    │   │   │   ├── DaftarPage.vue
    │   │   │   ├── TentangPage.vue
    │   │   │   ├── FeedPage.vue
    │   │   │   ├── KebijakanPrivasiPage.vue
    │   │   │   ├── SyaratKetentuanPage.vue
    │   │   │   └── KontakPage.vue
    │   │   ├── warga/
    │   │   │   ├── BuatLaporanPage.vue
    │   │   │   ├── LaporanSayaPage.vue
    │   │   │   ├── NotifikasiPage.vue
    │   │   │   └── ProfilPage.vue
    │   │   ├── instansi/
    │   │   │   ├── DaftarLaporanPage.vue
    │   │   │   ├── KelolaProgressPage.vue
    │   │   │   ├── NotifikasiPage.vue
    │   │   │   └── ProfilPage.vue
    │   │   ├── admin/
    │   │   │   ├── VerifikasiLaporanPage.vue
    │   │   │   ├── KelolaLaporanPage.vue
    │   │   │   ├── DataInstansiPage.vue
    │   │   │   ├── DataMasterPage.vue
    │   │   │   ├── DashboardPage.vue
    │   │   │   ├── ModerasiKomentarPage.vue
    │   │   │   ├── NotifikasiPage.vue
    │   │   │   ├── DetailLaporanAdminPage.vue
    │   │   │   ├── PengaturanSlaPage.vue
    │   │   │   └── LogAuditPage.vue
    │   │   └── NotFoundPage.vue
    │   │
    │   ├── router/
    │   │   ├── index.js              ← createRouter + navigation guard
    │   │   └── routes/
    │   │       ├── publik.routes.js
    │   │       ├── warga.routes.js
    │   │       ├── instansi.routes.js
    │   │       └── admin.routes.js
    │   │
    │   ├── stores/                   ← Pinia
    │   │   ├── auth.store.js         ← token, user, role
    │   │   ├── notifikasi.store.js
    │   │   └── ui.store.js
    │   │
    │   ├── utils/
    │   │   ├── formatDate.js
    │   │   ├── formatStatus.js
    │   │   ├── geo.js
    │   │   └── validators.js
    │   │
    │   ├── App.vue                   ← tipis: hanya <router-view />
    │   └── main.js                   ← bootstrap: app + pinia + router
    │
    ├── .env                          ← VITE_API_BASE_URL=http://localhost:3000/api
    ├── .env.example
    ├── .gitignore
    ├── index.html
    ├── jsconfig.json                 ← supaya alias @ dikenali VS Code
    ├── package.json
    ├── README.md
    └── vite.config.js
