import { describe, it, expect } from 'vitest';
import { parseCommand } from '../command-parser';

describe('parseCommand', () => {
  describe('run_test', () => {
    it('parses "run tests"', () => {
      const result = parseCommand('run tests');
      expect(result.type).toBe('run_test');
    });

    it('parses "execute test"', () => {
      const result = parseCommand('execute test');
      expect(result.type).toBe('run_test');
    });
  });

  describe('check_status', () => {
    it('parses "check status"', () => {
      const result = parseCommand('check status');
      expect(result.type).toBe('check_status');
    });

    it('parses "show system status"', () => {
      const result = parseCommand('show system status');
      expect(result.type).toBe('check_status');
    });
  });

  describe('allocate_budget', () => {
    it('parses "allocate budget $10"', () => {
      const result = parseCommand('allocate budget $10');
      expect(result.type).toBe('allocate_budget');
      expect(result.params.amount).toBe('10');
    });

    it('parses "set budget to 50.5"', () => {
      const result = parseCommand('set budget to 50.5');
      expect(result.type).toBe('allocate_budget');
      expect(result.params.amount).toBe('50.5');
    });
  });

  describe('optimize_costs', () => {
    it('parses "optimize costs"', () => {
      const result = parseCommand('optimize costs');
      expect(result.type).toBe('optimize_costs');
    });

    it('parses "rebalance spending"', () => {
      const result = parseCommand('rebalance spending');
      expect(result.type).toBe('optimize_costs');
    });
  });

  describe('record_api_cost', () => {
    it('parses "insert today\'s OpenAI api cost $1.50"', () => {
      const result = parseCommand("insert today's OpenAI api cost $1.50");
      expect(result.type).toBe('record_api_cost');
      expect(result.params.provider).toBe('OpenAI');
      expect(result.params.cost).toBe('1.50');
    });

    it('parses "record Anthropic usage $0.25"', () => {
      const result = parseCommand('record Anthropic usage $0.25');
      expect(result.type).toBe('record_api_cost');
      expect(result.params.provider).toBe('Anthropic');
      expect(result.params.cost).toBe('0.25');
    });

    it('parses "log Google cost 3.00"', () => {
      const result = parseCommand('log Google cost 3.00');
      expect(result.type).toBe('record_api_cost');
      expect(result.params.provider).toBe('Google');
      expect(result.params.cost).toBe('3.00');
    });
  });

  describe('create_vendor', () => {
    it('parses "create vendor OpenAI"', () => {
      const result = parseCommand('create vendor OpenAI');
      expect(result.type).toBe('create_vendor');
      expect(result.params.name).toBe('OpenAI');
    });

    it('parses "add vendor Anthropic"', () => {
      const result = parseCommand('add vendor Anthropic');
      expect(result.type).toBe('create_vendor');
      expect(result.params.name).toBe('Anthropic');
    });
  });

  describe('create_api_service', () => {
    it('parses "create service GPT-4 on OpenAI"', () => {
      const result = parseCommand('create service GPT-4 on OpenAI');
      expect(result.type).toBe('create_api_service');
      expect(result.params.name).toBe('GPT-4');
      expect(result.params.provider).toBe('OpenAI');
    });

    it('parses "add api service Claude from Anthropic"', () => {
      const result = parseCommand('add api service Claude from Anthropic');
      expect(result.type).toBe('create_api_service');
      expect(result.params.name).toBe('Claude');
      expect(result.params.provider).toBe('Anthropic');
    });
  });

  describe('show_api_costs', () => {
    it('parses "show api costs"', () => {
      const result = parseCommand('show api costs');
      expect(result.type).toBe('show_api_costs');
      expect(result.params.days).toBe('30');
    });

    it('parses "list costs last 7 days"', () => {
      const result = parseCommand('list costs last 7 days');
      expect(result.type).toBe('show_api_costs');
      expect(result.params.days).toBe('7');
    });

    it('parses "get spend last 90 days"', () => {
      const result = parseCommand('get spend last 90 days');
      expect(result.type).toBe('show_api_costs');
      expect(result.params.days).toBe('90');
    });
  });

  describe('list commands', () => {
    it('parses "list agents"', () => {
      expect(parseCommand('list agents').type).toBe('list_agents');
    });

    it('parses "show vendors"', () => {
      expect(parseCommand('show vendors').type).toBe('list_vendors');
    });

    it('parses "get all services"', () => {
      expect(parseCommand('get all services').type).toBe('list_services');
    });

    it('parses "show wallets"', () => {
      expect(parseCommand('show wallets').type).toBe('list_wallets');
    });
  });

  describe('generate_report', () => {
    it('parses "generate report"', () => {
      const result = parseCommand('generate report');
      expect(result.type).toBe('generate_report');
    });

    it('parses "create report for Q3"', () => {
      const result = parseCommand('create report for Q3');
      expect(result.type).toBe('generate_report');
      expect(result.params.type).toBe('Q3');
    });
  });

  describe('general fallback', () => {
    it('falls back to general for unrecognized commands', () => {
      const result = parseCommand('do something random');
      expect(result.type).toBe('general');
      expect(result.raw).toBe('do something random');
    });

    it('preserves raw input', () => {
      const result = parseCommand('  hello world  ');
      expect(result.raw).toBe('hello world');
    });
  });
});
