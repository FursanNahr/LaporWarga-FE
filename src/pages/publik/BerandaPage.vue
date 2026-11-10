<script setup>
import HeroSection from '@/components/beranda/HeroSection.vue'
import StatsBar from '@/components/beranda/StatsBar.vue'
import FeedTerdekat from '@/components/beranda/FeedTerdekat.vue'
import TransparansiCard from '@/components/beranda/TransparansiCard.vue'
import CaraPakai from '@/components/beranda/CaraPakai.vue'
import CtaBanner from '@/components/beranda/CtaBanner.vue'
import TentangKami from '@/components/beranda/TentangKami.vue'
</script>

<template>
  <div>
    <HeroSection />
    <StatsBar />

    <div class="mx-auto mt-10 grid w-full max-w-[1120px] gap-6 px-4 lg:grid-cols-[minmax(0,1fr)_19rem]">
      <FeedTerdekat />
      <TransparansiCard class="self-start" />
    </div>

    <div class="mx-auto mt-14 w-full max-w-[1120px] space-y-12 px-4">
      <CaraPakai />
      <TentangKami />
      <CtaBanner />
    </div>
  </div>
</template>
