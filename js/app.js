Vue.filter('rupiah', function (n) { return 'Rp ' + Number(n).toLocaleString('id-ID'); });
Vue.filter('satuanBuah', function (n) { return Number(n).toLocaleString('id-ID') + ' buah'; });

var app = new Vue({
  el: '#app',

  data: {
    tab: 'stok',
    loading: true,
    error: null,

    upbjjList:      [],
    kategoriList:   [],
    pengirimanList: [],
    paketList:      [],
    stok:           [],
    doList:         [],

    filterUpbjj:    '',
    filterKategori: '',
    filterReorder:  false,
    filterKosong:   false,
    sortField:      'judul',
    sortAsc:        true,

    showAddModal:  false,
    showEditModal: false,
    editItem:      null,
    editErrors:    {},
    newItem:       { kode:'', judul:'', kategori:'', upbjj:'', lokasiRak:'', harga:'', qty:'', safety:'', catatanHTML:'', _showTooltip: false },
    addErrors:     {},

    toast: { show: false, message: '', type: 'success', _timer: null },

    showAddDOModal: false,
  },

  computed: {
    filteredKategoriList: function () {
      if (!this.filterUpbjj) return [];
      var upbjj = this.filterUpbjj;
      var available = this.stok
        .filter(function (s) { return s.upbjj === upbjj; })
        .map(function (s) { return s.kategori; });
      return available.filter(function (v, i, a) { return a.indexOf(v) === i; });
    },

    filteredStok: function () {
      var list = this.stok.slice();
      var fu = this.filterUpbjj, fk = this.filterKategori;
      var fr = this.filterReorder, fko = this.filterKosong;

      if (fu)  list = list.filter(function (s) { return s.upbjj    === fu; });
      if (fk)  list = list.filter(function (s) { return s.kategori === fk; });
      if (fko) list = list.filter(function (s) { return s.qty === 0; });
      else if (fr) list = list.filter(function (s) { return s.qty < s.safety; });

      var sf = this.sortField, sa = this.sortAsc;
      list.sort(function (a, b) {
        var va = a[sf], vb = b[sf];
        if (typeof va === 'string') { va = va.toLowerCase(); vb = vb.toLowerCase(); }
        if (va < vb) return sa ? -1 :  1;
        if (va > vb) return sa ?  1 : -1;
        return 0;
      });
      return list;
    },

    totalStok:    function () { return this.stok.reduce(function (s, i) { return s + i.qty; }, 0); },
    totalReorder: function () { return this.stok.filter(function (s) { return s.qty < s.safety; }).length; },
    totalKosong:  function () { return this.stok.filter(function (s) { return s.qty === 0; }).length; },
    totalHarga:   function () {
      return this.filteredStok.reduce(function (s, i) { return s + i.qty * i.harga; }, 0);
    },
    reorderCount: function () { return this.totalReorder; },

    toastIcon: function () {
      if (this.toast.type === 'success') return 'fa-circle-check';
      if (this.toast.type === 'warning') return 'fa-circle-exclamation';
      return 'fa-circle-xmark';
    },
    toastColor: function () {
      if (this.toast.type === 'success') return '#56a472';
      if (this.toast.type === 'warning') return '#e79455';
      return '#e73952';
    },

    statUpbjj:  function () { return this.upbjjList.length; },
    statDO:     function () { return this.doList.length; },
    statPaket:  function () { return this.paketList.length; },
  },

  watch: {
    totalReorder: function (newVal, oldVal) {
      if (newVal > oldVal) {
        console.warn('[WATCHER] Jumlah bahan ajar perlu reorder bertambah:', newVal);
      }
    },
    filterUpbjj: function (newVal) {
      this.filterKategori = '';
      console.log('[WATCHER] UT-Daerah filter berubah ke:', newVal || '(semua)');
    },
    stok: {
      deep: true,
      handler: function (newVal) {
        console.log('[WATCHER] Data stok berubah. Total:', newVal.length,
                    '| Reorder:', newVal.filter(function (s) { return s.qty < s.safety; }).length);
      }
    },
    doList: function (newVal, oldVal) {
      if (newVal.length > oldVal.length) {
        console.log('[WATCHER] DO baru ditambahkan. Total DO:', newVal.length);
      }
    },
    tab: function (newVal) {
      console.log('[WATCHER] Tab berubah ke:', newVal);
    }
  },

  methods: {
    formatRupiah: function (n) {
      return 'Rp ' + Number(n).toLocaleString('id-ID');
    },
    formatTanggalIndo: function (val) {
      if (!val) return '-';
      var bulan = ['Januari','Februari','Maret','April','Mei','Juni',
                   'Juli','Agustus','September','Oktober','November','Desember'];
      var parts = val.split('-');
      if (parts.length !== 3) return val;
      return parseInt(parts[2], 10) + ' ' + bulan[parseInt(parts[1], 10) - 1] + ' ' + parts[0];
    },

    showToast: function (message, type) {
      var self = this;
      if (self.toast._timer) clearTimeout(self.toast._timer);
      self.toast.message = message;
      self.toast.type    = type || 'success';
      self.toast.show    = true;
      self.toast._timer  = setTimeout(function () { self.toast.show = false; }, 3000);
    },

    setSort: function (field) {
      if (this.sortField === field) this.sortAsc = !this.sortAsc;
      else { this.sortField = field; this.sortAsc = true; }
    },
    sortIcon: function (field) {
      if (this.sortField !== field) return '↕';
      return this.sortAsc ? '↑' : '↓';
    },

    resetFilter: function () {
      this.filterUpbjj    = '';
      this.filterKategori = '';
      this.filterReorder  = false;
      this.filterKosong   = false;
      this.sortField      = 'judul';
      this.sortAsc        = true;
    },

    openAddModal: function () {
      this.newItem   = { kode:'', judul:'', kategori:'', upbjj:'', lokasiRak:'', harga:'', qty:'', safety:'', catatanHTML:'', _showTooltip: false };
      this.addErrors = {};
      this.showAddModal = true;
    },
    validateAdd: function () {
      var e    = {};
      var self = this;
      if (!self.newItem.kode.trim())      e.kode      = 'Kode tidak boleh kosong';
      else if (self.stok.find(function (s) { return s.kode === self.newItem.kode.trim(); }))
                                          e.kode      = 'Kode sudah ada';
      if (!self.newItem.judul.trim())     e.judul     = 'Judul tidak boleh kosong';
      if (!self.newItem.kategori)         e.kategori  = 'Pilih kategori';
      if (!self.newItem.upbjj)            e.upbjj     = 'Pilih UT-Daerah';
      if (!self.newItem.lokasiRak.trim()) e.lokasiRak = 'Lokasi rak tidak boleh kosong';
      if (self.newItem.harga  === '' || isNaN(self.newItem.harga)  || Number(self.newItem.harga)  < 0) e.harga  = 'Harga tidak valid';
      if (self.newItem.qty    === '' || isNaN(self.newItem.qty)    || Number(self.newItem.qty)    < 0) e.qty    = 'Qty tidak valid';
      if (self.newItem.safety === '' || isNaN(self.newItem.safety) || Number(self.newItem.safety) < 0) e.safety = 'Safety tidak valid';
      self.addErrors = e;
      return Object.keys(e).length === 0;
    },
    submitAdd: function () {
      if (!this.validateAdd()) return;
      var judul = this.newItem.judul.trim();
      this.stok.push({
        kode:         this.newItem.kode.trim(),
        judul:        judul,
        kategori:     this.newItem.kategori,
        upbjj:        this.newItem.upbjj,
        lokasiRak:    this.newItem.lokasiRak.trim(),
        harga:        Number(this.newItem.harga),
        qty:          Number(this.newItem.qty),
        safety:       Number(this.newItem.safety),
        catatanHTML:  this.newItem.catatanHTML,
        _showTooltip: false,
      });
      this.showAddModal = false;
      this.showToast('Bahan ajar "' + judul + '" berhasil ditambahkan.', 'success');
    },
    handleAddKeydown: function (e) {
      if (e.key === 'Enter') { e.preventDefault(); this.submitAdd(); }
    },

    openEdit: function (item) {
      this.editItem = {
        kode: item.kode, judul: item.judul, kategori: item.kategori,
        upbjj: item.upbjj, lokasiRak: item.lokasiRak,
        harga: item.harga, qty: item.qty, safety: item.safety,
        catatanHTML: item.catatanHTML,
      };
      this.editErrors   = {};
      this.showEditModal = true;
    },
    validateEdit: function () {
      var e    = {};
      var self = this;
      if (!self.editItem.judul.trim())     e.judul     = 'Judul tidak boleh kosong';
      if (!self.editItem.kategori)         e.kategori  = 'Pilih kategori';
      if (!self.editItem.upbjj)            e.upbjj     = 'Pilih UT-Daerah';
      if (!self.editItem.lokasiRak.trim()) e.lokasiRak = 'Lokasi rak tidak boleh kosong';
      if (self.editItem.harga  === '' || isNaN(self.editItem.harga)  || Number(self.editItem.harga)  < 0) e.harga  = 'Harga tidak valid';
      if (self.editItem.qty    === '' || isNaN(self.editItem.qty)    || Number(self.editItem.qty)    < 0) e.qty    = 'Qty tidak valid';
      if (self.editItem.safety === '' || isNaN(self.editItem.safety) || Number(self.editItem.safety) < 0) e.safety = 'Safety tidak valid';
      self.editErrors = e;
      return Object.keys(e).length === 0;
    },
    submitEdit: function () {
      if (!this.validateEdit()) return;
      var idx = this.stok.findIndex(function (s) { return s.kode === this.editItem.kode; }, this);
      if (idx !== -1) {
        Vue.set(this.stok, idx, {
          kode:         this.editItem.kode,
          judul:        this.editItem.judul.trim(),
          kategori:     this.editItem.kategori,
          upbjj:        this.editItem.upbjj,
          lokasiRak:    this.editItem.lokasiRak.trim(),
          harga:        Number(this.editItem.harga),
          qty:          Number(this.editItem.qty),
          safety:       Number(this.editItem.safety),
          catatanHTML:  this.editItem.catatanHTML,
          _showTooltip: false,
        });
      }
      var judul = this.editItem.judul.trim();
      this.showEditModal = false;
      this.editItem = null;
      this.showToast('Bahan ajar "' + judul + '" berhasil diperbarui.', 'warning');
    },
    handleEditKeydown: function (e) {
      if (e.key === 'Enter') { e.preventDefault(); this.submitEdit(); }
    },

    requestDelete: function (item) {
      var self = this;
      this.$refs.confirmModal.open({
        title:     'Hapus Bahan Ajar',
        message:   'Yakin ingin menghapus "' + item.judul + '" (' + item.kode + ')? Tindakan ini tidak dapat dibatalkan.',
        onConfirm: function () {
          var idx = self.stok.findIndex(function (s) { return s.kode === item.kode; });
          if (idx !== -1) self.stok.splice(idx, 1);
          self.showToast('Bahan ajar "' + item.judul + '" berhasil dihapus.', 'error');
        }
      });
    },

    handleNewDO: function (newDO) {
      this.doList.push(newDO);
      this.tab = 'tracking';
      this.showToast('DO ' + newDO.nomorDO + ' berhasil dibuat!', 'success');
    },
  },

  mounted: function () {
    var self = this;
    ApiService.fetchData()
      .then(function (data) {
        self.upbjjList      = data.upbjjList;
        self.kategoriList   = data.kategoriList;
        self.pengirimanList = data.pengirimanList;
        self.paketList      = data.paket;
        self.stok = data.stok.map(function (s) { return Object.assign({ _showTooltip: false }, s); });

        var doArr = [];
        if (Array.isArray(data.tracking)) {
          var seen = {};
          data.tracking.forEach(function (obj) {
            Object.keys(obj).forEach(function (key) {
              if (!seen[key]) {
                seen[key] = true;
                doArr.push(Object.assign({ nomorDO: key }, obj[key]));
              }
            });
          });
        } else {
          Object.keys(data.tracking).forEach(function (key) {
            doArr.push(Object.assign({ nomorDO: key }, data.tracking[key]));
          });
        }
        self.doList = doArr;
        self.loading = false;
      })
      .catch(function (err) {
        self.error   = err.message;
        self.loading = false;
        console.error('[app.js] Gagal memuat data:', err);
      });
  }
});
