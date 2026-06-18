// API keys are loaded from `config.js` (window.APP_CONFIG). If not present, falls back to empty strings.
const API_URL = 'https://parseapi.back4app.com/classes/Vendas';

const APP_ID = (window.APP_CONFIG && window.APP_CONFIG.APP_ID) || '';
const REST_KEY = (window.APP_CONFIG && window.APP_CONFIG.REST_KEY) || '';

if (!APP_ID || !REST_KEY) {
  console.warn('Aviso: chaves da API não encontradas. Crie `config.js` a partir de `config.example.js`.');
}

let chart;
let vendasCache = [];

async function carregarDados() {
  try {
    const response = await fetch(API_URL, {
      headers: {
        'X-Parse-Application-Id': APP_ID,
        'X-Parse-REST-API-Key': REST_KEY
      }
    });

    const dados = await response.json();
    const results = Array.isArray(dados.results) ? dados.results : [];
    vendasCache = results;
    console.log(results);
    atualizarGrafico(results);
    renderVendasList(results);
  } catch (error) {
    console.error('Erro ao carregar dados:', error);
  }
}

function atualizarGrafico(dados) {
  // agregar por categoria (somar valores)
  const filtroEl = document.getElementById('filtroCategoria');
  const filtro = filtroEl ? filtroEl.value : 'todos';

  let dadosFiltrados = dados;
  if (filtro !== 'todos') {
    dadosFiltrados = dados.filter(item => item.categoria === filtro);
  }

  const aggregated = {};
  dadosFiltrados.forEach(item => {
    const cat = item.categoria || 'Sem Categoria';
    const val = Number(item.valor) || 0;
    if (!aggregated[cat]) aggregated[cat] = 0;
    aggregated[cat] += val;
  });

  const categorias = Object.keys(aggregated);
  const valores = categorias.map(c => aggregated[c]);

  const canvas = document.getElementById('graficoCategorias');
  if (!canvas) return;

  const chartTypeEl = document.getElementById('chartType');
  const chartType = chartTypeEl ? chartTypeEl.value : 'bar';

  if (chart) chart.destroy();

  const dataset = {
    label: 'Valor de vendas',
    data: valores,
    borderWidth: 1
  };

  if (chartType === 'pie') {
    // gerar cores para cada categoria
    const colors = categorias.map((_, i) => {
      const hue = Math.floor((i * 137.5) % 360); // espalha cores
      return `hsl(${hue}deg 70% 50%)`;
    });
    dataset.backgroundColor = colors;
  } else {
    // cor padrão para barras
    dataset.backgroundColor = 'rgba(54, 162, 235, 0.6)';
    dataset.borderColor = 'rgba(54, 162, 235, 1)';
  }

  chart = new Chart(canvas, {
    type: chartType,
    data: {
      labels: categorias,
      datasets: [dataset]
    },
    options: {
      responsive: true
    }
  });
}

// escuta mudança do tipo de gráfico
document.addEventListener('DOMContentLoaded', () => {
  const chartTypeEl = document.getElementById('chartType');
  if (chartTypeEl) {
    chartTypeEl.addEventListener('change', () => {
      atualizarGrafico(vendasCache);
    });
  }
});

function renderVendasList(vendas) {
  const tbody = document.querySelector('#tabelaVendas tbody');
  if (!tbody) return;
  tbody.innerHTML = '';

  vendas.forEach(v => {
    const tr = document.createElement('tr');

    const tdCat = document.createElement('td'); tdCat.textContent = v.categoria || '';
    const tdQtd = document.createElement('td'); tdQtd.textContent = v.quantidade ?? '';
    const tdVal = document.createElement('td'); tdVal.textContent = v.valor ?? '';
    const tdData = document.createElement('td'); tdData.textContent = formatDate(v.data_venda) || '';
    const tdAcoes = document.createElement('td');

    const btnEdit = document.createElement('button');
    btnEdit.textContent = 'Editar';
    btnEdit.addEventListener('click', () => editarVenda(v.objectId));

    const btnDel = document.createElement('button');
    btnDel.textContent = 'Excluir';
    btnDel.addEventListener('click', () => excluirVenda(v.objectId));

    tdAcoes.appendChild(btnEdit);
    tdAcoes.appendChild(document.createTextNode(' '));
    tdAcoes.appendChild(btnDel);

    tr.appendChild(tdCat);
    tr.appendChild(tdQtd);
    tr.appendChild(tdVal);
    tr.appendChild(tdData);
    tr.appendChild(tdAcoes);

    tbody.appendChild(tr);
  });
}

function editarVenda(objectId) {
  const item = vendasCache.find(v => v.objectId === objectId);
  if (!item) return;

  const categoriaEl = document.getElementById('categoria');
  const quantidadeEl = document.getElementById('quantidade');
  const valorEl = document.getElementById('valor');
  const dataEl = document.getElementById('data_venda');
  const objectIdEl = document.getElementById('objectId');
  const submitBtn = document.querySelector('#formVenda button[type="submit"]');
  const cancelBtn = document.getElementById('cancelEdit');

  if (categoriaEl) categoriaEl.value = item.categoria || '';
  if (quantidadeEl) quantidadeEl.value = item.quantidade ?? '';
  if (valorEl) valorEl.value = item.valor ?? '';
  if (dataEl) dataEl.value = item.data_venda || '';
  if (objectIdEl) objectIdEl.value = objectId;
  if (submitBtn) submitBtn.textContent = 'Atualizar';
  if (cancelBtn) cancelBtn.hidden = false;
}

async function excluirVenda(objectId) {
  if (!confirm('Confirma exclusão desta venda?')) return;
  try {
    const url = `${API_URL}/${objectId}`;
    await fetch(url, {
      method: 'DELETE',
      headers: {
        'X-Parse-Application-Id': APP_ID,
        'X-Parse-REST-API-Key': REST_KEY
      }
    });
    carregarDados();
  } catch (error) {
    console.error('Erro ao excluir venda:', error);
  }
}

async function adicionarVenda() {
  try {
    await fetch(API_URL, {
      method: 'POST',
      headers: {
        'X-Parse-Application-Id': APP_ID,
        'X-Parse-REST-API-Key': REST_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        categoria: 'Tecnologia',
        quantidade: 15,
        valor: 950
      })
    });
    carregarDados();
  } catch (error) {
    console.error('Erro ao adicionar venda:', error);
  }
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (isNaN(date)) return dateStr;
  return date.toLocaleDateString();
}

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('formVenda');
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const objectIdEl = document.getElementById('objectId');
      const editId = objectIdEl ? objectIdEl.value : '';

      const novaVenda = {
        categoria: document.getElementById('categoria').value,
        quantidade: Number(document.getElementById('quantidade').value),
        valor: Number(document.getElementById('valor').value),
        data_venda: document.getElementById('data_venda').value
      };

      try {
        if (editId) {
          // atualizar
          const url = `${API_URL}/${editId}`;
          await fetch(url, {
            method: 'PUT',
            headers: {
              'X-Parse-Application-Id': APP_ID,
              'X-Parse-REST-API-Key': REST_KEY,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(novaVenda)
          });
        } else {
          // criar
          await fetch(API_URL, {
            method: 'POST',
            headers: {
              'X-Parse-Application-Id': APP_ID,
              'X-Parse-REST-API-Key': REST_KEY,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(novaVenda)
          });
        }
      } catch (error) {
        console.error('Erro ao enviar venda:', error);
      }

      // reset form e estado de edição
      form.reset();
      if (objectIdEl) objectIdEl.value = '';
      const submitBtn = document.querySelector('#formVenda button[type="submit"]');
      const cancelBtn = document.getElementById('cancelEdit');
      if (submitBtn) submitBtn.textContent = 'Cadastrar';
      if (cancelBtn) cancelBtn.hidden = true;

      carregarDados();
    });
  }

  const cancelBtn = document.getElementById('cancelEdit');
  if (cancelBtn) {
    cancelBtn.addEventListener('click', () => {
      const objectIdEl = document.getElementById('objectId');
      if (objectIdEl) objectIdEl.value = '';
      const submitBtn = document.querySelector('#formVenda button[type="submit"]');
      if (submitBtn) submitBtn.textContent = 'Cadastrar';
      cancelBtn.hidden = true;
      form.reset();
    });
  }

  // carregar os dados inicialmente
  carregarDados();
});