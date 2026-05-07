/**
 * Data Table block.
 *
 * Helix normalizes every <table> in authored content into a div-block where
 * the first cell of the first row becomes the block's class. To prevent
 * each table from becoming a different one-off block (.class, .property,
 * .tier, etc.), the converter prepends a "Data Table" row to every table
 * so Helix consistently labels them all `data-table`. This decorator
 * reads the resulting nested-div structure and renders a real <table>:
 *
 *   <div class="data-table">
 *     <div><div>Data Table</div></div>     ← title row (consumed)
 *     <div><div>Header A</div><div>Header B</div></div>  ← <thead>
 *     <div><div>cell</div><div>cell</div></div>          ← <tbody> rows
 *     …
 *   </div>
 */
export default function decorate(block) {
  const rows = [...block.children];
  if (rows.length < 2) return;

  // Drop the title row that exists only to anchor the class name.
  rows.shift();

  const headerCells = [...(rows.shift()?.children || [])];
  const bodyRows = rows;

  const table = document.createElement('table');

  if (headerCells.length) {
    const thead = document.createElement('thead');
    const tr = document.createElement('tr');
    headerCells.forEach((cell) => {
      const th = document.createElement('th');
      th.innerHTML = cell.innerHTML;
      tr.appendChild(th);
    });
    thead.appendChild(tr);
    table.appendChild(thead);
  }

  if (bodyRows.length) {
    const tbody = document.createElement('tbody');
    bodyRows.forEach((row) => {
      const tr = document.createElement('tr');
      [...row.children].forEach((cell) => {
        const td = document.createElement('td');
        td.innerHTML = cell.innerHTML;
        tr.appendChild(td);
      });
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);
  }

  block.textContent = '';
  block.appendChild(table);
}
