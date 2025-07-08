# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Initial project structure and configuration
- NPM package configuration for publishing
- GitHub Actions workflow for automated releases

## [1.0.0] - 2024-01-01

### Added

- Initial release of MCP Portal da Transparência server
- Complete MCP server implementation with dynamic tool generation
- Integration with Portal da Transparência API
- Support for all API endpoints through MCP tools
- Authentication system with API key management
- Comprehensive error handling with user-friendly messages
- CLI executable for npx usage
- TypeScript support with full type definitions
- Unit and integration test coverage
- Documentation and setup guides
- Support for Claude Desktop, Cursor, and other MCP-compatible UIs

### Features

- Dynamic tool generation from Swagger specification
- Automatic parameter mapping and validation
- Tool categorization and organization
- Portuguese error messages and user guidance
- Environment variable configuration
- Logging system with configurable levels
- Performance optimizations and caching
- Rate limiting and retry mechanisms

### Security

- Secure API key handling
- Input validation and sanitization
- Error message sanitization to prevent information disclosure

[Unreleased]: https://github.com/dutradotdev/mcp-portal-transparencia/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/dutradotdev/mcp-portal-transparencia/releases/tag/v1.0.0
