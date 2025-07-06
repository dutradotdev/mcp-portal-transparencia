import mcpPortalTransparencia from "../../src/index";

describe("MCP Portal da Transparência", () => {
  test("should export the package information", () => {
    expect(mcpPortalTransparencia).toBeDefined();
    expect(mcpPortalTransparencia.name).toBe("mcp-portal-transparencia");
    expect(mcpPortalTransparencia.version).toBe("1.0.0");
    expect(mcpPortalTransparencia.description).toBe(
      "Multi-step Call Planner for Portal da Transparência API",
    );
  });

  test("package should have valid structure", () => {
    expect(typeof mcpPortalTransparencia).toBe("object");
    expect(typeof mcpPortalTransparencia.name).toBe("string");
    expect(typeof mcpPortalTransparencia.version).toBe("string");
    expect(typeof mcpPortalTransparencia.description).toBe("string");
  });
});
