const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3000;
const DATA_PATH = path.join(__dirname, 'data.json');

app.use(cors());
app.use(express.json());

const DADOS_INICIAIS = {
  competitors: [
    { id: 1, name: "Pedro Santos", nickname: "Pterodactyl", teamId: 1 },
    { id: 2, name: "Julia Lima", nickname: "JuliaX", teamId: 1 },
    { id: 3, name: "Carlos Eduardo", nickname: "Cadu00", teamId: 2 },
    { id: 4, name: "Ana Oliveira", nickname: "AnaPvP", teamId: 2 }
  ],
  teams: [
    { id: 1, name: "Cyber Dragons", color: "#7B1FA2" },
    { id: 2, name: "Neon Knights", color: "#00BCD4" }
  ],
  games: [
    { id: 1, name: "League of Legends", genre: "MOBA" },
    { id: 2, name: "VALORANT", genre: "FPS" },
    { id: 3, name: "Counter-Strike 2", genre: "FPS" },
    { id: 4, name: "Rocket League", genre: "Esport" }
  ],
  matches: [
    {
      id: 1,
      gameId: 1,
      team1Id: 1,
      team2Id: 2,
      score1: 1,
      score2: 0,
      status: "finished",
      date: "2026-03-24T14:00"
    },
    {
      id: 2,
      gameId: 2,
      team1Id: 2,
      team2Id: 1,
      score1: 0,
      score2: 0,
      status: "scheduled",
      date: "2026-03-25T16:00"
    }
  ]
};

function lerDados() {
    try {
        if (!fs.existsSync(DATA_PATH)) {
            fs.writeFileSync(DATA_PATH, JSON.stringify(DADOS_INICIAIS, null, 2), 'utf-8');
            return DADOS_INICIAIS;
        }
        const conteudo = fs.readFileSync(DATA_PATH, 'utf-8').trim();
        if (!conteudo) {
            fs.writeFileSync(DATA_PATH, JSON.stringify(DADOS_INICIAIS, null, 2), 'utf-8');
            return DADOS_INICIAIS;
        }
        return JSON.parse(conteudo);
    } catch (erro) {
        console.error('Erro ao ler data.json, recriando arquivo...', erro.message);
        fs.writeFileSync(DATA_PATH, JSON.stringify(DADOS_INICIAIS, null, 2), 'utf-8');
        return DADOS_INICIAIS;
    }
}

function salvarDados(dados) {
    fs.writeFileSync(DATA_PATH, JSON.stringify(dados, null, 2), 'utf-8');
}

const MAPA = {
    jogos: 'games',
    times: 'teams',
    competidores: 'competitors',
    confrontos: 'matches',
};

app.get('/', (req, res) => {
    res.status(200).json({
        mensagem: 'Bem vindo à API GamerClass',
        status: 'sucesso',
        rotas: ['/api/jogos', '/api/times', '/api/competidores', '/api/confrontos'],
    });
});

// GETS
app.get('/api/jogos', (req, res) => {
    const { games } = lerDados();
    res.status(200).json(games);
});
app.get('/api/jogos/:id', (req, res) => {
    const { games } = lerDados();
    const jogo = games.find(j => j.id === Number(req.params.id));
    if (!jogo) return res.status(404).json({ erro: 'Jogo não encontrado' });
    res.status(200).json(jogo);
});
app.get('/api/times', (req, res) => {
    const { teams } = lerDados();
    res.status(200).json(teams);
});
app.get('/api/times/:id', (req, res) => {
    const { teams } = lerDados();
    const time = teams.find(t => t.id === Number(req.params.id));
    if (!time) return res.status(404).json({ erro: 'Time não encontrado' });
    res.status(200).json(time);
});
app.get('/api/competidores', (req, res) => {
    const { competitors } = lerDados();
    res.status(200).json(competitors);
});
app.get('/api/competidores/:id', (req, res) => {
    const { competitors } = lerDados();
    const competidor = competitors.find(c => c.id === Number(req.params.id));
    if (!competidor) return res.status(404).json({ erro: 'Competidor não encontrado' });
    res.status(200).json(competidor);
});
app.get('/api/confrontos', (req, res) => {
    const { matches } = lerDados();
    res.status(200).json(matches);
});
app.get('/api/confrontos/:id', (req, res) => {
    const { matches } = lerDados();
    const confronto = matches.find(m => m.id === Number(req.params.id));
    if (!confronto) return res.status(404).json({ erro: 'Confronto não encontrado' });
    res.status(200).json(confronto);
});

// POST
app.post('/api/:colecao', (req, res) => {
    const chaveFrontend = req.params.colecao;
    const chaveJson = MAPA[chaveFrontend];
    if (!chaveJson) return res.status(400).json({ erro: 'Coleção inválida' });

    const dados = lerDados();
    const lista = dados[chaveJson];
    const maxId = lista.reduce((max, item) => (item.id > max ? item.id : max), 0);
    const novoItem = { ...req.body, id: maxId + 1 };
    lista.push(novoItem);
    salvarDados(dados);
    res.status(201).json(novoItem);
});

// PUT
app.put('/api/:colecao/:id', (req, res) => {
    const chaveFrontend = req.params.colecao;
    const chaveJson = MAPA[chaveFrontend];
    const id = Number(req.params.id);
    if (!chaveJson) return res.status(400).json({ erro: 'Coleção inválida' });

    const dados = lerDados();
    const lista = dados[chaveJson];
    const index = lista.findIndex(item => item.id === id);
    if (index === -1) return res.status(404).json({ erro: 'Item não encontrado' });

    lista[index] = { ...lista[index], ...req.body, id };
    salvarDados(dados);
    res.status(200).json(lista[index]);
});

// DELETE
app.delete('/api/:colecao/:id', (req, res) => {
    const chaveFrontend = req.params.colecao;
    const chaveJson = MAPA[chaveFrontend];
    const id = Number(req.params.id);
    if (!chaveJson) return res.status(400).json({ erro: 'Coleção inválida' });

    const dados = lerDados();
    const lista = dados[chaveJson];
    const index = lista.findIndex(item => item.id === id);
    if (index === -1) return res.status(404).json({ erro: 'Item não encontrado' });

    const removido = lista.splice(index, 1)[0];
    salvarDados(dados);
    res.status(200).json({ mensagem: 'Removido com sucesso', item: removido });
});

app.use((req, res) => {
    res.status(404).json({ erro: 'Rota não encontrada', mensagem: 'Verifique a URL e o método HTTP' });
});

app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
    console.log(`Acesse: http://localhost:${PORT}`);
});
