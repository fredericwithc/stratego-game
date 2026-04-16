import { ref, set, onValue, get, remove, update } from 'firebase/database';
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
        // Garantir tipos para evitar erros internos do Firebase (ex: path.split em valor não-string)
        const salaId = String(sala || '');
        const playerId = String(jogadorId || '');

        if (!salaId || !playerId) {
            throw new Error('Sala ou jogadorId inválido ao marcar pronto.');
        }

        // Determinar a cor do jogador a partir do Firebase (fonte de verdade).
        // Isso evita bugs quando `minhaCor` no React ainda não está setada/está desatualizada.
        const jogadorRef = ref(database, `salas/${salaId}/jogadores/${playerId}`);
        const snapJogador = await get(jogadorRef);
        const corFirebase = snapJogador.val()?.cor;
        const corEfetiva = corFirebase || minhaCor;

        // 1. Ler tabuleiro atual e mesclar minhas peças
        const tabuleiroRef = ref(database, `salas/${salaId}/tabuleiro`);
        const snapTabuleiro = await get(tabuleiroRef);
        const tabuleiroFirebase = snapTabuleiro.val() || {};
        
        // Serializar minhas peças
        const minhasPecas = serializarTabuleiro(tabuleiro);
        
        // Mesclar: manter peças do Firebase + adicionar minhas peças
        const tabuleiroMesclado = { ...tabuleiroFirebase, ...minhasPecas };

        // 2. Atualizar tudo de uma vez para evitar estado intermediário inconsistente
        const salaRef = ref(database, `salas/${salaId}`);
        const atualizacao = {
            [`jogadores/${playerId}/pronto`]: true,
            tabuleiro: tabuleiroMesclado
        };

        if (corEfetiva === 'Vermelho') {
            atualizacao.faseJogo = 'configuracao';
            atualizacao.jogadorAtual = 'Azul';
        } else if (corEfetiva === 'Azul') {
            atualizacao.faseJogo = 'jogando';
            atualizacao.jogadorAtual = 'Vermelho';
        }

        await update(salaRef, atualizacao);
        console.log('[ONLINE] Estado atualizado:', {
            minhaCor: corEfetiva,
            faseJogo: atualizacao.faseJogo,
            jogadorAtual: atualizacao.jogadorAtual,
            pecas: Object.keys(tabuleiroMesclado).length
        });

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

        const jogadorVermelho = Object.values(salaData.jogadores || {}).find((j) => j?.cor === 'Vermelho');
        const vermelhoPronto = Boolean(jogadorVermelho?.pronto);

        if (vermelhoPronto && salaData.faseJogo !== 'jogando') {
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