// DATA DUMMY komentar. Endpoint komentar belum ada, jadi DetailCommentBox memakai ini.
// Saat endpoint siap: hapus file ini, lalu di DetailCommentBox.vue ganti IS_DUMMY dan
// fungsi submit() dengan pemanggilan API. Bentuk item sengaja dibuat mirip response yang wajar:
//   { id, authorName, authorRole, text, photos: [url], createdAt }
const hoursAgo = (hours) => new Date(Date.now() - hours * 3600 * 1000).toISOString()

export const COMMENTS_DUMMY = [
  {
    id: 'dummy-1',
    authorName: 'Petugas Dishub Kota Bandung',
    authorRole: 'INSTANSI',
    text: 'Terima kasih atas laporannya. Tim kami sudah menuju lokasi untuk penanganan.',
    photos: [],
    createdAt: hoursAgo(5),
  },
  {
    id: 'dummy-2',
    authorName: 'Warga sekitar',
    authorRole: 'WARGA',
    text: 'Betul, titik ini memang sering bermasalah. Semoga cepat beres.',
    photos: [],
    createdAt: hoursAgo(26),
  },
]