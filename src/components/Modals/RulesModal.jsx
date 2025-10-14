
import React from 'react';

function RulesModal({ mostrarRegras, fecharRegras }) {
    if (!mostrarRegras) return null;

    return (
        <div className="modal-overlay" role="dialog" aria-modal="true" aria-label="Regras do jogo">
            <div className="modal">
                <header className="modal-header">
                    <h3>Regras do Jogo</h3>
                    <button className="close-btn" onClick={fecharRegras} aria-label="Fechar">×</button>
                </header>
                <div className="modal-content">

                    <h4 className="rule-title">Formação Inicial</h4>

                    <p>• Cada jogador escolhe a formação do seu exército, distribuindo as peças como desejar nas 4 linhas de sua cor no tabuleiro.</p>

                    <hr></hr>

                    <h4 className="rule-title">Regras de Movimentação</h4>

                    <p>• A maioria das peças se move 1 casa ortogonalmente.</p>
                    <p>• O Soldado(2) pode andar quantas casas livres quiser, na horizontal ou na vertical. Ele também pode andar e atacar no mesmo turno.</p>
                    <p>• Nenhuma peça pode se mover na diagonal, pular sobre outras peças, nem se mover para um espaço já ocupado por outra peça.</p>
                    <p>• Lagos são intransponíveis.</p>
                    <p>• Somente uma peça pode se mover em cada turno.</p>
                    <p>• Uma peça não pode se mover mais do que 5 vezes, sem parar, entre 2 casas.</p>
                    <p>• Bomba e Bandeira não se movem.</p>

                    <hr></hr>

                    <h4 className="rule-title">Regras de Ataque</h4>

                    <p>• Peças se revelam no ataque; maior patente vence (Existem exceções).</p>
                    <p>• A peça com o valor menor é capturada e removida do tabuleiro. Se a peça vencedora foi a atacante, então ela se move para a posição da peça capturada. Se a peça vencedora foi a atacada, ela fica na posição que está.</p>
                    <p>• Quando duas peças de mesmo valor se atacam, as duas são removidas do tabuleiro.</p>
                    <p>• O ataque é sempre opcional.</p>

                    <hr></hr>

                    <h4 className="rule-title">Regras Especiais de Ataque</h4>

                    <p>• Bomba e Desarmadora(3): Todas as peças que atacam uma bomba, são removidas do tabuleiro (inclusive a bomba atacada), exceto a peça desarmadora, que desarma e captura a bomba.</p>
                    <p>• Marechal(10) e Assassino(1): O Marechal ganha de todas as outras peças de valor menor, só pode ser capturado se for atacado pelo Assassino. Caso o Marechal ataque o Assassino primeiro, ele vence.</p>

                    <hr></hr>

                    <h4 className="rule-title">Objetivo do Jogo</h4>

                    <p>• Capturar a bandeira inimiga, ou eliminar todas as peças do oponente que se movimentam.</p>

                </div>
                <footer className="modal-footer">
                    <button className="nav-btn" onClick={fecharRegras}>Fechar</button>
                </footer>
            </div>
        </div>
    );
}

export default RulesModal;