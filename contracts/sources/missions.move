/// Missions Module
/// PvE mission system with rewards and progression
module sui_in_space::missions {
    use std::string::String;
    use sui::event;
    use sui::balance::{Self, Balance};
    use sui::coin::{Self, Coin};
    use sui_in_space::galactic_token::GALACTIC_TOKEN;

    // ============ Structs ============

    /// Mission configuration (shared object)
    public struct MissionRegistry has key {
        id: UID,
        reward_pool: Balance<GALACTIC_TOKEN>,
        total_missions_completed: u64,
        total_rewards_distributed: u64,
        active_missions: u64,
    }

    /// Mission template defining mission parameters
    public struct MissionTemplate has key, store {
        id: UID,
        name: String,
        description: String,
        mission_type: u8,        // 0: DataHeist, 1: Espionage, 2: Smuggling, 3: AITraining, 4: Combat, 5: Exploration
        difficulty: u8,          // 1-5 stars
        
        // Requirements
        min_agent_level: u64,
        min_processing: u64,
        min_mobility: u64,
        min_power: u64,
        required_ship_class: Option<u8>,
        
        // Costs
        energy_cost: u64,
        galactic_cost: u64,
        duration_epochs: u64,
        
        // Rewards
        base_reward: u64,
        experience_reward: u64,
        loot_chance: u64,        // Percentage (0-100)
        
        // State
        is_active: bool,
        times_completed: u64,
        success_rate: u64,       // Track success rate
    }

    /// Active mission instance
    public struct ActiveMission has key, store {
        id: UID,
        template_id: ID,
        player: address,
        agent_id: ID,
        ship_id: Option<ID>,
        
        // Timing
        started_at: u64,
        ends_at: u64,
        
        // State
        status: u8,              // 0: Active, 1: Completed, 2: Failed, 3: Abandoned
        
        // Calculated outcomes (determined at start)
        will_succeed: bool,
        reward_amount: u64,
        loot_drop: bool,
    }

    /// Mission result with rewards
    public struct MissionResult has copy, drop {
        mission_id: ID,
        success: bool,
        reward: u64,
        experience: u64,
        loot_type: u8,
    }

    /// Admin capability
    public struct MissionAdminCap has key, store {
        id: UID,
    }

    // ============ Constants ============

    // Mission Types
    const TYPE_DATA_HEIST: u8 = 0;
    const TYPE_ESPIONAGE: u8 = 1;
    const TYPE_SMUGGLING: u8 = 2;
    const TYPE_AI_TRAINING: u8 = 3;
    const TYPE_COMBAT: u8 = 4;
    const TYPE_EXPLORATION: u8 = 5;

    // Mission Status
    const STATUS_ACTIVE: u8 = 0;
    const STATUS_COMPLETED: u8 = 1;
    const STATUS_FAILED: u8 = 2;
    const STATUS_ABANDONED: u8 = 3;

    // Base values
    const BASE_SUCCESS_RATE: u64 = 70;
    const BASE_REWARD_MULTIPLIER: u64 = 100;

    // ============ Errors ============

    const EMissionNotActive: u64 = 0;
    const EAgentNotEligible: u64 = 1;
    const EShipNotEligible: u64 = 2;
    const EInsufficientEnergy: u64 = 3;
    const EInsufficientFunds: u64 = 4;
    const EMissionNotComplete: u64 = 5;
    const EMissionAlreadyComplete: u64 = 6;
    const ENotMissionOwner: u64 = 7;
    const EMissionStillActive: u64 = 8;
    const EInvalidDifficulty: u64 = 9;

    // ============ Events ============

    public struct MissionStarted has copy, drop {
        mission_id: ID,
        template_id: ID,
        player: address,
        agent_id: ID,
    }

    public struct MissionCompleted has copy, drop {
        mission_id: ID,
        player: address,
        success: bool,
        reward: u64,
    }

    public struct MissionAbandoned has copy, drop {
        mission_id: ID,
        player: address,
    }

    public struct MissionTemplateCreated has copy, drop {
        template_id: ID,
        name: String,
        mission_type: u8,
        difficulty: u8,
    }

    // ============ Init ============

    fun init(ctx: &mut TxContext) {
        // Create registry
        let registry = MissionRegistry {
            id: object::new(ctx),
            reward_pool: balance::zero(),
            total_missions_completed: 0,
            total_rewards_distributed: 0,
            active_missions: 0,
        };

        // Create admin cap
        let admin_cap = MissionAdminCap {
            id: object::new(ctx),
        };

        transfer::share_object(registry);
        transfer::transfer(admin_cap, tx_context::sender(ctx));
    }

    // ============ Admin Functions ============

    /// Create a new mission template
    public fun create_mission_template(
        _admin: &MissionAdminCap,
        name: String,
        description: String,
        mission_type: u8,
        difficulty: u8,
        min_agent_level: u64,
        min_processing: u64,
        min_mobility: u64,
        min_power: u64,
        required_ship_class: Option<u8>,
        energy_cost: u64,
        galactic_cost: u64,
        duration_epochs: u64,
        base_reward: u64,
        experience_reward: u64,
        loot_chance: u64,
        ctx: &mut TxContext
    ): MissionTemplate {
        assert!(difficulty >= 1 && difficulty <= 5, EInvalidDifficulty);

        let template = MissionTemplate {
            id: object::new(ctx),
            name,
            description,
            mission_type,
            difficulty,
            min_agent_level,
            min_processing,
            min_mobility,
            min_power,
            required_ship_class,
            energy_cost,
            galactic_cost,
            duration_epochs,
            base_reward,
            experience_reward,
            loot_chance,
            is_active: true,
            times_completed: 0,
            success_rate: BASE_SUCCESS_RATE,
        };

        event::emit(MissionTemplateCreated {
            template_id: object::id(&template),
            name: template.name,
            mission_type,
            difficulty,
        });

        template
    }

    /// Fund the mission reward pool
    public fun fund_reward_pool(
        registry: &mut MissionRegistry,
        payment: Coin<GALACTIC_TOKEN>,
    ) {
        balance::join(&mut registry.reward_pool, coin::into_balance(payment));
    }

    /// Set mission template active state
    public fun set_template_active(
        _admin: &MissionAdminCap,
        template: &mut MissionTemplate,
        active: bool
    ) {
        template.is_active = active;
    }

    // ============ Player Functions ============

    /// Start a mission
    public fun start_mission(
        registry: &mut MissionRegistry,
        template: &MissionTemplate,
        agent_id: ID,
        ship_id: Option<ID>,
        agent_level: u64,
        agent_processing: u64,
        agent_mobility: u64,
        agent_power: u64,
        agent_luck: u64,
        payment: Coin<GALACTIC_TOKEN>,
        current_epoch: u64,
        random_seed: u64,
        ctx: &mut TxContext
    ): ActiveMission {
        assert!(template.is_active, EMissionNotActive);
        assert!(agent_level >= template.min_agent_level, EAgentNotEligible);
        assert!(agent_processing >= template.min_processing, EAgentNotEligible);
        assert!(agent_mobility >= template.min_mobility, EAgentNotEligible);
        assert!(agent_power >= template.min_power, EAgentNotEligible);
        
        let cost = coin::value(&payment);
        assert!(cost >= template.galactic_cost, EInsufficientFunds);

        // Add payment to pool
        balance::join(&mut registry.reward_pool, coin::into_balance(payment));

        // Calculate success chance based on agent stats
        let mut success_chance = calculate_success_chance(
            template,
            agent_level,
            agent_processing,
            agent_mobility,
            agent_power,
            agent_luck
        );

        // Determine outcome (pseudo-random using seed and on-chain data)
        let random_value = (random_seed + current_epoch + (agent_luck as u64)) % 100;
        let will_succeed = random_value < success_chance;

        // Calculate reward (with variance)
        let reward_variance = (random_seed % 20) + 90; // 90-110% variance
        let reward_amount = if (will_succeed) {
            (template.base_reward * reward_variance) / 100
        } else {
            template.base_reward / 4 // 25% consolation reward on failure
        };

        // Determine loot drop
        let loot_random = (random_seed + agent_luck) % 100;
        let loot_drop = will_succeed && (loot_random < template.loot_chance);

        let mission = ActiveMission {
            id: object::new(ctx),
            template_id: object::id(template),
            player: tx_context::sender(ctx),
            agent_id,
            ship_id,
            started_at: current_epoch,
            ends_at: current_epoch + template.duration_epochs,
            status: STATUS_ACTIVE,
            will_succeed,
            reward_amount,
            loot_drop,
        };

        registry.active_missions = registry.active_missions + 1;

        event::emit(MissionStarted {
            mission_id: object::id(&mission),
            template_id: object::id(template),
            player: tx_context::sender(ctx),
            agent_id,
        });

        mission
    }

    /// Complete a mission and claim rewards
    public fun complete_mission(
        registry: &mut MissionRegistry,
        template: &mut MissionTemplate,
        mission: ActiveMission,
        current_epoch: u64,
        ctx: &mut TxContext
    ): (Coin<GALACTIC_TOKEN>, MissionResult) {
        assert!(mission.player == tx_context::sender(ctx), ENotMissionOwner);
        assert!(mission.status == STATUS_ACTIVE, EMissionAlreadyComplete);
        assert!(current_epoch >= mission.ends_at, EMissionStillActive);

        let success = mission.will_succeed;
        let reward_amount = mission.reward_amount;

        // Update template stats
        template.times_completed = template.times_completed + 1;
        if (success) {
            // Update success rate (moving average)
            template.success_rate = (template.success_rate * 9 + 100) / 10;
        } else {
            template.success_rate = (template.success_rate * 9) / 10;
        };

        // Update registry
        registry.total_missions_completed = registry.total_missions_completed + 1;
        registry.total_rewards_distributed = registry.total_rewards_distributed + reward_amount;
        registry.active_missions = registry.active_missions - 1;

        // Create result
        let result = MissionResult {
            mission_id: object::id(&mission),
            success,
            reward: reward_amount,
            experience: template.experience_reward,
            loot_type: if (mission.loot_drop) { 1 } else { 0 },
        };

        // Destroy mission
        let ActiveMission { 
            id, template_id: _, player: _, agent_id: _, ship_id: _,
            started_at: _, ends_at: _, status: _, will_succeed: _,
            reward_amount: _, loot_drop: _
        } = mission;
        object::delete(id);

        // Withdraw reward
        let reward_coin = coin::from_balance(
            balance::split(&mut registry.reward_pool, reward_amount),
            ctx
        );

        event::emit(MissionCompleted {
            mission_id: object::uid_to_inner(&id),
            player: tx_context::sender(ctx),
            success,
            reward: reward_amount,
        });

        (reward_coin, result)
    }

    /// Abandon a mission (no rewards)
    public fun abandon_mission(
        registry: &mut MissionRegistry,
        mission: ActiveMission,
        ctx: &TxContext
    ) {
        assert!(mission.player == tx_context::sender(ctx), ENotMissionOwner);
        assert!(mission.status == STATUS_ACTIVE, EMissionAlreadyComplete);

        registry.active_missions = registry.active_missions - 1;

        event::emit(MissionAbandoned {
            mission_id: object::id(&mission),
            player: tx_context::sender(ctx),
        });

        // Destroy mission
        let ActiveMission { 
            id, template_id: _, player: _, agent_id: _, ship_id: _,
            started_at: _, ends_at: _, status: _, will_succeed: _,
            reward_amount: _, loot_drop: _
        } = mission;
        object::delete(id);
    }

    // ============ View Functions ============

    public fun get_registry_stats(registry: &MissionRegistry): (u64, u64, u64) {
        (
            registry.total_missions_completed,
            registry.total_rewards_distributed,
            registry.active_missions
        )
    }

    public fun get_reward_pool_balance(registry: &MissionRegistry): u64 {
        balance::value(&registry.reward_pool)
    }

    public fun get_template_name(template: &MissionTemplate): String {
        template.name
    }

    public fun get_template_difficulty(template: &MissionTemplate): u8 {
        template.difficulty
    }

    public fun get_template_requirements(template: &MissionTemplate): (u64, u64, u64, u64) {
        (
            template.min_agent_level,
            template.min_processing,
            template.min_mobility,
            template.min_power
        )
    }

    public fun get_template_costs(template: &MissionTemplate): (u64, u64, u64) {
        (template.energy_cost, template.galactic_cost, template.duration_epochs)
    }

    public fun get_template_rewards(template: &MissionTemplate): (u64, u64, u64) {
        (template.base_reward, template.experience_reward, template.loot_chance)
    }

    public fun is_template_active(template: &MissionTemplate): bool {
        template.is_active
    }

    public fun get_mission_player(mission: &ActiveMission): address {
        mission.player
    }

    public fun get_mission_status(mission: &ActiveMission): u8 {
        mission.status
    }

    public fun get_mission_end_time(mission: &ActiveMission): u64 {
        mission.ends_at
    }

    public fun is_mission_complete(mission: &ActiveMission, current_epoch: u64): bool {
        current_epoch >= mission.ends_at
    }

    // ============ Helper Functions ============

    /// Calculate success chance based on agent stats vs mission requirements
    fun calculate_success_chance(
        template: &MissionTemplate,
        agent_level: u64,
        agent_processing: u64,
        agent_mobility: u64,
        agent_power: u64,
        agent_luck: u64
    ): u64 {
        let mut base_chance = BASE_SUCCESS_RATE;

        // Level bonus
        if (agent_level > template.min_agent_level) {
            let level_bonus = (agent_level - template.min_agent_level) * 2;
            base_chance = base_chance + level_bonus;
        };

        // Stat bonuses
        if (agent_processing > template.min_processing) {
            base_chance = base_chance + (agent_processing - template.min_processing) / 2;
        };
        if (agent_mobility > template.min_mobility) {
            base_chance = base_chance + (agent_mobility - template.min_mobility) / 2;
        };
        if (agent_power > template.min_power) {
            base_chance = base_chance + (agent_power - template.min_power) / 2;
        };

        // Luck bonus
        base_chance = base_chance + agent_luck / 5;

        // Difficulty penalty
        let difficulty_penalty = ((template.difficulty - 1) as u64) * 10;
        if (base_chance > difficulty_penalty) {
            base_chance = base_chance - difficulty_penalty;
        } else {
            base_chance = 10; // Minimum 10% chance
        };

        // Cap at 95%
        if (base_chance > 95) {
            base_chance = 95;
        };

        base_chance
    }

    // ============ Test Functions ============

    #[test_only]
    public fun init_for_testing(ctx: &mut TxContext) {
        init(ctx);
    }
}
