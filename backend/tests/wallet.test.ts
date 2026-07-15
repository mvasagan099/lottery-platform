import { describe, it, expect, vi } from 'vitest'

// Mocking a simplified transaction processor
async function processTransaction(
  walletId: string, 
  amount: number, 
  type: 'CREDIT' | 'DEBIT',
  mockDb: any
) {
  const wallet = await mockDb.wallet.findUnique({ where: { id: walletId } });
  if (type === 'DEBIT' && wallet.balance < amount) {
    throw new Error('Insufficient balance');
  }

  const newBalance = type === 'CREDIT' ? wallet.balance + amount : wallet.balance - amount;
  
  await mockDb.wallet.update({
    where: { id: walletId },
    data: { balance: newBalance }
  });

  return newBalance;
}

describe('Wallet Transaction Engine', () => {
  it('should successfully debit if balance is sufficient', async () => {
    let balance = 100;
    const mockDb = {
      wallet: {
        findUnique: vi.fn().mockResolvedValue({ id: 'w1', balance }),
        update: vi.fn().mockImplementation((args) => {
          balance = args.data.balance;
          return { id: 'w1', balance };
        })
      }
    };

    const result = await processTransaction('w1', 20, 'DEBIT', mockDb);
    expect(result).toBe(80);
    expect(mockDb.wallet.update).toHaveBeenCalled();
  });

  it('should throw if balance is insufficient', async () => {
    const mockDb = {
      wallet: {
        findUnique: vi.fn().mockResolvedValue({ id: 'w1', balance: 10 }),
        update: vi.fn()
      }
    };

    await expect(processTransaction('w1', 20, 'DEBIT', mockDb))
      .rejects.toThrow('Insufficient balance');
    expect(mockDb.wallet.update).not.toHaveBeenCalled();
  });
})

