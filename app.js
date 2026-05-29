const express = require("express");
const app = express();
const PORT = 3000;

app.use(express.json());

// ─── DATABASE (arrays como banco de dados) ─────────────────────────────────

let jogadores = [
  { id: 1, nome: "Lucas Oliveira", turma: "9A", email: "lucas@escola.com", timeId: 1, createdAt: "2025-01-10" },
  { id: 2, nome: "Ana Souza",      turma: "9B", email: "ana@escola.com",   timeId: 2, createdAt: "2025-01-10" },
  { id: 3, nome: "Pedro Martins",  turma: "9A", email: "pedro@escola.com", timeId: 1, createdAt: "2025-01-11" },
  { id: 4, nome: "Julia Lima",     turma: "9C", email: "julia@escola.com", timeId: 3, createdAt: "2025-01-11" },
  { id: 5, nome: "Rafael Costa",   turma: "9B", email: "rafael@escola.com",timeId: 2, createdAt: "2025-01-12" },
];

let times = [
  { id: 1, nome: "Trovões 9A", turma: "9A", cor: "#FF4500", createdAt: "2025-01-09" },
  { id: 2, nome: "Relâmpagos 9B", turma: "9B", cor: "#1E90FF", createdAt: "2025-01-09" },
  { id: 3, nome: "Furacões 9C", turma: "9C", cor: "#32CD32", createdAt: "2025-01-09" },
];

let modalidades = [
  { id: 1, nome: "Futsal", descricao: "Futebol de salão 5x5", pontuacao: 3, createdAt: "2025-01-08" },
  { id: 2, nome: "Vôlei", descricao: "Vôlei 6x6", pontuacao: 3, createdAt: "2025-01-08" },
  { id: 3, nome: "Basquete", descricao: "Basquete 5x5", pontuacao: 3, createdAt: "2025-01-08" },
  { id: 4, nome: "Tênis de Mesa", descricao: "Ping-pong individual", pontuacao: 1, createdAt: "2025-01-08" },
];

let confrontos = [
  { id: 1, timeCasaId: 1, timeVisitanteId: 2, modalidadeId: 1, placarCasa: 3, placarVisitante: 1, data: "2025-02-01", status: "finalizado" },
  { id: 2, timeCasaId: 2, timeVisitanteId: 3, modalidadeId: 2, placarCasa: null, placarVisitante: null, data: "2025-02-15", status: "agendado" },
  { id: 3, timeCasaId: 1, timeVisitanteId: 3, modalidadeId: 3, placarCasa: 22, placarVisitante: 18, data: "2025-02-08", status: "finalizado" },
];

// IDs auto-incrementados
let nextIds = { jogadores: 6, times: 4, modalidades: 5, confrontos: 4 };

// ─── HELPERS ───────────────────────────────────────────────────────────────

const notFound = (res, recurso) =>
  res.status(404).json({ erro: `${recurso} não encontrado(a).` });

const badRequest = (res, msg) =>
  res.status(400).json({ erro: msg });

// ─── ROTA RAIZ ─────────────────────────────────────────────────────────────

app.get("/", (req, res) => {
  const placar = {};
  times.forEach((t) => { placar[t.id] = { time: t.nome, pontos: 0, vitorias: 0, derrotas: 0 }; });

  confrontos
    .filter((c) => c.status === "finalizado")
    .forEach((c) => {
      if (!placar[c.timeCasaId] || !placar[c.timeVisitanteId]) return;
      if (c.placarCasa > c.placarVisitante) {
        const mod = modalidades.find((m) => m.id === c.modalidadeId);
        placar[c.timeCasaId].pontos += mod ? mod.pontuacao : 3;
        placar[c.timeCasaId].vitorias++;
        placar[c.timeVisitanteId].derrotas++;
      } else if (c.placarVisitante > c.placarCasa) {
        const mod = modalidades.find((m) => m.id === c.modalidadeId);
        placar[c.timeVisitanteId].pontos += mod ? mod.pontuacao : 3;
        placar[c.timeVisitanteId].vitorias++;
        placar[c.timeCasaId].derrotas++;
      }
    });

  const ranking = Object.values(placar).sort((a, b) => b.pontos - a.pontos);

  res.json({
    sistema: "E-class — Gerenciador de Interclasses",
    versao: "1.0.0",
    bemVindo: "Bem-vindo à API do sistema de interclasses!",
    estatisticas: {
      totalJogadores: jogadores.length,
      totalTimes: times.length,
      totalModalidades: modalidades.length,
      totalConfrontos: confrontos.length,
      confrontosFinalizados: confrontos.filter((c) => c.status === "finalizado").length,
      confrontosAgendados: confrontos.filter((c) => c.status === "agendado").length,
    },
    ranking,
    rotas: {
      jogadores: "/jogadores",
      times: "/times",
      modalidades: "/modalidades",
      confrontos: "/confrontos",
    },
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// JOGADORES — CRUD completo
// ══════════════════════════════════════════════════════════════════════════════

// GET /jogadores?nome=&turma=&timeId=
app.get("/jogadores", (req, res) => {
  const { nome, turma, timeId } = req.query;
  let resultado = [...jogadores];

  if (nome)   resultado = resultado.filter((j) => j.nome.toLowerCase().includes(nome.toLowerCase()));
  if (turma)  resultado = resultado.filter((j) => j.turma.toLowerCase() === turma.toLowerCase());
  if (timeId) resultado = resultado.filter((j) => j.timeId === Number(timeId));

  res.json({ total: resultado.length, jogadores: resultado });
});

// GET /jogadores/:id
app.get("/jogadores/:id", (req, res) => {
  const jogador = jogadores.find((j) => j.id === Number(req.params.id));
  if (!jogador) return notFound(res, "Jogador");
  const time = times.find((t) => t.id === jogador.timeId);
  res.json({ ...jogador, time: time || null });
});

// POST /jogadores
app.post("/jogadores", (req, res) => {
  const { nome, turma, email, timeId } = req.body;
  if (!nome || !turma || !email) return badRequest(res, "Campos obrigatórios: nome, turma, email.");
  if (jogadores.find((j) => j.email === email)) return badRequest(res, "E-mail já cadastrado.");
  if (timeId && !times.find((t) => t.id === timeId)) return badRequest(res, "Time não encontrado.");

  const novo = { id: nextIds.jogadores++, nome, turma, email, timeId: timeId || null, createdAt: new Date().toISOString().split("T")[0] };
  jogadores.push(novo);
  res.status(201).json({ mensagem: "Jogador criado com sucesso!", jogador: novo });
});

// PUT /jogadores/:id
app.put("/jogadores/:id", (req, res) => {
  const idx = jogadores.findIndex((j) => j.id === Number(req.params.id));
  if (idx === -1) return notFound(res, "Jogador");
  const { nome, turma, email, timeId } = req.body;
  if (email && email !== jogadores[idx].email && jogadores.find((j) => j.email === email))
    return badRequest(res, "E-mail já está em uso por outro jogador.");
  if (timeId && !times.find((t) => t.id === timeId)) return badRequest(res, "Time não encontrado.");

  jogadores[idx] = { ...jogadores[idx], ...(nome && { nome }), ...(turma && { turma }), ...(email && { email }), ...(timeId !== undefined && { timeId }) };
  res.json({ mensagem: "Jogador atualizado!", jogador: jogadores[idx] });
});

// DELETE /jogadores/:id
app.delete("/jogadores/:id", (req, res) => {
  const idx = jogadores.findIndex((j) => j.id === Number(req.params.id));
  if (idx === -1) return notFound(res, "Jogador");
  const [removido] = jogadores.splice(idx, 1);
  res.json({ mensagem: "Jogador removido com sucesso!", jogador: removido });
});

// ══════════════════════════════════════════════════════════════════════════════
// TIMES — CRUD completo
// ══════════════════════════════════════════════════════════════════════════════

// GET /times?nome=&turma=
app.get("/times", (req, res) => {
  const { nome, turma } = req.query;
  let resultado = times.map((t) => ({
    ...t,
    jogadores: jogadores.filter((j) => j.timeId === t.id).length,
  }));

  if (nome)  resultado = resultado.filter((t) => t.nome.toLowerCase().includes(nome.toLowerCase()));
  if (turma) resultado = resultado.filter((t) => t.turma.toLowerCase() === turma.toLowerCase());

  res.json({ total: resultado.length, times: resultado });
});

// GET /times/:id
app.get("/times/:id", (req, res) => {
  const time = times.find((t) => t.id === Number(req.params.id));
  if (!time) return notFound(res, "Time");
  const membros = jogadores.filter((j) => j.timeId === time.id);
  const historico = confrontos.filter((c) => c.timeCasaId === time.id || c.timeVisitanteId === time.id);
  res.json({ ...time, membros, historico });
});

// POST /times
app.post("/times", (req, res) => {
  const { nome, turma, cor } = req.body;
  if (!nome || !turma) return badRequest(res, "Campos obrigatórios: nome, turma.");
  if (times.find((t) => t.turma === turma)) return badRequest(res, "Já existe um time para esta turma.");

  const novo = { id: nextIds.times++, nome, turma, cor: cor || "#888888", createdAt: new Date().toISOString().split("T")[0] };
  times.push(novo);
  res.status(201).json({ mensagem: "Time criado com sucesso!", time: novo });
});

// PUT /times/:id
app.put("/times/:id", (req, res) => {
  const idx = times.findIndex((t) => t.id === Number(req.params.id));
  if (idx === -1) return notFound(res, "Time");
  const { nome, cor } = req.body;
  times[idx] = { ...times[idx], ...(nome && { nome }), ...(cor && { cor }) };
  res.json({ mensagem: "Time atualizado!", time: times[idx] });
});

// DELETE /times/:id
app.delete("/times/:id", (req, res) => {
  const idx = times.findIndex((t) => t.id === Number(req.params.id));
  if (idx === -1) return notFound(res, "Time");
  if (jogadores.some((j) => j.timeId === times[idx].id))
    return badRequest(res, "Não é possível remover um time com jogadores cadastrados.");
  const [removido] = times.splice(idx, 1);
  res.json({ mensagem: "Time removido!", time: removido });
});

// ══════════════════════════════════════════════════════════════════════════════
// MODALIDADES — CRUD completo
// ══════════════════════════════════════════════════════════════════════════════

// GET /modalidades?nome=
app.get("/modalidades", (req, res) => {
  const { nome } = req.query;
  let resultado = [...modalidades];
  if (nome) resultado = resultado.filter((m) => m.nome.toLowerCase().includes(nome.toLowerCase()));
  res.json({ total: resultado.length, modalidades: resultado });
});

// GET /modalidades/:id
app.get("/modalidades/:id", (req, res) => {
  const modalidade = modalidades.find((m) => m.id === Number(req.params.id));
  if (!modalidade) return notFound(res, "Modalidade");
  const partidas = confrontos.filter((c) => c.modalidadeId === modalidade.id);
  res.json({ ...modalidade, totalPartidas: partidas.length, partidas });
});

// POST /modalidades
app.post("/modalidades", (req, res) => {
  const { nome, descricao, pontuacao } = req.body;
  if (!nome) return badRequest(res, "Campo obrigatório: nome.");
  if (modalidades.find((m) => m.nome.toLowerCase() === nome.toLowerCase()))
    return badRequest(res, "Modalidade já cadastrada.");

  const nova = { id: nextIds.modalidades++, nome, descricao: descricao || "", pontuacao: pontuacao || 3, createdAt: new Date().toISOString().split("T")[0] };
  modalidades.push(nova);
  res.status(201).json({ mensagem: "Modalidade criada!", modalidade: nova });
});

// PUT /modalidades/:id
app.put("/modalidades/:id", (req, res) => {
  const idx = modalidades.findIndex((m) => m.id === Number(req.params.id));
  if (idx === -1) return notFound(res, "Modalidade");
  const { nome, descricao, pontuacao } = req.body;
  modalidades[idx] = { ...modalidades[idx], ...(nome && { nome }), ...(descricao !== undefined && { descricao }), ...(pontuacao && { pontuacao }) };
  res.json({ mensagem: "Modalidade atualizada!", modalidade: modalidades[idx] });
});

// DELETE /modalidades/:id
app.delete("/modalidades/:id", (req, res) => {
  const idx = modalidades.findIndex((m) => m.id === Number(req.params.id));
  if (idx === -1) return notFound(res, "Modalidade");
  if (confrontos.some((c) => c.modalidadeId === modalidades[idx].id))
    return badRequest(res, "Não é possível remover modalidade com confrontos cadastrados.");
  const [removida] = modalidades.splice(idx, 1);
  res.json({ mensagem: "Modalidade removida!", modalidade: removida });
});

// ══════════════════════════════════════════════════════════════════════════════
// CONFRONTOS — CRUD completo
// ══════════════════════════════════════════════════════════════════════════════

// GET /confrontos?status=&modalidadeId=&timeId=
app.get("/confrontos", (req, res) => {
  const { status, modalidadeId, timeId } = req.query;
  let resultado = confrontos.map((c) => ({
    ...c,
    timeCasa:      times.find((t) => t.id === c.timeCasaId)?.nome || "—",
    timeVisitante: times.find((t) => t.id === c.timeVisitanteId)?.nome || "—",
    modalidade:    modalidades.find((m) => m.id === c.modalidadeId)?.nome || "—",
  }));

  if (status)       resultado = resultado.filter((c) => c.status === status);
  if (modalidadeId) resultado = resultado.filter((c) => c.modalidadeId === Number(modalidadeId));
  if (timeId)       resultado = resultado.filter((c) => c.timeCasaId === Number(timeId) || c.timeVisitanteId === Number(timeId));

  res.json({ total: resultado.length, confrontos: resultado });
});

// GET /confrontos/:id
app.get("/confrontos/:id", (req, res) => {
  const confronto = confrontos.find((c) => c.id === Number(req.params.id));
  if (!confronto) return notFound(res, "Confronto");
  res.json({
    ...confronto,
    timeCasa:      times.find((t) => t.id === confronto.timeCasaId) || null,
    timeVisitante: times.find((t) => t.id === confronto.timeVisitanteId) || null,
    modalidade:    modalidades.find((m) => m.id === confronto.modalidadeId) || null,
  });
});

// POST /confrontos
app.post("/confrontos", (req, res) => {
  const { timeCasaId, timeVisitanteId, modalidadeId, data, placarCasa, placarVisitante } = req.body;
  if (!timeCasaId || !timeVisitanteId || !modalidadeId || !data)
    return badRequest(res, "Campos obrigatórios: timeCasaId, timeVisitanteId, modalidadeId, data.");
  if (timeCasaId === timeVisitanteId) return badRequest(res, "Os times devem ser diferentes.");
  if (!times.find((t) => t.id === timeCasaId))      return badRequest(res, "Time da casa não encontrado.");
  if (!times.find((t) => t.id === timeVisitanteId)) return badRequest(res, "Time visitante não encontrado.");
  if (!modalidades.find((m) => m.id === modalidadeId)) return badRequest(res, "Modalidade não encontrada.");

  const temPlacar = placarCasa !== undefined && placarVisitante !== undefined;
  const novo = {
    id: nextIds.confrontos++,
    timeCasaId, timeVisitanteId, modalidadeId, data,
    placarCasa:      temPlacar ? placarCasa : null,
    placarVisitante: temPlacar ? placarVisitante : null,
    status: temPlacar ? "finalizado" : "agendado",
  };
  confrontos.push(novo);
  res.status(201).json({ mensagem: "Confronto criado!", confronto: novo });
});

// PUT /confrontos/:id (atualizar placar / status)
app.put("/confrontos/:id", (req, res) => {
  const idx = confrontos.findIndex((c) => c.id === Number(req.params.id));
  if (idx === -1) return notFound(res, "Confronto");
  const { placarCasa, placarVisitante, status, data } = req.body;

  let updates = {};
  if (data) updates.data = data;
  if (status) updates.status = status;
  if (placarCasa !== undefined && placarVisitante !== undefined) {
    updates.placarCasa = placarCasa;
    updates.placarVisitante = placarVisitante;
    updates.status = "finalizado";
  }
  confrontos[idx] = { ...confrontos[idx], ...updates };
  res.json({ mensagem: "Confronto atualizado!", confronto: confrontos[idx] });
});

// DELETE /confrontos/:id
app.delete("/confrontos/:id", (req, res) => {
  const idx = confrontos.findIndex((c) => c.id === Number(req.params.id));
  if (idx === -1) return notFound(res, "Confronto");
  const [removido] = confrontos.splice(idx, 1);
  res.json({ mensagem: "Confronto removido!", confronto: removido });
});

// ─── 404 global ────────────────────────────────────────────────────────────
app.use((req, res) => res.status(404).json({ erro: "Rota não encontrada." }));

// ─── START ─────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🏆  E-class API rodando em http://localhost:${PORT}`);
  console.log(`📋  Documentação rápida:`);
  console.log(`    GET  /                 → Boas-vindas + estatísticas`);
  console.log(`    GET  /jogadores        → Lista jogadores (?nome= &turma= &timeId=)`);
  console.log(`    GET  /times            → Lista times (?nome= &turma=)`);
  console.log(`    GET  /modalidades      → Lista modalidades (?nome=)`);
  console.log(`    GET  /confrontos       → Lista confrontos (?status= &modalidadeId= &timeId=)\n`);
});

module.exports = app;
