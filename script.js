const formularioDoacao = document.getElementById("form-doacao");
const formularioEntrega = document.getElementById("form-entrega");
const botaoLimpar = document.getElementById("botao-limpar");

const listaDoacoes = document.getElementById("lista-doacoes");
const listaEstoque = document.getElementById("lista-estoque");
const listaEntregas = document.getElementById("lista-entregas");
const listaHistorico = document.getElementById("lista-historico");

const totalDoacoes = document.getElementById("total-doacoes");
const totalEstoque = document.getElementById("total-estoque");
const totalEntregas = document.getElementById("total-entregas");
const totalFamilias = document.getElementById("total-familias");

const itemEntrega = document.getElementById("item-entrega");
const mensagemSistema = document.getElementById("mensagem-sistema");

let doacoes = JSON.parse(localStorage.getItem("doacoes")) || [];
let entregas = JSON.parse(localStorage.getItem("entregas")) || [];
let tempoMensagem = null;

function mostrarMensagem(texto, tipo) {
    mensagemSistema.textContent = texto;
    mensagemSistema.className = `mensagem-sistema ${tipo} visivel`;

    clearTimeout(tempoMensagem);

    tempoMensagem = setTimeout(function () {
        mensagemSistema.className = "mensagem-sistema";
    }, 3000);
}

function salvarDoacoes() {
    localStorage.setItem("doacoes", JSON.stringify(doacoes));
}

function salvarEntregas() {
    localStorage.setItem("entregas", JSON.stringify(entregas));
}

function formatarData(data) {
    if (!data) {
        return "";
    }

    const partes = data.split("-");
    return `${partes[2]}/${partes[1]}/${partes[0]}`;
}

function obterUnidade(registro) {
    const unidade = registro.unidade || "Un.";

    const unidadesAntigas = {
        "unidade": "Un.",
        "un.": "Un.",
        "Un.": "Un.",
        "kg": "Kg",
        "Kg": "Kg",
        "peça": "Peça(s)",
        "peça(s)": "Peça(s)",
        "Peça(s)": "Peça(s)",
        "litro": "Litro(s)",
        "litro(s)": "Litro(s)",
        "Litro(s)": "Litro(s)",
        "pacote": "Pacote(s)",
        "pacote(s)": "Pacote(s)",
        "Pacote(s)": "Pacote(s)",
        "cesta": "Cesta(s)",
        "cesta(s)": "Cesta(s)",
        "Cesta(s)": "Cesta(s)",
        "caixa": "Caixa(s)",
        "caixa(s)": "Caixa(s)",
        "Caixa(s)": "Caixa(s)",
        "outro": "Outro",
        "Outro": "Outro"
    };

    return unidadesAntigas[unidade] || unidade;
}

function criarChave(tipo, item, unidade) {
    return `${tipo.toLowerCase()}-${item.toLowerCase()}-${unidade.toLowerCase()}`;
}

function gerarEstoque() {
    const estoque = [];

    doacoes.forEach(function (doacao) {
        const unidadeDoacao = obterUnidade(doacao);
        const chaveDoacao = criarChave(doacao.tipo, doacao.item, unidadeDoacao);

        const itemExistente = estoque.find(function (itemEstoque) {
            const chaveEstoque = criarChave(itemEstoque.tipo, itemEstoque.item, itemEstoque.unidade);
            return chaveEstoque === chaveDoacao;
        });

        if (itemExistente) {
            itemExistente.quantidade += doacao.quantidade;
        } else {
            estoque.push({
                tipo: doacao.tipo,
                item: doacao.item,
                quantidade: doacao.quantidade,
                unidade: unidadeDoacao
            });
        }
    });

    entregas.forEach(function (entrega) {
        const unidadeEntrega = obterUnidade(entrega);
        const chaveEntrega = criarChave(entrega.tipo, entrega.item, unidadeEntrega);

        const itemExistente = estoque.find(function (itemEstoque) {
            const chaveEstoque = criarChave(itemEstoque.tipo, itemEstoque.item, itemEstoque.unidade);
            return chaveEstoque === chaveEntrega;
        });

        if (itemExistente) {
            itemExistente.quantidade -= entrega.quantidade;
        }
    });

    return estoque.filter(function (itemEstoque) {
        return itemEstoque.quantidade > 0;
    });
}

function atualizarResumo() {
    const estoque = gerarEstoque();

    let quantidadeTotalEstoque = 0;

    estoque.forEach(function (itemEstoque) {
        quantidadeTotalEstoque += itemEstoque.quantidade;
    });

    const familiasAtendidas = new Set();

    entregas.forEach(function (entrega) {
        familiasAtendidas.add(entrega.familia.toLowerCase());
    });

    totalDoacoes.textContent = doacoes.length;
    totalEstoque.textContent = quantidadeTotalEstoque;
    totalEntregas.textContent = entregas.length;
    totalFamilias.textContent = familiasAtendidas.size;
}

function listarDoacoes() {
    listaDoacoes.innerHTML = "";

    if (doacoes.length === 0) {
        listaDoacoes.innerHTML = `
            <tr>
                <td colspan="6" class="mensagem-vazia">
                    Nenhuma doação cadastrada até o momento.
                </td>
            </tr>
        `;

        return;
    }

    doacoes.forEach(function (doacao) {
        const linha = document.createElement("tr");

        linha.innerHTML = `
            <td>${formatarData(doacao.data)}</td>
            <td>${doacao.tipo}</td>
            <td>${doacao.item}</td>
            <td>${doacao.quantidade}</td>
            <td>${obterUnidade(doacao)}</td>
            <td>${doacao.origem || "Não informado"}</td>
        `;

        listaDoacoes.appendChild(linha);
    });
}

function listarEstoque() {
    const estoque = gerarEstoque();

    listaEstoque.innerHTML = "";
    itemEntrega.innerHTML = `<option value="">Selecione um item do estoque</option>`;

    if (estoque.length === 0) {
        listaEstoque.innerHTML = `
            <tr>
                <td colspan="4" class="mensagem-vazia">
                    Nenhum item disponível em estoque.
                </td>
            </tr>
        `;

        return;
    }

    estoque.forEach(function (itemEstoque) {
        const linha = document.createElement("tr");

        linha.innerHTML = `
            <td>${itemEstoque.tipo}</td>
            <td>${itemEstoque.item}</td>
            <td>${itemEstoque.quantidade}</td>
            <td>${itemEstoque.unidade}</td>
        `;

        listaEstoque.appendChild(linha);

        const opcao = document.createElement("option");
        opcao.value = criarChave(itemEstoque.tipo, itemEstoque.item, itemEstoque.unidade);
        opcao.textContent = `${itemEstoque.item} (${itemEstoque.tipo}) - disponível: ${itemEstoque.quantidade} ${itemEstoque.unidade}`;

        itemEntrega.appendChild(opcao);
    });
}

function listarEntregas() {
    listaEntregas.innerHTML = "";

    if (entregas.length === 0) {
        listaEntregas.innerHTML = `
            <tr>
                <td colspan="6" class="mensagem-vazia">
                    Nenhuma entrega cadastrada até o momento.
                </td>
            </tr>
        `;

        return;
    }

    entregas.forEach(function (entrega) {
        const linha = document.createElement("tr");

        linha.innerHTML = `
            <td>${formatarData(entrega.data)}</td>
            <td>${entrega.familia}</td>
            <td>${entrega.tipo}</td>
            <td>${entrega.item}</td>
            <td>${entrega.quantidade}</td>
            <td>${obterUnidade(entrega)}</td>
        `;

        listaEntregas.appendChild(linha);
    });
}

function gerarHistorico() {
    const historico = [];

    doacoes.forEach(function (doacao) {
        historico.push({
            data: doacao.data,
            movimentacao: "Entrada",
            tipo: doacao.tipo,
            item: doacao.item,
            quantidade: doacao.quantidade,
            unidade: obterUnidade(doacao),
            origemDestino: doacao.origem || "Não informado"
        });
    });

    entregas.forEach(function (entrega) {
        historico.push({
            data: entrega.data,
            movimentacao: "Saída",
            tipo: entrega.tipo,
            item: entrega.item,
            quantidade: entrega.quantidade,
            unidade: obterUnidade(entrega),
            origemDestino: entrega.familia
        });
    });

    historico.sort(function (a, b) {
        return new Date(a.data) - new Date(b.data);
    });

    return historico;
}

function listarHistorico() {
    const historico = gerarHistorico();

    listaHistorico.innerHTML = "";

    if (historico.length === 0) {
        listaHistorico.innerHTML = `
            <tr>
                <td colspan="7" class="mensagem-vazia">
                    Nenhuma movimentação registrada até o momento.
                </td>
            </tr>
        `;

        return;
    }

    historico.forEach(function (movimentacao) {
        const linha = document.createElement("tr");

        const classeMovimentacao = movimentacao.movimentacao === "Entrada" ? "entrada" : "saida";

        linha.innerHTML = `
            <td>${formatarData(movimentacao.data)}</td>
            <td class="${classeMovimentacao}">${movimentacao.movimentacao}</td>
            <td>${movimentacao.tipo}</td>
            <td>${movimentacao.item}</td>
            <td>${movimentacao.quantidade}</td>
            <td>${movimentacao.unidade}</td>
            <td>${movimentacao.origemDestino}</td>
        `;

        listaHistorico.appendChild(linha);
    });
}

function atualizarSistema() {
    listarDoacoes();
    listarEstoque();
    listarEntregas();
    listarHistorico();
    atualizarResumo();
}

formularioDoacao.addEventListener("submit", function (evento) {
    evento.preventDefault();

    const data = document.getElementById("data").value;
    const tipo = document.getElementById("tipo").value;
    const item = document.getElementById("item").value.trim();
    const quantidade = Number(document.getElementById("quantidade").value);
    const unidade = document.getElementById("unidade").value;
    const origem = document.getElementById("origem").value.trim();
    const observacao = document.getElementById("observacao").value.trim();

    if (quantidade <= 0) {
        mostrarMensagem("Informe uma quantidade válida para a doação.", "erro");
        return;
    }

    const novaDoacao = {
        data: data,
        tipo: tipo,
        item: item,
        quantidade: quantidade,
        unidade: unidade,
        origem: origem,
        observacao: observacao
    };

    doacoes.push(novaDoacao);
    salvarDoacoes();

    atualizarSistema();

    formularioDoacao.reset();

    mostrarMensagem("Doação cadastrada com sucesso.", "sucesso");
});

formularioEntrega.addEventListener("submit", function (evento) {
    evento.preventDefault();

    const data = document.getElementById("data-entrega").value;
    const chaveItemSelecionado = document.getElementById("item-entrega").value;
    const quantidade = Number(document.getElementById("quantidade-entrega").value);
    const familia = document.getElementById("familia").value.trim();
    const observacao = document.getElementById("observacao-entrega").value.trim();

    if (quantidade <= 0) {
        mostrarMensagem("Informe uma quantidade válida para a entrega.", "erro");
        return;
    }

    const estoque = gerarEstoque();

    const itemSelecionado = estoque.find(function (itemEstoque) {
        const chaveEstoque = criarChave(itemEstoque.tipo, itemEstoque.item, itemEstoque.unidade);
        return chaveEstoque === chaveItemSelecionado;
    });

    if (!itemSelecionado) {
        mostrarMensagem("Selecione um item disponível em estoque.", "erro");
        return;
    }

    if (quantidade > itemSelecionado.quantidade) {
        mostrarMensagem("A quantidade informada é maior do que a disponível em estoque.", "erro");
        return;
    }

    const novaEntrega = {
        data: data,
        tipo: itemSelecionado.tipo,
        item: itemSelecionado.item,
        quantidade: quantidade,
        unidade: itemSelecionado.unidade,
        familia: familia,
        observacao: observacao
    };

    entregas.push(novaEntrega);
    salvarEntregas();

    atualizarSistema();

    formularioEntrega.reset();

    mostrarMensagem("Entrega registrada com sucesso.", "sucesso");
});

botaoLimpar.addEventListener("click", function () {
    const confirmar = confirm("Tem certeza que deseja apagar todos os dados cadastrados neste navegador?");

    if (!confirmar) {
        return;
    }

    doacoes = [];
    entregas = [];

    localStorage.removeItem("doacoes");
    localStorage.removeItem("entregas");

    atualizarSistema();

    mostrarMensagem("Dados de teste removidos com sucesso.", "sucesso");
});

atualizarSistema();

console.log("Sistema de Gestão de Doações iniciado com sucesso.");