/// Code Registry Module
/// Stores the Merkle root of game rules configs on-chain.
/// All clients verify their local rules match this root before playing.
module sui_in_space::code_registry {
    use sui::event;

    // ============ Structs ============

    /// Shared object storing the current code Merkle root
    public struct CodeRegistry has key {
        id: UID,
        merkle_root: vector<u8>,   // SHA256 root hash (32 bytes)
        version: u64,              // Increments on each update
        last_updated_epoch: u64,
    }

    /// Admin capability for updating the root
    public struct RegistryAdminCap has key, store { id: UID }

    // ============ Events ============

    public struct RootUpdated has copy, drop {
        new_root: vector<u8>,
        version: u64,
        epoch: u64,
    }

    // ============ Init ============

    fun init(ctx: &mut TxContext) {
        let registry = CodeRegistry {
            id: object::new(ctx),
            merkle_root: vector::empty(),
            version: 0,
            last_updated_epoch: 0,
        };

        let admin_cap = RegistryAdminCap {
            id: object::new(ctx),
        };

        transfer::share_object(registry);
        transfer::transfer(admin_cap, tx_context::sender(ctx));
    }

    // ============ Public Functions ============

    /// Update the Merkle root (after governance approval)
    public entry fun update_root(
        _admin: &RegistryAdminCap,
        registry: &mut CodeRegistry,
        new_root: vector<u8>,
        epoch: u64,
    ) {
        registry.merkle_root = new_root;
        registry.version = registry.version + 1;
        registry.last_updated_epoch = epoch;

        event::emit(RootUpdated {
            new_root: registry.merkle_root,
            version: registry.version,
            epoch,
        });
    }

    // ============ View Functions ============

    public fun get_root(registry: &CodeRegistry): vector<u8> {
        registry.merkle_root
    }

    public fun get_version(registry: &CodeRegistry): u64 {
        registry.version
    }

    public fun get_last_updated_epoch(registry: &CodeRegistry): u64 {
        registry.last_updated_epoch
    }

    // ============ Test Functions ============

    #[test_only]
    public fun init_for_testing(ctx: &mut TxContext) {
        init(ctx);
    }
}
