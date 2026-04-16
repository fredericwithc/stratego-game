import { ref, set, get, remove, runTransaction } from 'firebase/database';
import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBomb, faFlag } from '@fortawesome/free-solid-svg-icons';

// FUNCAO: Gerar codigo de sala aleatorio 
export const gerarCodigoSala = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
};

// FUNCAO: Serializar tabuleiro (converter React Elements para strings)
export const serializarTabuleiro = (tabuleiro) => {
    const tabuleiroSerializado = {};

    Object.entries(tabuleiro).forEach(([posicao, peca]) => {
        if (!peca) return;

        let numeroSerializado = peca.numero;

        if (React.isValidElement(peca.numero)) {
            if (peca.numero.props.icon.iconName === 'bomb') {
                numeroSerializado = 'BOMBA';
            } else if (peca.numero.props.icon.iconName === 'flag') {
                numeroSerializado = 'BANDEIRA';
            }
        }

        tabuleiroSerializado[posicao] = {
            numero: numeroSerializado,
            jogador: peca.jogador
        };
    });

    return tabuleiroSerializado;
};

// FUNCAO: Desserializar tabuleiro (converter strings para React Elements)
export const desserializarTabuleiro = (tabuleiroSerializado) => {
    const tabuleiro = {};

    Object.entries(tabuleiroSerializado).forEach(([posicao, peca]) => {
        if (!peca) return;

        let numero = peca.numero;

        if (peca.numero === 'BOMBA') {
            numero = <FontAwesomeIcon icon={faBomb} className="bomb-icon" />;
        } else if (peca.numero === 'BANDEIRA') {
            numero = <FontAwesomeIcon icon={faFlag} className="flag-icon" />;
        }

        tabuleiro[posicao] = {
            numero: numero,
            jogador: peca.jogador
        };
    });

    return tabuleiro;
};

// FUNCAO: Salvar ID do jogador no localStorage
const salvarJogadorId = (sala, jogadorId, cor) => {
    localStorage.setItem(`stratego_sala_${sala}`, JSON.stringify({
        jogadorId,
        cor,
        timestamp: Date.now()
    }));
};

// FUNCAO: Recuperar ID do jogador do localStorage
const recuperarJogadorId = (sala) => {
    const data = localStorage.getItem(`stratego_sala_${sala}`);
    if (!data) return null;

    try {
        const parsed = JSON.parse(data);
        if (Date.now() - parsed.timestamp > 24 * 60 * 60 * 1000) {
            localStorage.removeItem(`stratego_sala_${sala}`);
            return null;
        }
        return parsed;
    } catch {
        return null;
    }
};

// FUNCAO: Marcar jogador como pronto e sincronizar tabuleiro
export const marcarJogadorPronto = async (
    database,
    sala,
    jogadorId,
    tabuleiro,
    minhaCor
) => {
    try {
        const salaId = String(sala || '');
        const playerId = String(jogadorId || '');

        if (!salaId || !playerId) {
            throw new Error('Sala ou jogadorId inválido ao marcar pronto.');
        }

        const minhasPecasSerial = serializarTabuleiro(tabuleiro);
        const salaRef = ref(database, `salas/${salaId}`);

        // Transação: lê o estado atual da sala, mescla tabuleiro e aplica virada de turno de forma atômica.
        // Evita condições de corrida entre dois clientes e falhas parciais do update().
        await runTransaction(salaRef, (current) => {
            if (current == null) {
                return undefined;
            }

            const c = typeof current === 'object' ? { ...current } : {};
            const tabuleiroFirebase =
                c.tabuleiro && typeof c.tabuleiro === 'object' ? c.tabuleiro : {};
            const tabuleiroMesclado = { ...tabuleiroFirebase, ...minhasPecasSerial };

            const hostId = c.host != null ? String(c.host) : '';
            const isVermelho = Boolean(hostId && playerId === hostId);

            const jogadores = { ...(c.jogadores || {}) };
            const anterior = jogadores[playerId] || {};
            jogadores[playerId] = { ...anterior, pronto: true };

            const next = {
                ...c,
                tabuleiro: tabuleiroMesclado,
                jogadores
            };

            if (isVermelho) {
                next.faseJogo = 'configuracao';
                next.jogadorAtual = 'Azul';
            } else {
                next.faseJogo = 'jogando';
                next.jogadorAtual = 'Vermelho';
            }

            return next;
        });

        console.log('[ONLINE] marcarJogadorPronto: transação concluída', { salaId, playerId });
        return true;
    } catch (error) {
        console.error('[ONLINE] Erro ao marcar pronto:', error);
        throw error;
    }
};

// FUNCAO: Criar sala nova 
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

// FUNCAO: Entrar em sala existente 
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
    const codigo = (codigoSala || '').trim().toUpperCase();

    if (!codigo) {
        setErroConexao('Digite um codigo de sala');
        return;
    }

    try {
        const salaRef = ref(database, `salas/${codigo}`);
        const snap = await get(salaRef);
        const salaData = snap.val();

        if (!salaData) {
            setErroConexao('Sala nao encontrada');
            return;
        }

        const dadosSalvos = recuperarJogadorId(codigo);

        if (dadosSalvos && salaData.jogadores?.[dadosSalvos.jogadorId]) {
            const jogadorId = dadosSalvos.jogadorId;
            const minhaCor = dadosSalvos.cor;

            const jogadorRef = ref(database, `salas/${codigo}/jogadores/${jogadorId}`);
            await set(jogadorRef, {
                ...salaData.jogadores[jogadorId],
                conectado: true,
                ultimaAtualizacao: Date.now()
            });

            setEstadoOnline({
                sala: codigo,
                conectado: true,
                jogadorHost: salaData.host === jogadorId,
                minhaCor: minhaCor
            });
            setJogadorOnlineId(jogadorId);
            setModoJogo('online');
            setMensagem(`Reconectado a sala: ${codigo}`);
            setMostrarModalOnline(false);
            setErroConexao('');
            setCodigoSala('');
            setFaseJogo(salaData.faseJogo || 'configuracao');
            setJogadorAtual(salaData.jogadorAtual || 'Vermelho');
            return;
        }

        const jogadores = Object.values(salaData.jogadores || {});
        const totalConectados = jogadores.filter((jogador) => jogador?.conectado !== false).length;

        if (totalConectados >= 2) {
            setErroConexao('Sala cheia. Use o mesmo navegador para reconectar.');
            return;
        }

        const jogadorId = Date.now().toString();
        const jogadoresRef = ref(database, `salas/${codigo}/jogadores/${jogadorId}`);
        await set(jogadoresRef, {
            nome: 'Jogador 2',
            cor: 'Azul',
            pronto: false,
            conectado: true,
            ultimaAtualizacao: Date.now()
        });

        salvarJogadorId(codigo, jogadorId, 'Azul');

        setEstadoOnline({
            sala: codigo,
            conectado: true,
            jogadorHost: false,
            minhaCor: 'Azul'
        });
        setJogadorOnlineId(jogadorId);
        setModoJogo('online');
        setMensagem(`Conectado a sala: ${codigo}.`);
        setMostrarModalOnline(false);
        setErroConexao('');
        setCodigoSala('');

        const hostId = salaData.host ? String(salaData.host) : '';
        const hostPronto = hostId ? Boolean(salaData.jogadores?.[hostId]?.pronto) : false;

        // A virada de turno na configuração online é `jogadorAtual`, não necessariamente `pronto`.
        if (salaData.jogadorAtual === 'Azul' && salaData.faseJogo !== 'jogando') {
            setFaseJogo('configuracao');
            setJogadorAtual('Azul');
        } else if (hostPronto && salaData.faseJogo !== 'jogando') {
            setFaseJogo('configuracao');
            setJogadorAtual('Azul');
        } else {
            setFaseJogo(salaData.faseJogo || 'configuracao');
            setJogadorAtual(salaData.jogadorAtual || 'Vermelho');
        }

    } catch (error) {
        setErroConexao('Erro ao entrar na sala: ' + error.message);
    }
};

// FUNCAO: Sair da sala
export const sairDaSala = async (database, sala, jogadorId) => {
    if (!sala || !jogadorId) return;

    try {
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

// FUNCAO: Limpar salas antigas
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