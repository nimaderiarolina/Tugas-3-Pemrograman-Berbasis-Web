Vue.component('do-tracking', {
  template: '#tpl-tracking',
  props: {
    data:          { type: Array,  required: true },
    paketList:     { type: Array,  required: true },
    pengirimanList:{ type: Array,  required: true }
  },
  data: function () {
    return {
      searchDO:       '',
      selectedDO:     null,
      newKeterangan:  '',
      progressError:  '',
      progressSuccess: false
    };
  },
  filters: {
    rupiah: function (n) {
      return 'Rp ' + Number(n).toLocaleString('id-ID');
    }
  },
  computed: {
    filteredDoList: function () {
      var q = this.searchDO.trim().toLowerCase();
      if (!q) return this.data;
      return this.data.filter(function (d) {
        return d.nomorDO.toLowerCase().indexOf(q) !== -1 ||
               d.nama.toLowerCase().indexOf(q)    !== -1 ||
               d.nim.toLowerCase().indexOf(q)      !== -1;
      });
    },
    ekspedisiLabel: function () {
      if (!this.selectedDO) return '';
      var found = this.pengirimanList.find(function (p) {
        return p.kode === this.selectedDO.ekspedisi;
      }, this);
      return found ? found.nama : (this.selectedDO.ekspedisi || '-');
    },
    /* Teks placeholder tombol status otomatis berdasarkan status DO saat ini */
    suggestedStatusList: function () {
      if (!this.selectedDO) return [];
      var status = this.selectedDO.status;
      if (status === 'Menunggu Pengiriman') {
        return ['Paket di-pickup ekspedisi', 'Sedang dalam proses sortir', 'Dalam perjalanan ke hub'];
      }
      if (status === 'Dalam Perjalanan') {
        return ['Tiba di kota tujuan', 'Dalam pengiriman ke penerima', 'Terkirim ke penerima'];
      }
      return ['Paket dikembalikan ke pengirim', 'Sudah diambil di kantor pos'];
    }
  },
  watch: {
    selectedDO: function (newVal) {
      this.newKeterangan  = '';
      this.progressError  = '';
      this.progressSuccess = false;
      if (newVal) {
        console.log('[WATCHER do-tracking] DO dibuka:', newVal.nomorDO, '| Status:', newVal.status);
      }
    },
    searchDO: function (newVal) {
      var self = this;
      if (newVal && self.selectedDO) {
        var stillVisible = self.filteredDoList.some(function (d) {
          return d.nomorDO === self.selectedDO.nomorDO;
        });
        if (!stillVisible) self.selectedDO = null;
      }
    }
  },
  methods: {
    selectDO: function (doItem) {
      this.selectedDO = doItem;
    },
    clearSearch: function () {
      this.searchDO = '';
    },
    paketNama: function (kode) {
      var p = this.paketList.find(function (p) { return p.kode === kode; });
      return p ? p.nama : kode;
    },
    statusBadgeCls: function (status) {
      if (status === 'Terkirim')            return 'badge-green';
      if (status === 'Dalam Perjalanan')    return 'badge-orange';
      if (status === 'Menunggu Pengiriman') return 'badge-blue';
      return 'badge-blue';
    },
    handleSearchKeydown: function (e) {
      if (e.key === 'Escape') this.clearSearch();
      if (e.key === 'Enter' && this.filteredDoList.length > 0) {
        this.selectedDO = this.filteredDoList[0];
      }
    },

    getNowString: function () {
      var now = new Date();
      var pad = function (n) { return String(n).padStart(2, '0'); };
      return now.getFullYear()   + '-' +
             pad(now.getMonth()+1) + '-' +
             pad(now.getDate())    + ' ' +
             pad(now.getHours())   + ':' +
             pad(now.getMinutes()) + ':' +
             pad(now.getSeconds());
    },

    addProgress: function () {
      var self = this;
      self.progressError  = '';
      self.progressSuccess = false;

      if (!self.newKeterangan.trim()) {
        self.progressError = 'Keterangan tidak boleh kosong.';
        return;
      }

      var entry = {
        waktu:      self.getNowString(),
        keterangan: self.newKeterangan.trim()
      };

      if (!self.selectedDO.perjalanan) {
        Vue.set(self.selectedDO, 'perjalanan', []);
      }
      self.selectedDO.perjalanan.push(entry);

      var ket = entry.keterangan.toLowerCase();
      if (ket.indexOf('terkirim') !== -1 || ket.indexOf('diterima') !== -1) {
        self.selectedDO.status = 'Terkirim';
      } else if (ket.indexOf('pickup') !== -1 || ket.indexOf('perjalanan') !== -1 ||
                 ket.indexOf('dalam pengiriman') !== -1 || ket.indexOf('sortir') !== -1 ||
                 ket.indexOf('hub') !== -1 || ket.indexOf('diteruskan') !== -1) {
        self.selectedDO.status = 'Dalam Perjalanan';
      }

      self.newKeterangan   = '';
      self.progressSuccess  = true;
      setTimeout(function () { self.progressSuccess = false; }, 2000);

      console.log('[do-tracking] Progress ditambahkan ke', self.selectedDO.nomorDO, ':', entry);
    },

    handleProgressKeydown: function (e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        this.addProgress();
      }
    },

    useSuggestedStatus: function (text) {
      this.newKeterangan = text;
      this.$nextTick(function () {
        var inp = this.$el.querySelector('#input-progress');
        if (inp) inp.focus();
      });
    }
  },
  mounted: function () {
    if (this.data.length) this.selectedDO = this.data[0];
  }
});
