// Variáveis globais para armazenar temporariamente o livro selecionado na busca da API
let livroTemporario = null;
let livroSelecionado = null;

// Executado ao carregar qualquer página
document.addEventListener("DOMContentLoaded", function() {
    carregarClientes();
    carregarSelectClientes(); // Popula o <select> de empréstimos
    carregarEmprestimosCards(); // Renderiza os cards salvos no LocalStorage
});


// ==========================================
// SISTEMA DE LOGIN
// ==========================================
function fazerLogin() {
    // const usuario = document.getElementById('nome').value.trim();
    const email = document.getElementById('email').value.trim();
    const senha = document.getElementById('senha').value.trim();

    if (email === "" || senha === "") {
        alert('Por favor, preencha todos os campos para entrar.');
        return; 
    }

    if (email === 'admin@gmail.com' && senha === 'admin123') {
        window.location.href = 'pages/bibliotecaria.html';
    } else if (email.includes('@') && senha.length >= 4) {

        // Salva o e-mail do leitor para a prateleira conseguir filtrar os empréstimos
        localStorage.setItem('usuarioLogado', email.toLowerCase());
        
        // alert(`Seja bem-vindo, ${usuario}!`);

        window.location.href = 'pages/prateleira.html';
    } else {
        alert('Por favor, insira um e-mail válido e uma senha com no mínimo 4 caracteres.');
    }
}


// ==========================================
// PARTE A: GESTÃO DE CLIENTES
// ==========================================
function cadastrarCliente() {
    const nome = document.getElementById('cadNome').value.trim(); // Nome do cliente
    const cpf = document.getElementById('cadCPF').value.trim(); // CPF do cliente
    const email = document.getElementById('cadEmail').value.trim(); // E-mail do cliente

    // Tratamento de erro/validação exigido
    if (nome === "" || cpf === "" || email === "") {
        alert("Erro: Por favor, preencha todos os campos do cliente (Nome, CPF e E-mail).");
        return;
    }

    let listaClientes = JSON.parse(localStorage.getItem('clientes')) || [];
    const novoCliente = { nome, cpf, email };
    listaClientes.push(novoCliente);
    localStorage.setItem('clientes', JSON.stringify(listaClientes));

    document.getElementById('cadNome').value = "";
    document.getElementById('cadCPF').value = "";
    document.getElementById('cadEmail').value = "";

    carregarClientes();
    carregarSelectClientes(); // Atualiza o select de empréstimos imediatamente
    alert("Cliente cadastrado com sucesso!");
}

// Gera a lista visual dos clientes cadastrados, ou uma mensagem caso esteja vazia
function carregarClientes() {
    const listaUI = document.getElementById('listaClientes');
    if (!listaUI) return; 

    let listaClientes = JSON.parse(localStorage.getItem('clientes')) || [];
    listaUI.innerHTML = "";

    if (listaClientes.length === 0) {
        listaUI.innerHTML = "<li style='color: #888; font-style: italic;'>Nenhum leitor cadastrado ainda.</li>";
        return;
    }

    listaClientes.forEach(function(cliente) {
        const li = document.createElement('li');
        li.style.padding = "6px 0";
        li.style.borderBottom = "1px solid #eee";
        li.innerHTML = `👤 <strong>${cliente.nome}</strong> (CPF: ${cliente.cpf})`;
        listaUI.appendChild(li);
    });
}


// ==========================================
// PARTE B: BUSCA DE LIVROS (ASYNC & API)
// ==========================================
async function buscarLivroAPI() { // Busca livro na API da Open Library
    const termo = document.getElementById('inputLivro').value.trim();
    const feedback = document.getElementById('feedbackBusca');
    const resultadoDiv = document.getElementById('resultadoLivro');

    if (termo === "") {
        alert("Digite o nome de um livro para pesquisar!");
        return;
    }

    // 1. UI Feedback: Estado de "Carregando..."
    feedback.innerText = "🔍 Buscando livro na Open Library... Aguarde.";
    feedback.style.color = "#0056b3";
    resultadoDiv.style.display = "none";
    livroTemporario = null;

    try {
        // Faz a requisição na API da Open Library usando o formato de busca por texto livre (q=termo)
        const resposta = await fetch(`https://openlibrary.org/search.json?q=${encodeURIComponent(termo)}&limit=1`);
        
        if (!resposta.ok) {
            throw new Error("Erro de conexão com o servidor da API.");
        }

        const dados = await resposta.json();

        // 2. Tratamento de erro caso a API retorne vazia (Livro não encontrado)
        if (!dados.docs || dados.docs.length === 0) {
            feedback.innerText = "❌ Nenhum livro encontrado com esse título. Tente outro.";
            feedback.style.color = "#d9534f";
            return;
        }

        const infoLivro = dados.docs[0];
        const titulo = infoLivro.title;
        // Tratamento caso o autor não venha definido no objeto da API
        const autor = infoLivro.author_name ? infoLivro.author_name[0] : "Autor Desconhecido";
        
        // Regra da documentação da Open Library: Montar a URL da imagem usando o cover_i (ID da capa)
        let URLcapa = "https://via.placeholder.com/150x200?text=Sem+Capa"; // Capa padrão (fallback)
        if (infoLivro.cover_i) {
            URLcapa = `https://covers.openlibrary.org/b/id/${infoLivro.cover_i}-M.jpg`;
        }

        // Armazena temporariamente os dados tratados no objeto do livro
        livroTemporario = { titulo, autor, capa: URLcapa };

        // 3. Atualiza a Manipulação da Tela (UI) com as informações do livro achado
        document.getElementById('livroCapa').src = URLcapa;
        document.getElementById('livroTitulo').innerText = titulo;
        document.getElementById('livroAutor').innerText = `Autor: ${autor}`;
        
        feedback.innerText = "✅ Livro encontrado!";
        feedback.style.color = "#28a745";
        resultadoDiv.style.display = "block";

    } catch (erro) {
        // Tratamento geral de falhas de rede ou código (Catch)
        console.error(erro);
        feedback.innerText = "❌ Erro ao buscar livro. Verifique sua conexão.";
        feedback.style.color = "#d9534f";
    }
}

function selecionarParaEmprestimo() {
    if (!livroTemporario) return;
    
    livroSelecionado = livroTemporario;
    document.getElementById('livroSelecionadoTexto').innerHTML = `
        <strong>Livro:</strong> ${livroSelecionado.titulo} <br>
        <span style="font-size:12px; color:#666;">Autor: ${livroSelecionado.autor}</span>
    `;
    alert(`"${livroSelecionado.titulo}" foi selecionado para o empréstimo!`);
}


// ==========================================
// PARTE C: LOGICA E PERSISTÊNCIA DE EMPRÉSTIMOS
// ==========================================

// Popula dinamicamente a tag <select> com os clientes do LocalStorage
function carregarSelectClientes() {
    const select = document.getElementById('selectClientes');
    if (!select) return;

    let listaClientes = JSON.parse(localStorage.getItem('clientes')) || [];
    select.innerHTML = '<option value="">-- Selecione um Cliente --</option>';

    listaClientes.forEach(cliente => {
        const option = document.createElement('option');
        option.value = cliente.email;
        option.innerText = `${cliente.nome} (CPF: ${cliente.cpf})`;
        select.appendChild(option);
    });
}

function finalizarEmprestimo() {
    const clienteSelecionado = document.getElementById('selectClientes').value;
    const clientes = JSON.parse(localStorage.getItem('clientes')) || [];
    const clienteObjeto = clientes.find(cliente => cliente.email === clienteSelecionado);

    // Tratamento de Erros: Verifica se os dados necessários estão prontos
    if (!clienteSelecionado) {
        alert("Erro: Você precisa selecionar um Cliente cadastrado!");
        return;
    }
    if (!clienteObjeto) {
        alert("Erro: Cliente selecionado não encontrado no cadastro!");
        return;
    }
    if (!livroSelecionado) {
        alert("Erro: Você precisa buscar e Selecionar um Livro primeiro!");
        return;
    }

    // Calcular Data de Devolução (Hoje + 7 dias)
    const dataHoje = new Date();
    dataHoje.setDate(dataHoje.getDate() + 7);
    const dataFormatada = dataHoje.toLocaleDateString('pt-BR');

    // Criação do objeto complexo conforme o enunciado
    const novoEmprestimo = {
        cliente: clienteObjeto.nome,
        clienteEmail: clienteObjeto.email,
        livroTitulo: livroSelecionado.titulo,
        livroCapa: livroSelecionado.capa,
        devolucao: dataFormatada
    };

    // Salva a lista de objetos complexos no LocalStorage
    let listaEmprestimos = JSON.parse(localStorage.getItem('emprestimos')) || [];
    listaEmprestimos.push(novoEmprestimo);
    localStorage.setItem('emprestimos', JSON.stringify(listaEmprestimos));

    // Resetar UI da área de seleção
    livroSelecionado = null;
    document.getElementById('livroSelecionadoTexto').innerText = "Nenhum livro selecionado ainda. Busque um livro acima.";
    document.getElementById('selectClientes').value = "";
    document.getElementById('resultadoLivro').style.display = "none";
    document.getElementById('feedbackBusca').innerText = "";

    // Atualiza os Cards Visuais
    carregarEmprestimosCards();
    alert("Sucesso: Empréstimo registrado com devolução para " + dataFormatada);
}

// UI: Gera a exibição visual em formato de cards elegantes
function carregarEmprestimosCards() {
    const containerCards = document.getElementById('cardsEmprestimos');
    if (!containerCards) return;

    let listaEmprestimos = JSON.parse(localStorage.getItem('emprestimos')) || [];
    containerCards.innerHTML = "";

    if (listaEmprestimos.length === 0) {
        containerCards.innerHTML = "<p style='color: #888; font-style: italic; grid-column: 1/-1;'>Nenhum empréstimo ativo no momento.</p>";
        return;
    }

    listaEmprestimos.forEach(emp => {
        const card = document.createElement('div');
        card.className = "book-card"; // Usa a classe do CSS novo

        card.innerHTML = `
            <img src="${emp.livroCapa}" alt="Capa" style="width: 70px; height: 100px; object-fit: cover; border-radius: 4px;">
            <div>
                <h4 style="margin: 0 0 5px 0;">${emp.livroTitulo}</h4>
                <p style="margin: 0 0 5px 0; font-size: 13px; color: #555;"><strong>Leitor:</strong> ${emp.cliente}</p>
                <span class="badge-date">📅 Devolução: ${emp.devolucao}</span>
            </div>
        `;
        containerCards.appendChild(card);
    });
}


// ==========================================
// ÁREA DO CLIENTE (PRATELEIRA)
// ==========================================

// Modifique o seu escutador de carregamento existente lá no topo ou use este unificado:
document.addEventListener("DOMContentLoaded", function() {
    // Se estiver na página da bibliotecária, roda as funções dela
    carregarClientes();
    carregarSelectClientes();
    carregarEmprestimosCards();
    
    // Se estiver na página da prateleira, roda as funções do cliente
    carregarPrateleiraCliente();
});

function carregarPrateleiraCliente() {
    const saudacao = document.getElementById('saudacaoLeitor');
    const containerCards = document.getElementById('meusLivrosCards');

    if (!containerCards) return;

    const usuarioLogado = (localStorage.getItem('usuarioLogado') || "").toLowerCase();
    const nomeUsuario = localStorage.getItem('usuarioLogado') || "Leitor";
    const clientes = JSON.parse(localStorage.getItem('clientes')) || [];
    const clienteLogado = clientes.find(cliente => (cliente.email || "").toLowerCase() === usuarioLogado);
    const nomeClienteLogado = (clienteLogado?.nome || "").toLowerCase();
    if (saudacao) {
        saudacao.innerText = `👋 Olá, ${nomeUsuario}! Bem-vindo à sua prateleira.`;
    }

    let listaEmprestimos = JSON.parse(localStorage.getItem('emprestimos')) || [];
    let meusLivros = listaEmprestimos.filter(emp => {
        const emailEmprestimo = (emp.clienteEmail || "").toLowerCase();
        const nomeEmprestimo = (emp.cliente || "").toLowerCase();

        if (!usuarioLogado) {
            return true;
        }

        return emailEmprestimo === usuarioLogado || nomeEmprestimo === usuarioLogado || nomeEmprestimo === nomeClienteLogado;
    });

    containerCards.innerHTML = "";

    if (meusLivros.length === 0) {
        containerCards.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; color: #777; padding: 40px; border: 2px dashed #ddd; border-radius: 8px; width: 100%;">
                <p style="font-size: 18px; margin: 0;">Você não possui nenhum livro alugado no momento.</p>
                <p style="font-size: 14px; color: #999; margin-top: 5px;">Peça para a Bibliotecária realizar um empréstimo no seu nome!</p>
            </div>
        `;
        return;
    }

    meusLivros.forEach(emp => {
        const card = document.createElement('div');
        card.className = "book-card"; // Usa a mesma classe do CSS novo

        card.innerHTML = `
            <img src="${emp.livroCapa}" alt="Capa" style="max-height: 140px; object-fit: cover; border-radius: 4px;">
            <div style="width: 100%;">
                <h4 style="margin: 10px 0 8px 0; font-size: 15px;">${emp.livroTitulo}</h4>
                <span class="badge-date">📅 Prazo: ${emp.devolucao}</span>
            </div>
        `;
        containerCards.appendChild(card);
    });
}

function logoutCliente() {
    localStorage.removeItem('usuarioLogado'); // Limpa o login
    window.location.href = '../index.html'; // Volta para a tela inicial
}