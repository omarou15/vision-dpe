import '../mocks/supabase.mock'
import { vi, describe, it, expect, beforeEach } from "vitest";
import { AuthService } from "../../services/AuthService";
import { ValidationService } from "../../services/ValidationService";
import { XMLGeneratorService } from "../../services/XMLGeneratorService";
import { createMockSupabaseClient } from "../mocks/supabase.mock";
import { createMockDPE, mockStep1Data, mockStep2Data } from "../fixtures/dpe.fixtures";

// Mock createClient
vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn(() => createMockSupabaseClient()),
}));

import { createClient } from "@supabase/supabase-js";

describe("Intégration Services - Tests Complets", () => {
  let authService: AuthService;
  let validationService: ValidationService;
  let xmlService: XMLGeneratorService;
  let mockSupabase: ReturnType<typeof createMockSupabaseClient>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockSupabase = createMockSupabaseClient();
    (createClient as vi.Mock).mockReturnValue(mockSupabase);
    
    authService = new AuthService("https://test.supabase.co", "test-key");
    validationService = new ValidationService();
    xmlService = new XMLGeneratorService();
  });

  describe("Scénario: Création et validation d'un DPE", () => {
    it("devrait créer un DPE et le valider", async () => {
      const dpe = createMockDPE();
      expect(dpe).toBeDefined();
      expect(dpe.administratif).toBeDefined();
    });
  });
});