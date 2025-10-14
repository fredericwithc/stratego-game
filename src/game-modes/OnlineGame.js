import { ref, set, onValue, get } from 'firebase/database';

// FUNÇÃO: Gerar código de sala aleatório 
export const gerarCodigoSala = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
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
                    pronto: false
                }
            },
            estado: 'aguardando',
            tabuleiro: {},
            jogadorAtual: 'Vermelho',
            faseJogo: 'configuracao'
        });

        setEstadoOnline({
            sala: codigo,
            conectado: true,
            jogadorHost: true
        });
        setJogadorOnlineId(jogadorId);
        setModoJogo('online');
        setAguardandoJogador(true);

        // Mostrar tela especial com código
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
        const jogadorId = Date.now().toString();
        const salaRef = ref(database, `salas/${codigoSala}`);

        // Ler UMA VEZ o estado da sala
        const snap = await get(salaRef);
        const salaData = snap.val();
        if (!salaData) {
            setErroConexao('Sala não encontrada');
            return;
        }
        // (opcional) Checar se já tem 2 jogadores
        const totalJogadores = salaData.jogadores ? Object.keys(salaData.jogadores).length : 0;
        if (totalJogadores >= 2) {
            setErroConexao('Sala cheia');
            return;
        }

        // Adicionar este jogador
        const jogadoresRef = ref(database, `salas/${codigoSala}/jogadores/${jogadorId}`);
        await set(jogadoresRef, {
            nome: 'Jogador 2',
            cor: 'Azul',
            pronto: false
        });

        setEstadoOnline({
            sala: codigoSala,
            conectado: true,
            jogadorHost: false
        });
        setJogadorOnlineId(jogadorId);
        setModoJogo('online');
        setMensagem(`Conectado à sala: ${codigoSala}`);
        // FECHA MODAL E LIMPA CAMPOS
        setMostrarModalOnline(false);
        setErroConexao('');
        setCodigoSala('');
        // Vai para a tela de configuração (host começa Vermelho)
        setFaseJogo('configuracao');
        setJogadorAtual('Vermelho');

    } catch (error) {
        setErroConexao('Erro ao entrar na sala: ' + error.message);
    }
};