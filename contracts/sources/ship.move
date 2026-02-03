/// Ship NFT Module
/// Modular spacecraft with upgradeable slots and equipment
module sui_in_space::ship {
    use std::string::String;
    use sui::event;
    use sui::package;
    use sui::display;

    // ============ Structs ============

    /// One-time witness for display
    public struct SHIP has drop {}

    /// Ship NFT representing a modular spacecraft
    public struct Ship has key, store {
        id: UID,
        name: String,
        ship_class: u8,      // 0: Scout, 1: Fighter, 2: Freighter, 3: Cruiser, 4: Battleship, 5: Carrier, 6: Dreadnought
        
        // Module Slots (IDs of equipped modules)
        hull: Option<ID>,
        engine: Option<ID>,
        ai_core: Option<ID>,
        weapon: Option<ID>,
        utility: Option<ID>,
        
        // Computed Stats
        max_health: u64,
        current_health: u64,
        speed: u64,
        firepower: u64,
        cargo_capacity: u64,
        fuel_efficiency: u64,
        
        // Crew
        pilot: Option<ID>,
        crew: vector<ID>,
        max_crew: u64,
        
        // State
        is_docked: bool,
        docked_at: Option<ID>,
        in_combat: bool,
        fuel: u64,
        max_fuel: u64,
    }

    /// Hull Module
    public struct Hull has key, store {
        id: UID,
        name: String,
        rarity: u8,
        health_bonus: u64,
        armor_class: u64,
        weight: u64,
    }

    /// Engine Module
    public struct Engine has key, store {
        id: UID,
        name: String,
        rarity: u8,
        speed_bonus: u64,
        fuel_efficiency: u64,
        maneuverability: u64,
    }

    /// AI Core Module
    public struct AICore has key, store {
        id: UID,
        name: String,
        rarity: u8,
        level: u64,
        auto_pilot_bonus: u64,
        combat_ai_bonus: u64,
        yield_bonus: u64,
    }

    /// Weapon Module
    public struct Weapon has key, store {
        id: UID,
        name: String,
        weapon_type: u8,     // 0: Laser, 1: Missile, 2: Plasma, 3: Railgun, 4: Ion
        rarity: u8,
        damage: u64,
        fire_rate: u64,
        range: u64,
        energy_cost: u64,
    }

    /// Utility Module
    public struct Utility has key, store {
        id: UID,
        name: String,
        utility_type: u8,    // 0: Shield, 1: Scanner, 2: Stealth, 3: Cargo, 4: Repair
        rarity: u8,
        effectiveness: u64,
        energy_cost: u64,
    }

    /// Admin capability
    public struct ShipAdminCap has key, store {
        id: UID,
    }

    // ============ Constants ============

    // Ship Classes
    const CLASS_SCOUT: u8 = 0;
    const CLASS_FIGHTER: u8 = 1;
    const CLASS_FREIGHTER: u8 = 2;
    const CLASS_CRUISER: u8 = 3;
    const CLASS_BATTLESHIP: u8 = 4;
    const CLASS_CARRIER: u8 = 5;
    const CLASS_DREADNOUGHT: u8 = 6;

    // Base stats per class
    const BASE_HEALTH: u64 = 100;
    const BASE_SPEED: u64 = 50;
    const BASE_FIREPOWER: u64 = 10;
    const BASE_CARGO: u64 = 50;
    const BASE_FUEL: u64 = 100;

    // ============ Errors ============

    const EInvalidShipClass: u64 = 0;
    const EShipDocked: u64 = 1;
    const EShipInCombat: u64 = 2;
    const ESlotOccupied: u64 = 3;
    const ESlotEmpty: u64 = 4;
    const EInsufficientFuel: u64 = 5;
    const EShipDamaged: u64 = 6;
    const ECrewFull: u64 = 7;
    const ENotDocked: u64 = 8;

    // ============ Events ============

    public struct ShipBuilt has copy, drop {
        ship_id: ID,
        owner: address,
        ship_class: u8,
    }

    public struct ModuleEquipped has copy, drop {
        ship_id: ID,
        slot: String,
        module_id: ID,
    }

    public struct ModuleRemoved has copy, drop {
        ship_id: ID,
        slot: String,
        module_id: ID,
    }

    public struct ShipDamaged has copy, drop {
        ship_id: ID,
        damage: u64,
        remaining_health: u64,
    }

    public struct ShipRepaired has copy, drop {
        ship_id: ID,
        amount: u64,
        new_health: u64,
    }

    public struct ShipDocked has copy, drop {
        ship_id: ID,
        station_id: ID,
    }

    public struct ShipUndocked has copy, drop {
        ship_id: ID,
    }

    // ============ Init ============

    fun init(witness: SHIP, ctx: &mut TxContext) {
        let publisher = package::claim(witness, ctx);

        let keys = vector[
            std::string::utf8(b"name"),
            std::string::utf8(b"description"),
            std::string::utf8(b"image_url"),
            std::string::utf8(b"project_url"),
        ];

        let values = vector[
            std::string::utf8(b"{name}"),
            std::string::utf8(b"A modular spacecraft in Sui-In-Space. Class: {ship_class}."),
            std::string::utf8(b"https://sui-in-space.io/ships/{id}.png"),
            std::string::utf8(b"https://sui-in-space.io"),
        ];

        let mut display = display::new_with_fields<Ship>(
            &publisher,
            keys,
            values,
            ctx
        );

        display::update_version(&mut display);

        let admin_cap = ShipAdminCap {
            id: object::new(ctx),
        };

        transfer::public_transfer(publisher, tx_context::sender(ctx));
        transfer::public_transfer(display, tx_context::sender(ctx));
        transfer::transfer(admin_cap, tx_context::sender(ctx));
    }

    // ============ Public Functions ============

    /// Build a new ship
    public fun build_ship(
        name: String,
        ship_class: u8,
        ctx: &mut TxContext
    ): Ship {
        assert!(ship_class <= CLASS_DREADNOUGHT, EInvalidShipClass);

        let (health, speed, firepower, cargo, fuel, max_crew) = get_class_stats(ship_class);

        let ship = Ship {
            id: object::new(ctx),
            name,
            ship_class,
            hull: option::none(),
            engine: option::none(),
            ai_core: option::none(),
            weapon: option::none(),
            utility: option::none(),
            max_health: health,
            current_health: health,
            speed,
            firepower,
            cargo_capacity: cargo,
            fuel_efficiency: 100,
            pilot: option::none(),
            crew: vector::empty(),
            max_crew,
            is_docked: false,
            docked_at: option::none(),
            in_combat: false,
            fuel,
            max_fuel: fuel,
        };

        event::emit(ShipBuilt {
            ship_id: object::id(&ship),
            owner: tx_context::sender(ctx),
            ship_class,
        });

        ship
    }

    /// Build and transfer ship to recipient
    public entry fun build_ship_to(
        name: String,
        ship_class: u8,
        recipient: address,
        ctx: &mut TxContext
    ) {
        let ship = build_ship(name, ship_class, ctx);
        transfer::public_transfer(ship, recipient);
    }

    /// Equip hull module
    public fun equip_hull(ship: &mut Ship, hull: Hull) {
        assert!(!ship.in_combat, EShipInCombat);
        assert!(option::is_none(&ship.hull), ESlotOccupied);

        let hull_id = object::id(&hull);
        
        // Apply bonuses
        ship.max_health = ship.max_health + hull.health_bonus;
        ship.current_health = ship.current_health + hull.health_bonus;
        
        ship.hull = option::some(hull_id);

        event::emit(ModuleEquipped {
            ship_id: object::id(ship),
            slot: std::string::utf8(b"hull"),
            module_id: hull_id,
        });

        // Consume the module
        let Hull { id, name: _, rarity: _, health_bonus: _, armor_class: _, weight: _ } = hull;
        object::delete(id);
    }

    /// Equip engine module
    public fun equip_engine(ship: &mut Ship, engine: Engine) {
        assert!(!ship.in_combat, EShipInCombat);
        assert!(option::is_none(&ship.engine), ESlotOccupied);

        let engine_id = object::id(&engine);
        
        // Apply bonuses
        ship.speed = ship.speed + engine.speed_bonus;
        ship.fuel_efficiency = ship.fuel_efficiency + engine.fuel_efficiency;
        
        ship.engine = option::some(engine_id);

        event::emit(ModuleEquipped {
            ship_id: object::id(ship),
            slot: std::string::utf8(b"engine"),
            module_id: engine_id,
        });

        let Engine { id, name: _, rarity: _, speed_bonus: _, fuel_efficiency: _, maneuverability: _ } = engine;
        object::delete(id);
    }

    /// Equip AI core module
    public fun equip_ai_core(ship: &mut Ship, ai_core: AICore) {
        assert!(!ship.in_combat, EShipInCombat);
        assert!(option::is_none(&ship.ai_core), ESlotOccupied);

        let ai_core_id = object::id(&ai_core);
        ship.ai_core = option::some(ai_core_id);

        event::emit(ModuleEquipped {
            ship_id: object::id(ship),
            slot: std::string::utf8(b"ai_core"),
            module_id: ai_core_id,
        });

        let AICore { id, name: _, rarity: _, level: _, auto_pilot_bonus: _, combat_ai_bonus: _, yield_bonus: _ } = ai_core;
        object::delete(id);
    }

    /// Equip weapon module
    public fun equip_weapon(ship: &mut Ship, weapon: Weapon) {
        assert!(!ship.in_combat, EShipInCombat);
        assert!(option::is_none(&ship.weapon), ESlotOccupied);

        let weapon_id = object::id(&weapon);
        
        // Apply bonuses
        ship.firepower = ship.firepower + weapon.damage;
        
        ship.weapon = option::some(weapon_id);

        event::emit(ModuleEquipped {
            ship_id: object::id(ship),
            slot: std::string::utf8(b"weapon"),
            module_id: weapon_id,
        });

        let Weapon { id, name: _, weapon_type: _, rarity: _, damage: _, fire_rate: _, range: _, energy_cost: _ } = weapon;
        object::delete(id);
    }

    /// Equip utility module
    public fun equip_utility(ship: &mut Ship, utility: Utility) {
        assert!(!ship.in_combat, EShipInCombat);
        assert!(option::is_none(&ship.utility), ESlotOccupied);

        let utility_id = object::id(&utility);
        ship.utility = option::some(utility_id);

        event::emit(ModuleEquipped {
            ship_id: object::id(ship),
            slot: std::string::utf8(b"utility"),
            module_id: utility_id,
        });

        let Utility { id, name: _, utility_type: _, rarity: _, effectiveness: _, energy_cost: _ } = utility;
        object::delete(id);
    }

    /// Take damage
    public fun take_damage(ship: &mut Ship, damage: u64) {
        if (damage >= ship.current_health) {
            ship.current_health = 0;
        } else {
            ship.current_health = ship.current_health - damage;
        };

        event::emit(ShipDamaged {
            ship_id: object::id(ship),
            damage,
            remaining_health: ship.current_health,
        });
    }

    /// Repair ship
    public fun repair(ship: &mut Ship, amount: u64) {
        assert!(ship.is_docked, ENotDocked);
        
        let new_health = ship.current_health + amount;
        if (new_health > ship.max_health) {
            ship.current_health = ship.max_health;
        } else {
            ship.current_health = new_health;
        };

        event::emit(ShipRepaired {
            ship_id: object::id(ship),
            amount,
            new_health: ship.current_health,
        });
    }

    /// Dock at station
    public fun dock(ship: &mut Ship, station_id: ID) {
        assert!(!ship.in_combat, EShipInCombat);
        assert!(!ship.is_docked, EShipDocked);
        
        ship.is_docked = true;
        ship.docked_at = option::some(station_id);

        event::emit(ShipDocked {
            ship_id: object::id(ship),
            station_id,
        });
    }

    /// Undock from station
    public fun undock(ship: &mut Ship) {
        assert!(ship.is_docked, ENotDocked);
        
        ship.is_docked = false;
        ship.docked_at = option::none();

        event::emit(ShipUndocked {
            ship_id: object::id(ship),
        });
    }

    /// Consume fuel for travel
    public fun consume_fuel(ship: &mut Ship, amount: u64) {
        assert!(ship.fuel >= amount, EInsufficientFuel);
        ship.fuel = ship.fuel - amount;
    }

    /// Refuel ship
    public fun refuel(ship: &mut Ship, amount: u64) {
        let new_fuel = ship.fuel + amount;
        if (new_fuel > ship.max_fuel) {
            ship.fuel = ship.max_fuel;
        } else {
            ship.fuel = new_fuel;
        };
    }

    /// Set combat state
    public fun set_in_combat(ship: &mut Ship, in_combat: bool) {
        ship.in_combat = in_combat;
    }

    /// Assign pilot
    public fun assign_pilot(ship: &mut Ship, agent_id: ID) {
        ship.pilot = option::some(agent_id);
    }

    /// Remove pilot
    public fun remove_pilot(ship: &mut Ship) {
        ship.pilot = option::none();
    }

    /// Add crew member
    public fun add_crew(ship: &mut Ship, agent_id: ID) {
        assert!(vector::length(&ship.crew) < ship.max_crew, ECrewFull);
        vector::push_back(&mut ship.crew, agent_id);
    }

    // ============ View Functions ============

    public fun get_id(ship: &Ship): ID {
        object::id(ship)
    }

    public fun get_name(ship: &Ship): String {
        ship.name
    }

    public fun get_class(ship: &Ship): u8 {
        ship.ship_class
    }

    public fun get_max_health(ship: &Ship): u64 {
        ship.max_health
    }

    public fun get_current_health(ship: &Ship): u64 {
        ship.current_health
    }

    public fun get_speed(ship: &Ship): u64 {
        ship.speed
    }

    public fun get_firepower(ship: &Ship): u64 {
        ship.firepower
    }

    public fun get_cargo_capacity(ship: &Ship): u64 {
        ship.cargo_capacity
    }

    public fun get_fuel(ship: &Ship): u64 {
        ship.fuel
    }

    public fun is_docked(ship: &Ship): bool {
        ship.is_docked
    }

    public fun is_in_combat(ship: &Ship): bool {
        ship.in_combat
    }

    public fun is_destroyed(ship: &Ship): bool {
        ship.current_health == 0
    }

    /// Calculate total combat rating
    public fun get_combat_rating(ship: &Ship): u64 {
        (ship.max_health / 10) + (ship.firepower * 2) + (ship.speed / 5)
    }

    // ============ Helper Functions ============

    /// Get base stats for ship class
    fun get_class_stats(ship_class: u8): (u64, u64, u64, u64, u64, u64) {
        if (ship_class == CLASS_SCOUT) {
            (BASE_HEALTH, BASE_SPEED + 30, BASE_FIREPOWER, BASE_CARGO, BASE_FUEL, 1)
        } else if (ship_class == CLASS_FIGHTER) {
            (BASE_HEALTH + 50, BASE_SPEED + 20, BASE_FIREPOWER + 20, BASE_CARGO - 20, BASE_FUEL, 1)
        } else if (ship_class == CLASS_FREIGHTER) {
            (BASE_HEALTH + 100, BASE_SPEED - 10, BASE_FIREPOWER - 5, BASE_CARGO + 200, BASE_FUEL + 50, 3)
        } else if (ship_class == CLASS_CRUISER) {
            (BASE_HEALTH + 200, BASE_SPEED, BASE_FIREPOWER + 30, BASE_CARGO + 50, BASE_FUEL + 50, 5)
        } else if (ship_class == CLASS_BATTLESHIP) {
            (BASE_HEALTH + 400, BASE_SPEED - 20, BASE_FIREPOWER + 50, BASE_CARGO + 100, BASE_FUEL + 100, 8)
        } else if (ship_class == CLASS_CARRIER) {
            (BASE_HEALTH + 300, BASE_SPEED - 10, BASE_FIREPOWER + 10, BASE_CARGO + 300, BASE_FUEL + 150, 10)
        } else {
            // Dreadnought
            (BASE_HEALTH + 600, BASE_SPEED - 30, BASE_FIREPOWER + 80, BASE_CARGO + 200, BASE_FUEL + 200, 15)
        }
    }

    // ============ Admin Functions ============

    /// Mint hull module
    public fun mint_hull(
        _admin: &ShipAdminCap,
        name: String,
        rarity: u8,
        health_bonus: u64,
        armor_class: u64,
        weight: u64,
        ctx: &mut TxContext
    ): Hull {
        Hull {
            id: object::new(ctx),
            name,
            rarity,
            health_bonus,
            armor_class,
            weight,
        }
    }

    /// Mint engine module
    public fun mint_engine(
        _admin: &ShipAdminCap,
        name: String,
        rarity: u8,
        speed_bonus: u64,
        fuel_efficiency: u64,
        maneuverability: u64,
        ctx: &mut TxContext
    ): Engine {
        Engine {
            id: object::new(ctx),
            name,
            rarity,
            speed_bonus,
            fuel_efficiency,
            maneuverability,
        }
    }

    /// Mint AI core module
    public fun mint_ai_core(
        _admin: &ShipAdminCap,
        name: String,
        rarity: u8,
        level: u64,
        auto_pilot_bonus: u64,
        combat_ai_bonus: u64,
        yield_bonus: u64,
        ctx: &mut TxContext
    ): AICore {
        AICore {
            id: object::new(ctx),
            name,
            rarity,
            level,
            auto_pilot_bonus,
            combat_ai_bonus,
            yield_bonus,
        }
    }

    /// Mint weapon module
    public fun mint_weapon(
        _admin: &ShipAdminCap,
        name: String,
        weapon_type: u8,
        rarity: u8,
        damage: u64,
        fire_rate: u64,
        range: u64,
        energy_cost: u64,
        ctx: &mut TxContext
    ): Weapon {
        Weapon {
            id: object::new(ctx),
            name,
            weapon_type,
            rarity,
            damage,
            fire_rate,
            range,
            energy_cost,
        }
    }

    /// Mint utility module
    public fun mint_utility(
        _admin: &ShipAdminCap,
        name: String,
        utility_type: u8,
        rarity: u8,
        effectiveness: u64,
        energy_cost: u64,
        ctx: &mut TxContext
    ): Utility {
        Utility {
            id: object::new(ctx),
            name,
            utility_type,
            rarity,
            effectiveness,
            energy_cost,
        }
    }

    // ============ Test Functions ============

    #[test_only]
    public fun init_for_testing(ctx: &mut TxContext) {
        init(SHIP {}, ctx);
    }
}
