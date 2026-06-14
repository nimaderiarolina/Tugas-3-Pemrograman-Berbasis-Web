Vue.component('ba-stock-table', {
  template: '#tpl-stock',
  props: {
    items:     { type: Array,  required: true },
    sortField: { type: String, default: 'judul' },
    sortAsc:   { type: Boolean, default: true }
  },
  filters: {
    rupiah: function (n) {
      return 'Rp ' + Number(n).toLocaleString('id-ID');
    },
    satuanBuah: function (n) {
      return Number(n).toLocaleString('id-ID') + ' buah';
    }
  },
  methods: {
    sortIcon: function (field) {
      if (this.sortField !== field) return '↕';
      return this.sortAsc ? '↑' : '↓';
    },
    emitSort: function (field) {
      this.$emit('sort', field);
    },
    emitEdit: function (item) {
      this.$emit('edit', item);
    },
    emitDelete: function (item) {
      this.$emit('delete', item);
    }
  }
});
