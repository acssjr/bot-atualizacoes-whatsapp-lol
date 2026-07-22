<div align="center">

# ⚔️ Bot de WhatsApp - Patch Notes LoL, TFT, VALORANT & ARAM Desordem 🎲

  <p align="center">
    <strong>Bot inteligente para WhatsApp com envio automático de notas de atualização oficiais do League of Legends, Teamfight Tactics e VALORANT em PT-BR, acompanhadas de Infográficos de Destaques e Links Oficiais.</strong>
  </p>

  <p align="center">
    <a href="https://nodejs.org"><img src="https://img.shields.io/badge/Node.js-v18%2B-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" alt="Node.js"></a>
    <a href="https://github.com/whiskeysockets/baileys"><img src="https://img.shields.io/badge/WhatsApp-Baileys%20v2-25D366?style=for-the-badge&logo=whatsapp&logoColor=white" alt="Baileys WhatsApp"></a>
    <a href="https://expressjs.com"><img src="https://img.shields.io/badge/Express-Dashboard-000000?style=for-the-badge&logo=express&logoColor=white" alt="Express Dashboard"></a>
    <a href="https://playvalorant.com"><img src="https://img.shields.io/badge/VALORANT-Oficial%20PT--BR-ff4655?style=for-the-badge&logo=valorant&logoColor=white" alt="VALORANT PT-BR"></a>
    <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-blue.style=for-the-badge" alt="License MIT"></a>
  </p>
</div>

---

## 📌 Sobre o Projeto

Este bot foi desenvolvido para comunidade e grupos de **League of Legends**, **Teamfight Tactics** e **VALORANT**. Ele monitora os portais oficiais da **Riot Games Brasil**, raspa os artigos completos de atualização, realiza a curadoria técnica dos dados (removendo textos introdutórios e piadas) e formata a mensagem para leitura clara no WhatsApp.

Além do texto legível com emojis e separadores organizados, o bot anexa a **imagem infográfica oficial de Destaques da Atualização** (LoL, TFT e VALORANT) e adiciona o **link oficial do site no rodapé**.

---

## ✨ Principais Recursos

- 🖼️ **Infográficos Oficiais da Riot**: Envia a imagem em alta resolução de Destaques da Atualização (`1920x1080` no LoL e VALORANT, `3067x1726` no TFT) como anexo de imagem no WhatsApp com a legenda formatada.
- 🎯 **Suporte Oficial ao VALORANT (`!vava` / `!valorant`)**: Raspa atualizações de Agentes (com Habilidades), Armas, Sistemas e Correções de Bugs do VALORANT.
- 🎯 **Curadoria & Leitura Completa das Habilidades**: Extrai o nome exato da habilidade (ex: `🎯 E – Aperto Mortal` ou `🎯 Fluxo Protetor`) e a transição exata das estatísticas (`15s >>> 20s`).
- 💥 **Modo Exclusivo ARAM: Desordem (`!ad`)**: Raspa e exibe apenas os aprimoramentos, mecânicas e correções de bugs exclusivas do modo ARAM Desordem.
- 🎲 **Suporte Completo ao TFT (`!tft`)**: Raspa unidades divididas por tiers (Tier 1 ao 5), características, aprimoramentos e bugs do Teamfight Tactics.
- 📅 **Calendário PT-BR com Dia da Semana (`!agenda`)**: Exibe as datas de lançamento das atualizações formatadas no padrão brasileiro com o dia da semana correspondente.
- 🌐 **Dashboard Web Integrado (`http://localhost:3000`)**: Painel de controle em tempo real com leitura de QR Code, sincronização de grupos e prévia visual do balão do WhatsApp.
- 🛡️ **Resistente a Falhas & Mensagens Temporárias**: Suporte completo a grupos com Mensagens Temporárias (Ephemeral) ativadas e alias amigáveis para digitação.

---

## 🕹️ Lista de Comandos

Todos os comandos devem ser enviados nos grupos autorizados ou no privado do bot:

| Comando | Descrição | Anexos / Formato |
| :--- | :--- | :--- |
| **`!iniciar`** (ou `!inciar`) | Autoriza o grupo atual a receber notificações automáticas. | 🤖 Mensagem de Boas-Vindas |
| **`!patch`** / **`!lol`** | Exibe as notas completas de atualização do League of Legends. | 🖼️ Infográfico + 🔗 Link Oficial |
| **`!vava`** / **`!valorant`** | Exibe as notas completas de atualização do **VALORANT**. | 🖼️ Infográfico + 🔗 Link Oficial |
| **`!ad`** / **`!desordem`** | Exibe as mudanças exclusivas do modo **ARAM: DESORDEM**. | 🔗 Link Oficial |
| **`!tft`** | Exibe as notas completas de atualização do Teamfight Tactics. | 🖼️ Infográfico TFT + 🔗 Link Oficial |
| **`!agenda`** / **`!proximo`** | Exibe a data do patch atual e do próximo patch em PT-BR. | 📅 Data + Dia da Semana |
| **`!ajuda`** / **`!help`** | Lista os comandos disponíveis no bot. | 📌 Guia Rápido |

---

## 🚀 Como Executar Localmente

### Pré-requisitos
- **Node.js**: Versão 18.x ou superior.
- **npm**: Versão 9.x ou superior.

### 1. Clonar o Repositório
```bash
git clone https://github.com/acssjr/bot-atualizacoes-whatsapp-lol.git
cd bot-atualizacoes-whatsapp-lol
```

### 2. Instalar Dependências
```bash
npm install
```

### 3. Iniciar o Bot & Dashboard Web
```bash
npm start
```

### 4. Conectar o WhatsApp
1. Abra o navegador e acesse o Dashboard Web: **`http://localhost:3000`**
2. No seu celular, abra o WhatsApp ➔ **Aparelhos Conectados** ➔ **Conectar um Aparelho**.
3. Escaneie o QR Code exibido na tela ou no terminal.

---

## 📄 Licença

Este projeto está sob a licença **MIT**. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

---

<div align="center">
  <sub>Desenvolvido com ❤️ para a comunidade de League of Legends, TFT & VALORANT Brasil.</sub>
</div>
