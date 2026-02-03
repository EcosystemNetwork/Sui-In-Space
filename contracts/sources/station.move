/// Station NFT Module
/// Space stations for DeFi operations, research, and commerce
module sui_in_space::station {
    use std::string::String;
    use sui::event;
    use sui::package;
    use sui::display;
    use sui::balance::{Self, Balance};
    use sui::coin::{Self, Coin};
    use sui_in_space::galactic_token::GALACTIC_TOKEN;

    // ============ Structs ============

    /// One-time witness for display
    public struct STATION has drop {}

    /// Station NFT representing a space station
    public struct Station has key, store {
        id: UID,
        name: String,
        station_type: u8,    // 0: YieldFarm, 1: ResearchLab, 2: BlackMarket, 3: WarpGate, 4: DefensePlatform
        
        // Location
        planet_id: Option<ID>,   // If orbiting a planet
        coordinates_x: u64,
        coordinates_y: u64,
        coordinates_z: u64,
        
        // DeFi State
        staking_pool: Balance<GALACTIC_TOKEN>,
        total_staked: u64,
        yield_rate: u64,         // Basis points (100 = 1%)
        last_yield_time: u64,    // Epoch
        accumulated_yield: u64,
        
        // Operations
        operators: vector<ID>,   // Agent IDs working at station
        max_operators: u64,
        docked_ships: vector<ID>,
        max_docked: u64,
        
        // Progression
        level: u64,
        experience: u64,
        efficiency: u64,         // Percentage (100 = 100%)
        
        // Owner & Control
        owner: address,
        faction_id: Option<ID>,
        
        // State
        is_active: bool,
        under_maintenance: bool,
    }

    /// Staking receipt for tracking user stakes
    public struct StakeReceipt has key, store {
        id: UID,
        station_id: ID,
        staker: address,
        amount: u64,
        staked_at: u64,
        lock_duration: u64,      // 0 = no lock
        agent_id: Option<ID>,    // Boosting agent
    }

    /// Admin capability
    public struct StationAdminCap has key, store {
        id: UID,
    }

    // ============ Constants ============

    // Station Types
    const TYPE_YIELD_FARM: u8 = 0;
    const TYPE_RESEARCH_LAB: u8 = 1;
    const TYPE_BLACK_MARKET: u8 = 2;
    const TYPE_WARP_GATE: u8 = 3;
    const TYPE_DEFENSE_PLATFORM: u8 = 4;

    // Base values
    const BASE_YIELD_RATE: u64 = 1200;  // 12% APY in basis points
    const BASE_EFFICIENCY: u64 = 100;
    const BASE_MAX_OPERATORS: u64 = 5;
    const BASE_MAX_DOCKED: u64 = 10;

    // Lock duration bonuses (basis points)
    const LOCK_7_DAYS_BONUS: u64 = 0;
    const LOCK_30_DAYS_BONUS: u64 = 500;   // +5%
    const LOCK_90_DAYS_BONUS: u64 = 1500;  // +15%
    const LOCK_365_DAYS_BONUS: u64 = 3000; // +30%

    // ============ Errors ============

    const EInvalidStationType: u64 = 0;
    const ENotOwner: u64 = 1;
    const EStationNotActive: u64 = 2;
    const EStationUnderMaintenance: u64 = 3;
    const EMaxOperatorsReached: u64 = 4;
    const EMaxDockedReached: u64 = 5;
    const EInsufficientStake: u64 = 6;
    const ELockNotExpired: u64 = 7;
    const EInvalidLockDuration: u64 = 8;
    const ENotStaker: u64 = 9;

    // ============ Events ============

    public struct StationBuilt has copy, drop {
        station_id: ID,
        owner: address,
        station_type: u8,
    }

    public struct TokensStaked has copy, drop {
        station_id: ID,
        staker: address,
        amount: u64,
        lock_duration: u64,
    }

    public struct TokensUnstaked has copy, drop {
        station_id: ID,
        staker: address,
        amount: u64,
    }

    public struct YieldClaimed has copy, drop {
        station_id: ID,
        claimer: address,
        amount: u64,
    }

    public struct OperatorAssigned has copy, drop {
        station_id: ID,
        agent_id: ID,
    }

    public struct ShipDocked has copy, drop {
        station_id: ID,
        ship_id: ID,
    }

    public struct StationLevelUp has copy, drop {
        station_id: ID,
        new_level: u64,
    }

    // ============ Init ============

    fun init(witness: STATION, ctx: &mut TxContext) {
        let publisher = package::claim(witness, ctx);

        let keys = vector[
            std::string::utf8(b"name"),
            std::string::utf8(b"description"),
            std::string::utf8(b"image_url"),
            std::string::utf8(b"project_url"),
        ];

        let values = vector[
            std::string::utf8(b"{name}"),
            std::string::utf8(b"A space station in Sui-In-Space. Type: {station_type}, Level: {level}."),
            std::string::utf8(b"https://sui-in-space.io/stations/{id}.png"),
            std::string::utf8(b"https://sui-in-space.io"),
        ];

        let mut display = display::new_with_fields<Station>(
            &publisher,
            keys,
            values,
            ctx
        );

        display::update_version(&mut display);

        let admin_cap = StationAdminCap {
            id: object::new(ctx),
        };

        transfer::public_transfer(publisher, tx_context::sender(ctx));
        transfer::public_transfer(display, tx_context::sender(ctx));
        transfer::transfer(admin_cap, tx_context::sender(ctx));
    }

    // ============ Public Functions ============

    /// Build a new station
    public fun build_station(
        name: String,
        station_type: u8,
        planet_id: Option<ID>,
        x: u64,
        y: u64,
        z: u64,
        ctx: &mut TxContext
    ): Station {
        assert!(station_type <= TYPE_DEFENSE_PLATFORM, EInvalidStationType);

        let (yield_rate, max_ops, max_docked) = get_station_type_stats(station_type);

        let station = Station {
            id: object::new(ctx),
            name,
            station_type,
            planet_id,
            coordinates_x: x,
            coordinates_y: y,
            coordinates_z: z,
            staking_pool: balance::zero(),
            total_staked: 0,
            yield_rate,
            last_yield_time: 0,
            accumulated_yield: 0,
            operators: vector::empty(),
            max_operators: max_ops,
            docked_ships: vector::empty(),
            max_docked,
            level: 1,
            experience: 0,
            efficiency: BASE_EFFICIENCY,
            owner: tx_context::sender(ctx),
            faction_id: option::none(),
            is_active: true,
            under_maintenance: false,
        };

        event::emit(StationBuilt {
            station_id: object::id(&station),
            owner: tx_context::sender(ctx),
            station_type,
        });

        station
    }

    /// Build and transfer station to recipient
    public entry fun build_station_to(
        name: String,
        station_type: u8,
        planet_id_bytes: vector<u8>,
        x: u64,
        y: u64,
        z: u64,
        recipient: address,
        ctx: &mut TxContext
    ) {
        let planet_id = if (vector::length(&planet_id_bytes) > 0) {
            option::some(object::id_from_bytes(planet_id_bytes))
        } else {
            option::none()
        };
        
        let station = build_station(name, station_type, planet_id, x, y, z, ctx);
        transfer::public_transfer(station, recipient);
    }

    /// Stake tokens in station
    public fun stake(
        station: &mut Station,
        payment: Coin<GALACTIC_TOKEN>,
        lock_duration: u64,
        agent_id: Option<ID>,
        current_epoch: u64,
        ctx: &mut TxContext
    ): StakeReceipt {
        assert!(station.is_active, EStationNotActive);
        assert!(!station.under_maintenance, EStationUnderMaintenance);
        assert!(
            lock_duration == 0 || lock_duration == 7 || 
            lock_duration == 30 || lock_duration == 90 || lock_duration == 365,
            EInvalidLockDuration
        );

        let amount = coin::value(&payment);
        assert!(amount > 0, EInsufficientStake);

        // Add to pool
        let coin_balance = coin::into_balance(payment);
        balance::join(&mut station.staking_pool, coin_balance);
        station.total_staked = station.total_staked + amount;

        // Create receipt
        let receipt = StakeReceipt {
            id: object::new(ctx),
            station_id: object::id(station),
            staker: tx_context::sender(ctx),
            amount,
            staked_at: current_epoch,
            lock_duration,
            agent_id,
        };

        event::emit(TokensStaked {
            station_id: object::id(station),
            staker: tx_context::sender(ctx),
            amount,
            lock_duration,
        });

        // Add experience to station
        station.experience = station.experience + amount / 1000;
        check_level_up(station);

        receipt
    }

    /// Unstake tokens from station
    public fun unstake(
        station: &mut Station,
        receipt: StakeReceipt,
        current_epoch: u64,
        ctx: &mut TxContext
    ): Coin<GALACTIC_TOKEN> {
        assert!(receipt.staker == tx_context::sender(ctx), ENotStaker);
        
        // Check lock expiry
        let lock_end = receipt.staked_at + receipt.lock_duration;
        assert!(current_epoch >= lock_end, ELockNotExpired);

        let amount = receipt.amount;
        
        // Calculate yield
        let yield_amount = calculate_yield(station, &receipt, current_epoch);
        
        // Update station state
        station.total_staked = station.total_staked - amount;

        // Destroy receipt
        let StakeReceipt { id, station_id: _, staker: _, amount: _, staked_at: _, lock_duration: _, agent_id: _ } = receipt;
        object::delete(id);

        // Withdraw from pool
        let withdrawn = balance::split(&mut station.staking_pool, amount);
        let coin = coin::from_balance(withdrawn, ctx);

        event::emit(TokensUnstaked {
            station_id: object::id(station),
            staker: tx_context::sender(ctx),
            amount,
        });

        // Emit yield claimed if any
        if (yield_amount > 0) {
            event::emit(YieldClaimed {
                station_id: object::id(station),
                claimer: tx_context::sender(ctx),
                amount: yield_amount,
            });
        };

        coin
    }

    /// Assign operator (agent) to station
    public fun assign_operator(station: &mut Station, agent_id: ID, ctx: &TxContext) {
        assert!(station.owner == tx_context::sender(ctx), ENotOwner);
        assert!(vector::length(&station.operators) < station.max_operators, EMaxOperatorsReached);

        vector::push_back(&mut station.operators, agent_id);
        
        // Operators increase efficiency
        station.efficiency = station.efficiency + 5; // +5% per operator

        event::emit(OperatorAssigned {
            station_id: object::id(station),
            agent_id,
        });
    }

    /// Remove operator from station
    public fun remove_operator(station: &mut Station, agent_id: ID, ctx: &TxContext) {
        assert!(station.owner == tx_context::sender(ctx), ENotOwner);
        
        let (found, index) = vector::index_of(&station.operators, &agent_id);
        if (found) {
            vector::remove(&mut station.operators, index);
            station.efficiency = station.efficiency - 5;
        };
    }

    /// Dock ship at station
    public fun dock_ship(station: &mut Station, ship_id: ID) {
        assert!(station.is_active, EStationNotActive);
        assert!(vector::length(&station.docked_ships) < station.max_docked, EMaxDockedReached);

        vector::push_back(&mut station.docked_ships, ship_id);

        event::emit(ShipDocked {
            station_id: object::id(station),
            ship_id,
        });
    }

    /// Undock ship from station
    public fun undock_ship(station: &mut Station, ship_id: ID) {
        let (found, index) = vector::index_of(&station.docked_ships, &ship_id);
        if (found) {
            vector::remove(&mut station.docked_ships, index);
        };
    }

    /// Upgrade station level manually
    public fun upgrade_level(station: &mut Station, ctx: &TxContext) {
        assert!(station.owner == tx_context::sender(ctx), ENotOwner);
        
        station.level = station.level + 1;
        station.yield_rate = station.yield_rate + 100; // +1% per level
        station.max_operators = station.max_operators + 1;
        station.max_docked = station.max_docked + 2;

        event::emit(StationLevelUp {
            station_id: object::id(station),
            new_level: station.level,
        });
    }

    /// Set station active/inactive
    public fun set_active(station: &mut Station, active: bool, ctx: &TxContext) {
        assert!(station.owner == tx_context::sender(ctx), ENotOwner);
        station.is_active = active;
    }

    /// Set station under maintenance
    public fun set_maintenance(station: &mut Station, under_maintenance: bool, ctx: &TxContext) {
        assert!(station.owner == tx_context::sender(ctx), ENotOwner);
        station.under_maintenance = under_maintenance;
    }

    /// Set faction control
    public fun set_faction(station: &mut Station, faction_id: ID, ctx: &TxContext) {
        assert!(station.owner == tx_context::sender(ctx), ENotOwner);
        station.faction_id = option::some(faction_id);
    }

    // ============ View Functions ============

    public fun get_id(station: &Station): ID {
        object::id(station)
    }

    public fun get_name(station: &Station): String {
        station.name
    }

    public fun get_type(station: &Station): u8 {
        station.station_type
    }

    public fun get_owner(station: &Station): address {
        station.owner
    }

    public fun get_level(station: &Station): u64 {
        station.level
    }

    public fun get_total_staked(station: &Station): u64 {
        station.total_staked
    }

    public fun get_yield_rate(station: &Station): u64 {
        station.yield_rate
    }

    public fun get_efficiency(station: &Station): u64 {
        station.efficiency
    }

    public fun get_operator_count(station: &Station): u64 {
        vector::length(&station.operators)
    }

    public fun get_docked_count(station: &Station): u64 {
        vector::length(&station.docked_ships)
    }

    public fun is_active(station: &Station): bool {
        station.is_active
    }

    public fun is_under_maintenance(station: &Station): bool {
        station.under_maintenance
    }

    /// Get receipt staker
    public fun get_receipt_staker(receipt: &StakeReceipt): address {
        receipt.staker
    }

    /// Get receipt amount
    public fun get_receipt_amount(receipt: &StakeReceipt): u64 {
        receipt.amount
    }

    /// Get receipt station
    public fun get_receipt_station(receipt: &StakeReceipt): ID {
        receipt.station_id
    }

    // ============ Helper Functions ============

    /// Get stats for station type
    fun get_station_type_stats(station_type: u8): (u64, u64, u64) {
        // Returns: (yield_rate, max_operators, max_docked)
        if (station_type == TYPE_YIELD_FARM) {
            (BASE_YIELD_RATE + 300, BASE_MAX_OPERATORS + 3, BASE_MAX_DOCKED)
        } else if (station_type == TYPE_RESEARCH_LAB) {
            (BASE_YIELD_RATE, BASE_MAX_OPERATORS + 5, BASE_MAX_DOCKED / 2)
        } else if (station_type == TYPE_BLACK_MARKET) {
            (BASE_YIELD_RATE + 500, BASE_MAX_OPERATORS, BASE_MAX_DOCKED + 5)
        } else if (station_type == TYPE_WARP_GATE) {
            (BASE_YIELD_RATE / 2, BASE_MAX_OPERATORS / 2, BASE_MAX_DOCKED * 2)
        } else {
            // Defense Platform
            (BASE_YIELD_RATE / 4, BASE_MAX_OPERATORS + 2, BASE_MAX_DOCKED / 2)
        }
    }

    /// Calculate yield for a stake
    fun calculate_yield(station: &Station, receipt: &StakeReceipt, current_epoch: u64): u64 {
        let epochs_staked = current_epoch - receipt.staked_at;
        if (epochs_staked == 0) {
            return 0
        };

        // Base yield
        let mut yield_rate = station.yield_rate;
        
        // Lock duration bonus
        if (receipt.lock_duration == 30) {
            yield_rate = yield_rate + LOCK_30_DAYS_BONUS;
        } else if (receipt.lock_duration == 90) {
            yield_rate = yield_rate + LOCK_90_DAYS_BONUS;
        } else if (receipt.lock_duration == 365) {
            yield_rate = yield_rate + LOCK_365_DAYS_BONUS;
        };

        // Efficiency bonus
        yield_rate = yield_rate * station.efficiency / 100;

        // Calculate yield (simplified: yield_rate is annual, epochs ~= days)
        // yield = principal * rate * time / (365 * 10000)
        (receipt.amount * yield_rate * epochs_staked) / (365 * 10000)
    }

    /// Check and apply level up
    fun check_level_up(station: &mut Station) {
        let exp_for_next = station.level * 10000;
        if (station.experience >= exp_for_next) {
            station.level = station.level + 1;
            station.yield_rate = station.yield_rate + 100;
            
            event::emit(StationLevelUp {
                station_id: object::id(station),
                new_level: station.level,
            });
        }
    }

    // ============ Test Functions ============

    #[test_only]
    public fun init_for_testing(ctx: &mut TxContext) {
        init(STATION {}, ctx);
    }
}
