/// Agent NFT Module
/// Playable characters with stats, classes, and augmentations
module sui_in_space::agent {
    use std::string::String;
    use sui::event;
    use sui::package;
    use sui::display;

    // ============ Structs ============

    /// One-time witness for display
    public struct AGENT has drop {}

    /// Agent NFT representing a playable character
    public struct Agent has key, store {
        id: UID,
        name: String,
        agent_type: u8,      // 0: Human, 1: Cyborg, 2: Android, 3: Alien Synthetic
        class: u8,           // 0: Hacker, 1: Pilot, 2: MechOperator, 3: QuantumEngineer, 4: Psionic, 5: BountyAI
        
        // Core Stats (0-100 base, can exceed with augments)
        processing: u64,      // INT - affects hacking, research
        mobility: u64,        // DEX - affects piloting, evasion
        power: u64,           // STR - affects combat damage
        resilience: u64,      // VIT - affects health, resistance
        luck: u64,            // Affects critical hits, rare drops
        neural_bandwidth: u64, // Affects multi-tasking, AI control
        
        // Progression
        level: u64,
        experience: u64,
        firmware_version: u64,
        ai_model_lineage: String,
        
        // Augmentation slots (IDs of equipped augments)
        augment_slots: vector<ID>,
        max_augment_slots: u64,
        
        // Activity tracking
        missions_completed: u64,
        battles_won: u64,
        total_earnings: u64,
        
        // State
        is_staked: bool,
        staked_at: Option<ID>,
        current_mission: Option<ID>,
    }

    /// Cyber Augmentation NFT
    public struct Augmentation has key, store {
        id: UID,
        name: String,
        augment_type: u8,    // 0: Neural, 1: Optical, 2: Skeletal, 3: Dermal, 4: Cardiac, 5: Luck Matrix
        rarity: u8,          // 0: Common, 1: Uncommon, 2: Rare, 3: Epic, 4: Legendary
        
        // Stat bonuses
        processing_bonus: u64,
        mobility_bonus: u64,
        power_bonus: u64,
        resilience_bonus: u64,
        luck_bonus: u64,
        neural_bonus: u64,
        
        // Special ability (if any)
        ability_id: Option<u64>,
    }

    /// Admin capability for agent management
    public struct AgentAdminCap has key, store {
        id: UID,
    }

    // ============ Constants ============

    // Agent Types
    const AGENT_TYPE_HUMAN: u8 = 0;
    const AGENT_TYPE_CYBORG: u8 = 1;
    const AGENT_TYPE_ANDROID: u8 = 2;
    const AGENT_TYPE_ALIEN_SYNTHETIC: u8 = 3;

    // Agent Classes
    const CLASS_HACKER: u8 = 0;
    const CLASS_PILOT: u8 = 1;
    const CLASS_MECH_OPERATOR: u8 = 2;
    const CLASS_QUANTUM_ENGINEER: u8 = 3;
    const CLASS_PSIONIC: u8 = 4;
    const CLASS_BOUNTY_AI: u8 = 5;

    // Base stats per class
    const BASE_STAT: u64 = 10;
    const CLASS_BONUS: u64 = 5;

    // Progression
    const EXP_PER_LEVEL: u64 = 1000;
    const MAX_LEVEL: u64 = 100;
    const MAX_AUGMENT_SLOTS: u64 = 6;

    // ============ Errors ============

    const EInvalidAgentType: u64 = 0;
    const EInvalidClass: u64 = 1;
    const EAgentStaked: u64 = 2;
    const EAgentOnMission: u64 = 3;
    const EMaxLevelReached: u64 = 4;
    const ENoAugmentSlots: u64 = 5;
    const EAugmentAlreadyEquipped: u64 = 6;
    const EAugmentNotEquipped: u64 = 7;
    const ENotOwner: u64 = 8;

    // ============ Events ============

    public struct AgentMinted has copy, drop {
        agent_id: ID,
        owner: address,
        agent_type: u8,
        class: u8,
    }

    public struct AgentLevelUp has copy, drop {
        agent_id: ID,
        new_level: u64,
    }

    public struct AugmentationEquipped has copy, drop {
        agent_id: ID,
        augment_id: ID,
    }

    public struct AugmentationRemoved has copy, drop {
        agent_id: ID,
        augment_id: ID,
    }

    public struct ExperienceGained has copy, drop {
        agent_id: ID,
        amount: u64,
        new_total: u64,
    }

    // ============ Init ============

    fun init(witness: AGENT, ctx: &mut TxContext) {
        // Create publisher
        let publisher = package::claim(witness, ctx);

        // Create display
        let keys = vector[
            std::string::utf8(b"name"),
            std::string::utf8(b"description"),
            std::string::utf8(b"image_url"),
            std::string::utf8(b"project_url"),
        ];

        let values = vector[
            std::string::utf8(b"{name}"),
            std::string::utf8(b"A galactic agent in Sui-In-Space. Level {level} {class}."),
            std::string::utf8(b"https://sui-in-space.io/agents/{id}.png"),
            std::string::utf8(b"https://sui-in-space.io"),
        ];

        let mut display = display::new_with_fields<Agent>(
            &publisher,
            keys,
            values,
            ctx
        );

        display::update_version(&mut display);

        // Create admin cap
        let admin_cap = AgentAdminCap {
            id: object::new(ctx),
        };

        transfer::public_transfer(publisher, tx_context::sender(ctx));
        transfer::public_transfer(display, tx_context::sender(ctx));
        transfer::transfer(admin_cap, tx_context::sender(ctx));
    }

    // ============ Public Functions ============

    /// Mint a new agent
    public fun mint_agent(
        name: String,
        agent_type: u8,
        class: u8,
        ai_model_lineage: String,
        ctx: &mut TxContext
    ): Agent {
        assert!(agent_type <= AGENT_TYPE_ALIEN_SYNTHETIC, EInvalidAgentType);
        assert!(class <= CLASS_BOUNTY_AI, EInvalidClass);

        // Calculate base stats based on class
        let (processing, mobility, power, resilience, luck, neural) = 
            get_class_stats(agent_type, class);

        let agent = Agent {
            id: object::new(ctx),
            name,
            agent_type,
            class,
            processing,
            mobility,
            power,
            resilience,
            luck,
            neural_bandwidth: neural,
            level: 1,
            experience: 0,
            firmware_version: 1,
            ai_model_lineage,
            augment_slots: vector::empty(),
            max_augment_slots: 1, // Start with 1 slot, unlock more via leveling
            missions_completed: 0,
            battles_won: 0,
            total_earnings: 0,
            is_staked: false,
            staked_at: option::none(),
            current_mission: option::none(),
        };

        event::emit(AgentMinted {
            agent_id: object::id(&agent),
            owner: tx_context::sender(ctx),
            agent_type,
            class,
        });

        agent
    }

    /// Mint and transfer agent to recipient
    public entry fun mint_agent_to(
        name: String,
        agent_type: u8,
        class: u8,
        ai_model_lineage: String,
        recipient: address,
        ctx: &mut TxContext
    ) {
        let agent = mint_agent(name, agent_type, class, ai_model_lineage, ctx);
        transfer::public_transfer(agent, recipient);
    }

    /// Add experience to an agent
    public fun add_experience(agent: &mut Agent, amount: u64) {
        agent.experience = agent.experience + amount;
        
        event::emit(ExperienceGained {
            agent_id: object::id(agent),
            amount,
            new_total: agent.experience,
        });

        // Check for level up
        while (agent.experience >= agent.level * EXP_PER_LEVEL && agent.level < MAX_LEVEL) {
            level_up(agent);
        }
    }

    /// Level up an agent
    fun level_up(agent: &mut Agent) {
        agent.level = agent.level + 1;
        
        // Increase stats
        agent.processing = agent.processing + 1;
        agent.mobility = agent.mobility + 1;
        agent.power = agent.power + 1;
        agent.resilience = agent.resilience + 1;
        agent.neural_bandwidth = agent.neural_bandwidth + 1;

        // Unlock augment slots at certain levels
        if (agent.level == 10 || agent.level == 25 || 
            agent.level == 50 || agent.level == 75 || agent.level == 100) {
            if (agent.max_augment_slots < MAX_AUGMENT_SLOTS) {
                agent.max_augment_slots = agent.max_augment_slots + 1;
            }
        }

        event::emit(AgentLevelUp {
            agent_id: object::id(agent),
            new_level: agent.level,
        });
    }

    /// Upgrade firmware version
    public fun upgrade_firmware(agent: &mut Agent) {
        assert!(!agent.is_staked, EAgentStaked);
        assert!(option::is_none(&agent.current_mission), EAgentOnMission);
        
        agent.firmware_version = agent.firmware_version + 1;
        
        // Firmware upgrades provide percentage bonuses to all stats
        let bonus = agent.firmware_version * 2; // 2% per version
        agent.processing = agent.processing + (agent.processing * bonus / 100);
        agent.mobility = agent.mobility + (agent.mobility * bonus / 100);
        agent.power = agent.power + (agent.power * bonus / 100);
        agent.resilience = agent.resilience + (agent.resilience * bonus / 100);
        agent.neural_bandwidth = agent.neural_bandwidth + (agent.neural_bandwidth * bonus / 100);
    }

    /// Equip an augmentation
    public fun equip_augmentation(
        agent: &mut Agent,
        augment: Augmentation,
    ) {
        assert!(!agent.is_staked, EAgentStaked);
        assert!(vector::length(&agent.augment_slots) < agent.max_augment_slots, ENoAugmentSlots);
        
        let augment_id = object::id(&augment);
        
        // Apply stat bonuses
        agent.processing = agent.processing + augment.processing_bonus;
        agent.mobility = agent.mobility + augment.mobility_bonus;
        agent.power = agent.power + augment.power_bonus;
        agent.resilience = agent.resilience + augment.resilience_bonus;
        agent.luck = agent.luck + augment.luck_bonus;
        agent.neural_bandwidth = agent.neural_bandwidth + augment.neural_bonus;
        
        // Store augment ID
        vector::push_back(&mut agent.augment_slots, augment_id);
        
        event::emit(AugmentationEquipped {
            agent_id: object::id(agent),
            augment_id,
        });

        // Burn the augment (it's now part of the agent)
        let Augmentation { 
            id, name: _, augment_type: _, rarity: _,
            processing_bonus: _, mobility_bonus: _, power_bonus: _,
            resilience_bonus: _, luck_bonus: _, neural_bonus: _,
            ability_id: _
        } = augment;
        object::delete(id);
    }

    /// Set agent as staked
    public fun set_staked(agent: &mut Agent, station_id: ID) {
        assert!(!agent.is_staked, EAgentStaked);
        agent.is_staked = true;
        agent.staked_at = option::some(station_id);
    }

    /// Set agent as unstaked
    public fun set_unstaked(agent: &mut Agent) {
        agent.is_staked = false;
        agent.staked_at = option::none();
    }

    /// Set agent on mission
    public fun set_on_mission(agent: &mut Agent, mission_id: ID) {
        assert!(!agent.is_staked, EAgentStaked);
        assert!(option::is_none(&agent.current_mission), EAgentOnMission);
        agent.current_mission = option::some(mission_id);
    }

    /// Complete mission
    public fun complete_mission(agent: &mut Agent) {
        agent.current_mission = option::none();
        agent.missions_completed = agent.missions_completed + 1;
    }

    /// Record battle win
    public fun record_battle_win(agent: &mut Agent) {
        agent.battles_won = agent.battles_won + 1;
    }

    /// Record earnings
    public fun record_earnings(agent: &mut Agent, amount: u64) {
        agent.total_earnings = agent.total_earnings + amount;
    }

    // ============ View Functions ============

    public fun get_id(agent: &Agent): ID {
        object::id(agent)
    }

    public fun get_name(agent: &Agent): String {
        agent.name
    }

    public fun get_level(agent: &Agent): u64 {
        agent.level
    }

    public fun get_experience(agent: &Agent): u64 {
        agent.experience
    }

    public fun get_class(agent: &Agent): u8 {
        agent.class
    }

    public fun get_processing(agent: &Agent): u64 {
        agent.processing
    }

    public fun get_mobility(agent: &Agent): u64 {
        agent.mobility
    }

    public fun get_power(agent: &Agent): u64 {
        agent.power
    }

    public fun get_resilience(agent: &Agent): u64 {
        agent.resilience
    }

    public fun get_luck(agent: &Agent): u64 {
        agent.luck
    }

    public fun get_neural_bandwidth(agent: &Agent): u64 {
        agent.neural_bandwidth
    }

    public fun is_staked(agent: &Agent): bool {
        agent.is_staked
    }

    public fun is_on_mission(agent: &Agent): bool {
        option::is_some(&agent.current_mission)
    }

    /// Calculate total combat power
    public fun get_combat_power(agent: &Agent): u64 {
        (agent.power * 3 + agent.mobility * 2 + agent.resilience * 2 + agent.processing) / 8
    }

    /// Calculate yield bonus percentage (for DeFi)
    public fun get_yield_bonus(agent: &Agent): u64 {
        // Processing stat provides yield bonus
        agent.processing / 10 // 0.1% per processing point
    }

    // ============ Helper Functions ============

    /// Get base stats for agent type and class
    fun get_class_stats(agent_type: u8, class: u8): (u64, u64, u64, u64, u64, u64) {
        let mut processing = BASE_STAT;
        let mut mobility = BASE_STAT;
        let mut power = BASE_STAT;
        let mut resilience = BASE_STAT;
        let mut luck = BASE_STAT;
        let mut neural = BASE_STAT;

        // Agent type bonuses
        if (agent_type == AGENT_TYPE_CYBORG) {
            processing = processing + 3;
            resilience = resilience + 2;
        } else if (agent_type == AGENT_TYPE_ANDROID) {
            processing = processing + 3;
            mobility = mobility + 2;
        } else if (agent_type == AGENT_TYPE_ALIEN_SYNTHETIC) {
            neural = neural + 3;
            luck = luck + 2;
        };
        // Human gets balanced stats (no bonus)

        // Class bonuses
        if (class == CLASS_HACKER) {
            processing = processing + CLASS_BONUS;
        } else if (class == CLASS_PILOT) {
            mobility = mobility + CLASS_BONUS;
        } else if (class == CLASS_MECH_OPERATOR) {
            power = power + CLASS_BONUS;
        } else if (class == CLASS_QUANTUM_ENGINEER) {
            processing = processing + 3;
            resilience = resilience + 2;
        } else if (class == CLASS_PSIONIC) {
            neural = neural + CLASS_BONUS;
        } else if (class == CLASS_BOUNTY_AI) {
            processing = processing + 3;
            power = power + 2;
        };

        (processing, mobility, power, resilience, luck, neural)
    }

    // ============ Admin Functions ============

    /// Mint an augmentation (admin only)
    public fun mint_augmentation(
        _admin: &AgentAdminCap,
        name: String,
        augment_type: u8,
        rarity: u8,
        processing_bonus: u64,
        mobility_bonus: u64,
        power_bonus: u64,
        resilience_bonus: u64,
        luck_bonus: u64,
        neural_bonus: u64,
        ability_id: Option<u64>,
        ctx: &mut TxContext
    ): Augmentation {
        Augmentation {
            id: object::new(ctx),
            name,
            augment_type,
            rarity,
            processing_bonus,
            mobility_bonus,
            power_bonus,
            resilience_bonus,
            luck_bonus,
            neural_bonus,
            ability_id,
        }
    }

    // ============ Test Functions ============

    #[test_only]
    public fun init_for_testing(ctx: &mut TxContext) {
        init(AGENT {}, ctx);
    }
}
