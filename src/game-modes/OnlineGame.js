import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBomb, faFlag } from '@fortawesome/free-solid-svg-icons';
import { supabase, supabaseConfigured } from '../supabase';

const ERRO_SUPABASE_NAO_CONFIGURADO =
    'Jogo online indisponível: rode npm run build com .env.local preenchido e faça deploy de novo.';

// Converte linha Postgres (snake_case) para o formato usado na UI
export const rowToSalaData = (row) => {
    if (!row) return null;
    return {
        host: row.host_id,
        faseJogo: row.fase_jogo,
        jogadorAtual: row.jogador_atual,
        estado: row.estado,
        tabuleiro: row.tabuleiro || {},
        jogadores: row.jogadores || {},
        criadaEm: row.criada_em ? new Date(row.criada_em).getTime() : Date.now()
    };
};

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

const salvarJogadorId = (sala, jogadorId, cor) => {
    localStorage.setItem(`stratego_sala_${sala}`, JSON.stringify({
        jogadorId,
        cor,
        timestamp: Date.now()
    }));
};

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

// FUNCAO: Atualizar tabuleiro na sala (colocação de peça durante configuração)
export const atualizarTabuleiroOnline = async (salaId, tabuleiro) => {
    const id = String(salaId || '');
    if (!id || !supabase) return;

    const tabuleiroSerializado = serializarTabuleiro(tabuleiro);
    const { error } = await supabase
        .from('rooms')
        .update({ tabuleiro: tabuleiroSerializado })
        .eq('id', id);

    if (error) {
        console.error('[ONLINE] Erro ao atualizar tabuleiro:', error);
        throw error;
    }
};

// FUNCAO: Marcar jogador como pronto (RPC atômica no Postgres)
export const marcarJogadorPronto = async (sala, jogadorId, tabuleiro) => {
    const salaId = String(sala || '');
    const playerId = String(jogadorId || '');

    if (!salaId || !playerId) {
        throw new Error('Sala ou jogadorId inválido ao marcar pronto.');
    }
    if (!supabase) {
        throw new Error(ERRO_SUPABASE_NAO_CONFIGURADO);
    }

    const tabuleiroPatch = serializarTabuleiro(tabuleiro);

    const { data, error } = await supabase.rpc('marcar_pronto', {
        room_id: salaId,
        player_id: playerId,
        tabuleiro_patch: tabuleiroPatch
    });

    if (error) {
        console.error('[ONLINE] Erro ao marcar pronto:', error);
        throw error;
    }

    console.log('[ONLINE] marcarJogadorPronto concluído', { salaId, playerId, data });
    return rowToSalaData(data);
};

// FUNCAO: Criar sala nova
export const criarSala = async (
    setEstadoOnline,
    setJogadorOnlineId,
    setModoJogo,
    setAguardandoJogador,
    setTelaSalaCriada,
    setErroConexao
) => {
    try {
        if (!supabaseConfigured) {
            setErroConexao(ERRO_SUPABASE_NAO_CONFIGURADO);
            return false;
        }

        const codigo = gerarCodigoSala();
        const jogadorId = Date.now().toString();

        const { error } = await supabase.from('rooms').insert({
            id: codigo,
            host_id: jogadorId,
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
            jogador_atual: 'Vermelho',
            fase_jogo: 'configuracao'
        });

        if (error) throw error;

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

        return true;
    } catch (error) {
        setErroConexao('Erro ao criar sala: ' + error.message);
        return false;
    }
};

// FUNCAO: Entrar em sala existente
export const entrarNaSala = async (
    codigoSala,
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
        return false;
    }

    try {
        if (!supabaseConfigured) {
            setErroConexao(ERRO_SUPABASE_NAO_CONFIGURADO);
            return false;
        }

        const { data: row, error: fetchError } = await supabase
            .from('rooms')
            .select('*')
            .eq('id', codigo)
            .maybeSingle();

        if (fetchError) throw fetchError;
        if (!row) {
            setErroConexao('Sala nao encontrada');
            return false;
        }

        const salaData = rowToSalaData(row);
        const dadosSalvos = recuperarJogadorId(codigo);

        if (dadosSalvos && salaData.jogadores?.[dadosSalvos.jogadorId]) {
            const jogadorId = dadosSalvos.jogadorId;
            const minhaCor = dadosSalvos.cor;
            const jogadores = { ...salaData.jogadores };

            jogadores[jogadorId] = {
                ...jogadores[jogadorId],
                conectado: true,
                ultimaAtualizacao: Date.now()
            };

            const { error: updateError } = await supabase
                .from('rooms')
                .update({ jogadores })
                .eq('id', codigo);

            if (updateError) throw updateError;

            setEstadoOnline({
                sala: codigo,
                conectado: true,
                jogadorHost: String(salaData.host) === String(jogadorId),
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
            return true;
        }

        const jogadoresList = Object.values(salaData.jogadores || {});
        const totalConectados = jogadoresList.filter((j) => j?.conectado !== false).length;

        if (totalConectados >= 2) {
            setErroConexao('Sala cheia. Use o mesmo navegador para reconectar.');
            return false;
        }

        const jogadorId = Date.now().toString();
        const jogadores = { ...salaData.jogadores };

        jogadores[jogadorId] = {
            nome: 'Jogador 2',
            cor: 'Azul',
            pronto: false,
            conectado: true,
            ultimaAtualizacao: Date.now()
        };

        const { error: joinError } = await supabase
            .from('rooms')
            .update({ jogadores })
            .eq('id', codigo);

        if (joinError) throw joinError;

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

        setFaseJogo(salaData.faseJogo || 'configuracao');
        setJogadorAtual(salaData.jogadorAtual || 'Vermelho');

        return true;
    } catch (error) {
        setErroConexao('Erro ao entrar na sala: ' + error.message);
        return false;
    }
};

// FUNCAO: Sair da sala
export const sairDaSala = async (sala, jogadorId) => {
    if (!sala || !jogadorId || !supabase) return;

    try {
        const { data: row, error: fetchError } = await supabase
            .from('rooms')
            .select('jogadores')
            .eq('id', sala)
            .maybeSingle();

        if (fetchError || !row?.jogadores?.[jogadorId]) return;

        const jogadores = { ...row.jogadores };
        jogadores[jogadorId] = {
            ...jogadores[jogadorId],
            conectado: false,
            ultimaAtualizacao: Date.now()
        };

        await supabase.from('rooms').update({ jogadores }).eq('id', sala);
    } catch (error) {
        console.error('Erro ao sair da sala:', error);
    }
};

// FUNCAO: Limpar salas antigas
export const limparSalasAntigas = async () => {
    if (!supabase) return;

    try {
        const umDiaAtras = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
        const { error } = await supabase
            .from('rooms')
            .delete()
            .lt('criada_em', umDiaAtras);

        if (error) {
            console.error('Erro ao limpar salas:', error);
        }
    } catch (error) {
        console.error('Erro ao limpar salas:', error);
    }
};
