/// DeFi Module
/// Liquidity pools (Energy Reactors) and additional DeFi mechanics
module sui_in_space::defi {
    use sui::event;
    use sui::balance::{Self, Balance};
    use sui::coin::{Self, Coin};
    use sui::sui::SUI;
    use sui_in_space::galactic_token::GALACTIC_TOKEN;

    // ============ Structs ============

    /// Energy Reactor - Liquidity Pool for GALACTIC/SUI
    public struct EnergyReactor has key {
        id: UID,
        
        // Liquidity
        galactic_reserve: Balance<GALACTIC_TOKEN>,
        sui_reserve: Balance<SUI>,
        
        // LP tracking
        total_lp_shares: u64,
        
        // Fees
        swap_fee_bps: u64,      // Basis points (30 = 0.3%)
        protocol_fee_bps: u64,  // Protocol's share of fees
        
        // Accumulated fees
        accumulated_galactic_fees: u64,
        accumulated_sui_fees: u64,
        
        // State
        is_active: bool,
        total_swaps: u64,
        total_volume_galactic: u64,
        total_volume_sui: u64,
    }

    /// LP Token receipt for liquidity providers
    public struct LPReceipt has key, store {
        id: UID,
        reactor_id: ID,
        provider: address,
        lp_shares: u64,
        galactic_deposited: u64,
        sui_deposited: u64,
        deposited_at: u64,
    }

    /// Insurance Pool for PvP stakes
    public struct InsurancePool has key {
        id: UID,
        galactic_reserve: Balance<GALACTIC_TOKEN>,
        total_insured: u64,
        premium_rate_bps: u64,   // 200 = 2%
        payout_rate_bps: u64,    // 5000 = 50% recovery
        total_claims: u64,
        total_premiums: u64,
    }

    /// Insurance policy for PvP combat
    public struct InsurancePolicy has key, store {
        id: UID,
        holder: address,
        insured_amount: u64,
        premium_paid: u64,
        purchased_at: u64,
        expires_at: u64,
        used: bool,
    }

    /// Admin capability
    public struct DefiAdminCap has key, store {
        id: UID,
    }

    // ============ Constants ============

    const DEFAULT_SWAP_FEE: u64 = 30;        // 0.3%
    const DEFAULT_PROTOCOL_FEE: u64 = 5;    // 0.05% to protocol
    const MINIMUM_LIQUIDITY: u64 = 1000;
    const DEFAULT_PREMIUM_RATE: u64 = 200;  // 2%
    const DEFAULT_PAYOUT_RATE: u64 = 5000;  // 50%
    const INSURANCE_DURATION: u64 = 24;     // 24 epochs (hours)

    // ============ Errors ============

    const EReactorNotActive: u64 = 0;
    const EInsufficientLiquidity: u64 = 1;
    const EInsufficientOutput: u64 = 2;
    const EInvalidAmount: u64 = 3;
    const ESlippageExceeded: u64 = 4;
    const ENotLPHolder: u64 = 5;
    const EInsuranceExpired: u64 = 6;
    const EInsuranceAlreadyUsed: u64 = 7;
    const ENotPolicyHolder: u64 = 8;
    const ECooldownActive: u64 = 9;

    // ============ Events ============

    public struct ReactorCreated has copy, drop {
        reactor_id: ID,
    }

    public struct LiquidityAdded has copy, drop {
        reactor_id: ID,
        provider: address,
        galactic_amount: u64,
        sui_amount: u64,
        lp_shares: u64,
    }

    public struct LiquidityRemoved has copy, drop {
        reactor_id: ID,
        provider: address,
        galactic_amount: u64,
        sui_amount: u64,
        lp_shares: u64,
    }

    public struct Swapped has copy, drop {
        reactor_id: ID,
        trader: address,
        input_token: vector<u8>,
        input_amount: u64,
        output_amount: u64,
        fee_amount: u64,
    }

    public struct InsurancePurchased has copy, drop {
        policy_id: ID,
        holder: address,
        insured_amount: u64,
        premium: u64,
    }

    public struct InsuranceClaimed has copy, drop {
        policy_id: ID,
        holder: address,
        payout: u64,
    }

    // ============ Init ============

    fun init(ctx: &mut TxContext) {
        // Create admin cap
        let admin_cap = DefiAdminCap {
            id: object::new(ctx),
        };

        transfer::transfer(admin_cap, tx_context::sender(ctx));
    }

    // ============ Energy Reactor (LP) Functions ============

    /// Create a new Energy Reactor
    public fun create_reactor(
        _admin: &DefiAdminCap,
        ctx: &mut TxContext
    ): EnergyReactor {
        let reactor = EnergyReactor {
            id: object::new(ctx),
            galactic_reserve: balance::zero(),
            sui_reserve: balance::zero(),
            total_lp_shares: 0,
            swap_fee_bps: DEFAULT_SWAP_FEE,
            protocol_fee_bps: DEFAULT_PROTOCOL_FEE,
            accumulated_galactic_fees: 0,
            accumulated_sui_fees: 0,
            is_active: true,
            total_swaps: 0,
            total_volume_galactic: 0,
            total_volume_sui: 0,
        };

        event::emit(ReactorCreated {
            reactor_id: object::id(&reactor),
        });

        reactor
    }

    /// Add liquidity to reactor
    public fun add_liquidity(
        reactor: &mut EnergyReactor,
        galactic_coin: Coin<GALACTIC_TOKEN>,
        sui_coin: Coin<SUI>,
        current_epoch: u64,
        ctx: &mut TxContext
    ): LPReceipt {
        assert!(reactor.is_active, EReactorNotActive);

        let galactic_amount = coin::value(&galactic_coin);
        let sui_amount = coin::value(&sui_coin);
        
        assert!(galactic_amount > 0 && sui_amount > 0, EInvalidAmount);

        // Calculate LP shares
        let lp_shares = if (reactor.total_lp_shares == 0) {
            // Initial liquidity
            let initial_shares = (galactic_amount as u128) * (sui_amount as u128);
            (sqrt(initial_shares) as u64)
        } else {
            // Proportional to existing liquidity
            let galactic_reserve = balance::value(&reactor.galactic_reserve);
            let sui_reserve = balance::value(&reactor.sui_reserve);
            
            let galactic_share = (galactic_amount as u128) * (reactor.total_lp_shares as u128) / (galactic_reserve as u128);
            let sui_share = (sui_amount as u128) * (reactor.total_lp_shares as u128) / (sui_reserve as u128);
            
            // Take minimum to maintain ratio
            let shares = if (galactic_share < sui_share) { galactic_share } else { sui_share };
            (shares as u64)
        };

        assert!(lp_shares >= MINIMUM_LIQUIDITY, EInsufficientLiquidity);

        // Add to reserves
        balance::join(&mut reactor.galactic_reserve, coin::into_balance(galactic_coin));
        balance::join(&mut reactor.sui_reserve, coin::into_balance(sui_coin));
        reactor.total_lp_shares = reactor.total_lp_shares + lp_shares;

        // Create LP receipt
        let receipt = LPReceipt {
            id: object::new(ctx),
            reactor_id: object::id(reactor),
            provider: tx_context::sender(ctx),
            lp_shares,
            galactic_deposited: galactic_amount,
            sui_deposited: sui_amount,
            deposited_at: current_epoch,
        };

        event::emit(LiquidityAdded {
            reactor_id: object::id(reactor),
            provider: tx_context::sender(ctx),
            galactic_amount,
            sui_amount,
            lp_shares,
        });

        receipt
    }

    /// Remove liquidity from reactor
    public fun remove_liquidity(
        reactor: &mut EnergyReactor,
        receipt: LPReceipt,
        ctx: &mut TxContext
    ): (Coin<GALACTIC_TOKEN>, Coin<SUI>) {
        assert!(receipt.provider == tx_context::sender(ctx), ENotLPHolder);

        let lp_shares = receipt.lp_shares;
        
        // Calculate proportional withdrawal
        let galactic_reserve = balance::value(&reactor.galactic_reserve);
        let sui_reserve = balance::value(&reactor.sui_reserve);
        
        let galactic_amount = ((galactic_reserve as u128) * (lp_shares as u128) / (reactor.total_lp_shares as u128)) as u64;
        let sui_amount = ((sui_reserve as u128) * (lp_shares as u128) / (reactor.total_lp_shares as u128)) as u64;

        // Update state
        reactor.total_lp_shares = reactor.total_lp_shares - lp_shares;

        // Destroy receipt
        let LPReceipt { id, reactor_id: _, provider: _, lp_shares: _, galactic_deposited: _, sui_deposited: _, deposited_at: _ } = receipt;
        object::delete(id);

        // Withdraw from reserves
        let galactic_coin = coin::from_balance(
            balance::split(&mut reactor.galactic_reserve, galactic_amount),
            ctx
        );
        let sui_coin = coin::from_balance(
            balance::split(&mut reactor.sui_reserve, sui_amount),
            ctx
        );

        event::emit(LiquidityRemoved {
            reactor_id: object::id(reactor),
            provider: tx_context::sender(ctx),
            galactic_amount,
            sui_amount,
            lp_shares,
        });

        (galactic_coin, sui_coin)
    }

    /// Swap GALACTIC for SUI
    public fun swap_galactic_for_sui(
        reactor: &mut EnergyReactor,
        galactic_in: Coin<GALACTIC_TOKEN>,
        min_sui_out: u64,
        ctx: &mut TxContext
    ): Coin<SUI> {
        assert!(reactor.is_active, EReactorNotActive);
        
        let input_amount = coin::value(&galactic_in);
        assert!(input_amount > 0, EInvalidAmount);

        // Calculate output using constant product formula
        let galactic_reserve = balance::value(&reactor.galactic_reserve);
        let sui_reserve = balance::value(&reactor.sui_reserve);

        // Apply fee
        let fee_amount = (input_amount * reactor.swap_fee_bps) / 10000;
        let input_after_fee = input_amount - fee_amount;

        // x * y = k
        // (x + dx) * (y - dy) = k
        // dy = y * dx / (x + dx)
        let output_amount = (sui_reserve as u128) * (input_after_fee as u128) / 
            ((galactic_reserve as u128) + (input_after_fee as u128));
        let output_amount = (output_amount as u64);

        assert!(output_amount >= min_sui_out, ESlippageExceeded);
        assert!(output_amount < sui_reserve, EInsufficientLiquidity);

        // Update reserves
        balance::join(&mut reactor.galactic_reserve, coin::into_balance(galactic_in));
        let output_coin = coin::from_balance(
            balance::split(&mut reactor.sui_reserve, output_amount),
            ctx
        );

        // Track fees and stats
        reactor.accumulated_galactic_fees = reactor.accumulated_galactic_fees + fee_amount;
        reactor.total_swaps = reactor.total_swaps + 1;
        reactor.total_volume_galactic = reactor.total_volume_galactic + input_amount;

        event::emit(Swapped {
            reactor_id: object::id(reactor),
            trader: tx_context::sender(ctx),
            input_token: b"GALACTIC",
            input_amount,
            output_amount,
            fee_amount,
        });

        output_coin
    }

    /// Swap SUI for GALACTIC
    public fun swap_sui_for_galactic(
        reactor: &mut EnergyReactor,
        sui_in: Coin<SUI>,
        min_galactic_out: u64,
        ctx: &mut TxContext
    ): Coin<GALACTIC_TOKEN> {
        assert!(reactor.is_active, EReactorNotActive);
        
        let input_amount = coin::value(&sui_in);
        assert!(input_amount > 0, EInvalidAmount);

        let galactic_reserve = balance::value(&reactor.galactic_reserve);
        let sui_reserve = balance::value(&reactor.sui_reserve);

        // Apply fee
        let fee_amount = (input_amount * reactor.swap_fee_bps) / 10000;
        let input_after_fee = input_amount - fee_amount;

        let output_amount = (galactic_reserve as u128) * (input_after_fee as u128) / 
            ((sui_reserve as u128) + (input_after_fee as u128));
        let output_amount = (output_amount as u64);

        assert!(output_amount >= min_galactic_out, ESlippageExceeded);
        assert!(output_amount < galactic_reserve, EInsufficientLiquidity);

        // Update reserves
        balance::join(&mut reactor.sui_reserve, coin::into_balance(sui_in));
        let output_coin = coin::from_balance(
            balance::split(&mut reactor.galactic_reserve, output_amount),
            ctx
        );

        // Track fees and stats
        reactor.accumulated_sui_fees = reactor.accumulated_sui_fees + fee_amount;
        reactor.total_swaps = reactor.total_swaps + 1;
        reactor.total_volume_sui = reactor.total_volume_sui + input_amount;

        event::emit(Swapped {
            reactor_id: object::id(reactor),
            trader: tx_context::sender(ctx),
            input_token: b"SUI",
            input_amount,
            output_amount,
            fee_amount,
        });

        output_coin
    }

    // ============ Insurance Pool Functions ============

    /// Create insurance pool
    public fun create_insurance_pool(
        _admin: &DefiAdminCap,
        ctx: &mut TxContext
    ): InsurancePool {
        InsurancePool {
            id: object::new(ctx),
            galactic_reserve: balance::zero(),
            total_insured: 0,
            premium_rate_bps: DEFAULT_PREMIUM_RATE,
            payout_rate_bps: DEFAULT_PAYOUT_RATE,
            total_claims: 0,
            total_premiums: 0,
        }
    }

    /// Fund insurance pool
    public fun fund_insurance_pool(
        pool: &mut InsurancePool,
        payment: Coin<GALACTIC_TOKEN>,
    ) {
        let amount = coin::value(&payment);
        balance::join(&mut pool.galactic_reserve, coin::into_balance(payment));
        pool.total_insured = pool.total_insured + amount;
    }

    /// Purchase insurance policy
    public fun purchase_insurance(
        pool: &mut InsurancePool,
        premium_payment: Coin<GALACTIC_TOKEN>,
        insured_amount: u64,
        current_epoch: u64,
        ctx: &mut TxContext
    ): InsurancePolicy {
        let premium_required = (insured_amount * pool.premium_rate_bps) / 10000;
        let premium_paid = coin::value(&premium_payment);
        
        assert!(premium_paid >= premium_required, EInvalidAmount);

        // Add premium to pool
        balance::join(&mut pool.galactic_reserve, coin::into_balance(premium_payment));
        pool.total_premiums = pool.total_premiums + premium_paid;

        let policy = InsurancePolicy {
            id: object::new(ctx),
            holder: tx_context::sender(ctx),
            insured_amount,
            premium_paid,
            purchased_at: current_epoch,
            expires_at: current_epoch + INSURANCE_DURATION,
            used: false,
        };

        event::emit(InsurancePurchased {
            policy_id: object::id(&policy),
            holder: tx_context::sender(ctx),
            insured_amount,
            premium: premium_paid,
        });

        policy
    }

    /// Claim insurance payout
    public fun claim_insurance(
        pool: &mut InsurancePool,
        policy: &mut InsurancePolicy,
        current_epoch: u64,
        ctx: &mut TxContext
    ): Coin<GALACTIC_TOKEN> {
        assert!(policy.holder == tx_context::sender(ctx), ENotPolicyHolder);
        assert!(!policy.used, EInsuranceAlreadyUsed);
        assert!(current_epoch <= policy.expires_at, EInsuranceExpired);

        // Calculate payout
        let payout = (policy.insured_amount * pool.payout_rate_bps) / 10000;
        
        // Ensure pool has enough funds
        let available = balance::value(&pool.galactic_reserve);
        if (payout > available) {
            payout = available;
        };

        policy.used = true;
        pool.total_claims = pool.total_claims + 1;

        let payout_coin = coin::from_balance(
            balance::split(&mut pool.galactic_reserve, payout),
            ctx
        );

        event::emit(InsuranceClaimed {
            policy_id: object::id(policy),
            holder: tx_context::sender(ctx),
            payout,
        });

        payout_coin
    }

    // ============ View Functions ============

    public fun get_reactor_reserves(reactor: &EnergyReactor): (u64, u64) {
        (
            balance::value(&reactor.galactic_reserve),
            balance::value(&reactor.sui_reserve)
        )
    }

    public fun get_reactor_lp_shares(reactor: &EnergyReactor): u64 {
        reactor.total_lp_shares
    }

    public fun get_reactor_swap_fee(reactor: &EnergyReactor): u64 {
        reactor.swap_fee_bps
    }

    public fun get_reactor_stats(reactor: &EnergyReactor): (u64, u64, u64) {
        (reactor.total_swaps, reactor.total_volume_galactic, reactor.total_volume_sui)
    }

    public fun is_reactor_active(reactor: &EnergyReactor): bool {
        reactor.is_active
    }

    public fun get_lp_receipt_shares(receipt: &LPReceipt): u64 {
        receipt.lp_shares
    }

    public fun get_insurance_pool_balance(pool: &InsurancePool): u64 {
        balance::value(&pool.galactic_reserve)
    }

    public fun get_policy_holder(policy: &InsurancePolicy): address {
        policy.holder
    }

    public fun is_policy_valid(policy: &InsurancePolicy, current_epoch: u64): bool {
        !policy.used && current_epoch <= policy.expires_at
    }

    /// Calculate expected output for a swap (view function)
    public fun get_swap_quote(
        reactor: &EnergyReactor,
        input_amount: u64,
        is_galactic_input: bool
    ): u64 {
        let galactic_reserve = balance::value(&reactor.galactic_reserve);
        let sui_reserve = balance::value(&reactor.sui_reserve);

        let fee_amount = (input_amount * reactor.swap_fee_bps) / 10000;
        let input_after_fee = input_amount - fee_amount;

        if (is_galactic_input) {
            let output = (sui_reserve as u128) * (input_after_fee as u128) / 
                ((galactic_reserve as u128) + (input_after_fee as u128));
            (output as u64)
        } else {
            let output = (galactic_reserve as u128) * (input_after_fee as u128) / 
                ((sui_reserve as u128) + (input_after_fee as u128));
            (output as u64)
        }
    }

    // ============ Helper Functions ============

    /// Integer square root
    fun sqrt(x: u128): u128 {
        if (x == 0) {
            return 0
        };
        
        let mut z = (x + 1) / 2;
        let mut y = x;
        
        while (z < y) {
            y = z;
            z = (x / z + z) / 2;
        };
        
        y
    }

    // ============ Admin Functions ============

    /// Set reactor active state
    public fun set_reactor_active(
        _admin: &DefiAdminCap,
        reactor: &mut EnergyReactor,
        active: bool
    ) {
        reactor.is_active = active;
    }

    /// Update swap fee
    public fun update_swap_fee(
        _admin: &DefiAdminCap,
        reactor: &mut EnergyReactor,
        new_fee_bps: u64
    ) {
        reactor.swap_fee_bps = new_fee_bps;
    }

    /// Update insurance rates
    public fun update_insurance_rates(
        _admin: &DefiAdminCap,
        pool: &mut InsurancePool,
        premium_rate: u64,
        payout_rate: u64
    ) {
        pool.premium_rate_bps = premium_rate;
        pool.payout_rate_bps = payout_rate;
    }

    // ============ Test Functions ============

    #[test_only]
    public fun init_for_testing(ctx: &mut TxContext) {
        init(ctx);
    }
}
