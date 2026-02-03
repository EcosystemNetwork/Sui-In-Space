/// Governance Module
/// DAO voting and proposal system for galactic governance
module sui_in_space::governance {
    use std::string::String;
    use sui::event;
    use sui::balance::{Self, Balance};
    use sui::coin::{Self, Coin};
    use sui::vec_map::{Self, VecMap};
    use sui_in_space::galactic_token::GALACTIC_TOKEN;

    // ============ Structs ============

    /// Governance registry (shared object)
    public struct GovernanceRegistry has key {
        id: UID,
        
        // Treasury
        treasury: Balance<GALACTIC_TOKEN>,
        
        // Proposal tracking
        proposal_count: u64,
        executed_proposals: u64,
        rejected_proposals: u64,
        
        // Configuration
        voting_period: u64,          // Epochs
        execution_delay: u64,        // Epochs after voting ends
        proposal_threshold: u64,     // Min tokens to create proposal
        quorum_threshold: u64,       // Percentage (e.g., 20 = 20%)
        
        // Active proposals
        active_proposal_ids: vector<ID>,
    }

    /// Proposal for governance action
    public struct Proposal has key, store {
        id: UID,
        proposal_id: u64,
        proposer: address,
        
        // Content
        title: String,
        description: String,
        proposal_type: u8,           // 0: Parameter, 1: Emission, 2: Feature, 3: War, 4: Upgrade
        
        // Target (for execution)
        target_module: String,
        target_function: String,
        parameters: vector<u64>,
        
        // Voting
        votes_for: u64,
        votes_against: u64,
        voters: VecMap<address, bool>,  // voter => support
        
        // Timing
        created_at: u64,
        voting_ends_at: u64,
        execution_after: u64,
        
        // State
        status: u8,                  // 0: Active, 1: Passed, 2: Rejected, 3: Executed, 4: Cancelled
    }

    /// Voting power receipt (for snapshot voting)
    public struct VotingPower has key, store {
        id: UID,
        owner: address,
        
        // Power sources
        token_power: u64,            // From GALACTIC holdings
        staked_power: u64,           // From staked tokens (1.5x)
        agent_power: u64,            // From agent levels
        territory_power: u64,        // From controlled planets
        
        total_power: u64,
        snapshot_epoch: u64,
    }

    /// Admin capability
    public struct GovernanceAdminCap has key, store {
        id: UID,
    }

    // ============ Constants ============

    // Proposal Types
    const TYPE_PARAMETER: u8 = 0;
    const TYPE_EMISSION: u8 = 1;
    const TYPE_FEATURE: u8 = 2;
    const TYPE_WAR: u8 = 3;
    const TYPE_UPGRADE: u8 = 4;

    // Proposal Status
    const STATUS_ACTIVE: u8 = 0;
    const STATUS_PASSED: u8 = 1;
    const STATUS_REJECTED: u8 = 2;
    const STATUS_EXECUTED: u8 = 3;
    const STATUS_CANCELLED: u8 = 4;

    // Default configuration
    const DEFAULT_VOTING_PERIOD: u64 = 72;        // 72 epochs (~3 days)
    const DEFAULT_EXECUTION_DELAY: u64 = 24;      // 24 epochs (~1 day)
    const DEFAULT_PROPOSAL_THRESHOLD: u64 = 1000_000_000_000; // 1000 GALACTIC (with 9 decimals)
    const DEFAULT_QUORUM_THRESHOLD: u64 = 10;     // 10%

    // Voting power multipliers
    const STAKED_MULTIPLIER: u64 = 150;           // 1.5x for staked
    const AGENT_POWER_PER_LEVEL: u64 = 10;
    const TERRITORY_POWER_PER_PLANET: u64 = 100;

    // Proposal costs by type (with 9 decimals)
    const COST_PARAMETER: u64 = 1000_000_000_000;     // 1,000 GALACTIC
    const COST_EMISSION: u64 = 10000_000_000_000;     // 10,000 GALACTIC
    const COST_FEATURE: u64 = 50000_000_000_000;      // 50,000 GALACTIC
    const COST_WAR: u64 = 100000_000_000_000;         // 100000 GALACTIC
    const COST_UPGRADE: u64 = 500000_000_000_000;     // 500000 GALACTIC

    // ============ Errors ============

    const EInsufficientVotingPower: u64 = 0;
    const EProposalNotActive: u64 = 1;
    const EVotingPeriodEnded: u64 = 2;
    const EVotingPeriodNotEnded: u64 = 3;
    const EAlreadyVoted: u64 = 4;
    const EQuorumNotReached: u64 = 5;
    const EProposalNotPassed: u64 = 6;
    const EExecutionDelayNotPassed: u64 = 7;
    const ENotProposer: u64 = 8;
    const EInvalidProposalType: u64 = 9;
    const EInsufficientTreasury: u64 = 10;

    // ============ Events ============

    public struct ProposalCreated has copy, drop {
        proposal_id: u64,
        proposer: address,
        title: String,
        proposal_type: u8,
    }

    public struct VoteCast has copy, drop {
        proposal_id: u64,
        voter: address,
        support: bool,
        voting_power: u64,
    }

    public struct ProposalFinalized has copy, drop {
        proposal_id: u64,
        passed: bool,
        votes_for: u64,
        votes_against: u64,
    }

    public struct ProposalExecuted has copy, drop {
        proposal_id: u64,
    }

    public struct ProposalCancelled has copy, drop {
        proposal_id: u64,
    }

    public struct TreasuryFunded has copy, drop {
        amount: u64,
        funder: address,
    }

    public struct TreasuryWithdrawn has copy, drop {
        amount: u64,
        recipient: address,
    }

    // ============ Init ============

    fun init(ctx: &mut TxContext) {
        let registry = GovernanceRegistry {
            id: object::new(ctx),
            treasury: balance::zero(),
            proposal_count: 0,
            executed_proposals: 0,
            rejected_proposals: 0,
            voting_period: DEFAULT_VOTING_PERIOD,
            execution_delay: DEFAULT_EXECUTION_DELAY,
            proposal_threshold: DEFAULT_PROPOSAL_THRESHOLD,
            quorum_threshold: DEFAULT_QUORUM_THRESHOLD,
            active_proposal_ids: vector::empty(),
        };

        let admin_cap = GovernanceAdminCap {
            id: object::new(ctx),
        };

        transfer::share_object(registry);
        transfer::transfer(admin_cap, tx_context::sender(ctx));
    }

    // ============ Public Functions ============

    /// Calculate and create voting power snapshot
    public fun create_voting_power(
        token_balance: u64,
        staked_balance: u64,
        total_agent_levels: u64,
        controlled_planets: u64,
        current_epoch: u64,
        ctx: &mut TxContext
    ): VotingPower {
        let token_power = token_balance;
        let staked_power = (staked_balance * STAKED_MULTIPLIER) / 100;
        let agent_power = total_agent_levels * AGENT_POWER_PER_LEVEL;
        let territory_power = controlled_planets * TERRITORY_POWER_PER_PLANET;
        
        let total_power = token_power + staked_power + agent_power + territory_power;

        VotingPower {
            id: object::new(ctx),
            owner: tx_context::sender(ctx),
            token_power,
            staked_power,
            agent_power,
            territory_power,
            total_power,
            snapshot_epoch: current_epoch,
        }
    }

    /// Create a new proposal
    public fun create_proposal(
        registry: &mut GovernanceRegistry,
        voting_power: &VotingPower,
        title: String,
        description: String,
        proposal_type: u8,
        target_module: String,
        target_function: String,
        parameters: vector<u64>,
        payment: Coin<GALACTIC_TOKEN>,
        current_epoch: u64,
        ctx: &mut TxContext
    ): Proposal {
        assert!(proposal_type <= TYPE_UPGRADE, EInvalidProposalType);
        
        // Check voting power threshold
        let required_power = registry.proposal_threshold;
        assert!(voting_power.total_power >= required_power, EInsufficientVotingPower);

        // Check payment
        let cost = get_proposal_cost(proposal_type);
        let payment_amount = coin::value(&payment);
        assert!(payment_amount >= cost, EInsufficientVotingPower);

        // Add payment to treasury
        balance::join(&mut registry.treasury, coin::into_balance(payment));

        // Increment proposal count
        registry.proposal_count = registry.proposal_count + 1;
        let proposal_id = registry.proposal_count;

        let proposal = Proposal {
            id: object::new(ctx),
            proposal_id,
            proposer: tx_context::sender(ctx),
            title,
            description,
            proposal_type,
            target_module,
            target_function,
            parameters,
            votes_for: 0,
            votes_against: 0,
            voters: vec_map::empty(),
            created_at: current_epoch,
            voting_ends_at: current_epoch + registry.voting_period,
            execution_after: current_epoch + registry.voting_period + registry.execution_delay,
            status: STATUS_ACTIVE,
        };

        // Track active proposal
        vector::push_back(&mut registry.active_proposal_ids, object::id(&proposal));

        event::emit(ProposalCreated {
            proposal_id,
            proposer: tx_context::sender(ctx),
            title: proposal.title,
            proposal_type,
        });

        proposal
    }

    /// Cast a vote on a proposal
    public fun cast_vote(
        proposal: &mut Proposal,
        voting_power: &VotingPower,
        support: bool,
        current_epoch: u64,
        ctx: &TxContext
    ) {
        assert!(proposal.status == STATUS_ACTIVE, EProposalNotActive);
        assert!(current_epoch < proposal.voting_ends_at, EVotingPeriodEnded);
        
        let voter = tx_context::sender(ctx);
        assert!(!vec_map::contains(&proposal.voters, &voter), EAlreadyVoted);

        let power = voting_power.total_power;

        if (support) {
            proposal.votes_for = proposal.votes_for + power;
        } else {
            proposal.votes_against = proposal.votes_against + power;
        };

        vec_map::insert(&mut proposal.voters, voter, support);

        event::emit(VoteCast {
            proposal_id: proposal.proposal_id,
            voter,
            support,
            voting_power: power,
        });
    }

    /// Finalize a proposal after voting period ends
    public fun finalize_proposal(
        registry: &mut GovernanceRegistry,
        proposal: &mut Proposal,
        total_supply: u64,
        current_epoch: u64,
    ) {
        assert!(proposal.status == STATUS_ACTIVE, EProposalNotActive);
        assert!(current_epoch >= proposal.voting_ends_at, EVotingPeriodNotEnded);

        let total_votes = proposal.votes_for + proposal.votes_against;
        let quorum_required = (total_supply * registry.quorum_threshold) / 100;
        
        let passed = total_votes >= quorum_required && 
                     proposal.votes_for > proposal.votes_against;

        if (passed) {
            proposal.status = STATUS_PASSED;
        } else {
            proposal.status = STATUS_REJECTED;
            registry.rejected_proposals = registry.rejected_proposals + 1;
        };

        // Remove from active proposals
        let (found, index) = vector::index_of(&registry.active_proposal_ids, &object::id(proposal));
        if (found) {
            vector::remove(&mut registry.active_proposal_ids, index);
        };

        event::emit(ProposalFinalized {
            proposal_id: proposal.proposal_id,
            passed,
            votes_for: proposal.votes_for,
            votes_against: proposal.votes_against,
        });
    }

    /// Execute a passed proposal
    public fun execute_proposal(
        registry: &mut GovernanceRegistry,
        proposal: &mut Proposal,
        current_epoch: u64,
    ) {
        assert!(proposal.status == STATUS_PASSED, EProposalNotPassed);
        assert!(current_epoch >= proposal.execution_after, EExecutionDelayNotPassed);

        proposal.status = STATUS_EXECUTED;
        registry.executed_proposals = registry.executed_proposals + 1;

        // Note: Actual execution logic would depend on the proposal type
        // In a full implementation, this would trigger parameter changes,
        // emissions adjustments, etc.

        event::emit(ProposalExecuted {
            proposal_id: proposal.proposal_id,
        });
    }

    /// Cancel a proposal (proposer only, before execution)
    public fun cancel_proposal(
        registry: &mut GovernanceRegistry,
        proposal: &mut Proposal,
        ctx: &TxContext
    ) {
        assert!(proposal.proposer == tx_context::sender(ctx), ENotProposer);
        assert!(proposal.status == STATUS_ACTIVE || proposal.status == STATUS_PASSED, EProposalNotActive);

        proposal.status = STATUS_CANCELLED;

        // Remove from active proposals if still active
        let (found, index) = vector::index_of(&registry.active_proposal_ids, &object::id(proposal));
        if (found) {
            vector::remove(&mut registry.active_proposal_ids, index);
        };

        event::emit(ProposalCancelled {
            proposal_id: proposal.proposal_id,
        });
    }

    /// Fund the DAO treasury
    public fun fund_treasury(
        registry: &mut GovernanceRegistry,
        payment: Coin<GALACTIC_TOKEN>,
        ctx: &TxContext
    ) {
        let amount = coin::value(&payment);
        balance::join(&mut registry.treasury, coin::into_balance(payment));

        event::emit(TreasuryFunded {
            amount,
            funder: tx_context::sender(ctx),
        });
    }

    /// Withdraw from treasury (admin only, for executed proposals)
    public fun withdraw_treasury(
        _admin: &GovernanceAdminCap,
        registry: &mut GovernanceRegistry,
        amount: u64,
        recipient: address,
        ctx: &mut TxContext
    ): Coin<GALACTIC_TOKEN> {
        let balance_amount = balance::value(&registry.treasury);
        assert!(amount <= balance_amount, EInsufficientTreasury);

        let withdrawn = coin::from_balance(
            balance::split(&mut registry.treasury, amount),
            ctx
        );

        event::emit(TreasuryWithdrawn {
            amount,
            recipient,
        });

        withdrawn
    }

    // ============ Admin Functions ============

    /// Update governance parameters
    public fun update_parameters(
        _admin: &GovernanceAdminCap,
        registry: &mut GovernanceRegistry,
        voting_period: u64,
        execution_delay: u64,
        proposal_threshold: u64,
        quorum_threshold: u64,
    ) {
        registry.voting_period = voting_period;
        registry.execution_delay = execution_delay;
        registry.proposal_threshold = proposal_threshold;
        registry.quorum_threshold = quorum_threshold;
    }

    // ============ View Functions ============

    public fun get_treasury_balance(registry: &GovernanceRegistry): u64 {
        balance::value(&registry.treasury)
    }

    public fun get_proposal_count(registry: &GovernanceRegistry): u64 {
        registry.proposal_count
    }

    public fun get_executed_count(registry: &GovernanceRegistry): u64 {
        registry.executed_proposals
    }

    public fun get_rejected_count(registry: &GovernanceRegistry): u64 {
        registry.rejected_proposals
    }

    public fun get_active_proposal_count(registry: &GovernanceRegistry): u64 {
        vector::length(&registry.active_proposal_ids)
    }

    public fun get_voting_period(registry: &GovernanceRegistry): u64 {
        registry.voting_period
    }

    public fun get_quorum_threshold(registry: &GovernanceRegistry): u64 {
        registry.quorum_threshold
    }

    public fun get_proposal_status(proposal: &Proposal): u8 {
        proposal.status
    }

    public fun get_proposal_votes(proposal: &Proposal): (u64, u64) {
        (proposal.votes_for, proposal.votes_against)
    }

    public fun get_proposal_timing(proposal: &Proposal): (u64, u64, u64) {
        (proposal.created_at, proposal.voting_ends_at, proposal.execution_after)
    }

    public fun has_voted(proposal: &Proposal, voter: address): bool {
        vec_map::contains(&proposal.voters, &voter)
    }

    public fun get_voting_power_total(power: &VotingPower): u64 {
        power.total_power
    }

    public fun get_voting_power_breakdown(power: &VotingPower): (u64, u64, u64, u64) {
        (power.token_power, power.staked_power, power.agent_power, power.territory_power)
    }

    // ============ Helper Functions ============

    /// Get proposal cost by type
    fun get_proposal_cost(proposal_type: u8): u64 {
        if (proposal_type == TYPE_PARAMETER) {
            COST_PARAMETER
        } else if (proposal_type == TYPE_EMISSION) {
            COST_EMISSION
        } else if (proposal_type == TYPE_FEATURE) {
            COST_FEATURE
        } else if (proposal_type == TYPE_WAR) {
            COST_WAR
        } else {
            COST_UPGRADE
        }
    }

    /// Destroy voting power (after use)
    public fun destroy_voting_power(power: VotingPower) {
        let VotingPower { 
            id, owner: _, token_power: _, staked_power: _,
            agent_power: _, territory_power: _, total_power: _,
            snapshot_epoch: _
        } = power;
        object::delete(id);
    }

    // ============ Test Functions ============

    #[test_only]
    public fun init_for_testing(ctx: &mut TxContext) {
        init(ctx);
    }
}
