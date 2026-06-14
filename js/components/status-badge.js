Vue.component('status-badge', {
  template: '#tpl-badge',
  props: {
    qty:    { type: Number, required: true },
    safety: { type: Number, required: true }
  },
  computed: {
    status: function () {
      if (this.qty === 0)            return 'Kosong';
      if (this.qty < this.safety)    return 'Menipis';
      return 'Aman';
    },
    badgeClass: function () {
      if (this.qty === 0)         return 'badge-red';
      if (this.qty < this.safety) return 'badge-orange';
      return 'badge-green';
    },
    icon: function () {
      if (this.qty === 0)         return 'fa-circle-xmark';
      if (this.qty < this.safety) return 'fa-circle-exclamation';
      return 'fa-circle-check';
    }
  }
});
