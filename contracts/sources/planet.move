/// Planet NFT Module
/// Celestial bodies for resource extraction and territory control
module sui_in_space::planet {
    use std::string::String;
    use sui::event;
    use sui::package;
    use sui::display;

    // ============ Structs ============

    /// One-time witness for display
    public struct PLANET has drop {}

    /// Planet NFT representing a celestial body
    public struct Planet has key, store {
        id: UID,
        name: String,
        planet_type: u8,     // 0: Terran, 1: Gas Giant, 2: Ice World, 3: Desert, 4: Ocean, 5: Volcanic, 6: Artificial
        
        // Location
        galaxy_id: u64,
        system_id: u64,
        coordinates_x: u64,
        coordinates_y: u64,
        coordinates_z: u64,
        
        // Resources
        primary_resource: u8,    // 0: Energy, 1: Metal, 2: Bio, 3: Fuel, 4: Quantum, 5: Dark Matter, 6: Psionic, 7: Relics
        secondary_resource: Option<u8>,
        extraction_rate: u64,    // Units per epoch
        total_reserves: u64,
        extracted_total: u64,
        
        // Population
        population: u64,
        max_population: u64,
        population_growth: u64,  // Per epoch
        
        // Control
        owner: address,
        faction_id: Option<ID>,
        
        // Infrastructure
        stations: vector<ID>,
        max_stations: u64,
        defense_level: u64,
        
        // State
        is_colonized: bool,
        last_extraction: u64,    // Epoch
        under_attack: bool,
    }

    /// Coordinates struct for planet location
    public struct Coordinates has store, copy, drop {
        galaxy: u64,
        system: u64,
        x: u64,
        y: u64,
        z: u64,
    }

    /// Admin capability
    public struct PlanetAdminCap has key, store {
        id: UID,
    }

    // ============ Constants ============

    // Planet Types
    const TYPE_TERRAN: u8 = 0;
    const TYPE_GAS_GIANT: u8 = 1;
    const TYPE_ICE_WORLD: u8 = 2;
    const TYPE_DESERT: u8 = 3;
    const TYPE_OCEAN: u8 = 4;
    const TYPE_VOLCANIC: u8 = 5;
    const TYPE_ARTIFICIAL: u8 = 6;

    // Resource Types
    const RESOURCE_ENERGY: u8 = 0;
    const RESOURCE_METAL: u8 = 1;
    const RESOURCE_BIO: u8 = 2;
    const RESOURCE_FUEL: u8 = 3;
    const RESOURCE_QUANTUM: u8 = 4;
    const RESOURCE_DARK_MATTER: u8 = 5;
    const RESOURCE_PSIONIC: u8 = 6;
    const RESOURCE_RELICS: u8 = 7;

    // Base values
    const BASE_EXTRACTION: u64 = 100;
    const BASE_POPULATION: u64 = 1000;
    const BASE_DEFENSE: u64 = 10;

    // ============ Errors ============

    const EInvalidPlanetType: u64 = 0;
    const EInvalidResource: u64 = 1;
    const ENotOwner: u64 = 2;
    const EPlanetUnderAttack: u64 = 3;
    const EMaxStationsReached: u64 = 4;
    const ENoReserves: u64 = 5;
    const EAlreadyColonized: u64 = 6;
    const ENotColonized: u64 = 7;
    const EPopulationLimit: u64 = 8;

    // ============ Events ============

    public struct PlanetDiscovered has copy, drop {
        planet_id: ID,
        discoverer: address,
        planet_type: u8,
        coordinates: Coordinates,
    }

    public struct PlanetColonized has copy, drop {
        planet_id: ID,
        colonizer: address,
    }

    public struct ResourceExtracted has copy, drop {
        planet_id: ID,
        resource_type: u8,
        amount: u64,
    }

    public struct StationBuilt has copy, drop {
        planet_id: ID,
        station_id: ID,
    }

    public struct PlanetAttacked has copy, drop {
        planet_id: ID,
        attacker: address,
    }

    public struct PlanetDefended has copy, drop {
        planet_id: ID,
        defender: address,
    }

    public struct OwnershipTransferred has copy, drop {
        planet_id: ID,
        old_owner: address,
        new_owner: address,
    }

    // ============ Init ============

    fun init(witness: PLANET, ctx: &mut TxContext) {
        let publisher = package::claim(witness, ctx);

        let keys = vector[
            std::string::utf8(b"name"),
            std::string::utf8(b"description"),
            std::string::utf8(b"image_url"),
            std::string::utf8(b"project_url"),
        ];

        let values = vector[
            std::string::utf8(b"{name}"),
            std::string::utf8(b"A planet in Sui-In-Space. Type: {planet_type}, Population: {population}."),
            std::string::utf8(b"https://sui-in-space.io/planets/{id}.png"),
            std::string::utf8(b"https://sui-in-space.io"),
        ];

        let mut display = display::new_with_fields<Planet>(
            &publisher,
            keys,
            values,
            ctx
        );

        display::update_version(&mut display);

        let admin_cap = PlanetAdminCap {
            id: object::new(ctx),
        };

        transfer::public_transfer(publisher, tx_context::sender(ctx));
        transfer::public_transfer(display, tx_context::sender(ctx));
        transfer::transfer(admin_cap, tx_context::sender(ctx));
    }

    // ============ Public Functions ============

    /// Discover a new planet (admin function for procedural generation)
    public fun discover_planet(
        _admin: &PlanetAdminCap,
        name: String,
        planet_type: u8,
        galaxy_id: u64,
        system_id: u64,
        x: u64,
        y: u64,
        z: u64,
        primary_resource: u8,
        secondary_resource: Option<u8>,
        total_reserves: u64,
        ctx: &mut TxContext
    ): Planet {
        assert!(planet_type <= TYPE_ARTIFICIAL, EInvalidPlanetType);
        assert!(primary_resource <= RESOURCE_RELICS, EInvalidResource);

        let (extraction_rate, max_pop, max_stations) = get_planet_type_stats(planet_type);

        let coordinates = Coordinates {
            galaxy: galaxy_id,
            system: system_id,
            x,
            y,
            z,
        };

        let planet = Planet {
            id: object::new(ctx),
            name,
            planet_type,
            galaxy_id,
            system_id,
            coordinates_x: x,
            coordinates_y: y,
            coordinates_z: z,
            primary_resource,
            secondary_resource,
            extraction_rate,
            total_reserves,
            extracted_total: 0,
            population: 0,
            max_population: max_pop,
            population_growth: max_pop / 100, // 1% growth per epoch
            owner: @0x0, // Unclaimed
            faction_id: option::none(),
            stations: vector::empty(),
            max_stations,
            defense_level: BASE_DEFENSE,
            is_colonized: false,
            last_extraction: 0,
            under_attack: false,
        };

        event::emit(PlanetDiscovered {
            planet_id: object::id(&planet),
            discoverer: tx_context::sender(ctx),
            planet_type,
            coordinates,
        });

        planet
    }

    /// Colonize an unclaimed planet
    public fun colonize(planet: &mut Planet, ctx: &TxContext) {
        assert!(!planet.is_colonized, EAlreadyColonized);
        
        planet.is_colonized = true;
        planet.owner = tx_context::sender(ctx);
        planet.population = BASE_POPULATION;

        event::emit(PlanetColonized {
            planet_id: object::id(planet),
            colonizer: tx_context::sender(ctx),
        });
    }

    /// Extract resources from planet
    public fun extract_resources(
        planet: &mut Planet,
        current_epoch: u64,
        ctx: &TxContext
    ): (u8, u64) {
        assert!(planet.owner == tx_context::sender(ctx), ENotOwner);
        assert!(planet.is_colonized, ENotColonized);
        assert!(!planet.under_attack, EPlanetUnderAttack);
        assert!(planet.extracted_total < planet.total_reserves, ENoReserves);

        // Calculate extraction based on time since last extraction
        let epochs_passed = if (current_epoch > planet.last_extraction) {
            current_epoch - planet.last_extraction
        } else {
            1
        };

        let mut extraction_amount = planet.extraction_rate * epochs_passed;
        
        // Apply population bonus (more workers = more extraction)
        let pop_bonus = planet.population / 1000; // 0.1% bonus per 1000 pop
        extraction_amount = extraction_amount + (extraction_amount * pop_bonus / 100);

        // Cap at remaining reserves
        let remaining = planet.total_reserves - planet.extracted_total;
        if (extraction_amount > remaining) {
            extraction_amount = remaining;
        };

        planet.extracted_total = planet.extracted_total + extraction_amount;
        planet.last_extraction = current_epoch;

        // Update population growth
        if (planet.population < planet.max_population) {
            let growth = planet.population_growth;
            let new_pop = planet.population + growth;
            if (new_pop > planet.max_population) {
                planet.population = planet.max_population;
            } else {
                planet.population = new_pop;
            };
        };

        event::emit(ResourceExtracted {
            planet_id: object::id(planet),
            resource_type: planet.primary_resource,
            amount: extraction_amount,
        });

        (planet.primary_resource, extraction_amount)
    }

    /// Add station to planet
    public fun add_station(planet: &mut Planet, station_id: ID, ctx: &TxContext) {
        assert!(planet.owner == tx_context::sender(ctx), ENotOwner);
        assert!(vector::length(&planet.stations) < planet.max_stations, EMaxStationsReached);
        
        vector::push_back(&mut planet.stations, station_id);

        event::emit(StationBuilt {
            planet_id: object::id(planet),
            station_id,
        });
    }

    /// Remove station from planet
    public fun remove_station(planet: &mut Planet, station_id: ID, ctx: &TxContext) {
        assert!(planet.owner == tx_context::sender(ctx), ENotOwner);
        
        let (found, index) = vector::index_of(&planet.stations, &station_id);
        if (found) {
            vector::remove(&mut planet.stations, index);
        };
    }

    /// Upgrade defense level
    public fun upgrade_defense(planet: &mut Planet, amount: u64, ctx: &TxContext) {
        assert!(planet.owner == tx_context::sender(ctx), ENotOwner);
        planet.defense_level = planet.defense_level + amount;
    }

    /// Set planet under attack
    public fun set_under_attack(planet: &mut Planet, under_attack: bool) {
        planet.under_attack = under_attack;
        
        if (under_attack) {
            event::emit(PlanetAttacked {
                planet_id: object::id(planet),
                attacker: @0x0, // Would need to track attacker
            });
        } else {
            event::emit(PlanetDefended {
                planet_id: object::id(planet),
                defender: planet.owner,
            });
        };
    }

    /// Transfer ownership (for conquest or sale)
    public fun transfer_ownership(planet: &mut Planet, new_owner: address, ctx: &TxContext) {
        assert!(planet.owner == tx_context::sender(ctx), ENotOwner);
        
        let old_owner = planet.owner;
        planet.owner = new_owner;

        event::emit(OwnershipTransferred {
            planet_id: object::id(planet),
            old_owner,
            new_owner,
        });
    }

    /// Set faction control
    public fun set_faction(planet: &mut Planet, faction_id: ID, ctx: &TxContext) {
        assert!(planet.owner == tx_context::sender(ctx), ENotOwner);
        planet.faction_id = option::some(faction_id);
    }

    // ============ View Functions ============

    public fun get_id(planet: &Planet): ID {
        object::id(planet)
    }

    public fun get_name(planet: &Planet): String {
        planet.name
    }

    public fun get_type(planet: &Planet): u8 {
        planet.planet_type
    }

    public fun get_owner(planet: &Planet): address {
        planet.owner
    }

    public fun get_population(planet: &Planet): u64 {
        planet.population
    }

    public fun get_max_population(planet: &Planet): u64 {
        planet.max_population
    }

    public fun get_defense_level(planet: &Planet): u64 {
        planet.defense_level
    }

    public fun get_primary_resource(planet: &Planet): u8 {
        planet.primary_resource
    }

    public fun get_extraction_rate(planet: &Planet): u64 {
        planet.extraction_rate
    }

    public fun get_remaining_reserves(planet: &Planet): u64 {
        planet.total_reserves - planet.extracted_total
    }

    public fun is_colonized(planet: &Planet): bool {
        planet.is_colonized
    }

    public fun is_under_attack(planet: &Planet): bool {
        planet.under_attack
    }

    public fun get_station_count(planet: &Planet): u64 {
        vector::length(&planet.stations)
    }

    public fun get_coordinates(planet: &Planet): Coordinates {
        Coordinates {
            galaxy: planet.galaxy_id,
            system: planet.system_id,
            x: planet.coordinates_x,
            y: planet.coordinates_y,
            z: planet.coordinates_z,
        }
    }

    /// Calculate planet value for economic purposes
    public fun get_planet_value(planet: &Planet): u64 {
        let base_value = planet.total_reserves / 100;
        let pop_value = planet.population / 10;
        let defense_value = planet.defense_level * 100;
        let station_value = vector::length(&planet.stations) * 500;
        
        base_value + pop_value + defense_value + station_value
    }

    // ============ Helper Functions ============

    /// Get stats for planet type
    fun get_planet_type_stats(planet_type: u8): (u64, u64, u64) {
        // Returns: (extraction_rate, max_population, max_stations)
        if (planet_type == TYPE_TERRAN) {
            (BASE_EXTRACTION, BASE_POPULATION * 100, 10)
        } else if (planet_type == TYPE_GAS_GIANT) {
            (BASE_EXTRACTION * 2, 0, 5) // No ground population, orbiting stations only
        } else if (planet_type == TYPE_ICE_WORLD) {
            (BASE_EXTRACTION / 2, BASE_POPULATION * 10, 5)
        } else if (planet_type == TYPE_DESERT) {
            (BASE_EXTRACTION * 3 / 2, BASE_POPULATION * 20, 7)
        } else if (planet_type == TYPE_OCEAN) {
            (BASE_EXTRACTION, BASE_POPULATION * 50, 8)
        } else if (planet_type == TYPE_VOLCANIC) {
            (BASE_EXTRACTION * 2, BASE_POPULATION * 5, 4)
        } else {
            // Artificial
            (BASE_EXTRACTION / 2, BASE_POPULATION * 200, 15)
        }
    }

    // ============ Test Functions ============

    #[test_only]
    public fun init_for_testing(ctx: &mut TxContext) {
        init(PLANET {}, ctx);
    }
}
