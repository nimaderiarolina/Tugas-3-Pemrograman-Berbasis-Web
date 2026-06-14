Vue.component('order-form', {
  template: '#tpl-order',
  props: {
    paket:          { type: Array, required: true },
    ekspedisi:      { type: Array, required: true },
    stokList:       { type: Array, required: true },
    existingDoList: { type: Array, required: true }
  },
  data: function () {
    return {
      form: {
        nim: '', nama: '', ekspedisi: '', paketKode: '', tanggalKirim: ''
      },
      formErrors: {},
      submitted:  false
    };
  },
  filters: {
    rupiah: function (n) {
      return 'Rp ' + Number(n).toLocaleString('id-ID');
    },
    tanggalIndo: function (val) {
      if (!val) return '-';
      var bulan = ['Januari','Februari','Maret','April','Mei','Juni',
                   'Juli','Agustus','September','Oktober','November','Desember'];
      var parts = val.split('-');
      if (parts.length !== 3) return val;
      return parseInt(parts[2], 10) + ' ' + bulan[parseInt(parts[1], 10) - 1] + ' ' + parts[0];
    }
  },
  computed: {
    nextNomorDO: function () {
      var year = new Date().getFullYear();
      var seq  = this.existingDoList.length + 1;
      return 'DO' + year + '-' + String(seq).padStart(3, '0');
    },
    selectedPaketDetail: function () {
      if (!this.form.paketKode) return null;
      var self  = this;
      var found = this.paket.find(function (p) { return p.kode === self.form.paketKode; });
      if (!found) return null;
      var items = found.isi.map(function (kode) {
        var s = self.stokList.find(function (s) { return s.kode === kode; });
        return s ? (kode + ' — ' + s.judul) : kode;
      });
      return { paket: found, items: items };
    },
    formTotal: function () {
      if (!this.form.paketKode) return 0;
      var self  = this;
      var found = this.paket.find(function (p) { return p.kode === self.form.paketKode; });
      return found ? found.harga : 0;
    },
    tanggalFormatted: function () {
      if (!this.form.tanggalKirim) return '';
      var bulan = ['Januari','Februari','Maret','April','Mei','Juni',
                   'Juli','Agustus','September','Oktober','November','Desember'];
      var parts = this.form.tanggalKirim.split('-');
      if (parts.length !== 3) return this.form.tanggalKirim;
      return parseInt(parts[2], 10) + ' ' + bulan[parseInt(parts[1], 10) - 1] + ' ' + parts[0];
    }
  },
  watch: {
    'form.paketKode': function (newVal) {
      if (newVal && !this.form.tanggalKirim) {
        this.useToday();
      }
      if (this.submitted) this.validateForm();
      console.log('[WATCHER order-form] Paket dipilih:', newVal);
    },
    'form.ekspedisi': function (newVal) {
      if (this.submitted) this.validateForm();
      console.log('[WATCHER order-form] Ekspedisi dipilih:', newVal);
    }
  },
  methods: {
    useToday: function () {
      this.form.tanggalKirim = new Date().toISOString().split('T')[0];
    },
    resetForm: function () {
      this.form       = { nim: '', nama: '', ekspedisi: '', paketKode: '', tanggalKirim: '' };
      this.formErrors = {};
      this.submitted  = false;
      this.useToday();
    },
    validateForm: function () {
      var e = {};
      if (!this.form.nim.trim())
        e.nim = 'NIM tidak boleh kosong';
      else if (!/^\d{6,12}$/.test(this.form.nim.trim()))
        e.nim = 'NIM harus 6–12 digit angka';
      if (!this.form.nama.trim())     e.nama       = 'Nama tidak boleh kosong';
      if (!this.form.ekspedisi)       e.ekspedisi  = 'Pilih jenis ekspedisi';
      if (!this.form.paketKode)       e.paketKode  = 'Pilih paket bahan ajar';
      if (!this.form.tanggalKirim)    e.tanggalKirim = 'Tanggal kirim harus diisi';
      this.formErrors = e;
      return Object.keys(e).length === 0;
    },
    submitDO: function () {
      this.submitted = true;
      if (!this.validateForm()) return;

      var paketObj  = this.paket.find(function (p) { return p.kode === this.form.paketKode; }, this);
      var nomorDO   = this.nextNomorDO;
      var now       = new Date();
      var pad       = function (n) { return String(n).padStart(2, '0'); };
      var nowStr    = now.getFullYear() + '-' + pad(now.getMonth()+1) + '-' + pad(now.getDate()) +
                      ' ' + pad(now.getHours()) + ':' + pad(now.getMinutes()) + ':' + pad(now.getSeconds());

      var newDO = {
        nomorDO:      nomorDO,
        nim:          this.form.nim.trim(),
        nama:         this.form.nama.trim(),
        status:       'Menunggu Pengiriman',
        ekspedisi:    this.form.ekspedisi,
        tanggalKirim: this.form.tanggalKirim,
        paket:        this.form.paketKode,
        total:        paketObj ? paketObj.harga : 0,
        perjalanan: [
          { waktu: nowStr, keterangan: 'DO berhasil dibuat, menunggu pickup ekspedisi' }
        ]
      };

      this.$emit('created', newDO);
      this.resetForm();
    },
    handleKeydown: function (e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        this.submitDO();
      }
    }
  },
  mounted: function () {
    this.useToday();
  }
});
