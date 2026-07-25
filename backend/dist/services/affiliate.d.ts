/**
 * Process referral and affiliate commission when a user performs an activity (SIGNUP, DEPOSIT, TICKET_PURCHASE).
 */
export declare function processAffiliateCommission({ referredUserId, type, amount, }: {
    referredUserId: string;
    type: 'SIGNUP' | 'DEPOSIT' | 'TICKET_PURCHASE';
    amount?: number;
}): Promise<void>;
//# sourceMappingURL=affiliate.d.ts.map