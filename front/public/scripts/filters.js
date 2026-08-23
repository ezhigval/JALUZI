export function initProductFilters() {
  const filterBtns = document.querySelectorAll('#category-filters button');

  if (!filterBtns.length) {
    return;
  }

  filterBtns.forEach(btn => {
    if (btn.dataset.filtersBound === 'true') {
      return;
    }

    btn.dataset.filtersBound = 'true';
    btn.addEventListener('click', function() {
      const cat = this.getAttribute('data-category');
      filterBtns.forEach(b => { b.style.background = 'white'; b.style.color = '#0F172A'; });
      this.style.background = '#2563EB'; this.style.color = 'white';
      document.querySelectorAll('.product-item').forEach(item => {
        const ic = item.getAttribute('data-category');
        item.style.display = (cat === 'Все' || ic === cat) ? 'block' : 'none';
      });
    });
  });
}
