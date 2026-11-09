/**
 * WolfDEAD v3.2 - Game Engine, Multi-Model Per-Role, Dual-Core & Post-Game Lobby Chat
 */

const ROLE_DEFINITIONS = {
    werewolf: {
        name: 'Ma Sói',
        team: 'werewolf',
        icon: '🐺',
        desc: 'Mỗi đêm mỗi Ma Sói được chọn cắn 1 người. Ban ngày trà trộn, chửi bới và đổ tội cho Dân Làng.'
    },
    witch: {
        name: 'Phù Thủy',
        team: 'village',
        icon: '🧙‍♀️',
        desc: 'Có 1 Bình Cứu và 1 Bình Giết. Trong đêm có thể chọn Cứu, Giết, dùng CẢ 2 bình trong cùng đêm, hoặc Không hành động.'
    },
    bodyguard: {
        name: 'Bảo Vệ',
        team: 'village',
        icon: '🛡️',
        desc: 'Mỗi đêm chọn 1 người để bảo vệ khỏi nanh vuốt Ma Sói. Không được bảo vệ cùng 1 người 2 đêm liên tiếp.'
    },
    villager: {
        name: 'Dân Làng',
        team: 'village',
        icon: '🧑‍🌾',
        desc: 'Không có kỹ năng đêm. Dùng cái đầu lạnh và mồm mép sắc bén để vạch mặt Ma Sói trên bàn đấu khẩu.'
    }
};

const BOT_NAME_POOL = [
    "Minh", "Lan", "Phong", "Vy", "Hoàng", "Quỳnh", "Khoa", "Bảo", "Hùng", "Trâm", "An", "Bình", "Cường", "Dung", "Thảo"
];

function getAvatarSvg(avatarIndex, isDead = false) {
    const colors = [
        ['#388bfd', '#1f6feb'],
        ['#f0883e', '#d29922'],
        ['#a371f7', '#8957e5'],
        ['#2ea043', '#238636'],
        ['#f778ba', '#db61a2'],
        ['#56d4dd', '#39c5cf'],
        ['#e3b341', '#9e6a03'],
        ['#ff7b72', '#da3633']
    ];
    const [c1, c2] = colors[avatarIndex % colors.length];
    const eyeColor = isDead ? '#484f58' : '#ffffff';
    const mouthPath = isDead 
        ? '<path d="M22 36 L28 36" stroke="#8b949e" stroke-width="2" stroke-linecap="round"/>' 
        : '<path d="M19 35 Q25 32 31 35" stroke="#ffffff" stroke-width="2.2" fill="none" stroke-linecap="round"/>';

    return `
    <svg class="player-avatar-svg" viewBox="0 0 50 50">
        <defs>
            <linearGradient id="grad_${avatarIndex}" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="${isDead ? '#30363d' : c1}" />
                <stop offset="100%" stop-color="${isDead ? '#161b22' : c2}" />
            </linearGradient>
        </defs>
        <circle cx="25" cy="25" r="23" fill="url(#grad_${avatarIndex})" />
        <circle cx="18" cy="22" r="3" fill="${eyeColor}" />
        <circle cx="32" cy="22" r="3" fill="${eyeColor}" />
        ${isDead ? `
            <line x1="15" y1="19" x2="21" y2="25" stroke="#f85149" stroke-width="2"/>
            <line x1="21" y1="19" x2="15" y2="25" stroke="#f85149" stroke-width="2"/>
            <line x1="29" y1="19" x2="35" y2="25" stroke="#f85149" stroke-width="2"/>
            <line x1="35" y1="19" x2="29" y2="25" stroke="#f85149" stroke-width="2"/>
        ` : `
            <line x1="14" y1="17" x2="22" y2="20" stroke="#ffffff" stroke-width="2" stroke-linecap="round"/>
            <line x1="36" y1="17" x2="28" y2="20" stroke="#ffffff" stroke-width="2" stroke-linecap="round"/>
        `}
        ${mouthPath}
    </svg>`;
}

class WerewolfGame {
    constructor() {
        this.roleCounts = {
            werewolf: 1,
            witch: 1,
            bodyguard: 1,
            villager: 3
        };
        this.maxDiscussionTurns = 5;

        this.players = [];
        this.round = 1;
        this.phase = 'MENU';
        this.humanPlayer = null;
        this.lastWinnerTeam = null;
        this.isPostGameGenerating = false;

        this.sharedPublicLogs = [];
        this.morningReport = "";

        this.nightAction = {
            protectedTarget: null,
            lastProtectedTarget: null,
            werewolfTargets: [],
            witchSavedTarget: null,
            witchPoisonTarget: null,
            witchHasSave: true,
            witchHasPoison: true
        };

        this.selectedHumanVoteTarget = null;
        this.votes = {};
        this.godMode = false;
        this.selectedVaultPlayerId = null;

        this.initDOMElements();
        this.attachEvents();
        this.loadMenuDefaults();
    }

    initDOMElements() {
        this.dom = {
            body: document.body,
            mainMenu: document.getElementById('main-menu-screen'),
            menuPlayerName: document.getElementById('menu-player-name'),
            menuTotalPlayers: document.getElementById('menu-total-players'),

            phaseTag: document.getElementById('phase-tag'),
            phaseInstruction: document.getElementById('phase-instruction'),
            turnCounterPill: document.getElementById('turn-counter-pill'),
            activeModelBadge: document.getElementById('active-model-badge'),
            aliveCountText: document.getElementById('alive-count-text'),
            playersGrid: document.getElementById('players-grid'),
            feedMessages: document.getElementById('feed-messages'),

            actionDock: document.getElementById('action-dock'),
            dockTitle: document.getElementById('dock-title'),
            dockInput: document.getElementById('dock-input'),
            btnSend: document.getElementById('btn-send'),
            btnStopChat: document.getElementById('btn-stop-chat'),
            btnSkip: document.getElementById('btn-skip'),
            quickReplies: document.getElementById('quick-replies'),

            roleModal: document.getElementById('role-modal'),
            nightActionModal: document.getElementById('night-action-modal'),
            nightActionTitle: document.getElementById('night-title'),
            nightActionBody: document.getElementById('night-body'),
            vaultModal: document.getElementById('vault-modal'),
            archModal: document.getElementById('arch-modal'),
            settingsModal: document.getElementById('settings-modal'),
            gameOverModal: document.getElementById('game-over-modal'),

            inputApiKey: document.getElementById('settings-api-key'),
            inputBaseUrl: document.getElementById('settings-base-url'),
            modelListContainer: document.getElementById('settings-model-list'),
            btnTestModels: document.getElementById('btn-test-models'),
            btnSaveSettings: document.getElementById('btn-save-settings'),
            btnCloseSettings: document.getElementById('btn-close-settings'),
            btnOpenSettings: document.getElementById('btn-open-settings'),
            btnRestart: document.getElementById('btn-restart'),
            btnSoundToggle: document.getElementById('btn-sound-toggle')
        };
    }

    attachEvents() {
        document.getElementById('btn-menu-start').onclick = () => {
            const name = this.dom.menuPlayerName.value.trim() || 'Tuấn';
            localStorage.setItem('wolfdead_player_name', name);
            this.dom.mainMenu.classList.remove('active');
            this.startNewGame();
        };

        document.getElementById('btn-menu-settings').onclick = () => this.openSettings();
        document.getElementById('btn-menu-arch').onclick = () => this.dom.archModal.classList.add('active');
        document.getElementById('btn-close-arch').onclick = () => this.dom.archModal.classList.remove('active');

        document.getElementById('btn-open-menu').onclick = () => {
            this.dom.mainMenu.classList.add('active');
        };

        document.getElementById('btn-open-vaults').onclick = () => this.openVaultInspector();
        document.getElementById('btn-gameover-vaults').onclick = () => {
            this.dom.gameOverModal.classList.remove('active');
            document.getElementById('toggle-god-vault').checked = true;
            this.openVaultInspector();
        };
        document.getElementById('btn-close-vault').onclick = () => this.dom.vaultModal.classList.remove('active');
        document.getElementById('toggle-god-vault').onchange = () => this.renderVaultInspectorContent();

        // Nút vào Phòng Chat Hậu Trường Sau Trận
        document.getElementById('btn-gameover-postchat').onclick = () => {
            this.dom.gameOverModal.classList.remove('active');
            this.startPostGameChat();
        };

        this.dom.btnOpenSettings.onclick = () => this.openSettings();
        this.dom.btnCloseSettings.onclick = () => this.closeSettings();
        this.dom.btnSaveSettings.onclick = () => this.saveSettings();
        this.dom.btnTestModels.onclick = () => this.testModels();
        this.dom.btnRestart.onclick = () => this.startNewGame();

        this.dom.btnSoundToggle.onclick = () => {
            const isMuted = soundManager.toggleMute();
            this.dom.btnSoundToggle.innerHTML = isMuted ? '🔇 Tắt tiếng' : '🔊 Âm thanh';
        };

        document.getElementById('btn-role-confirm').onclick = () => {
            this.dom.roleModal.classList.remove('active');
            this.startNightPhase();
        };

        document.getElementById('btn-play-again').onclick = () => {
            this.dom.gameOverModal.classList.remove('active');
            this.dom.mainMenu.classList.add('active');
        };
    }

    loadMenuDefaults() {
        const savedName = localStorage.getItem('wolfdead_player_name');
        if (savedName) this.dom.menuPlayerName.value = savedName;
        this.updateMenuRoleUI();
    }

    adjustRoleCount(role, delta) {
        const limits = {
            werewolf: [1, 3],
            witch: [0, 1],
            bodyguard: [0, 1],
            villager: [1, 6]
        };
        const [min, max] = limits[role];
        const nextVal = this.roleCounts[role] + delta;
        if (nextVal >= min && nextVal <= max) {
            this.roleCounts[role] = nextVal;
            this.updateMenuRoleUI();
        }
    }

    updateMenuRoleUI() {
        document.getElementById('count-werewolf').textContent = this.roleCounts.werewolf;
        document.getElementById('count-witch').textContent = this.roleCounts.witch;
        document.getElementById('count-bodyguard').textContent = this.roleCounts.bodyguard;
        document.getElementById('count-villager').textContent = this.roleCounts.villager;

        const total = Object.values(this.roleCounts).reduce((a, b) => a + b, 0);
        this.dom.menuTotalPlayers.textContent = `Tổng: ${total} người chơi (1 Người + ${total - 1} AI)`;
    }

    /* =========================================================================
     * KHỞI TẠO VÁN ĐẤU
     * ========================================================================= */
    startNewGame() {
        soundManager.init();
        this.round = 1;
        this.sharedPublicLogs = [];
        this.godMode = false;
        this.lastWinnerTeam = null;
        this.isPostGameGenerating = false;
        this.selectedHumanVoteTarget = null;
        if (document.getElementById('toggle-god-vault')) {
            document.getElementById('toggle-god-vault').checked = false;
        }

        this.nightAction = {
            protectedTarget: null,
            lastProtectedTarget: null,
            werewolfTargets: [],
            witchSavedTarget: null,
            witchPoisonTarget: null,
            witchHasSave: true,
            witchHasPoison: true
        };

        const rolesDeck = [];
        for (let i = 0; i < this.roleCounts.werewolf; i++) rolesDeck.push('werewolf');
        for (let i = 0; i < this.roleCounts.witch; i++) rolesDeck.push('witch');
        for (let i = 0; i < this.roleCounts.bodyguard; i++) rolesDeck.push('bodyguard');
        for (let i = 0; i < this.roleCounts.villager; i++) rolesDeck.push('villager');

        for (let i = rolesDeck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [rolesDeck[i], rolesDeck[j]] = [rolesDeck[j], rolesDeck[i]];
        }

        const totalPlayers = rolesDeck.length;
        const humanName = localStorage.getItem('wolfdead_player_name') || 'Tuấn';
        const availableBotNames = BOT_NAME_POOL.filter(n => n.toLowerCase() !== humanName.toLowerCase())
            .sort(() => Math.random() - 0.5);

        const shuffledPersonas = [...PERSONA_ARCHETYPES].sort(() => Math.random() - 0.5);
        const availableModels = [...aiBrain.models];
        const humanSeatIndex = Math.floor(Math.random() * totalPlayers);

        this.players = [];
        let botIdx = 0;

        for (let i = 0; i < totalPlayers; i++) {
            const isHuman = (i === humanSeatIndex);
            const name = isHuman ? humanName : availableBotNames[botIdx];
            const role = rolesDeck[i];

            const personaArchetype = isHuman
                ? {
                    id: 'human_player',
                    title: '🎮 Người Chơi Tự Do',
                    pronouns: 'Tự do',
                    aggression: 'Tự chọn',
                    reasoningBias: 'Suy luận trực tiếp của người chơi',
                    trashTalkStyle: 'Ngôn ngữ tự nhập'
                }
                : shuffledPersonas[botIdx % shuffledPersonas.length];

            const assignedModel = isHuman
                ? 'Human Brain'
                : availableModels[botIdx % availableModels.length];

            if (!isHuman) botIdx++;

            const personaCore = new PersonaCore(personaArchetype);
            const vault = new RoleDataVault(i + 1, name, role, personaCore, assignedModel);

            const player = {
                id: i + 1,
                name: name,
                role: role,
                isHuman: isHuman,
                isAlive: true,
                personaCore: personaCore,
                assignedModel: assignedModel,
                avatarIndex: i,
                votesAgainst: 0,
                deathRound: null,
                deathReason: null,
                internalDeathCause: null,
                vault: vault
            };

            this.players.push(player);
            if (isHuman) this.humanPlayer = player;
        }

        this.updateAliveCountHeader();
        this.renderPlayers();
        this.clearFeed();
        this.addSystemMessage(
            `🔥 Sới Ma Sói bắt đầu! ${totalPlayers} người chơi đã vào bàn (Luật: KHI CHẾT KHÔNG LỘ ROLE • Tối đa ${this.maxDiscussionTurns} Turn đấu khẩu/ngày).`
        );
        this.showRoleModal();
    }

    updateAliveCountHeader() {
        const alive = this.players.filter(p => p.isAlive).length;
        this.dom.aliveCountText.textContent = `Còn sống: ${alive}/${this.players.length} (${this.roleCounts.werewolf} Sói, ${this.roleCounts.witch} Phù, ${this.roleCounts.bodyguard} Bảo vệ, ${this.roleCounts.villager} Dân • Chết ẩn Role)`;
    }

    showRoleModal() {
        const role = ROLE_DEFINITIONS[this.humanPlayer.role];
        document.getElementById('modal-role-icon').textContent = role.icon;
        document.getElementById('modal-role-name').textContent = role.name;
        document.getElementById('modal-role-desc').textContent = role.desc;

        let extraInfo = `Tên của bạn: <strong>${this.humanPlayer.name}</strong> (Ghế #${this.humanPlayer.id}).<br/>`;
        if (this.humanPlayer.role === 'werewolf') {
            const otherWolves = this.players.filter(p => p.role === 'werewolf' && !p.isHuman);
            if (otherWolves.length > 0) {
                extraInfo += `Đồng bọn Sói của bạn: <strong style="color:#ff7b72">${otherWolves.map(w => w.name).join(', ')}</strong>.`;
            } else {
                extraInfo += `<span style="color:#ff7b72">Bạn là con Ma Sói duy nhất trên sới này!</span>`;
            }
        }
        document.getElementById('modal-role-extra').innerHTML = extraInfo;
        this.dom.roleModal.classList.add('active');
    }

    /* =========================================================================
     * RENDER BÀN CHƠI (TRONG TRẬN ẨN ROLE NGƯỜI CHẾT - CUỐI TRẬN LẬT HẾT)
     * ========================================================================= */
    renderPlayers() {
        this.dom.playersGrid.innerHTML = '';
        this.players.forEach(p => {
            const card = document.createElement('div');
            const isVoteSelected = (this.phase === 'DAY_VOTE' && this.selectedHumanVoteTarget === p.name);
            card.className = `player-card ${p.isHuman ? 'is-you' : ''} ${!p.isAlive && this.phase !== 'POST_GAME_CHAT' ? 'is-dead' : ''} ${isVoteSelected ? 'is-vote-selected' : ''}`;
            card.id = `player-card-${p.id}`;

            let roleHtml = `<div class="player-role-badge">${p.isAlive ? '❓ Ẩn vai' : '🔒 Đã chết (Ẩn vai)'}</div>`;
            if (p.isHuman || this.godMode) {
                const def = ROLE_DEFINITIONS[p.role];
                roleHtml = `<div class="player-role-badge role-${p.role}">${def.icon} ${def.name}</div>`;
            }

            const statusText = p.isAlive
                ? 'Sống'
                : (this.godMode && p.internalDeathCause ? p.internalDeathCause : `Tử nạn (R${p.deathRound})`);
            const statusClass = p.isAlive ? 'status-alive' : 'status-dead';
            const deductionCount = p.vault.deductionJournal.length;
            const shortModel = p.isHuman ? 'Human' : p.assignedModel.split('/').pop();

            card.innerHTML = `
                <div class="player-avatar-wrap">
                    ${getAvatarSvg(p.avatarIndex, !p.isAlive)}
                    <span class="seat-badge">#${p.id}</span>
                </div>
                <div class="player-name">
                    ${p.name}
                    ${p.isHuman ? '<span class="you-tag">BẠN</span>' : ''}
                </div>
                ${roleHtml}
                <div style="font-size:10.5px; color:#f0883e; font-weight:600; margin-bottom:3px; text-align:center;">
                    ${p.personaCore.title}
                </div>
                <div class="player-status-badge ${statusClass}">${statusText}</div>
                <div class="vault-count-badge" title="Model riêng & số suy luận trong Lõi Kho">
                    🤖 ${shortModel} • 🗄️ ${deductionCount}
                </div>
                ${p.votesAgainst > 0 ? `<div class="vote-bubble">${p.votesAgainst}</div>` : ''}
            `;

            card.onclick = () => this.handlePlayerCardClick(p);
            this.dom.playersGrid.appendChild(card);
        });
        this.updateAliveCountHeader();
    }

    highlightSpeaker(playerId) {
        document.querySelectorAll('.player-card').forEach(c => c.classList.remove('is-speaking'));
        if (playerId) {
            const el = document.getElementById(`player-card-${playerId}`);
            if (el) el.classList.add('is-speaking');
        }
    }

    setPhaseBanner(tagText, tagClass, instructionText, turnText = null) {
        this.dom.phaseTag.className = `phase-tag ${tagClass}`;
        this.dom.phaseTag.textContent = tagText;
        this.dom.phaseInstruction.textContent = instructionText;
        if (turnText) {
            this.dom.turnCounterPill.style.display = 'inline-block';
            this.dom.turnCounterPill.textContent = turnText;
        } else {
            this.dom.turnCounterPill.style.display = 'none';
        }
    }

    addSystemMessage(text, isNightKill = false, recordToPublicVault = true) {
        const item = document.createElement('div');
        item.className = 'message-item';
        item.innerHTML = `
            <div class="msg-content system-msg ${isNightKill ? 'night-kill' : ''}">
                ${text}
            </div>
        `;
        this.dom.feedMessages.appendChild(item);
        this.dom.feedMessages.scrollTop = this.dom.feedMessages.scrollHeight;

        if (recordToPublicVault) {
            const plain = text.replace(/<[^>]*>/g, '');
            this.sharedPublicLogs.push(`[Sự kiện bàn]: ${plain}`);
        }
    }

    addChatMessage(player, speech, deduction = null, intentBadgeHtml = '', logPrefix = '', modelUsed = '') {
        soundManager.playSpeechPop();
        const item = document.createElement('div');
        item.className = 'message-item';

        const showDeduction = deduction && (player.isHuman || this.godMode);
        const thoughtHtml = showDeduction ? `
            <div class="msg-thought">
                🗄️ <strong>Lõi Kho ghi nhận:</strong> <em>${deduction}</em>
            </div>
        ` : '';

        const modelTag = (!player.isHuman && modelUsed)
            ? `<span style="font-size:10px; color:#7ee787; background:rgba(35,134,54,0.15); padding:1px 6px; border-radius:8px;">${modelUsed.split('/').pop()}</span>`
            : '';

        // Nếu đang ở chế độ Hậu trường sau trận, hiện thêm Role thật bên cạnh tên người nói
        const roleTag = this.godMode
            ? `<span class="player-role-badge role-${player.role}" style="margin-bottom:0; font-size:10px; padding:1px 6px;">${ROLE_DEFINITIONS[player.role].icon} ${ROLE_DEFINITIONS[player.role].name}</span>`
            : '';

        item.innerHTML = `
            <div class="msg-avatar">${getAvatarSvg(player.avatarIndex, !player.isAlive)}</div>
            <div class="msg-content">
                <div class="msg-header">
                    <span class="msg-speaker" style="color: ${player.isHuman ? '#58a6ff' : '#e6edf3'}">${player.name}</span>
                    ${roleTag}
                    <span style="font-size:10.5px; color:#f0883e;">(${player.personaCore.title})</span>
                    ${modelTag}
                    ${intentBadgeHtml}
                    <span class="msg-time">${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                </div>
                <div class="msg-speech">${speech}</div>
                ${thoughtHtml}
            </div>
        `;

        this.dom.feedMessages.appendChild(item);
        this.dom.feedMessages.scrollTop = this.dom.feedMessages.scrollHeight;

        const prefix = logPrefix || `[Ngày ${this.round}]`;
        this.sharedPublicLogs.push(`${prefix} ${player.name}: "${speech}"`);
        this.renderPlayers();
    }

    clearFeed() {
        this.dom.feedMessages.innerHTML = '';
    }

    /* =========================================================================
     * PHA BAN ĐÊM
     * ========================================================================= */
    async startNightPhase() {
        this.phase = 'NIGHT';
        this.dom.body.className = 'night-mode';
        soundManager.playBell();
        this.setPhaseBanner('🌙 Ban Đêm', 'night', `Đêm thứ ${this.round}. Cả sới nhắm mắt, các vai chức năng hành động...`);
        this.addSystemMessage(`═══════ ĐÊM THỨ ${this.round} BUÔNG XUỐNG ═══════`, false, true);

        this.players.forEach(p => p.votesAgainst = 0);
        this.nightAction.protectedTarget = null;
        this.nightAction.werewolfTargets = [];
        this.nightAction.witchSavedTarget = null;
        this.nightAction.witchPoisonTarget = null;
        this.renderPlayers();

        await this.stepBodyguard();
        await this.stepWerewolves();
        await this.stepWitch();
        await this.resolveNightAndDawn();
    }

    async stepBodyguard() {
        const bodyguards = this.players.filter(p => p.role === 'bodyguard' && p.isAlive);
        for (const bg of bodyguards) {
            if (bg.isHuman) {
                const target = await this.promptNightTargetSelection(
                    '🛡️ Lượt Bảo Vệ Của Mày',
                    `Đêm trước mày đã bảo vệ: <strong>${this.nightAction.lastProtectedTarget || 'Chưa có'}</strong>.<br>Chọn 1 người để canh gác đêm nay (không trùng đêm trước):`,
                    this.players.filter(p => p.isAlive && p.name !== this.nightAction.lastProtectedTarget)
                );
                this.nightAction.protectedTarget = target;
                this.nightAction.lastProtectedTarget = target;
                bg.vault.addPrivateLog(this.round, `Đã bảo vệ [${target}].`);
                bg.vault.commitDeduction(this.round, `Đêm ${this.round} - Bảo Vệ`, `Canh gác cho ${target}.`, 'Human');
            } else {
                try {
                    const res = await aiBrain.generateBodyguardAction(bg, this, this.nightAction.lastProtectedTarget);
                    this.nightAction.protectedTarget = res.target;
                    this.nightAction.lastProtectedTarget = res.target;
                    this.updateActiveModelBadge(res.model_used, bg.name);
                } catch (e) {
                    const valid = this.players.filter(p => p.isAlive && p.name !== this.nightAction.lastProtectedTarget);
                    if (valid.length > 0) {
                        const fallback = valid[Math.floor(Math.random() * valid.length)].name;
                        this.nightAction.protectedTarget = fallback;
                        this.nightAction.lastProtectedTarget = fallback;
                    }
                }
            }
        }
    }

    async stepWerewolves() {
        soundManager.playWolfHowl();
        const wolves = this.players.filter(p => p.role === 'werewolf' && p.isAlive);
        this.nightAction.werewolfTargets = [];

        for (const wolf of wolves) {
            const potentialVictims = this.players.filter(p => p.isAlive && p.role !== 'werewolf');
            if (potentialVictims.length === 0) break;

            if (wolf.isHuman) {
                const target = await this.promptNightTargetSelection(
                    '🐺 Lượt Săn Mồi Của Ma Sói',
                    `Mỗi Ma Sói được cắn 1 người mỗi đêm. Chọn con mồi mày muốn cắn đứt cổ đêm nay:`,
                    potentialVictims
                );
                if (target && !this.nightAction.werewolfTargets.includes(target)) {
                    this.nightAction.werewolfTargets.push(target);
                }
                wolf.vault.addPrivateLog(this.round, `Đã cắn [${target}].`);
                wolf.vault.commitDeduction(this.round, `Đêm ${this.round} - Sói Cắn`, `Cắn ${target}.`, 'Human');
            } else {
                try {
                    const res = await aiBrain.generateWerewolfNightAction(wolf, this);
                    this.updateActiveModelBadge(res.model_used, wolf.name);
                    if (res.target && !this.nightAction.werewolfTargets.includes(res.target)) {
                        this.nightAction.werewolfTargets.push(res.target);
                    }
                } catch (e) {
                    const fallback = potentialVictims[Math.floor(Math.random() * potentialVictims.length)].name;
                    if (!this.nightAction.werewolfTargets.includes(fallback)) {
                        this.nightAction.werewolfTargets.push(fallback);
                    }
                }
            }
        }
    }

    async stepWitch() {
        const witches = this.players.filter(p => p.role === 'witch' && p.isAlive);
        for (const witch of witches) {
            const bittenNames = [...this.nightAction.werewolfTargets];

            if (witch.isHuman) {
                await this.promptWitchNightModal(witch, bittenNames);
            } else {
                try {
                    const res = await aiBrain.generateWitchAction(
                        witch,
                        this,
                        bittenNames,
                        this.nightAction.witchHasSave,
                        this.nightAction.witchHasPoison
                    );
                    this.updateActiveModelBadge(res.model_used, witch.name);

                    if (res.use_save && this.nightAction.witchHasSave && res.save_target) {
                        this.nightAction.witchSavedTarget = res.save_target;
                        this.nightAction.witchHasSave = false;
                    }
                    if (res.use_poison && this.nightAction.witchHasPoison && res.poison_target) {
                        this.nightAction.witchPoisonTarget = res.poison_target;
                        this.nightAction.witchHasPoison = false;
                    }
                } catch (e) {
                    console.error('Lỗi AI Phù Thủy:', e);
                }
            }
        }
    }

    promptWitchNightModal(witchPlayer, bittenNames) {
        return new Promise(resolve => {
            this.dom.nightActionTitle.textContent = '🧙‍♀️ Lượt Phù Thủy Hành Động Trong Đêm';

            let selectedSave = null;
            let selectedPoison = null;

            const renderModalContent = () => {
                const bittenText = bittenNames.length > 0
                    ? `Đêm nay <strong style="color:#ff7b72">${bittenNames.join(', ')}</strong> đang bị Ma Sói cắn!`
                    : `Đêm nay không có ai bị Ma Sói cắn.`;

                let saveSectionHtml = '';
                if (this.nightAction.witchHasSave) {
                    if (bittenNames.length > 0) {
                        const btns = bittenNames.map(name => `
                            <button type="button" class="target-btn ${selectedSave === name ? 'selected-save' : ''}" data-save="${name}">
                                💚 Cứu sống ${name} ${selectedSave === name ? '(Đã chọn)' : ''}
                            </button>
                        `).join('');
                        saveSectionHtml = `<div class="target-picker">${btns}</div>`;
                    } else {
                        saveSectionHtml = `<p style="font-size:12px; color:#8b949e; margin-top:4px;">Không có nạn nhân để cứu.</p>`;
                    }
                } else {
                    saveSectionHtml = `<p style="font-size:12px; color:#8b949e; margin-top:4px;">Đã dùng hết Bình Cứu.</p>`;
                }

                let poisonSectionHtml = '';
                if (this.nightAction.witchHasPoison) {
                    const aliveTargets = this.players.filter(p => p.isAlive && p.id !== witchPlayer.id);
                    const btns = aliveTargets.map(p => `
                        <button type="button" class="target-btn ${selectedPoison === p.name ? 'selected' : ''}" data-poison="${p.name}">
                            💀 Quăng độc giết ${p.name} ${selectedPoison === p.name ? '(Đã chọn)' : ''}
                        </button>
                    `).join('');
                    poisonSectionHtml = `<div class="target-picker">${btns}</div>`;
                } else {
                    poisonSectionHtml = `<p style="font-size:12px; color:#8b949e; margin-top:4px;">Đã dùng hết Bình Giết.</p>`;
                }

                this.dom.nightActionBody.innerHTML = `
                    <p style="font-size:13.5px; margin-bottom:10px; color:#e6edf3;">${bittenText}</p>
                    <p style="font-size:12px; color:#8b949e; margin-bottom:12px;">
                        Có thể chọn dùng <strong>Bình Cứu</strong>, <strong>Bình Giết</strong>, bật chọn <strong>CẢ HAI BÌNH trong cùng đêm nay</strong>, hoặc chọn <strong>Không hành động</strong>.
                    </p>

                    <div style="background:#0d1117; border:1px solid var(--border-color); padding:12px; border-radius:10px; margin-bottom:12px;">
                        <div style="font-size:13px; font-weight:700; color:#7ee787;">
                            1. Bình Cứu (${this.nightAction.witchHasSave ? 'Còn 1 bình' : 'Đã hết'})
                        </div>
                        ${saveSectionHtml}
                    </div>

                    <div style="background:#0d1117; border:1px solid var(--border-color); padding:12px; border-radius:10px; margin-bottom:14px;">
                        <div style="font-size:13px; font-weight:700; color:#d2a8ff;">
                            2. Bình Giết / Độc (${this.nightAction.witchHasPoison ? 'Còn 1 bình' : 'Đã hết'})
                        </div>
                        ${poisonSectionHtml}
                    </div>

                    <div style="display:flex; gap:10px;">
                        <button type="button" id="btn-witch-confirm" class="btn-send" style="flex:1; padding:11px;">
                            ✨ Xác Nhận Hành Động (${selectedSave || selectedPoison ? 'Có dùng thuốc' : 'Không dùng thuốc'})
                        </button>
                        <button type="button" id="btn-witch-no-action" class="btn-skip" style="padding:11px 16px;">
                            🌙 Không hành động
                        </button>
                    </div>
                `;

                this.dom.nightActionBody.querySelectorAll('[data-save]').forEach(btn => {
                    btn.onclick = () => {
                        const name = btn.getAttribute('data-save');
                        selectedSave = (selectedSave === name) ? null : name;
                        renderModalContent();
                    };
                });

                this.dom.nightActionBody.querySelectorAll('[data-poison]').forEach(btn => {
                    btn.onclick = () => {
                        const name = btn.getAttribute('data-poison');
                        selectedPoison = (selectedPoison === name) ? null : name;
                        renderModalContent();
                    };
                });

                document.getElementById('btn-witch-confirm').onclick = () => {
                    if (selectedSave && this.nightAction.witchHasSave) {
                        this.nightAction.witchSavedTarget = selectedSave;
                        this.nightAction.witchHasSave = false;
                    }
                    if (selectedPoison && this.nightAction.witchHasPoison) {
                        this.nightAction.witchPoisonTarget = selectedPoison;
                        this.nightAction.witchHasPoison = false;
                    }
                    witchPlayer.vault.addPrivateLog(
                        this.round,
                        `Thấy [${bittenNames.join(', ') || 'không ai'}] bị cắn. Đã chọn: ${selectedSave ? `Cứu ${selectedSave}` : 'Không cứu'}, ${selectedPoison ? `Giết ${selectedPoison}` : 'Không giết'}.`
                    );
                    this.dom.nightActionModal.classList.remove('active');
                    resolve();
                };

                document.getElementById('btn-witch-no-action').onclick = () => {
                    witchPlayer.vault.addPrivateLog(
                        this.round,
                        `Thấy [${bittenNames.join(', ') || 'không ai'}] bị cắn. Đã chọn: Không hành động.`
                    );
                    this.dom.nightActionModal.classList.remove('active');
                    resolve();
                };
            };

            renderModalContent();
            this.dom.nightActionModal.classList.add('active');
        });
    }

    promptNightTargetSelection(title, instruction, availablePlayers) {
        return new Promise(resolve => {
            this.dom.nightActionTitle.textContent = title;
            this.dom.nightActionBody.innerHTML = `
                <p style="font-size:13.5px; margin-bottom:12px; color:#c9d1d9; line-height:1.5;">${instruction}</p>
                <div class="target-picker" id="night-targets"></div>
            `;

            const container = document.getElementById('night-targets');
            availablePlayers.forEach(p => {
                const btn = document.createElement('button');
                btn.className = 'target-btn';
                btn.innerHTML = `🎯 ${p.name}`;
                btn.onclick = () => {
                    this.dom.nightActionModal.classList.remove('active');
                    resolve(p.name);
                };
                container.appendChild(btn);
            });

            this.dom.nightActionModal.classList.add('active');
        });
    }

    /* =========================================================================
     * BÌNH MINH & TỔNG KẾT ĐÊM
     * ========================================================================= */
    async resolveNightAndDawn() {
        this.phase = 'DAWN';
        this.dom.body.className = 'day-mode';
        soundManager.playDawn();

        const deadTonight = [];

        for (const targetName of this.nightAction.werewolfTargets) {
            const victim = this.players.find(p => p.name === targetName && p.isAlive);
            const isProtected = (this.nightAction.protectedTarget === targetName);
            const isSaved = (this.nightAction.witchSavedTarget === targetName);

            if (victim && !isProtected && !isSaved) {
                victim.isAlive = false;
                victim.deathRound = this.round;
                victim.deathReason = 'Tử nạn trong đêm';
                victim.internalDeathCause = 'Bị Ma Sói cắn đêm ' + this.round;
                deadTonight.push(victim);
            }
        }

        if (this.nightAction.witchPoisonTarget) {
            const poisoned = this.players.find(p => p.name === this.nightAction.witchPoisonTarget && p.isAlive);
            if (poisoned) {
                poisoned.isAlive = false;
                poisoned.deathRound = this.round;
                poisoned.deathReason = 'Tử nạn trong đêm';
                poisoned.internalDeathCause = 'Bị Phù Thủy quăng độc đêm ' + this.round;
                deadTonight.push(poisoned);
            }
        }

        this.renderPlayers();
        this.setPhaseBanner('☀️ Bình Minh', 'day', `Ngày thứ ${this.round}. Cả sới mở mắt...`);
        this.addSystemMessage(`═══════ BÌNH MINH NGÀY THỨ ${this.round} ═══════`, false, true);

        if (deadTonight.length === 0) {
            soundManager.playBell();
            this.morningReport = `Đêm thứ ${this.round} không có ai chết (Bảo Vệ đã canh gác trúng hoặc Phù Thủy đã cứu)!`;
            this.addSystemMessage(`✨ ${this.morningReport}`, false, true);
        } else {
            soundManager.playDrumHit();
            const names = deadTonight.map(d => `<strong>${d.name}</strong>`).join(', ');
            this.morningReport = `Đêm thứ ${this.round} đẫm máu! Xác của ${names} nằm giữa làng (Ẩn vai trò).`;
            this.addSystemMessage(`💀 ${this.morningReport}`, true, true);
        }

        if (this.checkWinCondition()) return;

        await new Promise(r => setTimeout(r, 1800));
        await this.startDayDiscussion();
    }

    /* =========================================================================
     * ĐẤU KHẨU BAN NGÀY (TỐI ĐA 5 TURN)
     * ========================================================================= */
    async startDayDiscussion() {
        this.phase = 'DAY_DISCUSS';
        this.addSystemMessage(
            `🔥 Bắt đầu phiên Đấu Khẩu Ngày ${this.round} (Tối đa ${this.maxDiscussionTurns} Turn. Chỉ dừng sớm khi không còn ai chọn "Trò chuyện tiếp").`,
            false,
            true
        );

        for (let turn = 1; turn <= this.maxDiscussionTurns; turn++) {
            const alivePlayers = this.players.filter(p => p.isAlive);
            let continueChatVotes = 0;

            this.setPhaseBanner(
                '🔥 Đấu Khẩu',
                'day',
                `Ngày ${this.round} — Đang cãi nhau ở Turn ${turn}/${this.maxDiscussionTurns}.`,
                `Turn ${turn}/${this.maxDiscussionTurns}`
            );
            this.addSystemMessage(`--- 💥 HIỆP ĐẤU KHẨU TURN ${turn}/${this.maxDiscussionTurns} ---`, false, true);

            for (const player of alivePlayers) {
                if (!player.isAlive) continue;
                this.highlightSpeaker(player.id);

                if (player.isHuman) {
                    const humanChoice = await this.waitForHumanDiscussionTurn(turn);
                    if (humanChoice.continueChat) continueChatVotes++;
                } else {
                    const aiChoice = await this.aiDiscussionTurn(player, turn);
                    if (aiChoice.continueChat) continueChatVotes++;
                }

                this.renderPlayers();
                await new Promise(r => setTimeout(r, 800));
            }

            this.highlightSpeaker(null);

            if (continueChatVotes === 0) {
                this.addSystemMessage(
                    `✅ Hết Turn ${turn}: Không còn đứa nào chọn "Trò chuyện tiếp" (0/${alivePlayers.length}). Chốt hạ chuyển sang Bỏ Phiếu Treo Cổ!`,
                    false,
                    true
                );
                break;
            } else if (turn === this.maxDiscussionTurns) {
                this.addSystemMessage(
                    `⏰ Đã cãi nhau hết tối đa ${this.maxDiscussionTurns}/${this.maxDiscussionTurns} Turn! Tự động khóa mõm chuyển sang Bỏ Phiếu Treo Cổ.`,
                    false,
                    true
                );
                break;
            } else {
                this.addSystemMessage(
                    `📊 Hết Turn ${turn}/${this.maxDiscussionTurns}: Vẫn còn ${continueChatVotes}/${alivePlayers.length} người muốn "Trò chuyện tiếp" ➡️ Chiến tiếp Turn ${turn + 1}!`,
                    false,
                    true
                );
                await new Promise(r => setTimeout(r, 1000));
            }
        }

        await new Promise(r => setTimeout(r, 1000));
        await this.startDayVoting();
    }

    async aiDiscussionTurn(bot, turn) {
        try {
            const res = await aiBrain.generateDaySpeech(bot, this, turn, this.maxDiscussionTurns);
            this.updateActiveModelBadge(res.model_used, bot.name);

            const intentBadge = res.continue_chat
                ? `<span class="chat-intent-badge continue">💬 Trò chuyện tiếp</span>`
                : `<span class="chat-intent-badge stop">🗳️ Đòi Vote ngay</span>`;

            this.addChatMessage(
                bot,
                res.speech,
                res.deduction,
                intentBadge,
                `[Ngày ${this.round} - Turn ${turn}]`,
                res.model_used
            );

            return { continueChat: res.continue_chat };
        } catch (e) {
            console.error('Lỗi AI thảo luận:', e);
            const fallbackContinue = (turn < 2);
            this.addChatMessage(
                bot,
                'Đứa nào có tật giật mình thì tự khai ra đi, đừng để tao phải điểm mặt chỉ tên!',
                'Lỗi kết nối tạm thời',
                `<span class="chat-intent-badge stop">🗳️ Đòi Vote ngay</span>`,
                `[Ngày ${this.round} - Turn ${turn}]`,
                bot.assignedModel
            );
            return { continueChat: fallbackContinue };
        }
    }

    waitForHumanDiscussionTurn(turn) {
        return new Promise(resolve => {
            this.dom.dockTitle.textContent = `🎙️ Lượt của mày (${this.humanPlayer.name}) — Turn ${turn}/${this.maxDiscussionTurns}:`;
            this.dom.dockInput.disabled = false;
            this.dom.dockInput.placeholder = 'Nhập câu chửi / chất vấn / phản biện của mày tại đây...';
            this.dom.dockInput.value = '';
            this.dom.dockInput.focus();

            this.dom.btnSend.disabled = false;
            this.dom.btnSend.textContent = '💬 Phát biểu & Trò chuyện tiếp';

            this.dom.btnStopChat.style.display = 'inline-block';
            this.dom.btnStopChat.disabled = false;
            this.dom.btnStopChat.textContent = '🗳️ Phát biểu & Đòi Vote ngay';

            this.dom.btnSkip.disabled = false;
            this.dom.btnSkip.textContent = 'Bỏ qua (Đòi Vote)';

            this.dom.quickReplies.innerHTML = `
                <span class="quick-reply-chip" onclick="window.game.fillReply('Mày bớt xạo ke đi, lý luận vòng vo thế này lòi đuôi Sói rồi con ạ!')">Chửi xạo ke lộ đuôi Sói</span>
                <span class="quick-reply-chip" onclick="window.game.fillReply('Tao là Dân cứng đây, thằng nào dám chụp mũ tao bước ra đây đối chất!')">Khẳng định Dân cứng</span>
                <span class="quick-reply-chip" onclick="window.game.fillReply('Mấy đứa im im núp lùm từ nãy giờ mở mồm ra xem nào, định trốn đến bao giờ?')">Khích mấy đứa núp lùm</span>
                <span class="quick-reply-chip" onclick="window.game.fillReply('Đứa nào lươn lẹo tao ghim hết rồi, mở hòm phiếu treo cổ nó luôn đi!')">Đòi mở hòm phiếu</span>
            `;

            const finishHumanTurn = (speechText, continueChat) => {
                this.dom.dockInput.disabled = true;
                this.dom.btnSend.disabled = true;
                this.dom.btnStopChat.disabled = true;
                this.dom.btnStopChat.style.display = 'none';
                this.dom.btnSkip.disabled = true;
                this.dom.quickReplies.innerHTML = '';
                this.dom.dockTitle.textContent = '⏳ Đang nghe tụi kia đấu khẩu...';

                const badge = continueChat
                    ? `<span class="chat-intent-badge continue">💬 Trò chuyện tiếp</span>`
                    : `<span class="chat-intent-badge stop">🗳️ Đòi Vote ngay</span>`;

                this.humanPlayer.vault.commitDeduction(
                    this.round,
                    `Ngày ${this.round} - Turn ${turn}`,
                    `Phát biểu: "${speechText}" (${continueChat ? 'Trò chuyện tiếp' : 'Đòi Vote'})`,
                    'Human'
                );

                this.addChatMessage(
                    this.humanPlayer,
                    speechText,
                    null,
                    badge,
                    `[Ngày ${this.round} - Turn ${turn}]`
                );

                resolve({ continueChat });
            };

            this.dom.btnSend.onclick = () => {
                const text = this.dom.dockInput.value.trim() || 'Mấy đứa nói tiếp đi xem đứa nào lòi cái đuôi Sói ra!';
                finishHumanTurn(text, true);
            };

            this.dom.btnStopChat.onclick = () => {
                const text = this.dom.dockInput.value.trim() || 'Khỏi nói nhiều nữa, mở hòm phiếu treo cổ luôn đi!';
                finishHumanTurn(text, false);
            };

            this.dom.btnSkip.onclick = () => {
                finishHumanTurn('Tao đéo nói nhiều, vào vote luôn đi!', false);
            };

            this.dom.dockInput.onkeydown = (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    this.dom.btnSend.click();
                }
            };
        });
    }

    fillReply(text) {
        this.dom.dockInput.value = text;
        this.dom.dockInput.focus();
    }

    /* =========================================================================
     * BỎ PHIẾU KÈM LÝ DO ĐANH THÉP
     * ========================================================================= */
    async startDayVoting() {
        this.phase = 'DAY_VOTE';
        soundManager.playHeartbeat();
        this.setPhaseBanner(
            '🗳️ Bỏ Phiếu & Chốt Lý Do',
            'day',
            'Chỉ tay chọn kẻ lên giàn treo cổ kèm LÝ DO VOTE để cả bàn đọc và phán xét.'
        );
        this.addSystemMessage(`⚖️ MỞ HÒM PHIẾU PHÁN QUYẾT NGÀY ${this.round}...`, false, true);

        this.votes = {};
        this.players.forEach(p => p.votesAgainst = 0);
        this.selectedHumanVoteTarget = null;
        this.renderPlayers();

        const alivePlayers = this.players.filter(p => p.isAlive);

        for (const voter of alivePlayers) {
            if (!voter.isAlive) continue;
            this.highlightSpeaker(voter.id);

            if (voter.isHuman) {
                await this.waitForHumanVoteWithReason();
            } else {
                await this.aiVoteWithReason(voter);
            }

            this.renderPlayers();
            await new Promise(r => setTimeout(r, 850));
        }

        this.highlightSpeaker(null);
        await this.resolveVotingResults();
    }

    async aiVoteWithReason(bot) {
        try {
            const res = await aiBrain.generateVote(bot, this);
            this.updateActiveModelBadge(res.model_used, bot.name);

            const target = res.vote_target;
            this.votes[bot.id] = target;

            if (target && target !== 'skip') {
                const victim = this.players.find(p => p.name === target && p.isAlive);
                if (victim) {
                    victim.votesAgainst++;
                    soundManager.playVoteClick();
                }
            }

            const voteLabel = (target === 'skip') ? 'Bỏ phiếu trắng (Skip)' : `Vote treo cổ [${target}]`;
            const badge = `<span class="chat-intent-badge stop">🗳️ ${voteLabel}</span>`;

            this.addChatMessage(
                bot,
                `Lý do vote: "${res.reason}"`,
                res.deduction,
                badge,
                `[Ngày ${this.round} - Bỏ Phiếu (${voteLabel})]`,
                res.model_used
            );
        } catch (e) {
            console.error('Lỗi AI vote:', e);
            this.votes[bot.id] = 'skip';
            this.addChatMessage(
                bot,
                'Turn này tao tạm skip, nhưng tao đang nhìn chằm chằm tụi mày đấy!',
                null,
                `<span class="chat-intent-badge stop">🗳️ Skip</span>`,
                `[Ngày ${this.round} - Bỏ Phiếu]`,
                bot.assignedModel
            );
        }
    }

    waitForHumanVoteWithReason() {
        return new Promise(resolve => {
            this.selectedHumanVoteTarget = 'skip';
            this.renderPlayers();

            const updateDockVoteStatus = () => {
                const targetDisplay = (this.selectedHumanVoteTarget === 'skip')
                    ? '🏳️ Bỏ Phiếu Trắng (Skip)'
                    : `🎯 Treo cổ [${this.selectedHumanVoteTarget}]`;
                this.dom.dockTitle.innerHTML = `🗳️ Lượt Mày Vote — Đang chỉ tay vào: <strong style="color:#ff7b72">${targetDisplay}</strong> (Click thẻ người chơi trên bàn để chọn mục tiêu)`;
            };

            updateDockVoteStatus();

            this.dom.dockInput.disabled = false;
            this.dom.dockInput.value = '';
            this.dom.dockInput.placeholder = 'Nhập lý do mày vote nó (để lũ AI đọc vào Kho và suy luận)...';
            this.dom.dockInput.focus();

            this.dom.btnSend.disabled = false;
            this.dom.btnSend.textContent = '⚖️ Chốt Vote & Nêu Lý Do';

            this.dom.btnStopChat.style.display = 'none';

            this.dom.btnSkip.disabled = false;
            this.dom.btnSkip.textContent = '🏳️ Chọn Bỏ Phiếu Trắng';

            this.dom.quickReplies.innerHTML = `
                <span class="quick-reply-chip" onclick="window.game.fillReply('Thằng này nãy giờ nói năng lươn lẹo, trước sau bất nhất, chắc chắn 100% là Sói!')">Nói năng lươn lẹo</span>
                <span class="quick-reply-chip" onclick="window.game.fillReply('Cố tình chụp mũ và dồn phiếu bừa bãi để cứu bầy Sói.')">Chụp mũ vô căn cứ</span>
                <span class="quick-reply-chip" onclick="window.game.fillReply('Im im núp lùm né đạn từ đầu buổi, kiểu gì cũng có mùi mờ ám.')">Im im núp lùm</span>
                <span class="quick-reply-chip" onclick="window.game.fillReply('Chưa đủ bằng chứng nên tao tạm skip, tránh treo nhầm Dân.')">Skip tránh giết nhầm</span>
            `;

            this.onHumanSelectCardDuringVote = (player) => {
                if (!player.isAlive || player.id === this.humanPlayer.id) return;
                this.selectedHumanVoteTarget = player.name;
                soundManager.playVoteClick();
                this.renderPlayers();
                updateDockVoteStatus();
                this.dom.dockInput.focus();
            };

            this.dom.btnSkip.onclick = () => {
                this.selectedHumanVoteTarget = 'skip';
                this.renderPlayers();
                updateDockVoteStatus();
                if (!this.dom.dockInput.value.trim()) {
                    this.dom.dockInput.value = 'Chưa thấy thằng nào lộ hẳn nên tao tạm skip turn này.';
                }
            };

            const confirmVote = () => {
                const target = this.selectedHumanVoteTarget || 'skip';
                let reason = this.dom.dockInput.value.trim();
                if (!reason) {
                    reason = (target === 'skip')
                        ? 'Chưa chắc chắn nên tao bỏ phiếu trắng.'
                        : `Tao vote thẳng mặt ${target} vì nãy giờ mày khả nghi nhất bàn!`;
                }

                this.votes[this.humanPlayer.id] = target;
                if (target !== 'skip') {
                    const victim = this.players.find(p => p.name === target && p.isAlive);
                    if (victim) {
                        victim.votesAgainst++;
                        soundManager.playVoteClick();
                    }
                }

                this.onHumanSelectCardDuringVote = null;
                this.selectedHumanVoteTarget = null;
                this.dom.dockInput.disabled = true;
                this.dom.btnSend.disabled = true;
                this.dom.btnSkip.disabled = true;
                this.dom.quickReplies.innerHTML = '';
                this.dom.dockTitle.textContent = '⏳ Đang kiểm phiếu...';

                const voteLabel = (target === 'skip') ? 'Bỏ phiếu trắng (Skip)' : `Vote treo cổ [${target}]`;
                const badge = `<span class="chat-intent-badge stop">🗳️ ${voteLabel}</span>`;

                this.humanPlayer.vault.commitDeduction(
                    this.round,
                    `Ngày ${this.round} - Bỏ Phiếu`,
                    `Đã chọn [${voteLabel}] với lý do: "${reason}"`,
                    'Human'
                );

                this.addChatMessage(
                    this.humanPlayer,
                    `Lý do vote: "${reason}"`,
                    null,
                    badge,
                    `[Ngày ${this.round} - Bỏ Phiếu (${voteLabel})]`
                );

                resolve();
            };

            this.dom.btnSend.onclick = confirmVote;
            this.dom.dockInput.onkeydown = (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    confirmVote();
                }
            };
        });
    }

    handlePlayerCardClick(player) {
        if (this.phase === 'DAY_VOTE' && this.onHumanSelectCardDuringVote) {
            this.onHumanSelectCardDuringVote(player);
        } else {
            this.selectedVaultPlayerId = player.id;
            this.openVaultInspector();
        }
    }

    async resolveVotingResults() {
        let maxVotes = 0;
        let candidate = null;
        let isTie = false;

        const alive = this.players.filter(p => p.isAlive);
        for (const p of alive) {
            if (p.votesAgainst > maxVotes) {
                maxVotes = p.votesAgainst;
                candidate = p;
                isTie = false;
            } else if (p.votesAgainst === maxVotes && maxVotes > 0) {
                isTie = true;
            }
        }

        if (maxVotes === 0 || isTie || !candidate) {
            soundManager.playBell();
            this.addSystemMessage(
                `⚖️ Kết quả bỏ phiếu: Hòa phiếu hoặc đa số Skip! Không đứa nào bị treo cổ trong ngày ${this.round}.`,
                false,
                true
            );
        } else {
            soundManager.playDrumHit();
            this.addSystemMessage(
                `🔥 [${candidate.name}] lĩnh đủ ${maxVotes} phiếu và bị lôi lên giàn treo cổ (Ẩn vai trò)!`,
                true,
                true
            );

            if (candidate.isHuman) {
                this.addChatMessage(candidate, 'Lũ ngu chúng mày bị Sói dắt mũi rồi!', null, '', `[Lời trăn trối]`);
            } else {
                try {
                    const lastWords = await aiBrain.generateLastWords(candidate, this);
                    this.addChatMessage(candidate, `💀 "${lastWords}"`, null, '', `[Lời trăn trối]`, candidate.assignedModel);
                } catch (e) {
                    this.addChatMessage(candidate, '💀 "Tụi mày cứ đợi đấy mà xem!"', null, '', `[Lời trăn trối]`);
                }
            }

            candidate.isAlive = false;
            candidate.deathRound = this.round;
            candidate.deathReason = `Bị treo cổ ngày ${this.round} (${maxVotes} phiếu)`;
            candidate.internalDeathCause = candidate.deathReason;
            this.renderPlayers();
        }

        if (this.checkWinCondition()) return;

        this.round++;
        await new Promise(r => setTimeout(r, 2500));
        await this.startNightPhase();
    }

    /* =========================================================================
     * KIỂM TRA THẮNG / THUA & PHÒNG CHAT HẬU TRƯỜNG SAU TRẬN (POST-GAME CHAT)
     * ========================================================================= */
    checkWinCondition() {
        const alive = this.players.filter(p => p.isAlive);
        const aliveWolves = alive.filter(p => p.role === 'werewolf');
        const aliveVillagers = alive.filter(p => p.role !== 'werewolf');

        if (aliveWolves.length === 0) {
            this.triggerGameOver('village');
            return true;
        }

        if (aliveWolves.length >= aliveVillagers.length) {
            this.triggerGameOver('werewolf');
            return true;
        }

        return false;
    }

    triggerGameOver(winnerTeam) {
        this.phase = 'GAME_OVER';
        this.lastWinnerTeam = winnerTeam;
        this.godMode = true;
        this.renderPlayers();
        soundManager.playDrumHit();

        const isWolfWin = (winnerTeam === 'werewolf');
        document.getElementById('game-over-icon').textContent = isWolfWin ? '🌕' : '🏆';
        document.getElementById('game-over-title').textContent = isWolfWin
            ? '🐺 PHE MA SÓI THỐNG TRỊ SỚI BẠC!'
            : '🎉 PHE DÂN LÀNG CHIẾN THẮNG!';
        document.getElementById('game-over-desc').textContent = isWolfWin
            ? 'Ma Sói đã lừa đẹp cả làng và làm thịt từng người một!'
            : 'Cả làng đã bóc phốt chuẩn xác và treo cổ sạch bầy Sói!';

        const tbody = document.getElementById('game-over-table-body');
        tbody.innerHTML = '';
        this.players.forEach(p => {
            const def = ROLE_DEFINITIONS[p.role];
            const row = document.createElement('tr');
            row.style.borderBottom = '1px solid var(--border-color)';
            row.innerHTML = `
                <td style="padding:8px;">
                    <strong>#${p.id} ${p.name}</strong> ${p.isHuman ? '<span class="you-tag">BẠN</span>' : ''}<br>
                    <span style="font-size:11px; color:#f0883e;">${p.personaCore.title}</span>
                </td>
                <td style="padding:8px;"><span class="player-role-badge role-${p.role}">${def.icon} ${def.name}</span></td>
                <td style="padding:8px; font-size:11.5px; color:#7ee787;">${p.assignedModel}</td>
                <td style="padding:8px; font-size:11.5px; color:var(--text-muted);">${p.internalDeathCause || p.deathReason || 'Sống sót'} (${p.vault.deductionJournal.length} suy luận)</td>
            `;
            tbody.appendChild(row);
        });

        this.dom.gameOverModal.classList.add('active');
    }

    /**
     * BẮT ĐẦU CHẾ ĐỘ TRÒ CHUYỆN SAU TRẬN ĐẤU (POST-GAME LOBBY CHAT)
     */
    async startPostGameChat() {
        this.phase = 'POST_GAME_CHAT';
        this.godMode = true;
        this.dom.body.className = 'day-mode';
        this.renderPlayers();

        const winBannerText = (this.lastWinnerTeam === 'werewolf')
            ? '🐺 PHE SÓI THẮNG — Toàn bộ bài đã lật ngửa! Cả người sống lẫn người chết đang xả giận & gáy bẩn!'
            : '🏆 PHE DÂN THẮNG — Toàn bộ bài đã lật ngửa! Cả người sống lẫn người chết đang xả giận & gáy bẩn!';

        this.setPhaseBanner('🍻 Hậu Trường Sau Trận', 'day', winBannerText, 'Lật Bài 100%');

        // Ghi bảng lật bài vào feed để người chơi nhìn rõ
        const roleSummary = this.players.map(p => {
            const def = ROLE_DEFINITIONS[p.role];
            return `<strong>${p.name}</strong>: ${def.icon} ${def.name}`;
        }).join(' • ');

        this.addSystemMessage(
            `🍻 <strong>PHÒNG CHAT HẬU TRƯỜNG ĐÃ MỞ!</strong><br>Chân tướng toàn bàn: ${roleSummary}`,
            false,
            true
        );

        // Kích hoạt thanh chat tự do cho người chơi ngay lập tức
        this.setupPostGameHumanDock();

        // Mở màn bằng 1 vòng phản ứng tự động từ các AI (Sói gáy / Dân chửi nhau)
        await this.runPostGameAIRound();
    }

    setupPostGameHumanDock() {
        this.dom.dockTitle.innerHTML = `🍻 <strong>Phòng Chat Sau Trận (${this.humanPlayer.name})</strong> — Gõ bất kỳ câu gì để gáy / chửi / hỏi tội tụi AI:`;
        this.dom.dockInput.disabled = false;
        this.dom.dockInput.value = '';
        this.dom.dockInput.placeholder = 'Gõ câu gáy bẩn hoặc réo tên đứa nào đó để chất vấn sau trận...';
        this.dom.dockInput.focus();

        this.dom.btnSend.disabled = false;
        this.dom.btnSend.textContent = '🗣️ Gửi & Nghe Tụi Nó Đáp Trả';

        this.dom.btnStopChat.style.display = 'inline-block';
        this.dom.btnStopChat.disabled = false;
        this.dom.btnStopChat.textContent = '🔥 Cho Cả Bàn Chửi Nhau Tiếp 1 Vòng';

        this.dom.btnSkip.disabled = false;
        this.dom.btnSkip.textContent = '🏆 Bảng Kết Quả';

        this.dom.quickReplies.innerHTML = `
            <span class="quick-reply-chip" onclick="window.game.fillReply('Haha mấy con gà bị tao lừa xoay như chong chóng từ đầu đến cuối nhé!')">Gáy khét lẹt</span>
            <span class="quick-reply-chip" onclick="window.game.fillReply('Thằng Phù Thủy bị ngáo à, sao đêm đấy lại đi quăng độc bóp đồng đội thế hả?!')">Chửi Phù Thủy bóp team</span>
            <span class="quick-reply-chip" onclick="window.game.fillReply('Tao đã chỉ mặt con Sói từ sớm mà chúng mày đéo nghe, lại đi treo cổ tao!')">Trách làng vote ngu</span>
            <span class="quick-reply-chip" onclick="window.game.fillReply('Cay vãi chưởng, đêm đầu tiên chưa kịp chơi đã bị con Sói cắn đứt cổ!')">Than thở chết sớm</span>
        `;

        this.dom.btnSend.onclick = async () => {
            const text = this.dom.dockInput.value.trim();
            if (!text || this.isPostGameGenerating) return;

            this.dom.dockInput.value = '';
            const badge = `<span class="chat-intent-badge continue">🍻 Hậu trường</span>`;
            this.addChatMessage(
                this.humanPlayer,
                text,
                null,
                badge,
                `[Hậu Trường Sau Trận]`
            );

            // Tìm xem người chơi có réo tên cụ thể AI nào không, nếu có thì cho AI đó đáp trả trước + 2 AI khác!
            const bots = this.players.filter(p => !p.isHuman);
            const mentionedBots = bots.filter(b => text.toLowerCase().includes(b.name.toLowerCase()));
            const otherBots = bots.filter(b => !mentionedBots.includes(b)).sort(() => Math.random() - 0.5);

            const responders = [...mentionedBots, ...otherBots.slice(0, Math.max(1, 3 - mentionedBots.length))];
            await this.runPostGameAIRound(responders);
        };

        this.dom.btnStopChat.onclick = async () => {
            if (this.isPostGameGenerating) return;
            await this.runPostGameAIRound();
        };

        this.dom.btnSkip.onclick = () => {
            this.dom.gameOverModal.classList.add('active');
        };

        this.dom.dockInput.onkeydown = (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.dom.btnSend.click();
            }
        };
    }

    async runPostGameAIRound(customBotList = null) {
        if (this.isPostGameGenerating) return;
        this.isPostGameGenerating = true;
        this.dom.btnSend.disabled = true;
        this.dom.btnStopChat.disabled = true;

        // Ưu tiên Sói lên tiếng trước, sau đó tới các vai khác (cả sống lẫn chết đều nói!)
        const botsToSpeak = customBotList || [
            ...this.players.filter(p => !p.isHuman && p.role === 'werewolf'),
            ...this.players.filter(p => !p.isHuman && p.role !== 'werewolf')
        ];

        for (const bot of botsToSpeak) {
            if (this.phase !== 'POST_GAME_CHAT') break;
            this.highlightSpeaker(bot.id);

            try {
                const res = await aiBrain.generatePostGameSpeech(bot, this, this.lastWinnerTeam);
                this.updateActiveModelBadge(res.model_used, bot.name);
                const badge = `<span class="chat-intent-badge continue">🍻 Hậu trường</span>`;
                this.addChatMessage(
                    bot,
                    res.speech,
                    res.thought,
                    badge,
                    `[Hậu Trường Sau Trận]`,
                    res.model_used
                );
            } catch (e) {
                console.error('Lỗi AI chat sau trận:', e);
            }

            await new Promise(r => setTimeout(r, 700));
        }

        this.highlightSpeaker(null);
        this.isPostGameGenerating = false;
        if (this.phase === 'POST_GAME_CHAT') {
            this.dom.btnSend.disabled = false;
            this.dom.btnStopChat.disabled = false;
            this.dom.dockInput.focus();
        }
    }

    /* =========================================================================
     * TRÌNH XEM 2 LÕI VAI CHƠI
     * ========================================================================= */
    openVaultInspector() {
        if (!this.selectedVaultPlayerId && this.humanPlayer) {
            this.selectedVaultPlayerId = this.humanPlayer.id;
        }
        if (this.godMode) {
            document.getElementById('toggle-god-vault').checked = true;
        }
        this.renderVaultInspectorContent();
        this.dom.vaultModal.classList.add('active');
    }

    renderVaultInspectorContent() {
        const tabsContainer = document.getElementById('vault-tabs');
        const bodyContainer = document.getElementById('vault-content-body');
        const unlockAll = document.getElementById('toggle-god-vault').checked || this.godMode;

        tabsContainer.innerHTML = '';
        this.players.forEach(p => {
            const btn = document.createElement('button');
            btn.className = `vault-tab-btn ${p.id === this.selectedVaultPlayerId ? 'active' : ''}`;
            const canSeeRole = p.isHuman || unlockAll;
            const roleIcon = canSeeRole ? ROLE_DEFINITIONS[p.role].icon : '❓';
            btn.innerHTML = `${roleIcon} #${p.id} ${p.name} (${p.vault.deductionJournal.length})`;
            btn.onclick = () => {
                this.selectedVaultPlayerId = p.id;
                this.renderVaultInspectorContent();
            };
            tabsContainer.appendChild(btn);
        });

        const targetPlayer = this.players.find(p => p.id === this.selectedVaultPlayerId) || this.players[0];
        if (!targetPlayer) return;

        const canInspect = targetPlayer.isHuman || unlockAll;
        if (!canInspect) {
            bodyContainer.innerHTML = `
                <div style="padding:20px; text-align:center; background:#0d1117; border-radius:12px; border:1px solid var(--border-color);">
                    <p style="font-size:14px; color:#f0883e; margin-bottom:8px;">
                        🔒 <strong>Lõi Kho & Vai Trò</strong> của <strong>${targetPlayer.name}</strong> đang được bảo mật (Luật: Kể cả khi đã chết cũng không lộ Role!).
                    </p>
                    <p style="font-size:12.5px; color:#c9d1d9; margin-bottom:10px;">
                        🎭 <strong>Lõi Tính Cách công khai:</strong> ${targetPlayer.personaCore.title} — ${targetPlayer.personaCore.trashTalkStyle}
                    </p>
                    <p style="font-size:12px; color:var(--text-muted);">
                        👉 Tích vào ô <strong>"👁️ Mở khóa xem tất cả Role AI"</strong> ở góc trên bên phải nếu bạn muốn bật quyền Quản Trò để xem Lõi Kho của ${targetPlayer.name}!
                    </p>
                </div>
            `;
            return;
        }

        const def = ROLE_DEFINITIONS[targetPlayer.role];
        const pCore = targetPlayer.personaCore;

        const nightLogsHtml = targetPlayer.vault.privateNightLogs.length > 0
            ? targetPlayer.vault.privateNightLogs.map(l => `<div style="padding:4px 0; border-bottom:1px dashed #21262d;">• ${l}</div>`).join('')
            : '<em style="color:var(--text-muted)">Chưa có nhật ký hành động đêm.</em>';

        const journalHtml = targetPlayer.vault.deductionJournal.length > 0
            ? targetPlayer.vault.deductionJournal.map((entry, idx) => `
                <div class="vault-journal-entry">
                    <div style="font-size:11px; color:#79c0ff; font-weight:700; margin-bottom:4px;">
                        📌 Bản ghi #${idx + 1} • ${entry.phase} (${entry.timestamp}) • 🤖 Model: <span style="color:#7ee787">${entry.model}</span>
                    </div>
                    <div style="color:#e6edf3;">${entry.deduction}</div>
                </div>
            `).join('')
            : '<em style="color:var(--text-muted)">Chưa có bản ghi suy luận nào trong Lõi Kho.</em>';

        bodyContainer.innerHTML = `
            <div style="background:#0d1117; border:1px solid var(--border-color); border-radius:10px; padding:12px; margin-bottom:10px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">
                <div>
                    <span style="font-size:14px; font-weight:800; color:#58a6ff;">#${targetPlayer.id} ${targetPlayer.name}</span>
                    — Vai thật: <span style="color:#f0883e; font-weight:700;">${def.icon} ${def.name}</span>
                </div>
                <div style="font-size:12px; background:rgba(35,134,54,0.2); color:#7ee787; padding:3px 10px; border-radius:12px; border:1px solid rgba(46,160,67,0.4);">
                    🤖 Model riêng: <strong>${targetPlayer.assignedModel}</strong>
                </div>
            </div>

            <div style="background:#0d1117; border:1px solid rgba(240,136,62,0.4); border-radius:10px; padding:12px; margin-bottom:10px; font-size:12.5px; line-height:1.55;">
                <div style="font-weight:800; color:#f0883e; margin-bottom:6px;">🔥 LÕI 1 — LÕI TÍNH CÁCH (PERSONA CORE): ${pCore.title}</div>
                <div>• <strong>Cách xưng hô:</strong> ${pCore.pronouns}</div>
                <div>• <strong>Độ hổ báo:</strong> ${pCore.aggression}</div>
                <div>• <strong>Thiên kiến suy luận:</strong> ${pCore.reasoningBias}</div>
                <div>• <strong>Phong cách đấu khẩu:</strong> ${pCore.trashTalkStyle}</div>
            </div>

            <div style="background:#0d1117; border:1px solid var(--border-color); border-radius:10px; padding:12px; margin-bottom:10px; font-size:12.5px;">
                <div style="font-weight:800; color:#7ee787; margin-bottom:6px;">🌙 LÕI 2 (Phần A) — Ký Ức Hành Động Đêm Bí Mật:</div>
                ${nightLogsHtml}
            </div>

            <div>
                <div style="font-size:13px; font-weight:800; color:#d2a8ff; margin-bottom:8px;">
                    🗄️ LÕI 2 (Phần B) — Sổ Tay Suy Luận & Thù Vặt Trong Kho (${targetPlayer.vault.deductionJournal.length} bản ghi):
                </div>
                ${journalHtml}
            </div>
        `;
    }

    /* =========================================================================
     * CÀI ĐẶT API & MODELS
     * ========================================================================= */
    openSettings() {
        this.dom.inputApiKey.value = aiBrain.apiKey;
        this.dom.inputBaseUrl.value = aiBrain.baseUrl;
        document.getElementById('settings-models-textarea').value = aiBrain.models.join('\n');
        this.renderModelSettingsList();
        this.dom.settingsModal.classList.add('active');
    }

    closeSettings() {
        this.dom.settingsModal.classList.remove('active');
    }

    renderModelSettingsList() {
        this.dom.modelListContainer.innerHTML = '';
        aiBrain.models.forEach((m, idx) => {
            const row = document.createElement('div');
            row.className = 'model-row';
            row.innerHTML = `
                <span><strong>Role AI #${idx + 1}:</strong> ${m}</span>
                <span class="model-status-indicator" id="status-${idx}">Sẵn sàng</span>
            `;
            this.dom.modelListContainer.appendChild(row);
        });
    }

    saveSettings() {
        const apiKey = this.dom.inputApiKey.value.trim();
        const baseUrl = this.dom.inputBaseUrl.value.trim();
        const modelsText = document.getElementById('settings-models-textarea').value.trim();

        let models = aiBrain.models;
        if (modelsText) {
            models = modelsText.split('\n').map(s => s.trim()).filter(s => s.length > 0);
        }

        aiBrain.saveConfig(apiKey, baseUrl, models);
        this.renderModelSettingsList();
        this.closeSettings();
    }

    async testModels() {
        this.dom.btnTestModels.disabled = true;
        this.dom.btnTestModels.textContent = 'Đang kiểm tra...';

        const isFileProtocol = (window.location.protocol === 'file:');

        // Nếu chạy qua local server, thử dùng proxy /api/test-models
        if (!isFileProtocol) {
            try {
                const res = await fetch('/api/test-models', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        models: aiBrain.models,
                        api_key: aiBrain.apiKey,
                        base_url: aiBrain.baseUrl
                    })
                });
                if (res.ok) {
                    const data = await res.json();
                    if (data.results) {
                        data.results.forEach((r, idx) => {
                            const el = document.getElementById(`status-${idx}`);
                            if (el) {
                                if (r.status === 'online') {
                                    el.className = 'model-status-indicator online';
                                    el.textContent = `🟢 Online (${r.latency_ms}ms)`;
                                } else {
                                    el.className = 'model-status-indicator error';
                                    el.textContent = `🔴 Lỗi (${r.error})`;
                                }
                            }
                        });
                        this.dom.btnTestModels.disabled = false;
                        this.dom.btnTestModels.textContent = 'Kiểm tra độ trễ (Ping Test)';
                        return;
                    }
                }
            } catch (e) {
                console.warn('Proxy /api/test-models không phản hồi, chuyển sang test trực tiếp từ trình duyệt...');
            }
        }

        // Test trực tiếp từ trình duyệt (Client-side) khi mở bằng file index.html
        for (let idx = 0; idx < aiBrain.models.length; idx++) {
            const model = aiBrain.models[idx];
            const el = document.getElementById(`status-${idx}`);
            if (el) {
                el.className = 'model-status-indicator';
                el.textContent = '⏳ Đang test...';
            }
            try {
                const start = performance.now();
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 12000);
                const res = await fetch(`${aiBrain.baseUrl}/chat/completions`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${aiBrain.apiKey}`,
                        'Content-Type': 'application/json'
                    },
                    signal: controller.signal,
                    body: JSON.stringify({
                        model: model,
                        messages: [{ role: 'user', content: 'Ping. Chỉ trả lời 1 chữ OK.' }],
                        max_tokens: 5
                    })
                });
                clearTimeout(timeoutId);
                const elapsed = Math.round(performance.now() - start);

                if (res.ok) {
                    if (el) {
                        el.className = 'model-status-indicator online';
                        el.textContent = `🟢 Online (${elapsed}ms)`;
                    }
                } else {
                    if (el) {
                        el.className = 'model-status-indicator error';
                        el.textContent = `🔴 Lỗi (HTTP ${res.status})`;
                    }
                }
            } catch (err) {
                if (el) {
                    el.className = 'model-status-indicator error';
                    el.textContent = `🔴 Lỗi (${err.name === 'AbortError' ? 'Timeout' : 'Mạng'})`;
                }
            }
        }
        this.dom.btnTestModels.disabled = false;
        this.dom.btnTestModels.textContent = 'Kiểm tra độ trễ (Ping Test)';
    }

    updateActiveModelBadge(modelName, speakerName = '') {
        if (modelName) {
            const label = speakerName ? `${speakerName}: ${modelName}` : modelName;
            this.dom.activeModelBadge.textContent = `⚡ ${label}`;
        }
    }
}

window.addEventListener('DOMContentLoaded', () => {
    window.game = new WerewolfGame();
});
