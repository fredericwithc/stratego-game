import { ref, set, onValue, get, remove } from 'firebase/database';

// FUNÇÃO: Gerar código de sala aleatório 
export const gerarCodigoSala = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
};

// FUNÇÃO: Salvar ID do jogador no localStorage
const salvarJogadorId = (sala, jogadorId, cor) => {
    localStorage.setItem(`stratego_sala_${sala}`, JSON.stringify({
        jogadorId,
        cor,
        timestamp: Date.now()
    }));
};

// FUNÇÃO: Recuperar ID do jogador do localStorage
const recuperarJogadorId = (sala) => {
    const data = localStorage.getItem(`stratego_sala_${sala}`);
    if (!data) return null;

    try {
        const parsed = JSON.parse(data);
        // Limpar se passou mais de 24h
        if (Date.now() - parsed.timestamp > 24 * 60 * 60 * 1000) {
            localStorage.removeItem(`stratego_sala_${sala}`);
            return null;
        }
        return parsed;
    } catch {
        return null;
    }
};

// FUNÇÃO: Criar sala nova 
export const criarSala = async (
    database,
    setEstadoOnline,
    setJogadorOnlineId,
    setModoJogo,
    setAguardandoJogador,
    setTelaSalaCriada,
    setErroConexao
) => {
    try {
        const codigo = gerarCodigoSala();
        const jogadorId = Date.now().toString();

        const salaRef = ref(database, `salas/${codigo}`);
        await set(salaRef, {
            host: jogadorId,
            jogadores: {
                [jogadorId]: {
                    nome: 'Jogador 1',
                    cor: 'Vermelho',
                    pronto: false,
                    conectado: true,
                    ultimaAtualizacao: Date.now()
                }
            },
            estado: 'aguardando',
            tabuleiro: {},
            jogadorAtual: 'Vermelho',
            faseJogo: 'configuracao',
            criadaEm: Date.now()
        });

        // Salvar no localStorage
        salvarJogadorId(codigo, jogadorId, 'Vermelho');

        setEstadoOnline({
            sala: codigo,
            conectado: true,
            jogadorHost: true,
            minhaCor: 'Vermelho'
        });
        setJogadorOnlineId(jogadorId);
        setModoJogo('online');
        setAguardandoJogador(true);
        setTelaSalaCriada(true);

    } catch (error) {
        setErroConexao('Erro ao criar sala: ' + error.message);
    }
};

// FUNÇÃO: Entrar em sala existente 
export const entrarNaSala = async (
    codigoSala,
    database,
    setEstadoOnline,
    setJogadorOnlineId,
    setModoJogo,
    setMensagem,
    setMostrarModalOnline,
    setErroConexao,
    setCodigoSala,
    setFaseJogo,
    setJogadorAtual
) => {
    if (!codigoSala.trim()) {
        setErroConexao('Digite um código de sala');
        return;
    }

    try {
        const salaRef = ref(database, `salas/${codigoSala}`);
        const snap = await get(salaRef);
        const salaData = snap.val();

        if (!salaData) {
            setErroConexao('Sala não encontrada');
            return;
        }

        // VERIFICAR SE JÁ TENHO UM ID SALVO PARA ESTA SALA
        const dadosSalvos = recuperarJogadorId(codigoSala);

        if (dadosSalvos && salaData.jogadores[dadosSalvos.jogadorId]) {
            // RECONEXÃO - Já estava nesta sala antes!
            const jogadorId = dadosSalvos.jogadorId;
            const minhaCor = dadosSalvos.cor;

            // Atualizar status de conectado
            const jogadorRef = ref(database, `salas/${codigoSala}/jogadores/${jogadorId}`);
            await set(jogadorRef, {
                ...salaData.jogadores[jogadorId],
                conectado: true,
                ultimaAtualizacao: Date.now()
            });

            setEstadoOnline({
                sala: codigoSala,
                conectado: true,
                jogadorHost: salaData.host === jogadorId,
                minhaCor: minhaCor
            });
            setJogadorOnlineId(jogadorId);
            setModoJogo('online');
            setMensagem(`Reconectado à sala: ${codigoSala}`);
            setMostrarModalOnline(false);
            setErroConexao('');
            setCodigoSala('');

            // Restaurar fase do jogo
            setFaseJogo(salaData.faseJogo || 'configuracao');
            setJogadorAtual(salaData.jogadorAtual || 'Vermelho');

            return;
        }

        // NOVA CONEXÃO - Entrar como jogador novo
        const totalJogadores = salaData.jogadores ? Object.keys(salaData.jogadores).length : 0;

        if (totalJogadores >= 2) {
            setErroConexao('Sala cheia. Use o mesmo navegador para reconectar.');
            return;
        }

        const jogadorId = Date.now().toString();
        const jogadoresRef = ref(database, `salas/${codigoSala}/jogadores/${jogadorId}`);
        await set(jogadoresRef, {
            nome: 'Jogador 2',
            cor: 'Azul',
            pronto: false,
            conectado: true,
            ultimaAtualizacao: Date.now()
        });

        // Salvar no localStorage
        salvarJogadorId(codigoSala, jogadorId, 'Azul');

        setEstadoOnline({
            sala: codigoSala,
            conectado: true,
            jogadorHost: false,
            minhaCor: 'Azul'
        });
        setJogadorOnlineId(jogadorId);
        setModoJogo('online');
        setMensagem(`Conectado à sala: ${codigoSala}. Aguardando Jogador Vermelho configurar...`);
        setMostrarModalOnline(false);
        setErroConexao('');
        setCodigoSala('');
        setFaseJogo('aguardando');
        setJogadorAtual('Vermelho');

    } catch (error) {
        setErroConexao('Erro ao entrar na sala: ' + error.message);
    }
};

// NOVA FUNÇÃO: Sair da sala e limpar
export const sairDaSala = async (database, sala, jogadorId) => {
    if (!sala || !jogadorId) return;

    try {
        // Marcar como desconectado
        const jogadorRef = ref(database, `salas/${sala}/jogadores/${jogadorId}`);
        const snap = await get(jogadorRef);

        if (snap.exists()) {
            await set(jogadorRef, {
                ...snap.val(),
                conectado: false,
                ultimaAtualizacao: Date.now()
            });
        }
    } catch (error) {
        console.error('Erro ao sair da sala:', error);
    }
};

// NOVA FUNÇÃO: Limpar salas antigas (mais de 24h)
export const limparSalasAntigas = async (database) => {
    try {
        const salasRef = ref(database, 'salas');
        const snap = await get(salasRef);

        if (!snap.exists()) return;

        const salas = snap.val();
        const agora = Date.now();
        const umDia = 24 * 60 * 60 * 1000;

        for (const [codigo, sala] of Object.entries(salas)) {
            if (sala.criadaEm && (agora - sala.criadaEm > umDia)) {
                const salaRef = ref(database, `salas/${codigo}`);
                await remove(salaRef);
                console.log(`Sala ${codigo} removida (antiga)`);
            }
        }
    } catch (error) {
        console.error('Erro ao limpar salas:', error);
    }
};