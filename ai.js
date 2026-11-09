/**
 * WolfDEAD v3.2 - Multi-Model AI Engine, Dual-Core Architecture, Game Rules Codex & Post-Game Chat
 * 
 * CẬP NHẬT v3.2:
 * - Thêm chế độ "Trò Chuyện Sau Trận Đấu (Post-Game Lobby Chat)": Khi kết thúc ván và lật toàn bộ bài,
 *   tất cả người chơi (cả sống lẫn chết) cùng vào bàn xả giận, gáy bẩn, đổ lỗi và đối đáp tự do với bạn!
 */

const PERSONA_ARCHETYPES = [
    {
        id: 'aggressive_brawler',
        title: '🔥 Kẻ Cà Khịa Cục Súc',
        pronouns: 'Xưng "tao" - gọi "mày / chúng mày / thằng này / con kia"',
        aggression: '10/10 (Cực gắt, chửi thẳng mặt không nể nang)',
        reasoningBias: 'Ghét cay ghét đắng mấy đứa nói năng ba phải, nước đôi hoặc đòi Skip. Thấy đứa nào nói văn vở đạo lý là nghi làm Sói diễn kịch ngay lập tức.',
        trashTalkStyle: 'Mở mồm là công kích trực diện, chê bai thẳng thừng những lập luận ngớ ngẩn. Dùng ngôn từ bụi bặm, chợ búa đời thường ("ngáo à", "xạo ke", "lòi đuôi sói", "bớt văn vở").'
    },
    {
        id: 'paranoid_cynic',
        title: '🐍 Thánh Đa Nghi Độc Mồm',
        pronouns: 'Xưng "tao" - gọi "mày / tụi bây / mấy con gà"',
        aggression: '9.5/10 (Mỉa mai sâu cay, độc mồm độc miệng)',
        reasoningBias: 'Không tin bố con thằng nào trên bàn. Chuyên soi câu chữ ở Turn trước để bắt thóp những đứa "quay xe" hoặc lấp liếm.',
        trashTalkStyle: 'Cười khẩy vào mặt đối phương, vặn họng từng câu nói, chửi mấy đứa hùa theo đám đông là "bầy cừu không não".'
    },
    {
        id: 'vengeful_hothead',
        title: '💢 Thanh Niên Cay Cú Thù Dai',
        pronouns: 'Xưng "tao" - gọi "mày / chúng mày"',
        aggression: '10/10 (Nóng máu, ai đụng vào là bật lại gấp đôi)',
        reasoningBias: 'Ai dám nghi ngờ hoặc réo tên nó vô căn cứ là nó ghim vào Lõi Kho và tìm mọi sơ hở để dìm chết kẻ đó.',
        trashTalkStyle: 'Nóng nảy, gắt gỏng, sẵn sàng chỉ thẳng tên kẻ vừa nghi ngờ mình để chửi tay đôi và thách thức cả làng vote.'
    },
    {
        id: 'cold_gaslighter',
        title: '🧊 Trùm Thao Túng Lạnh Lùng',
        pronouns: 'Xưng "tao" - gọi "mày / mấy đứa"',
        aggression: '8.5/10 (Lạnh lùng khinh bỉ, đâm chọt hiểm độc)',
        reasoningBias: 'Quan sát xem đứa nào đang cố dắt mũi cả làng hoặc cố tình đổ vấy cho người yếu thế để phản đòn chí mạng.',
        trashTalkStyle: 'Không cần hét to nhưng câu nào nói ra cũng sắc như dao cạo, bóc trần sự ngu dốt và giả tạo của đối phương.'
    },
    {
        id: 'street_schemer',
        title: '🦊 Cáo Già Chợ Búa',
        pronouns: 'Xưng "tao" - gọi "mày / anh em chúng mày"',
        aggression: '9/10 (Đốp chát, thực dụng, lật mặt nhanh)',
        reasoningBias: 'Chuyên rình mò những đứa im im núp lùm hoặc những đứa đưa ra lý do vote hời hợt cho qua chuyện.',
        trashTalkStyle: 'Nói chuyện kiểu dân chơi sành sỏi, bóc phốt mấy trò "giả nai nhận Dân", kích đểu cho các bên cắn nhau.'
    },
    {
        id: 'relentless_interrogator',
        title: '⚡ Kẻ Tra Khảo Cực Đoan',
        pronouns: 'Xưng "tao" - gọi "mày / tụi mày"',
        aggression: '9/10 (Truy sát đến cùng, ép cung nghẹt thở)',
        reasoningBias: 'Bắt buộc mọi người phải chỉ mặt đặt tên nghi phạm. Đứa nào bảo "chưa có thông tin" là bị quy chụp làm Sói đang câu giờ.',
        trashTalkStyle: 'Dồn ép liên tục, đặt câu hỏi vặn sườn, chửi thẳng những đứa nhát gan không dám chốt vote.'
    }
];

/**
 * LÕI 1: LÕI TÍNH CÁCH (PersonaCore)
 */
class PersonaCore {
    constructor(archetypeData) {
        this.id = archetypeData.id;
        this.title = archetypeData.title;
        this.pronouns = archetypeData.pronouns;
        this.aggression = archetypeData.aggression;
        this.reasoningBias = archetypeData.reasoningBias;
        this.trashTalkStyle = archetypeData.trashTalkStyle;
    }

    formatForPrompt() {
        return `[LÕI 1 - LÕI TÍNH CÁCH (PERSONA CORE)]
- Hình mẫu nhân cách: ${this.title}
- Cách xưng hô BẮT BUỘC: ${this.pronouns} (TUYỆT ĐỐI CẤM xưng "bạn - tôi" lễ phép, cấm nói năng thảo mai kiểu học sinh tiểu học!)
- Độ hổ báo / công kích: ${this.aggression}
- Thiên kiến suy luận riêng: ${this.reasoningBias}
- Phong cách đấu khẩu: ${this.trashTalkStyle}`;
    }
}

/**
 * LÕI 2: LÕI KHO DỮ LIỆU (VaultCore)
 */
class RoleDataVault {
    constructor(playerId, playerName, role, personaCore, assignedModel) {
        this.playerId = playerId;
        this.playerName = playerName;
        this.role = role;
        this.personaCore = personaCore;
        this.assignedModel = assignedModel;

        this.privateNightLogs = [];
        this.deductionJournal = [];
    }

    addPrivateLog(round, text) {
        this.privateNightLogs.push(`[Đêm ${round}] ${text}`);
    }

    commitDeduction(round, phase, deductionText, modelUsed = '') {
        if (!deductionText) return;
        this.deductionJournal.push({
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
            round: round,
            phase: phase,
            model: modelUsed || this.assignedModel,
            deduction: deductionText
        });
    }
}

class AIBrain {
    constructor() {
        this.apiKey = localStorage.getItem('wolfdead_api_key') || 'sk-6e5bd68e2310d13bcf3747838f1cf8138d68e14e318e4e7e68cfb62a30aff59b';
        this.baseUrl = localStorage.getItem('wolfdead_base_url') || 'https://api.xah.io/v1';

        const savedModels = localStorage.getItem('wolfdead_models_v3');
        this.models = savedModels ? JSON.parse(savedModels) : [
            "dungcsnd113/gemini-flash-3.8",
            "levuphong2909/gemini-3.8-flash-high",
            "dungcsnd113/gemini-4-argon",
            "thanhnhan9023/gemini-3.7-flash-high",
            "sypham98/claude-fable-5-1",
            "tanynguyen97/gemini-4-argon",
            "devdoclang/gemini-3.8-flash"
        ];
    }

    saveConfig(apiKey, baseUrl, models) {
        this.apiKey = apiKey;
        this.baseUrl = baseUrl;
        this.models = models;
        localStorage.setItem('wolfdead_api_key', apiKey);
        localStorage.setItem('wolfdead_base_url', baseUrl);
        localStorage.setItem('wolfdead_models_v3', JSON.stringify(models));
    }

    async callAI(messages, preferredModel = null, temperature = 0.88, maxTokens = 750) {
        const isFileProtocol = (window.location.protocol === 'file:');

        // Nếu chạy qua web server (http/https), ưu tiên gọi qua proxy /api/chat
        if (!isFileProtocol) {
            try {
                const res = await fetch('/api/chat', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        messages: messages,
                        models: this.models,
                        preferred_model: preferredModel,
                        api_key: this.apiKey,
                        base_url: this.baseUrl,
                        temperature: temperature,
                        max_tokens: maxTokens
                    })
                });

                if (res.ok) {
                    const data = await res.json();
                    if (data.success && data.content) {
                        return {
                            content: data.content,
                            model_used: data.model_used,
                            latency_ms: data.latency_ms
                        };
                    }
                }
            } catch (err) {
                console.warn('Proxy máy chủ /api/chat không khả dụng, tự động chuyển sang gọi trực tiếp từ trình duyệt...', err);
            }
        }

        // Mở game trực tiếp bằng double-click file index.html (file:///) hoặc khi không chạy server:
        // Trình duyệt sẽ gọi trực tiếp đến API OpenAI-compatible
        return await this.fallbackDirectCall(messages, preferredModel, temperature, maxTokens);
    }

    async fallbackDirectCall(messages, preferredModel = null, temperature = 0.88, maxTokens = 750) {
        const ordered = [];
        if (preferredModel && this.models.includes(preferredModel)) {
            ordered.push(preferredModel);
        }
        for (const m of this.models) {
            if (!ordered.includes(m)) ordered.push(m);
        }

        for (const model of ordered) {
            try {
                const startTime = performance.now();
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 25000);

                const res = await fetch(`${this.baseUrl}/chat/completions`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${this.apiKey}`,
                        'Content-Type': 'application/json'
                    },
                    signal: controller.signal,
                    body: JSON.stringify({
                        model: model,
                        messages: messages,
                        temperature: temperature,
                        max_tokens: maxTokens
                    })
                });
                clearTimeout(timeoutId);

                if (res.ok) {
                    const data = await res.json();
                    if (data.choices && data.choices[0] && data.choices[0].message) {
                        const content = data.choices[0].message.content;
                        const elapsed = Math.round(performance.now() - startTime);
                        return {
                            content: content,
                            model_used: model,
                            latency_ms: elapsed
                        };
                    }
                } else {
                    console.warn(`Model ${model} trả về HTTP ${res.status}, tự động xoay sang model tiếp theo...`);
                }
            } catch (e) {
                console.warn(`Model ${model} lỗi (${e.message}), xoay sang model tiếp theo...`);
            }
        }
        throw new Error('Toàn bộ các model AI trong danh sách đều không phản hồi!');
    }

    parseJSON(rawText) {
        if (!rawText) return null;
        let clean = rawText.trim();
        clean = clean.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```$/i, '').trim();

        try {
            return JSON.parse(clean);
        } catch (e) {
            const firstBrace = clean.indexOf('{');
            const lastBrace = clean.lastIndexOf('}');
            if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
                try {
                    return JSON.parse(clean.substring(firstBrace, lastBrace + 1));
                } catch (e2) {
                    console.error('Lỗi parse JSON từ AI:', rawText);
                }
            }
            return null;
        }
    }

    /**
     * BẢN TÓM TẮT LUẬT CHƠI & CƠ CHẾ CÁC LÁ BÀI (GAME RULES & ROLE CODEX)
     */
    buildGameRulesCodex(gameState) {
        const rc = gameState.roleCounts;
        const total = gameState.players.length;
        return `[BẢNG TÓM TẮT LUẬT CHƠI & CƠ CHẾ 4 LÁ BÀI TRÊN BÀN]
1. CẤU TRÚC BỘ BÀI (${total} người chơi):
   - 🐺 MA SÓI (${rc.werewolf} lá - Phe Sói): Mỗi đêm, mỗi con Sói còn sống được chọn cắn 1 người. Ban ngày Sói trà trộn, giả làm Dân Làng hoặc nhận vơ (fake claim) làm Bảo Vệ / Phù Thủy để lừa làng.
   - 🛡️ BẢO VỆ (${rc.bodyguard} lá - Phe Dân): Mỗi đêm chọn 1 người (kể cả bản thân) để canh gác khỏi vết cắn của Ma Sói. Quy tắc: KHÔNG được bảo vệ cùng 1 người trong 2 đêm liên tiếp. (Lưu ý: Bảo Vệ chỉ chặn được vết cắn của Sói, KHÔNG chặn được Bình Giết của Phù Thủy).
   - 🧙‍♀️ PHÙ THỦY (${rc.witch} lá - Phe Dân): Có tổng cộng 1 Bình Cứu và 1 Bình Giết (Độc) cho cả ván đấu. Trong đêm, Phù Thủy biết ai đang bị Sói cắn và có quyền: chỉ Cứu, chỉ Giết, dùng CẢ 2 BÌNH trong cùng 1 đêm, hoặc Không hành động.
   - 🧑‍🌾 DÂN LÀNG (${rc.villager} lá - Phe Dân): Không có kỹ năng đêm. Dựa vào suy luận logic, lời đấu khẩu và lý do vote để tìm và treo cổ Ma Sói.

2. LUẬT CỐT LÕI CẦN NHỚ ĐỂ SUY LUẬN:
   - 🔒 LUẬT ẨN VAI KHI CHẾT: Khi bất kỳ ai chết (dù chết trong đêm hay bị treo cổ ban ngày), VAI TRÒ CỦA HỌ TUYỆT ĐỐI KHÔNG ĐƯỢC TIẾT LỘ! Do đó, Sói có thể mạo danh vai của người đã chết, hoặc làng phải tự suy luận xem người vừa bị treo cổ đã là Sói hay chưa.
   - 💡 SUY LUẬN TỪ KẾT QUẢ ĐÊM:
     + Nếu sáng ra KHÔNG AI CHẾT: Có nghĩa là Bảo Vệ đã canh gác trúng người bị Sói cắn, HOẶC Phù Thủy đã dùng Bình Cứu!
     + Nếu bàn chỉ có 1 Sói mà sáng ra có 2 NGƯỜI CHẾT: Chắc chắn 100% là 1 người bị Sói cắn và 1 người bị Phù Thủy quăng Bình Giết!
   - ⏱️ LUẬT ĐẤU KHẨU & VOTE: Ban ngày đấu khẩu tối đa ${gameState.maxDiscussionTurns} Turn (dừng sớm nếu không còn ai chọn "Trò chuyện tiếp"). Cuối ngày bỏ phiếu, người nhiều phiếu nhất bị treo cổ (hòa phiếu hoặc tất cả Skip thì không ai chết).
   - 🏆 ĐIỀU KIỆN THẮNG: Phe Dân thắng khi diệt hết Sói. Phe Sói thắng khi số Sói còn sống >= số người phe Dân còn sống.`;
    }

    /* =========================================================================
     * KẾT HỢP LÕI TÍNH CÁCH (PERSONA CORE) + LÕI KHO (VAULT CORE) + BẢNG LUẬT
     * ========================================================================= */
    mountDualCoreContext(bot, gameState) {
        const vault = bot.vault;
        const persona = bot.personaCore;

        const allNames = gameState.players.map(p => p.name).join(', ');
        const aliveNames = gameState.players.filter(p => p.isAlive).map(p => p.name).join(', ');
        const deadNames = gameState.players
            .filter(p => !p.isAlive)
            .map(p => `${p.name} (đã chết ở vòng ${p.deathRound} - ${p.deathReason}, ẩn vai)`)
            .join(', ') || 'Chưa có ai chết';

        const rulesCodex = this.buildGameRulesCodex(gameState);

        let roleSecret = "";
        if (bot.role === 'werewolf') {
            const otherWolves = gameState.players
                .filter(p => p.role === 'werewolf' && p.id !== bot.id)
                .map(p => p.name);
            roleSecret = `LÁ BÀI BÍ MẬT CỦA MÀY: 🐺 MA SÓI!
${otherWolves.length > 0 ? `Đồng bọn Sói cùng phe: ${otherWolves.join(', ')}.` : 'Mày là con Ma Sói duy nhất trên bàn.'}
Chiến thuật sống còn: Tuyệt đối không nhận là Sói. Vì người chết KHÔNG LỘ ROLE, mày có thể đóng giả làm Dân cứng hoặc thậm chí cướp vai (nhận vơ là Bảo Vệ / Phù Thủy) nếu thấy có lợi. Hãy chửi bới, đổ tội, gài bẫy cho lũ Dân tự nghi ngờ và treo cổ lẫn nhau!`;
        } else if (bot.role === 'witch') {
            roleSecret = `LÁ BÀI BÍ MẬT CỦA MÀY: 🧙‍♀️ PHÙ THỦY!
Thuốc hiện tại của mày: Bình Cứu [${gameState.nightAction.witchHasSave ? 'CÒN 1 BÌNH' : 'ĐÃ DÙNG HẾT'}], Bình Giết [${gameState.nightAction.witchHasPoison ? 'CÒN 1 BÌNH' : 'ĐÃ DÙNG HẾT'}].
Chiến thuật: Dựa vào ký ức đêm tối (mày biết rõ đêm nào ai bị Sói cắn, đêm nào mày đã cứu hay giết ai) để vạch mặt kẻ nói dối. Nếu có kẻ dám nhận vơ làm Phù Thủy, hãy vả vỡ mồm nó!`;
        } else if (bot.role === 'bodyguard') {
            roleSecret = `LÁ BÀI BÍ MẬT CỦA MÀY: 🛡️ BẢO VỆ!
Đêm gần nhất mày đã canh gác cho: ${gameState.nightAction.lastProtectedTarget || 'Chưa có'}.
Chiến thuật: Âm thầm bảo vệ người quan trọng trong đêm. Nếu đêm qua không ai chết và mày nghi ngờ người mày bảo vệ chính là mục tiêu được cứu thoát, hãy dùng thông tin đó để suy luận xem ai là người tốt, ai là Sói!`;
        } else {
            roleSecret = `LÁ BÀI BÍ MẬT CỦA MÀY: 🧑‍🌾 DÂN LÀNG!
Chiến thuật: Mày không có kỹ năng đêm nên cái mồm và cái đầu là vũ khí duy nhất. Dựa vào Bảng Luật Chơi, số người chết mỗi sáng, lời đấu khẩu và lý do vote để lôi đầu con Sói ra ánh sáng!`;
        }

        const privateLogsText = vault.privateNightLogs.length > 0
            ? vault.privateNightLogs.join('\n')
            : 'Chưa có hành động đêm.';

        const deductionHistoryText = vault.deductionJournal.length > 0
            ? vault.deductionJournal.map((d, i) => `Lần #${i + 1} [${d.phase}]: ${d.deduction}`).join('\n')
            : 'Chưa có ghi chú suy luận trước đó.';

        const publicTranscriptText = gameState.sharedPublicLogs.length > 0
            ? gameState.sharedPublicLogs.slice(-40).join('\n')
            : 'Chưa ai mở lời.';

        return `=== HỆ THỐNG NẠP 2 LÕI VAI CHƠI & BẢNG LUẬT (DUAL-CORE MOUNTING) ===
Mày đang nhập hồn vào người chơi tên "${bot.name}" trên sới Ma Sói đời thực gồm ${gameState.players.length} người: [${allNames}].

${rulesCodex}

${persona.formatForPrompt()}

[LÕI 2 - LÕI KHO DỮ LIỆU RIÊNG CỦA "${bot.name}" (VAULT CORE)]
1. Lá bài & Chiến thuật riêng của "${bot.name}":
${roleSecret}

2. Ký ức hành động đêm bí mật của riêng "${bot.name}":
${privateLogsText}

3. Sổ tay suy luận & ghim thù đã ghi trong Kho của "${bot.name}" từ các Turn trước:
${deductionHistoryText}

4. Toàn bộ lịch sử đấu khẩu & lý do vote chung của cả bàn:
- Ngày hiện tại: Ngày ${gameState.round}
- Đang sống: [${aliveNames}]
- Đã chết (ẨN VAI): [${deadNames}]
- Biên bản sới bạc:
${publicTranscriptText}

QUY TẮC NGÔN NGỮ BẮT BUỘC:
- Đây là sới Ma Sói sát phạt thực chiến căng thẳng, KHÔNG PHẢI lớp học đạo đức tiểu học!
- CẤM TUYỆT ĐỐI các câu sáo rỗng, lịch sự giả tạo như: "Tôi đồng ý với bạn", "Chúng ta cần bình tĩnh", "Mọi người hãy lắng nghe", "Cần thêm thông tin".
- BẮT BUỘC xưng hô "tao - mày / chúng mày / thằng [Tên] / con [Tên]".
- Phải chỉ đích danh tên người khác trên bàn để chất vấn, cà khịa, vặn họng, chửi lối chơi ngu hoặc đáp trả kẻ vừa cắn mình!
==============================================================`;
    }

    /**
     * 1. LƯỢT ĐẤU KHẨU BAN NGÀY (TỐI ĐA 5 TURN)
     */
    async generateDaySpeech(bot, gameState, currentTurn, maxTurns) {
        const dualCoreContext = this.mountDualCoreContext(bot, gameState);

        const prompt = `${dualCoreContext}

NHIỆM VỤ HIỆN TẠI (NGÀY ${gameState.round} - TURN ĐẤU KHẨU ${currentTurn}/${maxTurns}):
Đến lượt mày ("${bot.name}") lên tiếng trước sới!
1. Dựa vào [BẢNG TÓM TẮT LUẬT CHƠI], [LÕI KHO] và [LÕI TÍNH CÁCH], hãy ghi lại 1 đoạn suy luận ngầm ("deduction") vào Lõi Kho của mày: Phân tích tình hình đêm qua, thằng nào đang xạo ke, thằng nào vừa công kích mày, thằng nào khả nghi là Sói nhất?
2. Phun ra lời thoại đấu khẩu ("speech", 1-3 câu tiếng Việt cực gắt, đời thường, xưng tao-mày, gọi thẳng tên đứa mày muốn chửi/chất vấn hoặc phản dame đứa vừa nghi mày).
3. Quyết định ("continue_chat"):
   - Chọn \`true\` nếu mày còn cay cú, muốn nghe tụi nó trả lời chất vấn để cãi nhau tiếp ở Turn sau.
   - Chọn \`false\` nếu mày thấy đã lòi mặt Sói rồi, không cần nói nhiều nữa, đòi mở hòm phiếu treo cổ luôn!

BẮT BUỘC TRẢ VỀ DUY NHẤT JSON HỢP LỆ:
{
  "deduction": "Suy luận ngầm dựa trên luật bài & danh sách ghim thù lưu vào Lõi Kho của ${bot.name}",
  "speech": "Lời đấu khẩu cực gắt nói thẳng vào mặt cả bàn (xưng tao - mày)",
  "continue_chat": true hoặc false
}`;

        const messages = [
            {
                role: 'system',
                content: 'Mày là một cao thủ Ma Sói đời thực cực kỳ cục súc, hiểu rõ luật các lá bài, mồm mép cay độc. Xưng tao-mày, cãi nhau gay gắt, không bao giờ nói chuyện lễ phép thảo mai. Luôn trả về JSON hợp lệ.'
            },
            { role: 'user', content: prompt }
        ];

        const res = await this.callAI(messages, bot.vault.assignedModel, 0.9, 550);
        const parsed = this.parseJSON(res.content);

        const deduction = parsed?.deduction || 'Đang soi kỹ xem thằng nào lộ sơ hở để vả thẳng mặt.';
        const speech = parsed?.speech || 'Mấy đứa mày câm như hến thế? Đứa nào có tật giật mình thì tự giác khai ra đi đừng để tao điểm mặt!';
        const continueChat = (typeof parsed?.continue_chat === 'boolean') ? parsed.continue_chat : (currentTurn < 2);

        bot.vault.commitDeduction(gameState.round, `Ngày ${gameState.round} - Turn ${currentTurn}`, deduction, res.model_used);

        return {
            deduction,
            speech,
            continue_chat: continueChat,
            model_used: res.model_used
        };
    }

    /**
     * 2. BỎ PHIẾU TREO CỔ KÈM LÝ DO ĐANH THÉP
     */
    async generateVote(bot, gameState) {
        const dualCoreContext = this.mountDualCoreContext(bot, gameState);
        const aliveOthers = gameState.players.filter(p => p.isAlive && p.id !== bot.id).map(p => p.name);

        const prompt = `${dualCoreContext}

NHIỆM VỤ HIỆN TẠI (NGÀY ${gameState.round} - GIỜ PHÁN QUYẾT TREO CỔ):
Đến lượt mày ("${bot.name}") chỉ tay bỏ phiếu và tuyên bố LÝ DO VOTE!
Danh sách những đứa đang sống có thể vote: [${aliveOthers.join(', ')}] hoặc "skip" (ưu tiên vote thẳng mặt kẻ tình nghi!).

BẮT BUỘC TRẢ VỀ JSON:
{
  "deduction": "Chốt suy luận bỏ phiếu lưu vào Lõi Kho",
  "vote_target": "Tên chính xác đứa mày muốn treo cổ (hoặc 'skip')",
  "reason": "1-2 câu chửi/kết tội thẳng mặt giải thích tại sao mày vote nó (xưng tao - mày)"
}`;

        const messages = [
            {
                role: 'system',
                content: 'Mày đang ở giờ bỏ phiếu treo cổ Ma Sói. Quyết đoán, cay nghiệt, xưng tao-mày. Luôn trả về JSON.'
            },
            { role: 'user', content: prompt }
        ];

        const res = await this.callAI(messages, bot.vault.assignedModel, 0.8, 450);
        const parsed = this.parseJSON(res.content);

        let target = parsed?.vote_target || 'skip';
        if (target !== 'skip' && !aliveOthers.includes(target)) {
            target = aliveOthers[Math.floor(Math.random() * aliveOthers.length)] || 'skip';
        }

        const deduction = parsed?.deduction || `Chốt phiếu tiễn ${target} lên bảng đếm số.`;
        const reason = parsed?.reason || (target === 'skip'
            ? 'Turn này tao tạm tha chưa vote, nhưng tao đã ghim mấy đứa nói nhảm rồi đấy!'
            : `Tao vote thẳng mặt ${target} vì nãy giờ mày lươn lẹo và lộ mùi Sói rõ nhất bàn!`);

        bot.vault.commitDeduction(gameState.round, `Ngày ${gameState.round} - Bỏ Phiếu`, deduction, res.model_used);

        return {
            deduction,
            vote_target: target,
            reason,
            model_used: res.model_used
        };
    }

    /**
     * 3. LƯỢT MA SÓI SĂN MỒI BAN ĐÊM
     */
    async generateWerewolfNightAction(wolfBot, gameState) {
        const dualCoreContext = this.mountDualCoreContext(wolfBot, gameState);
        const potentialVictims = gameState.players.filter(p => p.isAlive && p.role !== 'werewolf').map(p => p.name);

        const prompt = `${dualCoreContext}

NHIỆM VỤ HIỆN TẠI (ĐÊM ${gameState.round} - SÓI SĂN MỒI):
Mỗi con Sói được cắn 1 người mỗi đêm.
Danh sách con mồi: [${potentialVictims.join(', ')}].
Hãy đọc Lõi Kho của mày xem đứa nào mồm to nguy hiểm nhất, hoặc nghi là Phù Thủy / Bảo Vệ để cắn đứt họng nó đêm nay.

BẮT BUỘC TRẢ VỀ JSON:
{
  "deduction": "Tính toán ngầm của Sói khi chọn con mồi (lưu vào Lõi Kho)",
  "target": "Tên nạn nhân chính xác trong danh sách"
}`;

        const messages = [
            { role: 'system', content: 'Mày là Ma Sói tàn nhẫn đi săn đêm. Luôn trả về JSON.' },
            { role: 'user', content: prompt }
        ];

        const res = await this.callAI(messages, wolfBot.vault.assignedModel, 0.75, 350);
        const parsed = this.parseJSON(res.content);
        let target = parsed?.target;
        if (!potentialVictims.includes(target)) {
            target = potentialVictims[Math.floor(Math.random() * potentialVictims.length)];
        }

        const deduction = parsed?.deduction || `Đêm nay tao chọn cắn ${target} cho nó câm họng.`;
        wolfBot.vault.commitDeduction(gameState.round, `Đêm ${gameState.round} - Sói Cắn`, deduction, res.model_used);
        wolfBot.vault.addPrivateLog(gameState.round, `Đã cắn [${target}].`);

        return {
            deduction,
            target,
            model_used: res.model_used
        };
    }

    /**
     * 4. LƯỢT BẢO VỆ BAN ĐÊM
     */
    async generateBodyguardAction(bot, gameState, lastProtectedName) {
        const dualCoreContext = this.mountDualCoreContext(bot, gameState);
        const canProtect = gameState.players
            .filter(p => p.isAlive && p.name !== lastProtectedName)
            .map(p => p.name);

        const prompt = `${dualCoreContext}

NHIỆM VỤ HIỆN TẠI (ĐÊM ${gameState.round} - BẢO VỆ CANH GÁC):
Chọn 1 người để bảo vệ đêm nay (không trùng người đêm trước: ${lastProtectedName || 'Chưa có'}).
Danh sách: [${canProtect.join(', ')}].

BẮT BUỘC TRẢ VỀ JSON:
{
  "deduction": "Suy luận chọn người bảo vệ (lưu vào Lõi Kho)",
  "target": "Tên người được bảo vệ"
}`;

        const messages = [
            { role: 'system', content: 'Mày là Bảo Vệ tinh quái. Luôn trả về JSON.' },
            { role: 'user', content: prompt }
        ];

        const res = await this.callAI(messages, bot.vault.assignedModel, 0.7, 300);
        const parsed = this.parseJSON(res.content);
        let target = parsed?.target;
        if (!canProtect.includes(target)) {
            target = canProtect[Math.floor(Math.random() * canProtect.length)];
        }

        const deduction = parsed?.deduction || `Đêm nay canh gác cho ${target}.`;
        bot.vault.commitDeduction(gameState.round, `Đêm ${gameState.round} - Bảo Vệ`, deduction, res.model_used);
        bot.vault.addPrivateLog(gameState.round, `Đã bảo vệ [${target}].`);

        return {
            deduction,
            target,
            model_used: res.model_used
        };
    }

    /**
     * 5. LƯỢT PHÙ THỦY BAN ĐÊM
     */
    async generateWitchAction(bot, gameState, bittenNames, hasSavePotion, hasPoisonPotion) {
        const dualCoreContext = this.mountDualCoreContext(bot, gameState);
        const aliveOthers = gameState.players.filter(p => p.isAlive && p.id !== bot.id).map(p => p.name);
        const bittenText = bittenNames.length > 0 ? bittenNames.join(', ') : 'Không có ai';

        const prompt = `${dualCoreContext}

NHIỆM VỤ HIỆN TẠI (ĐÊM ${gameState.round} - PHÙ THỦY DÙNG THUỐC):
- Đang bị Sói cắn: [${bittenText}]
- Bình Cứu: ${hasSavePotion ? 'CÒN' : 'HẾT'}
- Bình Giết: ${hasPoisonPotion ? `CÒN (Mục tiêu có thể ném độc: ${aliveOthers.join(', ')})` : 'HẾT'}
Mày có thể chỉ Cứu, chỉ Giết, dùng CẢ 2 BÌNH trong đêm nay, hoặc KHÔNG HÀNH ĐỘNG.

BẮT BUỘC TRẢ VỀ JSON:
{
  "deduction": "Suy luận dùng thuốc của Phù Thủy (lưu vào Lõi Kho)",
  "use_save": true hoặc false,
  "save_target": "Tên người cứu (hoặc rỗng)",
  "use_poison": true hoặc false,
  "poison_target": "Tên người muốn quăng độc giết (hoặc rỗng)"
}`;

        const messages = [
            { role: 'system', content: 'Mày là Phù Thủy sắc sảo. Luôn trả về JSON.' },
            { role: 'user', content: prompt }
        ];

        const res = await this.callAI(messages, bot.vault.assignedModel, 0.7, 350);
        const parsed = this.parseJSON(res.content);

        const useSave = hasSavePotion && parsed?.use_save === true && bittenNames.length > 0;
        let saveTarget = parsed?.save_target;
        if (useSave && !bittenNames.includes(saveTarget)) {
            saveTarget = bittenNames[0];
        }

        const usePoison = hasPoisonPotion && parsed?.use_poison === true && aliveOthers.includes(parsed?.poison_target);
        const poisonTarget = usePoison ? parsed.poison_target : null;

        const deduction = parsed?.deduction || 'Tính toán kỹ nước đi với 2 bình thuốc.';
        bot.vault.commitDeduction(gameState.round, `Đêm ${gameState.round} - Phù Thủy`, deduction, res.model_used);
        bot.vault.addPrivateLog(
            gameState.round,
            `Thấy [${bittenText}] bị cắn. Quyết định: ${useSave ? `Cứu [${saveTarget}]` : 'Không cứu'}, ${usePoison ? `Quăng độc giết [${poisonTarget}]` : 'Không dùng độc'}.`
        );

        return {
            deduction,
            use_save: useSave,
            save_target: useSave ? saveTarget : null,
            use_poison: usePoison,
            poison_target: poisonTarget,
            model_used: res.model_used
        };
    }

    /**
     * 6. LỜI TRĂN TRỐI KHI BỊ TREO CỔ
     */
    async generateLastWords(bot, gameState) {
        const dualCoreContext = this.mountDualCoreContext(bot, gameState);
        const prompt = `${dualCoreContext}
Mày ("${bot.name}") vừa bị lũ trên bàn bỏ phiếu treo cổ! Lưu ý: Luật bàn chơi là KHI CHẾT KHÔNG LỘ ROLE, nên hãy chửi hoặc để lại 1-2 câu trăn trối cuối cùng cực gắt đúng chất tính cách và mục tiêu phe của mày (xưng tao - chúng mày).`;

        const messages = [
            { role: 'system', content: 'Nói lời trăn trối cay cú, gắt gỏng, đời thực.' },
            { role: 'user', content: prompt }
        ];

        const res = await this.callAI(messages, bot.vault.assignedModel, 0.9, 180);
        return res.content.replace(/["\n]/g, ' ').trim();
    }

    /**
     * 7. CHẾ ĐỘ TRÒ CHUYỆN SAU TRẬN ĐẤU (POST-GAME LOBBY CHAT - LẬT BÀI XẢ GIẬN / GÁY BẨN)
     */
    async generatePostGameSpeech(bot, gameState, winnerTeam) {
        const persona = bot.personaCore;
        const roleLabels = {
            werewolf: '🐺 Ma Sói',
            witch: '🧙‍♀️ Phù Thủy',
            bodyguard: '🛡️ Bảo Vệ',
            villager: '🧑‍🌾 Dân Làng'
        };

        // Bảng sự thật sau khi lật toàn bộ bài
        const truthTable = gameState.players.map(p => {
            const status = p.isAlive ? 'Sống sót đến cuối' : `Đã chết (${p.internalDeathCause || p.deathReason})`;
            return `- ${p.name}: Vai thật là [${roleLabels[p.role]}] • Kết cục: ${status}`;
        }).join('\n');

        const isBotWolf = (bot.role === 'werewolf');
        const didBotWin = (winnerTeam === 'werewolf' && isBotWolf) || (winnerTeam === 'village' && !isBotWolf);

        const recentTranscript = gameState.sharedPublicLogs.slice(-30).join('\n');

        const prompt = `=== PHÒNG CHAT HẬU TRƯỜNG SAU TRẬN ĐẤU (ĐÃ LẬT TOÀN BỘ BÀI!) ===
Ván Ma Sói vừa KẾT THÚC!
Kết quả chung cuộc: ${winnerTeam === 'werewolf' ? '🐺 PHE MA SÓI CHIẾN THẮNG!' : '🏆 PHE DÂN LÀNG CHIẾN THẮNG!'}

[CHÂN TƯỚNG TOÀN BỘ NGƯỜI CHƠI TRÊN BÀN SAU KHI LẬT BÀI]
${truthTable}

${persona.formatForPrompt()}

[THÔNG TIN CỦA MÀY TRONG VÁN VỪA RỒI]
- Tên mày: "${bot.name}"
- Vai thật của mày: ${roleLabels[bot.role]}
- Trạng thái của mày: ${bot.isAlive ? 'Sống sót' : `Đã chết (${bot.internalDeathCause || bot.deathReason})`}
- Phe của mày vừa: ${didBotWin ? '🎉 THẮNG CUỘC (Hả hê, gáy khét lẹt, cà khịa phe thua!)' : '💢 THUA CUỘC (Cay cú, chửi đứa bóp team / vote ngu, hoặc ấm ức vì bị giết oan!)'}
- Nhật ký đêm của mày trong ván: ${bot.vault.privateNightLogs.join(' | ') || 'Không có'}

[DIỄN BIẾN CUỐI TRẬN & CUỘC TRÒ CHUYỆN HẬU TRƯỜNG HIỆN TẠI]
${recentTranscript}

NHIỆM VỤ:
Bây giờ tất cả mọi người (cả sống lẫn chết) đang ngồi lại ở Phòng Chat Sau Trận để xả giận, gáy bẩn, bóc phốt và chửi nhau vui vẻ sau khi đã biết rõ ai là Sói, ai là Phù Thủy, ai là Bảo Vệ!
Hãy nói 1-3 câu thật tự nhiên, hài hước, cay cú hoặc gáy khét đúng với kết quả thắng/thua của mày, gọi thẳng tên những đứa liên quan (đặc biệt là phản hồi lại câu nói mới nhất trong phòng chat nếu có người vừa lên tiếng!).
Xưng "tao - mày / chúng mày", tuyệt đối không lễ phép sáo rỗng!

BẮT BUỘC TRẢ VỀ JSON:
{
  "thought": "Cảm xúc hậu trường của ${bot.name} khi nhìn lại ván đấu",
  "speech": "Câu nói xả giận / gáy bẩn / đối đáp sau trận đấu (1-3 câu)"
}`;

        const messages = [
            {
                role: 'system',
                content: 'Mày là người chơi Ma Sói vừa chơi xong 1 ván cực căng và đang ngồi ở phòng chat sau trận khi mọi lá bài đã lật ngửa. Nói chuyện đời thường, hài hước, cay cú hoặc gáy bẩn cực cháy (xưng tao-mày). Luôn trả về JSON.'
            },
            { role: 'user', content: prompt }
        ];

        const res = await this.callAI(messages, bot.vault.assignedModel, 0.92, 400);
        const parsed = this.parseJSON(res.content);

        const thought = parsed?.thought || (didBotWin ? 'Thắng sướng vãi!' : 'Cay thật sự!');
        const speech = parsed?.speech || (didBotWin
            ? 'Haha mấy con gà bị bọn tao dắt mũi xoay như chong chóng, dễ vãi chưởng!'
            : 'Cay thế nhờ! Tao đã nói rát cả họng mà tụi mày vẫn đâm đầu vote sai được, chịu luôn!');

        bot.vault.commitDeduction(gameState.round, `Hậu Trường Sau Trận`, thought, res.model_used);

        return {
            thought,
            speech,
            model_used: res.model_used
        };
    }
}

window.PERSONA_ARCHETYPES = PERSONA_ARCHETYPES;
window.PersonaCore = PersonaCore;
window.RoleDataVault = RoleDataVault;
window.aiBrain = new AIBrain();
