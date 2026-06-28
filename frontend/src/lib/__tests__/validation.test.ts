import { describe, it, expect } from 'vitest';
import {
  registerSchema, loginSchema, teamMemberSchema,
  organizationUpdateSchema, policyUpdateSchema,
  walletCreateSchema, approvalActionSchema, taskCreateSchema,
  vendorCreateSchema, apiServiceCreateSchema, apiUsageCreateSchema,
} from '../validation';

describe('registerSchema', () => {
  it('accepts valid registration', () => {
    const result = registerSchema.safeParse({ name: 'John', email: 'john@test.com', password: 'password123' });
    expect(result.success).toBe(true);
  });

  it('rejects missing email', () => {
    const result = registerSchema.safeParse({ name: 'John', password: 'password123' });
    expect(result.success).toBe(false);
  });

  it('rejects short password', () => {
    const result = registerSchema.safeParse({ name: 'John', email: 'john@test.com', password: 'short' });
    expect(result.success).toBe(false);
  });

  it('rejects invalid email', () => {
    const result = registerSchema.safeParse({ name: 'John', email: 'not-an-email', password: 'password123' });
    expect(result.success).toBe(false);
  });
});

describe('loginSchema', () => {
  it('accepts valid login', () => {
    const result = loginSchema.safeParse({ email: 'test@test.com', password: 'pass' });
    expect(result.success).toBe(true);
  });

  it('rejects empty password', () => {
    const result = loginSchema.safeParse({ email: 'test@test.com', password: '' });
    expect(result.success).toBe(false);
  });
});

describe('teamMemberSchema', () => {
  it('accepts valid member with role', () => {
    const result = teamMemberSchema.safeParse({ name: 'Jane', email: 'jane@test.com', password: 'securepass', role: 'ADMIN' });
    expect(result.success).toBe(true);
  });

  it('accepts member without role (optional)', () => {
    const result = teamMemberSchema.safeParse({ name: 'Jane', email: 'jane@test.com', password: 'securepass' });
    expect(result.success).toBe(true);
  });

  it('rejects invalid role', () => {
    const result = teamMemberSchema.safeParse({ name: 'Jane', email: 'jane@test.com', password: 'securepass', role: 'SUPERADMIN' });
    expect(result.success).toBe(false);
  });
});

describe('organizationUpdateSchema', () => {
  it('accepts partial updates', () => {
    const result = organizationUpdateSchema.safeParse({ name: 'New Corp' });
    expect(result.success).toBe(true);
  });

  it('accepts empty object', () => {
    const result = organizationUpdateSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('rejects name over 200 chars', () => {
    const result = organizationUpdateSchema.safeParse({ name: 'x'.repeat(201) });
    expect(result.success).toBe(false);
  });
});

describe('policyUpdateSchema', () => {
  it('accepts valid policy', () => {
    const result = policyUpdateSchema.safeParse({ autoApproveThreshold: 500, dailyLimit: 10 });
    expect(result.success).toBe(true);
  });

  it('rejects negative values', () => {
    const result = policyUpdateSchema.safeParse({ autoApproveThreshold: -1 });
    expect(result.success).toBe(false);
  });
});

describe('walletCreateSchema', () => {
  it('accepts valid wallet', () => {
    const result = walletCreateSchema.safeParse({
      label: 'Treasury',
      address: '0x933a2405f84c224be1ef373ba16e992e1f459682',
      type: 'TREASURY',
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid address format', () => {
    const result = walletCreateSchema.safeParse({ label: 'Test', address: 'not-an-address', type: 'AGENT' });
    expect(result.success).toBe(false);
  });

  it('rejects invalid wallet type', () => {
    const result = walletCreateSchema.safeParse({
      label: 'Test',
      address: '0x933a2405f84c224be1ef373ba16e992e1f459682',
      type: 'SAVINGS',
    });
    expect(result.success).toBe(false);
  });
});

describe('approvalActionSchema', () => {
  it('accepts approved', () => {
    expect(approvalActionSchema.safeParse({ status: 'approved' }).success).toBe(true);
  });

  it('accepts rejected', () => {
    expect(approvalActionSchema.safeParse({ status: 'rejected' }).success).toBe(true);
  });

  it('rejects invalid status', () => {
    expect(approvalActionSchema.safeParse({ status: 'pending' }).success).toBe(false);
  });
});

describe('taskCreateSchema', () => {
  it('accepts valid command', () => {
    expect(taskCreateSchema.safeParse({ command: 'run tests' }).success).toBe(true);
  });

  it('rejects empty command', () => {
    expect(taskCreateSchema.safeParse({ command: '' }).success).toBe(false);
  });

  it('rejects command over 1000 chars', () => {
    expect(taskCreateSchema.safeParse({ command: 'x'.repeat(1001) }).success).toBe(false);
  });
});

describe('vendorCreateSchema', () => {
  it('accepts valid vendor', () => {
    expect(vendorCreateSchema.safeParse({ name: 'OpenAI' }).success).toBe(true);
  });

  it('accepts vendor with all fields', () => {
    const result = vendorCreateSchema.safeParse({
      name: 'OpenAI',
      category: 'AI',
      website: 'https://openai.com',
      contactEmail: 'contact@openai.com',
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid website URL', () => {
    const result = vendorCreateSchema.safeParse({ name: 'Test', website: 'not-a-url' });
    expect(result.success).toBe(false);
  });
});

describe('apiServiceCreateSchema', () => {
  it('accepts valid service', () => {
    const result = apiServiceCreateSchema.safeParse({ name: 'GPT-4', provider: 'OpenAI' });
    expect(result.success).toBe(true);
  });

  it('accepts service with budget', () => {
    const result = apiServiceCreateSchema.safeParse({ name: 'GPT-4', provider: 'OpenAI', dailyBudget: 100 });
    expect(result.success).toBe(true);
  });

  it('rejects missing provider', () => {
    const result = apiServiceCreateSchema.safeParse({ name: 'GPT-4' });
    expect(result.success).toBe(false);
  });
});

describe('apiUsageCreateSchema', () => {
  it('accepts valid usage', () => {
    const result = apiUsageCreateSchema.safeParse({
      serviceId: 'svc_123',
      date: '2026-06-28',
      requests: 100,
      cost: 1.50,
    });
    expect(result.success).toBe(true);
  });

  it('rejects negative requests', () => {
    const result = apiUsageCreateSchema.safeParse({
      serviceId: 'svc_123',
      date: '2026-06-28',
      requests: -1,
      cost: 0,
    });
    expect(result.success).toBe(false);
  });
});
