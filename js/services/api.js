var ApiService = (function () {
  var _cache = null;

  function fetchData() {
    if (_cache) return Promise.resolve(_cache);
    return fetch('./data/dataBahanAjar.json')
      .then(function (res) {
        if (!res.ok) throw new Error('Gagal memuat data: ' + res.status);
        return res.json();
      })
      .then(function (data) {
        _cache = data;
        return data;
      });
  }

  return { fetchData: fetchData };
})();
