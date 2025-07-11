export declare class MCPPortalServer {
    private server;
    private swaggerLoader;
    private auth;
    private logger;
    private tools;
    private spec;
    constructor();
    private setupHandlers;
    initialize(): Promise<void>;
    private generateMCPTools;
    private generateToolName;
    private createMCPTool;
    private mapOpenAPITypeToJSON;
    private executeApiCall;
    start(): Promise<void>;
}
//# sourceMappingURL=mcp-server.d.ts.map