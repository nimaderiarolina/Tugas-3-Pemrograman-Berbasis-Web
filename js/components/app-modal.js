Vue.component('app-modal', {
  template: '#tpl-modal',
  data: function () {
    return {
      visible:   false,
      title:     'Konfirmasi',
      message:   '',
      onConfirm: null
    };
  },
  methods: {
    open: function (opts) {
      this.title     = opts.title   || 'Konfirmasi';
      this.message   = opts.message || 'Apakah Anda yakin?';
      this.onConfirm = opts.onConfirm || null;
      this.visible   = true;
    },
    close: function () {
      this.visible = false;
    },
    confirm: function () {
      if (typeof this.onConfirm === 'function') this.onConfirm();
      this.close();
    }
  }
});
