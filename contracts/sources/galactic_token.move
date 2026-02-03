/// GALACTIC Token Module
/// The native token for the Sui-In-Space galactic economy
module sui_in_space::galactic_token {
    use sui::coin::{Self, Coin, TreasuryCap};
    use sui::url;

    /// The GALACTIC token type
    public struct GALACTIC_TOKEN has drop {}

    /// Treasury capability for minting
    public struct GalacticTreasury has key {
        id: UID,
        cap: TreasuryCap<GALACTIC_TOKEN>,
        total_minted: u64,
        max_supply: u64,
    }

    /// Admin capability for protocol management
    public struct AdminCap has key, store {
        id: UID,
    }

    // ============ Constants ============
    
    /// Maximum supply: 1 billion tokens (with 9 decimals)
    const MAX_SUPPLY: u64 = 1_000_000_000_000_000_000;
    
    /// Initial mint for liquidity: 100 million tokens
    const INITIAL_MINT: u64 = 100_000_000_000_000_000;

    // ============ Errors ============
    
    const EExceedsMaxSupply: u64 = 0;
    const ENotAdmin: u64 = 1;
    const EInvalidAmount: u64 = 2;

    // ============ Events ============

    public struct TokenMinted has copy, drop {
        amount: u64,
        recipient: address,
    }

    public struct TokenBurned has copy, drop {
        amount: u64,
        burner: address,
    }

    // ============ Init ============

    /// Initialize the GALACTIC token
    fun init(witness: GALACTIC_TOKEN, ctx: &mut TxContext) {
        let (treasury_cap, metadata) = coin::create_currency(
            witness,
            9, // decimals
            b"GALACTIC",
            b"Galactic Credits",
            b"The native currency of the Sui-In-Space galactic empire. Used for energy, upgrades, trading, and governance.",
            option::some(url::new_unsafe_from_bytes(b"https://sui-in-space.io/galactic.png")),
            ctx
        );

        // Create treasury
        let treasury = GalacticTreasury {
            id: object::new(ctx),
            cap: treasury_cap,
            total_minted: 0,
            max_supply: MAX_SUPPLY,
        };

        // Create admin capability
        let admin_cap = AdminCap {
            id: object::new(ctx),
        };

        // Transfer admin cap to deployer
        transfer::transfer(admin_cap, tx_context::sender(ctx));
        
        // Share treasury for protocol access
        transfer::share_object(treasury);
        
        // Freeze metadata
        transfer::public_freeze_object(metadata);
    }

    // ============ Public Functions ============

    /// Mint new GALACTIC tokens (admin only via treasury)
    public fun mint(
        treasury: &mut GalacticTreasury,
        amount: u64,
        recipient: address,
        ctx: &mut TxContext
    ) {
        assert!(amount > 0, EInvalidAmount);
        assert!(treasury.total_minted + amount <= treasury.max_supply, EExceedsMaxSupply);

        let coin = coin::mint(&mut treasury.cap, amount, ctx);
        treasury.total_minted = treasury.total_minted + amount;

        sui::event::emit(TokenMinted {
            amount,
            recipient,
        });

        transfer::public_transfer(coin, recipient);
    }

    /// Burn GALACTIC tokens
    public fun burn(
        treasury: &mut GalacticTreasury,
        coin: Coin<GALACTIC_TOKEN>,
        ctx: &TxContext
    ) {
        let amount = coin::value(&coin);
        
        sui::event::emit(TokenBurned {
            amount,
            burner: tx_context::sender(ctx),
        });

        coin::burn(&mut treasury.cap, coin);
    }

    /// Get total minted supply
    public fun total_minted(treasury: &GalacticTreasury): u64 {
        treasury.total_minted
    }

    /// Get max supply
    public fun max_supply(treasury: &GalacticTreasury): u64 {
        treasury.max_supply
    }

    /// Get remaining mintable supply
    public fun remaining_supply(treasury: &GalacticTreasury): u64 {
        treasury.max_supply - treasury.total_minted
    }

    // ============ Test Functions ============

    #[test_only]
    public fun init_for_testing(ctx: &mut TxContext) {
        init(GALACTIC_TOKEN {}, ctx);
    }
}
