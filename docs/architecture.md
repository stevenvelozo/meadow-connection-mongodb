# Architecture

## System Overview

The MongoDB connector bridges Meadow's data access abstraction with the official MongoDB Node.js driver. It follows the Fable service provider pattern, providing connection management, collection creation, and index generation.

```mermaid
graph TB
	subgraph Application Layer
		APP[Application Code]
		MEA[Meadow ORM]
		FH[FoxHound MongoDB Dialect]
	end
	subgraph Connection Layer
		MCP["meadow-connection-mongodb<br/>(MeadowConnectionMongoDB)"]
		MC[MongoClient]
		DB[Db Instance]
	end
	subgraph MongoDB Server
		MONGO[(MongoDB)]
	end
	APP --> MEA
	MEA --> FH
	FH --> MCP
	MCP --> MC
	MC --> DB
	DB --> MONGO
```

## Connection Lifecycle

```mermaid
sequenceDiagram
	participant App as Application
	participant Fable as Fable
	participant MCP as MeadowConnectionMongoDB
	participant MC as MongoClient
	participant Mongo as MongoDB Server

	App->>Fable: new libFable(settings)
	App->>Fable: addAndInstantiateServiceType()
	Fable->>MCP: constructor(fable, options)
	MCP->>MCP: Read MongoDB config
	MCP->>MCP: Normalize property names
	Note over MCP: Server->host, Port->port, etc.

	alt Auto-Connect Enabled
		MCP->>MCP: connect()
	end

	App->>MCP: connectAsync(callback)

	alt Already Connected
		MCP-->>App: callback(null, database)
	else Not Connected
		MCP->>MCP: _buildConnectionURI()
		MCP->>MC: new MongoClient(uri, options)
		MC->>Mongo: Establish Connection Pool
		MCP->>MC: client.db(database)
		MC-->>MCP: Db instance
		MCP->>MCP: connected = true
		MCP-->>App: callback(null, database)
	end
```

## Service Provider Model

`MeadowConnectionMongoDB` extends `fable-serviceproviderbase`, providing standard lifecycle integration with the Fable ecosystem.

```mermaid
classDiagram
	class FableServiceProviderBase {
		+fable
		+options
		+log
		+serviceType
	}
	class MeadowConnectionMongoDB {
		+serviceType: "MeadowConnectionMongoDB"
		+connected: boolean
		-_Client: MongoClient
		-_Database: Db
		+connect()
		+connectAsync(fCallback)
		+pool: Db
		+client: MongoClient
		+createTable(schema, fCallback)
		+createTables(schema, fCallback)
		+generateCreateTableStatement(schema)
		+generateDropTableStatement(name)
		-_buildConnectionURI()
	}
	FableServiceProviderBase <|-- MeadowConnectionMongoDB
```

## Settings Flow

```mermaid
flowchart LR
	subgraph Input Sources
		OPT[Constructor Options]
		SET[fable.settings.MongoDB]
	end
	subgraph Normalization
		NORM["Property Mapping<br/>Server -> host<br/>Port -> port<br/>User -> user<br/>Password -> password<br/>Database -> database<br/>ConnectionPoolLimit -> maxPoolSize"]
	end
	subgraph Output
		URI["Connection URI<br/>mongodb://[user:pass@]host:port/db"]
		POOL["Pool Config<br/>{ maxPoolSize: N }"]
	end
	OPT --> NORM
	SET --> NORM
	NORM --> URI
	NORM --> POOL
```

## Collection Creation Flow

```mermaid
flowchart TD
	A[createTable called] --> B[generateCreateTableStatement]
	B --> C{Connected?}
	C -->|No| ERR[Callback with error]
	C -->|Yes| D[db.createCollection]
	D --> E{Collection exists?}
	E -->|Created| F{Has indexes?}
	E -->|Error code 48| G[Log warning]
	G --> F
	F -->|Yes| H[collection.createIndexes]
	F -->|No| I[Callback success]
	H --> I
```

## Connection Safety

The connector includes several safety mechanisms:

```mermaid
flowchart TD
	A[connect called] --> B{Already connected?}
	B -->|Yes| C[Log error with masked password]
	C --> D[Return without action]
	B -->|No| E{mongodb driver available?}
	E -->|No| F[Log error]
	E -->|Yes| G[Build URI]
	G --> H[Create MongoClient]
	H --> I[Get Db instance]
	I --> J[Set connected = true]
```

Key safety features:

| Feature | Implementation |
|---------|---------------|
| Double-connect guard | Logs error and returns if `_Client` already exists |
| Password masking | Cleansed settings logged on double-connect attempt |
| Missing callback guard | `connectAsync()` provides a no-op callback if none given |
| Idempotent collections | Error code 48 (NamespaceExists) is handled gracefully |
| URL-encoded credentials | `encodeURIComponent()` used for user and password in URI |

## Connector Comparison

| Feature | MongoDB | MySQL | MSSQL | SQLite |
|---------|---------|-------|-------|--------|
| Driver | `mongodb` | `mysql2` | `mssql` | `better-sqlite3` |
| Connection | URI-based | Pool | Pool | File path |
| Schema | Collections + Indexes | SQL DDL | SQL DDL | SQL DDL |
| `pool` returns | `Db` instance | MySQL Pool | MSSQL Pool | SQLite Database |
| Async queries | Promise-based | Callback | Callback | Synchronous |
| Schema idempotent | Error code 48 handling | `IF NOT EXISTS` | `IF NOT EXISTS` | `IF NOT EXISTS` |
| Connection pool | Built into MongoClient | Configurable | Configurable | N/A (single file) |
