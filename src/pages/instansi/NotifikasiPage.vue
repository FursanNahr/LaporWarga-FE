<script setup>
import NotifikasiList from '@/components/notifikasi/NotifikasiList.vue'

// Petugas membuka halaman kelola progres dari notifikasi.
const reportRoute = (report) => ({ name: 'instansi-kelola-progress', params: { id: report.id } })
</script>

<template>
  <section class="mx-auto w-full max-w-[1400px] px-5 py-8 lg:px-8">
    <header>
      <h1 class="text-4xl font-extrabold tracking-tight text-maroon sm:text-5xl">
        <span class="relative inline-block">
          Notifikasi
          <svg
            class="absolute -bottom-1.5 left-0 h-2.5 w-full"
            viewBox="0 0 200 12"
            preserveAspectRatio="none"
            fill="none"
            aria-hidden="true"
          >
            <path d="M2 8C45 2 120 2 198 7" stroke="#c1f52f" stroke-width="4" stroke-linecap="round" />
          </svg>
        </span>
      </h1>
      <p class="mt-3 max-w-2xl text-lg text-maroon/80">Laporan baru yang diteruskan dan pembaruan dari laporan yang kamu tangani.</p>
    </header>

    <div class="mt-8 max-w-3xl">
      <NotifikasiList :report-route="reportRoute" />
    </div>
  </section>
</template>